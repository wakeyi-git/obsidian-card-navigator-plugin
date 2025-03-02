import { TFile } from 'obsidian';
import { Card } from '../models/Card';
import { SearchOptions, SearchSuggestion } from '../types/search.types';
import { SearchResult } from '../models/SearchResult';

/**
 * 검색 서비스 인터페이스
 * 파일 및 카드 검색과 검색 관련 기능을 제공합니다.
 */
export interface ISearchService {
  /**
   * 검색 서비스 초기화
   * @param options 초기 검색 옵션
   */
  initialize(options?: Partial<SearchOptions>): void;
  
  /**
   * 검색 옵션 설정
   * @param options 검색 옵션
   */
  setOptions(options: Partial<SearchOptions>): void;

  /**
   * 검색 옵션 가져오기
   * @param key 옵션 키
   * @returns 옵션 값
   */
  getOption<K extends keyof SearchOptions>(key: K): SearchOptions[K];

  /**
   * 파일 검색
   * @param files 검색할 파일 배열
   * @param searchTerm 검색어
   * @returns 검색 결과 파일 배열
   */
  searchFiles(files: TFile[], searchTerm: string): Promise<TFile[]>;

  /**
   * 카드 검색
   * @param cards 검색할 카드 배열
   * @param searchTerm 검색어
   * @returns 검색 결과 카드 배열
   */
  searchCards(cards: Card[], searchTerm: string): Promise<Card[]>;

  /**
   * 상세 검색 결과 가져오기
   * @param files 검색할 파일 배열
   * @param searchTerm 검색어
   * @returns 상세 검색 결과 배열
   */
  getDetailedSearchResults(files: TFile[], searchTerm: string): Promise<SearchResult[]>;

  /**
   * 검색어 제안 가져오기
   * @param searchTerm 검색어
   * @returns 검색어 제안 배열
   */
  getSuggestions(searchTerm: string): Promise<SearchSuggestion[]>;

  /**
   * 검색 기록에 검색어 추가
   * @param searchTerm 검색어
   */
  addToHistory(searchTerm: string): void;

  /**
   * 최근 검색어 가져오기
   * @param limit 가져올 검색어 수
   * @returns 최근 검색어 배열
   */
  getRecentSearches(limit?: number): string[];

  /**
   * 검색 기록 지우기
   */
  clearHistory(): void;
  
  /**
   * 검색 결과 하이라이트 처리
   * @param content 원본 콘텐츠
   * @param searchTerm 검색어
   * @returns 하이라이트된 콘텐츠
   */
  highlightSearchResults(content: string, searchTerm: string): string;
  
  /**
   * 검색 서비스 파괴
   */
  destroy(): void;
} 