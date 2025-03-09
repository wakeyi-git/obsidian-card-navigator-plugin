import { App, MarkdownRenderer } from 'obsidian';
import { ICard } from '../domain/card/Card';
import { ICardRepository } from '../domain/card/CardRepository';
import { CardSetSourceType, CardSetType } from '../domain/cardset/CardSet';
import { LayoutType } from '../domain/layout/Layout';
import { IPreset } from '../domain/preset/Preset';
import { SearchType, SearchScope } from '../domain/search/Search';
import CardNavigatorPlugin from '../main';

import { ICardSetService, CardSetService } from './CardSetService';
import { ICardService, CardService } from './CardService';
import { ISortService, SortService } from './SortService';
import { ISearchService, SearchService } from './SearchService';
import { ILayoutService, LayoutService } from './LayoutService';
import { IPresetService, PresetService } from './PresetService';
import { Card } from '../domain/card/Card';
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
  changeCardSetSource(type: CardSetSourceType): Promise<void>;
  
  /**
   * 카드 세트 선택
   * @param cardSet 선택할 카드 세트
   */
  selectCardSet(cardSet: string, isFixed?: boolean): Promise<void>;
  
  /**
   * 레이아웃 변경
   * @param type 변경할 레이아웃 타입
   */
  changeLayout(type: LayoutType): Promise<void>;
  
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
   * @param searchType 검색 타입 (기본값: 'filename')
   * @param caseSensitive 대소문자 구분 여부 (기본값: false)
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  search(
    query: string, 
    searchType: SearchType, 
    caseSensitive: boolean, 
    frontmatterKey?: string
  ): Promise<void>;
  
  /**
   * 설정 가져오기
   * @returns 현재 설정
   */
  getSettings(): any;
  
  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   */
  updateSettings(settings: Partial<{
    cardWidth: number;
    cardHeight: number;
    priorityTags: string[];
    priorityFolders: string[];
    defaultCardSetSource: CardSetSourceType;
    defaultLayout: LayoutType;
    includeSubfolders: boolean;
    defaultFolderCardSet: string;
    defaultTagCardSet: string;
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
  getCardSetSourceService(): ICardSetService;
  
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
   * Obsidian App 객체 가져오기
   * @returns Obsidian App 객체
   */
  getApp(): App;
  
  /**
   * 현재 카드 목록 가져오기
   * 마지막으로 로드된 카드 목록을 반환합니다.
   * @returns 현재 카드 목록
   */
  getCurrentCards(): ICard[];
  
  /**
   * 마크다운 렌더링
   * 마크다운 텍스트를 HTML로 변환합니다.
   * @param markdown 마크다운 텍스트
   * @returns 변환된 HTML
   */
  renderMarkdown(markdown: string): string;
  
  /**
   * 플러그인 인스턴스 가져오기
   * @returns 플러그인 인스턴스
   */
  getPlugin(): CardNavigatorPlugin;
  
  /**
   * 모드 변경 알림 처리
   * CardSetSourceService에서 모드가 변경될 때 호출됩니다.
   * @param cardSetSourceType 변경된 모드 타입
   */
  notifyCardSetSourceChanged(cardSetSourceType: CardSetSourceType): void;
}

/**
 * 카드 네비게이터 서비스 클래스
 * 카드 네비게이터의 핵심 기능을 제공하는 클래스입니다.
 */
export class CardNavigatorService implements ICardNavigatorService {
  private app: App;
  private cardSetSourceService: ICardSetService;
  private cardService: ICardService;
  private sortService: ISortService;
  private searchService: ISearchService;
  private layoutService: ILayoutService;
  private presetService: IPresetService;
  private cardRepository: ICardRepository;
  private plugin: CardNavigatorPlugin;
  
  // 성능 모니터링을 위한 카운터 추가
  private refreshCount = 0;
  private cardLoadCount = 0;
  private renderCount = 0;
  
  // 카드 가져오기 관련 변수
  private _lastGetCardsCall: number | null = null;
  private _lastCards: ICard[] | null = null;
  
  // 카드 저장소 새로고침 관련 변수
  private _lastRefreshCall: number | null = null;
  
  // 초기화 플래그 추가
  private _initializing = false;
  private _initialized = false;
  
  constructor(
    app: App,
    cardRepository: ICardRepository,
    plugin: CardNavigatorPlugin
  ) {
    this.app = app;
    this.cardRepository = cardRepository;
    this.plugin = plugin;
    
    // 서비스 초기화
    this.cardService = new CardService(app, cardRepository);
    this.cardSetSourceService = new CardSetService(app, this.cardService, plugin.settings.defaultCardSetSource, this);
    this.sortService = new SortService();
    this.layoutService = new LayoutService(plugin.settings);
    this.presetService = new PresetService(plugin.settings);
    this.searchService = new SearchService(this.presetService, this.cardService, this.cardSetSourceService, this);
    
    // 서비스 간 의존성 설정
    this.cardSetSourceService.setSearchService(this.searchService);
  }
  
  /**
   * 서비스 초기화
   */
  async initialize(): Promise<void> {
    console.log(`[CardNavigatorService] 초기화 시작`);
    
    // 이미 초기화된 경우 중복 초기화 방지
    if (this._initialized) {
      console.log(`[CardNavigatorService] 이미 초기화되었습니다. 중복 초기화 방지`);
      return;
    }
    
    // 초기화 중인 경우 중복 초기화 방지
    if (this._initializing) {
      console.log(`[CardNavigatorService] 이미 초기화 중입니다. 중복 초기화 방지`);
      
      // 초기화가 완료될 때까지 대기 (최대 5초)
      let waitCount = 0;
      const maxWait = 50; // 100ms * 50 = 5초
      
      while (this._initializing && waitCount < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
      
      // 초기화가 완료되었으면 반환
      if (this._initialized) {
        console.log(`[CardNavigatorService] 초기화가 완료되었습니다.`);
        return;
      }
      
      // 여전히 초기화 중이면 오류 발생
      if (this._initializing) {
        console.error(`[CardNavigatorService] 초기화 시간이 너무 오래 걸립니다.`);
        this._initializing = false; // 초기화 상태 초기화
        throw new Error('초기화 시간이 너무 오래 걸립니다.');
      }
    }
    
    this._initializing = true;
    
    try {
      // 플러그인 설정 가져오기
      const settings = this.plugin.settings;
      
      // 모드 설정 - useLastCardSetSourceOnLoad 설정에 따라 마지막 모드 또는 기본 모드 사용
      let cardSetSourceToUse: CardSetSourceType;
      
      if (settings.useLastCardSetSourceOnLoad && settings.lastCardSetSource) {
        cardSetSourceToUse = settings.lastCardSetSource;
        console.log(`[CardNavigatorService] 마지막 모드 사용: ${cardSetSourceToUse}`);
      } else {
        cardSetSourceToUse = settings.defaultCardSetSource;
        console.log(`[CardNavigatorService] 기본 모드 사용: ${cardSetSourceToUse}`);
      }
      
      console.log(`[CardNavigatorService] 사용할 모드: ${cardSetSourceToUse} (마지막 모드: ${settings.lastCardSetSource}, 기본 모드: ${settings.defaultCardSetSource})`);
      
      // 모드 변경
      await this.cardSetSourceService.changeSource(cardSetSourceToUse);
      
      // 하위 폴더 포함 여부 설정
      if (settings.includeSubfolders !== undefined) {
        this.cardSetSourceService.setIncludeSubfolders(settings.includeSubfolders);
      }
      
      // 태그 대소문자 구분 여부 설정
      if (settings.tagCaseSensitive !== undefined) {
        this.cardSetSourceService.setTagCaseSensitive(settings.tagCaseSensitive);
      }
      
      // 카드 세트 설정 - useLastCardSetSourceOnLoad 설정에 따라 마지막 카드 세트 또는 기본 카드 세트 사용
      let cardSet: string;
      let isFixed: boolean;
      
      if (cardSetSourceToUse === 'folder') {
        if (settings.useLastCardSetSourceOnLoad && settings.lastFolderCardSet) {
          cardSet = settings.lastFolderCardSet;
          isFixed = settings.lastFolderCardSetFixed !== undefined ? 
            settings.lastFolderCardSetFixed : 
            settings.isCardSetFixed;
          console.log(`[CardNavigatorService] 폴더 모드 마지막 카드 세트 사용: ${cardSet}`);
        } else {
          cardSet = settings.defaultFolderCardSet;
          isFixed = settings.isCardSetFixed;
          console.log(`[CardNavigatorService] 폴더 모드 기본 카드 세트 사용: ${cardSet}`);
        }
      } else if (cardSetSourceToUse === 'tag') {
        if (settings.useLastCardSetSourceOnLoad && settings.lastTagCardSet) {
          cardSet = settings.lastTagCardSet;
          isFixed = settings.lastTagCardSetFixed !== undefined ? 
            settings.lastTagCardSetFixed : 
            settings.isCardSetFixed;
          console.log(`[CardNavigatorService] 태그 모드 마지막 카드 세트 사용: ${cardSet}`);
        } else {
          cardSet = settings.defaultTagCardSet;
          isFixed = settings.isCardSetFixed;
          console.log(`[CardNavigatorService] 태그 모드 기본 카드 세트 사용: ${cardSet}`);
        }
      } else {
        // 검색 모드 등 다른 모드인 경우 기본 카드 세트 사용
        cardSet = settings.defaultFolderCardSet;
        isFixed = settings.isCardSetFixed;
      }
      
      // 빈 카드 세트인 경우 활성 파일의 폴더나 태그를 사용
      if (cardSet === '') {
        isFixed = false; // 활성 파일 기반이므로 고정하지 않음
        
        // 활성 파일 가져오기
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          // 활성 파일 변경 이벤트 처리를 통해 카드 세트 설정
          await this.cardSetSourceService.handleActiveFileChange(activeFile);
          
          // 설정된 카드 세트 가져오기
          const newCardSet = this.cardSetSourceService.getCurrentCardSet();
          if (newCardSet) {
            cardSet = newCardSet;
            console.log(`[CardNavigatorService] 활성 파일 기반 카드 세트 설정: ${cardSet}`);
          } else {
            // 활성 파일에서 카드 세트를 가져올 수 없는 경우 기본값 사용
            cardSet = cardSetSourceToUse === 'folder' ? '/' : '';
            console.log(`[CardNavigatorService] 활성 파일에서 카드 세트를 가져올 수 없어 기본값 사용: ${cardSet}`);
          }
        } else {
          // 활성 파일이 없는 경우 기본값 사용
          cardSet = cardSetSourceToUse === 'folder' ? '/' : '';
          console.log(`[CardNavigatorService] 활성 파일이 없어 기본값 사용: ${cardSet}`);
        }
      }
      
      // 카드 세트 선택
      this.cardSetSourceService.selectCardSet(cardSet, isFixed);
      console.log(`[CardNavigatorService] 카드 세트 설정: ${cardSet}, 고정 여부: ${isFixed}`);
      
      // 하위 폴더 포함 여부 저장
      if (cardSetSourceToUse === 'folder') {
        this.plugin.settings.includeSubfolders = this.cardSetSourceService.getIncludeSubfolders();
      }
      
      // 레이아웃 타입 설정
      if (settings.defaultLayout) {
        this.layoutService.changeLayoutType(settings.defaultLayout);
      }
      
      // 모드 서비스 초기화
      await this.cardSetSourceService.initialize();
      
      // 현재 카드 세트 확인
      const currentCardSet = this.cardSetSourceService.getCurrentCardSet();
      console.log(`[CardNavigatorService] 초기화 후 현재 카드 세트: ${currentCardSet || '없음'}`);
      
      // 서비스 간 의존성 설정
      this.cardSetSourceService.setSearchService(this.searchService);
      
      // 활성 파일 기반 카드 세트 설정 (카드 세트가 고정되지 않은 경우에만)
      if (!isFixed) {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          const cardSetChanged = await this.cardSetSourceService.handleActiveFileChange(activeFile);
          if (cardSetChanged) {
            console.log(`[CardNavigatorService] 초기화 시 활성 파일 기반으로 카드 세트 변경됨: ${activeFile.path}`);
            // 변경된 카드 세트 가져오기
            const newCardSet = this.cardSetSourceService.getCurrentCardSet();
            console.log(`[CardNavigatorService] 새 카드 세트: ${newCardSet || '없음'}`);
          }
        }
      }
      
      console.log(`[CardNavigatorService] 서비스 초기화 완료`);
      this._initialized = true;
    } catch (error) {
      console.error(`[CardNavigatorService] 초기화 중 오류 발생:`, error);
      this._initialized = false; // 초기화 실패 상태로 설정
      throw error; // 오류를 상위로 전파
    } finally {
      this._initializing = false;
    }
  }
  
  /**
   * 카드 목록 가져오기
   * 현재 모드, 필터, 정렬, 검색 설정에 따라 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  async getCards(): Promise<ICard[]> {
    console.log(`[CardNavigatorService] getCards 호출됨`);
    
    // 캐싱 메커니즘 - 짧은 시간 내에 여러 번 호출되는 경우 이전 결과 재사용
    const now = Date.now();
    const CACHE_THRESHOLD = 500; // 500ms 이내 호출은 캐시 사용 (더 길게 설정)
    
    if (this._lastGetCardsCall && now - this._lastGetCardsCall < CACHE_THRESHOLD && this._lastCards) {
      console.log(`[CardNavigatorService] getCards 호출 간격이 너무 짧습니다. 이전 결과 재사용 (${now - this._lastGetCardsCall}ms)`);
      return this._lastCards;
    }
    
    // 초기화 중인 경우 대기
    if (this._initializing) {
      console.log(`[CardNavigatorService] 서비스가 초기화 중입니다. 초기화가 완료될 때까지 대기합니다.`);
      
      // 초기화가 완료될 때까지 대기 (최대 5초)
      let waitCount = 0;
      const maxWait = 50; // 100ms * 50 = 5초
      
      while (this._initializing && waitCount < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
      
      // 여전히 초기화 중이면 오류 발생
      if (this._initializing) {
        console.error(`[CardNavigatorService] 서비스 초기화 시간이 너무 오래 걸립니다.`);
        throw new Error('서비스 초기화 시간이 너무 오래 걸립니다.');
      }
    }
    
    // 초기화가 완료되지 않은 경우 초기화 시도
    if (!this._initialized) {
      console.log(`[CardNavigatorService] 서비스가 초기화되지 않았습니다. 초기화 후 카드를 가져옵니다.`);
      try {
        await this.initialize();
        
        // 초기화 후에도 초기화되지 않았다면 오류 발생
        if (!this._initialized) {
          console.error(`[CardNavigatorService] 서비스 초기화 실패`);
          throw new Error('서비스 초기화 실패');
        }
      } catch (error) {
        console.error(`[CardNavigatorService] 초기화 중 오류 발생:`, error);
        throw new Error(`서비스 초기화 중 오류가 발생했습니다: ${error}`);
      }
    }
    
    this._lastGetCardsCall = now;
    
    try {
      // 모드 서비스에서 카드 가져오기
      const cards = await this.cardSetSourceService.getCards();
      console.log(`[CardNavigatorService] 모드 서비스에서 가져온 카드 수: ${cards.length}`);
      
      // 정렬 서비스로 카드 정렬
      const sortedCards = this.sortService.applySort(cards);
      
      // 결과 캐싱
      this._lastCards = sortedCards;
      
      // 카드 로드 카운트 증가
      this.cardLoadCount++;
      
      // 카드가 없는 경우 로그 출력
      if (sortedCards.length === 0) {
        console.log(`[CardNavigatorService] 최종 카드 목록이 비어 있습니다. 현재 모드: ${this.cardSetSourceService.getCurrentSourceType()}, 카드 세트: ${this.cardSetSourceService.getCurrentCardSet() || '없음'}`);
      }
      
      return sortedCards;
    } catch (error) {
      console.error(`[CardNavigatorService] 카드 가져오기 오류:`, error);
      
      // 오류 발생 시 빈 배열 반환
      console.log(`[CardNavigatorService] 오류로 인해 빈 카드 목록 반환`);
      return [];
    }
  }
  
  async changeCardSetSource(type: CardSetSourceType): Promise<void> {
    console.log(`[CardNavigatorService] 모드 변경: ${type}`);
    
    // 현재 모드 저장
    const previousCardSetSource = this.cardSetSourceService.getCurrentSourceType();
    
    // 모드 변경
    await this.cardSetSourceService.changeSource(type);
    
    // 현재 모드를 플러그인 설정에 저장
    this.plugin.settings.lastCardSetSource = previousCardSetSource;
    await this.plugin.saveSettings();
    console.log(`[CardNavigatorService] 마지막 모드 저장: ${previousCardSetSource}`);
  }
  
  async selectCardSet(cardSet: string, isFixed?: boolean): Promise<void> {
    console.log(`[CardNavigatorService] 카드 세트 선택: ${cardSet}, 고정 여부: ${isFixed}`);
    
    // 현재 모드 확인
    const currentCardSetSource = this.cardSetSourceService.getCurrentSourceType();
    console.log(`[CardNavigatorService] 현재 모드: ${currentCardSetSource}`);
    
    // isFixed가 정의되지 않은 경우 현재 고정 상태 유지
    const fixedState = isFixed !== undefined ? isFixed : this.cardSetSourceService.isCardSetFixed();
    
    // 모드 서비스에 카드 세트 설정
    this.cardSetSourceService.selectCardSet(cardSet, fixedState);
    console.log(`[CardNavigatorService] 모드 서비스에 카드 세트 설정 완료`);
    
    // 카드 세트 변경 후 카드 저장소 새로고침
    await this.cardService.refreshCards();
    console.log(`[CardNavigatorService] 카드 저장소 새로고침 완료`);
    
    // 현재 선택된 카드 세트 확인
    const currentCardSet = this.cardSetSourceService.getCurrentCardSet();
    console.log(`[CardNavigatorService] 현재 선택된 카드 세트: ${currentCardSet}`);
    
    // 현재 모드에 따라 마지막 카드 세트 저장
    if (currentCardSetSource === 'folder') {
      // 카드 세트를 마지막 폴더 카드 세트로 저장
      this.plugin.settings.lastFolderCardSet = cardSet;
      this.plugin.settings.lastFolderCardSetFixed = fixedState;
    } else if (currentCardSetSource === 'tag') {
      // 카드 세트를 마지막 태그 카드 세트로 저장
      this.plugin.settings.lastTagCardSet = cardSet;
      this.plugin.settings.lastTagCardSetFixed = fixedState;
    }
    
    // 하위 폴더 포함 여부 저장
    if (currentCardSetSource === 'folder') {
      this.plugin.settings.includeSubfolders = this.cardSetSourceService.getIncludeSubfolders();
    }
    
    // 설정 저장
    await this.plugin.saveSettings();
    console.log(`[CardNavigatorService] 카드 세트 저장 완료 - ${cardSet}, 모드: ${currentCardSetSource}, 고정 여부: ${fixedState}`);
  }
  
  /**
   * 카드 저장소 새로고침
   * 카드 목록을 다시 로드합니다.
   */
  async refreshCards(): Promise<void> {
    console.log(`[CardNavigatorService] refreshCards 호출됨`);
    
    // 캐싱 메커니즘 - 짧은 시간 내에 여러 번 호출되는 경우 무시
    const now = Date.now();
    const REFRESH_THRESHOLD = 1000; // 1초 이내 호출은 무시
    
    if (this._lastRefreshCall && now - this._lastRefreshCall < REFRESH_THRESHOLD) {
      console.log(`[CardNavigatorService] refreshCards 호출 간격이 너무 짧습니다. 무시 (${now - this._lastRefreshCall}ms)`);
      return;
    }
    
    this._lastRefreshCall = now;
    this.refreshCount++;
    
    try {
      // 카드 저장소 새로고침
      await this.cardRepository.refresh();
      
      // 캐시 초기화
      this._lastCards = null;
      this._lastGetCardsCall = null;
      
      // 활성 파일 변경 이벤트 처리
      // 카드 세트가 고정되지 않은 경우에만 활성 파일에 따라 카드 세트 변경
      if (!this.cardSetSourceService.isCardSetFixed()) {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          const cardSetChanged = await this.cardSetSourceService.handleActiveFileChange(activeFile);
          if (cardSetChanged) {
            console.log(`[CardNavigatorService] 활성 파일 변경으로 카드 세트 변경됨: ${activeFile.path}`);
          }
        }
      }
      
      console.log(`[CardNavigatorService] 카드 저장소 새로고침 완료 (${this.refreshCount}번째)`);
    } catch (error) {
      console.error(`[CardNavigatorService] 카드 저장소 새로고침 오류:`, error);
    }
  }
  
  async changeLayout(type: LayoutType): Promise<void> {
    this.layoutService.changeLayoutType(type);
  }
  
  async applyPreset(presetId: string): Promise<boolean> {
    return this.presetService.applyPreset(presetId);
  }
  
  saveAsPreset(name: string, description?: string): IPreset {
    return this.presetService.saveCurrentAsPreset(name, description);
  }
  
  /**
   * 검색 수행
   * @param query 검색어
   * @param searchType 검색 타입 (기본값: 'filename')
   * @param caseSensitive 대소문자 구분 여부 (기본값: false)
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  async search(
    query: string, 
    searchType: SearchType, 
    caseSensitive: boolean, 
    frontmatterKey?: string
  ): Promise<void> {
    // 기본값 설정
    const type = searchType || 'filename';
    const isCaseSensitive = caseSensitive !== undefined ? caseSensitive : false;
    
    // 검색 모드로 전환
    this.searchService.setQuery(query);
    this.searchService.changeSearchType(type, frontmatterKey);
    this.searchService.setCaseSensitive(isCaseSensitive);
    
    // 모드 변경 (검색 모드로)
    await this.changeCardSetSource('search');
    
    // 카드 목록 새로고침
    await this.refreshCards();
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
      if (this.cardSetSourceService.getCurrentSourceType() !== 'search') {
        this.cardSetSourceService.changeSource('search');
      }
      
      // 현재 검색 쿼리 가져오기
      const currentCardSetSource = this.cardSetSourceService.getCurrentSource() as any;
      const query = currentCardSetSource.query || '';
      const caseSensitive = currentCardSetSource.caseSensitive || false;
      
      // 검색 모드 설정
      (this.cardSetSourceService as any).configureSearchCardSetSource(query, searchType, caseSensitive, frontmatterKey);
      
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
      if (this.cardSetSourceService.getCurrentSourceType() !== 'search') {
        this.cardSetSourceService.changeSource('search');
      }
      
      // 현재 검색 쿼리 가져오기
      const currentCardSetSource = this.cardSetSourceService.getCurrentSource() as any;
      const query = currentCardSetSource.query || '';
      const searchType = currentCardSetSource.searchType || 'content';
      const frontmatterKey = currentCardSetSource.frontmatterKey;
      
      // 검색 모드 설정
      (this.cardSetSourceService as any).configureSearchCardSetSource(query, searchType, caseSensitive, frontmatterKey);
      
      // 카드 저장소 새로고침
      await this.cardService.refreshCards();
      
      console.log(`[CardNavigatorService] 검색 타입 변경 완료`);
    } catch (error) {
      console.error(`[CardNavigatorService] 검색 타입 변경 오류:`, error);
      throw error;
    }
  }
  
  /**
   * Obsidian App 객체 가져오기
   * @returns Obsidian App 객체
   */
  getApp(): App {
    return this.app;
  }
  
  /**
   * 현재 카드 목록 가져오기
   * 마지막으로 로드된 카드 목록을 반환합니다.
   * @returns 현재 카드 목록
   */
  getCurrentCards(): ICard[] {
    return this._lastCards || [];
  }
  
  /**
   * 마크다운 렌더링
   * 마크다운 텍스트를 HTML로 변환합니다.
   * @param markdown 마크다운 텍스트
   * @returns 변환된 HTML
   */
  renderMarkdown(markdown: string): string {
    try {
      // Obsidian의 MarkdownRenderer 사용
      const element = document.createElement('div');
      
      // 비동기 함수이지만 동기적으로 처리하기 위해 임시 방편 사용
      try {
        // 간단한 마크다운 파싱 (Obsidian API 직접 사용 대신)
        // 이 방법은 완벽하지 않지만 동기적으로 동작합니다
        return this.fallbackMarkdownRender(markdown);
      } catch (renderError) {
        console.error('마크다운 렌더링 오류:', renderError);
        return this.fallbackMarkdownRender(markdown);
      }
    } catch (error) {
      console.error('마크다운 렌더링 오류:', error);
      return this.fallbackMarkdownRender(markdown);
    }
  }
  
  /**
   * 기본 마크다운 변환 로직
   * Obsidian API를 사용할 수 없을 때 대체 방법으로 사용
   * @param markdown 마크다운 텍스트
   * @returns 변환된 HTML
   */
  private fallbackMarkdownRender(markdown: string): string {
    // 헤더 변환 (# Header -> <h1>Header</h1>)
    let html = markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
      .replace(/^###### (.*$)/gm, '<h6>$1</h6>');
    
    // 강조 변환 (**bold** -> <strong>bold</strong>)
    html = html
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>');
    
    // 링크 변환 ([text](url) -> <a href="url">text</a>)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    
    // 이미지 변환 (![alt](url) -> <img src="url" alt="alt">)
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
    
    // 코드 블록 변환
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // 인라인 코드 변환
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 목록 변환 (- item -> <li>item</li>)
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    
    // 단락 변환 (빈 줄로 구분된 텍스트 -> <p>text</p>)
    html = html.replace(/^(?!<[hl]|<li|<pre)(.*$)/gm, '<p>$1</p>');
    
    return html;
  }
  
  /**
   * 플러그인 인스턴스 가져오기
   * @returns 플러그인 인스턴스
   */
  getPlugin(): CardNavigatorPlugin {
    return this.plugin;
  }
  
  /**
   * 모드 변경 알림 처리
   * CardSetSourceService에서 모드가 변경될 때 호출됩니다.
   * @param cardSetSourceType 변경된 모드 타입
   */
  notifyCardSetSourceChanged(cardSetSourceType: CardSetSourceType): void {
    console.log(`[CardNavigatorService] 모드 변경 알림 수신: ${cardSetSourceType}`);
    
    // 모드 변경 시 필요한 추가 작업 수행
    try {
      // 검색 서비스에 모드 변경 알림
      if (this.searchService) {
        this.searchService.onCardSetSourceChanged(cardSetSourceType);
      }
      
      // 정렬 서비스에 모드 변경 알림
      if (this.sortService) {
        this.sortService.onCardSetSourceChanged(cardSetSourceType);
      }
      
      // 레이아웃 서비스에 모드 변경 알림
      if (this.layoutService) {
        this.layoutService.onCardSetSourceChanged(cardSetSourceType);
      }
    } catch (error) {
      console.error(`[CardNavigatorService] 모드 변경 알림 처리 중 오류 발생:`, error);
    }
  }
  
  /**
   * 설정 가져오기
   * @returns 현재 설정
   */
  getSettings(): any {
    // 플러그인 인스턴스에서 설정 가져오기
    try {
      if (this.plugin && this.plugin.settings) {
        return this.plugin.settings;
      }
      
      return this.getDefaultSettings();
    } catch (error) {
      console.error('[CardNavigatorService] 설정 가져오기 오류:', error);
      return this.getDefaultSettings();
    }
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
      defaultCardSetSource: 'folder' as CardSetSourceType,
      defaultLayout: 'grid' as LayoutType,
      includeSubfolders: true,
      defaultFolderCardSet: '',
      defaultTagCardSet: '',
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
    defaultCardSetSource: CardSetSourceType;
    defaultLayout: LayoutType;
    includeSubfolders: boolean;
    defaultFolderCardSet: string;
    defaultTagCardSet: string;
    isCardSetFixed: boolean;
    defaultSearchScope?: 'all' | 'current';
    tagCaseSensitive?: boolean;
  }>): Promise<void> {
    console.log(`[CardNavigatorService] 설정 업데이트:`, settings);
    
    try {
      // 플러그인 설정 업데이트
      if (settings.cardWidth !== undefined) {
        this.plugin.settings.cardWidth = settings.cardWidth;
      }
      
      if (settings.cardHeight !== undefined) {
        this.plugin.settings.cardHeight = settings.cardHeight;
      }
      
      if (settings.priorityTags !== undefined) {
        this.plugin.settings.priorityTags = settings.priorityTags;
      }
      
      if (settings.priorityFolders !== undefined) {
        this.plugin.settings.priorityFolders = settings.priorityFolders;
      }
      
      if (settings.defaultCardSetSource !== undefined) {
        this.plugin.settings.defaultCardSetSource = settings.defaultCardSetSource;
      }
      
      if (settings.defaultLayout !== undefined) {
        this.plugin.settings.defaultLayout = settings.defaultLayout;
      }
      
      if (settings.includeSubfolders !== undefined) {
        this.plugin.settings.includeSubfolders = settings.includeSubfolders;
        this.cardSetSourceService.setIncludeSubfolders(settings.includeSubfolders);
      }
      
      if (settings.defaultFolderCardSet !== undefined) {
        this.plugin.settings.defaultFolderCardSet = settings.defaultFolderCardSet;
      }
      
      if (settings.defaultTagCardSet !== undefined) {
        this.plugin.settings.defaultTagCardSet = settings.defaultTagCardSet;
      }
      
      if (settings.isCardSetFixed !== undefined) {
        this.plugin.settings.isCardSetFixed = settings.isCardSetFixed;
      }
      
      if (settings.defaultSearchScope !== undefined) {
        this.plugin.settings.defaultSearchScope = settings.defaultSearchScope;
      }
      
      if (settings.tagCaseSensitive !== undefined) {
        this.plugin.settings.tagCaseSensitive = settings.tagCaseSensitive;
        this.cardSetSourceService.setTagCaseSensitive(settings.tagCaseSensitive);
      }
      
      // 설정 저장
      await this.plugin.saveSettings();
      
      console.log(`[CardNavigatorService] 설정 업데이트 완료`);
    } catch (error) {
      console.error(`[CardNavigatorService] 설정 업데이트 오류:`, error);
      throw error;
    }
  }
  
  /**
   * 모든 설정 초기화
   */
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
  getCardSetSourceService(): ICardSetService {
    return this.cardSetSourceService;
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