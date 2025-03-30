import { ICardSetService } from '@/domain/services/ICardSetService';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { Card } from '@/domain/models/Card';
import { CardSet } from '@/domain/models/CardSet';
import { Layout } from '@/domain/models/Layout';
import { CardRenderer } from './CardRenderer';
import { Scroller } from './Scroller';
import { CardInteractionManager } from './CardInteractionManager';
import { KeyboardNavigator } from './KeyboardNavigator';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardCreatedEvent, CardUpdatedEvent, CardDeletedEvent } from '@/domain/events/CardEvents';
import { CardSetCreatedEvent, CardSetUpdatedEvent } from '@/domain/events/CardSetEvents';
import { LayoutCreatedEvent, LayoutUpdatedEvent } from '@/domain/events/LayoutEvents';
import { App, TFile } from 'obsidian';
import { ICardService } from '@/domain/services/ICardService';
import { LoggingService } from '@/infrastructure/services/LoggingService';
import { CardRenderedEvent } from '@/domain/events/CardEvents';

/**
 * 카드 컨테이너 의존성 인터페이스
 */
interface ICardContainerDependencies {
  app: App;
  cardService: ICardService;
  cardSetService: ICardSetService;
  layoutService: ILayoutService;
  eventDispatcher: DomainEventDispatcher;
  loggingService: LoggingService;
  cardRenderer: CardRenderer;
  scroller: Scroller;
  interactionManager: CardInteractionManager;
  keyboardNavigator: KeyboardNavigator;
  element?: HTMLElement;
}

/**
 * 카드 컨테이너 이벤트 핸들러 인터페이스
 */
export interface ICardContainerHandlers {
  onCardClick: (cardId: string) => void;
  onCardContextMenu: (event: MouseEvent, cardId: string) => void;
  onCardDragStart: (event: DragEvent, cardId: string) => void;
  onCardDragEnd: (event: DragEvent, cardId: string) => void;
  onCardDrop: (event: DragEvent, cardId: string) => void;
}

/**
 * 카드 위치 인터페이스
 */
interface CardPosition {
  cardId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 카드 컨테이너 클래스
 * 카드 목록을 표시하고 상호작용을 관리하는 컨테이너
 */
export class CardContainer {
  private _container: HTMLElement;
  private _cardSet: CardSet | null = null;
  private _layout: Layout | null = null;
  private _activeCard: Card | null = null;
  private _focusedCard: Card | null = null;
  private _cardElements: Map<string, HTMLElement> = new Map();
  private _cards: Map<string, Card> = new Map();
  private _isScrolling = false;
  private _handlers: ICardContainerHandlers | null = null;
  private _activeCardId: string | null = null;
  private _focusedCardId: string | null = null;
  private _element: HTMLElement;
  private _isKeyboardNavigationEnabled: boolean = true;

  // 이벤트 핸들러
  private readonly _cardSetEventHandlers = {
    cardSetCreated: {
      handle: async (event: CardSetCreatedEvent) => {
        await this.setCardSet(event.cardSet.id);
      }
    },
    cardSetUpdated: {
      handle: async (event: CardSetUpdatedEvent) => {
        await this.setCardSet(event.cardSet.id);
      }
    }
  };

  private readonly _layoutEventHandlers = {
    layoutCreated: {
      handle: async (event: LayoutCreatedEvent) => {
        await this.setLayout(event.layout.id);
      }
    },
    layoutUpdated: {
      handle: async (event: LayoutUpdatedEvent) => {
        await this._updateLayout();
      }
    }
  };

  private readonly _cardEventHandlers = {
    cardCreated: {
      handle: async (event: CardCreatedEvent) => {
        await this._renderCards();
      }
    },
    cardUpdated: {
      handle: async (event: CardUpdatedEvent) => {
        await this._updateCard(event.card.id);
      }
    },
    cardDeleted: {
      handle: async (event: CardDeletedEvent) => {
        this._removeCard(event.cardId);
      }
    },
    cardRendered: {
      handle: async (event: CardRenderedEvent) => {
        const cardElement = this._cardElements.get(event.cardId);
        if (cardElement) {
          cardElement.innerHTML = event.html;
          this._updateCardStates();
        }
      }
    }
  };

