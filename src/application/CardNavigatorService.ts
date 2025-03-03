import { App } from 'obsidian';
import { ICard } from '../domain/card/Card';
import { ICardRepository } from '../domain/card/CardRepository';
import { ModeType } from '../domain/mode/Mode';
import { LayoutType } from '../domain/layout/Layout';
import { IPreset } from '../domain/preset/Preset';

import { IModeService, ModeService } from './ModeService';
import { ICardService, CardService } from './CardService';
import { IFilterService, FilterService } from './FilterService';
import { ISortService, SortService } from './SortService';
import { ISearchService, SearchService } from './SearchService';
import { ILayoutService, LayoutService } from './LayoutService';
import { IPresetService, PresetService } from './PresetService';

/**
 * 카드 네비게이터 서비스 인터페이스
 * 카드 네비게이터의 핵심 기능을 제공하는 인터페이스입니다.
 */
export interface ICardNavigatorService {
  /**
   * 초기화
   */
  initialize(): Promise<void>;
  
  /**
   * 카드 목록 가져오기
   * 현재 모드, 필터, 정렬, 검색 설정에 따라 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  getCards(): Promise<ICard[]>;
  
  /**
   * 모드 변경
   * @param type 변경할 모드 타입
   */
  changeMode(type: ModeType): Promise<void>;
  
  /**
   * 카드 세트 선택
   * @param cardSet 선택할 카드 세트
   */
  selectCardSet(cardSet: string): Promise<void>;
  
  /**
   * 레이아웃 변경
   * @param type 변경할 레이아웃 타입
   */
  changeLayout(type: LayoutType): void;
  
  /**
   * 프리셋 적용
   * @param presetId 적용할 프리셋 ID
   */
  applyPreset(presetId: string): Promise<boolean>;
  
  /**
   * 현재 설정을 프리셋으로 저장
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   * @returns 저장된 프리셋
   */
  saveAsPreset(name: string, description?: string): IPreset;
  
  /**
   * 검색 수행
   * @param query 검색어
   */
  search(query: string): Promise<void>;
  
  /**
   * 설정 가져오기
   * @returns 현재 설정
   */
  getSettings(): Promise<{
    cardWidth: number;
    cardHeight: number;
    priorityTags: string[];
    defaultMode: ModeType;
    defaultLayout: LayoutType;
  }>;
  
  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   */
  updateSettings(settings: Partial<{
    cardWidth: number;
    cardHeight: number;
    priorityTags: string[];
    defaultMode: ModeType;
    defaultLayout: LayoutType;
  }>): Promise<void>;
  
  /**
   * 모든 설정 초기화
   */
  reset(): Promise<void>;
  
  /**
   * 모드 서비스 가져오기
   * @returns 모드 서비스
   */
  getModeService(): IModeService;
  
  /**
   * 카드 서비스 가져오기
   * @returns 카드 서비스
   */
  getCardService(): ICardService;
  
  /**
   * 필터 서비스 가져오기
   * @returns 필터 서비스
   */
  getFilterService(): IFilterService;
  
  /**
   * 정렬 서비스 가져오기
   * @returns 정렬 서비스
   */
  getSortService(): ISortService;
  
  /**
   * 검색 서비스 가져오기
   * @returns 검색 서비스
   */
  getSearchService(): ISearchService;
  
  /**
   * 레이아웃 서비스 가져오기
   * @returns 레이아웃 서비스
   */
  getLayoutService(): ILayoutService;
  
  /**
   * 프리셋 서비스 가져오기
   * @returns 프리셋 서비스
   */
  getPresetService(): IPresetService;
}

/**
 * 카드 네비게이터 서비스 클래스
 * 카드 네비게이터의 핵심 기능을 제공하는 클래스입니다.
 */
export class CardNavigatorService implements ICardNavigatorService {
  private app: App;
  private modeService: IModeService;
  private cardService: ICardService;
  private filterService: IFilterService;
  private sortService: ISortService;
  private searchService: ISearchService;
  private layoutService: ILayoutService;
  private presetService: IPresetService;
  
  constructor(
    app: App,
    cardRepository: ICardRepository,
    defaultModeType: ModeType = 'folder'
  ) {
    this.app = app;
    
    // 서비스 초기화
    this.modeService = new ModeService(app, defaultModeType);
    this.cardService = new CardService(app, cardRepository);
    this.filterService = new FilterService();
    this.sortService = new SortService();
    this.searchService = new SearchService();
    this.layoutService = new LayoutService();
    this.presetService = new PresetService();
  }
  
  async initialize(): Promise<void> {
    // 카드 저장소 초기화
    await this.cardService.refreshCards();
    
    // 기본 카드 세트 선택
    const cardSets = await this.modeService.getCardSets();
    if (cardSets.length > 0) {
      this.modeService.selectCardSet(cardSets[0]);
    }
  }
  
