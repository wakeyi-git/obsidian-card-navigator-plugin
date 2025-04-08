import { ICard } from '../../models/Card';
import { ISearchConfig, ISearchResult } from '../../models/Search';
import { TFile } from 'obsidian';

/**
 * 검색 서비스 인터페이스
 * 
 * @remarks
 * 검색 서비스는 검색 실행, 실시간 검색, 파일 검색, 검색 결과 필터링 및 유효성 검사를 담당합니다.
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
   * 검색 결과 유효성 검사
   * @param result 검색 결과
   * @returns 유효성 여부
   */
  validateResults(result: ISearchResult): boolean;

  /**
   * 검색 결과 하이라이트
   * @param card 카드
   * @param query 검색어
   * @param config 검색 설정
   * @returns 하이라이트된 텍스트
   */
  highlightSearchResults(card: ICard, query: string, config: ISearchConfig): Promise<string>;

  /**
   * 검색 인덱스 업데이트
   * @param card 카드
   */
  updateSearchIndex(card: ICard): Promise<void>;

  /**
   * 검색 인덱스에서 제거
   * @param cardId 카드 ID
   */
  removeFromSearchIndex(cardId: string): Promise<void>;
} 