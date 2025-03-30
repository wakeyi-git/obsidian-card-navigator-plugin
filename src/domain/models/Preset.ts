import { ICardSetConfig } from './CardSet';
import { LayoutType, LayoutDirection, ILayoutConfig } from './Layout';
import { ICardRenderConfig } from './Card';

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
  id: string;
  /** 매핑 타입 */
  type: PresetType;
  /** 매핑 값 */
  value: string;
  /** 매핑 우선순위 */
  priority?: number;
  /** 하위 폴더 포함 여부 */
  includeSubfolders?: boolean;
  /** 날짜 범위 */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** 속성 */
  property?: {
    name: string;
    value: string;
  };
}

/**
 * 프리셋 설정
 */
export interface IPresetConfig {
  /** 프리셋 이름 */
  name: string;
  /** 프리셋 설명 */
  description?: string;
  /** 카드셋 설정 */
  cardSetConfig: ICardSetConfig;
  /** 레이아웃 설정 */
  layoutConfig: ILayoutConfig;
  /** 카드 렌더링 설정 */
  cardRenderConfig: ICardRenderConfig;
  /** 매핑 목록 */
  mappings: IPresetMapping[];
}

/**
 * 프리셋 인터페이스
 */
export interface IPreset {
  id: string;
  name: string;
  description?: string;
  cardSetConfig: ICardSetConfig;
  layoutConfig: ILayoutConfig;
  cardRenderConfig: ICardRenderConfig;
  mappings: IPresetMapping[];
}

/**
 * 프리셋 클래스
 */
export class Preset implements IPreset {
  constructor(
    public readonly id: string,
    public name: string,
    public description?: string,
    public cardSetConfig: ICardSetConfig = {
      type: 'folder',
      value: '',
      includeSubfolders: true,
      sortBy: 'fileName',
      sortOrder: 'asc'
    },
    public layoutConfig: ILayoutConfig = {
      type: LayoutType.GRID,
      direction: LayoutDirection.VERTICAL,
      fixedHeight: true,
      minCardWidth: 200,
      minCardHeight: 150,
      cardWidth: 200,
      cardHeight: 150,
      gap: 16,
      padding: 16,
      viewportWidth: 800,
      viewportHeight: 600
    },
    public cardRenderConfig: ICardRenderConfig = {
      header: {
        showFileName: true,
        showFirstHeader: true,
        showTags: true,
        showCreatedDate: false,
        showUpdatedDate: false,
        showProperties: [],
        renderMarkdown: true
      },
      body: {
        showFileName: false,
        showFirstHeader: false,
        showContent: true,
        showTags: false,
        showCreatedDate: false,
        showUpdatedDate: false,
        showProperties: [],
        contentLength: 200,
        renderMarkdown: true
      },
      footer: {
        showFileName: false,
        showFirstHeader: false,
        showTags: false,
        showCreatedDate: false,
        showUpdatedDate: false,
        showProperties: [],
        renderMarkdown: true
      },
      renderAsHtml: true
    },
    public mappings: IPresetMapping[] = []
  ) {}

  /**
   * 매핑 추가
   */
  addMapping(mapping: IPresetMapping): void {
    this.mappings.push(mapping);
  }

  /**
   * 매핑 업데이트
   */
  updateMapping(mappingId: string, mapping: Partial<IPresetMapping>): void {
    const index = this.mappings.findIndex(m => m.id === mappingId);
    if (index !== -1) {
      this.mappings[index] = { ...this.mappings[index], ...mapping };
    }
  }

  /**
   * 매핑 삭제
   */
  removeMapping(mappingId: string): void {
    this.mappings = this.mappings.filter(m => m.id !== mappingId);
  }

  /**
   * 매핑 우선순위 업데이트
   */
  updateMappingPriority(priority: string[]): void {
    const sortedMappings: IPresetMapping[] = [];
    priority.forEach(id => {
      const mapping = this.mappings.find(m => m.id === id);
      if (mapping) {
        sortedMappings.push(mapping);
      }
    });
    this.mappings = sortedMappings;
  }

  /**
   * 매핑 존재 여부 확인
   */
  hasMapping(type: PresetType, value: string): boolean {
    return this.mappings.some(m => m.type === type && m.value === value);
  }

  /**
   * 매핑 목록 가져오기
   */
  getMappingsByType(type: PresetType): IPresetMapping[] {
    return this.mappings.filter(m => m.type === type);
  }

  /**
   * 매핑 목록 가져오기
   */
  getMappingsByValue(value: string): IPresetMapping[] {
    return this.mappings.filter(m => m.value === value);
  }

  /**
   * 매핑 가져오기
   */
  getMapping(mappingId: string): IPresetMapping | undefined {
    return this.mappings.find(m => m.id === mappingId);
  }

  /**
   * 프리셋 복제
   */
  clone(): Preset {
    return new Preset(
      crypto.randomUUID(),
      `${this.name} (복사본)`,
      this.description,
      { ...this.cardSetConfig },
      { ...this.layoutConfig },
      { ...this.cardRenderConfig },
      this.mappings.map(mapping => ({ ...mapping }))
    );
  }

  /**
   * 프리셋 유효성 검사
   */
  validate(): boolean {
    if (!this.name) {
      return false;
    }

    if (!this.cardSetConfig) {
      return false;
    }

    if (!this.layoutConfig) {
      return false;
    }

    if (!this.cardRenderConfig) {
      return false;
    }

    return true;
  }

  /**
   * 프리셋 데이터 직렬화
   */
  toJSON(): string {
    return JSON.stringify({
      id: this.id,
      name: this.name,
      description: this.description,
      cardSetConfig: this.cardSetConfig,
      layoutConfig: this.layoutConfig,
      cardRenderConfig: this.cardRenderConfig,
      mappings: this.mappings
    });
  }

  /**
   * 프리셋 데이터 역직렬화
   */
  static fromJSON(json: string): Preset {
    const data = JSON.parse(json);
    return new Preset(
      data.id,
      data.name,
      data.description,
      data.cardSetConfig,
      data.layoutConfig,
      data.cardRenderConfig,
      data.mappings
    );
  }

  /**
   * 프리셋 미리보기
   */
  preview(): {
    name: string;
    description?: string;
    cardSetConfig: ICardSetConfig;
    layoutConfig: ILayoutConfig;
    cardRenderConfig: ICardRenderConfig;
    mappings: IPresetMapping[];
  } {
    return {
      name: this.name,
      description: this.description,
      cardSetConfig: this.cardSetConfig,
      layoutConfig: this.layoutConfig,
      cardRenderConfig: this.cardRenderConfig,
      mappings: this.mappings
    };
  }
}

/**
 * 프리셋 매핑 클래스
 */
export class PresetMapping implements IPresetMapping {
  constructor(
    public readonly id: string,
    public readonly type: PresetType,
    public readonly value: string,
    public readonly priority: number
  ) {}

  clone(): PresetMapping {
    return new PresetMapping(
      crypto.randomUUID(),
      this.type,
      this.value,
      this.priority
    );
  }
} 