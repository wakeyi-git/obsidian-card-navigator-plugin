import { ISearchResult } from '@/domain/models/Search';
import { ISearchService } from './ISearchService';

/**
 * Obsidian 검색 서비스 인터페이스
 */
export interface IObsidianSearchService extends ISearchService {
  /**
   * Obsidian 검색 플러그인 초기화
   */
  initialize(): void;

  /**
   * Obsidian 검색 플러그인 정리
   */
  cleanup(): void;

  /**
   * 검색 결과 업데이트
   * @param results 검색 결과
   */
  updateSearchResults(results: ISearchResult): void;

  /**
   * 검색 결과 초기화
   */
  clearSearchResults(): void;
} 