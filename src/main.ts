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
import { SettingsService, ServiceContainer, ISettingsService } from './application/services/SettingsService';
import { DEFAULT_LAYOUT_CONFIG } from '@/domain/models/LayoutConfig';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { ILayoutService } from '@/domain/services/ILayoutService';

export default class CardNavigatorPlugin extends Plugin {
  settings: PluginSettings;
  private container: Container;
  private serviceContainer: ServiceContainer;
  private logger: ILoggingService;

  async onload() {
    await this.loadSettings();

    // DI 컨테이너 초기화
    this.container = Container.getInstance();
    this.initializeContainer();
    
    // 로깅 서비스 주입
    this.logger = this.container.resolve<ILoggingService>('ILoggingService');
    
    // 설정 서비스 컨테이너 초기화
    this.serviceContainer = ServiceContainer.getInstance();
    this.initializeServiceContainer();

    // 주요 서비스 초기화는 단일 경로로 통합
    // 뷰모델이나 다른 컴포넌트에서 중복 초기화하지 않도록 명시적 초기화만 수행
    try {
      // 서비스 초기화 순서 의존성 고려 - 핵심 서비스 먼저 초기화
      const layoutService = this.container.resolve<ILayoutService>('ILayoutService');
      layoutService.initialize();
      this.logger.debug('레이아웃 서비스 초기화 완료');
      
      const cardDisplayManager = this.container.resolve<ICardDisplayManager>('ICardDisplayManager');
      cardDisplayManager.initialize();
      this.logger.debug('카드 표시 관리자 초기화 완료');
      
      const presetService = this.container.resolve<IPresetService>('IPresetService');
      presetService.initialize();
      this.logger.debug('프리셋 서비스 초기화 완료');
      
      // 렌더링 관리자는 다른 곳에서 중복 초기화하지 않도록 여기서만 초기화
      const renderManager = this.container.resolve<IRenderManager>('IRenderManager');
      // isInitialized 메서드 호출 대신 직접 초기화 진행
      renderManager.initialize();
      this.logger.debug('렌더링 관리자 초기화 완료');
      
      // 플래그 파일 생성 또는 설정 업데이트를 통해 초기화 완료 표시
      this.markServicesInitialized();
    } catch (error) {
      console.error('핵심 서비스 초기화 실패:', error);
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
    
    // 로그 출력
    this.logger.info('카드 내비게이터 플러그인 로드 완료');
  }

  onunload() {
    // 설정 서비스 컨테이너 정리
    if (this.serviceContainer) {
      this.serviceContainer.dispose();
      ServiceContainer.resetInstance();
    }
    
    // DI 컨테이너 정리
    this.container.clear();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
  }

  async loadSettings() {
    const savedSettings = await this.loadData();
    
    // 기존 설정이 있는 경우 새 구조로 마이그레이션
    if (savedSettings) {
      // 새 구조의 기본 설정
      const defaultSettings = DefaultValues.plugin;
      
      // 마이그레이션된 설정을 저장할 변수
      let migratedSettings: PluginSettings;
      
      // 구조 확인: 이미 새 구조인지 확인
      if (savedSettings.card && savedSettings.cardSet && savedSettings.layout) {
        // 이미 새 구조이므로 기존 구조와 병합
        migratedSettings = {
          ...defaultSettings,
          ...savedSettings
        };
      } else {
        // 이전 구조에서 새 구조로 마이그레이션
        migratedSettings = {
          card: {
            cardGeneral: {
              showHeader: true,
              showBody: true,
              showFooter: true,
              renderMarkdown: savedSettings.renderMarkdown ?? defaultSettings.card.cardGeneral.renderMarkdown,
              showImages: savedSettings.cardRenderConfig?.showImages ?? defaultSettings.card.cardGeneral.showImages,
              highlightCode: savedSettings.cardRenderConfig?.highlightCode ?? defaultSettings.card.cardGeneral.highlightCode,
              supportCallouts: savedSettings.cardRenderConfig?.supportCallouts ?? defaultSettings.card.cardGeneral.supportCallouts,
              supportMath: savedSettings.cardRenderConfig?.supportMath ?? defaultSettings.card.cardGeneral.supportMath,
              contentLengthLimitEnabled: savedSettings.cardRenderConfig?.contentLengthLimitEnabled ?? defaultSettings.card.cardGeneral.contentLengthLimitEnabled,
              contentLengthLimit: savedSettings.cardRenderConfig?.contentLengthLimit ?? defaultSettings.card.cardGeneral.contentLengthLimit,
              titleDisplayType: savedSettings.cardTitleDisplayType ?? defaultSettings.card.cardGeneral.titleDisplayType
            },
            cardContent: {
              header: {
                showTitle: true,
                showFileName: savedSettings.cardRenderConfig?.headerDisplay?.showFileName ?? defaultSettings.card.cardContent.header.showFileName,
                showFirstHeader: savedSettings.cardRenderConfig?.headerDisplay?.showFirstHeader ?? defaultSettings.card.cardContent.header.showFirstHeader,
                showContent: savedSettings.cardRenderConfig?.headerDisplay?.showContent ?? defaultSettings.card.cardContent.header.showContent,
                showTags: savedSettings.cardRenderConfig?.headerDisplay?.showTags ?? defaultSettings.card.cardContent.header.showTags,
                showCreatedDate: savedSettings.cardRenderConfig?.headerDisplay?.showCreatedDate ?? defaultSettings.card.cardContent.header.showCreatedDate,
                showUpdatedDate: savedSettings.cardRenderConfig?.headerDisplay?.showUpdatedDate ?? defaultSettings.card.cardContent.header.showUpdatedDate,
                showProperties: savedSettings.cardRenderConfig?.headerDisplay?.showProperties ?? defaultSettings.card.cardContent.header.showProperties
              },
              body: {
                showTitle: false,
                showFileName: savedSettings.cardRenderConfig?.bodyDisplay?.showFileName ?? defaultSettings.card.cardContent.body.showFileName,
                showFirstHeader: savedSettings.cardRenderConfig?.bodyDisplay?.showFirstHeader ?? defaultSettings.card.cardContent.body.showFirstHeader,
                showContent: savedSettings.cardRenderConfig?.bodyDisplay?.showContent ?? defaultSettings.card.cardContent.body.showContent,
                showTags: savedSettings.cardRenderConfig?.bodyDisplay?.showTags ?? defaultSettings.card.cardContent.body.showTags,
                showCreatedDate: savedSettings.cardRenderConfig?.bodyDisplay?.showCreatedDate ?? defaultSettings.card.cardContent.body.showCreatedDate,
                showUpdatedDate: savedSettings.cardRenderConfig?.bodyDisplay?.showUpdatedDate ?? defaultSettings.card.cardContent.body.showUpdatedDate,
                showProperties: savedSettings.cardRenderConfig?.bodyDisplay?.showProperties ?? defaultSettings.card.cardContent.body.showProperties
              },
              footer: {
                showTitle: false,
                showFileName: savedSettings.cardRenderConfig?.footerDisplay?.showFileName ?? defaultSettings.card.cardContent.footer.showFileName,
                showFirstHeader: savedSettings.cardRenderConfig?.footerDisplay?.showFirstHeader ?? defaultSettings.card.cardContent.footer.showFirstHeader,
                showContent: savedSettings.cardRenderConfig?.footerDisplay?.showContent ?? defaultSettings.card.cardContent.footer.showContent,
                showTags: savedSettings.cardRenderConfig?.footerDisplay?.showTags ?? defaultSettings.card.cardContent.footer.showTags,
                showCreatedDate: savedSettings.cardRenderConfig?.footerDisplay?.showCreatedDate ?? defaultSettings.card.cardContent.footer.showCreatedDate,
                showUpdatedDate: savedSettings.cardRenderConfig?.footerDisplay?.showUpdatedDate ?? defaultSettings.card.cardContent.footer.showUpdatedDate,
                showProperties: savedSettings.cardRenderConfig?.footerDisplay?.showProperties ?? defaultSettings.card.cardContent.footer.showProperties
              }
            },
            cardStyle: savedSettings.cardStyle ?? defaultSettings.card.cardStyle
          },
          cardSet: {
            cardSetGeneral: {
              cardSetType: savedSettings.defaultCardSetType ?? defaultSettings.cardSet.cardSetGeneral.cardSetType
            },
            folderCardSet: {
              folderCardSetMode: savedSettings.folderSetMode ?? 'active',
              fixedFolderPath: savedSettings.fixedFolderPath ?? '',
              includeSubfolders: savedSettings.includeSubfolders ?? defaultSettings.cardSet.folderCardSet.includeSubfolders
            },
            tagCardSet: {
              tagCardSetMode: savedSettings.tagSetMode ?? 'active',
              fixedTag: savedSettings.fixedTag ?? ''
            },
            linkCardSet: {
              includeBacklinks: savedSettings.includeBacklinks ?? defaultSettings.cardSet.linkCardSet.includeBacklinks,
              includeOutgoingLinks: savedSettings.includeOutgoingLinks ?? defaultSettings.cardSet.linkCardSet.includeOutgoingLinks,
              linkLevel: savedSettings.linkLevel ?? defaultSettings.cardSet.linkCardSet.linkLevel
            }
          },
          layout: {
            cardHeightFixed: savedSettings.cardHeightFixed ?? defaultSettings.layout.cardHeightFixed,
            cardMinWidth: savedSettings.cardMinWidth ?? defaultSettings.layout.cardMinWidth,
            cardMinHeight: savedSettings.cardMinHeight ?? defaultSettings.layout.cardMinHeight,
            cardGap: savedSettings.cardGap ?? defaultSettings.layout.cardGap,
            cardPadding: savedSettings.cardPadding ?? defaultSettings.layout.cardPadding,
            validate: () => true,
            preview: () => ({
              cardHeightFixed: savedSettings.cardHeightFixed ?? defaultSettings.layout.cardHeightFixed,
              cardMinWidth: savedSettings.cardMinWidth ?? defaultSettings.layout.cardMinWidth,
              cardMinHeight: savedSettings.cardMinHeight ?? defaultSettings.layout.cardMinHeight,
              cardGap: savedSettings.cardGap ?? defaultSettings.layout.cardGap,
              cardPadding: savedSettings.cardPadding ?? defaultSettings.layout.cardPadding
            })
          },
          search: {
            searchScope: savedSettings.searchScope ?? defaultSettings.search.searchScope,
            searchFilename: savedSettings.searchFilename ?? defaultSettings.search.searchFilename,
            searchContent: savedSettings.searchContent ?? defaultSettings.search.searchContent,
            searchTags: savedSettings.searchTags ?? defaultSettings.search.searchTags,
            caseSensitive: savedSettings.caseSensitive ?? defaultSettings.search.caseSensitive,
            useRegex: savedSettings.useRegex ?? defaultSettings.search.useRegex
          },
          sort: {
            sortField: savedSettings.sortField ?? defaultSettings.sort.sortField,
            sortOrder: savedSettings.sortOrder ?? defaultSettings.sort.sortOrder,
            priorityTags: savedSettings.priorityTags ?? defaultSettings.sort.priorityTags,
            priorityFolders: savedSettings.priorityFolders ?? defaultSettings.sort.priorityFolders,
            validate: () => true,
            preview: () => ({
              sortField: savedSettings.sortField ?? defaultSettings.sort.sortField,
              sortOrder: savedSettings.sortOrder ?? defaultSettings.sort.sortOrder, 
              priorityTags: savedSettings.priorityTags ?? defaultSettings.sort.priorityTags,
              priorityFolders: savedSettings.priorityFolders ?? defaultSettings.sort.priorityFolders
            })
          },
          preset: {
            presetGeneral: {
              autoApplyPreset: {
                applyGlobalPreset: savedSettings.autoApplyPreset ?? true,
                applyFolderPreset: true,
                applyTagPreset: true,
                applyDatePreset: false,
                applyPropertyPreset: false
              },
              globalPreset: savedSettings.defaultPreset ?? 'default',
              folderPresetMappings: savedSettings.folderPresetMappings?.map((m: { folder: string; preset: string }) => ({
                folderPath: m.folder,
                presetId: m.preset,
                priority: 0
              })) || [],
              tagPresetMappings: savedSettings.tagPresetMappings?.map((m: { tag: string; preset: string }) => ({
                tag: m.tag,
                presetId: m.preset,
                priority: 0
              })) || [],
              datePresetMappings: savedSettings.datePresetMappings?.map((m: { startDate: string; endDate: string; preset: string }) => ({
                startDate: m.startDate,
                endDate: m.endDate,
                presetId: m.preset,
                priority: 0
              })) || [],
              propertyPresetMappings: savedSettings.propertyPresetMappings?.map((m: { name: string; value: string; preset: string }) => ({
                property: m.name,
                value: m.value,
                presetId: m.preset,
                priority: 0
              })) || []
            },
            presetList: {
              default: {
                name: '기본 프리셋',
                description: '기본 설정값으로 구성된 프리셋',
                settings: {
                  card: {
                    cardGeneral: {},
                    cardContent: {},
                    cardStyle: {}
                  },
                  cardSet: {},
                  layout: {},
                  search: {},
                  sort: {}
                }
              }
            }
          },
          // 추가 호환성 속성 (구 형식 지원)
          defaultCardSetType: savedSettings.defaultCardSetType ?? defaultSettings.defaultCardSetType,
          includeSubfolders: savedSettings.includeSubfolders ?? defaultSettings.includeSubfolders,
          includeBacklinks: savedSettings.includeBacklinks ?? defaultSettings.includeBacklinks,
          includeOutgoingLinks: savedSettings.includeOutgoingLinks ?? defaultSettings.includeOutgoingLinks,
          linkLevel: savedSettings.linkLevel ?? defaultSettings.linkLevel,
          folderSetMode: savedSettings.folderSetMode ?? 'active',
          fixedFolderPath: savedSettings.fixedFolderPath ?? '',
          tagSetMode: savedSettings.tagSetMode ?? 'active',
          fixedTag: savedSettings.fixedTag ?? '',
          cardRenderConfig: savedSettings.cardRenderConfig ?? defaultSettings.cardRenderConfig,
          cardStyle: savedSettings.cardStyle ?? defaultSettings.cardStyle
        };
        
        // 마이그레이션 완료 후 설정 저장
        await this.saveData(migratedSettings);
        console.log('설정이 새 구조로 마이그레이션되었습니다.');
      }
      
      this.settings = migratedSettings;
    } else {
      // 저장된 설정이 없으면 기본값 사용
      this.settings = { ...DefaultValues.plugin };
    }
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
    
    // LayoutService 등록 시 디버깅 로그 추가
    console.log('LayoutService 등록 시작');
    
    // LayoutService 인스턴스 생성을 직접 시도하는 방식으로 변경
    let layoutService: ILayoutService | null = null;
    try {
      // 생성자를 직접 호출하는 대신 getInstance 패턴 사용
      layoutService = LayoutService.getInstance();
      console.log('LayoutService 인스턴스 생성 성공', layoutService);
      
      // 레이아웃 서비스 초기화 명시적 호출
      layoutService.initialize();
      console.log('LayoutService 초기화 완료');
      
      // 서비스 등록
      container.register('ILayoutService', () => layoutService, true);
      console.log('LayoutService 등록 완료');
    } catch (error) {
      console.error('LayoutService 등록 실패:', error);
      // 등록 실패 시에도 인터페이스를 등록하여 null 객체 패턴 활용
      container.register('ILayoutService', () => ({
        // 최소한의 기본 구현으로 인터페이스 준수
        initialize: () => {},
        cleanup: () => {},
        getLayoutConfig: () => DEFAULT_LAYOUT_CONFIG,
        updateLayoutConfig: () => {},
        calculateLayout: () => ({ cardPositions: [], columnCount: 1, rowCount: 1 }),
        updateViewportDimensions: () => {},
        updateCardPosition: () => {},
        resetCardPositions: () => {},
        getDefaultLayoutConfig: () => DEFAULT_LAYOUT_CONFIG,
        determineLayoutType: () => 'masonry',
        determineLayoutDirection: () => 'vertical',
        calculateColumnCount: () => 1,
        calculateRowCount: () => 1
      }), true);
    }
    
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
  
  private initializeServiceContainer(): void {
    // 설정 서비스 등록
    const settingsService = new SettingsService(this);
    this.serviceContainer.register<ISettingsService>('ISettingsService', settingsService);
    
    console.log('설정 서비스 컨테이너 초기화 완료');
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

  // 서비스 초기화 완료 표시 메서드
  private markServicesInitialized(): void {
    // 설정에 초기화 완료 플래그 추가
    this.settings.servicesInitialized = true;
    this.saveSettings();
  }
} 