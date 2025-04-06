/**
 * 검색 범위 열거형
 */
export enum SearchScope {
  /** 전체 검색 */
  ALL = 'all',
  /** 현재 카드셋 검색 */
  CURRENT = 'current'
}

/**
 * 검색 조건 인터페이스
 */
export interface ISearchCriteria {
  /** 검색 범위 */
  readonly scope: SearchScope;
  /** 검색어 */
  readonly query: string;
  /** 대소문자 구분 */
  readonly caseSensitive: boolean;
  /** 정규식 사용 */
  readonly useRegex: boolean;
  /** 퍼지 검색 */
  readonly fuzzy: boolean;
  /** 파일명 검색 */
  readonly searchFilename: boolean;
  /** 내용 검색 */
  readonly searchContent: boolean;
  /** 태그 검색 */
  readonly searchTags: boolean;
  /** 속성 검색 */
  readonly searchProperties: boolean;
}

/**
 * 검색 결과 인터페이스
 */
export interface ISearchResult {
  /** 검색 조건 */
  readonly criteria: ISearchCriteria;
  /** 검색된 카드 ID 목록 */
  readonly cardIds: string[];
  /** 검색 시간 */
  readonly searchTime: number;
  /** 전체 결과 수 */
  readonly totalCount: number;
  /** 필터링된 결과 수 */
  readonly filteredCount: number;
}

/**
 * 검색 결과 클래스
 */
export class SearchResult implements ISearchResult {
  constructor(
    public readonly criteria: ISearchCriteria,
    public readonly cardIds: string[],
    public readonly searchTime: number = Date.now(),
    public readonly totalCount: number = 0,
    public readonly filteredCount: number = 0
  ) {}

  /**
   * 검색 결과 유효성 검사
   */
  validate(): boolean {
    if (!this.criteria || !Object.values(SearchScope).includes(this.criteria.scope)) {
      return false;
    }

    if (!Array.isArray(this.cardIds)) {
      return false;
    }

    return true;
  }

  /**
   * 검색 결과 미리보기
   */
  preview(): ISearchResult {
    return {
      criteria: this.criteria,
      cardIds: [...this.cardIds],
      searchTime: this.searchTime,
      totalCount: this.totalCount,
      filteredCount: this.filteredCount
    };
  }
} 