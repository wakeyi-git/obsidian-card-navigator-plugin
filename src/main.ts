import { Plugin, App, PluginManifest } from 'obsidian';
import { CardNavigatorView, VIEW_TYPE_CARD_NAVIGATOR } from './ui/views/CardNavigatorView';
import { Container } from './infrastructure/di/Container';
import { ErrorHandler } from './infrastructure/ErrorHandler';
import { PerformanceMonitor } from './infrastructure/PerformanceMonitor';
import { AnalyticsService } from './infrastructure/AnalyticsService';
import { EventDispatcher } from '@/infrastructure/events/EventDispatcher';
import { CardService } from './application/services/CardService';
import { CardSetService } from './application/services/CardSetService';
import { CardDisplayManager } from './application/manager/CardDisplayManager';
import { CardInteractionService } from './application/services/CardInteractionService';
import { CardNavigatorViewModel } from './ui/viewModels/CardNavigatorViewModel';
import { CardFactory } from './application/factories/CardFactory';
import { LayoutService } from './application/services/LayoutService';
import { SearchService } from './application/services/SearchService';
import { SortService } from './application/services/SortService';
import { FocusManager } from './application/manager/FocusManager';
import { ActiveFileWatcher } from './application/services/ActiveFileWatcher';
import { ClipboardService } from './application/services/ClipboardService';
import { FileService } from './application/services/FileService';
import { CardRenderManager } from './application/manager/CardRenderManager';
import { PresetManager } from './application/manager/PresetManager';
import { PresetService } from './application/services/PresetService';
import { ToolbarService } from './application/services/ToolbarService';
import { ICardService } from './domain/services/ICardService';
import { IPluginSettings, DefaultValues } from './domain/models/DefaultValues';
import { CardNavigatorSettingTab } from '@/ui/settings/CardNavigatorSettingTab';
import { SettingsService } from './application/services/SettingsService';
import type { ISettingsService } from '@/domain/services/ISettingsService';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { ICardSetService } from '@/domain/services/ICardSetService';
import { ICardInteractionService } from '@/domain/services/ICardInteractionService';
import { ISearchService } from '@/domain/services/ISearchService';
import { ISortService } from '@/domain/services/ISortService';
import { ICardRenderer } from '@/domain/renderders/ICardRenderer';
import { LoggingService } from '@/infrastructure/LoggingService';
import { ScrollService } from './application/services/ScrollService';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { CardSelectionService } from './application/services/CardSelectionService';
import { CardManager } from './application/services/CardManager';

export default class CardNavigatorPlugin extends Plugin {
  settings: IPluginSettings;
  private container: Container;
  private logger: ILoggingService;
  private servicesInitialized: boolean = false;
  private cardService: ICardService;
  private cardSetService: ICardSetService;
  private cardInteractionService: ICardInteractionService;
  private settingsService: ISettingsService;
  private searchService: ISearchService;
  private sortService: ISortService;
  private cardRenderer: ICardRenderer;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    // 컨테이너 초기화
    this.container = Container.getInstance();
    
    // App 서비스 등록
    this.container.register('App', () => app);
    
