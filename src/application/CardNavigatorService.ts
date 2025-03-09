import { App, MarkdownRenderer } from 'obsidian';
import { ICard } from '../domain/card/Card';
import { ICardRepository } from '../domain/card/CardRepository';
import { CardSetSourceType, CardSetType } from '../domain/cardset/CardSet';
import { LayoutType } from '../domain/layout/Layout';
import { IPreset } from '../domain/preset/Preset';
import { SearchType, SearchScope } from '../domain/search/Search';
import CardNavigatorPlugin from '../main';

import { ICardSetService } from './CardSetService';
import { ICardSetSourceService, CardSetSourceService } from './CardSetSourceService';
import { ICardService, CardService } from './CardService';
import { ISortService, SortService } from './SortService';
import { ISearchService } from '../domain/search/SearchInterfaces';
import { ILayoutService, LayoutService } from './LayoutService';
import { IPresetService, PresetService } from './PresetService';
import { Card } from '../domain/card/Card';
import { TimerUtil } from '../infrastructure/TimerUtil';
import { ServiceFactory } from './ServiceFactory';
import { 
  ICardNavigatorService, 
  ICardNavigatorInitializer, 
  ICardManager, 
  ICardSetSourceController, 
  ILayoutController, 
  IPresetController, 
  ISearchController, 
  ISettingsController, 
  IServiceProvider, 
  IMarkdownRenderer 
} from '../domain/navigator/NavigatorInterfaces';

// ICardNavigatorService 인터페이스를 내보냅니다.
export type { ICardNavigatorService };

/**
 * 카드 네비게이터 서비스 구현 클래스
 * 카드 네비게이터의 핵심 기능을 제공합니다.
 */
export class CardNavigatorService implements ICardNavigatorService {
  private app: App;
  private cardService: ICardService;
  private cardSetSourceService: ICardSetSourceService | null;
  private sortService: ISortService;
  private layoutService: ILayoutService;
  private presetService: IPresetService;
  private searchService: ISearchService | null;
  private plugin: CardNavigatorPlugin;
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
  
  // 초기화 플래그 추가
  private _initializing = false;
  private _initialized = false;
  
  constructor(
    app: App,
    cardRepository: ICardRepository,
    plugin: CardNavigatorPlugin,
    cardService?: ICardService,
    cardSetSourceService?: ICardSetSourceService,
    sortService?: ISortService,
    layoutService?: ILayoutService,
    presetService?: IPresetService,
    searchService?: ISearchService
  ) {
    this.app = app;
    this.plugin = plugin;
    this.cardRepository = cardRepository;
    
    // 외부에서 주입받은 서비스 사용 또는 직접 생성
    this.cardService = cardService || new CardService(app, cardRepository);
    this.sortService = sortService || new SortService();
    this.layoutService = layoutService || new LayoutService(plugin.settings);
    this.presetService = presetService || new PresetService(plugin.settings);
    
    // 순환 참조 방지를 위해 cardSetSourceService와 searchService는 나중에 설정
    this.cardSetSourceService = cardSetSourceService || null;
    this.searchService = searchService || null;
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
    
    // 초기화 중 플래그 설정
    this._initializing = true;
    
    try {
      // 필수 서비스 확인
      if (!this.cardSetSourceService) {
        console.warn('[CardNavigatorService] CardSetSourceService가 설정되지 않았습니다.');
      }
      
      if (!this.searchService) {
        console.warn('[CardNavigatorService] SearchService가 설정되지 않았습니다.');
      }
      
      // 서비스 간 의존성 설정
      if (this.cardSetSourceService && this.searchService) {
        this.cardSetSourceService.setSearchService(this.searchService);
      }
      
      // 초기화 완료
      this._initialized = true;
    } catch (error) {
      console.error(`[CardNavigatorService] 초기화 오류:`, error);
    } finally {
      this._initializing = false;
    }
  }
  
  /**
   * 카드셋 소스 서비스 설정
   * @param service 카드셋 소스 서비스
   */
  setCardSetSourceService(service: ICardSetSourceService): void {
    this.cardSetSourceService = service;
    
    // 검색 서비스가 이미 설정되어 있다면 의존성 설정
    if (this.searchService) {
      service.setSearchService(this.searchService);
    }
  }
  
  /**
   * 검색 서비스 설정
   * @param service 검색 서비스
   */
  setSearchService(service: ISearchService): void {
    this.searchService = service;
    
    // 카드셋 소스 서비스가 이미 설정되어 있다면 의존성 설정
    if (this.cardSetSourceService) {
      this.cardSetSourceService.setSearchService(this.searchService);
    }
  }
  
