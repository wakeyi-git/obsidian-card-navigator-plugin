import { TFile } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { SearchHistory } from './SearchHistory';
import { SearchService } from './SearchService';
import { SearchSuggest } from './SearchSuggest';
export * from 'common/types';

// 검색 서비스 인스턴스
let searchService: SearchService | null = null;

/**
 * 검색 서비스를 가져옵니다.
 * 싱글톤 패턴으로 구현되어 있어 항상 동일한 인스턴스를 반환합니다.
 * @param plugin 플러그인 인스턴스
 * @returns SearchService 인스턴스
 */
export function getSearchService(plugin: CardNavigatorPlugin): SearchService {
    if (!searchService) {
        searchService = new SearchService(plugin);
    }
    return searchService;
}

/**
 * 검색 기록을 가져옵니다.
 * @returns 검색 기록 배열
 */
export function getSearchHistory(): string[] {
    const service = searchService;
    if (!service) {
        return [];
    }
    return service.getSearchHistory();
}

/**
 * 검색 기록을 초기화합니다.
 */
export function clearSearchHistory(): void {
    const service = searchService;
    if (service) {
        service.clearSearchHistory();
    }
}

export { SearchHistory, SearchService, SearchSuggest }; 