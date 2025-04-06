import { ICard } from '../models/Card';
import { ISearchConfig } from '../models/SearchConfig';
import { ISearchResult } from '../models/SearchResult';
import { TFile } from 'obsidian';

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
   * @param query 검색어
   * @param config 검색 설정
   * @returns 검색 결과
   */
  search(query: string, config: ISearchConfig): Promise<ISearchResult>;

  /**
   * 실시간 검색
   * @param query 검색어
   * @param config 검색 설정
   * @returns 검색 결과
   */
  searchRealtime(query: string, config: ISearchConfig): Promise<ISearchResult>;

  /**
   * 파일 검색
   * @param file 검색할 파일
   * @param query 검색어
   * @param config 검색 설정
   * @returns 검색 결과
   */
  searchInFile(file: TFile, query: string, config: ISearchConfig): Promise<ISearchResult>;

  /**
   * 검색 결과 필터링
   * @param result 검색 결과
   * @param config 검색 설정
   * @returns 필터링된 검색 결과
   */
  filterResults(result: ISearchResult, config: ISearchConfig): Promise<ISearchResult>;

  /**
   * 검색 결과 정렬
   * @param result 검색 결과
   * @param config 검색 설정
   * @returns 정렬된 검색 결과
   */
  sortResults(result: ISearchResult, config: ISearchConfig): Promise<ISearchResult>;

  /**
   * 검색 결과 유효성 검사
   * @param result 검색 결과
   * @returns 유효성 여부
   */
  validateResults(result: ISearchResult): boolean;

  /**
   * 검색 결과 하이라이팅
   * @param card 카드
   * @param query 검색어
   * @param config 검색 설정
   */
  highlightSearchResults(card: ICard, query: string, config: ISearchConfig): Promise<string>;

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