  async getCards(): Promise<ICard[]> {
    // 현재 모드에 따라 파일 목록 가져오기
    const filePaths = await this.modeService.getFiles();
    
    // 파일 목록으로 카드 가져오기
    let cards = await this.cardService.getCardsByPaths(filePaths);
    
    // 필터 적용
    cards = this.filterService.applyFilters(cards);
    
    // 검색 적용
    cards = this.searchService.applySearch(cards);
    
    // 정렬 적용
    cards = this.sortService.applySort(cards);
    
    return cards;
  }
  
  async changeMode(type: ModeType): Promise<void> {
    // 모드 변경
    this.modeService.changeMode(type);
    
    // 카드 세트 목록 가져오기
    const cardSets = await this.modeService.getCardSets();
    
    // 첫 번째 카드 세트 선택
    if (cardSets.length > 0) {
      this.modeService.selectCardSet(cardSets[0]);
    }
  }
  
  async selectCardSet(cardSet: string): Promise<void> {
    this.modeService.selectCardSet(cardSet);
  }
  
  changeLayout(type: LayoutType): void {
    this.layoutService.changeLayoutType(type);
  }
  
  async applyPreset(presetId: string): Promise<boolean> {
    return this.presetService.applyPreset(presetId);
  }
  
  saveAsPreset(name: string, description?: string): IPreset {
    return this.presetService.saveCurrentAsPreset(name, description);
  }
  
  async search(query: string): Promise<void> {
    this.searchService.setQuery(query);
    
    // 검색 기록 저장
    if (query) {
      this.searchService.saveSearchHistory(query);
    }
  }
  
  async getSettings(): Promise<{
    cardWidth: number;
    cardHeight: number;
    priorityTags: string[];
    defaultMode: ModeType;
    defaultLayout: LayoutType;
  }> {
    // 레이아웃 서비스에서 카드 크기 정보 가져오기
    const layoutService = this.getLayoutService();
    const currentLayout = layoutService.getCurrentLayout();
    const cardWidth = currentLayout?.cardWidth || 250;
    const cardHeight = currentLayout?.cardHeight || 150;
    
    // 모드 서비스에서 현재 모드 가져오기
    const modeService = this.getModeService();
    const defaultMode = modeService.getCurrentModeType();
    
    // 레이아웃 타입 가져오기
    const defaultLayout = currentLayout?.type || 'grid';
    
    // 우선순위 태그는 설정에서 가져와야 하지만 여기서는 빈 배열 반환
    const priorityTags: string[] = [];
    
    return {
      cardWidth,
      cardHeight,
      priorityTags,
      defaultMode,
      defaultLayout
    };
  }
  
  async updateSettings(settings: Partial<{
    cardWidth: number;
    cardHeight: number;
    priorityTags: string[];
    defaultMode: ModeType;
    defaultLayout: LayoutType;
  }>): Promise<void> {
    // 레이아웃 서비스 업데이트
    const layoutService = this.getLayoutService();
    
    if (settings.cardWidth) {
      layoutService.setCardWidth(settings.cardWidth);
    }
    
    if (settings.cardHeight) {
      layoutService.setCardHeight(settings.cardHeight);
    }
    
    if (settings.defaultLayout) {
      layoutService.changeLayoutType(settings.defaultLayout);
    }
    
    // 모드 변경
    if (settings.defaultMode) {
      await this.changeMode(settings.defaultMode);
    }
    
    // 우선순위 태그 설정은 별도의 저장소에 저장해야 함
    // 여기서는 구현 생략
  }
  
  async reset(): Promise<void> {
    // 모든 설정 초기화
    this.filterService.clearFilters();
    this.sortService.clearSort();
    this.searchService.clearSearch();
    
    // 카드 저장소 초기화
    await this.cardService.refreshCards();
  }
  
  /**
   * 모드 서비스 가져오기
   * @returns 모드 서비스
   */
  getModeService(): IModeService {
    return this.modeService;
  }
  
  /**
   * 카드 서비스 가져오기
   * @returns 카드 서비스
   */
  getCardService(): ICardService {
    return this.cardService;
  }
  
  /**
   * 필터 서비스 가져오기
   * @returns 필터 서비스
   */
  getFilterService(): IFilterService {
    return this.filterService;
  }
  
  /**
   * 정렬 서비스 가져오기
   * @returns 정렬 서비스
   */
  getSortService(): ISortService {
    return this.sortService;
  }
  
  /**
   * 검색 서비스 가져오기
   * @returns 검색 서비스
   */
  getSearchService(): ISearchService {
    return this.searchService;
  }
  
  /**
   * 레이아웃 서비스 가져오기
   * @returns 레이아웃 서비스
   */
  getLayoutService(): ILayoutService {
    return this.layoutService;
  }
  
  /**
   * 프리셋 서비스 가져오기
   * @returns 프리셋 서비스
   */
  getPresetService(): IPresetService {
    return this.presetService;
  }
} 