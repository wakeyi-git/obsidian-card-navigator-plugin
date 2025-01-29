import { debounce, TFile, TFolder, App, CachedMetadata } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardNavigatorView, RefreshType } from 'ui/cardNavigatorView';
import { t } from 'i18next';

// 검색 관련 상수
const SEARCH_DEBOUNCE_DELAY = 300;
const MIN_SEARCH_TERM_LENGTH = 2;
const MAX_SEARCH_HISTORY = 10;
const BATCH_SIZE = 20;

// 검색 옵션 인터페이스
export interface SearchOptions {
    searchInTitle?: boolean;      // 제목 검색
    searchInHeaders?: boolean;    // 헤더 검색
    searchInTags?: boolean;       // 태그 검색
    searchInContent?: boolean;    // 내용 검색
    searchInFrontmatter?: boolean; // 프론트매터 검색
    caseSensitive?: boolean;      // 대소문자 구분
    useRegex?: boolean;           // 정규식 사용
}

// 기본 검색 옵션
const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
    searchInTitle: true,
    searchInHeaders: true,
    searchInTags: true,
    searchInContent: true,
    searchInFrontmatter: true,
    caseSensitive: false,
    useRegex: false,
};

// 검색 결과 인터페이스
export interface SearchResult {
    file: TFile;
    matches: {
        type: 'title' | 'header' | 'tag' | 'content' | 'frontmatter';
        text: string;
        position?: number;
    }[];
}

// 검색 서비스 클래스
export class SearchService {
    private app: App;
    private options: SearchOptions;
    private searchPrefix: string = '';

    constructor(private plugin: CardNavigatorPlugin) {
        this.app = this.plugin.app;
        this.options = DEFAULT_SEARCH_OPTIONS;
    }

    // 검색 옵션 설정
    setOptions(options: Partial<SearchOptions>) {
        this.options = { ...this.options, ...options };
    }

    // 검색 옵션 가져오기
    getOption<K extends keyof SearchOptions>(key: K): SearchOptions[K] {
        return this.options[key];
    }

    // 파일 검색 메서드
    async searchFiles(files: TFile[], searchTerm: string): Promise<TFile[]> {
        if (!searchTerm) return files;

        let filteredFiles = files;
        const terms = this.parseSearchTerms(searchTerm);

        for (const {prefix, value} of terms) {
            switch (prefix) {
                case 'path':
                    filteredFiles = filteredFiles.filter(file => 
                        this.createSearchPattern(value).test(file.path));
                    break;
                case 'file':
                    filteredFiles = filteredFiles.filter(file => 
                        this.createSearchPattern(value).test(file.basename));
                    break;
                case 'tag':
                    // value에서 #을 제거하고 검색
                    const tagValue = value.startsWith('#') ? value.slice(1) : value;
                    filteredFiles = await this.searchByTag(filteredFiles, tagValue);
                    break;
                case 'property':
                    filteredFiles = await this.searchByProperty(filteredFiles, value);
                    break;
                default:
                    // prefix가 없는 경우 일반 검색
                    filteredFiles = await this.performGeneralSearch(filteredFiles, value);
            }

            if (filteredFiles.length === 0) break;
        }

        return filteredFiles;
    }

    // 검색어 파싱
    private parseSearchTerms(searchTerm: string): Array<{prefix: string, value: string}> {
        const terms: Array<{prefix: string, value: string}> = [];
        let currentTerm = '';
        let inQuotes = false;
        
        for (let i = 0; i < searchTerm.length; i++) {
            const char = searchTerm[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }
            
            if (char === ' ' && !inQuotes) {
                if (currentTerm) {
                    terms.push(this.parseSingleTerm(currentTerm));
                    currentTerm = '';
                }
            } else {
                currentTerm += char;
            }
        }
        
        if (currentTerm) {
            terms.push(this.parseSingleTerm(currentTerm));
        }
        
        return terms;
    }

    // 단일 검색어 파싱
    private parseSingleTerm(term: string): {prefix: string, value: string} {
        const colonIndex = term.indexOf(':');
        
        if (colonIndex === -1) {
            return { prefix: '', value: term };
        }
        
        const prefix = term.substring(0, colonIndex).toLowerCase();
        const value = term.substring(colonIndex + 1);
        
        return { prefix, value };
    }