  /**
   * 카드 목록 가져오기
   * 현재 카드 세트, 필터, 정렬, 검색 설정에 따라 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  async getCards(): Promise<ICard[]> {
    try {
      // cardSetSourceService가 null인지 확인
      if (!this.cardSetSourceService) {
        console.error('[CardNavigatorService] CardSetSourceService가 초기화되지 않았습니다.');
        return [];
      }
      
      // 카드 세트 서비스에서 카드 가져오기
      const cards = await this.cardSetSourceService.getCards();
      console.log(`[CardNavigatorService] 카드 세트 서비스에서 가져온 카드 수: ${cards.length}`);
      
      // 정렬 서비스로 카드 정렬
      const sortedCards = this.sortService.applySort(cards);
      console.log(`[CardNavigatorService] 정렬된 카드 수: ${sortedCards.length}`);
      
      // 카드 로드 카운터 증가
      this.cardLoadCount++;
      
      // 마지막 호출 시간 및 카드 목록 저장
      this._lastGetCardsCall = Date.now();
      this._lastCards = sortedCards;
      
      // 카드가 없는 경우 로그 출력
      if (sortedCards.length === 0) {
        console.log(`[CardNavigatorService] 최종 카드 목록이 비어 있습니다. 현재 카드 세트: ${this.cardSetSourceService.getCurrentSourceType()}, 카드 세트: ${this.cardSetSourceService.getCurrentCardSet() || '없음'}`);
      }
      
      return sortedCards;
    } catch (error) {
      console.error(`[CardNavigatorService] 카드 가져오기 오류:`, error);
      return [];
    }
  }
  
  /**
   * 카드 세트 소스 변경
   * @param type 변경할 카드 세트 타입
   */
  async changeCardSetSource(type: CardSetSourceType): Promise<void> {
    console.log(`[CardNavigatorService] 카드 세트 변경: ${type}`);
    
    // cardSetSourceService가 null인지 확인
    if (!this.cardSetSourceService) {
      console.error('[CardNavigatorService] CardSetSourceService가 초기화되지 않았습니다.');
      return;
    }
    
    // 현재 카드 세트 저장
    const previousCardSetSource = this.cardSetSourceService.getCurrentSourceType();
    
    // 카드 세트 변경
    await this.cardSetSourceService.changeCardSetSource(type);
    
    // 현재 카드 세트를 플러그인 설정에 저장
    this.plugin.settings.lastCardSetSource = previousCardSetSource;
    
    // 설정 저장
    await this.plugin.saveSettings();
  }
  
  /**
   * 카드 세트 선택
   * @param cardSet 선택할 카드 세트
   * @param isFixed 고정 여부
   */
  async selectCardSet(cardSet: string, isFixed?: boolean): Promise<void> {
    console.log(`[CardNavigatorService] 카드 세트 선택: ${cardSet}, 고정 여부: ${isFixed}`);
    
    // cardSetSourceService가 null인지 확인
    if (!this.cardSetSourceService) {
      console.error('[CardNavigatorService] CardSetSourceService가 초기화되지 않았습니다.');
      return;
    }
    
    // isFixed가 정의되지 않은 경우 현재 고정 상태 유지
    const fixedState = isFixed !== undefined ? isFixed : this.cardSetSourceService.isCardSetFixed();
    
    // 카드 세트 서비스에 카드 세트 설정
    await this.cardSetSourceService.selectCardSet(cardSet, fixedState);
    console.log(`[CardNavigatorService] 카드 세트 서비스에 카드 세트 설정 완료`);
    
    // 카드 세트 변경 후 카드 저장소 새로고침
    await this.refreshCards();
  }
  
