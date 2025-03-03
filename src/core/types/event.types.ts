/**
 * 이벤트 타입 정의
 * 애플리케이션 내 이벤트 처리를 위한 타입을 정의합니다.
 */

/**
 * 이벤트 핸들러 함수 타입
 * 이벤트 발생 시 호출되는 함수의 타입입니다.
 */
export type EventHandler = (data?: any) => void;

/**
 * 프리셋 이벤트 열거형
 * 프리셋 관련 이벤트를 정의합니다.
 */
export enum PresetEvent {
  // 프리셋 기본 이벤트
  PRESET_CREATED = 'preset-created',
  PRESET_UPDATED = 'preset-updated',
  PRESET_DELETED = 'preset-deleted',
  PRESET_APPLIED = 'preset-applied',
  PRESET_ID_CHANGED = 'preset-id-changed',
  PRESET_IMPORTED = 'preset-imported',
  PRESETS_IMPORTED = 'presets-imported',
  PRESETS_EXPORTED = 'presets-exported',
  
  // 폴더 프리셋 이벤트
  FOLDER_PRESET_CHANGED = 'folder-preset-changed',
  FOLDER_PRESET_REMOVED = 'folder-preset-removed',
  
  // 태그 프리셋 이벤트
  TAG_PRESET_CHANGED = 'tag-preset-changed',
  TAG_PRESET_REMOVED = 'tag-preset-removed',
  
  // 전역 프리셋 이벤트
  GLOBAL_DEFAULT_PRESET_CHANGED = 'global-default-preset-changed',
  GLOBAL_DEFAULT_PRESET_CLEARED = 'global-default-preset-cleared'
}

/**
 * 프리셋 이벤트 핸들러 타입
 * 프리셋 이벤트 발생 시 호출되는 함수의 타입입니다.
 */
export type PresetEventHandler = (data: PresetEventData) => void;

/**
 * 프리셋 이벤트 데이터 인터페이스
 * 프리셋 이벤트 발생 시 전달되는 데이터의 기본 인터페이스입니다.
 */
export interface PresetEventData {
  /**
   * 이벤트 타입
   */
  type: PresetEvent;
  
  /**
   * 이벤트 발생 시간
   */
  timestamp: number;
  
  /**
   * 이벤트 관련 추가 데이터
   */
  data?: any;
}

/**
 * 프리셋 생성 이벤트 데이터 인터페이스
 */
export interface PresetCreatedEventData extends PresetEventData {
  /**
   * 생성된 프리셋 ID
   */
  presetId: string;
  
  /**
   * 프리셋 이름
   */
  name: string;
  
  /**
   * 프리셋 설명
   */
  description?: string;
  
  /**
   * 기본 프리셋 여부
   */
  isDefault: boolean;
}

/**
 * 프리셋 업데이트 이벤트 데이터 인터페이스
 */
export interface PresetUpdatedEventData extends PresetEventData {
  /**
   * 업데이트된 프리셋 ID
   */
  presetId: string;
  
  /**
   * 업데이트된 필드
   */
  updatedFields: string[];
}

/**
 * 프리셋 삭제 이벤트 데이터 인터페이스
 * 프리셋 삭제 이벤트 발생 시 전달되는 데이터입니다.
 */
export interface PresetDeletedEventData extends PresetEventData {
  /**
   * 삭제된 프리셋 ID
   */
  presetId: string;
}

/**
 * 프리셋 적용 이벤트 데이터 인터페이스
 */
export interface PresetAppliedEventData extends PresetEventData {
  /**
   * 적용된 프리셋 ID
   */
  presetId: string;
}

/**
 * 프리셋 ID 변경 이벤트 데이터 인터페이스
 * 프리셋 ID 변경 이벤트 발생 시 전달되는 데이터입니다.
 */
export interface PresetIdChangedEventData extends PresetEventData {
  /**
   * 이전 프리셋 ID
   */
  oldPresetId: string;
  
  /**
   * 새 프리셋 ID
   */
  newPresetId: string;
}

/**
 * 폴더 프리셋 변경 이벤트 데이터 인터페이스
 * 폴더 프리셋 변경 이벤트 발생 시 전달되는 데이터입니다.
 */
export interface FolderPresetChangedEventData extends PresetEventData {
  /**
   * 폴더 경로
   */
  folderPath: string;
  
  /**
   * 프리셋 ID
   */
  presetId: string;
}

/**
 * 폴더 프리셋 제거 이벤트 데이터 인터페이스
 * 폴더 프리셋 제거 이벤트 발생 시 전달되는 데이터입니다.
 */
export interface FolderPresetRemovedEventData extends PresetEventData {
  /**
   * 폴더 경로
   */
  folderPath: string;
  
  /**
   * 제거된 프리셋 ID
   */
  presetId: string;
}

/**
 * 태그 프리셋 변경 이벤트 데이터 인터페이스
 * 태그 프리셋 변경 이벤트 발생 시 전달되는 데이터입니다.
 */
export interface TagPresetChangedEventData extends PresetEventData {
  /**
   * 태그 이름
   */
  tag: string;
  
  /**
   * 프리셋 ID
   */
  presetId: string;
}

/**
 * 태그 프리셋 제거 이벤트 데이터 인터페이스
 * 태그 프리셋 제거 이벤트 발생 시 전달되는 데이터입니다.
 */
export interface TagPresetRemovedEventData extends PresetEventData {
  /**
   * 태그 이름
   */
  tag: string;
  
  /**
   * 제거된 프리셋 ID
   */
  presetId: string;
}

/**
 * 전역 기본 프리셋 변경 이벤트 데이터 인터페이스
 */
export interface GlobalDefaultPresetChangedEventData extends PresetEventData {
  /**
   * 프리셋 ID
   */
  presetId: string;
}

/**
 * 전역 기본 프리셋 제거 이벤트 데이터 인터페이스
 */
export interface GlobalDefaultPresetClearedEventData extends PresetEventData {
  /**
   * 이전 프리셋 ID
   */
  previousPresetId: string | null;
}

/**
 * 카드 이벤트 열거형
 * 카드 관련 이벤트를 정의합니다.
 */
export enum CardEvent {
  CARD_CLICKED = 'card-clicked',
  CARD_CONTEXT_MENU = 'card-context-menu',
  CARD_HOVER = 'card-hover',
  CARD_LEAVE = 'card-leave',
  CARD_DRAG_START = 'card-drag-start',
  CARD_DRAG_END = 'card-drag-end',
  CARD_DROP = 'card-drop'
}

/**
 * 레이아웃 이벤트 열거형
 * 레이아웃 관련 이벤트를 정의합니다.
 */
export enum LayoutEvent {
  LAYOUT_INITIALIZED = 'layout-initialized',
  LAYOUT_UPDATED = 'layout-updated',
  LAYOUT_RESIZED = 'layout-resized',
  LAYOUT_TYPE_CHANGED = 'layout-type-changed',
  LAYOUT_OPTIONS_CHANGED = 'layout-options-changed'
}

/**
 * 검색 이벤트 열거형
 * 검색 관련 이벤트를 정의합니다.
 */
export enum SearchEvent {
  SEARCH_STARTED = 'search-started',
  SEARCH_COMPLETED = 'search-completed',
  SEARCH_CLEARED = 'search-cleared',
  SEARCH_QUERY_CHANGED = 'search-query-changed',
  SEARCH_OPTIONS_CHANGED = 'search-options-changed'
} 