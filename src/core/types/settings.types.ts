import { SizeValue } from './common.types';
import { LayoutType } from './layout.types';
import { CardSetMode, CardSortBy } from './cardset.types';
import { SortDirection } from './common.types';
import { CardStyleOptions } from '../../styles/components/card.styles';
import { PresetApplyMode, PresetMergeStrategy, PresetManagementOptions } from './preset.types';
import { 
  FolderPresetMapping, 
  TagPresetMapping, 
  FolderPresetPriorities, 
  TagPresetPriorities 
} from './preset.types';

/**
 * 언어 설정 인터페이스
 */
export interface LanguageSettings {
  /**
   * 로케일
   */
  locale: string;
  
  /**
   * 시스템 언어 사용 여부
   */
  useSystemLanguage: boolean;
}

/**
 * 카드 내용 설정 인터페이스
 */
export interface CardContentSettings {
  /**
   * 파일명 표시 여부
   */
  showFileName: boolean;
  
  /**
   * 첫 번째 헤더 표시 여부
   */
  showFirstHeader: boolean;
  
  /**
   * 본문 표시 여부
   */
  showBody: boolean;
  
  /**
   * 본문 길이 제한 여부
   */
  bodyLengthLimit: boolean;
  
  /**
   * 태그 표시 여부
   */
  showTags: boolean;
  
  /**
   * 본문 길이
   */
  bodyLength: number;
  
  /**
   * HTML로 콘텐츠 렌더링 여부
   */
  renderContentAsHtml: boolean;
  
  /**
   * 생성 날짜 표시 여부
   */
  showCreationDate?: boolean;
  
  /**
   * 수정 날짜 표시 여부
   */
  showModificationDate?: boolean;
  
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
 * 카드 스타일 설정 인터페이스
 */
export interface CardStyleSettings {
  /**
   * 파일명 폰트 크기
   */
  fileNameFontSize: number | SizeValue;
  
  /**
   * 첫 번째 헤더 폰트 크기
   */
  firstHeaderFontSize: number | SizeValue;
  
  /**
   * 본문 폰트 크기
   */
  bodyFontSize: number | SizeValue;
  
  /**
   * 태그 폰트 크기
   */
  tagsFontSize: number | SizeValue;
  
  /**
   * 카드 너비
   */
  cardWidth: number | SizeValue;
  
  /**
   * 카드 높이
   */
  cardHeight: number | SizeValue;
  
  /**
   * 카드 패딩
   */
  cardPadding: number | SizeValue;
  
  /**
   * 카드 테두리 반경
   */
  cardBorderRadius: number | SizeValue;
  
  /**
   * 카드 테두리 두께
   */
  cardBorderWidth: number | SizeValue;
  
  /**
   * 카드 그림자 활성화 여부
   */
  cardShadow: boolean;
  
  /**
   * 드래그 앤 드롭 콘텐츠 활성화 여부
   */
  dragDropContent: boolean;
}

/**
 * 카드 레이아웃 설정 인터페이스
 */
export interface CardLayoutSettings {
  /**
   * 레이아웃 타입
   */
  type?: LayoutType;
  
  /**
   * 카드 임계 너비
   */
  cardThresholdWidth: number;
  
  /**
   * 카드 높이 정렬 여부
   */
  alignCardHeight: boolean;
  
  /**
   * 고정 높이 사용 여부
   */
  useFixedHeight: boolean;
  
  /**
   * 고정 카드 높이
   */
  fixedCardHeight: number;
  
  /**
   * 열당 카드 수
   */
  cardsPerColumn: number;
  
  /**
   * 수직 방향 여부
   */
  isVertical: boolean;

  /**
   * 스크롤 애니메이션 여부
   */
  smoothScroll?: boolean;
}

/**
 * 카드셋 설정 인터페이스
 */
export interface CardSet {
  /**
   * 카드셋 모드
   * - ACTIVE_FOLDER: 현재 활성화된 파일이 위치한 폴더의 모든 노트를 카드로 표시
   * - SELECTED_FOLDER: 사용자가 명시적으로 지정한 특정 폴더의 노트만 표시
   * - VAULT: Obsidian 볼트 내의 모든 노트 파일을 카드로 표시
   * - SEARCH_RESULTS: 검색 쿼리에 일치하는 노트 파일들만 카드로 표시
   * - TAG: 특정 태그가 포함된 노트만 표시
   * - CUSTOM: 사용자 정의 모드
   */
  mode: CardSetMode;
  
  /**
   * 선택된 폴더
   */
  selectedFolder: string | null;
  
