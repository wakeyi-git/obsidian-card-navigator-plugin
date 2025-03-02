import { IPreset, PresetSettings } from '../types/preset.types';
import { 
  CardContentSettings, 
  CardStyleSettings, 
  CardLayoutSettings,
  CardSetSettings 
} from '../types/settings.types';
import { CardSetMode, CardSortBy } from '../types/cardset.types';

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
   * 생성자
   * @param data 프리셋 데이터
   */
  constructor(data: IPreset) {
    this._id = data.id;
    this._name = data.name;
    this._description = data.description || '';
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
    this._settings = { ...data.settings };
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
      settings: { ...this._settings }
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
      settings: { ...this._settings }
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
      settings: {
        cardContent: {
          showFileName: true,
          showFirstHeader: true,
          showBody: true,
          bodyLengthLimit: true,
          showTags: true,
          bodyLength: 200,
          renderContentAsHtml: true
        },
        cardStyle: {
          fileNameFontSize: '16px',
          firstHeaderFontSize: '16px',
          bodyFontSize: '14px',
          tagsFontSize: '12px',
          cardPadding: '16px',
          cardBorderRadius: '8px',
          dragDropContent: true
        },
        layout: {
          cardThresholdWidth: 300,
          alignCardHeight: false,
          useFixedHeight: false,
          fixedCardHeight: 200,
          cardsPerColumn: 3
        },
        sort: {
          sortBy: 'modificationDate',
          sortDirection: 'desc'
        },
        cardSet: {
          cardSetMode: CardSetMode.ACTIVE_FOLDER,
          selectedFolder: null,
          sortBy: 'modified-time',
          sortDirection: 'desc'
        }
      }
    });
  }
} 