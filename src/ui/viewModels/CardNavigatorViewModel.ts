import { App, View, Menu, Editor, TFile } from 'obsidian';
import { Container } from '@/infrastructure/di/Container';
import { ICardNavigatorViewModel, FocusDirection } from '../interfaces/ICardNavigatorViewModel';
import { ICardService } from '@/domain/services/ICardService';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { ISearchService } from '@/domain/services/ISearchService';
import { ISortService } from '@/domain/services/ISortService';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IActiveFileWatcher } from '@/domain/services/IActiveFileWatcher';
import { CardSetCreatedEvent, CardSetUpdatedEvent, CardSetDeletedEvent } from '@/domain/events/CardSetEvents';
import { ICardSet } from '@/domain/models/CardSet';
import { CardSetType, LinkType } from '@/domain/models/CardSet';
import { ICardSetService } from '@/domain/services/ICardSetService';
import { ICardDisplayManager } from '@/domain/managers/ICardDisplayManager';
import { ICardInteractionService } from '@/domain/services/ICardInteractionService';
import { ICardRenderConfig, DEFAULT_CARD_RENDER_CONFIG } from '@/domain/models/CardRenderConfig';
import { ICardStyle, DEFAULT_CARD_STYLE } from '@/domain/models/CardStyle';
import { ICardNavigatorView } from '../interfaces/ICardNavigatorView';
import { IPresetService } from '@/domain/services/IPresetService';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ICardNavigatorState, DEFAULT_CARD_NAVIGATOR_STATE } from '../../domain/models/CardNavigatorState';
import { EventBus } from '../../domain/events/EventBus';
import { CardFocusedEvent, CardSelectedEvent, CardDeselectedEvent, CardActivatedEvent } from '../../domain/events/CardEvents';
import { SearchStartedEvent, SearchCompletedEvent, SearchClearedEvent } from '../../domain/events/SearchEvents';
import { LayoutChangedEvent } from '../../domain/events/LayoutEvents';
import { ToolbarActionEvent } from '../../domain/events/ToolbarEvents';
import { ViewChangedEvent, ViewActivatedEvent, ViewDeactivatedEvent } from '../../domain/events/ViewEvents';
import type CardNavigatorPlugin from '@/main';
import { ICard } from '@/domain/models/Card';

// useCases import
import { OpenCardNavigatorUseCase } from '@/application/useCases/OpenCardNavigatorUseCase';
import { CreateCardSetUseCase, CreateCardSetInput } from '@/application/useCases/CreateCardSetUseCase';
import { SortCardSetUseCase } from '@/application/useCases/SortCardSetUseCase';
import { SelectCardsUseCase } from '@/application/useCases/SelectCardsUseCase';
import { NavigateCardUseCase } from '@/application/useCases/NavigateCardUseCase';
import { InteractCardUseCase } from '@/application/useCases/InteractCardUseCase';
import { ManagePresetUseCase } from '@/application/useCases/ManagePresetUseCase';
import { MapPresetUseCase } from '@/application/useCases/MapPresetUseCase';
import { HandleToolbarUseCase } from '@/application/useCases/HandleToolbarUseCase';
import { CustomizeCardUseCase } from '@/application/useCases/CustomizeCardUseCase';
import { ApplyLayoutUseCase } from '@/application/useCases/ApplyLayoutUseCase';
import { IRenderManager } from '@/domain/managers/IRenderManager';

export class CardNavigatorViewModel implements ICardNavigatorViewModel {
  private static instance: CardNavigatorViewModel;
  private app: App;
  private cardService: ICardService;
  private layoutService: ILayoutService;
  private searchService: ISearchService;
  private sortService: ISortService;
  private logger: ILoggingService;
  private errorHandler: IErrorHandler;
  private eventDispatcher: IEventDispatcher;
  private performanceMonitor: IPerformanceMonitor;
  private analyticsService: IAnalyticsService;
  private cardSetService: ICardSetService;
  private cardDisplayManager: ICardDisplayManager;
  private cardInteractionService: ICardInteractionService;
  private presetService: IPresetService;
  private view: ICardNavigatorView;
  private stateSubject: BehaviorSubject<ICardNavigatorState>;
  private subscriptions: Subscription[] = [];
  private eventBus: EventBus;

  // useCases
  private openCardNavigatorUseCase: OpenCardNavigatorUseCase;
  private createCardSetUseCase: CreateCardSetUseCase;
  private sortCardSetUseCase: SortCardSetUseCase;
  private selectCardsUseCase: SelectCardsUseCase;
  private navigateCardUseCase: NavigateCardUseCase;
  private interactCardUseCase: InteractCardUseCase;
  private managePresetUseCase: ManagePresetUseCase;
  private mapPresetUseCase: MapPresetUseCase;
  private handleToolbarUseCase: HandleToolbarUseCase;
  private customizeCardUseCase: CustomizeCardUseCase;
  private applyLayoutUseCase: ApplyLayoutUseCase;

  private focusedCardId: string | null = null;
  private selectedCardIds: Set<string> = new Set();
  private currentCardSet: ICardSet | null = null;
  private activeCardId: string | null = null;
  private isSearchMode: boolean = false;
  private searchQuery: string = '';
  private currentSortConfig: any = null;
  private currentFilterConfig: any = null;
  private currentLayoutConfig: any = null;
  private currentRenderConfig: ICardRenderConfig | null = null;
  private currentStyle: ICardStyle | null = null;
  private isInitialized: boolean = false;
  private plugin: CardNavigatorPlugin;

