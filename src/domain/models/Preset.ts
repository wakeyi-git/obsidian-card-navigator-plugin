import { ICardSetConfig, DEFAULT_CARD_SET_CONFIG } from './CardSet';
import { ILayoutConfig, DEFAULT_LAYOUT_CONFIG } from './LayoutConfig';
import { ICardRenderConfig, DEFAULT_CARD_RENDER_CONFIG } from './CardRenderConfig';
import { ICardStyle, DEFAULT_CARD_STYLE } from './CardStyle';

/**
 * 프리셋 타입
 */
export enum PresetType {
  /** 전역 프리셋 */
  GLOBAL = 'GLOBAL',
  /** 폴더별 프리셋 */
  FOLDER = 'FOLDER',
  /** 태그별 프리셋 */
  TAG = 'TAG',
  /** 날짜별 프리셋 */
  DATE = 'DATE',
  /** 속성별 프리셋 */
  PROPERTY = 'PROPERTY'
}

/**
 * 프리셋 매핑 타입
 */
export type PresetMappingType = 'folder' | 'tag' | 'date' | 'property';

/**
 * 프리셋 매핑 인터페이스
 */
export interface IPresetMapping {
  /** 매핑 ID */
  readonly id: string;
  /** 매핑 타입 */
  readonly type: PresetType;
  /** 매핑 값 */
  readonly value: string;
  /** 매핑 우선순위 */
  readonly priority: number;
  /** 하위 폴더 포함 여부 */
  readonly includeSubfolders?: boolean;
  /** 날짜 범위 */
  readonly dateRange?: {
    readonly start: Date;
    readonly end: Date;
  };
  /** 속성 */
  readonly property?: {
    readonly name: string;
    readonly value: string;
  };
}

/**
 * 프리셋 설정
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
 */
export interface IPresetMetadata {
  /** 프리셋 ID */
  readonly id: string;
  /** 프리셋 이름 */
  readonly name: string;
  /** 프리셋 설명 */
  readonly description?: string;
  /** 프리셋 타입 */
  readonly type: PresetType;
  /** 생성일 */
  readonly createdAt: Date;
  /** 수정일 */
  readonly updatedAt: Date;
  /** 매핑 목록 */
  readonly mappings: readonly IPresetMapping[];
}

/**
 * 프리셋 인터페이스
 * - 프리셋의 도메인 모델
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
  type: PresetType.GLOBAL,
  createdAt: new Date(),
  updatedAt: new Date(),
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