  /**
   * 정렬 기준
   */
  sortBy: CardSortBy;
  
  /**
   * 정렬 방향
   */
  sortDirection: SortDirection;
}

/**
 * 프리셋 관리자 설정 인터페이스
 */
export interface PresetManagerSettings {
  /**
   * 활성화된 프리셋 ID
   */
  activePresetId?: string;
  
  /**
   * 기본 프리셋 ID
   */
  defaultPresetId?: string;
  
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
  folderPresets: Record<string, string>;
  
  /**
   * 폴더별 프리셋 우선순위
   * 키: 폴더 경로, 값: 전역 프리셋보다 우선 적용 여부
   */
  folderPresetPriorities: Record<string, boolean>;
  
  /**
   * 태그별 프리셋 매핑
   * 키: 태그 이름, 값: 프리셋 ID
   */
  tagPresets: Record<string, string>;
  
  /**
   * 태그별 프리셋 우선순위
   * 키: 태그 이름, 값: 전역 프리셋보다 우선 적용 여부
   */
  tagPresetPriorities: Record<string, boolean>;
  
  /**
   * 활성 폴더 프리셋 사용 여부
   */
  activeFolderPresets?: boolean;
  
  /**
   * 기본 우선순위 순서
   * - tag-folder-global: 태그 > 폴더 > 전역 순서
   * - folder-tag-global: 폴더 > 태그 > 전역 순서
   * - custom: 사용자 정의 우선순위 (folderPresetPriorities, tagPresetPriorities 사용)
   */
  defaultPriorityOrder?: 'tag-folder-global' | 'folder-tag-global' | 'custom';
  
  /**
   * 충돌 해결 방식
   * - priority-only: 우선순위가 가장 높은 프리셋만 적용
   * - merge-priority: 우선순위 순서대로 병합 (나중에 추가된 것이 우선)
   * - merge-custom: 사용자 정의 병합 규칙 (추후 구현)
   */
  conflictResolution?: 'priority-only' | 'merge-priority' | 'merge-custom';

  /**
   * 마지막으로 활성화된 프리셋 ID
   */
  lastActivePreset?: string;

  /**
   * 전역 기본 프리셋 ID
   */
  globalDefaultPreset?: string;

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
 * 스크롤 설정 인터페이스
 */
export interface ScrollSettings {
  /**
   * 스크롤 애니메이션 활성화 여부
   */
  enableScrollAnimation: boolean;
  
  /**
   * 스크롤 속도
   */
  scrollSpeed: number;

  /**
   * 카드 스냅 활성화 여부
   */
  enableSnapToCard?: boolean;
}

/**
 * 카드 네비게이터 설정 인터페이스
 */
export interface CardNavigatorSettings {
  /**
   * 카드 콘텐츠 설정
   */
  content: CardContentSettings;
  
  /**
   * 카드 스타일 설정
   */
  style: CardStyleSettings;
  
  /**
   * 카드 레이아웃 설정
   */
  layout: CardLayoutSettings;
  
  /**
   * 카드셋 설정
   */
  cardSet: CardSetSettings;
  
  /**
   * 스크롤 설정
   */
  scroll: ScrollSettings;
  
  /**
   * 프리셋 관리 옵션
   */
  presetManagement: PresetManagementOptions;
  
  /**
   * 폴더 프리셋 매핑
   */
  folderPresetMapping: FolderPresetMapping;
  
  /**
   * 태그 프리셋 매핑
   */
  tagPresetMapping: TagPresetMapping;
  
  /**
   * 폴더 프리셋 우선순위
   */
  folderPresetPriorities: FolderPresetPriorities;
  
  /**
   * 태그 프리셋 우선순위
   */
  tagPresetPriorities: TagPresetPriorities;
  
  /**
   * 버전 정보
   */
  version: string;

  /**
   * 프리셋 설정
   */
  preset: PresetManagerSettings;

  /**
   * 언어 설정
   */
  language?: LanguageSettings;

