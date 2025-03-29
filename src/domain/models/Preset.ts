import { CardSet, CardSetType, ICardSetConfig } from './CardSet';
import { Layout } from './Layout';
import { ICardRenderConfig } from './Card';
import { ILinkConfig } from './CardSet';

/**
 * 프리셋 타입
 */
export enum PresetType {
  /** 전역 프리셋 */
  GLOBAL = 'GLOBAL',
  /** 폴더별 프리셋 */
  FOLDER = 'FOLDER',
  /** 태그별 프리셋 */
  TAG = 'TAG'
}

/**
 * 프리셋 매핑 타입
 */
export type PresetMappingType = 'folder' | 'tag' | 'date' | 'file';

/**
 * 프리셋 매핑
 */
export interface IPresetMapping {
  /** 매핑 ID */
  id: string;
  /** 프리셋 ID */
  presetId: string;
  /** 매핑 타입 */
  type: PresetMappingType;
  /** 매핑 값 */
  value: string;
  /** 우선순위 */
  priority: number;
  /** 하위 폴더 포함 여부 */
  includeSubfolders?: boolean;
  /** 시작 날짜 */
  startDate?: Date;
  /** 종료 날짜 */
  endDate?: Date;
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
  cardSetConfig: CardSet['config'];
  /** 레이아웃 설정 */
  layoutConfig: Layout['config'];
  /** 카드 렌더링 설정 */
  cardRenderConfig: ICardRenderConfig;
  /** 매핑 목록 */
  mappings: IPresetMapping[];
}

/**
 * 프리셋 인터페이스
 */
export interface IPreset {
  /** 프리셋 ID */
  id: string;
  /** 프리셋 설정 */
  config: IPresetConfig;
  /** 생성 날짜 */
  createdAt: Date;
  /** 업데이트 날짜 */
  updatedAt: Date;
}

/**
 * 프리셋 클래스
 */
export class Preset implements IPreset {
  private _id: string;
  private _name: string;
  private _description?: string;
  private _cardSetConfig: CardSet['config'];
  private _layoutConfig: Layout['config'];
  private _cardRenderConfig: ICardRenderConfig;
  private _mappings: IPresetMapping[];
  private _createdAt: Date;
  private _updatedAt: Date;
  private _cardSetType: CardSetType;
  private _includeSubfolders: boolean;
  private _linkConfig?: ILinkConfig;
  private _sortBy: 'fileName' | 'firstHeader' | 'createdAt' | 'updatedAt' | 'custom';
  private _sortOrder: 'asc' | 'desc';
  private _customSortField?: string;
  private _cardWidth: number;
  private _cardHeight: number;
  private _fixedHeight: boolean;
  private _cardStyle: {
    card: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    activeCard: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    focusedCard: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    header: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    body: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    footer: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
  };

  constructor(
    id: string,
    config: IPresetConfig,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this._id = id;
    this._name = config.name;
    this._description = config.description;
    this._cardSetConfig = config.cardSetConfig;
    this._layoutConfig = config.layoutConfig;
    this._cardRenderConfig = config.cardRenderConfig;
    this._mappings = config.mappings;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._cardSetType = config.cardSetConfig.type;
    this._includeSubfolders = config.cardSetConfig.includeSubfolders || false;
    this._linkConfig = config.cardSetConfig.linkConfig;
    this._sortBy = config.cardSetConfig.sortBy || 'fileName';
    this._sortOrder = config.cardSetConfig.sortOrder || 'asc';
    this._customSortField = config.cardSetConfig.customSortField;
    this._cardWidth = config.layoutConfig.cardWidth || 300;
    this._cardHeight = config.layoutConfig.cardHeight || 200;
    this._fixedHeight = false;
    this._cardStyle = {
      card: {
        background: '#ffffff',
        fontSize: '14px',
        borderColor: '#e0e0e0',
        borderWidth: '1px'
      },
      activeCard: {
        background: '#f5f5f5',
        fontSize: '14px',
        borderColor: '#2196f3',
        borderWidth: '2px'
      },
      focusedCard: {
        background: '#e3f2fd',
        fontSize: '14px',
        borderColor: '#1976d2',
        borderWidth: '2px'
      },
      header: {
        background: '#f8f9fa',
        fontSize: '16px',
        borderColor: '#e0e0e0',
        borderWidth: '1px'
      },
      body: {
        background: '#ffffff',
        fontSize: '14px',
        borderColor: '#e0e0e0',
        borderWidth: '1px'
      },
      footer: {
        background: '#f8f9fa',
        fontSize: '12px',
        borderColor: '#e0e0e0',
        borderWidth: '1px'
      }
    };
  }

  get id(): string {
    return this._id;
  }

