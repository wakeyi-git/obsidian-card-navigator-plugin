import { debounce } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardNavigatorView, RefreshType } from 'ui/cardNavigatorView';
import { SearchHistory } from './SearchHistory';
import { SearchService } from './SearchService';
import { SearchSuggest } from './SearchSuggest';
import { MIN_SEARCH_TERM_LENGTH, SEARCH_DEBOUNCE_DELAY } from 'common/types';
export * from 'common/types';

// 검색 상태
const searchState = {
    isSearching: false,
    lastSearchTerm: '',
    searchHistory: new SearchHistory(),
    searchService: null as SearchService | null
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

export { SearchHistory, SearchService, SearchSuggest }; 