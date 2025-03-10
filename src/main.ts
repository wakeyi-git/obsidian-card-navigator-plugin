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
import { CardNavigatorSettingTab } from './ui/CardNavigatorSettingTab';

// 기본 설정값
const DEFAULT_SETTINGS: Partial<ICardNavigatorSettings> = {
  defaultCardSetSource: 'folder',
  defaultLayout: 'grid',
  includeSubfolders: true,
  defaultFolderCardSet: '',
  defaultTagCardSet: '',
  isCardSetFixed: false,
  defaultSearchScope: 'current',
  tagCaseSensitive: false,
  useLastCardSetSourceOnLoad: true,
  cardWidth: 250,
  cardHeight: 150,
  cardHeaderContent: ['filename'],
  cardBodyContent: ['content'],
  cardFooterContent: ['tags'],
  renderingCardSetSource: 'plain',
  titleSource: 'filename',
  includeFrontmatterInContent: false,
  includeFirstHeaderInContent: true,
  limitContentLength: true,
  contentMaxLength: 200,
  fixedCardHeight: true,
  cardMinWidth: 200,
  cardMinHeight: 100,
  cardGap: 10,
  defaultSortType: 'filename',
  defaultSortDirection: 'asc',
  highlightSearchResults: true,
  maxSearchResults: 100,
  maxSearchHistory: 10,
  navigationMode: 'grid' as NavigationMode,
  selectionMode: 'single',
  dragMode: 'copy',
  priorityTags: [],
  priorityFolders: []
};

export class CardNavigatorPlugin extends Plugin {
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

  async onload() {
    console.log('카드 네비게이터 플러그인 로드 중...');
    
    // 이벤트 버스 초기화
    this.eventBus = new DomainEventBus();
    
    // 설정 로드
    await this.loadSettings();
    
    // 서비스 초기화
    this.initializeServices();
    
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
    this.addSettingTab(new CardNavigatorSettingTab(this.app, this));
    
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
    
    // 뷰 비활성화
    this.viewService.deactivateView();
    
    // 리본 아이콘 제거
    this.ribbonService.removeRibbonIcon();
    
    console.log('카드 네비게이터 플러그인 언로드 완료');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
    
    // 카드셋 컴포넌트 생성
    const cardSet = await this.cardSetService.getCurrentCardSet();
    this.cardSetComponent = new CardSetComponent(
      cardSet,
      this.cardSetService,
      this.layoutService,
      this.sortingService,
      this.cardService,
      this.cardRenderingService,
      this.interactionService
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

// Obsidian 플러그인 시스템에서 사용할 기본 내보내기
export default CardNavigatorPlugin; 