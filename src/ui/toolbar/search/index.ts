import { debounce, TFile } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { SearchHistory } from './SearchHistory';
import { SearchService } from './SearchService';
import { SearchSuggest } from './SearchSuggest';
import { CardContainer } from 'ui/cardContainer/cardContainer';
export * from 'common/types';

// 검색 상태 관리
const searchState = {
    isSearching: false,
    lastSearchTerm: '',
    searchHistory: [] as string[],
};

// 검색 서비스 인스턴스
let searchService: SearchService | null = null;

// 검색어 전처리
function preprocessSearchTerm(searchTerm: string): string {
    return searchTerm.trim();
}

// 검색어 유효성 검사
function isValidSearchTerm(searchTerm: string): boolean {
    return searchTerm.length > 0;
}

// 검색 상태 업데이트
function updateSearchState(searchTerm: string, isSearching: boolean) {
    searchState.lastSearchTerm = searchTerm;
    searchState.isSearching = isSearching;
    
    // 검색 기록에 추가 (중복 방지)
    if (searchTerm && !searchState.searchHistory.includes(searchTerm)) {
        searchState.searchHistory.unshift(searchTerm);
        // 최대 10개 항목 유지
        if (searchState.searchHistory.length > 10) {
            searchState.searchHistory.pop();
        }
    }
}

// 검색 기록에 추가
function addToSearchHistory(searchTerm: string): void {
    if (searchTerm && !searchState.searchHistory.includes(searchTerm)) {
        searchState.searchHistory.unshift(searchTerm);
        // 최대 10개 항목 유지
        if (searchState.searchHistory.length > 10) {
            searchState.searchHistory.pop();
        }
    }
}

// 로딩 상태 표시
function setLoadingState(containerEl: HTMLElement | null, isLoading: boolean): void;
function setLoadingState(isLoading: boolean): void;
function setLoadingState(containerElOrIsLoading: HTMLElement | null | boolean, isLoading?: boolean) {
    // 첫 번째 매개변수가 boolean인 경우 (단일 매개변수 호출)
    if (typeof containerElOrIsLoading === 'boolean') {
        // 이 경우 첫 번째 매개변수가 isLoading 값입니다.
        // 이 함수 오버로드는 실제로 아무 작업도 수행하지 않습니다.
        return;
    }
    
    // 첫 번째 매개변수가 HTMLElement인 경우 (두 매개변수 호출)
    const containerEl = containerElOrIsLoading;
    if (!containerEl) return;
    const searchContainer = containerEl.querySelector('.card-navigator-search-container');
    if (!searchContainer) return;
    searchContainer.toggleClass('is-searching', isLoading as boolean);
}

/**
 * 검색 기능을 실행합니다.
 * @param plugin 플러그인 인스턴스
 * @param searchTerm 검색어
 * @param cardContainer 카드 컨테이너
 */
export async function executeSearch(plugin: CardNavigatorPlugin, searchTerm: string, cardContainer: any): Promise<void> {
    if (!searchTerm || searchTerm.trim() === '') {
        cardContainer.loadFiles();
        return;
    }

    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    const files = plugin.app.vault.getMarkdownFiles();
    
    try {
        // 파일 이름과 내용을 모두 검색하여 필터링
        const filePromises = files.map(async (file) => {
            // 파일 이름 검색
            if (file.basename.toLowerCase().includes(normalizedSearchTerm)) {
                return file;
            }
            
            // 파일 내용 검색
            try {
                const content = await plugin.app.vault.read(file);
                if (content.toLowerCase().includes(normalizedSearchTerm)) {
                    return file;
                }
            } catch (error) {
                console.error(`파일 읽기 오류 (${file.path}):`, error);
            }
            
            return null;
        });
        
        // 모든 비동기 작업이 완료될 때까지 대기
        const filteredFiles = await Promise.all(filePromises);
        
        // null 값 제거하여 유효한 파일만 선택
        const validFiles = filteredFiles.filter((file): file is TFile => file !== null);
        
        // 검색 결과 설정
        cardContainer.setSearchResults(validFiles);
    } catch (error) {
        console.error('검색 중 오류 발생:', error);
        cardContainer.loadFiles(); // 오류 발생 시 모든 파일 로드
    }
}

/**
 * 디바운스된 검색 함수를 생성합니다.
 * @param plugin 플러그인 인스턴스
 * @param cardContainer 카드 컨테이너
 * @returns 디바운스된 검색 함수
 */
export function createDebouncedSearch(plugin: CardNavigatorPlugin, cardContainer: any): (searchTerm: string) => void {
    return debounce(
        (searchTerm: string) => {
            executeSearch(plugin, searchTerm, cardContainer);
        },
        300,
        true
    );
}

// 검색 기록 가져오기
export function getSearchHistory(): string[] {
    return [...searchState.searchHistory];
}

// 검색 기록 초기화
export function clearSearchHistory(): void {
    searchState.searchHistory = [];
}

// 검색 서비스 가져오기
export function getSearchService(plugin: CardNavigatorPlugin): SearchService {
    if (!searchService) {
        searchService = new SearchService(plugin);
    }
    return searchService;
}

export { SearchHistory, SearchService, SearchSuggest }; 