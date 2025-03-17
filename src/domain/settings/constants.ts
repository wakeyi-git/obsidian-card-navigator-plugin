/**
 * 설정 도메인 상수
 */
export const SettingsConstants = {
  /**
   * 카드 크기 관련 상수
   */
  CARD: {
    MIN_WIDTH: 100,
    MAX_WIDTH: 500,
    MIN_HEIGHT: 100,
    MAX_HEIGHT: 400,
    DEFAULT_WIDTH: 250,
    DEFAULT_HEIGHT: 150,
  },

  /**
   * 폰트 크기 관련 상수
   */
  FONT: {
    MIN_SIZE: 8,
    MAX_SIZE: 32,
    DEFAULT_HEADER_SIZE: 16,
    DEFAULT_BODY_SIZE: 14,
    DEFAULT_FOOTER_SIZE: 12,
  },

  /**
   * 검색 관련 상수
   */
  SEARCH: {
    MAX_RESULTS: 100,
    MAX_HISTORY: 10,
  },

  /**
   * 레이아웃 관련 상수
   */
  LAYOUT: {
    MIN_CARD_GAP: 5,
    MAX_CARD_GAP: 50,
    DEFAULT_CARD_GAP: 10,
    MIN_PADDING: 5,
    MAX_PADDING: 50,
    DEFAULT_PADDING: 10,
    MIN_CARD_SIZE_FACTOR: 0.5,
    MAX_CARD_SIZE_FACTOR: 2.0,
    DEFAULT_CARD_SIZE_FACTOR: 1.0,
  },

  /**
   * 콘텐츠 관련 상수
   */
  CONTENT: {
    MAX_LENGTH: 200,
    MIN_LENGTH: 10,
  },

  /**
   * 테두리 관련 상수
   */
  BORDER: {
    MIN_WIDTH: 0,
    MAX_WIDTH: 10,
    DEFAULT_WIDTH: 1,
    MIN_RADIUS: 0,
    MAX_RADIUS: 20,
    DEFAULT_RADIUS: 5,
  },

  /**
   * 이벤트 타입
   */
  EVENT_TYPES: {
    SETTINGS_UPDATED: 'settings.updated',
    PRESET_LOADED: 'settings.preset.loaded',
    PRESET_UPDATED: 'settings.preset.updated',
    PRESET_DELETED: 'settings.preset.deleted',
  },

  /**
   * 에러 코드
   */
  ERROR_CODES: {
    PRESET_NOT_FOUND: 'PRESET_NOT_FOUND',
    INVALID_SETTINGS: 'INVALID_SETTINGS',
    SAVE_FAILED: 'SETTINGS_SAVE_FAILED',
  },
} as const;

/**
 * 설정 관련 타입 상수
 */
export const SettingsTypeConstants = {
  /**
   * 정렬 타입
   */
  SORT_TYPES: ['filename', 'created', 'modified', 'frontmatter', 'tag', 'folder'] as const,

  /**
   * 정렬 방향
   */
  SORT_DIRECTIONS: ['asc', 'desc'] as const,

  /**
   * 레이아웃 타입
   */
  LAYOUT_TYPES: ['grid', 'masonry'] as const,

  /**
   * 렌더링 모드
   */
  RENDERING_MODES: ['plain', 'markdown', 'html'] as const,

  /**
   * 검색 범위
   */
  SEARCH_SCOPES: ['all', 'current'] as const,

  /**
   * 필터 타입
   */
  FILTER_TYPES: ['tag', 'text', 'frontmatter'] as const,

  /**
   * 필터 연산자
   */
  FILTER_OPERATORS: ['AND', 'OR'] as const,

  /**
   * 선택 모드
   */
  SELECTION_MODES: ['single', 'multiple'] as const,

  /**
   * 드래그 모드
   */
  DRAG_MODES: ['none', 'move', 'copy'] as const,

  /**
   * 더블클릭 액션
   */
  DOUBLE_CLICK_ACTIONS: ['open', 'preview', 'none'] as const,

  /**
   * 우클릭 액션
   */
  RIGHT_CLICK_ACTIONS: ['menu', 'select', 'none'] as const,

  /**
   * 호버 효과
   */
  HOVER_EFFECTS: ['highlight', 'zoom', 'none'] as const,
} as const;

/**
 * 설정 관련 타입 정의
 */
export type SortType = typeof SettingsTypeConstants.SORT_TYPES[number];
export type SortDirection = typeof SettingsTypeConstants.SORT_DIRECTIONS[number];
export type LayoutType = typeof SettingsTypeConstants.LAYOUT_TYPES[number];
export type RenderingMode = typeof SettingsTypeConstants.RENDERING_MODES[number];
export type SearchScope = typeof SettingsTypeConstants.SEARCH_SCOPES[number];
export type FilterType = typeof SettingsTypeConstants.FILTER_TYPES[number];
export type FilterOperator = typeof SettingsTypeConstants.FILTER_OPERATORS[number];
export type SelectionMode = typeof SettingsTypeConstants.SELECTION_MODES[number];
export type DragMode = typeof SettingsTypeConstants.DRAG_MODES[number];
export type DoubleClickAction = typeof SettingsTypeConstants.DOUBLE_CLICK_ACTIONS[number];
export type RightClickAction = typeof SettingsTypeConstants.RIGHT_CLICK_ACTIONS[number];
export type HoverEffect = typeof SettingsTypeConstants.HOVER_EFFECTS[number]; 