  constructor() {
    try {
      const container = Container.getInstance();
      console.debug('CardNavigatorViewModel 생성자 시작');

      // 플러그인 인스턴스 가져오기 
      this.plugin = container.resolve<CardNavigatorPlugin>('Plugin');

      // ILoggingService를 가장 먼저 주입
      console.debug('ILoggingService 서비스 해결 시도');
      this.logger = container.resolve<ILoggingService>('ILoggingService');
      console.debug('ILoggingService 서비스 해결 완료');

      this.logger.debug('App 서비스 해결 시도');
      this.app = container.resolve<App>('App');
      this.logger.debug('App 서비스 해결 완료');

      this.logger.debug('ICardService 서비스 해결 시도');
      this.cardService = container.resolve<ICardService>('ICardService');
      this.logger.debug('ICardService 서비스 해결 완료');

      this.logger.debug('ILayoutService 서비스 해결 시도');
      this.layoutService = container.resolve<ILayoutService>('ILayoutService');
      this.logger.debug('ILayoutService 서비스 해결 완료');

      this.logger.debug('ISearchService 서비스 해결 시도');
      this.searchService = container.resolve<ISearchService>('ISearchService');
      this.logger.debug('ISearchService 서비스 해결 완료');

      this.logger.debug('ISortService 서비스 해결 시도');
      this.sortService = container.resolve<ISortService>('ISortService');
      this.logger.debug('ISortService 서비스 해결 완료');

      this.logger.debug('IErrorHandler 서비스 해결 시도');
      this.errorHandler = container.resolve<IErrorHandler>('IErrorHandler');
      this.logger.debug('IErrorHandler 서비스 해결 완료');

      this.logger.debug('IEventDispatcher 서비스 해결 시도');
      this.eventDispatcher = container.resolve<IEventDispatcher>('IEventDispatcher');
      this.logger.debug('IEventDispatcher 서비스 해결 완료');

      this.logger.debug('IPerformanceMonitor 서비스 해결 시도');
      this.performanceMonitor = container.resolve<IPerformanceMonitor>('IPerformanceMonitor');
      this.logger.debug('IPerformanceMonitor 서비스 해결 완료');

      this.logger.debug('IAnalyticsService 서비스 해결 시도');
      this.analyticsService = container.resolve<IAnalyticsService>('IAnalyticsService');
      this.logger.debug('IAnalyticsService 서비스 해결 완료');

      this.logger.debug('ICardSetService 서비스 해결 시도');
      this.cardSetService = container.resolve<ICardSetService>('ICardSetService');
      this.logger.debug('ICardSetService 서비스 해결 완료');

      this.logger.debug('ICardDisplayManager 서비스 해결 시도');
      this.cardDisplayManager = container.resolve<ICardDisplayManager>('ICardDisplayManager');
      this.logger.debug('ICardDisplayManager 서비스 해결 완료');

      this.logger.debug('ICardInteractionService 서비스 해결 시도');
      this.cardInteractionService = container.resolve<ICardInteractionService>('ICardInteractionService');
      this.logger.debug('ICardInteractionService 서비스 해결 완료');

      this.logger.debug('IPresetService 서비스 해결 시도');
      this.presetService = container.resolve<IPresetService>('IPresetService');
      this.logger.debug('IPresetService 서비스 해결 완료');

      // useCases 주입
      this.logger.debug('useCases 주입 시작');
      this.openCardNavigatorUseCase = OpenCardNavigatorUseCase.getInstance();
      this.createCardSetUseCase = CreateCardSetUseCase.getInstance();
      this.sortCardSetUseCase = SortCardSetUseCase.getInstance();
      this.selectCardsUseCase = SelectCardsUseCase.getInstance();
      this.navigateCardUseCase = NavigateCardUseCase.getInstance();
      this.interactCardUseCase = InteractCardUseCase.getInstance();
      this.managePresetUseCase = ManagePresetUseCase.getInstance();
      this.mapPresetUseCase = MapPresetUseCase.getInstance();
      this.handleToolbarUseCase = HandleToolbarUseCase.getInstance();
      this.customizeCardUseCase = CustomizeCardUseCase.getInstance();
      this.applyLayoutUseCase = ApplyLayoutUseCase.getInstance();
      this.logger.debug('useCases 주입 완료');

      // 이벤트 리스너 등록
      this.registerEventListeners();

      this.stateSubject = new BehaviorSubject<ICardNavigatorState>(DEFAULT_CARD_NAVIGATOR_STATE);
      this.eventBus = EventBus.getInstance();
      this.initializeEventHandlers();

      this.logger.debug('CardNavigatorViewModel 생성자 완료');
    } catch (error) {
      console.error('CardNavigatorViewModel 생성자 실패:', error);
      throw error;
    }
  }

  public static getInstance(): CardNavigatorViewModel {
    if (!CardNavigatorViewModel.instance) {
      CardNavigatorViewModel.instance = new CardNavigatorViewModel();
    }
    return CardNavigatorViewModel.instance;
  }

  public setView(view: ICardNavigatorView): void {
    this.logger.debug('뷰 설정 시작');
    this.view = view;
    
    // 렌더링 관리자 초기화 추가
    try {
      const renderManager = Container.getInstance().resolve<IRenderManager>('IRenderManager');
      renderManager.initialize();
      this.logger.debug('렌더링 관리자 초기화 완료');
    } catch (error) {
      this.logger.error('렌더링 관리자 초기화 실패', { error });
      this.errorHandler.handleError(error, '렌더링 관리자 초기화 실패');
    }
    
    // 뷰가 설정된 후 초기화 수행
    if (!this.isInitialized) {
      this.logger.debug('뷰 설정 후 초기화 시작');
      this.initialize().then(() => {
        this.logger.debug('뷰 설정 후 초기화 완료');
        this.isInitialized = true;
      }).catch(error => {
        this.logger.error('뷰 설정 후 초기화 실패', { error });
        this.errorHandler.handleError(error, '뷰 설정 후 초기화 실패');
        this.view.showError('카드 내비게이터를 초기화하는 중 오류가 발생했습니다.');
      });
    } else {
      // 이미 초기화된 경우 상태 업데이트
      this.logger.debug('이미 초기화된 뷰에 상태 업데이트');
      this.updateState(state => ({
        ...state,
        currentCardSet: this.currentCardSet,
        focusedCardId: this.focusedCardId,
        selectedCardIds: this.selectedCardIds,
        activeCardId: this.activeCardId
      }));
    }
    
    this.logger.debug('뷰 설정 완료');
  }

