import { TFile } from 'obsidian';
import { Container } from '@/infrastructure/di/Container';
import { ICardNavigatorViewModel } from '../interfaces/ICardNavigatorViewModel';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IActiveFileWatcher } from '@/domain/services/IActiveFileWatcher';
import { ICardSet } from '@/domain/models/CardSet';
import { ICardSetService } from '@/domain/services/ICardSetService';
import { ICardDisplayManager } from '@/domain/managers/ICardDisplayManager';
import { IRenderManager } from '@/domain/managers/IRenderManager';
import { ICardInteractionService, ContextMenuActionType, DragDropTargetType } from '@/domain/services/ICardInteractionService';
import { IPresetService } from '@/domain/services/IPresetService';
import { BehaviorSubject } from 'rxjs';
import { ICardNavigatorState, DEFAULT_CARD_NAVIGATOR_STATE } from '../../domain/models/CardNavigatorState';
import type CardNavigatorPlugin from '@/main';
import { ICardNavigatorView } from '../interfaces/ICardNavigatorView';
import { CardSetType } from '@/domain/models/CardSetConfig';
import { IRenderConfig } from '@/domain/models/CardConfig';
import { ICardStyle } from '@/domain/models/CardStyle';
import { FocusDirection } from '../interfaces/ICardNavigatorViewModel';
import { ICard } from '@/domain/models/Card';
import { RenderType } from '../../domain/models/CardConfig';
import { IPresetManager } from '../../domain/managers/IPresetManager';
import { DomainEvent } from '@/domain/events/DomainEvent';

