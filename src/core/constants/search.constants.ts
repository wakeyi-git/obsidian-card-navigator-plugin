import { SearchOptions } from '../types/search.types';

/**
 * 검색 관련 상수
 * 
 * 이 파일은 검색 기능과 관련된 모든 상수를 정의합니다.
 * 검색 모드, 필드, 옵션, 기본값 등을 포함합니다.
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
 * 검색 정렬 방향 열거형
 */
export enum SearchSortDirection {
  ASC = 'asc',               // 오름차순
  DESC = 'desc',             // 내림차순
}

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
  SORT_DIRECTION: SearchSortDirection.DESC,
  
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
 * 검색 결과 하이라이트 관련 상수
 */
export const SEARCH_HIGHLIGHT = {
  // 하이라이트 앞 태그
  PREFIX: '<mark class="card-navigator-search-highlight">',
  
  // 하이라이트 뒤 태그
  SUFFIX: '</mark>',
  
  // 컨텍스트 길이 (하이라이트 주변 표시할 문자 수)
  CONTEXT_LENGTH: 50,
  
  // 최대 하이라이트 수
  MAX_HIGHLIGHTS: 10,
  
  // 하이라이트 사이 구분자
  SEPARATOR: '...',
  
  // CSS 클래스
  CLASS: 'card-navigator-search-highlight',
};

/**
 * 검색 제안 관련 상수
 */
export const SEARCH_SUGGESTIONS = {
  // 최대 제안 수
  MAX_SUGGESTIONS: 5,
  
  // 최소 제안 표시 검색어 길이
  MIN_LENGTH: 1,
  
  // 제안 유형
  TYPES: {
    RECENT: 'recent',        // 최근 검색어
    TAG: 'tag',              // 태그
    FILENAME: 'filename',    // 파일명
    CONTENT: 'content',      // 내용
  },
  
  // 제안 표시 순서
  ORDER: ['recent', 'tag', 'filename', 'content'],
  
  // 제안 유형별 최대 수
  MAX_PER_TYPE: {
    recent: 3,
    tag: 5,
    filename: 5,
    content: 3,
  },
  
  // 제안 디바운스 시간 (밀리초)
  DEBOUNCE: 150,
  
  // CSS 클래스
  CLASS: 'card-navigator-search-suggestions',
};

/**
 * 검색 기록 관련 상수
 */
export const SEARCH_HISTORY = {
  // 로컬 스토리지 키
  STORAGE_KEY: 'card-navigator-search-history',
  
  // 최대 저장 항목 수
  MAX_ITEMS: 10,
  
  // 중복 항목 처리 방식
  DUPLICATE_HANDLING: 'move-to-top', // 'move-to-top' | 'ignore'
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
 * 검색 UI 관련 상수
 */
export const SEARCH_UI = {
  // 검색 입력 필드 ID
  INPUT_ID: 'card-navigator-search-input',
  
  // 검색 결과 컨테이너 ID
  RESULTS_ID: 'card-navigator-search-results',
  
  // 검색 제안 컨테이너 ID
  SUGGESTIONS_ID: 'card-navigator-search-suggestions',
  
  // 검색 옵션 컨테이너 ID
  OPTIONS_ID: 'card-navigator-search-options',
  
  // 검색 필터 컨테이너 ID
  FILTERS_ID: 'card-navigator-search-filters',
  
  // 검색 상태 메시지 ID
  STATUS_ID: 'card-navigator-search-status',
  
  // 검색 로딩 인디케이터 ID
  LOADING_ID: 'card-navigator-search-loading',
  
  // 검색 단축키
  SHORTCUTS: {
    FOCUS: 'mod+f',          // 검색 입력 필드 포커스
    CLEAR: 'escape',         // 검색어 지우기
    NEXT_RESULT: 'enter',    // 다음 결과로 이동
    PREV_RESULT: 'shift+enter', // 이전 결과로 이동
    NEXT_SUGGESTION: 'down', // 다음 제안으로 이동
    PREV_SUGGESTION: 'up',   // 이전 제안으로 이동
    SELECT_SUGGESTION: 'tab', // 제안 선택
  },
  
  // CSS 클래스
  CLASSES: {
    BAR: 'card-navigator-search-bar',
    OPTIONS: 'card-navigator-search-options',
    RESULTS: 'card-navigator-search-results',
    NO_RESULTS: 'card-navigator-search-no-results',
    LOADING: 'card-navigator-search-loading',
    ERROR: 'card-navigator-search-error',
    MATCH: 'card-navigator-search-match',
    MATCH_TYPE_PREFIX: 'card-navigator-search-match-',
  },
};

/**
 * 검색 결과 일치 타입별 CSS 클래스
 */
export const SEARCH_MATCH_TYPE_CLASSES = {
  TITLE: `${SEARCH_UI.CLASSES.MATCH_TYPE_PREFIX}title`,
  HEADER: `${SEARCH_UI.CLASSES.MATCH_TYPE_PREFIX}header`,
  TAG: `${SEARCH_UI.CLASSES.MATCH_TYPE_PREFIX}tag`,
  CONTENT: `${SEARCH_UI.CLASSES.MATCH_TYPE_PREFIX}content`,
  FRONTMATTER: `${SEARCH_UI.CLASSES.MATCH_TYPE_PREFIX}frontmatter`,
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
 * 검색 입력 지연 시간 (밀리초)
 * 검색 제안 디바운스 시간과 동일하게 설정
 */
export const SEARCH_INPUT_DELAY = SEARCH_SUGGESTIONS.DEBOUNCE; 