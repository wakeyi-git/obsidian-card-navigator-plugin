import { ICardSetConfig, DEFAULT_CARD_SET_CONFIG } from './CardSet';
import { ILayoutConfig, DEFAULT_LAYOUT_CONFIG } from './LayoutConfig';
import { ICardRenderConfig, DEFAULT_CARD_RENDER_CONFIG } from './CardRenderConfig';
import { ICardStyle, DEFAULT_CARD_STYLE } from './CardStyle';
import { PluginSettings } from './DefaultValues';

/**
 * 프리셋 매핑 유형
 * - 프리셋이 적용되는 대상의 유형을 나타냄
 */
export enum PresetMappingType {
  /** 전역 적용 (기본값) */
  GLOBAL = 'global',
  /** 폴더별 적용 */
  FOLDER = 'folder',
  /** 태그별 적용 */
  TAG = 'tag',
  /** 날짜별 적용 */
  DATE = 'date',
  /** 속성별 적용 */
  PROPERTY = 'property'
}

/**
 * 프리셋 매핑 인터페이스
 * - 프리셋을 특정 대상에 연결하는 매핑 정보
 */
export interface IPresetMapping {
  /** 매핑 ID */
  readonly id: string;
  /** 매핑 유형 */
  readonly mappingType: PresetMappingType;
  /** 매핑 값 (폴더 경로, 태그명 등) */
  readonly value: string;
  /** 매핑 우선순위 */
  readonly priority: number;
  /** 하위 폴더 포함 여부 (폴더 매핑에서 사용) */
  readonly includeSubfolders?: boolean;
  /** 날짜 범위 (날짜 매핑에서 사용) */
  readonly dateRange?: {
    readonly start: Date;
    readonly end: Date;
  };
  /** 속성 (속성 매핑에서 사용) */
  readonly property?: {
    readonly name: string;
    readonly value: string;
  };
}

/**
 * 프리셋 설정
 * - 프리셋에 포함된 실제 설정 값
 */
export interface IPresetConfig {
  /** 카드셋 설정 */
  readonly cardSetConfig: ICardSetConfig;
  /** 레이아웃 설정 */
  readonly layoutConfig: ILayoutConfig;
  /** 카드 렌더링 설정 */
  readonly cardRenderConfig: ICardRenderConfig;
  /** 카드 스타일 설정 */
  readonly cardStyle: ICardStyle;
}

/**
 * 프리셋 메타데이터
 * - 프리셋의 기본 정보
 */
export interface IPresetMetadata {
  /** 프리셋 ID */
  readonly id: string;
  /** 프리셋 이름 */
  readonly name: string;
  /** 프리셋 설명 */
  readonly description?: string;
  /** 생성일 */
  readonly createdAt: Date;
  /** 수정일 */
  readonly updatedAt: Date;
  /** 프리셋 카테고리 (선택 사항, 단순 분류 목적) */
  readonly category?: string;
  /** 매핑 목록 - 이 프리셋이 어디에 적용되는지 정의 */
  readonly mappings: readonly IPresetMapping[];
}

/**
 * 프리셋 인터페이스
 * - 설정 묶음을 나타내는 도메인 모델
 * - 메타데이터와 설정을 포함
 * - 불변성 보장
 */
export interface IPreset {
  /** 메타데이터 */
  readonly metadata: IPresetMetadata;
  /** 설정 */
  readonly config: IPresetConfig;

  /**
   * 프리셋 유효성 검사
   */
  validate(): boolean;

  /**
   * 프리셋 미리보기
   */
  preview(): {
    readonly metadata: IPresetMetadata;
    readonly config: IPresetConfig;
  };
}

/**
 * 기본 프리셋 설정
 */
export const DEFAULT_PRESET_CONFIG: IPresetConfig = {
  cardSetConfig: DEFAULT_CARD_SET_CONFIG,
  layoutConfig: DEFAULT_LAYOUT_CONFIG,
  cardRenderConfig: DEFAULT_CARD_RENDER_CONFIG,
  cardStyle: DEFAULT_CARD_STYLE
};

/**
 * 기본 프리셋 메타데이터
 */
export const DEFAULT_PRESET_METADATA: IPresetMetadata = {
  id: '',
  name: '기본 프리셋',
  description: '기본 설정이 적용된 프리셋',
  createdAt: new Date(),
  updatedAt: new Date(),
  category: '기본',
  mappings: []
};

/**
 * 기본 프리셋
 */
export const DEFAULT_PRESET: IPreset = {
  metadata: DEFAULT_PRESET_METADATA,
  config: DEFAULT_PRESET_CONFIG,

  validate(): boolean {
    return true; // 기본값은 항상 유효
  },

  preview(): { metadata: IPresetMetadata; config: IPresetConfig } {
    return {
      metadata: this.metadata,
      config: this.config
    };
  }
}; 