    // 로거 초기화
    this.logger = LoggingService.getInstance();
  }

  async onload() {
    try {
      // 설정 로드
      await this.loadSettings();

      // 서비스 컨테이너 초기화
      this.initializeContainer();

      // 뷰 등록
      this.registerView(
        VIEW_TYPE_CARD_NAVIGATOR,
        (leaf) => CardNavigatorView.getInstance(leaf)
      );

      // 리본 메뉴 추가
      this.addRibbonIcon('layers', '카드 내비게이터', () => {
        this.activateView();
      });

      // 설정 탭 추가
      this.addSettingTab(new CardNavigatorSettingTab(this.app, this));

      this.logger.info('플러그인 로드 완료');
    } catch (error) {
      this.logger.error('플러그인 로드 실패', { error });
    }
  }

  onunload() {
    try {
      // DI 컨테이너 정리
      if (this.container) {
        this.container.clear();
      }
      
      this.app.workspace.detachLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
    } catch (error) {
      console.error('플러그인 언로드 실패:', error);
    }
  }

  async loadSettings() {
    const savedSettings = await this.loadData();
    
    // 저장된 설정이 있으면 사용, 없으면 기본값 사용
    this.settings = savedSettings ? { ...DefaultValues.plugin, ...savedSettings } : { ...DefaultValues.plugin };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private initializeContainer(): void {
    const container = this.container;
    
    // Plugin 등록
    container.register('Plugin', () => this);

    // 인프라스트럭처 서비스 등록
    container.register('ILoggingService', () => this.logger);
    container.register('IErrorHandler', () => ErrorHandler.getInstance());
    container.register('IPerformanceMonitor', () => PerformanceMonitor.getInstance());
    container.register('IAnalyticsService', () => AnalyticsService.getInstance());
    
    // EventDispatcher 인스턴스 생성 및 초기화
    const eventDispatcher = EventDispatcher.getInstance();
    eventDispatcher.initialize();
    container.register('IEventDispatcher', () => eventDispatcher);

    // 설정 서비스 등록
    container.register('ISettingsService', () => SettingsService.getInstance(this));

    // 카드 관리자 서비스 등록
    container.register('ICardManager', () => CardManager.getInstance());

    // 카드 선택 서비스 등록
    container.register('ICardSelectionService', () => CardSelectionService.getInstance());

    // 중요 서비스 우선 등록 - 의존성 순서 고려
    container.register('IActiveFileWatcher', () => {
      console.debug('ActiveFileWatcher 서비스 팩토리 호출됨');
      const instance = ActiveFileWatcher.getInstance();
      console.debug('ActiveFileWatcher 인스턴스 생성 완료');
      return instance;
    });

    // ScrollService 인스턴스 생성 및 등록
    const scrollService = new ScrollService(
      container.resolve<IErrorHandler>('IErrorHandler'),
      container.resolve<ILoggingService>('ILoggingService'),
      container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
      container.resolve<IAnalyticsService>('IAnalyticsService'),
      container.resolve<IEventDispatcher>('IEventDispatcher')
    );
    container.register('IScrollService', () => scrollService);

    // LayoutService 인스턴스 생성 및 등록
    const layoutService = new LayoutService(
      container.resolve<IErrorHandler>('IErrorHandler'),
      container.resolve<ILoggingService>('ILoggingService'),
      container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
      container.resolve<IAnalyticsService>('IAnalyticsService'),
      container.resolve<IEventDispatcher>('IEventDispatcher'),
      scrollService
    );
    container.register('ILayoutService', () => layoutService);

    // CardRenderManager 인스턴스 생성 및 등록
    const cardRenderManager = CardRenderManager.getInstance();
    container.register('ICardRenderer', () => cardRenderManager);
    container.register('IRenderManager', () => cardRenderManager);

    // 애플리케이션 서비스 등록
    container.register('ICardService', () => CardService.getInstance());
    container.register('ICardSetService', () => CardSetService.getInstance());
    container.register('ICardDisplayManager', () => CardDisplayManager.getInstance());
    container.register('ICardInteractionService', () => CardInteractionService.getInstance());
    container.register('ICardFactory', () => CardFactory.getInstance());
    container.register('ISearchService', () => SearchService.getInstance());
    container.register('ISortService', () => SortService.getInstance());
    container.register('IFocusManager', () => FocusManager.getInstance());
    container.register('IClipboardService', () => ClipboardService.getInstance());
    container.register('IFileService', () => FileService.getInstance());
    container.register('IPresetManager', () => PresetManager.getInstance());
    container.register('IPresetService', () => PresetService.getInstance());
    container.register('IToolbarService', () => ToolbarService.getInstance());

    // 뷰모델 등록
    container.register('ICardNavigatorViewModel', () => CardNavigatorViewModel.getInstance());

    // 기본값 등록
    container.register('DefaultValues', () => DefaultValues);
  }

  private async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getRightLeaf(false);
    if (!leaf) {
      leaf = workspace.getLeaf('split', 'vertical');
    }
    await leaf.setViewState({
      type: VIEW_TYPE_CARD_NAVIGATOR,
      active: true,
    });
  }
} 