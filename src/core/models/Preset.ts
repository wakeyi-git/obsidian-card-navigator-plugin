import { IPreset, PresetSettings, PresetOptions } from '../types/preset.types';
import { 
  CardContentSettings, 
  CardStyleSettings, 
  CardLayoutSettings,
  CardSet 
} from '../types/settings.types';
import { CardSetMode, CardSetOptions } from '../types/cardset.types';
import { SortBy, SortDirection, SortOption } from '../types/common.types';
import { LayoutType } from '../types/settings.types';

/**
 * 프리셋 모델 클래스
 * 카드 네비게이터의 설정 프리셋을 나타내는 클래스입니다.
 */
export class Preset implements IPreset {
  /**
   * 프리셋 ID
   */
  private _id: string;
  
  /**
   * 프리셋 이름
   */
  private _name: string;
  
  /**
   * 프리셋 설명
   */
  private _description: string;
  
  /**
   * 생성 날짜
   */
  private _createdAt: number;
  
  /**
   * 수정 날짜
   */
  private _updatedAt: number;
  
  /**
   * 프리셋 설정
   */
  private _settings: PresetSettings;
  
  /**
   * 프리셋 옵션
   */
  private _options: PresetOptions;
  
  /**
   * 기본 프리셋 여부
   */
  private _isDefault: boolean;
  
  /**
   * 마지막 수정 날짜
   */
  private _lastModified: number;
  
  /**
   * 생성자
   * @param data 프리셋 데이터
   */
  constructor(data: IPreset);
  
  /**
   * 생성자
   * @param id 프리셋 ID
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   * @param settings 프리셋 설정
   * @param isDefault 기본 프리셋 여부
   */
  constructor(id: string, name: string, description: string, settings: Partial<PresetSettings>, isDefault?: boolean);
  
  constructor(dataOrId: IPreset | string, name?: string, description?: string, settings?: Partial<PresetSettings>, isDefault?: boolean) {
    if (typeof dataOrId === 'string') {
      const now = Date.now();
      this._id = dataOrId;
      this._name = name || '새 프리셋';
      this._description = description || '';
      this._createdAt = now;
      this._updatedAt = now;
      this._settings = settings ? { ...Preset.getDefaultSettings(), ...settings } : Preset.getDefaultSettings();
      this._options = {
        cardSet: {
          mode: CardSetMode.ACTIVE_FOLDER,
          sortOption: {
            field: SortBy.MODIFIED,
            direction: SortDirection.DESC
          },
          filterOptions: [],
          groupOption: {
            by: 'none'
          },
          includeSubfolders: true,
          autoRefresh: true
        },
        sort: {
          field: SortBy.MODIFIED,
          direction: SortDirection.DESC
        },
        layout: {
          type: LayoutType.MASONRY,
          cardThresholdWidth: 250,
          alignCardHeight: false,
          useFixedHeight: false,
          fixedCardHeight: 0,
          cardsPerColumn: 0,
          isVertical: true,
          smoothScroll: true
        },
        style: {
          showHeader: true,
          showFooter: true,
          showTags: true
        }
      };
      this._isDefault = isDefault || false;
      this._lastModified = now;
    } else {
      this._id = dataOrId.id;
      this._name = dataOrId.name;
      this._description = dataOrId.description || '';
      this._createdAt = dataOrId.createdAt;
      this._updatedAt = dataOrId.updatedAt;
      this._settings = { ...dataOrId.settings };
      this._options = { ...dataOrId.options };
      this._isDefault = dataOrId.isDefault || false;
      this._lastModified = dataOrId.lastModified || Date.now();
    }
  }
  
  /**
   * 프리셋 ID 가져오기
   */
  get id(): string {
    return this._id;
  }
  
  /**
   * 프리셋 이름 가져오기
   */
  get name(): string {
    return this._name;
  }
  
  /**
   * 프리셋 이름 설정하기
   */
  set name(value: string) {
    this._name = value;
    this._updatedAt = Date.now();
  }
  
  /**
   * 프리셋 설명 가져오기
   */
  get description(): string {
    return this._description;
  }
  
  /**
   * 프리셋 설명 설정하기
   */
  set description(value: string) {
    this._description = value;
    this._updatedAt = Date.now();
  }
  
  /**
   * 생성 날짜 가져오기
   */
  get createdAt(): number {
    return this._createdAt;
  }
  
