/**
 * 도메인 에러 기본 페이로드 인터페이스
 */
export interface BaseErrorPayload {
  /**
   * 에러 발생 시간
   */
  timestamp: number;

  /**
   * 에러 소스
   */
  source: string;

  /**
   * 에러 상세 정보
   */
  details?: Record<string, any>;

  /**
   * 원본 에러
   */
  cause?: Error;
}

/**
 * 에러 코드 열거형
 * 카드 네비게이터 플러그인의 에러 코드를 정의합니다.
 */
export enum ErrorCode {
  // 일반 에러
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',

  // 카드 관련 에러
  CARD_ERROR = 'CARD_ERROR',
  CARD_NOT_FOUND = 'CARD_NOT_FOUND',
  CARD_INVALID_FORMAT = 'CARD_INVALID_FORMAT',
  CARD_CREATION_FAILED = 'CARD_CREATION_FAILED',
  CARD_UPDATE_FAILED = 'CARD_UPDATE_FAILED',
  CARD_DELETION_FAILED = 'CARD_DELETION_FAILED',
  CARD_LIST_ERROR = 'CARD_LIST_ERROR',

  // 카드셋 관련 에러
  CARD_SET_ERROR = 'CARD_SET_ERROR',
  CARDSET_NOT_FOUND = 'CARDSET_NOT_FOUND',
  CARDSET_INVALID_SOURCE = 'CARDSET_INVALID_SOURCE',
  CARDSET_LOAD_FAILED = 'CARDSET_LOAD_FAILED',
  CARDSET_UPDATE_FAILED = 'CARDSET_UPDATE_FAILED',
  CARDSET_DELETE_FAILED = 'CARDSET_DELETE_FAILED',

  // 레이아웃 관련 에러
  LAYOUT_ERROR = 'LAYOUT_ERROR',
  LAYOUT_INVALID_DIRECTION = 'LAYOUT_INVALID_DIRECTION',
  LAYOUT_INVALID_SIZE = 'LAYOUT_INVALID_SIZE',
  LAYOUT_UPDATE_FAILED = 'LAYOUT_UPDATE_FAILED',

  // 내비게이션 관련 에러
  NAVIGATION_INVALID_MODE = 'NAVIGATION_INVALID_MODE',
  NAVIGATION_INVALID_INDEX = 'NAVIGATION_INVALID_INDEX',
  NAVIGATION_UPDATE_FAILED = 'NAVIGATION_UPDATE_FAILED',

  // 검색 관련 에러
  SEARCH_ERROR = 'SEARCH_ERROR',
  SEARCH_INVALID_QUERY = 'SEARCH_INVALID_QUERY',
  SEARCH_EXECUTION_FAILED = 'SEARCH_EXECUTION_FAILED',
  SEARCH_INDEX_UPDATE_FAILED = 'SEARCH_INDEX_UPDATE_FAILED',

  // 설정 관련 에러
  SETTINGS_ERROR = 'SETTINGS_ERROR',
  SETTINGS_LOAD_FAILED = 'SETTINGS_LOAD_FAILED',
  SETTINGS_SAVE_FAILED = 'SETTINGS_SAVE_FAILED',
  SETTINGS_INVALID_FORMAT = 'SETTINGS_INVALID_FORMAT',

  // 툴바 관련 에러
  TOOLBAR_ITEM_NOT_FOUND = 'TOOLBAR_ITEM_NOT_FOUND',
  TOOLBAR_UPDATE_FAILED = 'TOOLBAR_UPDATE_FAILED',

  // 상호작용 관련 에러
  INTERACTION_INVALID_EVENT = 'INTERACTION_INVALID_EVENT',
  INTERACTION_HANDLER_FAILED = 'INTERACTION_HANDLER_FAILED',

  // 컨테이너 관련 에러
  CONTAINER_ERROR = 'CONTAINER_ERROR',
  CONTAINER_INITIALIZATION_FAILED = 'CONTAINER_INITIALIZATION_FAILED',
  CARD_ADDITION_FAILED = 'CARD_ADDITION_FAILED',
  CARD_REMOVAL_FAILED = 'CARD_REMOVAL_FAILED',
  LAYOUT_RESIZE_FAILED = 'LAYOUT_RESIZE_FAILED',
  CONTAINER_CLEAR_FAILED = 'CONTAINER_CLEAR_FAILED',

  // 프리셋 관련 에러
  PRESET_ERROR = 'PRESET_ERROR',
  PRESET_SAVE_FAILED = 'PRESET_SAVE_FAILED',
  PRESET_APPLY_FAILED = 'PRESET_APPLY_FAILED',
  PRESET_DELETE_FAILED = 'PRESET_DELETE_FAILED',
}

/**
 * 에러 페이로드 타입 정의
 */
export interface IErrorPayloads {
  // 일반 에러
  [ErrorCode.INITIALIZATION_ERROR]: BaseErrorPayload & {
    component: string;
  };

  // 카드 관련 에러
  [ErrorCode.CARD_ERROR]: BaseErrorPayload & {
    cardId: string;
  };
  [ErrorCode.CARD_NOT_FOUND]: BaseErrorPayload & {
    cardId: string;
  };
  [ErrorCode.CARD_INVALID_FORMAT]: BaseErrorPayload & {
    cardId: string;
    format: string;
  };
  [ErrorCode.CARD_CREATION_FAILED]: BaseErrorPayload & {
    cardData: Record<string, any>;
  };
  [ErrorCode.CARD_UPDATE_FAILED]: BaseErrorPayload & {
    cardId: string;
    updates: Record<string, any>;
  };
  [ErrorCode.CARD_DELETION_FAILED]: BaseErrorPayload & {
    cardId: string;
  };
  [ErrorCode.CARD_LIST_ERROR]: BaseErrorPayload & {
    filter?: string;
  };

