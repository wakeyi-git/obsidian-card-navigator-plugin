import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { DomainEventBus } from './domain/events/DomainEventBus';
import { EventType } from './domain/events/EventTypes';
import { ICardNavigatorSettings } from './domain/settings/SettingsInterfaces';
import { ObsidianService } from './services/core/ObsidianService';
import { SettingsService } from './services/core/SettingsService';
import { CardService } from './services/card/CardService';
import { CardRenderingService } from './services/card/CardRenderingService';
import { CardSetService } from './services/cardset/CardSetService';
import { InteractionService } from './services/interaction/InteractionService';
import { LayoutService } from './services/layout/LayoutService';
import { NavigationService } from './services/navigation/NavigationService';
import { PresetService } from './services/preset/PresetService';
import { SearchService } from './services/search/SearchService';
import { SearchSuggestionService } from './services/search/SearchSuggestionService';
import { SearchHistoryService } from './services/search/SearchHistoryService';
import { SortingService } from './services/sorting/SortingService';
import { ToolbarService } from './services/toolbar/ToolbarService';
import { RibbonService } from './services/plugin/RibbonService';
import { ViewService, CardNavigatorView } from './services/plugin/ViewService';
import { CardSetComponent } from './components/cardset/CardSetComponent';
import { SearchComponent } from './components/search/SearchComponent';
import { ToolbarComponent } from './components/toolbar/ToolbarComponent';
import { NavigationMode } from './domain/navigation';
import { ICardSet } from './domain/cardset/CardSet';
import { SettingTab } from './settings/section/SettingTab';
import { LayoutComponent } from './components/layout/LayoutComponent';
import { NavigationComponent } from './components/navigation/NavigationComponent';
import { DEFAULT_SETTINGS } from './domain/settings/DefaultSettings';

/**
 * 카드 네비게이터 플러그인
 * 카드 형태로 노트를 탐색할 수 있는 플러그인입니다.
 */
export default class CardNavigatorPlugin extends Plugin {
  settings!: ICardNavigatorSettings;
  eventBus!: DomainEventBus;
  
  // 서비스 인스턴스
  obsidianService!: ObsidianService;
  settingsService!: SettingsService;
  cardService!: CardService;
  cardRenderingService!: CardRenderingService;
  cardSetService!: CardSetService;
  interactionService!: InteractionService;
  layoutService!: LayoutService;
  navigationService!: NavigationService;
  presetService!: PresetService;
  searchService!: SearchService;
  searchSuggestionService!: SearchSuggestionService;
  searchHistoryService!: SearchHistoryService;
  sortingService!: SortingService;
  toolbarService!: ToolbarService;
  ribbonService!: RibbonService;
  viewService!: ViewService;
  
  // 리본 아이콘
  ribbonIcon: HTMLElement | null = null;
  
  // 컴포넌트 인스턴스
  cardSetComponent!: CardSetComponent;
  searchComponent!: SearchComponent;
  toolbarComponent!: ToolbarComponent;
  
  // 뷰 타입
  static CARD_NAVIGATOR_VIEW = 'card-navigator';

  view!: CardNavigatorView;
  
  /**
   * 로그 출력 함수
   * 디버그 모드에서만 로그를 출력합니다.
   * @param message 로그 메시지
   * @param args 추가 인자
   */
  log(message: string, ...args: any[]): void {
    if (this.settings?.debugMode) {
      console.log(`plugin:card-navigator: ${message}`, ...args);
    }
  }
  
  /**
   * 에러 로그 출력 함수
   * 항상 에러 로그를 출력합니다.
   * @param message 에러 메시지
   * @param args 추가 인자
   */
  logError(message: string, ...args: any[]): void {
    console.error(`plugin:card-navigator: ${message}`, ...args);
  }
  
