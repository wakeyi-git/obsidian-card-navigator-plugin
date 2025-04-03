import { ICardSet } from '../models/CardSet';
import { ISortConfig } from '../models/SortConfig';
import { ISearchResultItem } from './ISearchService';

/**
 * 정렬 서비스 인터페이스
 */
export interface ISortService {
  /**
   * 정렬 설정 적용
   * @param cardSet 카드셋
   * @param config 정렬 설정
   */
  applySort(cardSet: ICardSet, config: ISortConfig): Promise<ICardSet>;

  /**
   * 정렬 설정 유효성 검사
   * @param config 정렬 설정
   */
  validateSortConfig(config: ISortConfig): boolean;

  /**
   * 기본 정렬 설정 반환
   */
  getDefaultSortConfig(): ISortConfig;

  /**
   * 우선순위 태그 정렬
   * @param cardSet 카드셋
   * @param priorityTags 우선순위 태그 목록
   */
  sortByPriorityTags(cardSet: ICardSet, priorityTags: string[]): Promise<ICardSet>;

  /**
   * 우선순위 폴더 정렬
   * @param cardSet 카드셋
   * @param priorityFolders 우선순위 폴더 목록
   */
  sortByPriorityFolders(cardSet: ICardSet, priorityFolders: string[]): Promise<ICardSet>;

  /**
   * 검색 결과 정렬
   * @param results 검색 결과
   * @param config 정렬 설정
   */
  sort(results: ISearchResultItem[], config?: ISortConfig): Promise<ISearchResultItem[]>;
} 