  constructor(private readonly dependencies: ICardContainerDependencies) {
    if (dependencies.element) {
      this._element = dependencies.element;
      this._container = this._element;
    } else {
      this._element = document.createElement('div');
      this._element.className = 'card-container';
      this._container = document.createElement('div');
      this._container.className = 'card-list';
      this._element.appendChild(this._container);
    }
    this._setupEventListeners();
  }

  /**
   * 컨테이너 초기화
   */
  initialize(handlers: ICardContainerHandlers): void {
    this._handlers = handlers;
  }

  /**
   * 컨테이너 정리
   */
  destroy(): void {
    // 이벤트 핸들러 해제
    this.dependencies.eventDispatcher.unregister(CardSetCreatedEvent, this._cardSetEventHandlers.cardSetCreated);
    this.dependencies.eventDispatcher.unregister(CardSetUpdatedEvent, this._cardSetEventHandlers.cardSetUpdated);
    this.dependencies.eventDispatcher.unregister(LayoutCreatedEvent, this._layoutEventHandlers.layoutCreated);
    this.dependencies.eventDispatcher.unregister(LayoutUpdatedEvent, this._layoutEventHandlers.layoutUpdated);
    this.dependencies.eventDispatcher.unregister(CardCreatedEvent, this._cardEventHandlers.cardCreated);
    this.dependencies.eventDispatcher.unregister(CardUpdatedEvent, this._cardEventHandlers.cardUpdated);
    this.dependencies.eventDispatcher.unregister(CardDeletedEvent, this._cardEventHandlers.cardDeleted);
    this.dependencies.eventDispatcher.unregister(CardRenderedEvent, this._cardEventHandlers.cardRendered);

    // DOM 요소 정리
    this._container.innerHTML = '';
    this._cardElements.clear();
    this._cards.clear();
    this._cardSet = null;
    this._layout = null;
    this._activeCard = null;
    this._focusedCard = null;
    this._handlers = null;
  }

  /**
   * 컨테이너 요소 반환
   */
  get element(): HTMLElement {
    return this._element;
  }

  /**
   * 카드셋 설정
   */
  async setCardSet(cardSetId: string): Promise<void> {
    try {
      const cardSet = await this.dependencies.cardSetService.getCardSet(cardSetId);
      if (!cardSet) {
        throw new Error(`CardSet not found: ${cardSetId}`);
      }
      
      this._cardSet = cardSet;
      
      // 기존 카드 제거
      this._container.empty();
      
      // 카드 렌더링
      await this._renderCards();
      
      // 레이아웃 설정
      if (cardSet.layoutConfig) {
        const layout = new Layout(
          cardSetId,
          'Default Layout',
          'Default layout for card set',
          cardSet.layoutConfig,
          undefined,
          []
        );
        this._layout = layout;
        await this._updateLayout();
      }
    } catch (error) {
      this.dependencies.loggingService.error('Failed to set card set:', error);
      throw error;
    }
  }

  /**
   * 레이아웃 설정
   */
  async setLayout(layoutId: string): Promise<void> {
    const layout = await this.dependencies.layoutService.getLayout(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }
    this._layout = layout;
    await this._updateLayout();
  }

  /**
   * 휴성 카드 설정
   */
  async setActiveCard(card: Card): Promise<void> {
    this._activeCardId = card.id;
    this._activeCard = card;
    this._renderCards();
    this.dependencies.eventDispatcher.dispatch(new CardUpdatedEvent(card));
  }