  /**
   * 플러그인 로드
   */
  async onload() {
    // 로그 출력
    this.log('카드 네비게이터 플러그인 로드 중...');
    
    // 이벤트 버스 초기화
    this.eventBus = new DomainEventBus();
    
    // 설정 로드
    await this.loadSettings();
    
    // 서비스 초기화
    this.initializeServices();
    
    // 서비스 초기화 후 설정 다시 로드하여 모든 서비스에 설정 적용
    await this.loadSettings();
    
    // 뷰 등록
    this.registerView(
      CardNavigatorPlugin.CARD_NAVIGATOR_VIEW,
      (leaf) => new CardNavigatorView(leaf)
    );
    
    this.ribbonIcon = this.addRibbonIcon('layers-3', '카드 네비게이터', async () => {
      await this.activateView();
    });
    
    // 명령어 추가
    this.addCommands();
    
    // 설정 탭 추가
    this.addSettingTab(new SettingTab(this.app, this, this.settingsService, this.eventBus));
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
    
    // 플러그인 로드 시 자동으로 뷰 활성화
    setTimeout(async () => {
      await this.activateView();
    }, 500);
    
    console.log('카드 네비게이터 플러그인 로드 완료');
  }

  onunload() {
    console.log('카드 네비게이터 플러그인 언로드 중...');
    
    // 이벤트 리스너 제거
    this.eventBus.removeAllListeners();
    
    // 컴포넌트 정리
    if (this.cardSetComponent) {
      this.cardSetComponent.remove();
    }
    
    if (this.searchComponent) {
      this.searchComponent.remove();
    }
    
    if (this.toolbarComponent) {
      this.toolbarComponent.remove();
    }
    
    // 뷰 비활성화
    this.viewService.deactivateView();
    
    // 리본 아이콘 제거
    this.ribbonService.removeRibbonIcon();
    
    // 서비스 정리
    this.layoutService.cleanup();
    this.navigationService.cleanup();
    this.interactionService.cleanup();
    this.searchService.cleanup();
    this.cardSetService.cleanup();
    
    // 전역 이벤트 리스너 제거
    window.removeEventListener('resize', this.handleWindowResize);
    
    console.log('카드 네비게이터 플러그인 언로드 완료');
  }

  // 윈도우 리사이즈 이벤트 핸들러
  private handleWindowResize = () => {
    // 플러그인이 언로드된 후에는 무시
    if (!this.app) return;
    
    // 필요한 경우 리사이즈 처리
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) as ICardNavigatorSettings;
    
