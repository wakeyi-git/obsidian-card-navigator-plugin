/**
 * 프리셋 타입 정의
 */

import { 
  CardContentSettings, 
  CardStyleSettings, 
  CardLayoutSettings,
  CardSetSettings
} from './settings.types';
import { CardSetOptions } from './cardset.types';
import { SortOption } from './common.types';

/**
 * 폴더 프리셋 매핑 타입
 * 폴더 경로를 키로, 프리셋 ID를 값으로 가지는 객체
 */
export type FolderPresetMapping = Record<string, string>;

/**
 * 폴더 프리셋 우선순위 타입
 * 폴더 경로를 키로, 우선순위 여부를 값으로 가지는 객체
 */
export type FolderPresetPriorities = Record<string, boolean>;

/**
 * 태그 프리셋 매핑 타입
 * 태그를 키로, 프리셋 ID를 값으로 가지는 객체
 */
export type TagPresetMapping = Record<string, string>;

/**
 * 태그 프리셋 우선순위 타입
 * 태그를 키로, 우선순위 여부를 값으로 가지는 객체
 */
export type TagPresetPriorities = Record<string, boolean>;

/**
 * 프리셋 적용 모드 타입
 * 태그와 폴더 프리셋을 어떻게 적용할지 결정합니다.
 */
export enum PresetApplyMode {
  /**
   * 폴더 프리셋만 적용
   */
  FOLDER_ONLY = 'folder-only',
  
  /**
   * 태그 프리셋만 적용
   */
  TAG_ONLY = 'tag-only',
  
  /**
   * 폴더 프리셋을 우선 적용하고, 없으면 태그 프리셋 적용
   */
  FOLDER_FIRST = 'folder-first',
  
  /**
   * 태그 프리셋을 우선 적용하고, 없으면 폴더 프리셋 적용
   */
  TAG_FIRST = 'tag-first',
  
  /**
   * 폴더 프리셋과 태그 프리셋을 병합하여 적용
   */
  MERGED = 'merged'
}

/**
 * 프리셋 병합 전략 타입
 * 태그와 폴더 프리셋을 병합할 때 충돌을 어떻게 해결할지 결정합니다.
 */
export enum PresetMergeStrategy {
  /**
   * 폴더 프리셋을 기본으로 하고 태그 프리셋으로 덮어쓰기
   */
  FOLDER_BASE = 'folder-base',
  
  /**
   * 태그 프리셋을 기본으로 하고 폴더 프리셋으로 덮어쓰기
   */
  TAG_BASE = 'tag-base',
  
  /**
   * 기본 프리셋을 기본으로 하고 폴더 및 태그 프리셋으로 덮어쓰기
   */
  DEFAULT_BASE = 'default-base'
}

/**
 * 프리셋 우선순위 순서 타입
 * 여러 프리셋이 적용 가능할 때 어떤 순서로 우선순위를 결정할지 정의합니다.
 */
export enum PresetPriorityOrder {
  /**
   * 태그 > 폴더 > 전역 순서로 우선순위 적용
   */
  TAG_FOLDER_GLOBAL = 'tag-folder-global',
  
  /**
   * 폴더 > 태그 > 전역 순서로 우선순위 적용
   */
  FOLDER_TAG_GLOBAL = 'folder-tag-global',
  
  /**
   * 사용자 정의 우선순위 적용
   */
  CUSTOM = 'custom'
}

/**
 * 프리셋 충돌 해결 전략 타입
 * 여러 프리셋이 적용 가능할 때 충돌을 어떻게 해결할지 정의합니다.
 */
export enum PresetConflictResolution {
  /**
   * 우선순위가 가장 높은 프리셋만 적용
   */
  PRIORITY_ONLY = 'priority-only',
  
  /**
   * 우선순위에 따라 프리셋 병합
   */
  MERGE_PRIORITY = 'merge-priority',
  
  /**
   * 사용자 정의 규칙에 따라 프리셋 병합
   */
  MERGE_CUSTOM = 'merge-custom'
}

/**
 * 프리셋 설정 인터페이스
 */
export interface PresetSettings {
  cardContent: CardContentSettings;
  cardStyle: CardStyleSettings;
  layout: CardLayoutSettings;
  sort: SortOption;
  cardSet: CardSetOptions;
}

/**
 * 프리셋 인터페이스
 */
export interface IPreset {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  settings: PresetSettings;
  options: PresetOptions;
  isDefault?: boolean;
  lastModified?: number;
}

// 기존 PresetData 인터페이스를 위한 타입 별칭 (하위 호환성 유지)
export type PresetData = IPreset;

/**
 * 프리셋 옵션 인터페이스
 */
