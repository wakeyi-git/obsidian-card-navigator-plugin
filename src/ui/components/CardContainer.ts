import { ICardSetService } from '@/domain/services/CardSetService';
import { ILayoutService } from '@/domain/services/LayoutService';
import { Card } from '@/domain/models/Card';
import { CardSet } from '@/domain/models/CardSet';
import { Layout } from '@/domain/models/Layout';
import { CardRenderer } from './CardRenderer';
import { Scroller } from './Scroller';
import { CardInteractionManager } from './CardInteractionManager';
import { KeyboardNavigator } from './KeyboardNavigator';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardEvent, CardCreatedEvent, CardUpdatedEvent, CardDeletedEvent, CardEventType } from '@/domain/events/CardEvents';
import { CardSetEvent, CardSetCreatedEvent, CardSetUpdatedEvent, CardSetEventType } from '@/domain/events/CardSetEvents';
import { LayoutEvent, LayoutCreatedEvent, LayoutUpdatedEvent, LayoutEventType } from '@/domain/events/LayoutEvents';
import { DomainEvent } from '@/domain/events/DomainEvent';

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
  private _cards: Map<string, HTMLElement> = new Map();
  private _isScrolling = false;
  private _handlers: ICardContainerHandlers | null = null;

  constructor(
    private readonly cardSetService: ICardSetService,
    private readonly layoutService: ILayoutService,
    private readonly cardRenderer: CardRenderer,
    private readonly scroller: Scroller,
    private readonly interactionManager: CardInteractionManager,
    private readonly keyboardNavigator: KeyboardNavigator,
    private readonly eventDispatcher: DomainEventDispatcher
  ) {
    this._container = document.createElement('div');
    this._container.className = 'card-navigator-container';
    this._setupEventListeners();
    this._registerEventHandlers();
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
  cleanup(): void {
    this._container.innerHTML = '';
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
    return this._container;
  }

  /**
   * 카드셋 설정
   */
  async setCardSet(cardSetId: string): Promise<void> {
    const cardSet = await this.cardSetService.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }
    this._cardSet = cardSet;
    await this._renderCards();
  }

  /**
   * 레이아웃 설정
   */
  async setLayout(layoutId: string): Promise<void> {
    const layout = await this.layoutService.getLayout(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }
    this._layout = layout;
    await this._updateLayout();
  }

  /**
   * 활성 카드 설정
   */
  setActiveCard(card: Card | null): void {
    this._activeCard = card;
    this._updateCardStates();
    if (card) {
      this.eventDispatcher.dispatch(new CardUpdatedEvent(card));
    }
  }

  /**
   * 포커스된 카드 설정
   */
  setFocusedCard(card: Card | null): void {
    this._focusedCard = card;
    this._updateCardStates();
    if (card) {
      this.scroller.scrollToCard(card.id);
      this.eventDispatcher.dispatch(new CardUpdatedEvent(card));
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  private _setupEventListeners(): void {
    // 스크롤 이벤트
    this._container.addEventListener('scroll', this._handleScroll.bind(this));
    
    // 리사이즈 이벤트
    window.addEventListener('resize', this._handleResize.bind(this));
    
    // 키보드 이벤트
    this.keyboardNavigator.onFocusChange = (card) => {
      this.setFocusedCard(card);
    };
    
    // 상호작용 이벤트
    this.interactionManager.onCardClick = (card) => {
      this.setFocusedCard(card);
      this._handlers?.onCardClick(card.id);
    };
    
    this.interactionManager.onCardDoubleClick = (card) => {
      this.eventDispatcher.dispatch(new CardUpdatedEvent(card));
    };
    
    this.interactionManager.onCardContextMenu = (card, event) => {
      if (event instanceof MouseEvent) {
        this._handlers?.onCardContextMenu(event, card.id);
      }
    };

    // 드래그 이벤트
    this.interactionManager.onCardDragStart = (card, event) => {
      if (event instanceof DragEvent) {
        this._handlers?.onCardDragStart(event, card.id);
      }
    };

    this.interactionManager.onCardDragEnd = (card, event) => {
      if (event instanceof DragEvent) {
        this._handlers?.onCardDragEnd(event, card.id);
      }
    };

    this.interactionManager.onCardDrop = (card, event) => {
      if (event instanceof DragEvent) {
        this._handlers?.onCardDrop(event, card.id);
      }
    };
  }

  /**
   * 도메인 이벤트 핸들러 등록
   */
  private _registerEventHandlers(): void {
    // 카드셋 이벤트
    this.eventDispatcher.register(CardSetEventType.CARD_SET_CREATED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof CardSetCreatedEvent) {
          await this.setCardSet(event.cardSet.id);
        }
      }
    });

    this.eventDispatcher.register(CardSetEventType.CARD_SET_UPDATED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof CardSetUpdatedEvent) {
          await this.setCardSet(event.cardSet.id);
        }
      }
    });

    // 레이아웃 이벤트
    this.eventDispatcher.register(LayoutEventType.LAYOUT_CREATED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof LayoutCreatedEvent) {
          await this.setLayout(event.layout.id);
        }
      }
    });

    this.eventDispatcher.register(LayoutEventType.LAYOUT_UPDATED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof LayoutUpdatedEvent) {
          await this.setLayout(event.layout.id);
        }
      }
    });

    // 카드 이벤트
    this.eventDispatcher.register(CardEventType.CARD_CREATED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof CardCreatedEvent) {
          await this._renderCards();
        }
      }
    });

    this.eventDispatcher.register(CardEventType.CARD_UPDATED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof CardUpdatedEvent) {
          this._updateCard(event.card);
        }
      }
    });

    this.eventDispatcher.register(CardEventType.CARD_DELETED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof CardDeletedEvent) {
          this._removeCard(event.cardId);
        }
      }
    });
  }

  /**
   * 카드 렌더링
   */
  private async _renderCards(): Promise<void> {
    if (!this._cardSet) return;

    // 기존 카드 제거
    this._container.innerHTML = '';
    this._cards.clear();

    // 새 카드 렌더링
    for (const card of this._cardSet.cards) {
      const cardElement = await this.cardRenderer.render(card, card.style);
      this._container.appendChild(cardElement);
      this._cards.set(card.id, cardElement);
    }

    // 레이아웃 업데이트
    await this._updateLayout();
  }

  /**
   * 레이아웃 업데이트
   */
  private async _updateLayout(): Promise<void> {
    if (!this._layout || !this._cardSet) return;

    const positions = await this.layoutService.calculateLayout(
      this._layout.id,
      this._cardSet.cards
    );

    // 레이아웃 적용
    positions.forEach((position) => {
      const cardElement = this._cards.get(position.cardId);
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
    for (const [cardId, element] of this._cards) {
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
  private async _updateCard(card: Card): Promise<void> {
    const cardElement = this._cards.get(card.id);
    if (cardElement) {
      const newCardElement = await this.cardRenderer.render(card, card.style);
      cardElement.replaceWith(newCardElement);
      this._cards.set(card.id, newCardElement);
    }
  }

  /**
   * 카드 제거
   */
  private _removeCard(cardId: string): void {
    const cardElement = this._cards.get(cardId);
    if (cardElement) {
      cardElement.remove();
      this._cards.delete(cardId);
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
} 