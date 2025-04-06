import { ItemView, WorkspaceLeaf, setIcon } from 'obsidian';
import { ICardNavigatorViewModel } from '../interfaces/ICardNavigatorViewModel';
import { Container } from '@/infrastructure/di/Container';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ICardSet } from '@/domain/models/CardSet';
import { ICardNavigatorView } from '../interfaces/ICardNavigatorView';
import { ICardDisplayManager } from '@/domain/managers/ICardDisplayManager';
import { IRenderManager } from '@/domain/managers/IRenderManager';
import { ICardNavigatorState, DEFAULT_CARD_NAVIGATOR_STATE } from '../../domain/models/CardNavigatorState';
import { Throttler } from '@/domain/utils/Throttler';
import { BehaviorSubject, Subscription } from 'rxjs';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';

export const VIEW_TYPE_CARD_NAVIGATOR = 'card-navigator-view';

export class CardNavigatorView extends ItemView implements ICardNavigatorView {
  private static instance: CardNavigatorView;
  private state: BehaviorSubject<ICardNavigatorState>;
  private subscriptions: Subscription[] = [];
  private loggingService: ILoggingService;
  private errorHandler: IErrorHandler;
  private cardDisplayManager: ICardDisplayManager;
  private renderManager: IRenderManager;
  private viewModel: ICardNavigatorViewModel;
  private eventDispatcher: IEventDispatcher;
  private container: HTMLElement;
  private cardContainer: HTMLElement | null = null;
  private loadingIndicator: HTMLElement;
  private errorMessage: HTMLElement;
  private message: HTMLElement;
  private isInitialized: boolean = false;
  private pendingState: ICardNavigatorState | null = null;
  private initializationPromise: Promise<void> | null = null;
  private updateStateThrottler: Throttler<[ICardNavigatorState], Promise<void>>;
  private readonly UPDATE_THROTTLE_DELAY = 150; // 150ms 쓰로틀링

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    try {
      this.state = new BehaviorSubject<ICardNavigatorState>(DEFAULT_CARD_NAVIGATOR_STATE);

      const container = Container.getInstance();
      this.loggingService = container.resolve<ILoggingService>('ILoggingService');
      this.errorHandler = container.resolve<IErrorHandler>('IErrorHandler');
      this.cardDisplayManager = container.resolve<ICardDisplayManager>('ICardDisplayManager');
      this.renderManager = container.resolve<IRenderManager>('IRenderManager');
      this.viewModel = container.resolve<ICardNavigatorViewModel>('ICardNavigatorViewModel');
      this.eventDispatcher = container.resolve<IEventDispatcher>('IEventDispatcher');

      // 기본 요소 초기화
      this.container = document.createElement('div');
      this.container.className = 'card-navigator';
      
      // 상태 업데이트 쓰로틀러 초기화
      this.updateStateThrottler = new Throttler(
        (state: ICardNavigatorState) => this.processStateUpdate(state),
        this.UPDATE_THROTTLE_DELAY
      );

      // 이벤트 구독
      this.subscribeToEvents();
    } catch (error) {
      this.errorHandler.handleError(error as Error, 'CardNavigatorView 초기화 실패');
      throw error;
    }
  }

  public static getInstance(leaf: WorkspaceLeaf): CardNavigatorView {
    if (!CardNavigatorView.instance) {
      CardNavigatorView.instance = new CardNavigatorView(leaf);
    }
    return CardNavigatorView.instance;
  }

  private subscribeToEvents(): void {
    // 카드셋 이벤트 구독
    this.subscriptions.push(
      this.eventDispatcher.subscribe(DomainEventType.CARDSET_CREATED, async (event: DomainEvent<'cardset:created'>) => {
        const data = event.data as { cardSet: ICardSet };
        await this.handleCardSetCreated(data.cardSet);
      })
    );

    this.subscriptions.push(
      this.eventDispatcher.subscribe(DomainEventType.CARDSET_UPDATED, async (event: DomainEvent<'cardset:updated'>) => {
        const data = event.data as { cardSet: ICardSet };
        await this.handleCardSetUpdated(data.cardSet);
      })
    );

    this.subscriptions.push(
      this.eventDispatcher.subscribe(DomainEventType.CARDSET_DELETED, async (event: DomainEvent<'cardset:deleted'>) => {
        const data = event.data as { cardSet: ICardSet };
        await this.handleCardSetDeleted(data.cardSet);
      })
    );

    // 상태 변경 이벤트 구독
    this.subscriptions.push(
      this.viewModel.state.subscribe((state: ICardNavigatorState) => {
        this.updateState(state);
      })
    );
  }

  public getViewType(): string {
    return VIEW_TYPE_CARD_NAVIGATOR;
  }

  public getDisplayText(): string {
    return '카드 내비게이터';
  }

  public getIcon(): string {
    return 'layers';
  }

  public override getState(): Record<string, unknown> {
    return {
      type: 'card-navigator-state',
      ...this.state.getValue()
    };
  }

  public async updateState(state: ICardNavigatorState): Promise<void> {
    if (!this.isInitialized) {
      this.loggingService.debug('뷰가 아직 초기화되지 않음, 상태 업데이트 보류');
      this.pendingState = state;
      return;
    }

    try {
      // 쓰로틀링 적용된 상태 업데이트
      await this.updateStateThrottler.throttle(state);
    } catch (error) {
      this.errorHandler.handleError(error, '상태 업데이트 실패');
    }
  }

  public showError(message: string): void {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.style.display = 'block';
    }
  }

  public showLoading(isLoading: boolean): void {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
  }

  public showMessage(message: string): void {
    if (this.message) {
      this.message.textContent = message;
      this.message.style.display = 'block';
    }
  }

  public getContainerDimensions(): { width: number; height: number } {
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    };
  }

  public async cleanup(): Promise<void> {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions = [];
  }

  async onOpen(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        this.loggingService.debug('CardNavigatorView 열기 시작');
        
        // 뷰 컨테이너 초기화
        const container = this.containerEl.children[1];
        this.loggingService.debug('뷰 컨테이너 DOM 요소:', container);
        container.empty();
        container.addClass('card-navigator-container');
        
        // 툴바 초기화
        this.cardContainer = container.createDiv('card-navigator-toolbar');
        this.loggingService.debug('툴바 생성됨');
        
        // 카드 그리드 초기화
        this.cardContainer = container.createDiv('card-navigator-grid');
        this.loggingService.debug('카드 그리드 생성됨');
        
        // 로딩 인디케이터 초기화
        this.loadingIndicator = container.createDiv('card-navigator-loading-overlay');
        this.loadingIndicator.style.display = 'none';
        
        // 에러 메시지 컨테이너 초기화
        this.errorMessage = container.createDiv('card-navigator-error');
        this.errorMessage.style.display = 'none';
        
        // 메시지 컨테이너 초기화
        this.message = container.createDiv('card-navigator-message');
        this.message.style.display = 'none';
        
        // 이벤트 리스너 등록
        this.registerEventListeners();
        this.subscribeToEvents();
        this.loggingService.debug('이벤트 리스너 등록 완료');

        // 창 크기 변경 이벤트 등록
        this.registerDomEvent(window, 'resize', this.onResize.bind(this));
        this.loggingService.debug('창 크기 변경 이벤트 등록 완료');
        
        // 초기화 완료 표시
        this.isInitialized = true;
        this.loggingService.debug('CardNavigatorView 초기화 완료');
        
        // 보류 중인 상태 업데이트 처리
        if (this.pendingState) {
          this.loggingService.debug('보류 중인 상태 업데이트 적용');
          await this.updateState(this.pendingState);
          this.pendingState = null;
        }
        
        this.loggingService.debug('CardNavigatorView 열기 완료');
      } catch (error) {
        this.loggingService.error('CardNavigatorView 열기 실패', error);
        this.errorHandler.handleError(error, 'CardNavigatorView 열기 실패');
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  async onClose(): Promise<void> {
    try {
      this.loggingService.debug('카드 내비게이터 뷰 닫기 시작');

      // 이벤트 리스너 해제
      this.unregisterEventListeners();

      // 뷰모델 정리
      await this.viewModel.cleanup();

      this.loggingService.debug('카드 내비게이터 뷰 닫기 완료');
    } catch (error) {
      this.errorHandler.handleError(error, '카드 내비게이터 뷰 닫기 실패');
      throw error;
    }
  }

  private registerEventListeners(): void {
    // 키보드 이벤트
    this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
      this.handleKeyDown(evt);
    });

    // 마우스 이벤트
    this.registerDomEvent(this.containerEl, 'click', (evt: MouseEvent) => {
      this.handleCardClick(evt);
    });

    this.registerDomEvent(this.containerEl, 'dblclick', (evt: MouseEvent) => {
      this.handleCardDoubleClick(evt);
    });

    this.registerDomEvent(this.containerEl, 'contextmenu', (evt: MouseEvent) => {
      this.handleCardContextMenu(evt);
    });

    // 드래그 앤 드롭 이벤트
    this.registerDomEvent(this.containerEl, 'dragstart', (evt: DragEvent) => {
      this.handleDragStart(evt);
    });

    this.registerDomEvent(this.containerEl, 'dragover', (evt: DragEvent) => {
      this.handleDragOver(evt);
    });

    this.registerDomEvent(this.containerEl, 'drop', (evt: DragEvent) => {
      this.handleDrop(evt);
    });

    this.registerDomEvent(this.containerEl, 'dragend', (evt: DragEvent) => {
      this.handleDragEnd(evt);
    });
  }

  private unregisterEventListeners(): void {
    // 이벤트 리스너 해제는 Obsidian의 registerDomEvent가 자동으로 처리
  }

  private handleKeyDown(evt: KeyboardEvent): void {
    try {
      switch (evt.key) {
        case 'ArrowUp':
          this.viewModel.moveFocus('up');
          break;
        case 'ArrowDown':
          this.viewModel.moveFocus('down');
          break;
        case 'ArrowLeft':
          this.viewModel.moveFocus('left');
          break;
        case 'ArrowRight':
          this.viewModel.moveFocus('right');
          break;
        case 'Enter':
          this.viewModel.openFocusedCard();
          break;
        case 'Escape':
          this.viewModel.clearFocus();
          break;
      }
    } catch (error) {
      this.errorHandler.handleError(error, '키보드 이벤트 처리 실패');
    }
  }

  private handleCardClick(event: MouseEvent): void {
    try {
      const target = event.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        if (cardId) {
          // 시각적 피드백을 위한 클래스 추가
          if (event.shiftKey) {
            // 범위 선택 시 시각적 피드백
            this.viewModel.selectCardsInRange(cardId);
            cardElement.classList.add('range-selected');
          } else if (event.ctrlKey) {
            // 다중 선택 시 시각적 피드백
            this.viewModel.toggleCardSelection(cardId);
            cardElement.classList.toggle('selected');
          } else {
            // 단일 선택 시 시각적 피드백
            this.viewModel.selectCard(cardId);
            cardElement.classList.add('selected');
          }
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '카드 클릭 이벤트 처리 실패');
      // 사용자에게 에러 메시지 표시
      this.showError('카드 선택 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }

  private handleCardDoubleClick(event: MouseEvent): void {
    try {
      const target = event.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        if (cardId) {
          this.viewModel.activateCard(cardId);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '카드 더블클릭 이벤트 처리 실패');
    }
  }

  private handleCardContextMenu(event: MouseEvent): void {
    try {
      event.preventDefault();
      const target = event.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        if (cardId) {
          this.viewModel.showCardContextMenu(cardId, event);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '컨텍스트 메뉴 이벤트 처리 실패');
    }
  }

  private handleDragStart(event: DragEvent): void {
    try {
      const target = event.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        if (cardId) {
          // 드래그 데이터 설정
          event.dataTransfer?.setData('text/plain', cardId);
          event.dataTransfer?.setData('application/json', JSON.stringify({
            type: 'card',
            id: cardId
          }));
          
          // 드래그 중인 카드에 시각적 피드백 추가
          cardElement.classList.add('dragging');
          
          // 드래그 이미지 설정
          const dragImage = cardElement.cloneNode(true) as HTMLElement;
          dragImage.style.width = '200px';
          dragImage.style.opacity = '0.8';
          event.dataTransfer?.setDragImage(dragImage, 100, 50);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '드래그 시작 이벤트 처리 실패');
    }
  }

  private handleDragOver(event: DragEvent): void {
    try {
      event.preventDefault();
      const target = event.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        // 드롭 가능 영역 표시
        cardElement.classList.add('drop-target');
      }
    } catch (error) {
      this.errorHandler.handleError(error, '드래그 오버 이벤트 처리 실패');
    }
  }

  private handleDrop(event: DragEvent): void {
    try {
      event.preventDefault();
      const target = event.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const targetCardId = cardElement.getAttribute('data-card-id');
        const draggedCardId = event.dataTransfer?.getData('text/plain');
        
        if (targetCardId && draggedCardId) {
          // 카드 간 링크 생성
          this.viewModel.createLinkBetweenCards(draggedCardId, targetCardId);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '드롭 이벤트 처리 실패');
    }
  }

  private handleDragEnd(event: DragEvent): void {
    try {
      // 드래그 관련 클래스 제거
      const cards = this.containerEl.querySelectorAll('.card-navigator-card');
      cards.forEach(card => {
        card.classList.remove('dragging', 'drop-target');
      });
    } catch (error) {
      this.errorHandler.handleError(error, '드래그 종료 이벤트 처리 실패');
    }
  }

  private createToolbarButton(container: HTMLElement, action: string, title: string): void {
    const button = container.createEl('div', { 
      cls: 'card-navigator-toolbar-button clickable-icon',
      attr: { 
        'data-action': action,
        'aria-label': title
      }
    });

    // Obsidian 내장 아이콘 사용
    switch (action) {
      case 'folder':
        setIcon(button, 'folder');
        break;
      case 'tag':
        setIcon(button, 'tags');
        break;
      case 'link':
        setIcon(button, 'link');
        break;
      case 'sort':
        setIcon(button, 'arrow-up-narrow-wide');
        break;
      case 'settings':
        setIcon(button, 'settings');
        break;
    }
  }

  private async processStateUpdate(state: ICardNavigatorState): Promise<void> {
    try {
      // 카드셋 업데이트 관련 변수
      let isCardSetChanged = false;
      const currentCardSetId = this.cardContainer?.getAttribute('data-card-set-id');
      const newCardSetId = state.cardSets[0]?.id;
      
      // 상태 업데이트 로직은 한 방향으로만 흐르도록 수정
      // 1. 카드셋 변경 확인
      if (state.cardSets.length > 0) {
        // 카드셋 ID가 변경되었거나 이전에 설정되지 않은 경우
        if (!currentCardSetId || currentCardSetId !== newCardSetId) {
          isCardSetChanged = true;
          this.loggingService.debug('카드셋 변경 감지됨, 업데이트 필요', { 
            previousCardSetId: currentCardSetId,
            newCardSetId: newCardSetId
          });
        } 
        // 카드셋 ID는 같지만 카드 수가 변경된 경우
        else if (this.cardContainer && 
                 this.cardContainer.querySelectorAll('.card-navigator-card').length !== state.cardSets[0].cards.length) {
          isCardSetChanged = true;
          this.loggingService.debug('카드셋 내용 변경 감지됨, 업데이트 필요', {
            cardSetId: currentCardSetId,
            previousCardCount: this.cardContainer.querySelectorAll('.card-navigator-card').length,
            newCardCount: state.cardSets[0].cards.length
          });
        }
        // 카드셋 ID와 카드 수가 모두 동일한 경우는 업데이트하지 않음
        else {
          this.loggingService.debug('카드셋 변경 없음, 카드셋 업데이트 건너뜀', {
            cardSetId: currentCardSetId,
            cardCount: state.cardSets[0].cards.length
          });
        }
        
        // 카드셋이 변경된 경우 업데이트
        if (isCardSetChanged && state.cardSets[0]) {
          // 기존 카드 요소 제거 - 중복 카드 방지
          if (this.cardContainer) {
            this.cardContainer.empty();
          }
          
          // 카드셋 업데이트 수행
          await this.updateCardSet(state.cardSets[0]);
          
          // 카드셋 ID 속성 추가
          if (this.cardContainer && newCardSetId) {
            this.cardContainer.setAttribute('data-card-set-id', newCardSetId);
          }
        }
      }
      
      // 2. 검색 모드 설정은 항상 업데이트 (검색 UI 상태에 영향)
      this.updateSearchMode(state.isSearchMode, state.searchQuery);
      
      // 3. 카드 상태 업데이트 (포커스, 선택, 활성 상태)
      // 카드셋이 변경된 경우에도 카드 상태는 업데이트해야 함
      this.updateFocusedCard(state.focusedCardId);
      this.updateSelectedCards(state.selectedCardIds);
      this.updateActiveCard(state.activeCardId);
      
    } catch (error) {
      this.errorHandler.handleError(error, '상태 업데이트 처리 실패');
      throw error;
    }
  }

  public updateFocusedCard(cardId: string | null): void {
    if (!this.cardContainer) {
      this.loggingService.warn('카드 그리드가 초기화되지 않음');
      return;
    }
    
    const cards = this.cardContainer.querySelectorAll('.card-navigator-card');
    cards.forEach(card => {
      const currentCardId = card.getAttribute('data-card-id');
      if (currentCardId === cardId) {
        card.classList.add('focused');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        card.classList.remove('focused');
      }
    });
  }

  public updateSelectedCards(cardIds: Set<string>): void {
    if (!this.cardContainer) {
      this.loggingService.warn('카드 그리드가 초기화되지 않음');
      return;
    }
    
    const cards = this.cardContainer.querySelectorAll('.card-navigator-card');
    cards.forEach(card => {
      const currentCardId = card.getAttribute('data-card-id');
      if (currentCardId && cardIds.has(currentCardId)) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  }

  public updateActiveCard(cardId: string | null): void {
    if (!this.cardContainer) {
      this.loggingService.warn('카드 그리드가 초기화되지 않음');
      return;
    }
    
    const cards = this.cardContainer.querySelectorAll('.card-navigator-card');
    cards.forEach(card => {
      const currentCardId = card.getAttribute('data-card-id');
      if (currentCardId === cardId) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  public updateSearchMode(isSearchMode: boolean, query: string): void {
    if (!this.cardContainer) {
      this.loggingService.warn('카드 그리드가 초기화되지 않음');
      return;
    }
    
    if (isSearchMode) {
      this.cardContainer.classList.add('search-mode');
    } else {
      this.cardContainer.classList.remove('search-mode');
    }
  }

  public onResize(): void {
    if (!this.cardContainer) {
      return;
    }
    
    try {
      // 현재 카드셋이 있는 경우에만 레이아웃 재계산
      if (this.viewModel && this.viewModel.getCurrentCardSet()) {
        const cardSet = this.viewModel.getCurrentCardSet();
        
        // 레이아웃 재계산 및 CSS 업데이트
        if (cardSet) {
          // 코드 중복 방지: 카드셋으로 updateCardSet 호출
          this.updateCardSet(cardSet);
        }
      }
    } catch (error) {
      this.loggingService.error('뷰포트 크기 변경 처리 실패', { error });
      // 에러 발생 시 기본 레이아웃 유지
    }
  }

  private getCardElement(cardId: string): HTMLElement | null {
    try {
      if (!this.cardContainer) {
        this.loggingService.warn('카드 그리드가 초기화되지 않음');
        return null;
      }
      
      const cardElement = this.cardContainer.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement;
      if (!cardElement) {
        this.loggingService.debug('카드 엘리먼트를 찾을 수 없음', { cardId });
        return null;
      }
      
      return cardElement;
    } catch (error) {
      this.loggingService.error('카드 엘리먼트 가져오기 실패', { cardId, error });
      return null;
    }
  }
  
  public scrollToCard(cardId: string): void {
    if (!this.cardContainer) {
      this.loggingService.warn('카드 그리드가 초기화되지 않음');
      return;
    }

    const card = this.cardContainer.querySelector(`[data-card-id="${cardId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  public async updateCardSet(cardSet: ICardSet): Promise<void> {
    try {
      if (!this.cardContainer) {
        this.loggingService.warn('카드 그리드가 초기화되지 않음');
        return;
      }

      // 성능 모니터링 시작
      const startTime = performance.now();

      // 카드 렌더링 전 로딩 표시
      this.showLoading(true);

      // 기존 카드 요소 제거
      this.cardContainer.empty();

      // 카드셋이 비어있는 경우 빈 상태 표시
      if (!cardSet.cards || cardSet.cards.length === 0) {
        const emptyStateElement = this.cardContainer.createDiv('card-navigator-empty-state');
        emptyStateElement.textContent = '카드가 없습니다.';
        this.showLoading(false);
        return;
      }

      // 카드 렌더링
      for (const card of cardSet.cards) {
        const cardElement = this.cardContainer.createDiv({
          cls: 'card-navigator-card',
          attr: { 'data-card-id': card.id }
        });

        // 카드 헤더 렌더링
        const headerElement = cardElement.createDiv('card-navigator-card-header');
        headerElement.textContent = card.fileName;

        // 카드 본문 렌더링
        const bodyElement = cardElement.createDiv('card-navigator-card-body');
        if (card.config.renderType === 'html') {
          await this.renderManager.requestRender(card.id, card);
        } else {
          bodyElement.textContent = card.content;
        }

        // 카드 푸터 렌더링
        const footerElement = cardElement.createDiv('card-navigator-card-footer');
        if (card.tags && card.tags.length > 0) {
          const tagsElement = footerElement.createDiv('card-navigator-card-tags');
          card.tags.forEach(tag => {
            const tagElement = tagsElement.createSpan('card-navigator-card-tag');
            tagElement.textContent = tag;
          });
        }
      }

      // 성능 모니터링 종료 및 로깅
      const endTime = performance.now();
      this.loggingService.debug('카드셋 렌더링 완료', {
        cardCount: cardSet.cards.length,
        renderTime: endTime - startTime
      });

      // 로딩 표시 해제
      this.showLoading(false);

    } catch (error) {
      this.errorHandler.handleError(error, '카드셋 업데이트 실패');
      this.showError('카드셋을 업데이트하는 중 오류가 발생했습니다.');
      this.showLoading(false);
    }
  }

  private async handleCardSetCreated(cardSet: ICardSet): Promise<void> {
    try {
      await this.updateCardSet(cardSet);
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드셋 생성 처리 실패');
    }
  }

  private async handleCardSetUpdated(cardSet: ICardSet): Promise<void> {
    try {
      await this.updateCardSet(cardSet);
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드셋 업데이트 처리 실패');
    }
  }

  private async handleCardSetDeleted(cardSet: ICardSet): Promise<void> {
    try {
      if (this.cardContainer) {
        this.cardContainer.empty();
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, '카드셋 삭제 처리 실패');
    }
  }
} 