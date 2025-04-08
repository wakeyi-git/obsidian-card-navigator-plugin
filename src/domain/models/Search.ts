import { ICard } from './Card';

/**
 * 검색 결과 항목 인터페이스
 * 
 * @remarks
 * ISearchResult의 items 배열에 포함되는 각 카드의 상세 검색 결과를 나타냅니다.
 * card.id는 ISearchResult의 cardIds 배열에 포함되어야 합니다.
 */
export interface ISearchResultItem {
  /** 카드 (ICard의 id는 ISearchResult의 cardIds에 포함되어야 함) */
  readonly card: ICard;
  /** 검색어 매칭 위치 */
  readonly matches: Array<{
    /** 시작 위치 */
    readonly start: number;
    /** 끝 위치 */
    readonly end: number;
    /** 매칭된 텍스트 */
    readonly text: string;
  }>;
  /** 검색 결과 순위 점수 */
  readonly score: number;
}

/**
 * 검색 기준 인터페이스
 */
export interface ISearchCriteria {
  /** 검색어 */
  readonly query: string;
  /** 검색 범위 */
  readonly scope: 'all' | 'current';
  /** 대소문자 구분 */
  readonly caseSensitive: boolean;
  /** 정규식 사용 */
  readonly useRegex: boolean;
  /** 전체 단어 일치 */
  readonly wholeWord: boolean;
}

/**
 * 검색 설정 인터페이스
 */
export interface ISearchConfig {
  /** 검색 기준 */
  readonly criteria: ISearchCriteria;
  /** 검색 히스토리 */
  readonly history: readonly ISearchCriteria[];
  /** 최대 히스토리 수 */
  readonly maxHistory: number;
}

/**
 * 검색 결과 인터페이스
 * 
 * @remarks
 * 검색 결과는 검색된 카드들의 ID 목록과 각 카드의 상세 검색 결과를 포함합니다.
 * cardIds는 ICard의 id와 일치해야 하며, 이를 통해 ISearchResultItem에서 각 카드의 상세 정보를 찾을 수 있습니다.
 */
export interface ISearchResult {
  /** 검색된 카드 ID 목록 (ICard의 id와 일치해야 함) */
  readonly cardIds: readonly string[];
  /** 검색 쿼리 */
  readonly query: string;
  /** 검색 설정 */
  readonly config: ISearchConfig;
  /** 각 카드의 상세 검색 결과 (ISearchResultItem) */
  readonly items: readonly ISearchResultItem[];
}

/**
 * 기본 검색 기준
 */
export const DEFAULT_SEARCH_CRITERIA: ISearchCriteria = {
  query: '',
  scope: 'all',
  caseSensitive: false,
  useRegex: false,
  wholeWord: false
};

/**
 * 기본 검색 설정
 */
export const DEFAULT_SEARCH_CONFIG: ISearchConfig = {
  criteria: DEFAULT_SEARCH_CRITERIA,
  history: [],
  maxHistory: 10
}; 