// useCases import
import { OpenCardNavigatorUseCase } from '@/application/useCases/OpenCardNavigatorUseCase';
import { CreateCardSetUseCase } from '@/application/useCases/CreateCardSetUseCase';
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
  public readonly state: BehaviorSubject<ICardNavigatorState>;
  private readonly cardDisplayManager: ICardDisplayManager;
  private readonly renderManager: IRenderManager;
  private readonly presetManager: IPresetManager;
  private readonly errorHandler: IErrorHandler;
  private readonly loggingService: ILoggingService;
  private readonly eventDispatcher: IEventDispatcher;
  private readonly performanceMonitor: IPerformanceMonitor;
  private readonly analyticsService: IAnalyticsService;
  private readonly cardSetService: ICardSetService;
  private readonly cardInteractionService: ICardInteractionService;
  private readonly presetService: IPresetService;
  private plugin: CardNavigatorPlugin;
  private view: ICardNavigatorView | null = null;
  private activeFileWatcher: IActiveFileWatcher | null = null;

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

  private constructor() {
    try {
      const container = Container.getInstance();
      this.state = new BehaviorSubject<ICardNavigatorState>(DEFAULT_CARD_NAVIGATOR_STATE);
      this.loggingService = container.resolve<ILoggingService>('ILoggingService');
      this.errorHandler = container.resolve<IErrorHandler>('IErrorHandler');
      this.eventDispatcher = container.resolve<IEventDispatcher>('IEventDispatcher');
      this.performanceMonitor = container.resolve<IPerformanceMonitor>('IPerformanceMonitor');
      this.analyticsService = container.resolve<IAnalyticsService>('IAnalyticsService');
      this.cardSetService = container.resolve<ICardSetService>('ICardSetService');
      this.cardDisplayManager = container.resolve<ICardDisplayManager>('ICardDisplayManager');
      this.cardInteractionService = container.resolve<ICardInteractionService>('ICardInteractionService');
      this.presetService = container.resolve<IPresetService>('IPresetService');
      this.presetManager = container.resolve<IPresetManager>('IPresetManager');
      this.renderManager = container.resolveOptional<IRenderManager>('IRenderManager') || {} as IRenderManager;

      // ActiveFileWatcher 서비스 초기화
      this.activeFileWatcher = container.resolveOptional<IActiveFileWatcher>('IActiveFileWatcher');
      if (!this.activeFileWatcher) {
        this.loggingService.warn('IActiveFileWatcher 서비스 해결 실패, 일부 기능이 제한됩니다');
      }

      // useCases 주입
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

      // 이벤트 구독
      this.subscribeToEvents();
    } catch (error) {
      this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel 초기화 실패');
      throw error;
    }
  }

  public static getInstance(): CardNavigatorViewModel {
    if (!CardNavigatorViewModel.instance) {
      CardNavigatorViewModel.instance = new CardNavigatorViewModel();
    }
    return CardNavigatorViewModel.instance;
  }

  private subscribeToEvents(): void {
    // 카드셋 이벤트 구독
    this.eventDispatcher.subscribe('cardset:created', async (event: DomainEvent<'cardset:created'>) => {
      const data = event.data as { cardSet: ICardSet };
      await this.handleCardSetCreated(data.cardSet);
    });

    this.eventDispatcher.subscribe('cardset:updated', async (event: DomainEvent<'cardset:updated'>) => {
      const data = event.data as { cardSet: ICardSet };
      await this.handleCardSetUpdated(data.cardSet);
    });

    this.eventDispatcher.subscribe('cardset:deleted', async (event: DomainEvent<'cardset:deleted'>) => {
      const data = event.data as { cardSet: ICardSet };
      await this.handleCardSetDeleted(data.cardSet);
    });

    // 활성 파일 변경 이벤트 구독
    if (this.activeFileWatcher) {
      this.eventDispatcher.subscribe('active:file:changed', async (event: DomainEvent<'active:file:changed'>) => {
        const data = event.data as { file: TFile | null };
        if (data.file) {
          await this.handleActiveFileChanged(data.file);
        }
      });
    }
  }

  private async handleCardSetCreated(cardSet: ICardSet): Promise<void> {
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      cardSets: [...currentState.cardSets, cardSet]
    });
  }

  private async handleCardSetUpdated(cardSet: ICardSet): Promise<void> {
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      cardSets: currentState.cardSets.map(cs =>
        cs.id === cardSet.id ? cardSet : cs
      )
    });
  }

  private async handleCardSetDeleted(cardSet: ICardSet): Promise<void> {
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      cardSets: currentState.cardSets.filter(cs => cs.id !== cardSet.id)
    });
  }

  private async handleActiveFileChanged(file: TFile): Promise<void> {
    const currentState = this.state.getValue();
    this.state.next({
      ...currentState,
      activeFile: file.path
    });
  }

  public setView(view: ICardNavigatorView): void {
    this.view = view;
  }

  public async initialize(): Promise<void> {
    try {
      // 렌더 매니저 초기화
      await this.renderManager.initialize();
      
      // 카드 디스플레이 매니저 초기화
      await this.cardDisplayManager.initialize();
      
      // 초기 상태 설정
      const currentState = this.state.getValue();
      this.state.next({
        ...currentState,
        isSearchMode: false,
        searchQuery: ''
      });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '뷰모델 초기화 실패');
      throw error;
    }
  }

  public async moveFocus(direction: FocusDirection): Promise<void> {
    try {
      const currentState = this.state.getValue();
      const currentCardSet = this.getCurrentCardSet();
      
      if (!currentCardSet || !currentState.focusedCardId) {
        return;
      }
      
      // 현재 포커스된 카드의 인덱스 찾기
      const currentIndex = currentCardSet.cards.findIndex(card => card.id === currentState.focusedCardId);
      if (currentIndex === -1) return;
      
      // 새로운 인덱스 계산
      let newIndex = currentIndex;
      const containerDimensions = this.view?.getContainerDimensions() || { width: 0, height: 0 };
      const cardsPerRow = Math.floor(containerDimensions.width / 250); // 카드 너비 기준
      
      switch (direction) {
        case 'up':
          newIndex = Math.max(0, currentIndex - cardsPerRow);
          break;
        case 'down':
          newIndex = Math.min(currentCardSet.cards.length - 1, currentIndex + cardsPerRow);
          break;
        case 'left':
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case 'right':
          newIndex = Math.min(currentCardSet.cards.length - 1, currentIndex + 1);
          break;
      }
      
      // 새로운 포커스 설정
      if (newIndex !== currentIndex) {
        const newCardId = currentCardSet.cards[newIndex].id;
        await this.focusCard(newCardId);
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, '포커스 이동 실패');
    }
  }

  public async openFocusedCard(): Promise<void> {
    try {
      const currentState = this.state.getValue();
      if (currentState.focusedCardId) {
        await this.activateCard(currentState.focusedCardId);
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, '포커스된 카드 열기 실패');
    }
  }

  public clearFocus(): void {
    try {
      const currentState = this.state.getValue();
      this.state.next({
        ...currentState,
        focusedCardId: null
      });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '포커스 해제 실패');
    }
  }

  public async selectCard(cardId: string): Promise<void> {
    try {
      const currentCardSet = this.getCurrentCardSet();
      if (!currentCardSet) return;

      const card = currentCardSet.cards.find(c => c.id === cardId);
      if (!card) return;

      const selectedCards = await this.selectCardsUseCase.execute({ card, type: 'single' });
      if (selectedCards.length > 0) {
        const currentState = this.state.getValue();
        this.state.next({
          ...currentState,
          selectedCardIds: new Set([cardId])
        });
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 선택 실패');
      throw error;
    }
  }

  public async deselectCard(cardId: string): Promise<void> {
    try {
      const currentState = this.state.getValue();
      const newSelectedCards = new Set(currentState.selectedCardIds);
      newSelectedCards.delete(cardId);
      
      this.state.next({
        ...currentState,
        selectedCardIds: newSelectedCards
      });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 선택 해제 실패');
    }
  }

  public async selectCardsInRange(cardId: string): Promise<void> {
    try {
      const currentState = this.state.getValue();
      const currentCardSet = this.getCurrentCardSet();
      
      if (!currentCardSet || !currentState.selectedCardIds.size) {
        await this.selectCard(cardId);
        return;
      }
      
      // 범위의 시작과 끝 인덱스 찾기
      const lastSelectedCard = Array.from(currentState.selectedCardIds).pop() as string;
      const startIndex = currentCardSet.cards.findIndex(card => card.id === lastSelectedCard);
      const endIndex = currentCardSet.cards.findIndex(card => card.id === cardId);
      
      if (startIndex === -1 || endIndex === -1) return;
      
      // 범위 내의 모든 카드 선택
      const newSelectedCards = new Set(currentState.selectedCardIds);
      const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
      
      for (let i = min; i <= max; i++) {
        newSelectedCards.add(currentCardSet.cards[i].id);
      }
      
      this.state.next({
        ...currentState,
        selectedCardIds: newSelectedCards
      });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 범위 선택 실패');
    }
  }

  public async toggleCardSelection(cardId: string): Promise<void> {
    try {
      const currentState = this.state.getValue();
      const newSelectedCards = new Set(currentState.selectedCardIds);
      
      if (newSelectedCards.has(cardId)) {
        newSelectedCards.delete(cardId);
      } else {
        newSelectedCards.add(cardId);
      }
      
      this.state.next({
        ...currentState,
        selectedCardIds: newSelectedCards
      });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 선택 토글 실패');
    }
  }

  public async focusCard(cardId: string): Promise<void> {
    try {
      const currentState = this.state.getValue();
      this.state.next({
        ...currentState,
        focusedCardId: cardId
      });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 포커스 실패');
    }
  }

  public async activateCard(cardId: string): Promise<void> {
    try {
      const currentState = this.state.getValue();
      this.state.next({
        ...currentState,
        activeCardId: cardId
      });
      
      // 카드 활성화 처리
      const currentCardSet = this.getCurrentCardSet();
      if (currentCardSet) {
        const card = currentCardSet.cards.find(c => c.id === cardId);
        if (card) {
          await this.cardInteractionService.openFile(card.file);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 활성화 실패');
    }
  }

  public async deactivateCard(cardId: string): Promise<void> {
    try {
      const currentState = this.state.getValue();
      if (currentState.activeCardId === cardId) {
        this.state.next({
          ...currentState,
          activeCardId: null
        });
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 비활성화 실패');
    }
  }

  public showCardContextMenu(cardId: string, event: MouseEvent): void {
    try {
      const currentCardSet = this.getCurrentCardSet();
      if (!currentCardSet) return;
      
      const card = currentCardSet.cards.find(c => c.id === cardId);
      if (!card) return;
      
      this.cardInteractionService.executeContextMenuAction(card.file, ContextMenuActionType.COPY_LINK);
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 컨텍스트 메뉴 표시 실패');
    }
  }

  public startCardDrag(cardId: string, event: DragEvent): void {
    try {
      const currentCardSet = this.getCurrentCardSet();
      if (!currentCardSet) return;
      
      const card = currentCardSet.cards.find(c => c.id === cardId);
      if (!card) return;
      
      this.cardInteractionService.handleDragDrop(card.file, { type: DragDropTargetType.CARD, file: card.file });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 드래그 시작 실패');
    }
  }

  public handleCardDragOver(cardId: string, event: DragEvent): void {
    try {
      const currentCardSet = this.getCurrentCardSet();
      if (!currentCardSet) return;
      
      const card = currentCardSet.cards.find(c => c.id === cardId);
      if (!card) return;
      
      this.cardInteractionService.handleDragDrop(card.file, { type: DragDropTargetType.CARD, file: card.file });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 드래그 오버 처리 실패');
    }
  }

  public handleCardDrop(cardId: string, event: DragEvent): void {
    try {
      const currentCardSet = this.getCurrentCardSet();
      if (!currentCardSet) return;
      
      const card = currentCardSet.cards.find(c => c.id === cardId);
      if (!card) return;
      
      this.cardInteractionService.handleDragDrop(card.file, { type: DragDropTargetType.CARD, file: card.file });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 드롭 처리 실패');
    }
  }

  public async scrollToCard(cardId: string): Promise<void> {
    try {
      if (this.view) {
        await this.view.scrollToCard(cardId);
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 스크롤 실패');
    }
  }

  public getContainerDimensions(): { width: number; height: number } {
    return this.view?.getContainerDimensions() || { width: 0, height: 0 };
  }

  public getRenderConfig(): IRenderConfig {
    const config = this.state.getValue().currentCardConfig;
    this.cardDisplayManager.updateRenderConfig(config);
    return {
      type: config.renderType === 'html' ? RenderType.HTML : RenderType.TEXT,
      showImages: true,
      highlightCode: true,
      supportCallouts: true,
      supportMath: true,
      contentLengthLimitEnabled: false,
      contentLengthLimit: 200
    };
  }

  public getCardStyle(): ICardStyle {
    const style = this.state.getValue().currentCardStyle;
    const cardId = this.state.getValue().activeCardId;
    if (cardId) {
      this.cardDisplayManager.updateCardStyle(cardId, style);
    }
    return style;
  }

  public getCurrentCardSet(): ICardSet | null {
    const state = this.state.getValue();
    const cardSets = state.cardSets;
    return cardSets.length > 0 ? cardSets[0] : null;
  }

  public async createLinkBetweenCards(sourceCardId: string, targetCardId: string): Promise<void> {
    try {
      const currentCardSet = this.getCurrentCardSet();
      if (!currentCardSet) return;
      
      const sourceCard = currentCardSet.cards.find(c => c.id === sourceCardId);
      const targetCard = currentCardSet.cards.find(c => c.id === targetCardId);
      
      if (!sourceCard || !targetCard) return;
      
      await this.cardInteractionService.createLink(sourceCard, targetCard);
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 간 링크 생성 실패');
    }
  }

  public async openCardNavigator(): Promise<void> {
    try {
      await this.openCardNavigatorUseCase.execute();
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 내비게이터 열기 실패');
    }
  }

  public async createCardSet(type: CardSetType, config: any): Promise<ICardSet> {
    try {
      return await this.createCardSetUseCase.execute({ type, criteria: config.criteria, containerWidth: window.innerWidth, containerHeight: window.innerHeight });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드셋 생성 실패');
      throw error;
    }
  }

  public async sortCardSet(cardSet: ICardSet, sortConfig: any): Promise<void> {
    try {
      await this.sortCardSetUseCase.execute({ cardSet, sortConfig });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드셋 정렬 실패');
      throw error;
    }
  }

  public async selectCards(card: ICard): Promise<void> {
    try {
      await this.selectCardsUseCase.execute({ card, type: 'single' });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 선택 실패');
      throw error;
    }
  }

  public async navigateCard(direction: FocusDirection): Promise<void> {
    try {
      await this.navigateCardUseCase.execute({ direction });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 탐색 실패');
      throw error;
    }
  }

  public async interactCard(card: ICard, interactionType: string): Promise<void> {
    try {
      await this.interactCardUseCase.execute({ card, type: interactionType as 'click' | 'contextMenu' | 'dragDrop' | 'doubleClick' });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 상호작용 실패');
      throw error;
    }
  }

  public async managePreset(type: 'create' | 'update' | 'delete' | 'clone' | 'export', preset?: any): Promise<any> {
    try {
      return await this.managePresetUseCase.execute({ type, preset });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '프리셋 관리 실패');
      throw error;
    }
  }

  public async mapPreset(presetId: string, targetId: string, type: 'folder' | 'tag'): Promise<void> {
    try {
      if (type === 'folder') {
        await this.presetManager.mapPresetToFolder(presetId, targetId);
      } else {
        await this.presetManager.mapPresetToTag(presetId, targetId);
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, '프리셋 매핑 실패');
      throw error;
    }
  }

  public async handleToolbar(action: 'search' | 'changeCardSetType' | 'applySort' | 'toggleSetting'): Promise<void> {
    try {
      await this.handleToolbarUseCase.execute({ action, value: null });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '툴바 처리 실패');
      throw error;
    }
  }

  public async customizeCard(card: ICard, config: any, style: any): Promise<void> {
    try {
      await this.customizeCardUseCase.execute({ card, renderConfig: config, style });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드 커스터마이징 실패');
      throw error;
    }
  }

  public async applyLayout(cardSet: ICardSet, containerWidth: number, containerHeight: number): Promise<void> {
    try {
      const layout = this.state.getValue().currentLayoutConfig;
      await this.applyLayoutUseCase.execute({ cardSet, layout, containerWidth, containerHeight });
    } catch (error) {
      this.errorHandler.handleError(error as Error, '레이아웃 적용 실패');
      throw error;
    }
  }

  public async cleanup(): Promise<void> {
    // No need to unsubscribe from events as they are handled by the event dispatcher
  }
} 