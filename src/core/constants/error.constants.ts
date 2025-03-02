/**
 * 오류 코드 열거형
 * 애플리케이션에서 발생할 수 있는 오류 코드를 정의합니다.
 */
export enum ErrorCode {
  // 일반 오류
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  ALREADY_INITIALIZED = 'ALREADY_INITIALIZED',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  OPERATION_FAILED = 'OPERATION_FAILED',
  
  // 파일 관련 오류
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_ACCESS_ERROR = 'FILE_ACCESS_ERROR',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  
  // 카드 관련 오류
  CARD_NOT_FOUND = 'CARD_NOT_FOUND',
  CARD_CREATION_ERROR = 'CARD_CREATION_ERROR',
  CARD_UPDATE_ERROR = 'CARD_UPDATE_ERROR',
  CARD_DELETION_ERROR = 'CARD_DELETION_ERROR',
  CARD_INITIALIZATION_ERROR = 'CARD_INITIALIZATION_ERROR',
  CARD_CLICK_ERROR = 'CARD_CLICK_ERROR',
  CARD_CONTEXT_MENU_ERROR = 'CARD_CONTEXT_MENU_ERROR',
  CARD_DRAG_START_ERROR = 'CARD_DRAG_START_ERROR',
  CARD_DRAG_END_ERROR = 'CARD_DRAG_END_ERROR',
  CARD_HOVER_ERROR = 'CARD_HOVER_ERROR',
  CARD_LEAVE_ERROR = 'CARD_LEAVE_ERROR',
  CARD_REFRESH_ERROR = 'CARD_REFRESH_ERROR',
  INVALID_CARD_STATE = 'INVALID_CARD_STATE',
  
  // 카드셋 관련 오류
  CARDSET_NOT_FOUND = 'CARDSET_NOT_FOUND',
  CARDSET_CREATION_ERROR = 'CARDSET_CREATION_ERROR',
  CARDSET_UPDATE_ERROR = 'CARDSET_UPDATE_ERROR',
  CARDSET_LOAD_ERROR = 'CARDSET_LOAD_ERROR',
  CARDSET_REFRESH_ERROR = 'CARDSET_REFRESH_ERROR',
  INVALID_CARDSET_PROVIDER_TYPE = 'INVALID_CARDSET_PROVIDER_TYPE',
  
  // 레이아웃 관련 오류
  LAYOUT_INITIALIZATION_ERROR = 'LAYOUT_INITIALIZATION_ERROR',
  LAYOUT_UPDATE_ERROR = 'LAYOUT_UPDATE_ERROR',
  LAYOUT_CALCULATION_ERROR = 'LAYOUT_CALCULATION_ERROR',
  
  // 설정 관련 오류
  SETTINGS_LOAD_ERROR = 'SETTINGS_LOAD_ERROR',
  SETTINGS_SAVE_ERROR = 'SETTINGS_SAVE_ERROR',
  SETTINGS_MIGRATION_ERROR = 'SETTINGS_MIGRATION_ERROR',
  
  // 프리셋 관련 오류
  PRESET_NOT_FOUND = 'PRESET_NOT_FOUND',
  PRESET_CREATION_ERROR = 'PRESET_CREATION_ERROR',
  PRESET_UPDATE_ERROR = 'PRESET_UPDATE_ERROR',
  PRESET_DELETION_ERROR = 'PRESET_DELETION_ERROR',
  PRESET_IMPORT_ERROR = 'PRESET_IMPORT_ERROR',
  PRESET_EXPORT_ERROR = 'PRESET_EXPORT_ERROR',
  
  // 검색 관련 오류
  SEARCH_ERROR = 'SEARCH_ERROR',
  SEARCH_QUERY_ERROR = 'SEARCH_QUERY_ERROR',
  
  // UI 관련 오류
  RENDER_ERROR = 'RENDER_ERROR',
  COMPONENT_INITIALIZATION_ERROR = 'COMPONENT_INITIALIZATION_ERROR',
  
