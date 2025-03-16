import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, MarkdownView, TFile, ItemView } from 'obsidian';
import { DomainEventBus } from './core/events/DomainEventBus';
import { EventType } from './domain/events/EventTypes';
// import { DomainEventBus } from './domain/events/DomainEventBus';
import { ICardNavigatorSettings } from './domain/settings/SettingsInterfaces';
import { CardSetSourceMode } from './domain/settings/SettingsInterfaces';
import { ObsidianService } from './infrastructure/obsidian/adapters/ObsidianService';
import { SettingsService } from './application/settings/SettingsService';
import { CardService } from './application/card/CardService';
import { CardRenderingService } from './application/card/CardRenderingService';
import { CardSetService } from './application/cardset/CardSetService';
import { InteractionService } from './application/interaction/InteractionService';
import { LayoutService } from './application/layout/LayoutService';
import { NavigationService } from './application/navigation/NavigationService';
import { SearchService } from './application/search/SearchService';
import { SearchSuggestionService } from './application/search/SearchSuggestionService';
import { SearchHistoryService } from './application/search/SearchHistoryService';
import { SortingService } from './application/sorting/SortingService';
import { RibbonService } from './infrastructure/obsidian/services/RibbonService';
import { ViewService } from './infrastructure/obsidian/services/ViewService';
import { CardNavigatorView } from './ui/views/cardNavigator/CardNavigatorView';
import { CardSetComponent } from './ui/components/cardset/CardSetComponent';
import { SearchComponent } from './ui/components/search/SearchComponent';
import { ToolbarComponent } from './ui/components/toolbar/ToolbarComponent';
import { NavigationMode } from './domain/navigation';
import { ICardSet } from './domain/cardset/CardSet';
import { SettingTab } from './ui/views/settings/SettingTab';
import { LayoutComponent } from './ui/components/layout/LayoutComponent';
import { NavigationComponent } from './ui/components/navigation/NavigationComponent';
import { DEFAULT_SETTINGS } from './domain/settings/DefaultSettings';
import { CardCreationService } from './application/card/CardCreationService';
import { CardInteractionService } from './application/card/CardInteractionService';
import { CardQueryService } from './application/card/CardQueryService';
import { ToolbarService } from './application/toolbar/ToolbarService';
import { PopupManager } from './ui/components/popup/PopupManager';

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
  searchService!: SearchService;
  searchSuggestionService!: SearchSuggestionService;
  searchHistoryService!: SearchHistoryService;
  sortingService!: SortingService;
  ribbonService!: RibbonService;
  viewService!: ViewService;
  toolbarService!: ToolbarService;
  
  // 리본 아이콘
  ribbonIcon: HTMLElement | null = null;
  
  // 컴포넌트 인스턴스
  cardSetComponent!: CardSetComponent;
  searchComponent!: SearchComponent;
  toolbarComponent!: ToolbarComponent;
  
  // 뷰 타입
  static CARD_NAVIGATOR_VIEW = 'card-navigator';

  view!: CardNavigatorView;
  
  // 추가된 서비스
  cardCreationService!: CardCreationService;
  cardInteractionService!: CardInteractionService;
  cardQueryService!: CardQueryService | null;

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
    
    // 남아있는 팝업 컨테이너 제거
    const popupContainers = document.querySelectorAll('.card-navigator-popup-container');
    popupContainers.forEach(container => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });
    
    // 이벤트 버스 초기화
    this.eventBus = DomainEventBus.getInstance();
    
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
    this.addSettingTab(new SettingTab(this.app, this, this.settingsService, this.eventBus));
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
    
    // 플러그인 로드 시 자동으로 뷰 활성화
    setTimeout(async () => {
      await this.activateView();
    }, 500);
    
    console.log('카드 네비게이터 플러그인 로드 완료');
  }

  /**
   * 플러그인 언로드 시 호출
   */
  onunload(): void {
    console.log('Card Navigator 플러그인 언로드');
    
    // 이벤트 버스 정리
    if (this.eventBus) {
      this.eventBus.removeAllListeners();
    }
    
    // 서비스 정리 (순서 중요)
    if (this.toolbarService) {
      this.toolbarService.cleanup();
    }
    
    if (this.searchService) {
      this.searchService.cleanup();
    }
    
    if (this.cardSetService) {
      this.cardSetService.cleanup();
    }
    
    if (this.layoutService) {
      this.layoutService.cleanup();
    }
    
    if (this.navigationService) {
      this.navigationService.cleanup();
    }
    
    if (this.interactionService) {
      this.interactionService.cleanup();
    }
    
    // 컴포넌트 정리
    if (this.toolbarComponent) {
      this.toolbarComponent.cleanup();
    }
    
    if (this.cardSetComponent) {
      this.cardSetComponent.remove();
    }
    
    if (this.searchComponent) {
      if (typeof this.searchComponent.remove === 'function') {
        this.searchComponent.remove();
      }
    }
    
    // 뷰 비활성화
    if (this.viewService) {
      this.viewService.deactivateView();
    }
    
    // 리본 아이콘 제거
    if (this.ribbonService) {
      this.ribbonService.removeRibbonIcon();
    } else if (this.ribbonIcon) {
      // 리본 서비스가 없는 경우 직접 리본 아이콘 제거
      this.ribbonIcon.remove();
      this.ribbonIcon = null;
    }
    
    // 전역 이벤트 리스너 제거
    window.removeEventListener('resize', this.handleWindowResize);
    
    // 남아있는 팝업 컨테이너 제거
    const popupContainers = document.querySelectorAll('.card-navigator-popup-container');
    popupContainers.forEach(container => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });
    
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

  /**
   * 뷰 새로고침
   * 카드 네비게이터 뷰를 새로고침합니다.
   */
  refreshViews() {
    if (this.view) {
      this.view.refresh();
    }
  }

  /**
   * 서비스 초기화
   * 플러그인에서 사용하는 서비스를 초기화합니다.
   */
  private initializeServices(): void {
    // 옵시디언 서비스 초기화
    this.obsidianService = new ObsidianService(this.app, this);
    
    // 이벤트 버스 초기화
    this.eventBus = DomainEventBus.getInstance();
    
    // 설정 서비스 초기화
    this.settingsService = new SettingsService(this, this.eventBus);
    
    // 레이아웃 서비스 초기화
    this.layoutService = new LayoutService(this.settingsService, this.eventBus);
    
    // 카드 렌더링 서비스 초기화
    this.cardRenderingService = new CardRenderingService(this.obsidianService, this.settingsService);
    
    // 카드 생성 서비스 초기화
    this.cardCreationService = new CardCreationService(this.obsidianService, this.settingsService, this.eventBus);
    
    // 카드 상호작용 서비스 초기화
    this.cardInteractionService = new CardInteractionService(this.obsidianService, this.settingsService, this.eventBus);
    
    // 네비게이션 서비스 초기화
    this.navigationService = new NavigationService(this.settingsService, this.layoutService, this.eventBus);
    
    // 상호작용 서비스 초기화
    this.interactionService = new InteractionService(this.settingsService, this.navigationService, this.eventBus);
    
    // 카드 쿼리 서비스 초기화 (카드 서비스가 필요하므로 나중에 초기화)
    this.cardQueryService = null;
    
    // 카드 서비스 초기화
    this.cardService = new CardService(
      this.obsidianService,
      this.settingsService,
      this.eventBus,
      this.cardCreationService,
      this.cardRenderingService,
      this.cardInteractionService,
      {} as any, // cardQueryService는 나중에 설정
      this.layoutService
    );
    
    // 카드 쿼리 서비스 초기화 (이제 카드 서비스가 있으므로 초기화 가능)
    this.cardQueryService = new CardQueryService(this.cardService, this.obsidianService, this.settingsService, this.eventBus);
    
    // 카드 서비스에 카드 쿼리 서비스 설정
    (this.cardService as any).cardQueryService = this.cardQueryService;
    
    // 카드셋 서비스 초기화
    this.cardSetService = new CardSetService(this.obsidianService, this.settingsService, this.eventBus);
    
    // 검색 히스토리 서비스 초기화
    this.searchHistoryService = new SearchHistoryService(this.settingsService);
    
    // 검색 제안 서비스 초기화
    this.searchSuggestionService = new SearchSuggestionService(this.obsidianService);
    
    // 검색 서비스 초기화
    this.searchService = new SearchService(
      this.cardSetService,
      this.settingsService,
      this.eventBus,
      this.searchHistoryService,
      this.searchSuggestionService,
      this.obsidianService
    );
    
    // 정렬 서비스 초기화
    this.sortingService = new SortingService(this.settingsService, this.eventBus);
    
    // 툴바 서비스 초기화
    this.toolbarService = new ToolbarService(this.settingsService, this.eventBus, this.obsidianService);
    
    // 리본 서비스 초기화
    this.ribbonService = new RibbonService(this.obsidianService);
    
    // 뷰 서비스 초기화
    this.viewService = new ViewService(
      this.obsidianService,
      CardNavigatorPlugin.CARD_NAVIGATOR_VIEW // 뷰 타입 전달
    );
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
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
    
    // 검색 컴포넌트 생성
    this.searchComponent = new SearchComponent(
      this.searchService,
      this.searchSuggestionService,
      this.searchHistoryService
    );
    
    // 이벤트 버스 설정
    (this.searchComponent as any).eventBus = this.eventBus;
    
    // 툴바 컴포넌트 생성
    this.toolbarComponent = new ToolbarComponent(
      this.toolbarService, 
      this.searchComponent, 
      this.obsidianService,
      this.cardSetService
    );
    this.toolbarComponent.render(containerEl);
    
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
    
    // 마지막으로 처리한 파일 경로를 저장하는 변수
    let lastProcessedFilePath: string | null = null;
    let lastProcessedTime: number = 0;
    
    // 카드셋 변경 이벤트 리스너
    this.registerEvent(
      this.app.workspace.on('file-open', async (file) => {
        // 활성 파일 변경 처리
        if (this.cardSetService && file) {
          // 동일한 파일에 대한 중복 이벤트 처리 방지 (1초 이내)
          const now = Date.now();
          if (
            file.path === lastProcessedFilePath && 
            now - lastProcessedTime < 1000
          ) {
            console.log('동일한 파일 오픈 이벤트가 최근에 처리됨, 중복 처리 방지:', file.path);
            return;
          }
          
          // 처리 정보 업데이트
          lastProcessedFilePath = file.path;
          lastProcessedTime = now;
          
          console.log('file-open 이벤트 발생:', file?.path);
          
          // 활성 파일 변경 처리
          await this.cardSetService.handleActiveFileChanged(file);
          
          // 활성 파일 변경 이벤트 발생
          this.eventBus.emit(EventType.ACTIVE_FILE_CHANGED, { file });
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
    
    // 툴바 액션 이벤트 리스너
    this.eventBus.on('toolbar:action-executed', (data) => {
      this.handleToolbarAction(data.action, data.data);
    });
  }
  
  /**
   * 툴바 액션 처리
   * @param action 액션 이름
   * @param data 액션 데이터
   */
  private handleToolbarAction(action: string, data?: any): void {
    this.log(`툴바 액션 실행: ${action}`, data);
    
    switch (action) {
      case 'showCardSetSelector':
        // 카드셋 선택 팝업 표시
        const cardSetPopup = {
          id: 'cardset-selector',
          title: '카드셋 선택',
          type: 'cardset-popup',
          content: ''
        };
        this.toolbarService.showPopup(cardSetPopup);
        break;
        
      case 'search':
        // 검색 실행
        if (data && data.query) {
          this.eventBus.emit(EventType.SEARCH_QUERY_CHANGED, { query: data.query });
        }
        break;
        
      case 'showSearchFilter':
        // 검색 필터 팝업 표시
        const searchFilterPopup = {
          id: 'search-filter',
          title: '검색 필터',
          type: 'search-filter-popup',
          content: ''
        };
        this.toolbarService.showPopup(searchFilterPopup);
        break;
        
      case 'showSortOptions':
        // 정렬 옵션 팝업 표시
        const sortPopup = {
          id: 'sort-button',
          title: '정렬 옵션',
          type: 'sort-popup',
          content: ''
        };
        this.toolbarService.showPopup(sortPopup);
        break;
        
      case 'showLayoutOptions':
        // 레이아웃 옵션 팝업 표시
        const layoutPopup = {
          id: 'layout-button',
          title: '레이아웃 옵션',
          type: 'layout-popup',
          content: ''
        };
        this.toolbarService.showPopup(layoutPopup);
        break;
        
      case 'showSettings':
        // 설정 팝업 표시
        const settingsPopup = {
          id: 'settings-button',
          title: '설정',
          type: 'settings-popup',
          content: ''
        };
        this.toolbarService.showPopup(settingsPopup);
        break;
        
      case 'cardset-selector':
        // 카드셋 변경
        if (data && data.type) {
          // 카드셋 타입에 따라 설정 업데이트
          const settings: any = {};
          
          if (data.type === 'current') {
            settings.includeSubfolders = false;
            settings.specificFolder = '';
          } else if (data.type === 'include-subfolders') {
            settings.includeSubfolders = true;
            settings.specificFolder = '';
          } else if (data.type === 'specific-folder') {
            settings.specificFolder = data.folder || '';
          }
          
          this.settingsService.updateSettings(settings);
          this.eventBus.emit(EventType.CARDSET_CHANGED, { type: data.type });
        }
        break;
        
      case 'search-filter':
        // 검색 필터 변경
        if (data) {
          const settings: any = {};
          if (data.searchType) settings.defaultSearchType = data.searchType;
          if (data.caseSensitive !== undefined) settings.searchCaseSensitive = data.caseSensitive;
          if (data.frontmatterKey) settings.frontmatterKey = data.frontmatterKey;
          
          this.settingsService.updateSettings(settings);
          this.eventBus.emit(EventType.SEARCH_TYPE_CHANGED, data);
        }
        break;
        
      case 'sort-button':
        // 정렬 옵션 변경
        if (data) {
          const settings: any = {};
          if (data.field) {
            settings.sortBy = data.field;
            if (data.field === 'frontmatter' && data.frontmatterKey) {
              settings.frontmatterKey = data.frontmatterKey;
            }
          }
          if (data.direction) settings.sortDirection = data.direction;
          
          this.settingsService.updateSettings(settings);
          this.eventBus.emit(EventType.SOURCE_CHANGED, data);
        }
        break;
        
      case 'layout-button':
        // 레이아웃 옵션 변경
        if (data) {
          const settings: any = {};
          if (data.type) settings.viewType = data.type;
          
          // 레이아웃별 추가 설정
          if (data.type === 'grid') {
            if (data.columns) settings.gridColumns = parseInt(data.columns);
            if (data.cardSize) settings.cardWidth = this.getCardWidthFromSize(data.cardSize);
          } else if (data.type === 'list') {
            if (data.showPreview !== undefined) settings.showPreview = data.showPreview;
          } else if (data.type === 'table') {
            if (data.columns) settings.visibleColumns = data.columns;
          }
          
          this.settingsService.updateSettings(settings);
          this.eventBus.emit(EventType.VIEW_TYPE_CHANGED, data);
        }
        break;
        
      case 'settings-button':
        // 설정 변경
        if (data) {
          if (data.action === 'save') {
            // 설정 저장
            this.settingsService.saveSettings();
          } else if (data.key && data.value !== undefined) {
            // 개별 설정 변경
            const settings: any = {};
            settings[data.key] = data.value;
            this.settingsService.updateSettings(settings);
          }
        }
        break;
        
      default:
        this.log(`알 수 없는 툴바 액션: ${action}`);
    }
  }
  
  /**
   * 카드 크기 문자열에서 실제 너비 값 반환
   * @param size 카드 크기 (small, medium, large)
   * @returns 카드 너비 픽셀 값
   */
  private getCardWidthFromSize(size: string): number {
    switch (size) {
      case 'small': return 150;
      case 'medium': return 250;
      case 'large': return 350;
      default: return 250;
    }
  }
} 