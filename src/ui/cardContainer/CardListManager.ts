import { App, TFile, TFolder, TAbstractFile, Vault } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardListProvider, CardSetType, CardListProviderType } from 'common/types';
import { getSearchService } from 'ui/toolbar/search';
import { sortFiles } from 'common/utils';

/**
 * 카드 목록 관리자 클래스
 * 다양한 소스(폴더, 검색 등)에서 카드 목록을 가져오는 로직을 중앙화합니다.
 */
export class CardListManager {
    private app: App;
    private plugin: CardNavigatorPlugin;
    private providers: Map<CardListProviderType, CardListProvider> = new Map();
    private currentSearchTerm: string | null = null;
    private lastActiveFolder: string | null = null; // 마지막 활성 폴더 경로 저장

    constructor(plugin: CardNavigatorPlugin) {
        this.plugin = plugin;
        this.app = plugin.app;
        this.registerDefaultProviders();
        
        // 활성 파일 변경 이벤트 감지
        this.plugin.registerEvent(
            this.app.workspace.on('file-open', (file) => {
                if (this.plugin.settings.cardSetType === 'activeFolder') {
                    this.handleActiveFileChange(file);
                }
            })
        );
    }

    /**
     * 기본 카드 목록 제공자 등록
     */
    private registerDefaultProviders() {
        // 활성 폴더 제공자
        this.providers.set('activeFolder', {
            getCardList: async (app: App) => {
                const activeFile = app.workspace.getActiveFile();
                if (!activeFile?.parent) {
                    console.log('[CardListManager] 활성 파일이 없거나 부모 폴더가 없습니다.');
                    return [];
                }
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
     * 활성 파일 변경 처리
     * @param file 활성 파일
     */
    private handleActiveFileChange(file: TFile | null): void {
        if (!file) return;
        
        const currentFolder = file.parent?.path;
        
        // 활성 폴더가 변경된 경우에만 처리
        if (currentFolder && currentFolder !== this.lastActiveFolder) {
            console.log(`[CardListManager] 활성 폴더 변경: ${this.lastActiveFolder} -> ${currentFolder}`);
            this.lastActiveFolder = currentFolder;
            
            // 캐시 초기화
            this.clearCache();
            
            // 이벤트 발생 - 폴더 변경 알림
            this.plugin.events.trigger('active-folder-changed', currentFolder);
        }
    }

    /**
     * 캐시를 초기화합니다.
     */
    public clearCache(): void {
        console.log('[CardListManager] 캐시 초기화');
        // 검색 서비스 캐시 초기화
        const searchService = getSearchService(this.plugin);
        searchService.clearCache();
        
        // 현재 검색어 초기화
        this.currentSearchTerm = null;
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
        
        // activeFolder인 경우 활성 파일 확인
        if (cardSetType === 'activeFolder') {
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile?.parent) {
                console.log('[CardListManager] 활성 파일이 없거나 부모 폴더가 없습니다.');
                return [];
            }
            
            // 활성 폴더 경로 업데이트
            const currentFolder = activeFile.parent.path;
            if (this.lastActiveFolder !== currentFolder) {
                this.lastActiveFolder = currentFolder;
                console.log(`[CardListManager] getCardList에서 활성 폴더 업데이트: ${currentFolder}`);
            }
        }
        
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
                if (!activeFile) {
                    console.log('[CardListManager] 활성 파일이 없습니다.');
                    return null;
                }
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

        // 검색 대상 파일 결정
        let filesToSearch: TFile[];
        if (folder) {
            // 현재 폴더 내의 파일만 검색
            filesToSearch = this.getAllMarkdownFiles(folder);
        } else {
            // 전체 볼트 검색
            filesToSearch = this.plugin.app.vault.getMarkdownFiles();
        }
        
        // 검색 실행
        const filteredFiles = await searchService.searchFiles(filesToSearch, searchTerm);
        
        // 결과 캐싱
        searchService.addToCache(cacheKey, filteredFiles);
        return filteredFiles;
    }
    
    /**
     * 파일 목록을 현재 설정된 정렬 기준과 순서에 따라 정렬합니다.
     * @param files 정렬할 파일 목록
     * @returns 정렬된 파일 목록
     */
    private sortFiles(files: TFile[]): TFile[] {
        return sortFiles(files, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
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