    // 단일 필터 적용
    private async applyFilter(files: TFile[], prefix: string, searchValue: string): Promise<TFile[]> {
        // prefix가 있고 검색어가 있는 경우 해당하는 필터 적용
        if (prefix && searchValue) {
            switch (prefix.toLowerCase()) {
                case 'file':
                    return this.searchByFilename(files, searchValue);
                case 'path':
                    return this.searchByPath(files, searchValue);
                case 'tag':
                    return await this.searchByTag(files, searchValue);
                case 'section':
                    return await this.searchBySection(files, searchValue);
                case 'line':
                    return await this.searchByLine(files, searchValue);
                case 'property':
                    return await this.searchByProperty(files, searchValue);
                default:
                    // 알 수 없는 prefix는 일반 검색으로 처리
                    return await this.performGeneralSearch(files, prefix + ':' + searchValue);
            }
        }
        
        // prefix가 없는 경우 일반 검색 수행
        return await this.performGeneralSearch(files, prefix);
    }

    // 일반 검색 수행
    private async performGeneralSearch(files: TFile[], searchTerm: string): Promise<TFile[]> {
        const pattern = this.createSearchPattern(searchTerm);
        const results = [];
        
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map(file => this.searchInFile(file, pattern))
            );
            results.push(...batchResults.filter((file): file is TFile => file !== null));
        }
        
        return results;
    }

    // 파일명으로 검색
    private searchByFilename(files: TFile[], term: string): TFile[] {
        const pattern = this.createSearchPattern(term);
        return files.filter(file => 
            pattern.test(file.basename) || pattern.test(file.name));
    }

    // 경로로 검색
    private searchByPath(files: TFile[], term: string): TFile[] {
        const pattern = this.createSearchPattern(term);
        return files.filter(file => pattern.test(file.path));
    }

    // 태그로 검색
    private async searchByTag(files: TFile[], term: string): Promise<TFile[]> {
        const pattern = this.createSearchPattern(term);
        const results: TFile[] = [];
        
        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache) continue;

            // 본문의 #태그 검색
            const hasInlineTag = cache.tags?.some(tag => pattern.test(tag.tag));
            
            // frontmatter의 tags 검색
            let hasFrontmatterTag = false;
            if (cache.frontmatter?.tags) {
                const tags = Array.isArray(cache.frontmatter.tags) 
                    ? cache.frontmatter.tags 
                    : [cache.frontmatter.tags];
                
                hasFrontmatterTag = tags.some(tag => pattern.test(String(tag)));
            }

            if (hasInlineTag || hasFrontmatterTag) {
                results.push(file);
            }
        }
        
        return results;
    }

    // 섹션(헤더)로 검색
    private async searchBySection(files: TFile[], term: string): Promise<TFile[]> {
        const pattern = this.createSearchPattern(term);
        const results: TFile[] = [];
        
        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (cache?.headings?.some(heading => pattern.test(heading.heading))) {
                results.push(file);
            }
        }
        
        return results;
    }

    // 라인 내용으로 검색
    private async searchByLine(files: TFile[], term: string): Promise<TFile[]> {
        const pattern = this.createSearchPattern(term);
        const results: TFile[] = [];
        
        for (const file of files) {
            const content = await this.app.vault.cachedRead(file);
            if (content.split('\n').some(line => pattern.test(line))) {
                results.push(file);
            }
        }
        
        return results;
    }

    // 프로퍼티(frontmatter)로 검색
    private async searchByProperty(files: TFile[], term: string): Promise<TFile[]> {
        // property:key:value 형식 처리
        const [key, ...valueParts] = term.split(':');
        const value = valueParts.join(':');
        const pattern = this.createSearchPattern(value || key);
        const results: TFile[] = [];
        
        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache?.frontmatter) continue;

            // 특정 키가 지정된 경우
            if (value) {
                const propertyValue = cache.frontmatter[key];
                if (propertyValue !== undefined) {
                    // 배열인 경우 각 요소를 검사
                    if (Array.isArray(propertyValue)) {
                        if (propertyValue.some(v => pattern.test(String(v)))) {
                            results.push(file);
                        }
                    } else {
                        // 단일 값인 경우
                        if (pattern.test(String(propertyValue))) {
                            results.push(file);
                        }
                    }
                }
            } else {
                // 키가 지정되지 않은 경우 모든 값을 검색
                if (Object.values(cache.frontmatter).some(value => 
                    pattern.test(String(value)))) {
                    results.push(file);
                }
            }
        }
        
        return results;
    }

    // 검색 패턴 생성
    private createSearchPattern(searchTerm: string): RegExp {
        if (this.options.useRegex) {
            try {
                return new RegExp(searchTerm, this.options.caseSensitive ? 'g' : 'gi');
            } catch (error) {
                console.error('Invalid regex pattern:', error);
                return new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
                    this.options.caseSensitive ? 'g' : 'gi');
            }
        }
        return new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
            this.options.caseSensitive ? 'g' : 'gi');
    }

    // 파일 내 검색
    private async searchInFile(file: TFile, searchPattern: RegExp): Promise<TFile | null> {
        try {
            const cache = this.app.metadataCache.getFileCache(file);
            
            // 제목 검색
            if (this.options.searchInTitle && 
                (this.searchInTitle(file.basename, searchPattern) || 
                 this.searchInTitle(file.name, searchPattern))) {
                return file;
            }

            if (cache) {
                // 헤더 검색
                if (this.options.searchInHeaders && 
                    this.searchInHeaders(cache, searchPattern)) {
                    return file;
                }

                // 태그 검색
                if (this.options.searchInTags && 
                    this.searchInTags(cache, searchPattern)) {
                    return file;
                }

                // 프론트매터 검색
                if (this.options.searchInFrontmatter && 
                    this.searchInFrontmatter(cache, searchPattern)) {
                    return file;
                }
            }

            // 내용 검색
            if (this.options.searchInContent) {
                const content = await this.plugin.app.vault.cachedRead(file);
                if (searchPattern.test(content)) {
                    return file;
                }
            }
        } catch (error) {
            console.error(`파일 검색 실패: ${file.path}`, error);
        }
        return null;
    }

    // 제목 검색
    private searchInTitle(title: string, pattern: RegExp): boolean {
        return pattern.test(title);
    }

    // 헤더 검색
    private searchInHeaders(cache: CachedMetadata, pattern: RegExp): boolean {
        return cache.headings?.some(h => pattern.test(h.heading)) ?? false;
    }

    // 태그 검색
    private searchInTags(cache: CachedMetadata, pattern: RegExp): boolean {
        return cache.tags?.some(tag => pattern.test(tag.tag)) ?? false;
    }

    // 프론트매터 검색
    private searchInFrontmatter(cache: CachedMetadata, pattern: RegExp): boolean {
        if (!cache.frontmatter) return false;
        return Object.values(cache.frontmatter).some(value => 
            pattern.test(String(value)));
    }

    // 전체 볼트에서 파일 가져오기
    getAllMarkdownFiles(folder: TFolder): TFile[] {
        const files: TFile[] = [];
        
        folder.children.forEach(child => {
            if (child instanceof TFile && child.extension === 'md') {
                files.push(child);
            } else if (child instanceof TFolder) {
                files.push(...this.getAllMarkdownFiles(child));
            }
        });
        
        return files;
    }
}