  /**
   * 포커스된 카드 설정
   */
  setFocusedCard(card: Card | null): void {
    this._focusedCard = card;
    this._focusedCardId = card?.id || null;
    this._updateCardStates();
    if (card) {
      this.scrollToCard(card.id);
      this.dependencies.eventDispatcher.dispatch(new CardUpdatedEvent(card));
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  private _setupEventListeners(): void {
    this.dependencies.loggingService.debug('CardContainer 이벤트 리스너 설정 시작');

    // 스크롤 이벤트
    this._container.addEventListener('scroll', this._handleScroll.bind(this));
    
    // 리사이즈 이벤트
    window.addEventListener('resize', this._handleResize.bind(this));
    
    // 키보드 이벤트
    this.dependencies.keyboardNavigator.onFocusChange = (card) => {
      this.setFocusedCard(card);
    };
    
    // 상호작용 이벤트
    this.dependencies.interactionManager.onCardClick = (card) => {
      this.setFocusedCard(card);
      this._handlers?.onCardClick(card.id);
    };
    
    this.dependencies.interactionManager.onCardDoubleClick = (card) => {
      this.dependencies.eventDispatcher.dispatch(new CardUpdatedEvent(card));
    };
    
    this.dependencies.interactionManager.onCardContextMenu = (card, event) => {
      if (event instanceof MouseEvent) {
        this._handlers?.onCardContextMenu(event, card.id);
      }
    };

    // 드래그 이벤트
    this.dependencies.interactionManager.onCardDragStart = (card, event) => {
      if (event instanceof DragEvent) {
        this._handlers?.onCardDragStart(event, card.id);
      }
    };

    this.dependencies.interactionManager.onCardDragEnd = (card, event) => {
      if (event instanceof DragEvent) {
        this._handlers?.onCardDragEnd(event, card.id);
      }
    };

    this.dependencies.interactionManager.onCardDrop = (card, event) => {
      if (event instanceof DragEvent) {
        this._handlers?.onCardDrop(event, card.id);
      }
    };

    // 카드 이벤트 핸들러 등록
    this.dependencies.eventDispatcher.register(CardCreatedEvent, this._cardEventHandlers.cardCreated);
    this.dependencies.eventDispatcher.register(CardUpdatedEvent, this._cardEventHandlers.cardUpdated);
    this.dependencies.eventDispatcher.register(CardDeletedEvent, this._cardEventHandlers.cardDeleted);
    this.dependencies.eventDispatcher.register(CardRenderedEvent, this._cardEventHandlers.cardRendered);

    this.dependencies.loggingService.debug('CardContainer 이벤트 리스너 설정 완료');
  }

  /**
   * 카드 렌더링
   */
  private async _renderCards(): Promise<void> {
    try {
      // 카드셋이 설정되지 않은 경우 현재 카드 목록 사용
      const cards = this._cardSet ? await this._cardSet.getCards() : Array.from(this._cards.values());
      
      if (!cards || cards.length === 0) {
        this.dependencies.loggingService.debug('No cards to render');
        return;
      }

      this.dependencies.loggingService.debug(`Rendering ${cards.length} cards`);

      // 기존 카드 요소 제거
      this._container.innerHTML = '';
      this._cardElements.clear();

      // 카드 렌더링
      for (const card of cards) {
        try {
          const cardElement = await this.dependencies.cardRenderer.renderCard(card);
          if (cardElement) {
            this._container.appendChild(cardElement);
            this._cardElements.set(card.id, cardElement);
            this._cards.set(card.id, card);
            this.dependencies.loggingService.debug(`Card rendered: ${card.id}`);
          } else {
            this.dependencies.loggingService.warn(`Failed to render card: ${card.id}`);
          }
        } catch (error) {
          this.dependencies.loggingService.error(`Error rendering card ${card.id}:`, error);
        }
      }

      // 카드 상태 업데이트
      this._updateCardStates();

      // 레이아웃 업데이트
      if (this._layout) {
        await this._updateLayout();
      }

      this.dependencies.loggingService.debug(`Rendered ${this._cardElements.size} cards`);
    } catch (error) {
      this.dependencies.loggingService.error('Failed to render cards:', error);
      throw error;
    }
  }

  /**
   * 레이아웃 업데이트
   */
  private async _updateLayout(): Promise<void> {
    if (!this._layout || !this._cardSet) return;

    await this.dependencies.layoutService.calculateLayout(
      this._cardSet,
      this._container.clientWidth,
      this._container.clientHeight
    );

    // 레이아웃 적용
    this._layout.cardPositions.forEach((position) => {
      const cardElement = this._cardElements.get(position.cardId);
      if (cardElement) {
        cardElement.style.left = `${position.x}px`;
        cardElement.style.top = `${position.y}px`;
        cardElement.style.width = `${position.width}px`;
        cardElement.style.height = `${position.height}px`;
      }
    });
  }

  /**
   * 카드 상태 업데이트
   */
  private _updateCardStates(): void {
    for (const [cardId, element] of this._cardElements) {
      element.classList.remove('active', 'focused');
      
      if (this._activeCard?.id === cardId) {
        element.classList.add('active');
      }
      
      if (this._focusedCard?.id === cardId) {
        element.classList.add('focused');
      }
    }
  }

  /**
   * 카드 업데이트
   */
  private async _updateCard(cardId: string): Promise<void> {
    try {
      const card = await this.dependencies.cardService.getCardById(cardId);
      if (!card) {
        this.dependencies.loggingService.warn(`Card not found: ${cardId}`);
        return;
      }

      const cardElement = await this.dependencies.cardRenderer.renderCard(card);
      if (cardElement) {
        const existingCard = this._container.querySelector(`[data-card-id="${cardId}"]`);
        if (existingCard) {
          existingCard.replaceWith(cardElement);
        }
      }
    } catch (error) {
      this.dependencies.loggingService.error(`Failed to update card ${cardId}:`, error);
    }
  }

  /**
   * 카드 제거
   */
  private _removeCard(cardId: string): void {
    const cardElement = this._cardElements.get(cardId);
    if (cardElement) {
      cardElement.remove();
      this._cardElements.delete(cardId);
    }
  }

  /**
   * 스크롤 이벤트 처리
   */
  private _handleScroll(): void {
    if (this._isScrolling) return;
    
    this._isScrolling = true;
    requestAnimationFrame(() => {
      this._isScrolling = false;
    });
  }

  /**
   * 리사이즈 이벤트 처리
   */
  private _handleResize(): void {
    this._updateLayout();
  }

  /**
   * 카드로 스크롤
   */
  public scrollToCard(cardId: string): void {
    const cardIndex = this.getCardIndex(cardId);
    if (cardIndex !== -1) {
      this.dependencies.scroller.scrollTo(cardIndex);
    }
  }

  /**
   * 카드 인덱스 조회
   */
  public getCardIndex(cardId: string): number {
    return Array.from(this._cardElements.keys()).indexOf(cardId);
  }

  /**
   * 카드 업데이트
   */
  async updateCard(file: TFile): Promise<void> {
    const cardElement = await this.dependencies.cardRenderer.renderCardFromFile(file);
    if (cardElement) {
      const cardId = cardElement.dataset.cardId;
      if (cardId) {
        const card = await this.dependencies.cardService.getCardById(cardId);
        if (card) {
          this._cards.set(cardId, card);
          await this._renderCards();
        }
      }
    }
  }

  /**
   * 카드 제거
   */
  async removeCard(filePath: string): Promise<void> {
    const cardId = Array.from(this._cards.entries())
      .find(([_, card]) => card.filePath === filePath)?.[0];
    
    if (cardId) {
      this._cards.delete(cardId);
      await this._renderCards();
    }
  }

  /**
   * 카드 경로 업데이트
   */
  async updateCardPath(oldPath: string, newPath: string): Promise<void> {
    const cardId = Array.from(this._cards.entries())
      .find(([_, card]) => card.filePath === oldPath)?.[0];
    
    if (cardId) {
      const oldCard = this._cards.get(cardId);
      if (oldCard) {
        // 새로운 Card 객체 생성
        const newCard = new Card(
          oldCard.id,
          newPath,
          oldCard.fileName,
          oldCard.firstHeader,
          oldCard.content,
          oldCard.tags,
          oldCard.createdAt,
          oldCard.updatedAt,
          oldCard.frontmatter,
          oldCard.renderConfig,
          oldCard.style
        );
        this._cards.set(cardId, newCard);
        await this._renderCards();
      }
    }
  }

  /**
   * 포커스 설정
   */
  focus(): void {
    this._element.focus();
  }
} 