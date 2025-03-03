/**
 * 오류 관리 상수 및 타입 정의
 * 
 * 이 파일은 애플리케이션에서 사용되는 모든 오류 코드와 관련 정보를 정의합니다.
 * 오류 코드는 단일 소스(ErrorCode 열거형)에서 관리되며, 
 * 각 오류에 대한 메시지, 심각도, 그룹 정보는 통합된 ERROR_INFO 객체에서 관리됩니다.
 */

/**
 * 오류 코드 열거형
 * 애플리케이션에서 발생할 수 있는 모든 오류 코드를 정의합니다.
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
  TIMEOUT = 'TIMEOUT',
  INVALID_STATE = 'INVALID_STATE',
  
  // 서비스 관련 오류
  SERVICE_INITIALIZATION_ERROR = 'SERVICE_INITIALIZATION_ERROR',
  SERVICE_DESTROY_ERROR = 'SERVICE_DESTROY_ERROR',
  SERVICE_NOT_INITIALIZED = 'SERVICE_NOT_INITIALIZED',
  SERVICE_ALREADY_INITIALIZED = 'SERVICE_ALREADY_INITIALIZED',
  SERVICE_DEPENDENCY_ERROR = 'SERVICE_DEPENDENCY_ERROR',
  
  // 파일 관련 오류
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_ACCESS_ERROR = 'FILE_ACCESS_ERROR',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  FILE_DELETE_ERROR = 'FILE_DELETE_ERROR',
  FILE_RENAME_ERROR = 'FILE_RENAME_ERROR',
  FILE_MOVE_ERROR = 'FILE_MOVE_ERROR',
  FILE_COPY_ERROR = 'FILE_COPY_ERROR',
  INVALID_FILE_PATH = 'INVALID_FILE_PATH',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',
  FILE_ALREADY_EXISTS = 'FILE_ALREADY_EXISTS',
  
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
  CARD_DRAG_OVER_ERROR = 'CARD_DRAG_OVER_ERROR',
  CARD_DROP_ERROR = 'CARD_DROP_ERROR',
  CARD_HOVER_ERROR = 'CARD_HOVER_ERROR',
  CARD_LEAVE_ERROR = 'CARD_LEAVE_ERROR',
  CARD_KEY_DOWN_ERROR = 'CARD_KEY_DOWN_ERROR',
  CARD_FOCUS_ERROR = 'CARD_FOCUS_ERROR',
  CARD_BLUR_ERROR = 'CARD_BLUR_ERROR',
  CARD_DOUBLE_CLICK_ERROR = 'CARD_DOUBLE_CLICK_ERROR',
  CARD_SELECTION_ERROR = 'CARD_SELECTION_ERROR',
  CARD_STATE_UPDATE_ERROR = 'CARD_STATE_UPDATE_ERROR',
  CARD_STATE_RESET_ERROR = 'CARD_STATE_RESET_ERROR',
  CARD_INTERACTION_SETUP_ERROR = 'CARD_INTERACTION_SETUP_ERROR',
  CARD_INTERACTION_REMOVE_ERROR = 'CARD_INTERACTION_REMOVE_ERROR',
  CARD_INTERACTION_ERROR = 'CARD_INTERACTION_ERROR',
  CARD_REFRESH_ERROR = 'CARD_REFRESH_ERROR',
  CARD_DESTROY_ERROR = 'CARD_DESTROY_ERROR',
  SETUP_DRAG_DROP_ERROR = 'SETUP_DRAG_DROP_ERROR',
  SETUP_HOVER_EFFECTS_ERROR = 'SETUP_HOVER_EFFECTS_ERROR',
  SETUP_KEYBOARD_INTERACTIONS_ERROR = 'SETUP_KEYBOARD_INTERACTIONS_ERROR',
  OPEN_CARD_FILE_ERROR = 'OPEN_CARD_FILE_ERROR',
  EMIT_CARD_EVENT_ERROR = 'EMIT_CARD_EVENT_ERROR',
  INVALID_CARD_STATE = 'INVALID_CARD_STATE',
  
  // 카드셋 관련 오류
  CARDSET_NOT_FOUND = 'CARDSET_NOT_FOUND',
  CARDSET_CREATION_ERROR = 'CARDSET_CREATION_ERROR',
  CARDSET_UPDATE_ERROR = 'CARDSET_UPDATE_ERROR',
  CARDSET_LOAD_ERROR = 'CARDSET_LOAD_ERROR',
  CARDSET_REFRESH_ERROR = 'CARDSET_REFRESH_ERROR',
  CARDSET_EMPTY = 'CARDSET_EMPTY',
  INVALID_CARDSET_MODE = 'INVALID_CARDSET_MODE',
  INVALID_CARDSET_PROVIDER_TYPE = 'INVALID_CARDSET_PROVIDER_TYPE',
  
  // 레이아웃 관련 오류
  LAYOUT_INITIALIZATION_ERROR = 'LAYOUT_INITIALIZATION_ERROR',
  LAYOUT_UPDATE_ERROR = 'LAYOUT_UPDATE_ERROR',
  LAYOUT_CALCULATION_ERROR = 'LAYOUT_CALCULATION_ERROR',
  LAYOUT_TYPE_DETERMINATION_ERROR = 'LAYOUT_TYPE_DETERMINATION_ERROR',
  LAYOUT_RESIZE_ERROR = 'LAYOUT_RESIZE_ERROR',
  LAYOUT_OPTIONS_UPDATE_ERROR = 'LAYOUT_OPTIONS_UPDATE_ERROR',
  LAYOUT_DESTROY_ERROR = 'LAYOUT_DESTROY_ERROR',
  INVALID_LAYOUT_PARAMETERS = 'INVALID_LAYOUT_PARAMETERS',
  
  // 설정 관련 오류
  SETTINGS_LOAD_ERROR = 'SETTINGS_LOAD_ERROR',
  SETTINGS_SAVE_ERROR = 'SETTINGS_SAVE_ERROR',
  SETTINGS_VALIDATION_ERROR = 'SETTINGS_VALIDATION_ERROR',
  SETTINGS_MIGRATION_ERROR = 'SETTINGS_MIGRATION_ERROR',
  INVALID_SETTINGS = 'INVALID_SETTINGS',
  SETTINGS_UPDATE_ERROR = 'SETTINGS_UPDATE_ERROR',
  SETTINGS_RESET_ERROR = 'SETTINGS_RESET_ERROR',
  CALLBACK_EXECUTION_ERROR = 'CALLBACK_EXECUTION_ERROR',
  SETTINGS_APPLY_ERROR = 'SETTINGS_APPLY_ERROR',
  
  // 프리셋 관련 오류
  PRESET_NOT_FOUND = 'PRESET_NOT_FOUND',
  PRESET_ALREADY_EXISTS = 'PRESET_ALREADY_EXISTS',
  PRESET_CREATION_ERROR = 'PRESET_CREATION_ERROR',
  PRESET_UPDATE_ERROR = 'PRESET_UPDATE_ERROR',
  PRESET_DELETE_ERROR = 'PRESET_DELETE_ERROR',
  PRESET_APPLY_ERROR = 'PRESET_APPLY_ERROR',
  PRESET_IMPORT_ERROR = 'PRESET_IMPORT_ERROR',
  PRESET_EXPORT_ERROR = 'PRESET_EXPORT_ERROR',
  PRESET_SETTINGS_GET_ERROR = 'PRESET_SETTINGS_GET_ERROR',
  PRESET_MANAGER_INITIALIZATION_ERROR = 'PRESET_MANAGER_INITIALIZATION_ERROR',
  PRESET_AUTO_APPLY_ERROR = 'PRESET_AUTO_APPLY_ERROR',
  PRESET_PRIORITY_ORDER_ERROR = 'PRESET_PRIORITY_ORDER_ERROR',
  PRESET_CONFLICT_RESOLUTION_ERROR = 'PRESET_CONFLICT_RESOLUTION_ERROR',
  PRESET_LOAD_ERROR = 'PRESET_LOAD_ERROR',
  PRESET_SAVE_ERROR = 'PRESET_SAVE_ERROR',
  INVALID_PRESET = 'INVALID_PRESET',
  PRESET_DELETION_ERROR = 'PRESET_DELETION_ERROR',
  PRESET_SELECTION_ERROR = 'PRESET_SELECTION_ERROR',
  PRESET_TARGET_SAVE_ERROR = 'PRESET_TARGET_SAVE_ERROR',
  
  // 검색 관련 오류
  SEARCH_ERROR = 'SEARCH_ERROR',
  SEARCH_QUERY_ERROR = 'SEARCH_QUERY_ERROR',
  SEARCH_RESULT_ERROR = 'SEARCH_RESULT_ERROR',
  SEARCH_FILTER_ERROR = 'SEARCH_FILTER_ERROR',
  SEARCH_SORT_ERROR = 'SEARCH_SORT_ERROR',
  SEARCH_HIGHLIGHT_ERROR = 'SEARCH_HIGHLIGHT_ERROR',
  INVALID_SEARCH_QUERY = 'INVALID_SEARCH_QUERY',
  
  // UI 관련 오류
  RENDER_ERROR = 'RENDER_ERROR',
  COMPONENT_INITIALIZATION_ERROR = 'COMPONENT_INITIALIZATION_ERROR',
  UI_RENDER_ERROR = 'UI_RENDER_ERROR',
  UI_UPDATE_ERROR = 'UI_UPDATE_ERROR',
  UI_EVENT_ERROR = 'UI_EVENT_ERROR',
  MODAL_ERROR = 'MODAL_ERROR',
  NOTICE_ERROR = 'NOTICE_ERROR',
  MENU_ERROR = 'MENU_ERROR',
  MARKDOWN_RENDER_ERROR = 'MARKDOWN_RENDER_ERROR',

  // API 관련 오류
  API_ERROR = 'API_ERROR',
  OBSIDIAN_API_ERROR = 'OBSIDIAN_API_ERROR',
  
  // 이벤트 관련 오류
  EVENT_HANDLER_ERROR = 'EVENT_HANDLER_ERROR',
  EVENT_LISTENER_ERROR = 'EVENT_LISTENER_ERROR',
  EVENT_DISPATCH_ERROR = 'EVENT_DISPATCH_ERROR',
  INVALID_EVENT_TYPE = 'INVALID_EVENT_TYPE',
  EVENT_LISTENER_ADD_ERROR = 'EVENT_LISTENER_ADD_ERROR',
  EVENT_LISTENER_REMOVE_ERROR = 'EVENT_LISTENER_REMOVE_ERROR',
  EVENT_LISTENER_EXECUTION_ERROR = 'EVENT_LISTENER_EXECUTION_ERROR',
  
  // 성능 관련 오류
  PERFORMANCE_MEASUREMENT_ERROR = 'PERFORMANCE_MEASUREMENT_ERROR',
  
  // 태그 프리셋 관련 에러 코드
  TAG_PRESET_NOT_FOUND = 'TAG_PRESET_NOT_FOUND',
  TAG_PRESET_ALREADY_EXISTS = 'TAG_PRESET_ALREADY_EXISTS',
  TAG_PRESET_CREATION_ERROR = 'TAG_PRESET_CREATION_ERROR',
  TAG_PRESET_UPDATE_ERROR = 'TAG_PRESET_UPDATE_ERROR',
  TAG_PRESET_DELETE_ERROR = 'TAG_PRESET_DELETE_ERROR',
  TAG_PRESET_APPLY_ERROR = 'TAG_PRESET_APPLY_ERROR',
  TAG_PRESET_ASSIGNMENT_ERROR = 'TAG_PRESET_ASSIGNMENT_ERROR',
  TAG_PRESET_UNASSIGNMENT_ERROR = 'TAG_PRESET_UNASSIGNMENT_ERROR',
  TAG_PRESET_RETRIEVAL_ERROR = 'TAG_PRESET_RETRIEVAL_ERROR',
  TAG_PRESET_PRIORITY_ERROR = 'TAG_PRESET_PRIORITY_ERROR',
  TAG_PRESET_PRIORITY_RETRIEVAL_ERROR = 'TAG_PRESET_PRIORITY_RETRIEVAL_ERROR',
  TAG_PRESET_SELECTION_ERROR = 'TAG_PRESET_SELECTION_ERROR',
  TAG_PRESET_ID_CHANGE_ERROR = 'TAG_PRESET_ID_CHANGE_ERROR',
  TAG_PRESET_ACTIVE_FILE_CHANGE_ERROR = 'TAG_PRESET_ACTIVE_FILE_CHANGE_ERROR',
  TAG_PRESET_CHANGED_ERROR = 'TAG_PRESET_CHANGED_ERROR',
  TAG_PRESET_REMOVED_ERROR = 'TAG_PRESET_REMOVED_ERROR',
  TAG_PRESET_GET_FILE_TAGS_ERROR = 'TAG_PRESET_GET_FILE_TAGS_ERROR',
  TAG_PRESET_SET_ERROR = 'TAG_PRESET_SET_ERROR',
  TAG_PRESET_REMOVE_ERROR = 'TAG_PRESET_REMOVE_ERROR',
  FILE_TAGS_RETRIEVAL_ERROR = 'FILE_TAGS_RETRIEVAL_ERROR',
  TAG_PRESET_MANAGER_INITIALIZATION_ERROR = 'TAG_PRESET_MANAGER_INITIALIZATION_ERROR',
  TAG_PRESET_INVALID_TAG = 'TAG_PRESET_INVALID_TAG',
  
  // 폴더 프리셋 관련 에러 코드
  FOLDER_PRESET_NOT_FOUND = 'FOLDER_PRESET_NOT_FOUND',
  FOLDER_PRESET_ALREADY_EXISTS = 'FOLDER_PRESET_ALREADY_EXISTS',
  FOLDER_PRESET_CREATION_ERROR = 'FOLDER_PRESET_CREATION_ERROR',
  FOLDER_PRESET_UPDATE_ERROR = 'FOLDER_PRESET_UPDATE_ERROR',
  FOLDER_PRESET_DELETE_ERROR = 'FOLDER_PRESET_DELETE_ERROR',
  FOLDER_PRESET_APPLY_ERROR = 'FOLDER_PRESET_APPLY_ERROR',
  FOLDER_PRESET_ASSIGNMENT_ERROR = 'FOLDER_PRESET_ASSIGNMENT_ERROR',
  FOLDER_PRESET_UNASSIGNMENT_ERROR = 'FOLDER_PRESET_UNASSIGNMENT_ERROR',
  FOLDER_PRESET_RETRIEVAL_ERROR = 'FOLDER_PRESET_RETRIEVAL_ERROR',
  FOLDER_PRESET_PRIORITY_ERROR = 'FOLDER_PRESET_PRIORITY_ERROR',
  FOLDER_PRESET_PRIORITY_RETRIEVAL_ERROR = 'FOLDER_PRESET_PRIORITY_RETRIEVAL_ERROR',
  FOLDER_PRESET_SELECTION_ERROR = 'FOLDER_PRESET_SELECTION_ERROR',
  FOLDER_PRESET_MANAGER_INITIALIZATION_ERROR = 'FOLDER_PRESET_MANAGER_INITIALIZATION_ERROR',
  FOLDER_PRESET_IN_USE_CHECK_ERROR = 'FOLDER_PRESET_IN_USE_CHECK_ERROR',
  FOLDER_PRESET_USAGE_RETRIEVAL_ERROR = 'FOLDER_PRESET_USAGE_RETRIEVAL_ERROR',
  FOLDER_PRESET_INVALID_PATH = 'FOLDER_PRESET_INVALID_PATH',
  FOLDER_PRESET_SET_ERROR = 'FOLDER_PRESET_SET_ERROR',
  FOLDER_PRESET_REMOVE_ERROR = 'FOLDER_PRESET_REMOVE_ERROR',
  FOLDER_PRESET_AUTO_APPLY_ERROR = 'FOLDER_PRESET_AUTO_APPLY_ERROR',
  FOLDER_PRESET_REMOVED_ERROR = 'FOLDER_PRESET_REMOVED_ERROR',
}

/**
 * ErrorCode 열거형에서 타입 추출
 * 이 방식으로 ErrorCodeType은 항상 ErrorCode와 일치하게 됩니다.
 */
