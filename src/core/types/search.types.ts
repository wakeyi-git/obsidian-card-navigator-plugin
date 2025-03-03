import { TFile } from 'obsidian';

/**
 * 검색 쿼리 타입
 */
export interface SearchQuery {
  /**
   * 검색 텍스트
   */
  text: string;
  
  /**
   * 검색 대상 필드
   */
  fields?: SearchField[];
  
  /**
   * 대소문자 구분 여부
   */
  caseSensitive?: boolean;
  
  /**
   * 정규식 사용 여부
   */
  useRegex?: boolean;
  
  /**
   * 태그 필터
   */
  tags?: string[];
}

/**
 * 검색 필드 타입
 */
export enum SearchField {
  /**
   * 파일 이름
   */
  FILENAME = 'filename',
  
  /**
   * 파일 내용
   */
  CONTENT = 'content',
  
  /**
   * 파일 경로
   */
  PATH = 'path',
  
  /**
   * 프론트매터
   */
  FRONTMATTER = 'frontmatter',
  
  /**
   * 태그
   */
  TAGS = 'tags',
  
  /**
   * 헤더
   */
  HEADINGS = 'headings'
}

/**
 * 검색 결과 타입
 */
export interface SearchResult {
  /**
   * 검색 결과 파일
   */
  file: TFile;
  
  /**
   * 일치 항목
   */
  matches: SearchMatch[];
  
  /**
   * 점수 (관련성)
   */
  score?: number;
}

/**
 * 검색 일치 항목 인터페이스
 */
export interface SearchMatch {
  /**
   * 일치 필드
   */
  field?: SearchField;
  
  /**
   * 일치 타입 (이전 버전 호환용)
   */
  type?: 'title' | 'header' | 'content' | 'tag' | 'frontmatter';
  
  /**
   * 일치 텍스트
   */
  text: string;
  
  /**
   * 일치 위치 (시작)
   */
  start?: number;
  
  /**
   * 일치 위치 (끝)
   */
  end?: number;
  
  /**
   * 일치 위치 (이전 버전 호환용)
   */
  position?: number;
  
  /**
   * 일치 컨텍스트 (주변 텍스트)
   */
  context?: string;
}

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
  
  /**
   * 전체 단어 일치 여부
   */
  matchWholeWord?: boolean;
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
 * 검색 제안 인터페이스
 */
export interface SearchSuggestion {
  /**
   * 제안 값
   */
  value: string;
  
  /**
   * 제안 타입
   */
  type: 'path' | 'file' | 'tag' | 'property' | 'section' | 'recent';
  
  /**
   * 표시 텍스트
   */
  display?: string;
  
  /**
   * 표시 텍스트 (이전 버전 호환용)
   */
  displayText?: string;
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
  | 'search-options-changed'
  | 'search-error';

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