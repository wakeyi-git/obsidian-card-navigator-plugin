import { ISortConfig } from './SortConfig';

/**
 * 검색 필터 인터페이스
 * - 검색 조건을 표현하는 값 객체(Value Object)
 * - 불변(Immutable) 객체로 관리
 */
export interface ISearchFilter {
  /**
   * 검색어
   */
  readonly query: string;

  /**
   * 검색 범위
   */
  readonly scope: 'all' | 'current';

  /**
   * 검색 옵션
   */
  readonly options: {
    /**
     * 파일명 검색
     */
    readonly filename: boolean;

    /**
     * 내용 검색
     */
    readonly content: boolean;

    /**
     * 태그 검색
     */
    readonly tags: boolean;

    /**
     * 대소문자 구분
     */
    readonly caseSensitive: boolean;

    /**
     * 정규식 사용
     */
    readonly useRegex: boolean;
  };

  /**
   * 정렬 설정
   */
  readonly sortConfig?: ISortConfig;

  /**
   * 검색 필터 유효성 검사
   */
  validate(): boolean;
}

/**
 * 기본 검색 옵션
 */
export const DEFAULT_SEARCH_OPTIONS = {
  filename: true, // 파일명 검색 기본값
  content: true, // 내용 검색 기본값
  tags: true, // 태그 검색 기본값
  caseSensitive: false, // 대소문자 구분하지 않음
  useRegex: false // 정규식 사용하지 않음
} as const;

/**
 * 기본 검색 필터
 */
export const DEFAULT_SEARCH_FILTER: ISearchFilter = {
  query: '', // 빈 검색어
  scope: 'all', // 전체 검색
  options: DEFAULT_SEARCH_OPTIONS,

  validate(): boolean {
    return true; // 기본값은 항상 유효
  }
};

/**
 * 검색 필터 클래스
 */
export class SearchFilter implements ISearchFilter {
  readonly options: {
    readonly filename: boolean;
    readonly content: boolean;
    readonly tags: boolean;
    readonly caseSensitive: boolean;
    readonly useRegex: boolean;
  };

  constructor(
    public readonly query: string,
    public readonly scope: 'all' | 'current',
    options: {
      filename: boolean;
      content: boolean;
      tags: boolean;
      caseSensitive: boolean;
      useRegex: boolean;
    }
  ) {
    // 옵션 객체를 불변 객체로 만들어 할당
    this.options = Object.freeze({ ...options });
  }

  /**
   * 검색 필터 유효성 검사
   */
  validate(): boolean {
    if (!this.query) {
      return false;
    }

    if (!this.scope || !['all', 'current'].includes(this.scope)) {
      return false;
    }

    if (!this.options) {
      return false;
    }

    return true;
  }
} 