// 검색 히스토리 관리 클래스
export class SearchHistory {
    private history: string[] = [];
    private maxSize: number;

    constructor(maxSize: number = MAX_SEARCH_HISTORY) {
        this.maxSize = maxSize;
    }

    add(term: string) {
        if (!term) return;
        this.history = this.history.filter(item => item !== term);
        this.history.unshift(term);
        if (this.history.length > this.maxSize) {
            this.history.pop();
        }
    }

    get recent(): string[] {
        return [...this.history];
    }

    clear() {
        this.history = [];
    }
}

// 검색 상태 인터페이스
interface SearchState {
    isSearching: boolean;
    lastSearchTerm: string;
    searchHistory: SearchHistory;
    searchService: SearchService;
}

// 초기 검색 상태
const searchState: SearchState = {
    isSearching: false,
    lastSearchTerm: '',
    searchHistory: new SearchHistory(),
    searchService: null as any
};

// 검색어 전처리
function preprocessSearchTerm(term: string): string {
    return term.trim();
}

// 검색어 유효성 검사
function isValidSearchTerm(term: string): boolean {
    const processed = preprocessSearchTerm(term);
    return processed.length >= MIN_SEARCH_TERM_LENGTH;
}

// 검색 상태 업데이트
function updateSearchState(searching: boolean, term: string = '') {
    searchState.isSearching = searching;
    if (term) {
        searchState.lastSearchTerm = term;
        searchState.searchHistory.add(term);
    }
}

