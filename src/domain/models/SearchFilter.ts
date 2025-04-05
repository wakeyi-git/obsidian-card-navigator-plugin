import { ISortConfig } from './SortConfig';

/**
 * 검색 필터 인터페이스
 * - 검색 조건을 표현하는 값 객체(Value Object)
 * - 불변(Immutable) 객체로 관리
 * - 새로운 설정 구조와 일치하도록 수정됨
 */
export interface ISearchFilter {
  /**
   * 검색어
   */
  readonly query: string;

  /**
   * 검색 범위
   */
  readonly searchScope: 'all' | 'current';

  /**
   * 파일명 검색
   */
  readonly searchFilename: boolean;

  /**
   * 내용 검색
   */
  readonly searchContent: boolean;

  /**
   * 태그 검색
   */
  readonly searchTags: boolean;

  /**
   * 대소문자 구분
   */
  readonly caseSensitive: boolean;

  /**
   * 정규식 사용
   */
  readonly useRegex: boolean;

  /**
   * 정렬 설정
   */
  readonly sortConfig?: ISortConfig;

  /**
   * 검색 필터 유효성 검사
   */
  validate(): boolean;
  
  /**
   * 검색 필터 미리보기
   */
  preview(): {
    query: string;
    searchScope: 'all' | 'current';
    searchFilename: boolean;
    searchContent: boolean;
    searchTags: boolean;
    caseSensitive: boolean;
    useRegex: boolean;
  };
}

/**
 * 기본 검색 필터
 */
export const DEFAULT_SEARCH_FILTER: ISearchFilter = {
  query: '', // 빈 검색어
  searchScope: 'all', // 전체 검색
  searchFilename: true, // 파일명 검색 기본값
  searchContent: true, // 내용 검색 기본값
  searchTags: true, // 태그 검색 기본값
  caseSensitive: false, // 대소문자 구분하지 않음
  useRegex: false, // 정규식 사용하지 않음
  sortConfig: undefined,

  validate(): boolean {
    return true; // 기본값은 항상 유효
  },
  
  preview(): {
    query: string;
    searchScope: 'all' | 'current';
    searchFilename: boolean;
    searchContent: boolean;
    searchTags: boolean;
    caseSensitive: boolean;
    useRegex: boolean;
  } {
    return {
      query: this.query,
      searchScope: this.searchScope,
      searchFilename: this.searchFilename,
      searchContent: this.searchContent,
      searchTags: this.searchTags,
      caseSensitive: this.caseSensitive,
      useRegex: this.useRegex
    };
  }
};

/**
 * 검색 필터 클래스
 */
export class SearchFilter implements ISearchFilter {
  constructor(
    public readonly query: string,
    public readonly searchScope: 'all' | 'current',
    public readonly searchFilename: boolean,
    public readonly searchContent: boolean,
    public readonly searchTags: boolean,
    public readonly caseSensitive: boolean,
    public readonly useRegex: boolean,
    public readonly sortConfig?: ISortConfig
  ) {}

  /**
   * 검색 필터 유효성 검사
   */
  validate(): boolean {
    if (!this.searchScope || !['all', 'current'].includes(this.searchScope)) {
      return false;
    }

    return true;
  }
  
  /**
   * 검색 필터 미리보기
   */
  preview(): {
    query: string;
    searchScope: 'all' | 'current';
    searchFilename: boolean;
    searchContent: boolean;
    searchTags: boolean;
    caseSensitive: boolean;
    useRegex: boolean;
  } {
    return {
      query: this.query,
      searchScope: this.searchScope,
      searchFilename: this.searchFilename,
      searchContent: this.searchContent,
      searchTags: this.searchTags,
      caseSensitive: this.caseSensitive,
      useRegex: this.useRegex
    };
  }
} 