  get config(): IPresetConfig {
    return {
      name: this._name,
      description: this._description,
      cardSetConfig: this._cardSetConfig,
      layoutConfig: this._layoutConfig,
      cardRenderConfig: this._cardRenderConfig,
      mappings: this._mappings
    };
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
    this._updatedAt = new Date();
  }

  get description(): string | undefined {
    return this._description;
  }

  set description(value: string | undefined) {
    this._description = value;
    this._updatedAt = new Date();
  }

  get cardSetConfig(): CardSet['config'] {
    return this._cardSetConfig;
  }

  get layoutConfig(): Layout['config'] {
    return this._layoutConfig;
  }

  get cardRenderConfig(): ICardRenderConfig {
    return this._cardRenderConfig;
  }

  get mappings(): IPresetMapping[] {
    return this._mappings;
  }

  get cardSetType(): CardSetType {
    return this._cardSetType;
  }

  set cardSetType(value: CardSetType) {
    this._cardSetType = value;
    this._cardSetConfig.type = value;
    this._updatedAt = new Date();
  }

  get includeSubfolders(): boolean {
    return this._includeSubfolders;
  }

  set includeSubfolders(value: boolean) {
    this._includeSubfolders = value;
    this._cardSetConfig.includeSubfolders = value;
    this._updatedAt = new Date();
  }

  get linkConfig(): ILinkConfig | undefined {
    return this._linkConfig;
  }

  set linkConfig(value: ILinkConfig | undefined) {
    this._linkConfig = value;
    this._cardSetConfig.linkConfig = value;
    this._updatedAt = new Date();
  }

  get sortBy(): 'fileName' | 'firstHeader' | 'createdAt' | 'updatedAt' | 'custom' {
    return this._sortBy;
  }

  set sortBy(value: 'fileName' | 'firstHeader' | 'createdAt' | 'updatedAt' | 'custom') {
    this._sortBy = value;
    this._cardSetConfig.sortBy = value;
    this._updatedAt = new Date();
  }

  get sortOrder(): 'asc' | 'desc' {
    return this._sortOrder;
  }

  set sortOrder(value: 'asc' | 'desc') {
    this._sortOrder = value;
    this._cardSetConfig.sortOrder = value;
    this._updatedAt = new Date();
  }

  get customSortField(): string | undefined {
    return this._customSortField;
  }

  set customSortField(value: string | undefined) {
    this._customSortField = value;
    this._cardSetConfig.customSortField = value;
    this._updatedAt = new Date();
  }

  get cardWidth(): number {
    return this._cardWidth;
  }

  set cardWidth(value: number) {
    this._cardWidth = value;
    this._layoutConfig.cardWidth = value;
    this._updatedAt = new Date();
  }

  get cardHeight(): number {
    return this._cardHeight;
  }

  set cardHeight(value: number) {
    this._cardHeight = value;
    this._layoutConfig.cardHeight = value;
    this._updatedAt = new Date();
  }

  get fixedHeight(): boolean {
    return this._fixedHeight;
  }

  set fixedHeight(value: boolean) {
    this._fixedHeight = value;
    this._updatedAt = new Date();
  }

  get cardStyle(): {
    card: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    activeCard: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    focusedCard: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    header: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    body: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    footer: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
  } {
    return this._cardStyle;
  }

  set cardStyle(value: {
    card: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    activeCard: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    focusedCard: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    header: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    body: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    footer: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
  }) {
    this._cardStyle = value;
    this._updatedAt = new Date();
  }

