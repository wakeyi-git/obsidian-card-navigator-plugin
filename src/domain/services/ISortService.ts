import { ICardSet } from '../models/CardSet';
import { ISortConfig } from '../models/SortConfig';
import { ISearchResult } from '../models/SearchResult';

/**
 * 정렬 서비스 인터페이스
 */
export interface ISortService {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 카드셋 정렬
   * @param cardSet 정렬할 카드셋
   * @param config 정렬 설정
   * @returns 정렬된 카드셋
   */
  sortCardSet(cardSet: ICardSet, config: ISortConfig): Promise<ICardSet>;

  /**
   * 검색 결과 정렬
   * @param result 정렬할 검색 결과
   * @param config 정렬 설정
   * @returns 정렬된 검색 결과
   */
  sortSearchResult(result: ISearchResult, config: ISortConfig): Promise<ISearchResult>;

  /**
   * 우선순위 태그 정렬
   * @param cardSet 정렬할 카드셋
   * @param priorityTags 우선순위 태그 목록
   * @returns 정렬된 카드셋
   */
  sortByPriorityTags(cardSet: ICardSet, priorityTags: string[]): Promise<ICardSet>;

  /**
   * 우선순위 폴더 정렬
   * @param cardSet 정렬할 카드셋
   * @param priorityFolders 우선순위 폴더 목록
   * @returns 정렬된 카드셋
   */
  sortByPriorityFolders(cardSet: ICardSet, priorityFolders: string[]): Promise<ICardSet>;

  /**
   * 정렬 설정 유효성 검사
   * @param config 검사할 정렬 설정
   * @returns 유효성 여부
   */
  validateSortConfig(config: ISortConfig): boolean;

  /**
   * 기본 정렬 설정 반환
   * @returns 기본 정렬 설정
   */
  getDefaultSortConfig(): ISortConfig;
} 