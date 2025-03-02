import { TFile } from 'obsidian';

/**
 * 검색 옵션
 */
export interface SearchOptions {
  /**
   * 제목 검색 여부
   */
  searchInTitle: boolean;
  
  /**
   * 헤더 검색 여부
   */
  searchInHeaders: boolean;
  
  /**
   * 태그 검색 여부
   */
  searchInTags: boolean;
  
  /**
   * 내용 검색 여부
   */
  searchInContent: boolean;
  
  /**
   * 프론트매터 검색 여부
   */
  searchInFrontmatter: boolean;
  
  /**
   * 대소문자 구분 여부
   */
  caseSensitive: boolean;
  
  /**
   * 정규식 사용 여부
   */
  useRegex: boolean;
}

/**
 * 검색 결과 매치 타입
 */
export interface SearchMatch {
  /**
   * 매치 타입
   */
  type: 'title' | 'header' | 'tag' | 'content' | 'frontmatter';
  
  /**
   * 매치된 텍스트
   */
  text: string;
  
  /**
   * 매치 위치
   */
  position?: number;
}

/**
 * 검색 결과 인터페이스
 */
export interface ISearchResult {
  /**
   * 검색 결과 파일
   */
  file: TFile;
  
  /**
   * 매치 배열
   */
  matches: SearchMatch[];
  
  /**
   * 검색어
   */
  searchTerm: string;
  
  /**
   * 검색 결과 점수
   * 높을수록 더 관련성이 높음
   */
  score: number;
  
  /**
   * 검색 결과 생성 시간
   */
  timestamp: number;
}

// 기존 SearchResultData 인터페이스를 위한 타입 별칭 (하위 호환성 유지)
export type SearchResultData = ISearchResult;

/**
 * 검색 제안 타입
 */
export interface SearchSuggestion {
  /**
   * 제안 값
   */
  value: string;
  
  /**
   * 제안 타입
   */
  type: 'path' | 'file' | 'tag' | 'property' | 'section';
  
  /**
   * 표시 텍스트
   */
  display: string;
}

/**
 * 검색 기록 데이터 인터페이스
 */
export interface SearchHistoryData {
  /**
   * 최근 검색어 배열
   */
  recent: string[];
  
  /**
   * 최대 기록 수
   */
  maxSize: number;
}

/**
 * 검색 기록 인터페이스
 */
export interface ISearchHistory {
  /**
   * 최근 검색어 가져오기
   */
  getRecent(): string[];
  
  /**
   * 검색어 추가
   */
  add(term: string): void;
  
  /**
   * 검색 기록 지우기
   */
  clear(): void;
  
  /**
   * 검색 기록 데이터 가져오기
   */
  getData(): SearchHistoryData;
  
  /**
   * 검색 기록 데이터 설정하기
   */
  setData(data: SearchHistoryData): void;
}

/**
 * 검색 상태
 */
export interface SearchState {
  /**
   * 검색 중 여부
   */
  isSearching: boolean;
  
  /**
   * 마지막 검색어
   */
  lastSearchTerm: string;
}

/**
 * 검색 이벤트 타입
 */
export type SearchEvent = 
  | 'search-started'
  | 'search-completed'
  | 'search-cancelled'
  | 'search-options-changed';

/**
 * 검색 이벤트 데이터 인터페이스
 */
export interface SearchEventData {
  /**
   * 이벤트 타입
   */
  type: SearchEvent;
  
  /**
   * 검색어
   */
  searchTerm?: string;
  
  /**
   * 검색 옵션
   */
  searchOptions?: SearchOptions;
  
  /**
   * 검색 결과
   */
  searchResults?: SearchResultData[];
  
  /**
   * 타임스탬프
   */
  timestamp: number;
}

/**
 * 검색 이벤트 핸들러
 */
export type SearchEventHandler = (data: SearchEventData) => void; 