  /**
   * 프리셋 생성
   */
  static createDefault(name: string): Preset {
    return new Preset(
      crypto.randomUUID(),
      {
        name,
        description: '',
        cardSetConfig: {
          type: 'folder',
          value: '',
          includeSubfolders: true,
          sortBy: 'fileName',
          sortOrder: 'asc'
        },
        layoutConfig: {
          type: 'grid',
          cardWidth: 300,
          cardHeight: 200,
          gap: 10,
          padding: 20,
          viewportWidth: 800,
          viewportHeight: 600
        },
        cardRenderConfig: {
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
        mappings: []
      }
    );
  }

  /**
   * 프리셋 복제
   */
  clone(): Preset {
    return new Preset(
      crypto.randomUUID(),
      {
        name: `${this._name} (복사본)`,
        description: this._description,
        cardSetConfig: {
          ...this._cardSetConfig,
          sortBy: this._cardSetConfig.sortBy || 'fileName',
          sortOrder: this._cardSetConfig.sortOrder || 'asc'
        },
        layoutConfig: { ...this._layoutConfig },
        cardRenderConfig: { ...this._cardRenderConfig },
        mappings: [...this._mappings]
      }
    );
  }

  /**
   * 프리셋 업데이트
   */
  update(config: IPresetConfig): void {
    this._name = config.name;
    this._description = config.description;
    this._cardSetConfig = {
      ...config.cardSetConfig,
      sortBy: config.cardSetConfig.sortBy || 'fileName',
      sortOrder: config.cardSetConfig.sortOrder || 'asc'
    };
    this._layoutConfig = config.layoutConfig;
    this._cardRenderConfig = config.cardRenderConfig;
    this._mappings = config.mappings;
    this._updatedAt = new Date();
  }

  /**
   * 매핑 조회
   */
  getMapping(mappingId: string): IPresetMapping | undefined {
    return this._mappings.find(m => m.id === mappingId);
  }

  /**
   * 타입별 매핑 조회
   */
  getMappingsByType(type: string): IPresetMapping[] {
    return this._mappings.filter(m => m.type === type);
  }

  /**
   * 값별 매핑 조회
   */
  getMappingsByValue(value: string): IPresetMapping[] {
    return this._mappings.filter(m => m.value === value);
  }

  /**
   * 매핑 존재 여부 확인
   */
  hasMapping(type: string, value: string): boolean {
    return this._mappings.some(m => m.type === type && m.value === value);
  }

  /**
   * 매핑 추가
   */
  addMapping(mapping: IPresetMapping): void {
    this._mappings.push(mapping);
    this._updatedAt = new Date();
  }

  /**
   * 매핑 업데이트
   */
  updateMapping(mappingId: string, mapping: Partial<IPresetMapping>): void {
    const index = this._mappings.findIndex(m => m.id === mappingId);
    if (index !== -1) {
      this._mappings[index] = { ...this._mappings[index], ...mapping };
      this._updatedAt = new Date();
    }
  }

  /**
   * 매핑 제거
   */
  removeMapping(mappingId: string): void {
    this._mappings = this._mappings.filter(m => m.id !== mappingId);
    this._updatedAt = new Date();
  }

  /**
   * 매핑 우선순위 업데이트
   */
  updateMappingPriority(mappingId: string, priority: number): void {
    const index = this._mappings.findIndex(m => m.id === mappingId);
    if (index !== -1) {
      this._mappings[index].priority = priority;
      this._updatedAt = new Date();
    }
  }

  /**
   * 매핑 우선순위 정렬
   */
  sortMappingsByPriority(): void {
    this._mappings.sort((a, b) => b.priority - a.priority);
    this._updatedAt = new Date();
  }

  /**
   * 카드셋 설정 유효성 검사
   */
  private _validateCardSetConfig(config: ICardSetConfig): void {
    if (!config.type || !['folder', 'tag', 'link', 'search'].includes(config.type)) {
      throw new Error('Invalid card set type');
    }

    if (!config.value) {
      throw new Error('Value is required');
    }

    if (config.type === 'folder' && !config.value.startsWith('/')) {
      throw new Error('Folder path must start with /');
    }

    if (config.type === 'tag' && !config.value.startsWith('#')) {
      throw new Error('Tag must start with #');
    }

    if (config.type === 'link' && !config.linkConfig) {
      throw new Error('Link configuration is required for link type');
    }

    if (config.type === 'search' && !config.options?.query) {
      throw new Error('Search query is required for search type');
    }
  }
}

/**
 * 프리셋 매핑 클래스
 */
export class PresetMapping implements IPresetMapping {
  private _id: string;
  private _presetId: string;
  private _type: PresetMappingType;
  private _value: string;
  private _priority: number;
  private _includeSubfolders?: boolean;
  private _startDate?: Date;
  private _endDate?: Date;

  constructor(
    id: string,
    presetId: string,
    type: PresetMappingType,
    value: string,
    priority: number,
    includeSubfolders?: boolean,
    startDate?: Date,
    endDate?: Date
  ) {
    this._id = id;
    this._presetId = presetId;
    this._type = type;
    this._value = value;
    this._priority = priority;
    this._includeSubfolders = includeSubfolders;
    this._startDate = startDate;
    this._endDate = endDate;
  }

  get id(): string {
    return this._id;
  }

  get presetId(): string {
    return this._presetId;
  }

  get type(): PresetMappingType {
    return this._type;
  }

  get value(): string {
    return this._value;
  }

  get priority(): number {
    return this._priority;
  }

  get includeSubfolders(): boolean | undefined {
    return this._includeSubfolders;
  }

  get startDate(): Date | undefined {
    return this._startDate;
  }

  get endDate(): Date | undefined {
    return this._endDate;
  }

  clone(): PresetMapping {
    return new PresetMapping(
      crypto.randomUUID(),
      this._presetId,
      this._type,
      this._value,
      this._priority,
      this._includeSubfolders,
      this._startDate ? new Date(this._startDate) : undefined,
      this._endDate ? new Date(this._endDate) : undefined
    );
  }
} 