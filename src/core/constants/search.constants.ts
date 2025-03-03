import { SearchOptions } from '../types/search.types';
import { SortDirection } from '../types/common.types';

/**
 * 검색 관련 상수
 * 
 * 이 파일은 검색 기능과 관련된 비즈니스 로직 상수를 정의합니다.
 * UI/스타일 관련 상수는 styles/components/search.styles.ts에 정의되어 있습니다.
 */

/**
 * 검색 모드 열거형
 */
export enum SearchMode {
  CONTAINS = 'contains',     // 포함
  STARTS_WITH = 'startsWith', // 시작
  ENDS_WITH = 'endsWith',     // 끝
  EXACT = 'exact',           // 정확히 일치
  REGEX = 'regex',           // 정규식
  FUZZY = 'fuzzy',           // 퍼지 검색
}

/**
 * 검색 필드 열거형
 */
export enum SearchField {
  FILENAME = 'filename',     // 파일명
  CONTENT = 'content',       // 내용
  TAGS = 'tags',             // 태그
  HEADERS = 'headers',       // 헤더
  HEADINGS = 'headings',     // 헤딩 (HEADERS와 동일한 용도로 사용)
  LINKS = 'links',           // 링크
  FRONTMATTER = 'frontmatter', // 프론트매터
  ALL = 'all',               // 모든 필드
}

/**
 * 검색 정렬 기준 열거형
 */
export enum SearchSortBy {
  RELEVANCE = 'relevance',   // 관련성
  FILENAME = 'filename',     // 파일명
  CREATED = 'created',       // 생성일
  MODIFIED = 'modified',     // 수정일
  SIZE = 'size',             // 크기
}

/**
 * 검색 기본값
 */
export const SEARCH_DEFAULTS = {
  // 검색 입력 관련
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 50,
  
  // 검색 기록 관련
  MAX_HISTORY_ITEMS: 10,
  MAX_SUGGESTIONS: 5,
  
  // 검색 범위 관련
  DEFAULT_SEARCH_SCOPE: 'current',
  DEFAULT_SEARCH_TYPE: 'content',
  
  // 검색 필터 관련
  DEFAULT_FILTERS: {
    caseSensitive: false,
    includeTitle: true,
    includeHeaders: true,
    includeTags: true,
    includeContent: true,
    includeFrontmatter: false,
  },
};

/**
 * 검색 이벤트 타입
 */
export const SEARCH_EVENTS = {
  QUERY_CHANGE: 'search:query-change',
  RESULTS_UPDATE: 'search:results-update',
  FILTER_CHANGE: 'search:filter-change',
  HISTORY_UPDATE: 'search:history-update',
  ERROR: 'search:error',
};

/**
 * 검색 범위 타입
 */
export const SEARCH_SCOPE_TYPES = {
  CURRENT: 'current',
  FOLDER: 'folder',
  VAULT: 'vault',
  SELECTION: 'selection',
} as const;

/**
 * 검색 타입
 */
export const SEARCH_TYPES = {
  TITLE: 'title',
  HEADER: 'header',
  TAG: 'tag',
  CONTENT: 'content',
  FRONTMATTER: 'frontmatter',
} as const;

/**
 * 검색 기본 설정값
 */
export const DEFAULT_SEARCH_SETTINGS = {
  // 검색 모드
  MODE: SearchMode.CONTAINS,
  
  // 검색 필드
  FIELDS: [SearchField.FILENAME, SearchField.CONTENT],
  
  // 대소문자 구분 여부
  CASE_SENSITIVE: false,
  
  // 다이어크리틱(발음 구별 기호) 무시 여부
  IGNORE_DIACRITICS: true,
  
  // 검색 정렬 기준
  SORT_BY: SearchSortBy.RELEVANCE,
  
  // 검색 정렬 방향
  SORT_DIRECTION: SortDirection.DESC,
  
  // 검색 결과 하이라이트 여부
  HIGHLIGHT_RESULTS: true,
  
  // 검색 기록 저장 여부
  SAVE_HISTORY: true,
  
  // 저장할 최대 검색 기록 수
  MAX_HISTORY_ITEMS: 20,
  
  // 검색 제안 표시 여부
  SHOW_SUGGESTIONS: true,
  
  // 최소 검색어 길이
  MIN_SEARCH_LENGTH: 2,
  
  // 검색 디바운스 시간 (밀리초)
  SEARCH_DEBOUNCE: 300,
  
  // 퍼지 검색 임계값 (0-1)
  // 값이 낮을수록 더 많은 결과가 반환됨
  FUZZY_THRESHOLD: 0.4,
};

/**
 * 검색 필터 관련 상수
 */
export const SEARCH_FILTERS = {
  // 태그 필터 접두사
  TAG_PREFIX: 'tag:',
  
  // 파일 필터 접두사
  FILE_PREFIX: 'file:',
  
  // 폴더 필터 접두사
  FOLDER_PREFIX: 'folder:',
  
  // 프론트매터 필터 접두사
  FRONTMATTER_PREFIX: 'fm:',
  
  // 필터 구분자
  SEPARATOR: ' ',
  
  // 필터 값 따옴표
  QUOTE: '"',
  
  // 필터 값 이스케이프 문자
  ESCAPE: '\\',
};

/**
 * 검색 제안 관련 상수
 */
export const SEARCH_SUGGESTIONS = {
  // 제안 유형
  TYPES: {
    RECENT: 'recent',        // 최근 검색어
    TAG: 'tag',              // 태그
    FILENAME: 'filename',    // 파일명
    CONTENT: 'content',      // 내용
  },
  
  // 제안 표시 순서
  ORDER: ['recent', 'tag', 'filename', 'content'],
};

/**
 * 검색 기록 관련 상수
 */
export const SEARCH_HISTORY = {
  // 로컬 스토리지 키
  STORAGE_KEY: 'card-navigator-search-history',
  
  // 중복 항목 처리 방식
  DUPLICATE_HANDLING: 'move-to-top', // 'move-to-top' | 'ignore'
};

/**
 * 검색 성능 관련 상수
 */
export const SEARCH_PERFORMANCE = {
  // 인덱싱 청크 크기
  // 대량의 파일 인덱싱 시 이 크기만큼 나누어 처리
  INDEXING_CHUNK_SIZE: 50,
  
  // 청크 처리 간 지연 시간 (밀리초)
  // 브라우저 렌더링 차단 방지
  CHUNK_PROCESSING_DELAY: 10,
  
  // 검색 결과 청크 크기
  // 대량의 검색 결과 처리 시 이 크기만큼 나누어 처리
  RESULTS_CHUNK_SIZE: 100,
  
  // 최대 검색 결과 수
  MAX_RESULTS: 100,
  
  // 인덱스 갱신 주기 (밀리초)
  // 파일 변경 시 인덱스 갱신 간격
  INDEX_UPDATE_INTERVAL: 5000,
};

/**
 * 기본 검색 옵션
 */
export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  searchInTitle: true,
  searchInHeaders: true,
  searchInTags: true,
  searchInContent: true,
  searchInFrontmatter: false,
  caseSensitive: false,
  useRegex: false,
};

/**
 * 기본 검색 정렬 기준
 */
export const DEFAULT_SEARCH_SORT_BY = SearchSortBy.RELEVANCE;

/**
 * 기본 검색 정렬 방향
 */
export const DEFAULT_SEARCH_SORT_DIRECTION = SortDirection.DESC; 