  // 카드셋 관련 에러
  [ErrorCode.CARD_SET_ERROR]: BaseErrorPayload & {
    cardSetId: string;
  };
  [ErrorCode.CARDSET_NOT_FOUND]: BaseErrorPayload & {
    cardSetId: string;
  };
  [ErrorCode.CARDSET_INVALID_SOURCE]: BaseErrorPayload & {
    source: string;
  };
  [ErrorCode.CARDSET_LOAD_FAILED]: BaseErrorPayload & {
    cardSetId: string;
  };
  [ErrorCode.CARDSET_UPDATE_FAILED]: BaseErrorPayload & {
    cardSetId: string;
    updates: Record<string, any>;
  };
  [ErrorCode.CARDSET_DELETE_FAILED]: BaseErrorPayload & {
    cardSetId: string;
  };

  // 레이아웃 관련 에러
  [ErrorCode.LAYOUT_ERROR]: BaseErrorPayload & {
    layout: string;
  };
  [ErrorCode.LAYOUT_INVALID_DIRECTION]: BaseErrorPayload & {
    direction: string;
  };
  [ErrorCode.LAYOUT_INVALID_SIZE]: BaseErrorPayload & {
    width: number;
    height: number;
  };
  [ErrorCode.LAYOUT_UPDATE_FAILED]: BaseErrorPayload & {
    layout: string;
    updates: Record<string, any>;
  };

  // 내비게이션 관련 에러
  [ErrorCode.NAVIGATION_INVALID_MODE]: BaseErrorPayload & {
    mode: string;
  };
  [ErrorCode.NAVIGATION_INVALID_INDEX]: BaseErrorPayload & {
    index: number;
    maxIndex: number;
  };
  [ErrorCode.NAVIGATION_UPDATE_FAILED]: BaseErrorPayload & {
    updates: Record<string, any>;
  };

  // 검색 관련 에러
  [ErrorCode.SEARCH_ERROR]: BaseErrorPayload & {
    query: string;
  };
  [ErrorCode.SEARCH_INVALID_QUERY]: BaseErrorPayload & {
    query: string;
  };
  [ErrorCode.SEARCH_EXECUTION_FAILED]: BaseErrorPayload & {
    query: string;
  };
  [ErrorCode.SEARCH_INDEX_UPDATE_FAILED]: BaseErrorPayload & {
    indexType: string;
  };

  // 설정 관련 에러
  [ErrorCode.SETTINGS_ERROR]: BaseErrorPayload & {
    setting: string;
  };
  [ErrorCode.SETTINGS_LOAD_FAILED]: BaseErrorPayload & {
    settingKey: string;
  };
  [ErrorCode.SETTINGS_SAVE_FAILED]: BaseErrorPayload & {
    settings: Record<string, any>;
  };
  [ErrorCode.SETTINGS_INVALID_FORMAT]: BaseErrorPayload & {
    setting: string;
    format: string;
  };

  // 툴바 관련 에러
  [ErrorCode.TOOLBAR_ITEM_NOT_FOUND]: BaseErrorPayload & {
    itemId: string;
  };
  [ErrorCode.TOOLBAR_UPDATE_FAILED]: BaseErrorPayload & {
    updates: Record<string, any>;
  };

  // 상호작용 관련 에러
  [ErrorCode.INTERACTION_INVALID_EVENT]: BaseErrorPayload & {
    eventType: string;
  };
  [ErrorCode.INTERACTION_HANDLER_FAILED]: BaseErrorPayload & {
    handler: string;
    event: string;
  };

  // 컨테이너 관련 에러
  [ErrorCode.CONTAINER_ERROR]: BaseErrorPayload & {
    containerId: string;
  };
  [ErrorCode.CONTAINER_INITIALIZATION_FAILED]: BaseErrorPayload & {
    containerId: string;
  };
  [ErrorCode.CARD_ADDITION_FAILED]: BaseErrorPayload & {
    containerId: string;
    cardId: string;
  };
  [ErrorCode.CARD_REMOVAL_FAILED]: BaseErrorPayload & {
    containerId: string;
    cardId: string;
  };
  [ErrorCode.LAYOUT_RESIZE_FAILED]: BaseErrorPayload & {
    containerId: string;
    width: number;
    height: number;
  };
  [ErrorCode.CONTAINER_CLEAR_FAILED]: BaseErrorPayload & {
    containerId: string;
  };

  // 프리셋 관련 에러
  [ErrorCode.PRESET_ERROR]: BaseErrorPayload & {
    preset: string;
  };
  [ErrorCode.PRESET_SAVE_FAILED]: BaseErrorPayload & {
    preset: string;
    settings: Record<string, any>;
  };
  [ErrorCode.PRESET_APPLY_FAILED]: BaseErrorPayload & {
    preset: string;
    settings: Record<string, any>;
  };
  [ErrorCode.PRESET_DELETE_FAILED]: BaseErrorPayload & {
    preset: string;
  };
}

/**
 * 도메인 에러 인터페이스
 */
export interface IDomainError<T extends keyof IErrorPayloads> {
  /**
   * 에러 코드
   */
  code: T;

  /**
   * 에러 페이로드
   */
  payload: IErrorPayloads[T];
} 