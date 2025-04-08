import { 
  ICardStateStyle, 
  ICardDisplayOptions, 
  ICardSection, 
  IRenderConfig,
  DEFAULT_CARD_STATE_STYLE,
  DEFAULT_CARD_DISPLAY_OPTIONS,
  DEFAULT_CARD_SECTION,
  DEFAULT_RENDER_CONFIG
} from './Card';
import { ICardSetConfig, DEFAULT_CARD_SET_CONFIG } from './CardSet';
import { ISearchConfig, DEFAULT_SEARCH_CONFIG } from './Search';
import { ISortConfig, DEFAULT_SORT_CONFIG } from './Sort';
import { ILayoutConfig, DEFAULT_LAYOUT_CONFIG } from './Layout';

/**
 * 프리셋 매핑 유형
 */
export enum PresetMappingType {
  /** 전역 적용 */
  GLOBAL = 'global',
  /** 폴더별 적용 */
  FOLDER = 'folder',
  /** 태그별 적용 */
  TAG = 'tag',
  /** 생성일별 적용 */
  CREATED_DATE = 'createdDate',
  /** 수정일별 적용 */
  MODIFIED_DATE = 'modifiedDate',
  /** 속성별 적용 */
  PROPERTY = 'property'
}

/**
 * 프리셋 매핑 옵션 인터페이스
 */
export interface IPresetMappingOptions {
  /** 하위 폴더 포함 여부 (폴더 매핑) */
  readonly includeSubfolders?: boolean;
  /** 날짜 범위 (생성일/수정일 매핑) */
  readonly dateRange?: {
    /** 시작일 */
    readonly start: Date;
    /** 종료일 */
    readonly end: Date;
  };
  /** 속성 (속성 매핑) */
  readonly property?: {
    /** 속성명 */
    readonly name: string;
    /** 속성값 */
    readonly value: string;
    /** 정규식 사용 여부 */
    readonly useRegex?: boolean;
  };
}

/**
 * 프리셋 매핑 인터페이스
 */
export interface IPresetMapping {
  /** 매핑 ID */
  readonly id: string;
  /** 매핑 유형 */
  readonly type: PresetMappingType;
  /** 매핑 값 */
  readonly value: string;
  /** 매핑 우선순위 */
  readonly priority: number;
  /** 추가 설정 */
  readonly options?: IPresetMappingOptions;
  /** 활성화 여부 */
  readonly enabled: boolean;
}

/**
 * 프리셋 설정 인터페이스
 */
export interface IPresetConfig {
  /** 카드 상태별 스타일 */
  readonly cardStateStyle: ICardStateStyle;
  /** 카드 표시 옵션 */
  readonly cardDisplayOptions: ICardDisplayOptions;
  /** 카드 섹션 설정 */
  readonly cardSections: {
    /** 헤더 섹션 */
    readonly header: ICardSection;
    /** 바디 섹션 */
    readonly body: ICardSection;
    /** 푸터 섹션 */
    readonly footer: ICardSection;
  };
  /** 카드 렌더링 설정 */
  readonly cardRenderConfig: IRenderConfig;
  /** 카드셋 설정 */
  readonly cardSetConfig: ICardSetConfig;
  /** 검색 설정 */
  readonly searchConfig: ISearchConfig;
  /** 정렬 설정 */
  readonly sortConfig: ISortConfig;
  /** 레이아웃 설정 */
  readonly layoutConfig: ILayoutConfig;
}

/**
 * 프리셋 메타데이터 인터페이스
 */
export interface IPresetMetadata {
  /** 프리셋 ID */
  readonly id: string;
  /** 프리셋 이름 */
  readonly name: string;
  /** 프리셋 설명 */
  readonly description: string;
  /** 생성일 */
  readonly createdAt: Date;
  /** 수정일 */
  readonly updatedAt: Date;
  /** 프리셋 카테고리 */
  readonly category: string;
}

/**
 * 프리셋 인터페이스
 */
export interface IPreset {
  /** 메타데이터 */
  readonly metadata: IPresetMetadata;
  /** 설정 */
  readonly config: IPresetConfig;
  /** 매핑 목록 */
  readonly mappings: readonly IPresetMapping[];

  /**
   * 프리셋 유효성 검사
   */
  validate(): boolean;
}

/**
 * 프리셋 클래스
 */
export class Preset implements IPreset {
  constructor(
    public readonly metadata: IPresetMetadata,
    public readonly config: IPresetConfig,
    public readonly mappings: readonly IPresetMapping[] = []
  ) {}

  /**
   * 프리셋 유효성 검사
   */
  public validate(): boolean {
    return (
      !!this.metadata.id &&
      !!this.metadata.name &&
      !!this.metadata.description &&
      !!this.metadata.createdAt &&
      !!this.metadata.updatedAt &&
      !!this.metadata.category &&
      !!this.config.cardStateStyle &&
      !!this.config.cardDisplayOptions &&
      !!this.config.cardSections.header &&
      !!this.config.cardSections.body &&
      !!this.config.cardSections.footer &&
      !!this.config.cardRenderConfig &&
      !!this.config.cardSetConfig &&
      !!this.config.layoutConfig &&
      !!this.config.searchConfig &&
      !!this.config.sortConfig &&
      this.mappings.every(mapping => this.validateMapping(mapping))
    );
  }

  /**
   * 매핑 유효성 검사
   */
  private validateMapping(mapping: IPresetMapping): boolean {
    if (!mapping.id || !mapping.type || !mapping.value || mapping.priority < 0) {
      return false;
    }

    switch (mapping.type) {
      case PresetMappingType.FOLDER:
        return !!mapping.options?.includeSubfolders;
      case PresetMappingType.CREATED_DATE:
      case PresetMappingType.MODIFIED_DATE:
        return !!mapping.options?.dateRange?.start && !!mapping.options?.dateRange?.end;
      case PresetMappingType.PROPERTY:
        return !!mapping.options?.property?.name && !!mapping.options?.property?.value;
      default:
        return true;
    }
  }
}

/**
 * 기본 프리셋 설정
 */
export const DEFAULT_PRESET_CONFIG: IPresetConfig = {
  cardStateStyle: DEFAULT_CARD_STATE_STYLE,
  cardDisplayOptions: DEFAULT_CARD_DISPLAY_OPTIONS,
  cardSections: {
    header: DEFAULT_CARD_SECTION,
    body: DEFAULT_CARD_SECTION,
    footer: DEFAULT_CARD_SECTION
  },
  cardRenderConfig: DEFAULT_RENDER_CONFIG,
  cardSetConfig: DEFAULT_CARD_SET_CONFIG,
  searchConfig: DEFAULT_SEARCH_CONFIG,
  sortConfig: DEFAULT_SORT_CONFIG,
  layoutConfig: DEFAULT_LAYOUT_CONFIG
};