  // 이벤트 관련 오류
  EVENT_HANDLER_ERROR = 'EVENT_HANDLER_ERROR',
  
  // 성능 관련 오류
  PERFORMANCE_MEASUREMENT_ERROR = 'PERFORMANCE_MEASUREMENT_ERROR'
}

/**
 * 오류 코드 타입
 * 플러그인에서 사용되는 모든 오류 코드를 정의합니다.
 */
export type ErrorCodeType =
  // 일반 오류
  | 'UNKNOWN_ERROR'
  | 'INITIALIZATION_ERROR'
  | 'INVALID_PARAMETER'
  | 'NOT_INITIALIZED'
  | 'ALREADY_INITIALIZED'
  | 'NOT_IMPLEMENTED'
  | 'OPERATION_FAILED'
  
  // 파일 관련 오류
  | 'FILE_NOT_FOUND'
  | 'FILE_ACCESS_DENIED'
  | 'FILE_ALREADY_EXISTS'
  | 'INVALID_FILE_PATH'
  | 'INVALID_FILE_TYPE'
  | 'FILE_ACCESS_ERROR'
  | 'FILE_READ_ERROR'
  | 'FILE_WRITE_ERROR'
  
  // 설정 관련 오류
  | 'SETTINGS_LOAD_ERROR'
  | 'SETTINGS_SAVE_ERROR'
  | 'INVALID_SETTINGS'
  | 'SETTINGS_MIGRATION_ERROR'
  
  // 프리셋 관련 오류
  | 'PRESET_NOT_FOUND'
  | 'PRESET_ALREADY_EXISTS'
  | 'PRESET_LOAD_ERROR'
  | 'PRESET_SAVE_ERROR'
  | 'INVALID_PRESET'
  | 'PRESET_CREATION_ERROR'
  | 'PRESET_UPDATE_ERROR'
  | 'PRESET_DELETION_ERROR'
  | 'PRESET_IMPORT_ERROR'
  | 'PRESET_EXPORT_ERROR'
  
  // 카드셋 관련 오류
  | 'CARDSET_LOAD_ERROR'
  | 'CARDSET_EMPTY'
  | 'INVALID_CARDSET_MODE'
  | 'CARDSET_NOT_FOUND'
  | 'CARDSET_CREATION_ERROR'
  | 'CARDSET_UPDATE_ERROR'
  | 'CARDSET_REFRESH_ERROR'
  | 'INVALID_CARDSET_PROVIDER_TYPE'
  
  // 카드 관련 오류
  | 'CARD_NOT_FOUND'
  | 'CARD_CREATION_ERROR'
  | 'CARD_UPDATE_ERROR'
  | 'CARD_DELETION_ERROR'
  | 'CARD_INITIALIZATION_ERROR'
  | 'CARD_CLICK_ERROR'
  | 'CARD_CONTEXT_MENU_ERROR'
  | 'CARD_DRAG_START_ERROR'
  | 'CARD_DRAG_END_ERROR'
  | 'CARD_HOVER_ERROR'
  | 'CARD_LEAVE_ERROR'
  | 'CARD_REFRESH_ERROR'
  | 'INVALID_CARD_STATE'
  
  // 레이아웃 관련 오류
  | 'LAYOUT_INITIALIZATION_ERROR'
  | 'LAYOUT_UPDATE_ERROR'
  | 'INVALID_LAYOUT_PARAMETERS'
  | 'LAYOUT_CALCULATION_ERROR'
  
  // 검색 관련 오류
  | 'SEARCH_ERROR'
  | 'INVALID_SEARCH_QUERY'
  | 'SEARCH_QUERY_ERROR'
  
  // 렌더링 관련 오류
  | 'RENDER_ERROR'
  | 'MARKDOWN_RENDER_ERROR'
  | 'COMPONENT_INITIALIZATION_ERROR'
  
  // API 관련 오류
  | 'API_ERROR'
  | 'OBSIDIAN_API_ERROR'
  
  // 이벤트 관련 오류
  | 'EVENT_HANDLER_ERROR'
  
  // 성능 관련 오류
  | 'PERFORMANCE_MEASUREMENT_ERROR';