  async initialize(): Promise<void> {
    const perfMark = 'CardNavigatorViewModel.initialize';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      // 이미 초기화된 경우 중복 작업 방지
      if (this.isInitialized) {
        this.logger.debug('카드 내비게이터 뷰모델이 이미 초기화되어 있습니다.');
        return;
      }
      
      this.logger.debug('카드 내비게이터 뷰모델 초기화 시작');
      this.analyticsService.trackEvent('CardNavigatorViewModel.initialize.start');

      // 1. 로딩 상태 표시
      if (this.view) {
        this.view.showLoading(true);
      }

      // 2. ActiveFileWatcher 초기화
      const activeFileWatcher = Container.getInstance().resolve<IActiveFileWatcher>('IActiveFileWatcher');
      if (!activeFileWatcher.isInitialized()) {
        await activeFileWatcher.initialize();
      }
      
      this.logger.debug('활성 파일 감시자 초기화 완료');

      // 3. 활성 파일 정보 가져오기
      const activeFile = activeFileWatcher.getActiveFile();
      
      // 4. 선택된 카드셋 타입에 따라 다르게 처리
      const cardSetType = this.plugin.settings.defaultCardSetType;
      this.logger.debug('기본 카드셋 타입', { cardSetType });
      
      try {
        // 카드셋 타입에 따라 다른 생성 로직 사용
        if (cardSetType === CardSetType.FOLDER) {
          await this.initializeFolderCardSet(activeFile);
        } else if (cardSetType === CardSetType.TAG) {
          await this.initializeTagCardSet(activeFile);
        } else if (cardSetType === CardSetType.LINK) {
          await this.initializeLinkCardSet(activeFile);
        } else {
          // 기본값은 폴더 카드셋
          await this.initializeFolderCardSet(activeFile);
        }
        
        // 활성 카드 포커스
        if (activeFile && this.currentCardSet && this.currentCardSet.cards.length > 0) {
          const activeCard = this.currentCardSet.cards.find(
            card => card.file && card.file.path === activeFile.path
          );
          
          if (activeCard) {
            this.logger.debug('활성 카드 포커스', { cardId: activeCard.id });
            await this.focusCard(activeCard.id);
            this.activeCardId = activeCard.id;
            this.logger.debug('활성 카드 포커스 완료', { cardId: activeCard.id });
          } else {
            this.logger.debug('활성 파일에 해당하는 카드를 찾을 수 없음');
          }
        }
      } catch (error) {
        this.logger.error('카드셋 초기화 실패', { error });
        if (this.view) {
          this.view.showError('카드셋 초기화 중 오류가 발생했습니다.');
        }
        throw error;
      }

      // 5. 활성 파일 변경 이벤트 구독
      activeFileWatcher.subscribeToActiveFileChanges(this.handleFileChanged.bind(this));
      this.logger.debug('활성 파일 변경 이벤트 구독 완료');

      // 6. 상태 업데이트 - 여기서 한 번만 업데이트
      this.updateState(state => ({
        ...state,
        currentCardSet: this.currentCardSet,
        focusedCardId: this.focusedCardId,
        selectedCardIds: this.selectedCardIds,
        activeCardId: this.activeCardId
      }));

      // 초기화 완료 표시
      this.isInitialized = true;

      this.analyticsService.trackEvent('CardNavigatorViewModel.initialize.complete');
      this.logger.info('카드 내비게이터 뷰모델 초기화 완료');
    } catch (error) {
      this.logger.error('카드 내비게이터 뷰모델 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.initialize');
      
      // 에러 이벤트 기록
      this.analyticsService.trackEvent('CardNavigatorViewModel.initialize.error', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      // 뷰에 에러 표시
      if (this.view) {
        this.view.showError('카드 내비게이터 초기화에 실패했습니다.');
      }
      
      throw error;
    } finally {
      // 7. 로딩 상태 종료
      if (this.view) {
        this.view.showLoading(false);
      }
      
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 폴더 카드셋 초기화
   * @param activeFile 활성 파일
   */
  private async initializeFolderCardSet(activeFile: TFile | null): Promise<void> {
    let folderPath = '/';
    
    // 사용자 설정에 따라 폴더 경로 결정
    const folderSetMode = (this.plugin.settings as any).folderSetMode || 'active';
    
    if (folderSetMode === 'fixed') {
      // 고정 폴더 모드인 경우, 사용자가 설정한 경로 사용
      folderPath = (this.plugin.settings as any).fixedFolderPath || '/';
      this.logger.debug('고정 폴더 모드 적용', { folderPath });
    } else if (activeFile) {
      // 활성 폴더 모드인 경우, 활성 파일의 폴더 사용
      this.logger.debug('활성 파일 감지됨', { filePath: activeFile.path });
      folderPath = activeFile.parent?.path || '/';
      this.logger.debug('활성 폴더 경로', { folderPath });
    } else {
      this.logger.debug('활성 파일이 없음, 루트 폴더 사용');
    }

    // 카드셋 생성
    this.logger.debug('폴더 카드셋 생성 시작', { folderPath });
    this.currentCardSet = await this.cardSetService.getCardSetByFolder(folderPath);
    
    if (!this.currentCardSet) {
      throw new Error('폴더 카드셋 생성 실패: null 반환됨');
    }
    
    this.logger.debug('폴더 카드셋 생성 완료', { 
      cardSetId: this.currentCardSet.id, 
      cardCount: this.currentCardSet.cards.length 
    });

    // 카드 디스플레이 매니저에 카드셋 설정
    this.cardDisplayManager.displayCardSet(this.currentCardSet);
    this.logger.debug('카드 디스플레이 매니저에 카드셋 설정 완료');
    
    // 초기화 과정에서는 여기서 뷰를 업데이트하지 않고, initialize 메서드에서 한 번만 업데이트
  }

  /**
   * 태그 카드셋 초기화
   * @param activeFile 활성 파일
   */
  private async initializeTagCardSet(activeFile: TFile | null): Promise<void> {
    let tags: string[] = [];
    
    // 사용자 설정에 따라 태그 결정
    const tagSetMode = (this.plugin.settings as any).tagSetMode || 'active';
    
    if (tagSetMode === 'fixed') {
      // 고정 태그 모드인 경우, 사용자가 설정한 태그 사용
      const fixedTag = (this.plugin.settings as any).fixedTag || '';
      if (fixedTag) {
        tags.push(fixedTag);
      }
      this.logger.debug('고정 태그 모드 적용', { tags });
    } else if (activeFile) {
      // 활성 태그 모드인 경우, 활성 파일의 모든 태그 사용
      this.logger.debug('활성 파일 감지됨', { filePath: activeFile.path });
      tags = this.getActiveFileTags(activeFile);
      this.logger.debug('활성 파일의 태그', { tags });
    } else {
      this.logger.debug('활성 파일이 없거나 태그가 없음');
    }

    // 태그가 비어있으면 처리 중단
    if (tags.length === 0) {
      this.logger.warn('태그가 없어 카드셋을 생성할 수 없음');
      if (this.view) {
        this.view.showError('태그가 없어 카드셋을 생성할 수 없습니다.');
      }
      return;
    }
    
    // 다중 태그를 처리하는 전용 메서드로 카드셋 생성
    this.logger.debug('다중 태그 카드셋 생성 시작', { tags });
    await this.createMultiTagCardSet(tags);
  }

  /**
   * 여러 태그를 포함하는 파일로 카드셋 생성
   * @param tags 검색할 태그 목록
   */
  private async createMultiTagCardSet(tags: string[]): Promise<void> {
    try {
      this.logger.debug('다중 태그 카드셋 생성 시작', { tagCount: tags.length });
      
      // 첫 번째 태그로 기본 카드셋 생성
      const firstTag = tags[0];
      this.currentCardSet = await this.cardSetService.getCardSetByTag(firstTag);
      
      if (!this.currentCardSet) {
        throw new Error('태그 카드셋 생성 실패: null 반환됨');
      }
      
      // 다른 태그가 있는 경우 추가 태그별 카드셋을 가져와서 병합
      if (tags.length > 1) {
        const allCards = new Map<string, ICard>(); // 중복 제거를 위한 Map
        
        // 첫 번째 태그의 카드 추가
        for (const card of this.currentCardSet.cards) {
          allCards.set(card.id, card);
        }
        
        // 나머지 태그 처리
        for (let i = 1; i < tags.length; i++) {
          const tagCardSet = await this.cardSetService.getCardSetByTag(tags[i]);
          if (tagCardSet) {
            for (const card of tagCardSet.cards) {
              if (!allCards.has(card.id)) {
                allCards.set(card.id, card);
              }
            }
          }
        }
        
        // 새로운 통합 카드셋 생성
        this.currentCardSet = {
          ...this.currentCardSet,
          criteria: tags.join(', '),
          cards: Array.from(allCards.values())
        };
        
        this.logger.debug('다중 태그 카드셋 병합 완료', { 
          cardCount: this.currentCardSet.cards.length,
          tags
        });
      }
      
      // 카드 디스플레이 매니저에 카드셋 설정
      this.cardDisplayManager.displayCardSet(this.currentCardSet);
      this.logger.debug('카드 디스플레이 매니저에 카드셋 설정 완료');
      
      // 초기화 과정에서는 여기서 뷰를 업데이트하지 않고, initialize 메서드에서 한 번만 업데이트
    } catch (error) {
      this.logger.error('다중 태그 카드셋 생성 실패', { error });
      throw error;
    }
  }

  /**
   * 링크 카드셋 초기화
   * @param activeFile 활성 파일
   */
  private async initializeLinkCardSet(activeFile: TFile | null): Promise<void> {
    if (!activeFile) {
      this.logger.warn('활성 파일이 없어 링크 카드셋을 생성할 수 없음');
      if (this.view) {
        this.view.showError('활성 파일이 없어 링크 카드셋을 생성할 수 없습니다.');
      }
      return;
    }

    this.logger.debug('링크 카드셋 초기화 시작', { filePath: activeFile.path });
    
    try {
      // 링크 설정 확인
      const linkLevel = this.plugin.settings.linkLevel || 1;
      
      // 둘 중 하나라도 true인지 확인
      let includeBacklinks = this.plugin.settings.includeBacklinks !== undefined 
        ? this.plugin.settings.includeBacklinks : true;
      let includeOutgoingLinks = this.plugin.settings.includeOutgoingLinks !== undefined 
        ? this.plugin.settings.includeOutgoingLinks : true;
      
      // 둘 다 false인 경우, 기본적으로 둘 다 true로 설정
      if (!includeBacklinks && !includeOutgoingLinks) {
        this.logger.debug('백링크와 아웃고잉 링크가 모두 비활성화되어 있어 기본값으로 둘 다 활성화합니다.');
        includeBacklinks = true;
        includeOutgoingLinks = true;
      }
      
      this.logger.debug('링크 설정 적용', { 
        linkLevel, 
        includeBacklinks, 
        includeOutgoingLinks 
      });
      
      // 카드셋 생성 입력 구성
      const input: CreateCardSetInput = {
        type: CardSetType.LINK,
        criteria: activeFile.path,
        containerWidth: this.getContainerDimensions().width,
        containerHeight: this.getContainerDimensions().height,
        linkLevel: linkLevel,
        includeBacklinks: includeBacklinks,
        includeOutgoingLinks: includeOutgoingLinks
      };
      
      this.logger.debug('링크 카드셋 생성 요청', { input });
      this.currentCardSet = await this.createCardSetUseCase.execute(input);
      
      if (!this.currentCardSet) {
        throw new Error('링크 카드셋 생성 실패: null 반환됨');
      }
      
      this.logger.debug('링크 카드셋 생성 완료', { 
        cardSetId: this.currentCardSet.id, 
        cardCount: this.currentCardSet.cards.length 
      });
      
      // 카드가 없는 경우 안내 메시지 표시
      if (this.currentCardSet.cards.length === 0) {
        this.logger.debug('카드가 없어 안내 메시지를 표시합니다.');
        if (this.view) {
          this.view.showMessage('현재 문서와 연결된 노트가 없습니다. 다른 노트들과 링크를 생성해보세요.');
        }
      }
      
      // 카드 디스플레이 매니저에 카드셋 설정
      this.cardDisplayManager.displayCardSet(this.currentCardSet);
      this.logger.debug('카드 디스플레이 매니저에 카드셋 설정 완료');
      
      // 초기화 과정에서는 여기서 뷰를 업데이트하지 않고, initialize 메서드에서 한 번만 업데이트
    } catch (error) {
      this.logger.error('링크 카드셋 초기화 실패', { error });
      if (this.view) {
        this.view.showError('링크 카드셋 초기화 중 오류가 발생했습니다.');
      }
      throw error;
    }
  }
  
  /**
   * 활성 파일의 태그 목록 가져오기
   * @param file 활성 파일
   * @returns 태그 목록
   */
  private getActiveFileTags(file: TFile): string[] {
    try {
      const tags: string[] = [];
      if (!file) return tags;
      
      // 메타데이터 캐시에서 태그 정보 가져오기
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache) return tags;
      
      // 인라인 태그 (예: #태그)
      if (cache.tags) {
        for (const tag of cache.tags) {
          tags.push(tag.tag); // tag.tag는 "#태그" 형식
        }
      }
      
      // 프론트매터 태그
      if (cache.frontmatter) {
        // 복수형 태그 (tags)
        if (cache.frontmatter.tags) {
          const fmTags = cache.frontmatter.tags;
          if (Array.isArray(fmTags)) {
            for (const tag of fmTags) {
              tags.push('#' + tag); // 프론트매터 태그에는 # 기호가 없으므로 추가
            }
          } else if (typeof fmTags === 'string') {
            tags.push('#' + fmTags);
          }
        }
        
        // 단수형 태그 (tag)
        if (cache.frontmatter.tag) {
          const fmTag = cache.frontmatter.tag;
          if (typeof fmTag === 'string') {
            tags.push('#' + fmTag);
          } else if (Array.isArray(fmTag)) {
            for (const tag of fmTag) {
              tags.push('#' + tag);
            }
          }
        }
      }
      
      return tags;
    } catch (error) {
      this.logger.error('활성 파일의 태그 정보 가져오기 실패', { error });
      return [];
    }
  }

  async cleanup(): Promise<void> {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.cleanup');
      this.logger.debug('카드 내비게이터 뷰모델 정리 시작');
      this.analyticsService.trackEvent('CardNavigatorViewModel.cleanup.start');

      // 이벤트 구독 해제
      this.eventDispatcher.unsubscribe(CardSetCreatedEvent, this.handleCardSetCreated.bind(this));
      this.eventDispatcher.unsubscribe(CardSetUpdatedEvent, this.handleCardSetUpdated.bind(this));
      this.eventDispatcher.unsubscribe(CardSetDeletedEvent, this.handleCardSetDeleted.bind(this));

      // 상태 초기화
      this.focusedCardId = null;
      this.selectedCardIds.clear();
      this.currentCardSet = null;
      this.activeCardId = null;
      this.isSearchMode = false;
      this.searchQuery = '';
      this.currentSortConfig = null;
      this.currentFilterConfig = null;
      this.currentLayoutConfig = null;
      this.currentRenderConfig = null;
      this.currentStyle = null;

      this.logger.debug('카드 내비게이터 뷰모델 정리 완료');
      this.analyticsService.trackEvent('CardNavigatorViewModel.cleanup.complete');
    } catch (error) {
      this.errorHandler.handleError(error, '카드 내비게이터 뷰모델 정리 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.cleanup.error', { error: error.message });
      throw error;
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.cleanup');
    }
  }

