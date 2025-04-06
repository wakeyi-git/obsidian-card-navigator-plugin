import { ILayoutConfig } from './LayoutConfig';
import { ICardConfig } from './CardConfig';
import { ISearchConfig } from './SearchConfig';
import { ISortConfig } from './SortConfig';
import { ICardSetConfig } from './CardSetConfig';

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
  /** 날짜별 적용 */
  DATE = 'date',
  /** 속성별 적용 */
  PROPERTY = 'property'
}

/**
 * 프리셋 매핑 옵션 인터페이스
 */
export interface IPresetMappingOptions {
  /** 하위 폴더 포함 여부 (폴더 매핑) */
  readonly includeSubfolders?: boolean;
  /** 날짜 범위 (날짜 매핑) */
  readonly dateRange?: {
    readonly start: Date;
    readonly end: Date;
  };
  /** 속성 (속성 매핑) */
  readonly property?: {
    readonly name: string;
    readonly value: string;
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
}

/**
 * 프리셋 설정 인터페이스
 */
export interface IPresetConfig {
  cardConfig: ICardConfig;
  cardSetConfig: ICardSetConfig;
  searchConfig: ISearchConfig;
  sortConfig: ISortConfig;
  layoutConfig: ILayoutConfig;
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

  /**
   * 프리셋 미리보기
   */
  preview(): IPresetConfig;

  /**
   * 프리셋 업데이트
   */
  update(config: Partial<IPresetConfig>): IPreset;
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
      !!this.config.cardSetConfig &&
      !!this.config.layoutConfig &&
      !!this.config.cardConfig &&
      !!this.config.searchConfig &&
      !!this.config.sortConfig
    );
  }

  /**
   * 프리셋 미리보기
   */
  public preview(): IPresetConfig {
    return { ...this.config };
  }

  /**
   * 프리셋 업데이트
   */
  public update(config: Partial<IPresetConfig>): IPreset {
    return new Preset(
      {
        ...this.metadata,
        updatedAt: new Date()
      },
      {
        ...this.config,
        ...config
      },
      this.mappings
    );
  }
} 