export interface PresetOptions {
  cardSet: CardSetOptions;
  sort: SortOption;
  layout: {
    cardWidth: number;
    cardHeight?: number;
    spacing: number;
    columns?: number;
  };
  style: {
    showHeader: boolean;
    showFooter: boolean;
    showTags: boolean;
    darkMode?: boolean;
  };
}

/**
 * 폴더별 프리셋 맵
 */
export interface FolderPresetMap {
  /**
   * 폴더 경로를 키로 하고 프리셋 이름을 값으로 하는 맵
   */
  [folderPath: string]: string;
}

/**
 * 프리셋 이벤트 타입
 */
export type PresetEvent = 
  | 'preset-created'
  | 'preset-updated'
  | 'preset-deleted'
  | 'preset-applied'
  | 'preset-imported'
  | 'preset-exported'
  | 'preset-id-changed';

/**
 * 프리셋 이벤트 데이터
 */
export interface PresetEventData {
  presetName?: string;
  presetId?: string;
  folderPath?: string;
  tag?: string;
  oldPresetId?: string;
  newPresetId?: string;
  data?: any;
}

/**
 * 프리셋 이벤트 핸들러
 */
export type PresetEventHandler = (data: PresetEventData) => void;

/**
 * 프리셋 내보내기 데이터
 */
export interface PresetExportData {
  /**
   * 내보내기 버전
   */
  version: string;
  
  /**
   * 프리셋 배열
   */
  presets: PresetData[];
}

/**
 * 프리셋 관리 옵션
 */
export interface PresetManagementOptions {
  /**
   * 활성화된 프리셋 ID
   */
  activePresetId?: string;
  
  /**
   * 기본 프리셋 ID
   */
  defaultPresetId?: string;
  
  /**
   * 전역 기본 프리셋 ID
   */
  globalDefaultPresetId?: string;
  
  /**
   * 파일을 열 때 자동으로 프리셋을 적용할지 여부
   */
  autoApplyPresets?: boolean;
  
  /**
   * 폴더 프리셋 자동 적용 여부
   */
  autoApplyFolderPresets?: boolean;
  
  /**
   * 태그 프리셋 자동 적용 여부
   */
  autoApplyTagPresets?: boolean;
  
  /**
   * 폴더별 프리셋 매핑
   * 키: 폴더 경로, 값: 프리셋 ID
   */
  folderPresetMappings?: Record<string, string>;
  
  /**
   * 폴더별 프리셋 우선순위
   * 키: 폴더 경로, 값: 전역 프리셋보다 우선 적용 여부
   */
  folderPresetPriorities?: Record<string, boolean>;
  
  /**
   * 태그별 프리셋 매핑
   * 키: 태그 이름, 값: 프리셋 ID
   */
  tagPresetMappings?: Record<string, string>;
  
  /**
   * 태그별 프리셋 우선순위
   * 키: 태그 이름, 값: 전역 프리셋보다 우선 적용 여부
   */
  tagPresetPriorities?: Record<string, boolean>;
  
  /**
   * 활성 폴더 프리셋 사용 여부
   */
  useActiveFolderPresets?: boolean;
  
  /**
   * 기본 우선순위 순서
   */
  defaultPriorityOrder?: PresetPriorityOrder | string;
  
  /**
   * 우선순위 순서
   */
  priorityOrder?: PresetPriorityOrder | string;
  
  /**
   * 충돌 해결 방식
   */
  conflictResolution?: PresetConflictResolution | string;
  
  /**
   * 마지막으로 활성화된 프리셋 ID
   */
  lastActivePresetId?: string;
  
  /**
   * 프리셋 적용 모드
   */
  presetApplyMode?: PresetApplyMode | string;
  
  /**
   * 프리셋 병합 전략
   */
  presetMergeStrategy?: PresetMergeStrategy | string;
  
  /**
   * 프리셋 폴더 경로
   */
  presetFolderPath?: string;
}

/**
 * 프리셋 이벤트 상수
 */
export enum PresetEventName {
  PRESET_CREATED = 'preset-created',
  PRESET_UPDATED = 'preset-updated',
  PRESET_DELETED = 'preset-deleted',
  PRESET_APPLIED = 'preset-applied',
  PRESET_IMPORTED = 'preset-imported',
  PRESET_EXPORTED = 'preset-exported',
  PRESET_ID_CHANGED = 'preset-id-changed',
  FOLDER_PRESET_CHANGED = 'folder-preset-changed',
  FOLDER_PRESET_REMOVED = 'folder-preset-removed',
  TAG_PRESET_CHANGED = 'tag-preset-changed',
  TAG_PRESET_REMOVED = 'tag-preset-removed'
} 