  moveFocus(direction: FocusDirection): void {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.moveFocus');
      this.analyticsService.trackEvent('CardNavigatorViewModel.moveFocus', { direction });

      const cards = this.currentCardSet?.cards || [];
      if (cards.length === 0) return;

      let currentIndex = this.focusedCardId ? cards.findIndex(c => c.id === this.focusedCardId) : -1;
      let nextIndex: number;

      switch (direction) {
        case 'up':
          nextIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
          break;
        case 'down':
          nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'left':
          nextIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
          break;
        case 'right':
          nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
          break;
      }

      this.focusedCardId = cards[nextIndex].id;
      this.cardDisplayManager.scrollToCard(this.focusedCardId);
    } catch (error) {
      this.errorHandler.handleError(error, '포커스 이동 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.moveFocus.error', { error: error.message });
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.moveFocus');
    }
  }

  openFocusedCard(): void {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.openFocusedCard');
      this.analyticsService.trackEvent('CardNavigatorViewModel.openFocusedCard');

      if (!this.focusedCardId) return;

      const card = this.currentCardSet?.cards.find(c => c.id === this.focusedCardId);
      if (!card) return;

      this.cardInteractionService.openFile(card.file);
    } catch (error) {
      this.errorHandler.handleError(error, '포커스된 카드 열기 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.openFocusedCard.error', { error: error.message });
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.openFocusedCard');
    }
  }

  clearFocus(): void {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.clearFocus');
      this.analyticsService.trackEvent('CardNavigatorViewModel.clearFocus');

      this.focusedCardId = null;
      this.selectedCardIds.clear();
    } catch (error) {
      this.errorHandler.handleError(error, '포커스 해제 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.clearFocus.error', { error: error.message });
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.clearFocus');
    }
  }

  /**
   * 카드 선택
   * @param cardId 카드 ID
   */
  public async selectCard(cardId: string): Promise<void> {
    try {
      await this.cardService.selectCard(cardId);
      this.eventDispatcher.dispatch(new CardSelectedEvent(cardId));
    } catch (error) {
      this.errorHandler.handleError(error, '카드 선택 실패');
    }
  }

  showCardContextMenu(cardId: string, event: MouseEvent): void {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.showCardContextMenu');
      this.analyticsService.trackEvent('CardNavigatorViewModel.showCardContextMenu', { cardId });

      const card = this.currentCardSet?.cards.find(c => c.id === cardId);
      if (!card) return;

      // 컨텍스트 메뉴 표시
      const menu = new Menu();
      menu.addItem((item) => {
        item.setTitle('링크 복사')
          .setIcon('link')
          .onClick(() => {
            navigator.clipboard.writeText(`[[${card.file.path}]]`);
            this.analyticsService.trackEvent('CardNavigatorViewModel.copyLink', { cardId });
          });
      });
      menu.addItem((item) => {
        item.setTitle('내용 복사')
          .setIcon('copy')
          .onClick(() => {
            navigator.clipboard.writeText(card.content);
            this.analyticsService.trackEvent('CardNavigatorViewModel.copyContent', { cardId });
          });
      });

      menu.showAtPosition({ x: event.clientX, y: event.clientY });
    } catch (error) {
      this.errorHandler.handleError(error, '카드 컨텍스트 메뉴 표시 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.showCardContextMenu.error', { error: error.message });
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.showCardContextMenu');
    }
  }

  startCardDrag(cardId: string, event: DragEvent): void {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.startCardDrag');
      this.analyticsService.trackEvent('CardNavigatorViewModel.startCardDrag', { cardId });

      const card = this.currentCardSet?.cards.find(c => c.id === cardId);
      if (!card) return;

      // 드래그 데이터 설정
      event.dataTransfer?.setData('text/plain', `[[${card.file.path}]]`);
    } catch (error) {
      this.errorHandler.handleError(error, '카드 드래그 시작 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.startCardDrag.error', { error: error.message });
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.startCardDrag');
    }
  }

  handleCardDragOver(cardId: string, event: DragEvent): void {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.handleCardDragOver');
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'link';
    } catch (error) {
      this.errorHandler.handleError(error, '카드 드래그 오버 처리 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.handleCardDragOver.error', { error: error.message });
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.handleCardDragOver');
    }
  }

  handleCardDrop(cardId: string, event: DragEvent): void {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.handleCardDrop');
      this.analyticsService.trackEvent('CardNavigatorViewModel.handleCardDrop', { cardId });

      event.preventDefault();

      const sourceCard = this.currentCardSet?.cards.find(c => c.id === cardId);
      if (!sourceCard) return;

      const targetCard = this.currentCardSet?.cards.find(c => c.id === cardId);
      if (!targetCard) return;

      // 링크 생성
      const link = `[[${sourceCard.file.path}]]`;
      const activeLeaf = this.app.workspace.activeLeaf;
      if (activeLeaf?.view instanceof View) {
        const editor = (activeLeaf.view as any).editor as Editor;
        if (editor) {
          editor.replaceSelection(link);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '카드 드롭 처리 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.handleCardDrop.error', { error: error.message });
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.handleCardDrop');
    }
  }

  private handleCardSetCreated(event: CardSetCreatedEvent): Promise<void> {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.handleCardSetCreated');
      this.logger.debug('카드셋 생성 이벤트 처리');
      this.analyticsService.trackEvent('CardNavigatorViewModel.handleCardSetCreated', { cardSetId: event.cardSet.id });

      // 성능 향상: 불필요한 업데이트 최소화
      this.cardDisplayManager.displayCardSet(event.cardSet);
      this.currentCardSet = event.cardSet;
      
      // 뷰 상태 업데이트
      this.updateState(state => ({
        ...state,
        currentCardSet: this.currentCardSet,
        focusedCardId: this.focusedCardId,
        selectedCardIds: this.selectedCardIds,
        activeCardId: this.activeCardId
      }));
      
      return Promise.resolve();
    } catch (error) {
      this.errorHandler.handleError(error, '카드셋 생성 이벤트 처리 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.handleCardSetCreated.error', { error: error.message });
      return Promise.reject(error);
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.handleCardSetCreated');
    }
  }

  private handleCardSetUpdated(cardSet: ICardSet): void {
    this.currentCardSet = cardSet;
    this.eventDispatcher.dispatch(new CardSetUpdatedEvent(cardSet));
    
    // 뷰 상태 업데이트
    this.updateState(state => ({
      ...state,
      currentCardSet: this.currentCardSet
    }));
  }

  private handleCardSetDeleted(cardSetId: string): void {
    if (this.currentCardSet?.id === cardSetId) {
      this.currentCardSet = null;
      
      // 뷰 상태 업데이트
      this.updateState(state => ({
        ...state,
        currentCardSet: null
      }));
    }
    
    this.eventDispatcher.dispatch(new CardSetDeletedEvent(cardSetId));
  }

  async createCardSet(type: CardSetType, criteria: string): Promise<void> {
    try {
      this.logger.debug('카드셋 생성 시작', { type, criteria });
      
      // 로딩 상태 설정
      if (this.view) {
        this.view.showLoading(true);
      }
      
      // 1. 카드셋 생성
      // 사용자 설정에 따라 입력 매개변수 구성
      let finalCriteria = criteria;
      let includeSubfolders = false;
      
      // 타입별 설정 적용
      if (type === CardSetType.FOLDER) {
        // 폴더 모드 및 하위 폴더 설정 적용
        const folderSetMode = (this.plugin.settings as any).folderSetMode || 'active';
        
        if (folderSetMode === 'fixed') {
          // 고정 폴더 모드인 경우, 항상 설정의 고정 폴더 경로 사용
          const fixedPath = (this.plugin.settings as any).fixedFolderPath || '/';
          finalCriteria = fixedPath;
          this.logger.debug('고정 폴더 경로 적용', { fixedFolderPath: finalCriteria });
        } else if (criteria === '') {
          // 활성 폴더 모드이지만 criteria가 비어있는 경우 루트 폴더 사용
          finalCriteria = '/';
        }
        
        includeSubfolders = this.plugin.settings.includeSubfolders;
      } else if (type === CardSetType.TAG) {
        // 태그 모드 설정 적용
        const tagSetMode = (this.plugin.settings as any).tagSetMode || 'active';
        if (tagSetMode === 'fixed' && criteria === '') {
          // 고정 태그 모드이고 명시적 criteria가 없을 경우, 설정의 고정 태그 사용
          finalCriteria = (this.plugin.settings as any).fixedTag || '';
          this.logger.debug('고정 태그 적용', { fixedTag: finalCriteria });
        }
      }
      
      // 카드셋 생성 입력 구성
      const input: CreateCardSetInput = {
        type,
        criteria: finalCriteria,
        includeSubfolders: includeSubfolders,
        containerWidth: this.getContainerDimensions().width,
        containerHeight: this.getContainerDimensions().height
      };
      
      // 링크 타입인 경우 링크 설정 추가
      if (type === CardSetType.LINK) {
        // linkType 설정 제거 (백링크/아웃고잉 토글로 대체)
        input.linkLevel = this.plugin.settings.linkLevel;
        input.includeBacklinks = this.plugin.settings.includeBacklinks; 
        input.includeOutgoingLinks = this.plugin.settings.includeOutgoingLinks;
      }
      
      this.logger.debug('카드셋 생성 요청', { input });
      this.currentCardSet = await this.createCardSetUseCase.execute(input);
      this.logger.debug('카드셋 생성 완료', { cardSetId: this.currentCardSet.id });
      
      // 2. 카드 디스플레이 매니저에 카드셋 설정
      if (this.currentCardSet) {
        this.cardDisplayManager.displayCardSet(this.currentCardSet);
        this.logger.debug('카드 디스플레이 매니저에 카드셋 설정 완료');
        
        // 3. 뷰에 카드셋 업데이트
        if (this.view) {
          this.view.updateCardSet(this.currentCardSet);
          this.logger.debug('뷰에 카드셋 업데이트 완료');
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '카드셋 생성');
      throw error;
    } finally {
      // 로딩 상태 해제
      if (this.view) {
        this.view.showLoading(false);
      }
    }
  }

  async scrollToCard(cardId: string): Promise<void> {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.scrollToCard');
      this.analyticsService.trackEvent('CardNavigatorViewModel.scrollToCard', { cardId });

      this.cardDisplayManager.scrollToCard(cardId);
    } catch (error) {
      this.errorHandler.handleError(error, '카드 스크롤 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.scrollToCard.error', { error: error.message });
      throw error;
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.scrollToCard');
    }
  }

  /**
   * 카드 선택 해제
   * @param cardId 카드 ID
   */
  public async deselectCard(cardId: string): Promise<void> {
    try {
      await this.cardService.deselectCard(cardId);
      this.eventDispatcher.dispatch(new CardDeselectedEvent(cardId));
    } catch (error) {
      this.errorHandler.handleError(error, '카드 선택 해제 실패');
    }
  }

  /**
   * 카드 포커스
   * @param cardId 카드 ID
   */
  public async focusCard(cardId: string): Promise<void> {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.focusCard');
      this.analyticsService.trackEvent('CardNavigatorViewModel.focusCard', { cardId });

      this.focusedCardId = cardId;
      this.cardDisplayManager.focusCard(cardId);
      await this.scrollToCard(cardId);
    } catch (error) {
      this.errorHandler.handleError(error, '카드 포커스 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.focusCard.error', { error: error.message });
      throw error;
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.focusCard');
    }
  }

  async activateCard(cardId: string): Promise<void> {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.activateCard');
      this.analyticsService.trackEvent('CardNavigatorViewModel.activateCard', { cardId });

      const card = this.currentCardSet?.cards.find(c => c.id === cardId);
      if (!card) return;

      this.activeCardId = cardId;
      this.cardInteractionService.openFile(card.file);
    } catch (error) {
      this.errorHandler.handleError(error, '카드 활성화 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.activateCard.error', { error: error.message });
      throw error;
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.activateCard');
    }
  }

  async deactivateCard(cardId: string): Promise<void> {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.deactivateCard');
      this.analyticsService.trackEvent('CardNavigatorViewModel.deactivateCard', { cardId });

      if (this.activeCardId === cardId) {
        this.activeCardId = null;
      }
    } catch (error) {
      this.errorHandler.handleError(error, '카드 비활성화 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.deactivateCard.error', { error: error.message });
      throw error;
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.deactivateCard');
    }
  }

  getContainerDimensions(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  private registerEventListeners(): void {
    this.eventDispatcher.subscribe(CardSetCreatedEvent, this.handleCardSetCreated.bind(this));
    this.eventDispatcher.subscribe(CardSetUpdatedEvent, this.handleCardSetUpdated.bind(this));
    this.eventDispatcher.subscribe(CardSetDeletedEvent, this.handleCardSetDeleted.bind(this));
  }

  private notifyViewUpdate(): void {
    try {
      this.logger.debug('뷰 업데이트 시작');
      
      if (!this.view) {
        this.logger.warn('뷰가 설정되지 않음');
        return;
      }

      // 현재 카드셋이 있는 경우에만 업데이트
      if (this.currentCardSet) {
        this.logger.debug('카드셋 데이터로 뷰 업데이트', {
          cardSetId: this.currentCardSet.id,
          cardCount: this.currentCardSet.cards.length
        });
        
        // View의 updateCardSet 메서드 호출
        (this.view as any).updateCardSet(this.currentCardSet);
        
        // 포커스된 카드가 있는 경우 해당 카드로 스크롤
        if (this.focusedCardId) {
          this.cardDisplayManager.scrollToCard(this.focusedCardId);
        }
      } else {
        this.logger.debug('현재 카드셋이 없음');
      }

      this.logger.debug('뷰 업데이트 완료');
    } catch (error) {
      this.errorHandler.handleError(error as Error, '뷰 업데이트');
      this.logger.error('뷰 업데이트 실패', { error });
    }
  }

  /**
   * 렌더링 설정 가져오기
   */
  getRenderConfig(): ICardRenderConfig {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.getRenderConfig');
      this.analyticsService.trackEvent('CardNavigatorViewModel.getRenderConfig');

      // 현재 적용된 프리셋의 렌더링 설정 가져오기
      const currentPreset = this.presetService.getCurrentPreset();
      if (currentPreset) {
        return currentPreset.config.cardRenderConfig;
      }

      // 기본 렌더링 설정 반환
      return DEFAULT_CARD_RENDER_CONFIG;
    } catch (error) {
      this.errorHandler.handleError(error, '렌더링 설정 가져오기 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.getRenderConfig.error', { error: error.message });
      return DEFAULT_CARD_RENDER_CONFIG;
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.getRenderConfig');
    }
  }

  /**
   * 현재 카드 스타일을 반환합니다.
   * @returns 현재 카드 스타일
   */
  public getCardStyle(): ICardStyle {
    try {
      this.performanceMonitor.startMeasure('getCardStyle');
      // 프리셋에서 카드 스타일 가져오기
      const preset = this.presetService.getCurrentPreset();
      if (preset) {
        return preset.config.cardStyle;
      }
      // 기본 카드 스타일 사용
      return DEFAULT_CARD_STYLE;
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to get card style');
      return DEFAULT_CARD_STYLE;
    } finally {
      this.performanceMonitor.endMeasure('getCardStyle');
    }
  }

  /**
   * 현재 카드셋 가져오기
   * @returns 현재 카드셋 또는 null
   */
  public getCurrentCardSet(): ICardSet | null {
    return this.currentCardSet;
  }

  /**
   * 이벤트 핸들러 초기화
   */
  private initializeEventHandlers(): void {
    // 카드셋 이벤트
    this.subscriptions.push(
      this.eventBus.subscribe<ICardSet>((event) => {
        if (event instanceof CardSetCreatedEvent || event instanceof CardSetUpdatedEvent) {
          this.handleCardSetUpdated(event.data);
        } else if (event instanceof CardSetDeletedEvent) {
          this.handleCardSetDeleted(event.data);
        }
      })
    );

    // 카드 이벤트
    this.subscriptions.push(
      this.eventBus.subscribe<string>((event) => {
        if (event instanceof CardFocusedEvent) {
          this.handleCardFocused(event.data);
        } else if (event instanceof CardSelectedEvent) {
          this.handleCardSelected(event.data);
        } else if (event instanceof CardActivatedEvent) {
          this.handleCardActivated(event.data);
        }
      })
    );

    // 검색 이벤트
    this.subscriptions.push(
      this.eventBus.subscribe<any>((event) => {
        if (event instanceof SearchStartedEvent) {
          this.handleSearchStarted(event.data);
        } else if (event instanceof SearchCompletedEvent) {
          this.handleSearchCompleted(event.data);
        } else if (event instanceof SearchClearedEvent) {
          this.handleSearchCleared();
        }
      })
    );

    // 레이아웃 이벤트
    this.subscriptions.push(
      this.eventBus.subscribe<any>((event) => {
        if (event instanceof LayoutChangedEvent) {
          this.handleLayoutChanged(event.data);
        }
      })
    );

    // 툴바 이벤트
    this.subscriptions.push(
      this.eventBus.subscribe<{ action: string }>((event) => {
        if (event instanceof ToolbarActionEvent) {
          this.handleToolbarAction(event.data.action);
        }
      })
    );

    // 뷰 이벤트
    this.subscriptions.push(
      this.eventBus.subscribe<any>((event) => {
        if (event instanceof ViewChangedEvent) {
          this.handleViewChanged(event.data);
        } else if (event instanceof ViewActivatedEvent) {
          this.handleViewActivated();
        } else if (event instanceof ViewDeactivatedEvent) {
          this.handleViewDeactivated();
        }
      })
    );
  }

  /**
   * 상태 업데이트
   * @param updater 상태 업데이트 함수
   */
  private updateState(updater: (state: ICardNavigatorState) => ICardNavigatorState): void {
    const newState = updater(this.stateSubject.value);
    this.stateSubject.next(newState);
    this.view?.updateState(newState);
  }

  /**
   * 카드 포커스 처리
   * @param cardId 포커스된 카드 ID
   */
  private handleCardFocused(cardId: string | null): void {
    this.updateState(state => ({
      ...state,
      focusedCardId: cardId
    }));
  }

  /**
   * 카드 선택 처리
   * @param cardId 선택된 카드 ID
   */
  private handleCardSelected(cardId: string): void {
    this.updateState(state => {
      const selectedCardIds = new Set(state.selectedCardIds);
      if (selectedCardIds.has(cardId)) {
        selectedCardIds.delete(cardId);
      } else {
        selectedCardIds.add(cardId);
      }
      return {
        ...state,
        selectedCardIds
      };
    });
  }

  /**
   * 카드 활성화 처리
   * @param cardId 활성화된 카드 ID
   */
  private handleCardActivated(cardId: string | null): void {
    this.updateState(state => ({
      ...state,
      activeCardId: cardId
    }));
  }

  /**
   * 검색 시작 처리
   * @param query 검색어
   */
  private handleSearchStarted(query: string): void {
    this.updateState(state => ({
      ...state,
      isSearchMode: true,
      searchQuery: query
    }));
  }

  /**
   * 검색 완료 처리
   * @param results 검색 결과
   */
  private handleSearchCompleted(results: any): void {
    this.updateState(state => ({
      ...state,
      isSearchMode: false,
      searchQuery: ''
    }));
  }

  /**
   * 검색 취소 처리
   */
  private handleSearchCleared(): void {
    this.isSearchMode = false;
    this.searchQuery = '';
    this.eventDispatcher.dispatch(new SearchClearedEvent());
    this.notifyViewUpdate();
  }

  /**
   * 레이아웃 변경 처리
   * @param layoutConfig 새로운 레이아웃 설정
   */
  private handleLayoutChanged(layoutConfig: any): void {
    this.updateState(state => ({
      ...state,
      currentLayoutConfig: layoutConfig
    }));
  }

  /**
   * 툴바 액션 처리
   * @param action 액션 타입
   */
  private handleToolbarAction(action: string): void {
    // 툴바 액션에 따른 처리
    switch (action) {
      case 'sort':
        // 정렬 처리
        break;
      case 'filter':
        // 필터 처리
        break;
      case 'search':
        // 검색 처리
        break;
      default:
        break;
    }
  }

  /**
   * 뷰 변경 처리
   * @param viewConfig 새로운 뷰 설정
   */
  private handleViewChanged(viewConfig: any): void {
    // 뷰 설정 업데이트
  }

  /**
   * 뷰 활성화 처리
   */
  private handleViewActivated(): void {
    this.eventDispatcher.dispatch(new ViewActivatedEvent());
    this.notifyViewUpdate();
  }

  /**
   * 뷰 비활성화 처리
   */
  private handleViewDeactivated(): void {
    this.eventDispatcher.dispatch(new ViewDeactivatedEvent());
    this.notifyViewUpdate();
  }

  /**
   * 카드 범위 선택
   * @param cardId 카드 ID
   */
  public async selectCardsInRange(cardId: string): Promise<void> {
    try {
      const cards = await this.cardService.getCards();
      const selectedCards = await this.cardService.getSelectedCards();
      const lastSelectedCardId = selectedCards[selectedCards.length - 1];
      
      if (!lastSelectedCardId) {
        await this.selectCard(cardId);
        return;
      }

      const startIndex = cards.findIndex(card => card.id === lastSelectedCardId);
      const endIndex = cards.findIndex(card => card.id === cardId);
      
      if (startIndex === -1 || endIndex === -1) {
        return;
      }

      const [minIndex, maxIndex] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
      const cardsToSelect = cards.slice(minIndex, maxIndex + 1);

      for (const card of cardsToSelect) {
        await this.selectCard(card.id);
      }
    } catch (error) {
      this.errorHandler.handleError(error, '카드 범위 선택 실패');
    }
  }

  /**
   * 카드 선택 토글
   * @param cardId 카드 ID
   */
  public async toggleCardSelection(cardId: string): Promise<void> {
    try {
      const selectedCards = await this.cardService.getSelectedCards();
      if (selectedCards.includes(cardId)) {
        await this.deselectCard(cardId);
      } else {
        await this.selectCard(cardId);
      }
    } catch (error) {
      this.errorHandler.handleError(error, '카드 선택 토글 실패');
    }
  }

  async createLinkBetweenCards(sourceCardId: string, targetCardId: string): Promise<void> {
    try {
      this.logger.debug(`카드 간 링크 생성: ${sourceCardId} -> ${targetCardId}`);
      
      // 소스 카드와 타겟 카드 가져오기
      const sourceCard = this.cardSetService.getCardById(sourceCardId);
      const targetCard = this.cardSetService.getCardById(targetCardId);
      
      if (!sourceCard || !targetCard) {
        throw new Error('카드를 찾을 수 없습니다.');
      }
      
      // 카드 간 링크 생성
      await this.cardInteractionService.createLink(sourceCard, targetCard);
      
      // 상태 업데이트
      this.updateState(state => ({
        ...state,
        currentCardSet: this.currentCardSet
      }));
      
      this.logger.debug('카드 간 링크 생성 완료');
    } catch (error) {
      this.errorHandler.handleError(error, '카드 간 링크 생성 실패');
      throw error;
    }
  }

  private async handleFileChanged(file: TFile | null): Promise<void> {
    this.logger.debug('활성 파일 변경 감지됨', { filePath: file?.path || 'null' });
    
    if (!file) {
      this.logger.debug('활성 파일이 없음, 처리 중단');
      return;
    }

    // 로딩 상태 표시
    if (this.view) {
      this.view.showLoading(true);
    }

    // 현재 선택된 카드셋 타입에 따라 처리
    let cardSetType: CardSetType = CardSetType.FOLDER; // 기본값
    
    // plugin.settings.defaultCardSetType이 실제 CardSetType 열거형에 있는 값인지 확인
    if (this.plugin.settings.defaultCardSetType && 
        Object.values(CardSetType).includes(this.plugin.settings.defaultCardSetType)) {
      cardSetType = this.plugin.settings.defaultCardSetType;
    }
    
    try {
      this.logger.debug('카드셋 업데이트 시작', { cardSetType });
      
      if (cardSetType === CardSetType.FOLDER) {
        // 폴더 모드 및 하위 폴더 설정 적용
        const folderSetMode = (this.plugin.settings as any).folderSetMode || 'active';
        let folderPath = folderSetMode === 'fixed' 
          ? ((this.plugin.settings as any).fixedFolderPath || '/')
          : (file.parent?.path || '/');
          
        this.logger.debug('폴더 카드셋 업데이트', { folderPath, mode: folderSetMode });
        await this.createCardSet(CardSetType.FOLDER, folderPath);
      } else if (cardSetType === CardSetType.TAG) {
        // 태그 모드 설정 적용
        const tagSetMode = (this.plugin.settings as any).tagSetMode || 'active';
        
        if (tagSetMode === 'fixed') {
          const tag = (this.plugin.settings as any).fixedTag || '';
          if (!tag) {
            this.logger.warn('고정 태그가 없어 카드셋을 생성할 수 없음');
            if (this.view) {
              this.view.showError('태그가 없어 카드셋을 생성할 수 없습니다.');
            }
          } else {
            this.logger.debug('고정 태그 카드셋 업데이트', { tag });
            await this.createCardSet(CardSetType.TAG, tag);
          }
        } else {
          // 활성 파일의 모든 태그 사용
          const fileTags = this.getActiveFileTags(file);
          if (fileTags.length === 0) {
            this.logger.warn('활성 파일에 태그가 없어 카드셋을 생성할 수 없음');
            if (this.view) {
              this.view.showError('활성 파일에 태그가 없어 카드셋을 생성할 수 없습니다.');
            }
          } else {
            this.logger.debug('태그 카드셋 업데이트 (다중 태그)', { tags: fileTags });
            await this.createMultiTagCardSet(fileTags);
          }
        }
      } else if (cardSetType === CardSetType.LINK) {
        if (!file) {
          this.logger.warn('활성 파일이 없어 링크 카드셋을 생성할 수 없음');
          if (this.view) {
            this.view.showError('활성 파일이 없어 링크 카드셋을 생성할 수 없습니다.');
          }
        } else {
          this.logger.debug('링크 카드셋 업데이트', { filePath: file.path });
          await this.createCardSet(CardSetType.LINK, file.path);
        }
      }
    } catch (error) {
      this.logger.error('활성 파일 변경 처리 실패', { error });
      if (this.view) {
        this.view.showError('활성 파일 변경 처리에 실패했습니다.');
      }
    } finally {
      // 로딩 상태 해제
      if (this.view) {
        this.view.showLoading(false);
      }
    }
  }
} 