/**
 * 오류 메시지 맵
 * 각 오류 코드에 대한 메시지 템플릿을 정의합니다.
 * 중괄호({})로 둘러싸인 부분은 매개변수로 대체됩니다.
 */
export const ERROR_MESSAGES: Record<ErrorCodeType, string> = {
  // 일반 오류
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
  INITIALIZATION_ERROR: '플러그인 초기화 중 오류가 발생했습니다: {message}',
  INVALID_PARAMETER: '잘못된 매개변수: {param}',
  NOT_INITIALIZED: '초기화되지 않은 상태에서 작업을 시도했습니다.',
  ALREADY_INITIALIZED: '이미 초기화된 상태에서 초기화를 시도했습니다.',
  NOT_IMPLEMENTED: '아직 구현되지 않은 기능입니다: {feature}',
  OPERATION_FAILED: '작업 실패: {message}',
  
  // 파일 관련 오류
  FILE_NOT_FOUND: '파일을 찾을 수 없습니다: {path}',
  FILE_ACCESS_DENIED: '파일 접근이 거부되었습니다: {path}',
  FILE_ALREADY_EXISTS: '파일이 이미 존재합니다: {path}',
  INVALID_FILE_PATH: '잘못된 파일 경로: {path}',
  INVALID_FILE_TYPE: '지원되지 않는 파일 유형: {type}',
  FILE_ACCESS_ERROR: '파일 접근 중 오류가 발생했습니다: {path}',
  FILE_READ_ERROR: '파일 읽기 중 오류가 발생했습니다: {path}',
  FILE_WRITE_ERROR: '파일 쓰기 중 오류가 발생했습니다: {path}',
  
  // 설정 관련 오류
  SETTINGS_LOAD_ERROR: '설정을 불러오는 중 오류가 발생했습니다: {message}',
  SETTINGS_SAVE_ERROR: '설정을 저장하는 중 오류가 발생했습니다: {message}',
  INVALID_SETTINGS: '잘못된 설정 값: {setting}',
  SETTINGS_MIGRATION_ERROR: '설정 마이그레이션 중 오류가 발생했습니다: {message}',
  
  // 프리셋 관련 오류
  PRESET_NOT_FOUND: '프리셋을 찾을 수 없습니다: {name}',
  PRESET_ALREADY_EXISTS: '프리셋이 이미 존재합니다: {name}',
  PRESET_LOAD_ERROR: '프리셋을 불러오는 중 오류가 발생했습니다: {message}',
  PRESET_SAVE_ERROR: '프리셋을 저장하는 중 오류가 발생했습니다: {message}',
  INVALID_PRESET: '잘못된 프리셋 데이터: {message}',
  PRESET_CREATION_ERROR: '프리셋 생성 중 오류가 발생했습니다: {message}',
  PRESET_UPDATE_ERROR: '프리셋 업데이트 중 오류가 발생했습니다: {message}',
  PRESET_DELETION_ERROR: '프리셋 삭제 중 오류가 발생했습니다: {name}',
  PRESET_IMPORT_ERROR: '프리셋 가져오기 중 오류가 발생했습니다: {message}',
  PRESET_EXPORT_ERROR: '프리셋 내보내기 중 오류가 발생했습니다: {message}',
  
  // 카드셋 관련 오류
  CARDSET_LOAD_ERROR: '카드셋을 불러오는 중 오류가 발생했습니다: {message}',
  CARDSET_EMPTY: '카드셋이 비어 있습니다.',
  INVALID_CARDSET_MODE: '잘못된 카드셋 모드: {mode}',
  CARDSET_NOT_FOUND: '카드셋을 찾을 수 없습니다: {id}',
  CARDSET_CREATION_ERROR: '카드셋 생성 중 오류가 발생했습니다: {message}',
  CARDSET_UPDATE_ERROR: '카드셋 업데이트 중 오류가 발생했습니다: {message}',
  CARDSET_REFRESH_ERROR: '카드셋 새로고침 중 오류가 발생했습니다: {message}',
  INVALID_CARDSET_PROVIDER_TYPE: '잘못된 카드셋 제공자 유형: {type}',
  
  // 카드 관련 오류
  CARD_NOT_FOUND: '카드를 찾을 수 없습니다: {id}',
  CARD_CREATION_ERROR: '카드 생성 중 오류가 발생했습니다: {message}',
  CARD_UPDATE_ERROR: '카드 업데이트 중 오류가 발생했습니다: {message}',
  CARD_DELETION_ERROR: '카드 삭제 중 오류가 발생했습니다: {id}',
  CARD_INITIALIZATION_ERROR: '카드 초기화 중 오류가 발생했습니다: {message}',
  CARD_CLICK_ERROR: '카드 클릭 처리 중 오류가 발생했습니다: {message}',
  CARD_CONTEXT_MENU_ERROR: '카드 컨텍스트 메뉴 처리 중 오류가 발생했습니다: {message}',
  CARD_DRAG_START_ERROR: '카드 드래그 시작 중 오류가 발생했습니다: {message}',
  CARD_DRAG_END_ERROR: '카드 드래그 종료 중 오류가 발생했습니다: {message}',
  CARD_HOVER_ERROR: '카드 호버 처리 중 오류가 발생했습니다: {message}',
  CARD_LEAVE_ERROR: '카드 리브 처리 중 오류가 발생했습니다: {message}',
  CARD_REFRESH_ERROR: '카드 새로고침 중 오류가 발생했습니다: {message}',
  INVALID_CARD_STATE: '잘못된 카드 상태: {state}',
  
  // 레이아웃 관련 오류
  LAYOUT_INITIALIZATION_ERROR: '레이아웃 초기화 중 오류가 발생했습니다: {message}',
  LAYOUT_UPDATE_ERROR: '레이아웃 업데이트 중 오류가 발생했습니다: {message}',
  INVALID_LAYOUT_PARAMETERS: '잘못된 레이아웃 매개변수: {param}',
  LAYOUT_CALCULATION_ERROR: '레이아웃 계산 중 오류가 발생했습니다: {message}',
  
  // 검색 관련 오류
  SEARCH_ERROR: '검색 중 오류가 발생했습니다: {message}',
  INVALID_SEARCH_QUERY: '잘못된 검색 쿼리: {query}',
  SEARCH_QUERY_ERROR: '검색 쿼리 처리 중 오류가 발생했습니다: {message}',
  
  // 렌더링 관련 오류
  RENDER_ERROR: '렌더링 중 오류가 발생했습니다: {message}',
  MARKDOWN_RENDER_ERROR: '마크다운 렌더링 중 오류가 발생했습니다: {message}',
  COMPONENT_INITIALIZATION_ERROR: '컴포넌트 초기화 중 오류가 발생했습니다: {message}',
  
  // API 관련 오류
  API_ERROR: 'API 오류: {message}',
  OBSIDIAN_API_ERROR: 'Obsidian API 오류: {message}',
  
  // 이벤트 관련 오류
  EVENT_HANDLER_ERROR: '이벤트 핸들러 오류: {message}',
  
  // 성능 관련 오류
  PERFORMANCE_MEASUREMENT_ERROR: '성능 측정 중 오류가 발생했습니다: {message}'
};

