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
import { App } from 'obsidian';
import CardNavigatorPlugin from '@/main';

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
  /** 하위 태그 포함 여부 (태그 매핑) */
  readonly includeSubtags?: boolean;
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
  /** 프리셋 ID */
  readonly presetId: string;
  /** 매핑 유형 */
  readonly type: PresetMappingType;
  /** 매핑 대상 값 */
  readonly target: string;
  /** 매핑 우선순위 */
  readonly priority: number;
  /** 추가 설정 */
  readonly options?: IPresetMappingOptions;
  /** 활성화 여부 */
  readonly enabled: boolean;
}

/**
 * 프리셋 기능 설정 인터페이스
 */
export interface IPresetFeatureConfig {
  /** 프리셋 매핑 우선순위 */
  readonly mappingPriority: readonly PresetMappingType[];
  /** 프리셋 자동 적용 여부 */
  readonly autoApply: boolean;
  /** 매핑 목록 */
  readonly mappings: readonly IPresetMapping[];
}

/**
 * 기본 프리셋 기능 설정
 */
export const DEFAULT_PRESET_FEATURE_CONFIG: IPresetFeatureConfig = {
  mappingPriority: [
    PresetMappingType.FOLDER,
    PresetMappingType.TAG,
    PresetMappingType.CREATED_DATE,
    PresetMappingType.MODIFIED_DATE,
    PresetMappingType.PROPERTY,
    PresetMappingType.GLOBAL
  ],
  autoApply: true,
  mappings: []
};

/**
 * 프리셋 컨텐츠 설정 인터페이스
 */
export interface IPresetContentConfig {
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
 * 기본 프리셋 컨텐츠 설정
 */
export const DEFAULT_PRESET_CONTENT_CONFIG: IPresetContentConfig = {
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
  readonly config: IPresetContentConfig;
  /** 매핑 ID 목록 */
  readonly mappingIds: readonly string[];
}

/**
 * 프리셋 클래스
 */
export class Preset implements IPreset {
  constructor(
    public readonly metadata: IPresetMetadata,
    public readonly config: IPresetContentConfig,
    public readonly mappingIds: readonly string[] = []
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
      !!this.config.sortConfig
    );
  }
}

/**
 * 매핑 저장소 인터페이스
 */
export interface IPresetMappingStore {
  /** 매핑 목록 */
  readonly mappings: readonly IPresetMapping[];
  /** 매핑 추가 */
  addMapping(mapping: IPresetMapping): void;
  /** 매핑 제거 */
  removeMapping(mappingId: string): void;
  /** 매핑 업데이트 */
  updateMapping(mapping: IPresetMapping): void;
  /** 매핑 활성화/비활성화 */
  toggleMapping(mappingId: string): void;
  /** 매핑 우선순위 변경 */
  changeMappingPriority(mappingId: string, newPriority: number): void;
  /** 매핑 저장 */
  save(): Promise<void>;
  /** 매핑 불러오기 */
  load(): Promise<void>;
}

/**
 * 매핑 저장소 클래스
 */
export class PresetMappingStore implements IPresetMappingStore {
  private _mappings: IPresetMapping[] = [];

  constructor(
    private readonly app: App,
    private readonly plugin: CardNavigatorPlugin
  ) {}

  get mappings(): readonly IPresetMapping[] {
    return this._mappings;
  }

  addMapping(mapping: IPresetMapping): void {
    this._mappings.push(mapping);
  }

  removeMapping(mappingId: string): void {
    this._mappings = this._mappings.filter(m => m.id !== mappingId);
  }

  updateMapping(mapping: IPresetMapping): void {
    const index = this._mappings.findIndex(m => m.id === mapping.id);
    if (index !== -1) {
      this._mappings[index] = mapping;
    }
  }

  toggleMapping(mappingId: string): void {
    this._mappings = this._mappings.map(mapping => {
      if (mapping.id === mappingId) {
        return {
          ...mapping,
          enabled: !mapping.enabled
        };
      }
      return mapping;
    });
  }

  changeMappingPriority(mappingId: string, newPriority: number): void {
    this._mappings = this._mappings.map(mapping => {
      if (mapping.id === mappingId) {
        return {
          ...mapping,
          priority: newPriority
        };
      }
      return mapping;
    });
  }

  async save(): Promise<void> {
    const data = {
      mappings: this._mappings
    };
    await this.app.vault.adapter.write(
      `${this.plugin.manifest.dir}/mappings.json`,
      JSON.stringify(data, null, 2)
    );
  }

  async load(): Promise<void> {
    try {
      const data = await this.app.vault.adapter.read(
        `${this.plugin.manifest.dir}/mappings.json`
      );
      const parsed = JSON.parse(data);
      this._mappings = parsed.mappings;
    } catch (error) {
      this._mappings = [];
    }
  }
}