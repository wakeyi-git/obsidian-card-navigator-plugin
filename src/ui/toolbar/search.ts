import { debounce } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardNavigatorView, RefreshType } from 'ui/cardNavigatorView';
import { t } from 'i18next';

// 검색 관련 상수
const SEARCH_DEBOUNCE_DELAY = 300;
const MIN_SEARCH_TERM_LENGTH = 2;
const MAX_SEARCH_HISTORY = 10;

// 검색 히스토리 관리 클래스
class SearchHistory {
    private history: string[] = [];
    private maxSize: number;

    constructor(maxSize: number = MAX_SEARCH_HISTORY) {
        this.maxSize = maxSize;
    }

    add(term: string) {
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
}

// 초기 검색 상태
const searchState: SearchState = {
    isSearching: false,
    lastSearchTerm: '',
    searchHistory: new SearchHistory()
};

// 검색어 전처리
function preprocessSearchTerm(term: string): string {
    return term.trim().toLowerCase();
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
    searchState.searchHistory.clear;
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

    return container;
}

