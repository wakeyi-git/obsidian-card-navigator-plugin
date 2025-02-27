import { debounce } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardNavigatorView, RefreshType } from 'ui/cardNavigatorView';
import { SearchHistory } from './SearchHistory';
import { SearchService } from './SearchService';
import { SearchSuggest } from './SearchSuggest';
import { MIN_SEARCH_TERM_LENGTH, SEARCH_DEBOUNCE_DELAY } from 'common/types';
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

// 로딩 상태 표시
function updateLoadingState(containerEl: HTMLElement | null, isLoading: boolean) {
    if (!containerEl) return;
    const searchContainer = containerEl.querySelector('.card-navigator-search-container');
    if (!searchContainer) return;
    searchContainer.toggleClass('is-searching', isLoading);
}

// 검색 실행 함수
export async function executeSearch(
    cardContainer: CardContainer,
    searchTerm: string,
    updateLoadingState?: (isLoading: boolean) => void
) {
    try {
        // 로딩 상태 업데이트
        if (updateLoadingState) {
            updateLoadingState(true);
        }
        
        // 검색어 전처리
        const processedTerm = preprocessSearchTerm(searchTerm);
        
        // 검색 상태 업데이트
        updateSearchState(processedTerm, true);
        
        // 검색 실행
        await cardContainer.searchCards(processedTerm);
        
        // 검색 완료 상태 업데이트
        updateSearchState(processedTerm, false);
    } catch (error) {
        console.error('검색 중 오류 발생:', error);
        // 오류 발생 시 검색 상태 초기화
        updateSearchState('', false);
    } finally {
        // 로딩 상태 업데이트
        if (updateLoadingState) {
            updateLoadingState(false);
        }
    }
}

// 디바운스된 검색 함수 (입력 지연 후 검색 실행)
export const debouncedSearch = debounce(
    async (
        plugin: CardNavigatorPlugin,
        cardContainer: CardContainer,
        searchTerm: string,
        updateLoadingState?: (isLoading: boolean) => void
    ) => {
        await executeSearch(cardContainer, searchTerm, updateLoadingState);
    },
    300
);

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