  /**
   * 수정 날짜 가져오기
   */
  get updatedAt(): number {
    return this._updatedAt;
  }
  
  /**
   * 프리셋 설정 가져오기
   */
  get settings(): PresetSettings {
    return { ...this._settings };
  }
  
  /**
   * 프리셋 설정 설정하기
   */
  set settings(value: PresetSettings) {
    this._settings = { ...value };
    this._updatedAt = Date.now();
  }
  
  /**
   * 프리셋 옵션 가져오기
   */
  get options(): PresetOptions {
    return { ...this._options };
  }
  
  /**
   * 프리셋 옵션 설정하기
   */
  set options(value: PresetOptions) {
    this._options = { ...value };
    this._updatedAt = Date.now();
  }
  
  /**
   * 프리셋 설정 업데이트하기
   * @param settings 업데이트할 설정
   */
  updateSettings(settings: Partial<PresetSettings>): void {
    this._settings = {
      ...this._settings,
      ...settings
    };
    this._updatedAt = Date.now();
  }
  
  /**
   * 프리셋 데이터로 변환하기
   * @returns 프리셋 데이터
   */
  toData(): IPreset {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      settings: { ...this._settings },
      options: { ...this._options },
      isDefault: this._isDefault,
      lastModified: this._lastModified
    };
  }
  
  /**
   * 프리셋 복제하기
   * @param newId 새 프리셋 ID
   * @param newName 새 프리셋 이름
   * @returns 복제된 프리셋
   */
  clone(newId: string, newName?: string): Preset {
    const now = Date.now();
    
    return new Preset({
      id: newId,
      name: newName || `${this._name} 복사본`,
      description: this._description,
      createdAt: now,
      updatedAt: now,
      settings: { ...this._settings },
      options: { ...this._options },
      isDefault: false,
      lastModified: now
    });
  }
  
  /**
   * 프리셋 데이터에서 프리셋 생성하기
   * @param data 프리셋 데이터
   * @returns 프리셋 인스턴스
   */
  static fromData(data: IPreset): Preset {
    return new Preset(data);
  }
  
  /**
   * 기본 프리셋 생성하기
   * @param id 프리셋 ID
   * @param name 프리셋 이름
   * @returns 기본 프리셋 인스턴스
   */
  static createDefault(id: string, name: string): Preset {
    const now = Date.now();
    
    return new Preset({
      id,
      name,
      description: '기본 프리셋',
      createdAt: now,
      updatedAt: now,
      settings: Preset.getDefaultSettings(),
      options: {
        cardSet: {
          mode: CardSetMode.ACTIVE_FOLDER,
          sortOption: {
            field: SortBy.MODIFIED,
            direction: SortDirection.DESC
          },
          filterOptions: [],
          groupOption: {
            by: 'none'
          },
          includeSubfolders: true,
          autoRefresh: true
        },
        sort: {
          field: SortBy.MODIFIED,
          direction: SortDirection.DESC
        },
        layout: {
          type: LayoutType.MASONRY,
          cardThresholdWidth: 250,
          alignCardHeight: false,
          useFixedHeight: false,
          fixedCardHeight: 0,
          cardsPerColumn: 0,
          isVertical: true,
          smoothScroll: true
        },
        style: {
          showHeader: true,
          showFooter: true,
          showTags: true
        }
      },
      isDefault: true,
      lastModified: now
    });
  }
  
  /**
   * 기본 설정 가져오기
   * @returns 기본 프리셋 설정
   */
  static getDefaultSettings(): PresetSettings {
    return {
      cardSet: {
        mode: CardSetMode.ACTIVE_FOLDER,
        sortOption: {
          field: SortBy.MODIFIED,
          direction: SortDirection.DESC
        },
        filterOptions: [],
        groupOption: {
          by: 'none'
        },
        includeSubfolders: true,
        autoRefresh: true
      },
      sort: {
        field: SortBy.MODIFIED,
        direction: SortDirection.DESC
      },
      layout: {
        type: LayoutType.MASONRY,
        cardThresholdWidth: 250,
        alignCardHeight: false,
        useFixedHeight: false,
        fixedCardHeight: 0,
        cardsPerColumn: 0,
        isVertical: true,
        smoothScroll: true
      },
      style: {
        showHeader: true,
        showFooter: true,
        showTags: true
      }
    };
  }
} 