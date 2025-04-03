import { ICard } from '../models/Card';
import { ICardSet } from '../models/CardSet';
import { ISearchFilter } from '../models/SearchFilter';

/**
 * 검색 결과 항목
 */
export interface ISearchResultItem {
  /** 카드 */
  card: ICard;
  /** 검색어 매칭 위치 */
  matches: Array<{
    /** 시작 위치 */
    start: number;
    /** 끝 위치 */
    end: number;
    /** 매칭된 텍스트 */
    text: string;
  }>;
  /** 검색 결과 순위 점수 */
  score: number;
}

/**
 * 검색 서비스 인터페이스
 */
export interface ISearchService {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 검색 실행
   * @param filter 검색 필터
   * @returns 검색 결과 목록
   */
  search(filter: ISearchFilter): Promise<ISearchResultItem[]>;

  /**
   * 검색 필터 적용
   * @param cardSet 카드셋
   * @param filter 검색 필터
   */
  applyFilter(cardSet: ICardSet, filter: ISearchFilter): Promise<ICardSet>;

  /**
   * 검색 필터 유효성 검사
   * @param filter 검색 필터
   */
  validateFilter(filter: ISearchFilter): boolean;

  /**
   * 기본 검색 필터 반환
   */
  getDefaultFilter(): ISearchFilter;

  /**
   * 검색 결과 하이라이팅
   * @param card 카드
   * @param filter 검색 필터
   */
  highlightSearchResults(card: ICard, filter: ISearchFilter): Promise<string>;

  /**
   * 검색 인덱스 업데이트
   * @param card 카드
   */
  updateSearchIndex(card: ICard): Promise<void>;

  /**
   * 검색 인덱스 삭제
   * @param cardId 카드 ID
   */
  removeFromSearchIndex(cardId: string): Promise<void>;
} 