import { Card } from '@/domain/models/Card';
import { ISearchOptions, ISearchResult } from '@/domain/models/Search';

/**
 * 검색 서비스 인터페이스
 */
export interface ISearchService {
  /**
   * 검색 쿼리 유효성 검사
   * @param query 검색어
   */
  isValidQuery(query: string): boolean;

  /**
   * 검색 결과 필터링
   * @param cards 카드 목록
   * @param query 검색어
   * @param options 검색 옵션
   */
  filterResults(cards: Card[], query: string, options: ISearchOptions): Card[];

  /**
   * 실시간 검색
   * @param query 검색어
   * @param options 검색 옵션
   */
  searchRealtime(query: string, options: ISearchOptions): Promise<ISearchResult>;

  /**
   * 검색 실행
   * @param query 검색어
   * @param options 검색 옵션
   */
  search(query: string, options: ISearchOptions): Promise<ISearchResult>;
} 