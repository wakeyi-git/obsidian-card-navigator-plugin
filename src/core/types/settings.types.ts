import { CardSetMode, CardSortBy } from './cardset.types';
import { SizeValue, SortDirection } from './common.types';
import { CardStyleOptions } from '../../styles/components/card.styles';

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
}

/**
 * 카드 스타일 설정 인터페이스
 */
export interface CardStyleSettings extends CardStyleOptions {
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
   * 드래그 앤 드롭 콘텐츠 활성화 여부
   */
  dragDropContent: boolean;
}

/**
 * 카드 레이아웃 설정 인터페이스
 */
export interface CardLayoutSettings {
  /**
   * 카드 너비 임계값
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
}

/**
 * 카드셋 설정 인터페이스
 */
export interface CardSetSettings {
  /**
   * 카드셋 모드
   */
  cardSetMode: CardSetMode;
  
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
 * 프리셋 관련 설정 인터페이스
 */
export interface PresetManagerSettings {
  /**
   * 프리셋 폴더 경로
   */
  presetFolderPath: string;
  
  /**
   * 전역 프리셋
   */
  GlobalPreset: string;
  
  /**
   * 마지막 활성 프리셋
   */
  lastActivePreset: string;
  
  /**
   * 프리셋 자동 적용 여부
   */
  autoApplyPresets: boolean;
  
  /**
   * 폴더별 프리셋 자동 적용 여부
   */
  autoApplyFolderPresets: boolean;
  
  /**
   * 폴더별 프리셋
   */
  folderPresets?: Record<string, string[]> | null;
  
  /**
   * 활성 폴더 프리셋
   */
  activeFolderPresets?: Record<string, string> | null;
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
   * 카드에 스냅 기능 활성화 여부
   */
  enableSnapToCard: boolean;
}

/**
 * 카드 네비게이터 설정
 */
export interface CardNavigatorSettings {
  /**
   * 카드 내용 설정
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
   * 프리셋 관련 설정
   */
  preset: PresetManagerSettings;
  
  /**
   * 스크롤 설정
   */
  scroll: ScrollSettings;
  
  /**
   * 언어 설정
   */
  language: LanguageSettings;
  
  /**
   * 디버그 모드 활성화 여부
   */
  debug: boolean;
}

/**
 * 전역 설정 키 배열
 */
export const GLOBAL_SETTINGS_KEYS: (keyof CardNavigatorSettings)[] = [
  'preset',
  'language',
  'debug'
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
  dragDropContent: false
};

/**
 * 기본 카드 레이아웃 설정
 */
export const DEFAULT_CARD_LAYOUT_SETTINGS: CardLayoutSettings = {
  cardThresholdWidth: 250,
  alignCardHeight: true,
  useFixedHeight: true,
  fixedCardHeight: 200,
  cardsPerColumn: 3
};

/**
 * 기본 카드셋 설정
 */
export const DEFAULT_CARD_SET_SETTINGS: CardSetSettings = {
  cardSetMode: CardSetMode.ACTIVE_FOLDER,
  selectedFolder: null,
  sortBy: 'file-name',
  sortDirection: 'asc'
};

/**
 * 기본 프리셋 관련 설정
 */
export const DEFAULT_PRESET_MANAGER_SETTINGS: PresetManagerSettings = {
  presetFolderPath: 'CardNavigatorPresets',
  GlobalPreset: 'default',
  lastActivePreset: 'default',
  autoApplyPresets: false,
  autoApplyFolderPresets: false,
  folderPresets: {},
  activeFolderPresets: {}
};

/**
 * 기본 스크롤 설정
 */
export const DEFAULT_SCROLL_SETTINGS: ScrollSettings = {
  enableScrollAnimation: true,
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
  preset: DEFAULT_PRESET_MANAGER_SETTINGS,
  scroll: DEFAULT_SCROLL_SETTINGS,
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