// 로딩 상태 표시
function updateLoadingState(containerEl: HTMLElement | null, isLoading: boolean) {
    if (!containerEl) return;
    const searchContainer = containerEl.querySelector('.card-navigator-search-container');
    if (!searchContainer) return;
    searchContainer.toggleClass('is-searching', isLoading);
}

// 검색 실행
export async function executeSearch(
    plugin: CardNavigatorPlugin,
    containerEl: HTMLElement | null,
    searchTerm: string
) {
    if (!containerEl) return;

    const processed = preprocessSearchTerm(searchTerm);
    
    if (!processed) {
        const view = plugin.app.workspace.getActiveViewOfType(CardNavigatorView);
        if (view) {
            updateSearchState(false);
            updateLoadingState(containerEl, false);
            await view.refresh(RefreshType.CONTENT);
        }
        return;
    }

    if (!isValidSearchTerm(processed)) {
        return;
    }

    if (processed === searchState.lastSearchTerm) {
        return;
    }

    try {
        updateSearchState(true, processed);
        updateLoadingState(containerEl, true);

        const view = plugin.app.workspace.getActiveViewOfType(CardNavigatorView);
        if (view) {
            if (!searchState.searchService) {
                searchState.searchService = new SearchService(plugin);
            }
            await view.cardContainer.searchCards(processed);
        }
    } catch (error) {
        console.error('Search failed:', error);
    } finally {
        updateSearchState(false);
        updateLoadingState(containerEl, false);
    }
}

// 디바운스된 검색 함수
export const debouncedSearch = debounce(
    (searchTerm: string, plugin: CardNavigatorPlugin, containerEl: HTMLElement) => {
        executeSearch(plugin, containerEl, searchTerm);
    },
    SEARCH_DEBOUNCE_DELAY
);

// 검색 히스토리 가져오기
export function getSearchHistory(): string[] {
    return searchState.searchHistory.recent;
}

// 검색 히스토리 지우기
export function clearSearchHistory() {
    searchState.searchHistory.clear();
}

// 검색 서비스 가져오기
export function getSearchService(plugin: CardNavigatorPlugin): SearchService {
    if (!searchState.searchService) {
        searchState.searchService = new SearchService(plugin);
    }
    return searchState.searchService;
}

// 검색 컨테이너 생성
export function createSearchContainer(plugin: CardNavigatorPlugin, containerEl: HTMLElement | null): HTMLElement {
    const container = createDiv('card-navigator-search-container');

    const input = container.createEl('input', {
        type: 'text',
        placeholder: t('SEARCH_PLACEHOLDER'),
        cls: 'card-navigator-search-input'
    });

    const spinner = container.createDiv('search-spinner');
    spinner.hide();

    input.addEventListener('input', (e: Event) => {
        const searchTerm = (e.target as HTMLInputElement).value;
        if (containerEl) {
            debouncedSearch(searchTerm, plugin, containerEl);
        }
    });

    input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            input.value = '';
            if (containerEl) {
                debouncedSearch('', plugin, containerEl);
            }
        }
    });

    // 검색 옵션 추가 메서드
    (container as any).addSearchOption = (option: string) => {
        const currentValue = input.value;
        const cursorPosition = input.selectionStart || input.value.length;
        
        // 현재 커서 위치 또는 끝에 옵션 추가
        const beforeCursor = currentValue.substring(0, cursorPosition);
        const afterCursor = currentValue.substring(cursorPosition);
        
        // 현재 위치가 비어있지 않고 공백으로 끝나지 않으면 공백 추가
        const space = beforeCursor && !beforeCursor.endsWith(' ') ? ' ' : '';
        
        input.value = beforeCursor + space + option + afterCursor;
        
        // 커서를 추가된 옵션 뒤로 이동
        const newPosition = cursorPosition + space.length + option.length;
        input.setSelectionRange(newPosition, newPosition);
        
        // 검색 실행
        if (containerEl) {
            debouncedSearch(input.value, plugin, containerEl);
        }
        
        // 입력에 포커스
        input.focus();
    };

    return container;
}

