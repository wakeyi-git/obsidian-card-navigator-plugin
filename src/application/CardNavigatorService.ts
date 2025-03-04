import { App } from 'obsidian';
import { ICard } from '../domain/card/Card';
import { ICardRepository } from '../domain/card/CardRepository';
import { ModeType } from '../domain/mode/Mode';
import { LayoutType } from '../domain/layout/Layout';
import { IPreset } from '../domain/preset/Preset';

import { IModeService, ModeService } from './ModeService';
import { ICardService, CardService } from './CardService';
import { ISortService, SortService } from './SortService';
import { ISearchService, SearchService } from './SearchService';
import { ILayoutService, LayoutService } from './LayoutService';
import { IPresetService, PresetService } from './PresetService';
import { Card } from '../domain/card/Card';

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
  getCards(): Promise<Card[]>;
  
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
    priorityFolders: string[];
    defaultMode: ModeType;
    defaultLayout: LayoutType;
    includeSubfolders: boolean;
    defaultCardSet: string;
    isCardSetFixed: boolean;
  }>;
  
  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   */
  updateSettings(settings: Partial<{
    cardWidth: number;
    cardHeight: number;
    priorityTags: string[];
    priorityFolders: string[];
    defaultMode: ModeType;
    defaultLayout: LayoutType;
    includeSubfolders: boolean;
    defaultCardSet: string;
    isCardSetFixed: boolean;
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
   * 검색 서비스 가져오기
   * @returns 검색 서비스
   */
  getSearchService(): ISearchService;
  
  /**
   * 정렬 서비스 가져오기
   * @returns 정렬 서비스
   */
  getSortService(): ISortService;
  
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
  
  /**
   * 카드 저장소 새로고침
   * 카드 목록을 다시 로드합니다.
   */
  refreshCards(): Promise<void>;
}

/**
 * 카드 네비게이터 서비스 클래스
 * 카드 네비게이터의 핵심 기능을 제공하는 클래스입니다.
 */
export class CardNavigatorService implements ICardNavigatorService {
  private app: App;
  private modeService: IModeService;
  private cardService: ICardService;
  private sortService: ISortService;
  private searchService: ISearchService;
  private layoutService: ILayoutService;
  private presetService: IPresetService;
  private cardRepository: ICardRepository;
  
  // 성능 모니터링을 위한 카운터 추가
  private refreshCount: number = 0;
  private cardLoadCount: number = 0;
  private renderCount: number = 0;
  
  constructor(
    app: App,
    cardRepository: ICardRepository,
    defaultModeType: ModeType = 'folder'
  ) {
    this.app = app;
    this.cardRepository = cardRepository;
    
    // 서비스 초기화
    this.modeService = new ModeService(app, defaultModeType);
    this.cardService = new CardService(app, cardRepository);
    this.sortService = new SortService();
    this.presetService = new PresetService();
    this.searchService = new SearchService(this.presetService, this.cardService, this.modeService);
    this.layoutService = new LayoutService();
  }
  
  /**
   * 서비스 초기화
   */
  async initialize(): Promise<void> {
    // 설정 로드
    const settings = (this.app as any).plugins.plugins['obsidian-card-navigator-plugin']?.settings;
    
    // 모드 서비스 초기화
    this.modeService = new ModeService(this.app, settings?.defaultMode || 'folder');
    
    // 하위 폴더 포함 여부 설정
    if (settings?.includeSubfolders !== undefined) {
      this.modeService.setIncludeSubfolders(settings.includeSubfolders);
    }
    
    // 기본 카드 세트 설정
    if (settings?.defaultCardSet) {
      this.modeService.selectCardSet(settings.defaultCardSet, settings?.isCardSetFixed || false);
    }
    
    // 카드 서비스 초기화
    this.cardService = new CardService(this.app, this.cardRepository);
    
    // 정렬 서비스 초기화
    this.sortService = new SortService();
    
    // 레이아웃 서비스 초기화
    this.layoutService = new LayoutService(settings?.defaultLayout || 'grid');
    
    // 프리셋 서비스 초기화
    this.presetService = new PresetService();
    
    // 검색 서비스 초기화
    this.searchService = new SearchService(this.presetService, this.cardService, this.modeService);
    
    // 모드 서비스 초기화
    await this.modeService.initialize();
  }
  
  async getCards(): Promise<Card[]> {
    const timerLabel = `[성능] getCards 실행 시간-${Date.now()}`;
    console.time(timerLabel);
    this.cardLoadCount++;
    console.log(`[성능] 카드 로드 횟수: ${this.cardLoadCount}`);
    
    try {
      // 모든 카드 가져오기
      const allCards = await this.cardService.getAllCards();
      console.log(`[CardNavigatorService] 전체 카드 수: ${allCards.length}`);
      
      // 모드 적용 (폴더 또는 태그 필터링)
      const currentCardSet = this.modeService.getCurrentCardSet();
      const currentMode = this.modeService.getCurrentModeType();
      console.log(`[CardNavigatorService] 현재 모드: ${currentMode}, 현재 카드 세트: ${currentCardSet}`);
      
      const modeFilteredCards = await this.modeService.applyMode(allCards);
      console.log(`[CardNavigatorService] 모드 필터링 후 카드 수: ${modeFilteredCards.length}`);
      
      // 검색 적용
      const searchFilteredCards = await this.searchService.applySearch(modeFilteredCards);
      console.log(`[CardNavigatorService] 검색 필터링 후 카드 수: ${searchFilteredCards.length}`);
      
      // 정렬 적용
      const sortedCards = this.sortService.applySort(searchFilteredCards);
      console.log(`[CardNavigatorService] 정렬 후 최종 카드 수: ${sortedCards.length}`);
      
      this.renderCount++;
      console.log(`[성능] 렌더링 횟수: ${this.renderCount}`);
      console.timeEnd(timerLabel);
      
      return sortedCards as Card[];
    } catch (error) {
      console.error('[성능] getCards 오류:', error);
      console.timeEnd(timerLabel);
      return [];
    }
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
    console.log(`[CardNavigatorService] 카드 세트 선택: ${cardSet}`);
    console.log(`[CardNavigatorService] 현재 모드: ${this.modeService.getCurrentModeType()}`);
    
    this.modeService.selectCardSet(cardSet);
    console.log(`[CardNavigatorService] 모드 서비스에 카드 세트 설정 완료`);
    
    // 카드 세트 변경 후 카드 저장소 새로고침
    await this.cardService.refreshCards();
    console.log(`[CardNavigatorService] 카드 저장소 새로고침 완료`);
    
    // 현재 선택된 카드 세트 확인
    const currentCardSet = this.modeService.getCurrentCardSet();
    console.log(`[CardNavigatorService] 현재 선택된 카드 세트: ${currentCardSet}`);
  }
  
  /**
   * 카드 저장소 새로고침
   * 카드 목록을 다시 로드합니다.
   */
  async refreshCards(): Promise<void> {
    const timerLabel = `[성능] refreshCards 실행 시간-${Date.now()}`;
    console.time(timerLabel);
    this.refreshCount++;
    console.log(`[성능] 리프레시 횟수: ${this.refreshCount}`);
    
    try {
      await this.cardRepository.refresh();
      console.log('[성능] 카드 저장소 리프레시 완료');
      console.timeEnd(timerLabel);
    } catch (error) {
      console.error('[성능] refreshCards 오류:', error);
      console.timeEnd(timerLabel);
    }
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
    priorityFolders: string[];
    defaultMode: ModeType;
    defaultLayout: LayoutType;
    includeSubfolders: boolean;
    defaultCardSet: string;
    isCardSetFixed: boolean;
  }> {
    // 플러그인 인스턴스에서 설정 가져오기
    const plugin = (this.app as any).plugins.plugins['obsidian-card-navigator-plugin'];
    if (plugin && plugin.settings) {
      return {
        cardWidth: plugin.settings.cardWidth,
        cardHeight: plugin.settings.cardHeight,
        priorityTags: plugin.settings.priorityTags || [],
        priorityFolders: plugin.settings.priorityFolders || [],
        defaultMode: plugin.settings.defaultMode,
        defaultLayout: plugin.settings.defaultLayout,
        includeSubfolders: plugin.settings.includeSubfolders,
        defaultCardSet: plugin.settings.defaultCardSet || '/',
        isCardSetFixed: plugin.settings.isCardSetFixed
      };
    }
    
    // 플러그인 인스턴스를 찾을 수 없는 경우 현재 서비스 상태에서 설정 구성
    console.warn('플러그인 인스턴스를 찾을 수 없어 현재 서비스 상태에서 설정을 구성합니다.');
    
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
    
    // 우선순위 폴더도 설정에서 가져와야 하지만 여기서는 빈 배열 반환
    const priorityFolders: string[] = [];
    
    // 하위 폴더 포함 여부
    const includeSubfolders = modeService.getIncludeSubfolders();
    
    // 현재 카드 세트
    const defaultCardSet = modeService.getCurrentCardSet() || '/';
    
    // 카드 세트 고정 여부
    const isCardSetFixed = modeService.isCardSetFixed();
    
    return {
      cardWidth,
      cardHeight,
      priorityTags,
      priorityFolders,
      defaultMode,
      defaultLayout,
      includeSubfolders,
      defaultCardSet,
      isCardSetFixed
    };
  }
  
  async updateSettings(settings: Partial<{
    cardWidth: number;
    cardHeight: number;
    priorityTags: string[];
    priorityFolders: string[];
    defaultMode: ModeType;
    defaultLayout: LayoutType;
    includeSubfolders: boolean;
    defaultCardSet: string;
    isCardSetFixed: boolean;
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
    
    // 하위 폴더 포함 여부 설정
    if (settings.includeSubfolders !== undefined) {
      this.modeService.setIncludeSubfolders(settings.includeSubfolders);
    }
    
    // 기본 카드 세트 설정
    if (settings.defaultCardSet) {
      this.modeService.selectCardSet(settings.defaultCardSet, settings.isCardSetFixed);
    } else if (settings.isCardSetFixed !== undefined) {
      // 카드 세트는 변경하지 않고 고정 상태만 변경
      const currentCardSet = this.modeService.getCurrentCardSet();
      if (currentCardSet) {
        this.modeService.selectCardSet(currentCardSet, settings.isCardSetFixed);
      }
    }
    
    // 플러그인 설정 객체 업데이트
    const plugin = (this.app as any).plugins.plugins['obsidian-card-navigator-plugin'];
    if (plugin) {
      // 설정 객체 업데이트
      if (settings.cardWidth !== undefined) {
        plugin.settings.cardWidth = settings.cardWidth;
      }
      
      if (settings.cardHeight !== undefined) {
        plugin.settings.cardHeight = settings.cardHeight;
      }
      
      if (settings.priorityTags !== undefined) {
        plugin.settings.priorityTags = settings.priorityTags;
      }
      
      if (settings.priorityFolders !== undefined) {
        plugin.settings.priorityFolders = settings.priorityFolders;
      }
      
      if (settings.defaultMode !== undefined) {
        plugin.settings.defaultMode = settings.defaultMode;
      }
      
      if (settings.defaultLayout !== undefined) {
        plugin.settings.defaultLayout = settings.defaultLayout;
      }
      
      if (settings.includeSubfolders !== undefined) {
        plugin.settings.includeSubfolders = settings.includeSubfolders;
      }
      
      if (settings.defaultCardSet !== undefined) {
        plugin.settings.defaultCardSet = settings.defaultCardSet;
      }
      
      if (settings.isCardSetFixed !== undefined) {
        plugin.settings.isCardSetFixed = settings.isCardSetFixed;
      }
      
      // 설정 저장
      await plugin.saveSettings();
    } else {
      console.error('플러그인 인스턴스를 찾을 수 없습니다.');
    }
  }
  
  async reset(): Promise<void> {
    // 모든 설정 초기화
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
   * 검색 서비스 가져오기
   * @returns 검색 서비스
   */
  getSearchService(): ISearchService {
    return this.searchService;
  }
  
  /**
   * 정렬 서비스 가져오기
   * @returns 정렬 서비스
   */
  getSortService(): ISortService {
    return this.sortService;
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