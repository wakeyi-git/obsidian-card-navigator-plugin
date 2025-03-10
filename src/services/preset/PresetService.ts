import { DomainEventBus } from '../../events/DomainEventBus';
import { ISettingsService } from '../core/SettingsService';
import { ICardSetService } from '../cardset/CardSetService';
import { ILayoutService } from '../layout/LayoutService';
import { ISortingService } from '../sorting/SortingService';
import { ISearchService } from '../search/SearchService';

/**
 * 프리셋 타입
 */
export interface IPreset {
  id: string;
  name: string;
  description?: string;
  cardSetType: string;
  cardSetSource: string;
  layoutType: string;
  sortType: string;
  sortDirection: string;
  cardWidth: number;
  cardHeight: number;
  fixedHeight: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * 프리셋 서비스 인터페이스
 */
export interface IPresetService {
  /**
   * 모든 프리셋 가져오기
   * @returns 프리셋 목록
   */
  getAllPresets(): IPreset[];
  
  /**
   * 프리셋 가져오기
   * @param presetId 프리셋 ID
   * @returns 프리셋
   */
  getPreset(presetId: string): IPreset | undefined;
  
  /**
   * 현재 설정으로 프리셋 생성
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   * @returns 생성된 프리셋
   */
  createPresetFromCurrentSettings(name: string, description?: string): Promise<IPreset>;
  
  /**
   * 프리셋 업데이트
   * @param presetId 프리셋 ID
   * @param updates 업데이트할 필드
   * @returns 업데이트된 프리셋
   */
  updatePreset(presetId: string, updates: Partial<IPreset>): Promise<IPreset | undefined>;
  
  /**
   * 프리셋 삭제
   * @param presetId 프리셋 ID
   * @returns 삭제 성공 여부
   */
  deletePreset(presetId: string): Promise<boolean>;
  
  /**
   * 프리셋 적용
   * @param presetId 프리셋 ID
   * @returns 적용 성공 여부
   */
  applyPreset(presetId: string): Promise<boolean>;
  
  /**
   * 현재 설정이 프리셋과 일치하는지 확인
   * @param presetId 프리셋 ID
   * @returns 일치 여부
   */
  isCurrentSettingsMatchPreset(presetId: string): boolean;
  
  /**
   * 현재 활성화된 프리셋 ID 가져오기
   * @returns 현재 활성화된 프리셋 ID
   */
  getCurrentPresetId(): string | null;
}

/**
 * 프리셋 서비스 구현
 */
export class PresetService implements IPresetService {
  private settingsService: ISettingsService;
  private cardSetService: ICardSetService;
  private layoutService: ILayoutService;
  private sortingService: ISortingService;
  private searchService: ISearchService;
  private eventBus: DomainEventBus;
  private presets: IPreset[] = [];
  private currentPresetId: string | null = null;
  
