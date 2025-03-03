/**
 * 프리셋 타입 정의
 */

import { 
  CardContentSettings as GlobalCardContentSettings, 
  CardStyleSettings as GlobalCardStyleSettings, 
  CardLayoutSettings, 
  CardSet as GlobalCardSetSettings,
  PresetManagerSettings
} from './settings.types';
import { CardSetMode, CardSortBy } from './cardset.types';
import { SortDirection } from './common.types';

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
 * 프리셋 인터페이스
 */
export interface IPreset {
  /**
   * 프리셋 ID
   */
  id: string;
  
  /**
   * 프리셋 이름
   */
  name: string;
  
  /**
   * 프리셋 설명
   */
  description?: string;
  
  /**
   * 생성 날짜
   */
  createdAt: number;
  
  /**
   * 수정 날짜
   */
  updatedAt: number;
  
  /**
   * 기본 프리셋 여부
   */
  isDefault?: boolean;
  
  /**
   * 프리셋 설정
   */
  settings: PresetSettings;
}

// 기존 PresetData 인터페이스를 위한 타입 별칭 (하위 호환성 유지)
export type PresetData = IPreset;

/**
 * 프리셋 설정 타입
 */
export interface PresetSettings {
  /**
   * 카드 내용 설정
   */
  cardContent?: GlobalCardContentSettings;
  
  /**
   * 카드 스타일 설정
   */
  cardStyle?: GlobalCardStyleSettings;
  
  /**
   * 레이아웃 설정
   */
  layout?: CardLayoutSettings;
  
  /**
   * 정렬 설정
   */
  sort?: SortSettings;
  
  /**
   * 필터 설정
   */
  filter?: FilterSettings;
  
  /**
   * 카드셋 설정
   */
  cardSet?: GlobalCardSetSettings;
}

/**
 * 카드 내용 설정 타입
 */
export interface CardContentSettings {
  /**
   * 파일명 표시 여부
   */
  showFileName?: boolean;
  
  /**
   * 첫 번째 헤더 표시 여부
   */
  showFirstHeader?: boolean;
  
  /**
   * 본문 표시 여부 (settings.types.ts와 호환성 유지)
   */
  showBody?: boolean;
  
  /**
   * 본문 길이 (settings.types.ts와 호환성 유지)
   */
  bodyLength?: number;
  
  /**
   * 태그 표시 여부
   */
  showTags?: boolean;
  
  /**
   * 생성 날짜 표시 여부
   */
  showCreationDate?: boolean;
  
  /**
   * 수정 날짜 표시 여부
   */
  showModificationDate?: boolean;
  
  /**
   * HTML로 콘텐츠 렌더링 여부 (settings.types.ts와 호환성 유지)
   */
  renderContentAsHtml?: boolean;
  
  /**
   * 코드 블록 하이라이팅 여부
   */
  highlightCodeBlocks?: boolean;
  
  /**
   * 수학 수식 렌더링 여부
   */
  renderMathEquations?: boolean;
  
  /**
   * 이미지 표시 여부
   */
  showImages?: boolean;
}

/**
 * 카드 스타일 설정 타입
 */
export interface CardStyleSettings {
  /**
   * 파일명 글꼴 크기 (settings.types.ts와 호환성 유지)
   */
  fileNameFontSize?: number | string;
  
  /**
   * 첫 번째 헤더 글꼴 크기 (settings.types.ts와 호환성 유지)
   */
  firstHeaderFontSize?: number | string;
  
  /**
   * 본문 글꼴 크기 (settings.types.ts와 호환성 유지)
   */
  bodyFontSize?: number | string;

  /**
   * 태그 글꼴 크기 (settings.types.ts와 호환성 유지)
   */
  tagsFontSize?: number | string;
  
  /**
   * 카드 너비
   */
  cardWidth?: string;
  
  /**
   * 카드 높이
   */
  cardHeight?: string;
  
  /**
   * 카드 패딩
   */
  cardPadding?: string;
  
  /**
   * 카드 테두리 두께
   */
  cardBorderWidth?: string;
  
  /**
   * 카드 테두리 색상
   */
  cardBorderColor?: string;
  
  /**
   * 카드 테두리 모서리 둥글기
   */
  cardBorderRadius?: string;
    
  /**
   * 카드 그림자 활성화 여부 (settings.types.ts와 호환성 유지)
   */
  cardShadow?: boolean;
  
  /**
   * 카드 그림자 강도
   */
  cardShadowIntensity?: number;
  
  /**
   * 카드 배경색
   */
  cardBackgroundColor?: string;
  
  /**
   * 태그 기반 자동 색상 지정 여부
   */
  enableTagBasedColors?: boolean;
  
  /**
   * 드래그 앤 드롭 콘텐츠 활성화 여부 (settings.types.ts와 호환성 유지)
   */
  dragDropContent?: boolean;
}

/**
 * 레이아웃 설정 타입
 */
export interface LayoutSettings {
  /**
   * 카드 너비 임계값
   */
  cardThresholdWidth?: number;
  
  /**
   * 카드 높이 정렬 여부
   */
  alignCardHeight?: boolean;
  
  /**
   * 고정 카드 높이
   */
  fixedCardHeight?: number;
  
  /**
   * 열당 카드 수 (settings.types.ts와 호환성 유지)
   */
  cardsPerColumn?: number;
  
  /**
   * 수직 방향 여부
   */
  isVertical?: boolean;
  
  /**
   * 카드 간 간격
   */
  cardGap?: number;
  
  /**
   * 부드러운 스크롤 활성화 여부
   */
  smoothScroll?: boolean;
}

/**
 * 정렬 설정 타입
 */
export interface SortSettings {
  /**
   * 정렬 기준
   */
  sortBy?: 'filename' | 'creationDate' | 'modificationDate' | 'fileSize' | 'custom';
  
  /**
   * 정렬 방향
   */
  sortDirection?: 'asc' | 'desc';
  
  /**
   * 사용자 정의 정렬 필드
   */
  customSortField?: string;
}

/**
 * 필터 설정 타입
 */
export interface FilterSettings {
  /**
   * 태그 필터
   */
  tagFilter?: string[];
  
  /**
   * 폴더 필터
   */
  folderFilter?: string[];
  
  /**
   * YAML 프론트매터 필터
   */
  frontmatterFilter?: {
    key: string;
    value: string;
  }[];
}

/**
 * 카드셋 설정 타입
 */
export interface CardSetSettings {
  /**
   * 카드셋 모드
   */
  mode?: CardSetMode | keyof typeof CardSetMode;
  
  /**
   * 선택된 폴더 (settings.types.ts와 호환성 유지)
   */
  selectedFolder?: string | null;
  
  /**
   * 그룹화 옵션
   */
  groupBy?: 'folder' | 'tag' | 'date' | 'none';
  
  /**
   * 정렬 기준
   */
  sortBy?: CardSortBy;
  
  /**
   * 정렬 방향
   */
  sortDirection?: SortDirection;
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
  /**
   * 프리셋 이름
   */
  presetName?: string;
  
  /**
   * 프리셋 ID
   */
  presetId?: string;
  
  /**
   * 폴더 경로
   */
  folderPath?: string;
  
  /**
   * 태그 이름
   */
  tag?: string;

  /**
   * 이전 프리셋 ID
   */
  oldPresetId?: string;
   
  /**
   * 새 프리셋 ID
   */
  newPresetId?: string;
   
  /**
   * 이벤트 관련 추가 데이터
   */
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