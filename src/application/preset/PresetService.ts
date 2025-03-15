import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { ICardSetService } from '../cardset/CardSetService';
import { ILayoutService } from '../layout/LayoutService';
import { SortingService } from '../sorting/SortingService';
import { ISearchService } from '../search/SearchService';
import { CardSetSourceType } from '../../domain/cardset/CardSet';
import { LayoutType } from '../../domain/layout/Layout';
import { SortDirection } from '../../domain/sorting/SortingInterfaces';
import { TFile } from 'obsidian';
import { ICard } from '../../domain/card/Card';
import { ICardSet, ICardSetSource } from '../../domain/cardset/CardSet';
import { ISortingService, SortType } from '../sorting/SortingService';

// 프리셋 관련 이벤트 타입 상수
const PRESET_UPDATED = 'preset:updated';
const PRESET_DELETED = 'preset:deleted';

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
  private sortingService: SortingService;
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
    sortingService: SortingService,
    searchService: ISearchService,
    eventBus: DomainEventBus
  ) {
    this.settingsService = settingsService;
    this.cardSetService = cardSetService;
    this.layoutService = layoutService;
    this.sortingService = sortingService;
    this.searchService = searchService;
    this.eventBus = eventBus;
    
    // 저장된 프리셋 로드
    const settings = this.settingsService.getSettings();
    this.presets = settings.presets || [];
    this.currentPresetId = settings.currentPresetId || null;
    
    // 설정 변경 이벤트 구독
    this.eventBus.on(EventType.SETTINGS_CHANGED, (data: any) => {
      if (data.changedKeys.includes('presets')) {
        this.presets = data.settings.presets || [];
      }
      
      if (data.changedKeys.includes('currentPresetId')) {
        this.currentPresetId = data.settings.currentPresetId;
      }
    });
    
    // 카드셋 변경 이벤트 구독
    this.eventBus.on(EventType.CARD_SET_CHANGED, (data: any) => {
      // 현재 프리셋이 있는 경우 일치 여부 확인
      if (this.currentPresetId) {
        const isMatch = this.isCurrentSettingsMatchPreset(this.currentPresetId);
        if (!isMatch) {
          // 설정이 변경되었으므로 현재 프리셋 해제
          this.settingsService.updateSettings({
            currentPresetId: null
          });
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
    // 현재 설정 가져오기
    const settings = this.settingsService.getSettings();
    
    // 현재 카드셋 타입 및 소스 가져오기
    const cardSetType = settings.defaultCardSetSource || 'folder';
    const cardSetSource = cardSetType === 'folder' ? 
      settings.defaultFolderCardSet || '' : 
      settings.defaultTagCardSet || '';
    
    // 현재 레이아웃 타입 가져오기
    const layoutType = settings.defaultLayout || 'grid';
    
    // 현재 정렬 설정 가져오기
    const sortType = settings.defaultSortType || 'filename';
    const sortDirection = settings.defaultSortDirection || 'asc';
    
    // 현재 카드 크기 설정 가져오기
    const cardWidth = settings.cardWidth || 200;
    const cardHeight = settings.cardHeight || 150;
    const fixedHeight = settings.fixedCardHeight || true;
    
    // 프리셋 생성
    const preset: IPreset = {
      id: Date.now().toString(),
      name,
      description,
      cardSetType,
      cardSetSource,
      layoutType,
      sortType,
      sortDirection,
      cardWidth,
      cardHeight,
      fixedHeight,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // 프리셋 저장
    this.presets.push(preset);
    await this.savePresets();
    
    return preset;
  }
  
  /**
   * 프리셋 저장
   */
  private async savePresets(): Promise<void> {
    await this.settingsService.updateSettings({
      presets: this.presets
    });
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
    
    // 프리셋 저장
    await this.settingsService.updateSettings({
      presets: this.presets
    });
    
    // 이벤트 발생
    this.eventBus.emit(PRESET_UPDATED, { preset: updatedPreset });
    
    return updatedPreset;
  }
  
  async deletePreset(presetId: string): Promise<boolean> {
    const presetIndex = this.presets.findIndex(preset => preset.id === presetId);
    if (presetIndex === -1) return false;
    
    // 프리셋 삭제
    const deletedPreset = this.presets[presetIndex];
    this.presets.splice(presetIndex, 1);
    
    // 현재 프리셋인 경우 해제
    if (this.currentPresetId === presetId) {
      await this.settingsService.updateSettings({
        currentPresetId: null
      });
    }
    
    // 프리셋 저장
    await this.settingsService.updateSettings({
      presets: this.presets
    });
    
    // 이벤트 발생
    this.eventBus.emit(PRESET_DELETED, { presetId, preset: deletedPreset });
    
    return true;
  }
  
  async applyPreset(presetId: string): Promise<boolean> {
    const preset = this.getPreset(presetId);
    if (!preset) {
      return false;
    }
    
    try {
      // 카드셋 타입 및 소스 설정
      await this.cardSetService.changeSource(preset.cardSetType as CardSetSourceType);
      await this.cardSetService.selectCardSet(preset.cardSetSource, true);
      
      // 레이아웃 설정
      await this.layoutService.changeLayout(preset.layoutType as LayoutType);
      
      // 정렬 설정
      await this.sortingService.changeSort(
        preset.sortType as SortType,
        preset.sortDirection as SortDirection
      );
      
      // 현재 프리셋 ID 설정
      this.currentPresetId = presetId;
      
      return true;
    } catch (error) {
      console.error('프리셋 적용 중 오류 발생:', error);
      return false;
    }
  }
  
  isCurrentSettingsMatchPreset(presetId: string): boolean {
    const preset = this.getPreset(presetId);
    if (!preset) {
      return false;
    }
    
    const settings = this.settingsService.getSettings();
    
    // 현재 카드셋 타입 및 소스 가져오기
    const cardSetType = settings.defaultCardSetSource || 'folder';
    const cardSetSource = cardSetType === 'folder' ? 
      settings.defaultFolderCardSet || '' : 
      settings.defaultTagCardSet || '';
    
    // 현재 레이아웃 타입 가져오기
    const layoutType = settings.defaultLayout || 'grid';
    
    // 현재 정렬 설정 가져오기
    const sortType = settings.defaultSortType || 'filename';
    const sortDirection = settings.defaultSortDirection || 'asc';
    
    // 현재 카드 크기 설정 가져오기
    const cardWidth = settings.cardWidth || 200;
    const cardHeight = settings.cardHeight || 150;
    const fixedHeight = settings.fixedCardHeight || true;
    
    // 설정 비교
    return (
      preset.cardSetType === cardSetType &&
      preset.cardSetSource === cardSetSource &&
      preset.layoutType === layoutType &&
      preset.sortType === sortType &&
      preset.sortDirection === sortDirection &&
      preset.cardWidth === cardWidth &&
      preset.cardHeight === cardHeight &&
      preset.fixedHeight === fixedHeight
    );
  }
  
  getCurrentPresetId(): string | null {
    return this.currentPresetId;
  }
} 