import { debounce } from 'obsidian';
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

// 검색 실행 함수
export async function executeSearch(
    cardContainer: CardContainer,
    searchTerm: string,
    updateLoadingCallback?: (isLoading: boolean) => void
) {
    try {
        // 로딩 상태 업데이트
        if (updateLoadingCallback) {
            updateLoadingCallback(true);
        } else {
            const containerEl = cardContainer.getContainerElement();
            if (containerEl) {
                setLoadingState(containerEl, true);
            }
        }
        
        // 검색어 전처리
        const processedTerm = preprocessSearchTerm(searchTerm);
        
        // 검색어가 유효하지 않으면 종료
        if (!isValidSearchTerm(processedTerm)) {
            if (updateLoadingCallback) {
                updateLoadingCallback(false);
            } else {
                const containerEl = cardContainer.getContainerElement();
                if (containerEl) {
                    setLoadingState(containerEl, false);
                }
            }
            return;
        }
        
        // 검색 상태 업데이트
        updateSearchState(processedTerm, true);
        
        // 검색 실행 - 새로운 API 사용
        await cardContainer.loadCards({ searchTerm: processedTerm });
        
        // 검색 완료 상태 업데이트
        updateSearchState(processedTerm, false);
        
        // 검색 기록에 추가
        addToSearchHistory(processedTerm);
    } catch (error) {
        console.error('검색 중 오류 발생:', error);
    } finally {
        // 로딩 상태 해제
        if (updateLoadingCallback) {
            updateLoadingCallback(false);
        } else {
            const containerEl = cardContainer.getContainerElement();
            if (containerEl) {
                setLoadingState(containerEl, false);
            }
        }
    }
}

// 디바운스된 검색 함수 (입력 지연 후 검색 실행)
export const debouncedSearch = debounce(
    async (
        plugin: CardNavigatorPlugin,
        cardContainer: CardContainer,
        searchTerm: string,
        updateLoadingCallback?: (isLoading: boolean) => void
    ) => {
        await executeSearch(cardContainer, searchTerm, updateLoadingCallback);
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