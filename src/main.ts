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
import { IPresetService } from './domain/services/IPresetService';
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
      
      // 프리셋 서비스 초기화
      const presetService = this.container.resolve<PresetService>('IPresetService');
      presetService.initialize();
      console.log('프리셋 서비스 초기화 완료');
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
    
    // 설정 저장 시 프리셋 서비스에 알림
    try {
      const presetService = this.container.resolve<IPresetService>('IPresetService');
      if (presetService) {
        presetService.loadDefaultPreset();
        console.log('설정 저장 후 기본 프리셋 다시 로드됨');
      }
    } catch (error) {
      console.error('설정 저장 후 기본 프리셋 로드 실패:', error);
    }
  }

  private initializeContainer(): void {
    const container = this.container;
    
    // 플러그인 자신을 컨테이너에 등록
    container.register('Plugin', () => this, true);
    
    // App 등록
    container.register('App', () => this.app, true);

    // 인프라스트럭처 서비스 등록
    container.register('ILoggingService', () => LoggingService.getInstance(), true);
    container.register('IErrorHandler', () => ErrorHandler.getInstance(), true);
    container.register('IPerformanceMonitor', () => PerformanceMonitor.getInstance(), true);
    container.register('IAnalyticsService', () => AnalyticsService.getInstance(), true);
    container.register('IEventDispatcher', () => EventDispatcher.getInstance(), true);

    // 중요 서비스 우선 등록 - 의존성 순서 고려
    container.register('IActiveFileWatcher', () => {
      console.debug('ActiveFileWatcher 서비스 팩토리 호출됨');
      const instance = ActiveFileWatcher.getInstance();
      console.debug('ActiveFileWatcher 인스턴스 생성 완료');
      return instance;
    }, true);

    // 애플리케이션 서비스 등록
    container.register('ICardService', () => CardService.getInstance(), true);
    container.register('ICardSetService', () => CardSetService.getInstance(), true);
    container.register('ICardDisplayManager', () => CardDisplayManager.getInstance(), true);
    container.register('ICardInteractionService', () => CardInteractionService.getInstance(), true);
    container.register('ICardFactory', () => CardFactory.getInstance(), true);
    container.register('ILayoutService', () => LayoutService.getInstance(), true);
    container.register('ISearchService', () => SearchService.getInstance(), true);
    container.register('ISortService', () => SortService.getInstance(), true);
    container.register('IFocusManager', () => FocusManager.getInstance(), true);
    container.register('IClipboardService', () => ClipboardService.getInstance(), true);
    container.register('IFileService', () => FileService.getInstance(), true);
    container.register('IRenderManager', () => RenderManager.getInstance(), true);
    container.register('IPresetManager', () => PresetManager.getInstance(), true);
    container.register('IPresetService', () => PresetService.getInstance(), true);
    container.register('IToolbarService', () => ToolbarService.getInstance(), true);

    // 뷰모델 등록
    container.register('ICardNavigatorViewModel', () => CardNavigatorViewModel.getInstance(), true);

    // 기본값 등록
    container.register('DefaultValues', () => DefaultValues, true);
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