/**
 * 오류 심각도 열거형
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * 오류 코드별 심각도
 */
export const ERROR_SEVERITIES: Record<ErrorCodeType, ErrorSeverity> = {
  // 일반 오류
  UNKNOWN_ERROR: ErrorSeverity.ERROR,
  INITIALIZATION_ERROR: ErrorSeverity.CRITICAL,
  INVALID_PARAMETER: ErrorSeverity.ERROR,
  NOT_INITIALIZED: ErrorSeverity.ERROR,
  ALREADY_INITIALIZED: ErrorSeverity.WARNING,
  NOT_IMPLEMENTED: ErrorSeverity.WARNING,
  OPERATION_FAILED: ErrorSeverity.ERROR,
  
  // 파일 관련 오류
  FILE_NOT_FOUND: ErrorSeverity.WARNING,
  FILE_ACCESS_DENIED: ErrorSeverity.ERROR,
  FILE_ALREADY_EXISTS: ErrorSeverity.ERROR,
  INVALID_FILE_PATH: ErrorSeverity.ERROR,
  INVALID_FILE_TYPE: ErrorSeverity.ERROR,
  FILE_ACCESS_ERROR: ErrorSeverity.ERROR,
  FILE_READ_ERROR: ErrorSeverity.ERROR,
  FILE_WRITE_ERROR: ErrorSeverity.ERROR,
  
  // 설정 관련 오류
  SETTINGS_LOAD_ERROR: ErrorSeverity.ERROR,
  SETTINGS_SAVE_ERROR: ErrorSeverity.ERROR,
  INVALID_SETTINGS: ErrorSeverity.ERROR,
  SETTINGS_MIGRATION_ERROR: ErrorSeverity.WARNING,
  
  // 프리셋 관련 오류
  PRESET_NOT_FOUND: ErrorSeverity.WARNING,
  PRESET_ALREADY_EXISTS: ErrorSeverity.ERROR,
  PRESET_LOAD_ERROR: ErrorSeverity.ERROR,
  PRESET_SAVE_ERROR: ErrorSeverity.ERROR,
  INVALID_PRESET: ErrorSeverity.ERROR,
  PRESET_CREATION_ERROR: ErrorSeverity.ERROR,
  PRESET_UPDATE_ERROR: ErrorSeverity.ERROR,
  PRESET_DELETION_ERROR: ErrorSeverity.ERROR,
  PRESET_IMPORT_ERROR: ErrorSeverity.ERROR,
  PRESET_EXPORT_ERROR: ErrorSeverity.ERROR,
  
  // 카드셋 관련 오류
  CARDSET_LOAD_ERROR: ErrorSeverity.ERROR,
  CARDSET_EMPTY: ErrorSeverity.WARNING,
  INVALID_CARDSET_MODE: ErrorSeverity.ERROR,
  CARDSET_NOT_FOUND: ErrorSeverity.WARNING,
  CARDSET_CREATION_ERROR: ErrorSeverity.ERROR,
  CARDSET_UPDATE_ERROR: ErrorSeverity.ERROR,
  CARDSET_REFRESH_ERROR: ErrorSeverity.WARNING,
  INVALID_CARDSET_PROVIDER_TYPE: ErrorSeverity.ERROR,
  
  // 카드 관련 오류
  CARD_NOT_FOUND: ErrorSeverity.WARNING,
  CARD_CREATION_ERROR: ErrorSeverity.ERROR,
  CARD_UPDATE_ERROR: ErrorSeverity.ERROR,
  CARD_DELETION_ERROR: ErrorSeverity.ERROR,
  CARD_INITIALIZATION_ERROR: ErrorSeverity.ERROR,
  CARD_CLICK_ERROR: ErrorSeverity.WARNING,
  CARD_CONTEXT_MENU_ERROR: ErrorSeverity.WARNING,
  CARD_DRAG_START_ERROR: ErrorSeverity.WARNING,
  CARD_DRAG_END_ERROR: ErrorSeverity.WARNING,
  CARD_HOVER_ERROR: ErrorSeverity.INFO,
  CARD_LEAVE_ERROR: ErrorSeverity.INFO,
  CARD_REFRESH_ERROR: ErrorSeverity.WARNING,
  INVALID_CARD_STATE: ErrorSeverity.ERROR,
  
  // 레이아웃 관련 오류
  LAYOUT_INITIALIZATION_ERROR: ErrorSeverity.ERROR,
  LAYOUT_UPDATE_ERROR: ErrorSeverity.WARNING,
  INVALID_LAYOUT_PARAMETERS: ErrorSeverity.ERROR,
  LAYOUT_CALCULATION_ERROR: ErrorSeverity.ERROR,
  
  // 검색 관련 오류
  SEARCH_ERROR: ErrorSeverity.WARNING,
  INVALID_SEARCH_QUERY: ErrorSeverity.ERROR,
  SEARCH_QUERY_ERROR: ErrorSeverity.ERROR,
  
  // 렌더링 관련 오류
  RENDER_ERROR: ErrorSeverity.ERROR,
  MARKDOWN_RENDER_ERROR: ErrorSeverity.ERROR,
  COMPONENT_INITIALIZATION_ERROR: ErrorSeverity.ERROR,
  
  // API 관련 오류
  API_ERROR: ErrorSeverity.ERROR,
  OBSIDIAN_API_ERROR: ErrorSeverity.ERROR,
  
  // 이벤트 관련 오류
  EVENT_HANDLER_ERROR: ErrorSeverity.ERROR,
  
  // 성능 관련 오류
  PERFORMANCE_MEASUREMENT_ERROR: ErrorSeverity.WARNING
};

