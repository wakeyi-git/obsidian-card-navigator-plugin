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
import { CardSetType } from '@/domain/models/CardSet';
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

  constructor() {
    try {
      const container = Container.getInstance();
      console.debug('CardNavigatorViewModel 생성자 시작');

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
      this.logger.debug('카드 내비게이터 뷰모델 초기화 시작');
      this.analyticsService.trackEvent('CardNavigatorViewModel.initialize.start');

      // 1. 로딩 상태 표시
      if (this.view) {
        this.view.showLoading(true);
      }

      // 2. ActiveFileWatcher 초기화
      const activeFileWatcher = Container.getInstance().resolve<IActiveFileWatcher>('IActiveFileWatcher');
      await activeFileWatcher.initialize();
      this.logger.debug('활성 파일 감시자 초기화 완료');

      // 3. 활성 파일 정보 가져오기
      const activeFile = activeFileWatcher.getActiveFile();
      let folderPath = '/';
      
      if (activeFile) {
        this.logger.debug('활성 파일 감지됨', { filePath: activeFile.path });
        folderPath = activeFile.parent?.path || '/';
        this.logger.debug('활성 폴더 경로', { folderPath });
      } else {
        this.logger.debug('활성 파일이 없음, 루트 폴더 사용');
      }

      // 4. 카드셋 생성
      try {
        this.logger.debug('카드셋 생성 시작', { folderPath });
        this.currentCardSet = await this.cardSetService.getCardSetByFolder(folderPath);
        
        if (!this.currentCardSet) {
          throw new Error('카드셋 생성 실패: null 반환됨');
        }
        
        this.logger.debug('카드셋 생성 완료', { 
          cardSetId: this.currentCardSet.id, 
          cardCount: this.currentCardSet.cards.length 
        });

        // 5. 카드 디스플레이 매니저에 카드셋 설정
        this.cardDisplayManager.displayCardSet(this.currentCardSet);
        this.logger.debug('카드 디스플레이 매니저에 카드셋 설정 완료');
        
        // 6. 뷰에 카드셋 업데이트
        if (this.view) {
          this.view.updateCardSet(this.currentCardSet);
          this.logger.debug('뷰에 카드셋 업데이트 완료');
        } else {
          this.logger.warn('뷰가 없어 카드셋을 표시할 수 없음');
        }
        
        // 7. 활성 카드 포커스
        if (activeFile && this.currentCardSet.cards.length > 0) {
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

      // 8. 활성 파일 변경 이벤트 구독
      activeFileWatcher.subscribeToActiveFileChanges(this.handleFileChanged.bind(this));
      this.logger.debug('활성 파일 변경 이벤트 구독 완료');

      // 9. 상태 업데이트
      this.updateState(state => ({
        ...state,
        currentCardSet: this.currentCardSet,
        focusedCardId: this.focusedCardId,
        selectedCardIds: this.selectedCardIds,
        activeCardId: this.activeCardId
      }));

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
      // 10. 로딩 상태 종료
      if (this.view) {
        this.view.showLoading(false);
      }
      
      this.performanceMonitor.endMeasure(perfMark);
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

  private async handleCardSetCreated(event: CardSetCreatedEvent): Promise<void> {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.handleCardSetCreated');
      this.logger.debug('카드셋 생성 이벤트 처리');
      this.analyticsService.trackEvent('CardNavigatorViewModel.handleCardSetCreated', { cardSetId: event.cardSet.id });

      // 레이아웃 업데이트는 CardDisplayManager가 처리
      this.cardDisplayManager.displayCardSet(event.cardSet);
      
      // 뷰 업데이트
      if (this.view) {
        (this.view as any).updateCardSet(event.cardSet);
      }
    } catch (error) {
      this.errorHandler.handleError(error, '카드셋 생성 이벤트 처리 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.handleCardSetCreated.error', { error: error.message });
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.handleCardSetCreated');
    }
  }

  private handleCardSetUpdated(cardSet: ICardSet): void {
    this.currentCardSet = cardSet;
    this.eventDispatcher.dispatch(new CardSetUpdatedEvent(cardSet));
    this.notifyViewUpdate();
  }

  private handleCardSetDeleted(cardSetId: string): void {
    if (this.currentCardSet?.id === cardSetId) {
      this.currentCardSet = null;
    }
    this.eventDispatcher.dispatch(new CardSetDeletedEvent(cardSetId));
    this.notifyViewUpdate();
  }

  async createCardSet(type: CardSetType, criteria: string): Promise<void> {
    try {
      this.logger.debug('카드셋 생성 시작', { type, criteria });
      
      // 로딩 상태 설정
      if (this.view) {
        this.view.showLoading(true);
      }
      
      // 1. 카드셋 생성
      const input: CreateCardSetInput = {
        type,
        criteria,
        containerWidth: this.getContainerDimensions().width,
        containerHeight: this.getContainerDimensions().height
      };
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

  private handleFileChanged(file: TFile | null): void {
    this.logger.debug('활성 파일 변경 감지됨', { filePath: file?.path || 'null' });
    
    if (!file) {
      this.logger.debug('활성 파일이 없음, 처리 중단');
      return;
    }

    // 로딩 상태 표시
    if (this.view) {
      this.view.showLoading(true);
    }

    // 폴더 경로 확인
    const folderPath = file.parent?.path || '/';
    this.logger.debug('활성 파일의 폴더 경로', { folderPath });
    
    // 활성 폴더 기반으로 카드셋 업데이트
    this.logger.debug('활성 폴더 기반으로 카드셋 업데이트 시작', { folderPath });
    
    this.createCardSet(CardSetType.FOLDER, folderPath)
      .then(cardSet => {
        this.logger.info('활성 폴더 기반 카드셋 생성 완료', { 
          folderPath, 
          cardCount: this.currentCardSet?.cards.length || 0 
        });
        
        // 카드 디스플레이 매니저에 카드셋 설정
        if (this.currentCardSet) {
          this.cardDisplayManager.displayCardSet(this.currentCardSet);
          this.logger.debug('카드 디스플레이 매니저에 카드셋 설정 완료');
        }
        
        // 활성 카드 포커스
        const activeCard = this.currentCardSet?.cards.find(card => 
          card.file && card.file.path === file.path
        );
        
        if (activeCard) {
          this.focusCard(activeCard.id)
            .then(() => {
              this.activeCardId = activeCard.id;
              this.logger.debug('활성 카드 포커스 완료', { cardId: activeCard.id });
            })
            .catch(error => {
              this.logger.error('활성 카드 포커스 실패', { error });
            });
        }
      })
      .catch(error => {
        this.logger.error('활성 폴더 기반 카드셋 생성 실패', { error, folderPath });
        if (this.view) {
          this.view.showError(`폴더 '${folderPath}'에 대한 카드셋을 생성할 수 없습니다.`);
        }
      })
      .finally(() => {
        // 로딩 상태 해제
        if (this.view) {
          this.view.showLoading(false);
        }
      });
  }
} 