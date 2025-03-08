import { App } from 'obsidian';
import { ICard } from '../domain/card/Card';
import { ICardRepository } from '../domain/card/CardRepository';
import { ModeType } from '../domain/mode/Mode';
import { LayoutType } from '../domain/layout/Layout';
import { IPreset } from '../domain/preset/Preset';
import { SearchType } from '../domain/mode/SearchMode';

import { IModeService, ModeService } from './ModeService';
import { ICardService, CardService } from './CardService';
import { ISortService, SortService } from './SortService';
import { ISearchService, SearchService } from './SearchService';
import { ILayoutService, LayoutService } from './LayoutService';
import { IPresetService, PresetService } from './PresetService';
import { Card } from '../domain/card/Card';
import { IFilterService, FilterService } from './FilterService';
import { TimerUtil } from '../infrastructure/TimerUtil';

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
    priorityFolders: string[];
    defaultMode: ModeType;
    defaultLayout: LayoutType;
    includeSubfolders: boolean;
    defaultCardSet: string;
    isCardSetFixed: boolean;
    defaultSearchScope?: 'all' | 'current';
    tagCaseSensitive?: boolean;
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
    defaultSearchScope?: 'all' | 'current';
    tagCaseSensitive?: boolean;
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
  
  /**
   * 검색 타입 변경
   * @param searchType 검색 타입
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  changeSearchType(searchType: SearchType, frontmatterKey?: string): Promise<void>;
  
  /**
   * 대소문자 구분 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): Promise<void>;
  
  /**
   * 필터 서비스 가져오기
   * @returns 필터 서비스
   */
  getFilterService(): IFilterService;
  
  /**
   * Obsidian App 객체 가져오기
   * @returns Obsidian App 객체
   */
  getApp(): App;
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
  private filterService: IFilterService;
  private cardRepository: ICardRepository;
  
  // 성능 모니터링을 위한 카운터 추가
  private refreshCount = 0;
  private cardLoadCount = 0;
  private renderCount = 0;
  
  // 카드 가져오기 관련 변수
  private _lastGetCardsCall: number | null = null;
  private _lastCards: ICard[] | null = null;
  
  // 카드 저장소 새로고침 관련 변수
  private _lastRefreshCall: number | null = null;
  
  constructor(
    app: App,
    cardRepository: ICardRepository,
    defaultModeType: ModeType = 'folder'
  ) {
    this.app = app;
    this.cardRepository = cardRepository;
    
    // 서비스 초기화
    this.cardService = new CardService(app, cardRepository);
    this.modeService = new ModeService(app, this.cardService, defaultModeType);
    this.sortService = new SortService();
    this.layoutService = new LayoutService();
    this.presetService = new PresetService();
    this.searchService = new SearchService(this.presetService, this.cardService, this.modeService, this);
    this.filterService = new FilterService();
  }
  
  /**
   * 서비스 초기화
   */
  async initialize(): Promise<void> {
    console.log(`[CardNavigatorService] 초기화 시작`);
    
    // 초기화 플래그 설정 - 이미 초기화 중인지 확인
    if ((this as any)._initializing) {
      console.log(`[CardNavigatorService] 이미 초기화 중입니다. 중복 초기화 방지`);
      return;
    }
    
    (this as any)._initializing = true;
    
    try {
      // 설정 로드
      const settings = (this.app as any).plugins.plugins['obsidian-card-navigator-plugin']?.settings;
      
      // 카드 서비스 초기화
      this.cardService = new CardService(this.app, this.cardRepository);
      
      // 모드 서비스 초기화 - cardService를 전달
      this.modeService = new ModeService(this.app, this.cardService, settings?.defaultMode || 'folder');
      
      // 하위 폴더 포함 여부 설정
      if (settings?.includeSubfolders !== undefined) {
        this.modeService.setIncludeSubfolders(settings.includeSubfolders);
      }
      
      // 태그 대소문자 구분 여부 설정
      if (settings?.tagCaseSensitive !== undefined) {
        this.modeService.setTagCaseSensitive(settings.tagCaseSensitive);
      }
      
      // 기본 카드 세트 설정
      if (settings?.defaultCardSet) {
        this.modeService.selectCardSet(settings.defaultCardSet, settings?.isCardSetFixed || false);
      }
      
      // 정렬 서비스 초기화
      this.sortService = new SortService();
      
      // 레이아웃 서비스 초기화
      this.layoutService = new LayoutService(settings?.defaultLayout || 'grid');
      
      // 프리셋 서비스 초기화
      this.presetService = new PresetService();
      
      // 검색 서비스 초기화
      this.searchService = new SearchService(this.presetService, this.cardService, this.modeService, this);
      
      // 필터 서비스 초기화
      this.filterService = new FilterService();
      
      console.log(`[CardNavigatorService] 서비스 초기화 완료`);
    } catch (error) {
      console.error(`[CardNavigatorService] 초기화 중 오류 발생:`, error);
    } finally {
      (this as any)._initializing = false;
    }
  }
  
  /**
   * 현재 상태에 맞는 카드 가져오기
   * @returns 카드 목록
   */
  async getCards(): Promise<ICard[]> {
    console.log(`[CardNavigatorService] getCards 호출됨`);
    
    // 마지막 호출 시간 기록 (중복 호출 방지)
    const now = Date.now();
    if (this._lastGetCardsCall && now - this._lastGetCardsCall < 100) {
      console.log(`[CardNavigatorService] getCards 호출 간격이 너무 짧습니다. 이전 결과 재사용`);
      return this._lastCards || [];
    }
    this._lastGetCardsCall = now;
    
    try {
      // 모드 서비스에서 카드 가져오기
      const cards = await this.modeService.getCards();
      console.log(`[CardNavigatorService] 모드 서비스에서 가져온 카드 수: ${cards.length}`);
      
      // 검색 적용
      const searchedCards = await this.searchService.applySearch(cards);
      console.log(`[CardNavigatorService] 검색 적용 후 카드 수: ${searchedCards.length}`);
      
      // 정렬 적용
      const sortedCards = this.sortService.applySort(searchedCards);
      console.log(`[CardNavigatorService] 정렬 적용 후 카드 수: ${sortedCards.length}`);
      
      // 필터 적용
      const filteredCards = this.filterService.applyFilters(sortedCards);
      console.log(`[CardNavigatorService] 필터 적용 후 카드 수: ${filteredCards.length}`);
      
      // 성능 모니터링 카운터 증가
      this.renderCount++;
      console.log(`[성능] 카드 렌더링 횟수: ${this.renderCount}`);
      
      // 결과 캐싱
      this._lastCards = filteredCards;
      
      return filteredCards;
    } catch (error) {
      console.error(`[CardNavigatorService] 카드 가져오기 오류:`, error);
      return this._lastCards || [];
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
    const timerId = TimerUtil.startTimer('[성능] refreshCards');
    this.refreshCount++;
    
    console.log(`[성능] 리프레시 횟수: ${this.refreshCount}`);
    
    try {
      await this.cardService.refreshCards();
      console.log('[성능] 카드 저장소 리프레시 완료');
      TimerUtil.endTimer(timerId);
    } catch (error) {
      console.error('[성능] refreshCards 오류:', error);
      TimerUtil.endTimer(timerId);
      throw error;
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
    console.log(`[CardNavigatorService] 검색 실행: ${query}`);
    
    try {
      // 검색 모드로 변경
      await this.modeService.changeMode('search');
      
      // 검색 모드 설정
      (this.modeService as any).configureSearchMode(query, 'content', false);
      
      // 카드 저장소 새로고침
      await this.cardService.refreshCards();
      
      console.log(`[CardNavigatorService] 검색 완료`);
    } catch (error) {
      console.error(`[CardNavigatorService] 검색 오류:`, error);
      throw error;
    }
  }
  
  /**
   * 검색 타입 변경
   * @param searchType 검색 타입
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  async changeSearchType(searchType: SearchType, frontmatterKey?: string): Promise<void> {
    console.log(`[CardNavigatorService] 검색 타입 변경: ${searchType}, 프론트매터 키: ${frontmatterKey || 'none'}`);
    
    try {
      // 현재 모드가 검색 모드인지 확인
      if (this.modeService.getCurrentModeType() !== 'search') {
        this.modeService.changeMode('search');
      }
      
      // 현재 검색 쿼리 가져오기
      const currentMode = this.modeService.getCurrentMode() as any;
      const query = currentMode.query || '';
      const caseSensitive = currentMode.caseSensitive || false;
      
      // 검색 모드 설정
      (this.modeService as any).configureSearchMode(query, searchType, caseSensitive, frontmatterKey);
      
      // 카드 저장소 새로고침
      await this.cardService.refreshCards();
      
      console.log(`[CardNavigatorService] 검색 타입 변경 완료`);
    } catch (error) {
      console.error(`[CardNavigatorService] 검색 타입 변경 오류:`, error);
      throw error;
    }
  }
  
  /**
   * 대소문자 구분 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  async setCaseSensitive(caseSensitive: boolean): Promise<void> {
    console.log(`[CardNavigatorService] 대소문자 구분 설정: ${caseSensitive}`);
    
    try {
      // 현재 모드가 검색 모드인지 확인
      if (this.modeService.getCurrentModeType() !== 'search') {
        this.modeService.changeMode('search');
      }
      
      // 현재 검색 쿼리 가져오기
      const currentMode = this.modeService.getCurrentMode() as any;
      const query = currentMode.query || '';
      const searchType = currentMode.searchType || 'content';
      const frontmatterKey = currentMode.frontmatterKey;
      
      // 검색 모드 설정
      (this.modeService as any).configureSearchMode(query, searchType, caseSensitive, frontmatterKey);
      
      // 카드 저장소 새로고침
      await this.cardService.refreshCards();
      
      console.log(`[CardNavigatorService] 대소문자 구분 설정 완료`);
    } catch (error) {
      console.error(`[CardNavigatorService] 대소문자 구분 설정 오류:`, error);
      throw error;
    }
  }
  
  /**
   * 설정 가져오기
   * @returns 현재 설정
   */
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
    defaultSearchScope?: 'all' | 'current';
    tagCaseSensitive?: boolean;
  }> {
    // 플러그인 인스턴스에서 설정 가져오기
    try {
      const plugin = (this.app as any).plugins.plugins['card-navigator'];
      
      if (plugin) {
        return {
          cardWidth: plugin.settings.cardWidth,
          cardHeight: plugin.settings.cardHeight,
          priorityTags: plugin.settings.priorityTags || [],
          priorityFolders: plugin.settings.priorityFolders || [],
          defaultMode: plugin.settings.defaultMode || 'folder',
          defaultLayout: plugin.settings.defaultLayout || 'grid',
          includeSubfolders: plugin.settings.includeSubfolders,
          defaultCardSet: plugin.settings.defaultCardSet || '/',
          isCardSetFixed: plugin.settings.isCardSetFixed,
          defaultSearchScope: plugin.settings.defaultSearchScope,
          tagCaseSensitive: plugin.settings.tagCaseSensitive
        };
      } else {
        console.warn('플러그인 인스턴스를 찾을 수 없어 현재 서비스 상태에서 설정을 구성합니다.');
      }
    } catch (error) {
      console.error('설정을 가져오는 중 오류 발생:', error);
    }
    
    // 플러그인 인스턴스를 찾지 못한 경우 기본 설정 반환
    const { cardWidth, cardHeight, priorityTags, priorityFolders, defaultMode, defaultLayout, includeSubfolders, defaultCardSet, isCardSetFixed } = this.getDefaultSettings();
    
    return {
      cardWidth,
      cardHeight,
      priorityTags,
      priorityFolders,
      defaultMode,
      defaultLayout,
      includeSubfolders,
      defaultCardSet,
      isCardSetFixed,
      defaultSearchScope: 'current',
      tagCaseSensitive: false
    };
  }
  
  /**
   * 기본 설정 가져오기
   * @returns 기본 설정
   */
  private getDefaultSettings() {
    return {
      cardWidth: 300,
      cardHeight: 200,
      priorityTags: [],
      priorityFolders: [],
      defaultMode: 'folder' as ModeType,
      defaultLayout: 'grid' as LayoutType,
      includeSubfolders: true,
      defaultCardSet: '/',
      isCardSetFixed: false
    };
  }
  
  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   */
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
    defaultSearchScope?: 'all' | 'current';
    tagCaseSensitive?: boolean;
  }>): Promise<void> {
    console.log('설정 업데이트:', settings);
    
    // 레이아웃 서비스 업데이트
    const layoutService = this.getLayoutService();
    
    // 먼저 레이아웃 타입을 설정
    if (settings.defaultLayout) {
      layoutService.changeLayoutType(settings.defaultLayout);
    }
    
    // 그 다음 레이아웃 속성 설정
    if (settings.cardWidth) {
      layoutService.setCardWidth(settings.cardWidth);
    }
    
    if (settings.cardHeight) {
      layoutService.setCardHeight(settings.cardHeight);
    }
    
    // 모드 서비스 업데이트
    const modeService = this.getModeService();
    
    // 모드 변경
    if (settings.defaultMode) {
      await this.changeMode(settings.defaultMode);
    }
    
    // 하위 폴더 포함 여부 설정
    if (settings.includeSubfolders !== undefined) {
      modeService.setIncludeSubfolders(settings.includeSubfolders);
    }
    
    // 태그 대소문자 구분 여부 설정
    if (settings.tagCaseSensitive !== undefined) {
      modeService.setTagCaseSensitive(settings.tagCaseSensitive);
    }
    
    // 카드 세트 고정 여부 설정
    if (settings.isCardSetFixed !== undefined) {
      const currentCardSet = modeService.getCurrentCardSet();
      if (currentCardSet) {
        modeService.selectCardSet(currentCardSet, settings.isCardSetFixed);
      }
    }
    
    // 기본 카드 세트 설정
    if (settings.defaultCardSet) {
      modeService.selectCardSet(settings.defaultCardSet, settings.isCardSetFixed);
    } else if (settings.isCardSetFixed !== undefined) {
      // 카드 세트는 변경하지 않고 고정 상태만 변경
      const currentCardSet = modeService.getCurrentCardSet();
      if (currentCardSet) {
        modeService.selectCardSet(currentCardSet, settings.isCardSetFixed);
      }
    }
    
    // 우선 순위 태그 및 폴더 설정
    if (settings.priorityTags !== undefined) {
      // 정렬 서비스에 우선 순위 태그 설정
      const sortService = this.getSortService();
      sortService.setPriorityTags(settings.priorityTags);
    }
    
    if (settings.priorityFolders !== undefined) {
      // 정렬 서비스에 우선 순위 폴더 설정
      const sortService = this.getSortService();
      sortService.setPriorityFolders(settings.priorityFolders);
    }
    
    // 검색 범위 설정
    if (settings.defaultSearchScope !== undefined) {
      const searchService = this.getSearchService();
      searchService.setSearchScope(settings.defaultSearchScope);
    }
    
    // 플러그인 설정 객체 업데이트
    try {
      const plugin = (this.app as any).plugins.plugins['card-navigator'];
      if (plugin) {
        // 설정 객체 업데이트
        Object.keys(settings).forEach((key: string) => {
          const typedKey = key as keyof typeof settings;
          if (settings[typedKey] !== undefined) {
            plugin.settings[typedKey] = settings[typedKey];
          }
        });
        
        // 설정 저장
        await plugin.saveSettings();
        console.log('플러그인 설정 저장 완료');
      } else {
        console.warn('플러그인 인스턴스를 찾을 수 없어 설정을 저장할 수 없습니다.');
      }
    } catch (error) {
      console.error('설정 저장 중 오류 발생:', error);
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
  
  /**
   * 필터 서비스 가져오기
   * @returns 필터 서비스
   */
  getFilterService(): IFilterService {
    return this.filterService;
  }
  
  /**
   * Obsidian App 객체 가져오기
   * @returns Obsidian App 객체
   */
  getApp(): App {
    return this.app;
  }
} 