/**
 * 오류 표시 지속 시간 (밀리초)
 */
export const ERROR_NOTICE_DURATION: Record<ErrorSeverity, number> = {
  [ErrorSeverity.INFO]: 3000,
  [ErrorSeverity.WARNING]: 5000,
  [ErrorSeverity.ERROR]: 8000,
  [ErrorSeverity.CRITICAL]: 10000
};

/**
 * 오류 로깅 활성화 여부
 */
export const ERROR_LOGGING_ENABLED = true;

/**
 * 오류 보고 활성화 여부
 */
export const ERROR_REPORTING_ENABLED = false;

/**
 * 오류 보고 URL
 */
export const ERROR_REPORTING_URL = 'https://example.com/error-report';

/**
 * 오류 보고 최대 시도 횟수
 */
export const ERROR_REPORTING_MAX_RETRIES = 3;

/**
 * 오류 코드 그룹 타입
 */
export enum ErrorGroup {
  GENERAL = 'general',
  FILE = 'file',
  SETTINGS = 'settings',
  PRESET = 'preset',
  CARDSET = 'cardset',
  LAYOUT = 'layout',
  SEARCH = 'search',
  RENDER = 'render',
  API = 'api'
}

/**
 * 오류 코드별 그룹 매핑
 */
export const ERROR_GROUPS: Record<ErrorCodeType, ErrorGroup> = {
  // 일반 오류
  UNKNOWN_ERROR: ErrorGroup.GENERAL,
  INITIALIZATION_ERROR: ErrorGroup.GENERAL,
  INVALID_PARAMETER: ErrorGroup.GENERAL,
  NOT_INITIALIZED: ErrorGroup.GENERAL,
  ALREADY_INITIALIZED: ErrorGroup.GENERAL,
  NOT_IMPLEMENTED: ErrorGroup.GENERAL,
  OPERATION_FAILED: ErrorGroup.GENERAL,
  
  // 파일 관련 오류
  FILE_NOT_FOUND: ErrorGroup.FILE,
  FILE_ACCESS_DENIED: ErrorGroup.FILE,
  FILE_ALREADY_EXISTS: ErrorGroup.FILE,
  INVALID_FILE_PATH: ErrorGroup.FILE,
  INVALID_FILE_TYPE: ErrorGroup.FILE,
  FILE_ACCESS_ERROR: ErrorGroup.FILE,
  FILE_READ_ERROR: ErrorGroup.FILE,
  FILE_WRITE_ERROR: ErrorGroup.FILE,
  
  // 설정 관련 오류
  SETTINGS_LOAD_ERROR: ErrorGroup.SETTINGS,
  SETTINGS_SAVE_ERROR: ErrorGroup.SETTINGS,
  INVALID_SETTINGS: ErrorGroup.SETTINGS,
  SETTINGS_MIGRATION_ERROR: ErrorGroup.SETTINGS,
  
  // 프리셋 관련 오류
  PRESET_NOT_FOUND: ErrorGroup.PRESET,
  PRESET_ALREADY_EXISTS: ErrorGroup.PRESET,
  PRESET_LOAD_ERROR: ErrorGroup.PRESET,
  PRESET_SAVE_ERROR: ErrorGroup.PRESET,
  INVALID_PRESET: ErrorGroup.PRESET,
  PRESET_CREATION_ERROR: ErrorGroup.PRESET,
  PRESET_UPDATE_ERROR: ErrorGroup.PRESET,
  PRESET_DELETION_ERROR: ErrorGroup.PRESET,
  PRESET_IMPORT_ERROR: ErrorGroup.PRESET,
  PRESET_EXPORT_ERROR: ErrorGroup.PRESET,
  
  // 카드셋 관련 오류
  CARDSET_LOAD_ERROR: ErrorGroup.CARDSET,
  CARDSET_EMPTY: ErrorGroup.CARDSET,
  INVALID_CARDSET_MODE: ErrorGroup.CARDSET,
  CARDSET_NOT_FOUND: ErrorGroup.CARDSET,
  CARDSET_CREATION_ERROR: ErrorGroup.CARDSET,
  CARDSET_UPDATE_ERROR: ErrorGroup.CARDSET,
  CARDSET_REFRESH_ERROR: ErrorGroup.CARDSET,
  INVALID_CARDSET_PROVIDER_TYPE: ErrorGroup.CARDSET,
  
  // 카드 관련 오류
  CARD_NOT_FOUND: ErrorGroup.CARDSET,
  CARD_CREATION_ERROR: ErrorGroup.CARDSET,
  CARD_UPDATE_ERROR: ErrorGroup.CARDSET,
  CARD_DELETION_ERROR: ErrorGroup.CARDSET,
  CARD_INITIALIZATION_ERROR: ErrorGroup.CARDSET,
  CARD_CLICK_ERROR: ErrorGroup.CARDSET,
  CARD_CONTEXT_MENU_ERROR: ErrorGroup.CARDSET,
  CARD_DRAG_START_ERROR: ErrorGroup.CARDSET,
  CARD_DRAG_END_ERROR: ErrorGroup.CARDSET,
  CARD_HOVER_ERROR: ErrorGroup.CARDSET,
  CARD_LEAVE_ERROR: ErrorGroup.CARDSET,
  CARD_REFRESH_ERROR: ErrorGroup.CARDSET,
  INVALID_CARD_STATE: ErrorGroup.CARDSET,
  
  // 레이아웃 관련 오류
  LAYOUT_INITIALIZATION_ERROR: ErrorGroup.LAYOUT,
  LAYOUT_UPDATE_ERROR: ErrorGroup.LAYOUT,
  INVALID_LAYOUT_PARAMETERS: ErrorGroup.LAYOUT,
  LAYOUT_CALCULATION_ERROR: ErrorGroup.LAYOUT,
  
  // 검색 관련 오류
  SEARCH_ERROR: ErrorGroup.SEARCH,
  INVALID_SEARCH_QUERY: ErrorGroup.SEARCH,
  SEARCH_QUERY_ERROR: ErrorGroup.SEARCH,
  
  // 렌더링 관련 오류
  RENDER_ERROR: ErrorGroup.RENDER,
  MARKDOWN_RENDER_ERROR: ErrorGroup.RENDER,
  COMPONENT_INITIALIZATION_ERROR: ErrorGroup.RENDER,
  
  // API 관련 오류
  API_ERROR: ErrorGroup.API,
  OBSIDIAN_API_ERROR: ErrorGroup.API,
  
  // 이벤트 관련 오류
  EVENT_HANDLER_ERROR: ErrorGroup.GENERAL,
  
  // 성능 관련 오류
  PERFORMANCE_MEASUREMENT_ERROR: ErrorGroup.GENERAL
}; 