    // 설정 서비스가 초기화된 경우 설정 서비스에도 설정 적용
    if (this.settingsService) {
      await this.settingsService.loadSettings();
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  initializeServices() {
    // 코어 서비스 초기화
    this.obsidianService = new ObsidianService(this.app, this);
    this.settingsService = new SettingsService(this, this.eventBus);
    
    // 플러그인 서비스 초기화
    this.ribbonService = new RibbonService(this.obsidianService);
    this.viewService = new ViewService(this.obsidianService, CardNavigatorPlugin.CARD_NAVIGATOR_VIEW);
    
    // 레이아웃 서비스 초기화
    this.layoutService = new LayoutService(this.settingsService, this.eventBus);
    
    // 카드 관련 서비스 초기화
    this.cardService = new CardService(this.obsidianService, this.settingsService, this.eventBus);
    this.cardRenderingService = new CardRenderingService(this.obsidianService, this.settingsService);
    
    // 카드셋 서비스 초기화
    this.cardSetService = new CardSetService(this.obsidianService, this.settingsService, this.eventBus);
    
    // 정렬 서비스 초기화
    this.sortingService = new SortingService(this.settingsService, this.eventBus);
    
    // 내비게이션 서비스 초기화
    this.navigationService = new NavigationService(
      this.settingsService,
      this.layoutService,
      this.eventBus
    );
    
    // 상호작용 서비스 초기화
    this.interactionService = new InteractionService(
      this.settingsService,
      this.navigationService,
      this.eventBus
    );
    
    // 검색 관련 서비스 초기화
    this.searchSuggestionService = new SearchSuggestionService(this.obsidianService);
    this.searchHistoryService = new SearchHistoryService(this.settingsService);
    
    // 검색 서비스 초기화
    this.searchService = new SearchService(
      this.cardSetService,
      this.settingsService,
      this.eventBus,
      this.searchHistoryService,
      this.searchSuggestionService,
      this.obsidianService
    );
    
    // 프리셋 서비스 초기화
    this.presetService = new PresetService(
      this.settingsService,
      this.cardSetService,
      this.layoutService,
      this.sortingService,
      this.searchService,
      this.eventBus
    );
    
    // 툴바 서비스 초기화
    this.toolbarService = new ToolbarService(this.settingsService, this.eventBus);
  }

  addCommands() {
    // 카드 네비게이터 뷰 열기 명령어
    this.addCommand({
      id: 'open-card-navigator',
      name: '카드 네비게이터 열기',
      callback: async () => {
        await this.activateView();
      }
    });
    
    // 검색 포커스 명령어
    this.addCommand({
      id: 'focus-search',
      name: '검색 필드에 포커스',
      callback: () => {
        this.eventBus.emit(EventType.SEARCH_QUERY_CHANGED, { query: '' });
      }
    });
    
    // 카드 선택 모드 전환 명령어
    this.addCommand({
      id: 'toggle-selection-mode',
      name: '선택 모드 전환',
      callback: () => {
        const currentMode = this.settings.selectionMode;
        const newMode = currentMode === 'single' ? 'multiple' : 'single';
        this.settingsService.updateSettings({ selectionMode: newMode });
      }
    });
  }

  async activateView() {
    const leaf = await this.viewService.activateView();
    if (leaf) {
      // 뷰가 활성화되면 컴포넌트 초기화
      this.initializeComponents(leaf);
    }
  }

  async initializeComponents(leaf: WorkspaceLeaf) {
    const containerEl = (leaf.view as CardNavigatorView).containerEl.children[1].querySelector('.card-navigator-container') as HTMLElement;
    if (!containerEl) return;
    
    // 컨테이너 초기화
    containerEl.empty();
    
    // 툴바 컴포넌트 생성
    this.toolbarComponent = new ToolbarComponent(this.toolbarService);
    this.toolbarComponent.render(containerEl);
    
    // 검색 컴포넌트 생성
    this.searchComponent = new SearchComponent(
      this.searchService,
      this.searchSuggestionService,
      this.searchHistoryService
    );
    this.searchComponent.render(containerEl);
    
    // 레이아웃 컴포넌트 생성
    // const layoutComponent = new LayoutComponent(this.layoutService, this.eventBus);
    // layoutComponent.render(containerEl);
    
    // 내비게이션 컴포넌트 생성
    // const navigationComponent = new NavigationComponent(this.navigationService, this.eventBus);
    // navigationComponent.render(containerEl);
    
    // 카드셋 컴포넌트 생성
    const cardSet = await this.cardSetService.getCurrentCardSet();
    this.cardSetComponent = new CardSetComponent(
      cardSet,
      this.cardSetService,
      this.layoutService,
      this.sortingService,
      this.cardService,
      this.cardRenderingService,
      this.interactionService,
      this.obsidianService
    );
    this.cardSetComponent.render(containerEl);
  }

  registerEventListeners() {
    // 설정 변경 이벤트 리스너
    this.registerEvent(
      this.app.workspace.on('layout-change', async () => {
        await this.saveSettings();
      })
    );
    
    // 카드셋 변경 이벤트 리스너
    this.registerEvent(
      this.app.workspace.on('file-open', async () => {
        if (this.cardSetComponent) {
          const cardSet = await this.cardSetService.getCurrentCardSet();
          this.cardSetComponent.setCardSet(cardSet);
        }
      })
    );
    
    // 파일 변경 이벤트 리스너
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        this.eventBus.emit(EventType.FILE_MODIFIED, { file });
      })
    );
    
    this.registerEvent(
      this.app.vault.on('create', (file) => {
        this.eventBus.emit(EventType.FILE_CREATED, { file });
      })
    );
    
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        this.eventBus.emit(EventType.FILE_DELETED, { file });
      })
    );
    
    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        this.eventBus.emit(EventType.FILE_RENAMED, { file, oldPath });
      })
    );
    
    // 활성 리프 변경 이벤트 리스너
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (leaf) {
          this.eventBus.emit(EventType.ACTIVE_LEAF_CHANGED, { leaf });
        }
      })
    );
  }
} 