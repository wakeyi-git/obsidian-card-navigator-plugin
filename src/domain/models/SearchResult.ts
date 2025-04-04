import { ICardSet } from './CardSet';

/**
 * 검색 결과 인터페이스
 */
export interface ISearchResult {
  /**
   * 검색 쿼리
   */
  query: string;

  /**
   * 검색 결과 카드셋
   */
  results: ICardSet;

  /**
   * 검색 시작 시간
   */
  startTime: Date;

  /**
   * 검색 완료 시간
   */
  endTime: Date;

  /**
   * 검색 소요 시간 (밀리초)
   */
  duration: number;

  /**
   * 검색 결과 수
   */
  resultCount: number;

  /**
   * 검색 오류
   */
  error?: Error;
} 