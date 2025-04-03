import { App, View, Menu, Editor } from 'obsidian';
import { Container } from '@/infrastructure/di/Container';
import { ICardNavigatorViewModel, FocusDirection } from './ICardNavigatorViewModel';
import { ICardService } from '@/domain/services/ICardService';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { ISearchService } from '@/domain/services/ISearchService';
import { ISortService } from '@/domain/services/ISortService';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { IEventDispatcher } from '@/domain/interfaces/infrastructure/IEventDispatcher';
import { IPerformanceMonitor } from '@/domain/interfaces/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/interfaces/infrastructure/IAnalyticsService';
import { IActiveFileWatcher } from '@/domain/services/IActiveFileWatcher';
import { CardSetCreatedEvent, CardSetUpdatedEvent, CardSetDeletedEvent } from '@/domain/events/CardSetEvents';
import { ICardSet } from '@/domain/models/CardSet';
import { CardSetType } from '@/domain/models/CardSet';
import { ICardSetService } from '@/domain/services/ICardSetService';
import { ICardDisplayManager } from '@/domain/managers/ICardDisplayManager';
import { ICardInteractionService } from '@/domain/services/ICardInteractionService';
import { ICardRenderConfig } from '@/domain/models/CardRenderConfig';
import { ICardStyle } from '@/domain/models/CardStyle';
import { ICardNavigatorView } from '../views/ICardNavigatorView';

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
  private view: ICardNavigatorView;

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

  private constructor() {
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
    this.view = view;
  }

  async initialize(): Promise<void> {
    const perfMark = 'CardNavigatorViewModel.initialize';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.logger.debug('카드 내비게이터 뷰모델 초기화 시작');
      this.analyticsService.trackEvent('CardNavigatorViewModel.initialize.start');

      // ActiveFileWatcher 초기화
      const activeFileWatcher = Container.getInstance().resolve<IActiveFileWatcher>('IActiveFileWatcher');
      await activeFileWatcher.initialize();

      // 카드 내비게이터 열기
      await this.openCardNavigatorUseCase.execute();

      // 현재 카드셋 가져오기
      const activeFile = activeFileWatcher.getActiveFile();
      if (activeFile) {
        const activeFolder = activeFile.parent?.path || '/';
        this.currentCardSet = await this.cardSetService.getCardSetByFolder(activeFolder);
      } else {
        this.currentCardSet = await this.cardSetService.getCardSetByFolder('/');
      }

      // 카드셋이 생성되었는지 확인
      if (this.currentCardSet) {
        // 카드셋 표시
        this.view.updateCardSet(this.currentCardSet);
        
        // 활성 카드 포커스
        if (this.activeCardId) {
          await this.focusCard(this.activeCardId);
        }
      }

      this.logger.debug('카드 내비게이터 뷰모델 초기화 완료');
      this.analyticsService.trackEvent('CardNavigatorViewModel.initialize.complete');
    } catch (error) {
      this.errorHandler.handleError(error, '카드 내비게이터 뷰모델 초기화 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.initialize.error', { error: error.message });
      throw error;
    } finally {
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

  async selectCard(cardId: string): Promise<void> {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.selectCard');
      this.analyticsService.trackEvent('CardNavigatorViewModel.selectCard', { cardId });

      const card = await this.cardService.getCardById(cardId);
      if (!card) return;

      this.selectedCardIds.add(cardId);
      this.cardDisplayManager.selectCard(cardId);
      this.cardInteractionService.openFile(card.file);
    } catch (error) {
      this.errorHandler.handleError(error, '카드 선택 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.selectCard.error', { error: error.message });
      throw error;
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.selectCard');
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

  private async handleCardSetUpdated(event: CardSetUpdatedEvent): Promise<void> {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.handleCardSetUpdated');
      this.logger.debug('카드셋 업데이트 이벤트 처리');
      this.analyticsService.trackEvent('CardNavigatorViewModel.handleCardSetUpdated', { cardSetId: event.cardSet.id });

      // 레이아웃 업데이트는 CardDisplayManager가 처리
      this.cardDisplayManager.displayCardSet(event.cardSet);
      
      // 뷰 업데이트
      if (this.view) {
        (this.view as any).updateCardSet(event.cardSet);
      }
    } catch (error) {
      this.errorHandler.handleError(error, '카드셋 업데이트 이벤트 처리 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.handleCardSetUpdated.error', { error: error.message });
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.handleCardSetUpdated');
    }
  }

  private async handleCardSetDeleted(event: CardSetDeletedEvent): Promise<void> {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.handleCardSetDeleted');
      this.logger.debug('카드셋 삭제 이벤트 처리');
      this.analyticsService.trackEvent('CardNavigatorViewModel.handleCardSetDeleted', { cardSetId: event.cardSetId });

      // 레이아웃 업데이트는 CardDisplayManager가 처리
      this.currentCardSet = null;
    } catch (error) {
      this.errorHandler.handleError(error, '카드셋 삭제 이벤트 처리 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.handleCardSetDeleted.error', { error: error.message });
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.handleCardSetDeleted');
    }
  }

  async createCardSet(type: CardSetType, criteria: string): Promise<void> {
    try {
      this.logger.debug('카드셋 생성 시작', { type, criteria });
      const input: CreateCardSetInput = {
        type,
        criteria,
        containerWidth: this.getContainerDimensions().width,
        containerHeight: this.getContainerDimensions().height
      };
      this.currentCardSet = await this.createCardSetUseCase.execute(input);
      this.logger.debug('카드셋 생성 완료', { cardSetId: this.currentCardSet.id });
    } catch (error) {
      this.errorHandler.handleError(error, '카드셋 생성');
      throw error;
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

  async deselectCard(cardId: string): Promise<void> {
    try {
      this.performanceMonitor.startMeasure('CardNavigatorViewModel.deselectCard');
      this.analyticsService.trackEvent('CardNavigatorViewModel.deselectCard', { cardId });

      this.selectedCardIds.delete(cardId);
      // TODO: cardDisplayManager에 deselectCard 메서드 추가 필요
    } catch (error) {
      this.errorHandler.handleError(error, '카드 선택 해제 실패');
      this.analyticsService.trackEvent('CardNavigatorViewModel.deselectCard.error', { error: error.message });
      throw error;
    } finally {
      this.performanceMonitor.endMeasure('CardNavigatorViewModel.deselectCard');
    }
  }

  async focusCard(cardId: string): Promise<void> {
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
} 