export type ErrorCodeType = keyof typeof ErrorCode;

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
 * 오류 그룹 열거형
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
 * 오류 정보 인터페이스
 * 각 오류 코드에 대한 메시지, 심각도, 그룹 정보를 포함합니다.
 */
interface ErrorInfo {
  message: string;
  severity: ErrorSeverity;
  group: ErrorGroup;
}

/**
 * 모든 오류 정보를 통합 관리하는 객체
 * 각 오류 코드에 대한 메시지, 심각도, 그룹 정보를 포함합니다.
 */
export const ERROR_INFO: Record<ErrorCodeType, ErrorInfo> = {
  // 일반 오류
  [ErrorCode.UNKNOWN_ERROR]: {
    message: '알 수 없는 오류가 발생했습니다.',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.INITIALIZATION_ERROR]: {
    message: '플러그인 초기화 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.CRITICAL,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.INVALID_PARAMETER]: {
    message: '잘못된 매개변수: {param}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.NOT_INITIALIZED]: {
    message: '초기화되지 않은 상태에서 작업을 시도했습니다.',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.ALREADY_INITIALIZED]: {
    message: '이미 초기화된 상태에서 초기화를 시도했습니다.',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.NOT_IMPLEMENTED]: {
    message: '아직 구현되지 않은 기능입니다: {feature}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.OPERATION_FAILED]: {
    message: '작업 실패: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.TIMEOUT]: {
    message: '작업이 타임아웃되었습니다.',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.INVALID_STATE]: {
    message: '잘못된 상태에서 작업을 시도했습니다.',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  
  // 서비스 관련 오류
  [ErrorCode.SERVICE_INITIALIZATION_ERROR]: {
    message: '서비스 초기화 중 오류가 발생했습니다: {service}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.SERVICE_DESTROY_ERROR]: {
    message: '서비스 종료 중 오류가 발생했습니다: {service}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.SERVICE_NOT_INITIALIZED]: {
    message: '초기화되지 않은 서비스에 접근했습니다: {service}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.SERVICE_ALREADY_INITIALIZED]: {
    message: '이미 초기화된 서비스를 다시 초기화하려고 했습니다: {service}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.SERVICE_DEPENDENCY_ERROR]: {
    message: '서비스 의존성 오류: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  
  // 파일 관련 오류
  [ErrorCode.FILE_NOT_FOUND]: {
    message: '파일을 찾을 수 없습니다: {path}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.FILE
  },
  [ErrorCode.FILE_ACCESS_ERROR]: {
    message: '파일 접근 중 오류가 발생했습니다: {path}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.FILE
  },
  [ErrorCode.FILE_READ_ERROR]: {
    message: '파일 읽기 중 오류가 발생했습니다: {path}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.FILE
  },
  [ErrorCode.FILE_WRITE_ERROR]: {
    message: '파일 쓰기 중 오류가 발생했습니다: {path}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.FILE
  },
  [ErrorCode.FILE_DELETE_ERROR]: {
    message: '파일 삭제 중 오류가 발생했습니다: {path}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.FILE
  },
  [ErrorCode.FILE_RENAME_ERROR]: {
    message: '파일 이름 변경 중 오류가 발생했습니다: {path}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.FILE
  },
  [ErrorCode.FILE_MOVE_ERROR]: {
    message: '파일 이동 중 오류가 발생했습니다: {path}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.FILE
  },
  [ErrorCode.FILE_COPY_ERROR]: {
    message: '파일 복사 중 오류가 발생했습니다: {path}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.FILE
  },
  [ErrorCode.INVALID_FILE_PATH]: {
    message: '잘못된 파일 경로입니다: {path}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.FILE
  },
  [ErrorCode.INVALID_FILE_TYPE]: {
    message: '지원되지 않는 파일 유형입니다: {type}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.FILE
  },
  [ErrorCode.FILE_ACCESS_DENIED]: {
    message: '파일 접근이 거부되었습니다: {path}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.FILE
  },
  [ErrorCode.FILE_ALREADY_EXISTS]: {
    message: '파일이 이미 존재합니다: {path}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.FILE
  },
  
  // 카드 관련 오류
  [ErrorCode.CARD_NOT_FOUND]: {
    message: '카드를 찾을 수 없습니다: {id}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_CREATION_ERROR]: {
    message: '카드 생성 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_UPDATE_ERROR]: {
    message: '카드 업데이트 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_DELETION_ERROR]: {
    message: '카드 삭제 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_INITIALIZATION_ERROR]: {
    message: '카드 초기화 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_CLICK_ERROR]: {
    message: '카드 클릭 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_CONTEXT_MENU_ERROR]: {
    message: '카드 컨텍스트 메뉴 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_DRAG_START_ERROR]: {
    message: '카드 드래그 시작 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_DRAG_END_ERROR]: {
    message: '카드 드래그 종료 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_DRAG_OVER_ERROR]: {
    message: '카드 드래그 오버 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_DROP_ERROR]: {
    message: '카드 드롭 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_HOVER_ERROR]: {
    message: '카드 호버 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_LEAVE_ERROR]: {
    message: '카드 리브 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_KEY_DOWN_ERROR]: {
    message: '카드 키 다운 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_FOCUS_ERROR]: {
    message: '카드 포커스 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_BLUR_ERROR]: {
    message: '카드 블러 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_DOUBLE_CLICK_ERROR]: {
    message: '카드 더블 클릭 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_SELECTION_ERROR]: {
    message: '카드 선택 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_STATE_UPDATE_ERROR]: {
    message: '카드 상태 업데이트 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_STATE_RESET_ERROR]: {
    message: '카드 상태 초기화 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_INTERACTION_SETUP_ERROR]: {
    message: '카드 상호작용 설정 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_INTERACTION_REMOVE_ERROR]: {
    message: '카드 상호작용 제거 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_INTERACTION_ERROR]: {
    message: '카드 상호작용 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_REFRESH_ERROR]: {
    message: '카드 새로고침 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARD_DESTROY_ERROR]: {
    message: '카드 제거 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.SETUP_DRAG_DROP_ERROR]: {
    message: '드래그 앤 드롭 설정 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.SETUP_HOVER_EFFECTS_ERROR]: {
    message: '호버 효과 설정 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.SETUP_KEYBOARD_INTERACTIONS_ERROR]: {
    message: '키보드 상호작용 설정 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.OPEN_CARD_FILE_ERROR]: {
    message: '카드 파일 열기 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.EMIT_CARD_EVENT_ERROR]: {
    message: '카드 이벤트 발생 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.INVALID_CARD_STATE]: {
    message: '잘못된 카드 상태입니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  
  // 카드셋 관련 오류
  [ErrorCode.CARDSET_NOT_FOUND]: {
    message: '카드셋을 찾을 수 없습니다: {id}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARDSET_CREATION_ERROR]: {
    message: '카드셋 생성 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARDSET_UPDATE_ERROR]: {
    message: '카드셋 업데이트 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARDSET_LOAD_ERROR]: {
    message: '카드셋 로드 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARDSET_REFRESH_ERROR]: {
    message: '카드셋 새로고침 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.CARDSET_EMPTY]: {
    message: '카드셋이 비어있습니다.',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.INVALID_CARDSET_MODE]: {
    message: '잘못된 카드셋 모드입니다: {mode}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  [ErrorCode.INVALID_CARDSET_PROVIDER_TYPE]: {
    message: '지원되지 않는 카드셋 유형입니다: {type}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.CARDSET
  },
  
  // 레이아웃 관련 오류
  [ErrorCode.LAYOUT_INITIALIZATION_ERROR]: {
    message: '레이아웃 초기화 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.LAYOUT
  },
  [ErrorCode.LAYOUT_UPDATE_ERROR]: {
    message: '레이아웃 업데이트 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.LAYOUT
  },
  [ErrorCode.LAYOUT_CALCULATION_ERROR]: {
    message: '레이아웃 계산 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.LAYOUT
  },
  [ErrorCode.LAYOUT_TYPE_DETERMINATION_ERROR]: {
    message: '레이아웃 유형 결정 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.LAYOUT
  },
  [ErrorCode.LAYOUT_RESIZE_ERROR]: {
    message: '레이아웃 리사이즈 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.LAYOUT
  },
  [ErrorCode.LAYOUT_OPTIONS_UPDATE_ERROR]: {
    message: '레이아웃 옵션 업데이트 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.LAYOUT
  },
  [ErrorCode.LAYOUT_DESTROY_ERROR]: {
    message: '레이아웃 제거 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.LAYOUT
  },
  [ErrorCode.INVALID_LAYOUT_PARAMETERS]: {
    message: '잘못된 레이아웃 매개변수입니다: {parameters}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.LAYOUT
  },
  
  // 설정 관련 오류
  [ErrorCode.SETTINGS_LOAD_ERROR]: {
    message: '설정을 불러오는 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SETTINGS
  },
  [ErrorCode.SETTINGS_SAVE_ERROR]: {
    message: '설정을 저장하는 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SETTINGS
  },
  [ErrorCode.SETTINGS_VALIDATION_ERROR]: {
    message: '설정 유효성 검사 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SETTINGS
  },
  [ErrorCode.SETTINGS_MIGRATION_ERROR]: {
    message: '설정 마이그레이션 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SETTINGS
  },
  [ErrorCode.INVALID_SETTINGS]: {
    message: '잘못된 설정입니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SETTINGS
  },
  [ErrorCode.SETTINGS_UPDATE_ERROR]: {
    message: '설정 업데이트 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SETTINGS
  },
  [ErrorCode.SETTINGS_RESET_ERROR]: {
    message: '설정 초기화 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SETTINGS
  },
  [ErrorCode.CALLBACK_EXECUTION_ERROR]: {
    message: '콜백 실행 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SETTINGS
  },
  [ErrorCode.SETTINGS_APPLY_ERROR]: {
    message: '설정 적용 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SETTINGS
  },
  
  // 프리셋 관련 오류
  [ErrorCode.PRESET_NOT_FOUND]: {
    message: '프리셋을 찾을 수 없습니다: {presetId}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_ALREADY_EXISTS]: {
    message: '프리셋이 이미 존재합니다: {presetId}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_CREATION_ERROR]: {
    message: '프리셋 생성 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_UPDATE_ERROR]: {
    message: '프리셋 업데이트 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_DELETE_ERROR]: {
    message: '프리셋 삭제 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_APPLY_ERROR]: {
    message: '프리셋 적용 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_IMPORT_ERROR]: {
    message: '프리셋 가져오기 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_EXPORT_ERROR]: {
    message: '프리셋 내보내기 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_SETTINGS_GET_ERROR]: {
    message: '프리셋 설정 가져오기 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_MANAGER_INITIALIZATION_ERROR]: {
    message: '프리셋 관리자 초기화 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_AUTO_APPLY_ERROR]: {
    message: '프리셋 자동 적용 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_PRIORITY_ORDER_ERROR]: {
    message: '프리셋 우선순위 순서 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_CONFLICT_RESOLUTION_ERROR]: {
    message: '프리셋 충돌 해결 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_LOAD_ERROR]: {
    message: '프리셋 로드 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_SAVE_ERROR]: {
    message: '프리셋 저장 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.INVALID_PRESET]: {
    message: '잘못된 프리셋입니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_DELETION_ERROR]: {
    message: '프리셋 삭제 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_SELECTION_ERROR]: {
    message: '프리셋 선택 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.PRESET_TARGET_SAVE_ERROR]: {
    message: '프리셋 대상 저장 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  
  // 검색 관련 오류
  [ErrorCode.SEARCH_ERROR]: {
    message: '검색 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.SEARCH
  },
  [ErrorCode.SEARCH_QUERY_ERROR]: {
    message: '검색 쿼리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SEARCH
  },
  [ErrorCode.SEARCH_RESULT_ERROR]: {
    message: '검색 결과 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SEARCH
  },
  [ErrorCode.SEARCH_FILTER_ERROR]: {
    message: '검색 필터 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SEARCH
  },
  [ErrorCode.SEARCH_SORT_ERROR]: {
    message: '검색 정렬 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SEARCH
  },
  [ErrorCode.SEARCH_HIGHLIGHT_ERROR]: {
    message: '검색 하이라이트 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SEARCH
  },
  [ErrorCode.INVALID_SEARCH_QUERY]: {
    message: '잘못된 검색 쿼리입니다: {query}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.SEARCH
  },
  
  // UI 관련 오류
  [ErrorCode.RENDER_ERROR]: {
    message: '렌더링 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.RENDER
  },
  [ErrorCode.COMPONENT_INITIALIZATION_ERROR]: {
    message: '컴포넌트 초기화 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.RENDER
  },
  [ErrorCode.UI_RENDER_ERROR]: {
    message: 'UI 렌더링 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.RENDER
  },
  [ErrorCode.UI_UPDATE_ERROR]: {
    message: 'UI 업데이트 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.RENDER
  },
  [ErrorCode.UI_EVENT_ERROR]: {
    message: 'UI 이벤트 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.RENDER
  },
  [ErrorCode.MODAL_ERROR]: {
    message: '모달 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.RENDER
  },
  [ErrorCode.NOTICE_ERROR]: {
    message: '알림 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.RENDER
  },
  [ErrorCode.MENU_ERROR]: {
    message: '메뉴 처리 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.RENDER
  },
  [ErrorCode.MARKDOWN_RENDER_ERROR]: {
    message: '마크다운 렌더링 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.RENDER
  },
  
  // API 관련 오류
  [ErrorCode.API_ERROR]: {
    message: 'API 오류: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.API
  },
  [ErrorCode.OBSIDIAN_API_ERROR]: {
    message: 'OBSIDIAN API 오류: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.API
  },
  
  // 이벤트 관련 오류
  [ErrorCode.EVENT_HANDLER_ERROR]: {
    message: '이벤트 핸들러 오류: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.EVENT_LISTENER_ERROR]: {
    message: '이벤트 리스너 오류: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.EVENT_DISPATCH_ERROR]: {
    message: '이벤트 디스패치 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.INVALID_EVENT_TYPE]: {
    message: '잘못된 이벤트 유형입니다: {type}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.EVENT_LISTENER_ADD_ERROR]: {
    message: '이벤트 리스너 추가 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.EVENT_LISTENER_REMOVE_ERROR]: {
    message: '이벤트 리스너 제거 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  [ErrorCode.EVENT_LISTENER_EXECUTION_ERROR]: {
    message: '이벤트 리스너 실행 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.GENERAL
  },
  
  // 성능 관련 오류
  [ErrorCode.PERFORMANCE_MEASUREMENT_ERROR]: {
    message: '성능 측정 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.GENERAL
  },
  
  // 태그 프리셋 관련 오류
  [ErrorCode.TAG_PRESET_NOT_FOUND]: {
    message: '태그 프리셋을 찾을 수 없습니다: {tag}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_ALREADY_EXISTS]: {
    message: '태그 프리셋이 이미 존재합니다: {tag}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_CREATION_ERROR]: {
    message: '태그 프리셋 생성 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_UPDATE_ERROR]: {
    message: '태그 프리셋 업데이트 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_DELETE_ERROR]: {
    message: '태그 프리셋 삭제 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_APPLY_ERROR]: {
    message: '태그 프리셋 적용 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_ASSIGNMENT_ERROR]: {
    message: '태그 프리셋 할당 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_UNASSIGNMENT_ERROR]: {
    message: '태그 프리셋 해제 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_RETRIEVAL_ERROR]: {
    message: '태그 프리셋 가져오기 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_PRIORITY_ERROR]: {
    message: '태그 프리셋 우선순위 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_PRIORITY_RETRIEVAL_ERROR]: {
    message: '태그 프리셋 우선순위 가져오기 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_SELECTION_ERROR]: {
    message: '태그 프리셋 선택 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_ID_CHANGE_ERROR]: {
    message: '태그 프리셋 ID 변경 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_ACTIVE_FILE_CHANGE_ERROR]: {
    message: '태그 프리셋 활성 파일 변경 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_CHANGED_ERROR]: {
    message: '태그 프리셋 변경 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_REMOVED_ERROR]: {
    message: '태그 프리셋 제거 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_GET_FILE_TAGS_ERROR]: {
    message: '태그 프리셋 파일 태그 가져오기 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_SET_ERROR]: {
    message: '태그 프리셋 설정 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_REMOVE_ERROR]: {
    message: '태그 프리셋 제거 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FILE_TAGS_RETRIEVAL_ERROR]: {
    message: '파일 태그 가져오기 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.FILE
  },
  [ErrorCode.TAG_PRESET_MANAGER_INITIALIZATION_ERROR]: {
    message: '태그 프리셋 관리자 초기화 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.TAG_PRESET_INVALID_TAG]: {
    message: '잘못된 태그 프리셋입니다: {tag}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  
  // 폴더 프리셋 관련 오류
  [ErrorCode.FOLDER_PRESET_NOT_FOUND]: {
    message: '폴더 프리셋을 찾을 수 없습니다: {name}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_ALREADY_EXISTS]: {
    message: '폴더 프리셋이 이미 존재합니다: {name}',
    severity: ErrorSeverity.WARNING,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_CREATION_ERROR]: {
    message: '폴더 프리셋 생성 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_UPDATE_ERROR]: {
    message: '폴더 프리셋 업데이트 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_DELETE_ERROR]: {
    message: '폴더 프리셋 삭제 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_APPLY_ERROR]: {
    message: '폴더 프리셋 적용 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_ASSIGNMENT_ERROR]: {
    message: '폴더 프리셋 할당 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_UNASSIGNMENT_ERROR]: {
    message: '폴더 프리셋 해제 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_RETRIEVAL_ERROR]: {
    message: '폴더 프리셋 가져오기 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_PRIORITY_ERROR]: {
    message: '폴더 프리셋 우선순위 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_PRIORITY_RETRIEVAL_ERROR]: {
    message: '폴더 프리셋 우선순위 가져오기 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_SELECTION_ERROR]: {
    message: '폴더 프리셋 선택 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_MANAGER_INITIALIZATION_ERROR]: {
    message: '폴더 프리셋 관리자 초기화 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_IN_USE_CHECK_ERROR]: {
    message: '폴더 프리셋 사용 중 체크 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_USAGE_RETRIEVAL_ERROR]: {
    message: '폴더 프리셋 사용 가져오기 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_INVALID_PATH]: {
    message: '잘못된 폴더 프리셋 경로입니다: {path}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_SET_ERROR]: {
    message: '폴더 프리셋 설정 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_REMOVE_ERROR]: {
    message: '폴더 프리셋 제거 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_AUTO_APPLY_ERROR]: {
    message: '폴더 프리셋 자동 적용 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
  [ErrorCode.FOLDER_PRESET_REMOVED_ERROR]: {
    message: '폴더 프리셋 제거 중 오류가 발생했습니다: {message}',
    severity: ErrorSeverity.ERROR,
    group: ErrorGroup.PRESET
  },
};

/**
 * 편의 함수: 오류 메시지 가져오기
 */
export const getErrorMessage = (code: ErrorCodeType): string => ERROR_INFO[code].message;

/**
 * 편의 함수: 오류 심각도 가져오기
 */
export const getErrorSeverity = (code: ErrorCodeType): ErrorSeverity => ERROR_INFO[code].severity;

/**
 * 편의 함수: 오류 그룹 가져오기
 */
export const getErrorGroup = (code: ErrorCodeType): ErrorGroup => ERROR_INFO[code].group;

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