  /**
   * 생성자
   * @param settingsService 설정 서비스
   * @param cardSetService 카드셋 서비스
   * @param layoutService 레이아웃 서비스
   * @param sortingService 정렬 서비스
   * @param searchService 검색 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    settingsService: ISettingsService,
    cardSetService: ICardSetService,
    layoutService: ILayoutService,
    sortingService: ISortingService,
    searchService: ISearchService,
    eventBus: DomainEventBus
  ) {
    this.settingsService = settingsService;
    this.cardSetService = cardSetService;
    this.layoutService = layoutService;
    this.sortingService = sortingService;
    this.searchService = searchService;
    this.eventBus = eventBus;
    
    // 설정에서 프리셋 로드
    this.presets = this.settingsService.getSetting('presets', []);
    this.currentPresetId = this.settingsService.getSetting('currentPresetId', null);
    
    // 설정 변경 이벤트 구독
    this.eventBus.subscribe('settings:changed', (data: any) => {
      if (data.key === 'presets') {
        this.presets = data.value;
      } else if (data.key === 'currentPresetId') {
        this.currentPresetId = data.value;
      }
    });
    
    // 다양한 설정 변경 이벤트 구독하여 현재 프리셋 상태 업데이트
    const settingsToWatch = [
      'cardSetType', 'cardSetSource', 'layoutType', 'sortType', 
      'sortDirection', 'cardWidth', 'cardHeight', 'fixedHeight'
    ];
    
    this.eventBus.subscribe('settings:changed', (data: any) => {
      if (settingsToWatch.includes(data.key) && this.currentPresetId) {
        // 현재 설정이 활성 프리셋과 일치하는지 확인
        if (!this.isCurrentSettingsMatchPreset(this.currentPresetId)) {
          // 일치하지 않으면 현재 프리셋 ID 초기화
          this.currentPresetId = null;
          this.settingsService.updateSetting('currentPresetId', null);
        }
      }
    });
  }
  
  getAllPresets(): IPreset[] {
    return [...this.presets];
  }
  
  getPreset(presetId: string): IPreset | undefined {
    return this.presets.find(preset => preset.id === presetId);
  }
  
  async createPresetFromCurrentSettings(name: string, description?: string): Promise<IPreset> {
    // 현재 설정으로 새 프리셋 생성
    const newPreset: IPreset = {
      id: `preset_${Date.now()}`,
      name,
      description,
      cardSetType: this.cardSetService.getCardSetType(),
      cardSetSource: this.cardSetService.getCardSetSource(),
      layoutType: this.layoutService.getLayoutType(),
      sortType: this.sortingService.getCurrentSort().type,
      sortDirection: this.sortingService.getCurrentSort().direction,
      cardWidth: this.layoutService.getCardWidth(),
      cardHeight: this.layoutService.getCardHeight(),
      fixedHeight: this.layoutService.isFixedHeight(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // 프리셋 목록에 추가
    this.presets.push(newPreset);
    
    // 설정 저장
    await this.settingsService.updateSetting('presets', this.presets);
    
    // 프리셋 생성 이벤트 발생
    this.eventBus.publish('preset:created', { preset: newPreset });
    
    return newPreset;
  }
  
  async updatePreset(presetId: string, updates: Partial<IPreset>): Promise<IPreset | undefined> {
    const presetIndex = this.presets.findIndex(preset => preset.id === presetId);
    if (presetIndex === -1) return undefined;
    
    // 프리셋 업데이트
    const updatedPreset = {
      ...this.presets[presetIndex],
      ...updates,
      updatedAt: Date.now()
    };
    
    this.presets[presetIndex] = updatedPreset;
    
    // 설정 저장
    await this.settingsService.updateSetting('presets', this.presets);
    
    // 프리셋 업데이트 이벤트 발생
    this.eventBus.publish('preset:updated', { preset: updatedPreset });
    
    return updatedPreset;
  }
  
  async deletePreset(presetId: string): Promise<boolean> {
    const presetIndex = this.presets.findIndex(preset => preset.id === presetId);
    if (presetIndex === -1) return false;
    
    // 프리셋 삭제
    const deletedPreset = this.presets[presetIndex];
    this.presets.splice(presetIndex, 1);
    
    // 현재 프리셋이 삭제된 경우 현재 프리셋 ID 초기화
    if (this.currentPresetId === presetId) {
      this.currentPresetId = null;
      await this.settingsService.updateSetting('currentPresetId', null);
    }
    
    // 설정 저장
    await this.settingsService.updateSetting('presets', this.presets);
    
    // 프리셋 삭제 이벤트 발생
    this.eventBus.publish('preset:deleted', { presetId, preset: deletedPreset });
    
    return true;
  }
  
  async applyPreset(presetId: string): Promise<boolean> {
    const preset = this.getPreset(presetId);
    if (!preset) return false;
    
    // 카드셋 설정 적용
    await this.cardSetService.changeCardSetSource(preset.cardSetType, preset.cardSetSource);
    
    // 레이아웃 설정 적용
    await this.layoutService.changeLayout(preset.layoutType);
    await this.layoutService.setCardWidth(preset.cardWidth);
    await this.layoutService.setCardHeight(preset.cardHeight);
    await this.layoutService.setFixedHeight(preset.fixedHeight);
    
    // 정렬 설정 적용
    await this.sortingService.changeSort(preset.sortType, preset.sortDirection);
    
    // 현재 프리셋 ID 설정
    this.currentPresetId = presetId;
    await this.settingsService.updateSetting('currentPresetId', presetId);
    
    // 프리셋 적용 이벤트 발생
    this.eventBus.publish('preset:applied', { presetId, preset });
    
    return true;
  }
  
  isCurrentSettingsMatchPreset(presetId: string): boolean {
    const preset = this.getPreset(presetId);
    if (!preset) return false;
    
    // 현재 설정과 프리셋 비교
    const currentSettings = {
      cardSetType: this.cardSetService.getCardSetType(),
      cardSetSource: this.cardSetService.getCardSetSource(),
      layoutType: this.layoutService.getLayoutType(),
      sortType: this.sortingService.getCurrentSort().type,
      sortDirection: this.sortingService.getCurrentSort().direction,
      cardWidth: this.layoutService.getCardWidth(),
      cardHeight: this.layoutService.getCardHeight(),
      fixedHeight: this.layoutService.isFixedHeight()
    };
    
    return (
      currentSettings.cardSetType === preset.cardSetType &&
      currentSettings.cardSetSource === preset.cardSetSource &&
      currentSettings.layoutType === preset.layoutType &&
      currentSettings.sortType === preset.sortType &&
      currentSettings.sortDirection === preset.sortDirection &&
      currentSettings.cardWidth === preset.cardWidth &&
      currentSettings.cardHeight === preset.cardHeight &&
      currentSettings.fixedHeight === preset.fixedHeight
    );
  }
  
  getCurrentPresetId(): string | null {
    return this.currentPresetId;
  }
} 