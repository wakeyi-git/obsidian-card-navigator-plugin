import { Plugin } from 'obsidian';
import { CardNavigatorView, VIEW_TYPE_CARD_NAVIGATOR } from './ui/views/CardNavigatorView';
import { Container } from './infrastructure/di/Container';
import { LoggingService } from './infrastructure/LoggingService';
import { ErrorHandler } from './infrastructure/ErrorHandler';
import { PerformanceMonitor } from './infrastructure/PerformanceMonitor';
import { AnalyticsService } from './infrastructure/AnalyticsService';
import { EventDispatcher } from '@/domain/events/EventDispatcher';
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
import { RenderManager } from './application/manager/RenderManager';
import { IRenderManager } from './domain/managers/IRenderManager';
import { ICardDisplayManager } from './domain/managers/ICardDisplayManager';
import { PresetManager } from './application/manager/PresetManager';
import { PresetService } from './application/services/PresetService';
import { ToolbarService } from './application/services/ToolbarService';
import { DefaultValues, PluginSettings } from './domain/models/DefaultValues';
import { CardNavigatorSettingTab } from '@/ui/settings/CardNavigatorSettingTab';

export default class CardNavigatorPlugin extends Plugin {
  settings: PluginSettings;
  private container: Container;

  async onload() {
    await this.loadSettings();

    // DI 컨테이너 초기화
    this.container = Container.getInstance();
    this.initializeContainer();

    // 주요 매니저 초기화
    try {
      const renderManager = this.container.resolve<IRenderManager>('IRenderManager');
      renderManager.initialize();
      console.log('렌더링 관리자 초기화 완료');
      
      // 카드 표시 관리자도 초기화
      const cardDisplayManager = this.container.resolve<ICardDisplayManager>('ICardDisplayManager');
      cardDisplayManager.initialize();
      console.log('카드 표시 관리자 초기화 완료');
    } catch (error) {
      console.error('관리자 초기화 실패:', error);
    }

    // 뷰 등록
    this.registerView(
      VIEW_TYPE_CARD_NAVIGATOR,
      (leaf) => new CardNavigatorView(leaf)
    );

    // 리본 아이콘 추가
    this.addRibbonIcon('layers', '카드 내비게이터', () => {
      this.activateView();
    });

    // 설정 탭 추가
    this.addSettingTab(new CardNavigatorSettingTab(this.app, this));
  }

  onunload() {
    this.container.clear();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
  }

  async loadSettings() {
    const savedSettings = await this.loadData();
    this.settings = {
      ...DefaultValues.plugin,
      ...savedSettings
    };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private initializeContainer() {
    // App 인스턴스 등록
    this.container.register('App', () => this.app, true);

    // 인프라스트럭처 서비스 등록
    this.container.register('ILoggingService', () => LoggingService.getInstance(), true);
    this.container.register('IErrorHandler', () => ErrorHandler.getInstance(), true);
    this.container.register('IPerformanceMonitor', () => PerformanceMonitor.getInstance(), true);
    this.container.register('IAnalyticsService', () => AnalyticsService.getInstance(), true);
    this.container.register('IEventDispatcher', () => EventDispatcher.getInstance(), true);

    // 애플리케이션 서비스 등록
    this.container.register('ICardService', () => CardService.getInstance(), true);
    this.container.register('ICardSetService', () => CardSetService.getInstance(), true);
    this.container.register('ICardDisplayManager', () => CardDisplayManager.getInstance(), true);
    this.container.register('ICardInteractionService', () => CardInteractionService.getInstance(), true);
    this.container.register('ICardFactory', () => CardFactory.getInstance(), true);
    this.container.register('ILayoutService', () => LayoutService.getInstance(), true);
    this.container.register('ISearchService', () => SearchService.getInstance(), true);
    this.container.register('ISortService', () => SortService.getInstance(), true);
    this.container.register('IFocusManager', () => FocusManager.getInstance(), true);
    this.container.register('IActiveFileWatcher', () => ActiveFileWatcher.getInstance(), true);
    this.container.register('IClipboardService', () => ClipboardService.getInstance(), true);
    this.container.register('IFileService', () => FileService.getInstance(), true);
    this.container.register('IRenderManager', () => RenderManager.getInstance(), true);
    this.container.register('IPresetManager', () => PresetManager.getInstance(), true);
    this.container.register('IPresetService', () => PresetService.getInstance(), true);
    this.container.register('IToolbarService', () => ToolbarService.getInstance(), true);

    // 뷰모델 등록
    this.container.register('ICardNavigatorViewModel', () => CardNavigatorViewModel.getInstance(), true);

    // 기본값 등록
    this.container.register('DefaultValues', () => DefaultValues, true);
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