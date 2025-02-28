import { App, TFile, TFolder, TAbstractFile, Vault } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardListProvider, CardSetType, CardListProviderType } from 'common/types';
import { getSearchService } from 'ui/toolbar/search';

/**
 * 카드 목록 관리자 클래스
 * 다양한 소스(폴더, 검색 등)에서 카드 목록을 가져오는 로직을 중앙화합니다.
 */
export class CardListManager {
    private app: App;
    private providers: Map<CardListProviderType, CardListProvider>;
    private currentSearchTerm: string | null = null;

    constructor(private plugin: CardNavigatorPlugin) {
        this.app = this.plugin.app;
        this.providers = new Map();

        // 기본 제공자 등록
        this.registerDefaultProviders();
    }

    /**
     * 기본 카드 목록 제공자 등록
     */
    private registerDefaultProviders() {
        // 활성 폴더 제공자
        this.providers.set('activeFolder', {
            getCardList: async (app: App) => {
                const activeFile = app.workspace.getActiveFile();
                if (!activeFile?.parent) return [];
                return this.getAllMarkdownFiles(activeFile.parent);
            },
            getName: () => '활성 폴더'
        });

        // 선택된 폴더 제공자
        this.providers.set('selectedFolder', {
            getCardList: async (app: App) => {
                if (!this.plugin.settings.selectedFolder) return [];
                const abstractFile = app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder);
                if (!(abstractFile instanceof TFolder)) return [];
                return this.getAllMarkdownFiles(abstractFile);
            },
            getName: () => '선택된 폴더'
        });

        // 볼트 전체 제공자
        this.providers.set('vault', {
            getCardList: async (app: App) => {
                return this.getAllMarkdownFiles(app.vault.getRoot());
            },
            getName: () => '볼트 전체'
        });

        // 검색 제공자
        this.providers.set('search', {
            getCardList: async (app: App, searchTerm?: string) => {
                if (!searchTerm) return [];
                return this.searchCards(searchTerm);
            },
            getName: () => '검색 결과'
        });
    }

    /**
     * 현재 설정된 카드 세트 타입에 따라 카드 목록을 가져옵니다.
     * 검색어가 제공되면 검색 결과를 반환합니다.
     * @param searchTerm 선택적 검색어
     * @returns 카드 목록(TFile 배열)
     */
    public async getCardList(searchTerm?: string): Promise<TFile[]> {
        // 검색어가 제공되면 검색 결과 반환
        if (searchTerm) {
            this.currentSearchTerm = searchTerm;
            return this.searchCards(searchTerm);
        }

        // 현재 저장된 검색어가 있으면 검색 결과 반환
        if (this.currentSearchTerm) {
            return this.searchCards(this.currentSearchTerm);
        }

        // 현재 설정된 카드 세트 타입에 따라 제공자 선택
        const cardSetType = this.plugin.settings.cardSetType;
        const provider = this.providers.get(cardSetType);
        
        if (!provider) {
            console.error(`카드 세트 타입 '${cardSetType}'에 대한 제공자를 찾을 수 없습니다.`);
            return [];
        }

        // 카드 목록 가져오기
        const files = await provider.getCardList(this.app);
        
        // 설정된 정렬 기준과 순서에 따라 파일 정렬
        return this.sortFiles(files);
    }

    /**
     * 현재 검색어 가져오기
     * @returns 현재 검색어 또는 null
     */
    public getCurrentSearchTerm(): string | null {
        return this.currentSearchTerm;
    }

    /**
     * 현재 검색어 설정
     * @param searchTerm 새 검색어 또는 null
     */
    public setCurrentSearchTerm(searchTerm: string | null): void {
        this.currentSearchTerm = searchTerm;
    }

    /**
     * 현재 설정에 따라 현재 폴더를 가져옵니다.
     * @returns 현재 폴더 또는 null
     */
    public async getCurrentFolder(): Promise<TFolder | null> {
        switch (this.plugin.settings.cardSetType) {
            case 'activeFolder':
                const activeFile = this.app.workspace.getActiveFile();
                return activeFile?.parent || null;
                
            case 'selectedFolder':
                if (this.plugin.settings.selectedFolder) {
                    const abstractFile = this.app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder);
                    return abstractFile instanceof TFolder ? abstractFile : null;
                }
                return null;
                
            case 'vault':
                return this.app.vault.getRoot();
                
            default:
                return null;
        }
    }

    /**
     * 폴더의 모든 마크다운 파일을 재귀적으로 가져옵니다.
     * @param folder 대상 폴더
     * @returns 마크다운 파일 배열
     */
    public getAllMarkdownFiles(folder: TFolder): TFile[] {
        const files: TFile[] = [];
        
        // Obsidian의 Vault.recurseChildren API 사용
        Vault.recurseChildren(folder, (file: TAbstractFile) => {
            if (file instanceof TFile && file.extension === 'md') {
                files.push(file);
            }
        });
        
        return files;
    }

    /**
     * 검색어를 기반으로 카드를 검색합니다.
     * @param searchTerm 검색어
     * @returns 검색 결과 파일 배열
     */
    private async searchCards(searchTerm: string): Promise<TFile[]> {
        const searchService = getSearchService(this.plugin);
        const folder = await this.getCurrentFolder();
        
        // 캐시 최적화 - folder가 null인 경우 대체 키 사용
        const cacheKey = folder ? `${folder.path}:${searchTerm}` : `root:${searchTerm}`;
        const cachedResults = searchService.getFromCache(cacheKey);
        
        if (cachedResults) {
            return cachedResults;
        }

        // 검색은 항상 볼트 전체를 대상으로 수행
        const filesToSearch = searchService.getAllMarkdownFiles(this.app.vault.getRoot());
        const filteredFiles = await searchService.searchFiles(filesToSearch, searchTerm);
        
        searchService.addToCache(cacheKey, filteredFiles);
        return filteredFiles;
    }
    
    /**
     * 파일 목록을 현재 설정된 정렬 기준과 순서에 따라 정렬합니다.
     * @param files 정렬할 파일 목록
     * @returns 정렬된 파일 목록
     */
    private sortFiles(files: TFile[]): TFile[] {
        const { sortCriterion, sortOrder } = this.plugin.settings;
        
        return files.sort((a, b) => {
            let comparison = 0;
            
            switch (sortCriterion) {
                case 'fileName':
                    comparison = a.basename.localeCompare(b.basename, undefined, { numeric: true, sensitivity: 'base' });
                    break;
                case 'lastModified':
                    comparison = a.stat.mtime - b.stat.mtime;
                    break;
                case 'created':
                    comparison = a.stat.ctime - b.stat.ctime;
                    break;
            }
            
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }

    /**
     * 지정된 폴더의 모든 마크다운 파일을 가져옵니다.
     * @param folder 대상 폴더
     * @returns 마크다운 파일 배열
     */
    public getFilesInFolder(folder: TFolder): TFile[] {
        if (!folder) {
            console.warn('[CardListManager] 폴더가 없습니다.');
            return [];
        }
        
        // 폴더의 모든 마크다운 파일 가져오기
        const files = this.getAllMarkdownFiles(folder);
        
        // 파일 정렬
        return this.sortFiles(files);
    }
} 