  /**
   * 카드 저장소 새로고침
   * 카드 목록을 다시 로드합니다.
   */
  async refreshCards(): Promise<void> {
    // 중복 호출 방지
    const now = Date.now();
    if (this._lastRefreshCall && now - this._lastRefreshCall < 100) {
      console.log(`[CardNavigatorService] 카드 새로고침 중복 호출 방지 (${now - this._lastRefreshCall}ms)`);
      return;
    }
    this._lastRefreshCall = now;
    
    this.refreshCount++;
    console.log(`[CardNavigatorService] 카드 새로고침 #${this.refreshCount}`);
    
    try {
      // 카드 저장소 새로고침
      await this.cardRepository.refresh();
      
      // 캐시 초기화
      this._lastCards = null;
      
      // 카드 목록 갱신
      await this.getCards();
    } catch (error) {
      console.error(`[CardNavigatorService] 카드 새로고침 오류:`, error);
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
    searchType: SearchType = 'filename', 
    caseSensitive = false, 
    frontmatterKey?: string
  ): Promise<void> {
    console.log(`[CardNavigatorService] 검색: ${query}, 타입: ${searchType}, 대소문자 구분: ${caseSensitive}, 프론트매터 키: ${frontmatterKey || '없음'}`);
    
    try {
      // searchService와 cardSetSourceService가 null인지 확인
      if (!this.searchService || !this.cardSetSourceService) {
        console.error('[CardNavigatorService] SearchService 또는 CardSetSourceService가 초기화되지 않았습니다.');
        return;
      }
      
      // 검색 타입 설정
      this.searchService.changeSearchType(searchType, frontmatterKey);
      this.searchService.setCaseSensitive(caseSensitive);
      this.searchService.setQuery(query);
      
      // 검색 카드 세트로 전환
      if (this.cardSetSourceService.getCurrentSourceType() !== 'search') {
        // 검색 카드 세트로 전환
        this.cardSetSourceService.configureSearchCardSetSource(query, searchType, caseSensitive, frontmatterKey);
      }
      
      // 검색 기록 저장
      this.searchService.saveSearchHistory(query);
      
      // 카드 목록 갱신
      await this.refreshCards();
    } catch (error) {
      console.error(`[CardNavigatorService] 검색 중 오류 발생:`, error);
    }
  }
  
  /**
   * 검색 타입 변경
   * @param searchType 검색 타입
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  async changeSearchType(searchType: SearchType, frontmatterKey?: string): Promise<void> {
    console.log(`[CardNavigatorService] 검색 타입 변경: ${searchType}, 프론트매터 키: ${frontmatterKey || '없음'}`);
    
    try {
      // searchService와 cardSetSourceService가 null인지 확인
      if (!this.searchService || !this.cardSetSourceService) {
        console.error('[CardNavigatorService] SearchService 또는 CardSetSourceService가 초기화되지 않았습니다.');
        return;
      }
      
      // 검색 서비스에 검색 타입 설정
      this.searchService.changeSearchType(searchType, frontmatterKey);
      
      // 현재 카드셋 소스가 검색 카드 세트인 경우에만 처리
      if (this.cardSetSourceService.getCurrentSourceType() === 'search') {
        // 현재 검색 쿼리 가져오기
        const searchState = this.searchService.getSearchCardSetSourceState();
        const query = searchState.query || '';
        const caseSensitive = searchState.caseSensitive || false;
        
        // 검색 카드 세트 설정
        this.cardSetSourceService.configureSearchCardSetSource(query, searchType, caseSensitive, frontmatterKey);
        
        // 카드 저장소 새로고침
        await this.refreshCards();
      }
    } catch (error) {
      console.error(`[CardNavigatorService] 검색 타입 변경 중 오류 발생:`, error);
    }
  }
  
  /**
   * 대소문자 구분 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  async setCaseSensitive(caseSensitive: boolean): Promise<void> {
    console.log(`[CardNavigatorService] 대소문자 구분 설정: ${caseSensitive}`);
    
    try {
      // searchService와 cardSetSourceService가 null인지 확인
      if (!this.searchService || !this.cardSetSourceService) {
        console.error('[CardNavigatorService] SearchService 또는 CardSetSourceService가 초기화되지 않았습니다.');
        return;
      }
      
      // 검색 서비스에 대소문자 구분 설정
      this.searchService.setCaseSensitive(caseSensitive);
      
      // 현재 카드셋 소스가 검색 카드 세트인 경우에만 처리
      if (this.cardSetSourceService.getCurrentSourceType() === 'search') {
        // 현재 검색 쿼리 가져오기
        const searchState = this.searchService.getSearchCardSetSourceState();
        const query = searchState.query || '';
        const searchType = searchState.searchType || 'content';
        const frontmatterKey = searchState.frontmatterKey;
        
        // 검색 카드 세트 설정
        this.cardSetSourceService.configureSearchCardSetSource(query, searchType, caseSensitive, frontmatterKey);
        
        // 카드 저장소 새로고침
        await this.refreshCards();
      }
    } catch (error) {
      console.error(`[CardNavigatorService] 대소문자 구분 설정 중 오류 발생:`, error);
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
   * 카드 세트 변경 알림 처리
   * CardSetSourceService에서 카드 세트가 변경될 때 호출됩니다.
   * @param cardSetSourceType 변경된 카드 세트 타입
   */
  notifyCardSetSourceChanged(cardSetSourceType: CardSetSourceType): void {
    console.log(`[CardNavigatorService] 카드 세트 변경 알림 수신: ${cardSetSourceType}`);
    
    // 카드 세트 변경 시 필요한 추가 작업 수행
    try {
      // 검색 서비스에 카드 세트 변경 알림
      if (this.searchService) {
        this.searchService.onCardSetSourceChanged(cardSetSourceType);
      }
      
      // 정렬 서비스에 카드 세트 변경 알림
      if (this.sortService) {
        this.sortService.onCardSetSourceChanged(cardSetSourceType);
      }
      
      // 레이아웃 서비스에 카드 세트 변경 알림
      if (this.layoutService) {
        this.layoutService.onCardSetSourceChanged(cardSetSourceType);
      }
    } catch (error) {
      console.error(`[CardNavigatorService] 카드 세트 변경 알림 처리 중 오류 발생:`, error);
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
    return this.plugin.settings;
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
    
    // 플러그인 설정 업데이트
    Object.assign(this.plugin.settings, settings);
    
    // 설정 저장
    await this.plugin.saveSettings();
    
    // 카드 세트 소스 서비스가 초기화되지 않은 경우 처리하지 않음
    if (!this.cardSetSourceService) {
      console.error('[CardNavigatorService] CardSetSourceService가 초기화되지 않았습니다.');
      return;
    }
    
    // 카드 세트 소스 변경
    if (settings.defaultCardSetSource !== undefined) {
      const currentSourceType = this.cardSetSourceService.getCurrentSourceType();
      
      if (currentSourceType !== settings.defaultCardSetSource) {
        await this.changeCardSetSource(settings.defaultCardSetSource);
      }
    }
    
    // 하위 폴더 포함 여부 변경
    if (settings.includeSubfolders !== undefined) {
      this.cardSetSourceService.setIncludeSubfolders(settings.includeSubfolders);
    }
    
    // 태그 대소문자 구분 여부 변경
    if (settings.tagCaseSensitive !== undefined) {
      this.cardSetSourceService.setTagCaseSensitive(settings.tagCaseSensitive);
    }
    
    // 카드 세트 고정 여부 변경
    if (settings.isCardSetFixed !== undefined) {
      // 현재 카드셋 가져오기
      const currentCardSet = this.cardSetSourceService.getCurrentCardSet();
      
      if (currentCardSet) {
        // 현재 카드셋을 새로운 고정 상태로 다시 선택
        await this.cardSetSourceService.selectCardSet(currentCardSet.source, settings.isCardSetFixed);
      }
    }
    
    // 레이아웃 변경
    if (settings.defaultLayout !== undefined) {
      this.layoutService.changeLayoutType(settings.defaultLayout);
    }
    
    // 카드 크기 변경
    if (settings.cardWidth !== undefined || settings.cardHeight !== undefined) {
      this.layoutService.setCardSize(
        settings.cardWidth || this.plugin.settings.cardWidth,
        settings.cardHeight || this.plugin.settings.cardHeight
      );
    }
    
    // 설정 변경 이벤트 발생
    this.plugin.app.workspace.trigger('card-navigator:settings-changed', settings);
    
    // 카드 새로고침
    await this.refreshCards();
  }
  
  /**
   * 모든 설정 초기화
   */
  async reset(): Promise<void> {
    console.log(`[CardNavigatorService] 모든 설정 초기화`);
    
    // searchService가 null인지 확인
    if (!this.searchService) {
      console.error('[CardNavigatorService] SearchService가 초기화되지 않았습니다.');
      return;
    }
    
    // 모든 설정 초기화
    this.sortService.clearSort();
    this.searchService.clearSearch();
    
    // 카드 저장소 초기화
    await this.cardService.refreshCards();
    
    console.log(`[CardNavigatorService] 모든 설정 초기화 완료`);
  }
  
  /**
   * 카드셋 소스 서비스 가져오기
   * @returns 카드셋 소스 서비스
   */
  getCardSetSourceService(): ICardSetSourceService {
    if (!this.cardSetSourceService) {
      throw new Error('CardSetSourceService가 초기화되지 않았습니다.');
    }
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
    if (!this.searchService) {
      throw new Error('SearchService가 초기화되지 않았습니다.');
    }
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
   * 검색 카드 세트로 전환
   * @param query 검색 쿼리
   */
  async enterSearchMode(query: string): Promise<void> {
    console.log(`[CardNavigatorService] 검색 카드 세트 진입: ${query}`);
    
    try {
      // searchService와 cardSetSourceService가 null인지 확인
      if (!this.searchService || !this.cardSetSourceService) {
        console.error('[CardNavigatorService] SearchService 또는 CardSetSourceService가 초기화되지 않았습니다.');
        return;
      }
      
      // 현재 카드셋 소스 정보 가져오기
      const searchState = this.searchService.getSearchCardSetSourceState();
      
      // 검색 타입 및 대소문자 구분 여부 설정
      const caseSensitive = searchState.caseSensitive;
      const searchType = searchState.searchType || 'filename';
      const frontmatterKey = searchState.frontmatterKey;
      
      // 검색 카드 세트로 전환
      this.cardSetSourceService.configureSearchCardSetSource(query, searchType, caseSensitive, frontmatterKey);
      
      // 카드 목록 갱신
      await this.refreshCards();
    } catch (error) {
      console.error(`[CardNavigatorService] 검색 카드 세트 진입 중 오류 발생:`, error);
    }
  }
}