  /**
   * 디버그 모드 활성화 여부
   */
  debug?: boolean;
}

/**
 * 전역 설정 키 배열
 */
export const GLOBAL_SETTINGS_KEYS: (keyof CardNavigatorSettings)[] = [
  'preset' as keyof CardNavigatorSettings,
  'language' as keyof CardNavigatorSettings,
  'debug' as keyof CardNavigatorSettings
];

/**
 * 기본 카드 내용 설정
 */
export const DEFAULT_CARD_CONTENT_SETTINGS: CardContentSettings = {
  showFileName: true,
  showFirstHeader: true,
  showBody: true,
  bodyLengthLimit: true,
  showTags: true,
  bodyLength: 501,
  renderContentAsHtml: false
};

/**
 * 기본 카드 스타일 설정
 */
export const DEFAULT_CARD_STYLE_SETTINGS: CardStyleSettings = {
  fileNameFontSize: 17,
  firstHeaderFontSize: 17,
  bodyFontSize: 15,
  tagsFontSize: 13,
  cardWidth: 250,
  cardHeight: 200,
  cardPadding: 10,
  cardBorderRadius: 10,
  cardBorderWidth: 1,
  cardShadow: false,
  dragDropContent: false
};

/**
 * 기본 카드 레이아웃 설정
 */
export const DEFAULT_CARD_LAYOUT_SETTINGS: CardLayoutSettings = {
  type: LayoutType.MASONRY,
  cardThresholdWidth: 250,
  alignCardHeight: true,
  useFixedHeight: true,
  fixedCardHeight: 200,
  cardsPerColumn: 3,
  isVertical: true
};

/**
 * 기본 카드셋 설정
 */
export const DEFAULT_CARD_SET_SETTINGS: CardSetSettings = {
  mode: CardSetMode.ACTIVE_FOLDER,
  selectedFolder: null,
  sortBy: CardSortBy.FILE_NAME,
  sortDirection: SortDirection.ASC
};

/**
 * 기본 프리셋 관리자 설정
 */
export const DEFAULT_PRESET_MANAGER_SETTINGS: PresetManagerSettings = {
  activePresetId: undefined,
  defaultPresetId: undefined,
  autoApplyPresets: true,
  autoApplyFolderPresets: true,
  autoApplyTagPresets: true,
  folderPresets: {},
  folderPresetPriorities: {},
  tagPresets: {},
  tagPresetPriorities: {},
  activeFolderPresets: false,
  defaultPriorityOrder: 'tag-folder-global',
  conflictResolution: 'priority-only'
};

/**
 * 기본 스크롤 설정
 */
export const DEFAULT_SCROLL_SETTINGS: ScrollSettings = {
  enableScrollAnimation: true,
  scrollSpeed: 500,
  enableSnapToCard: false
};

/**
 * 기본 언어 설정
 */
export const DEFAULT_LANGUAGE_SETTINGS: LanguageSettings = {
  locale: 'en',
  useSystemLanguage: true
};

/**
 * 기본 설정
 */
export const DEFAULT_SETTINGS: CardNavigatorSettings = {
  content: DEFAULT_CARD_CONTENT_SETTINGS,
  style: DEFAULT_CARD_STYLE_SETTINGS,
  layout: DEFAULT_CARD_LAYOUT_SETTINGS,
  cardSet: DEFAULT_CARD_SET_SETTINGS,
  scroll: DEFAULT_SCROLL_SETTINGS,
  presetManagement: {
    activePresetId: undefined,
    globalDefaultPresetId: undefined,
    autoApplyPresets: false,
    presetApplyMode: 'manual',
    presetMergeStrategy: 'priority-only'
  },
  folderPresetMapping: {},
  tagPresetMapping: {},
  folderPresetPriorities: {},
  tagPresetPriorities: {},
  version: '1.0.0',
  preset: DEFAULT_PRESET_MANAGER_SETTINGS,
  language: DEFAULT_LANGUAGE_SETTINGS,
  debug: false
};

/**
 * 숫자 설정 키 타입
 */
export type NumberSettingKey = 
  | 'bodyLength' 
  | 'fileNameFontSize' 
  | 'firstHeaderFontSize' 
  | 'bodyFontSize' 
  | 'tagsFontSize'
  | 'cardThresholdWidth'
  | 'fixedCardHeight'
  | 'cardsPerColumn'
  | 'cardShadowIntensity';

/**
 * 범위 설정 구성
 */
export interface RangeSettingConfig {
  /**
   * 최소값
   */
  min: number;
  
  /**
   * 최대값
   */
  max: number;
  
  /**
   * 단계
   */
  step: number;
}

/**
 * 플러그인 설정 인터페이스
 */
export interface PluginSettings {
  // ... existing code ...
  
  /**
   * 카드셋 설정
   */
  cardSet: CardSet;
  
  // ... existing code ...
}

/**
 * 카드셋 설정 인터페이스
 */
export interface CardSetSettings {
  /**
   * 카드셋 모드
   */
  mode: CardSetMode;
  
  /**
   * 선택된 폴더 경로
   */
  selectedFolder: string | null;
  
  /**
   * 정렬 기준
   */
  sortBy: CardSortBy;
  
  /**
   * 정렬 방향
   */
  sortDirection: SortDirection;
} 