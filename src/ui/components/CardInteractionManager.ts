import { Card } from '@/domain/models/Card';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardFocusedEvent, CardBlurredEvent } from '@/domain/events/DomainEvent';

/**
 * 카드 상호작용 이벤트 핸들러 타입
 */
type CardEventHandler = (card: Card, event?: Event) => void;

/**
 * 카드 상호작용 관리자 클래스
 * 카드의 마우스 이벤트와 드래그 앤 드롭을 관리하는 클래스
 */
export class CardInteractionManager {
  private _container: HTMLElement | null = null;
  private _draggedCard: Card | null = null;
  private _selectedCards: Set<string> = new Set();
  private _focusedCard: Card | null = null;
  private _eventDispatcher: DomainEventDispatcher;

  // 이벤트 핸들러
  onCardClick: CardEventHandler | null = null;
  onCardDoubleClick: CardEventHandler | null = null;
  onCardContextMenu: CardEventHandler | null = null;
  onCardDragStart: CardEventHandler | null = null;
  onCardDrag: CardEventHandler | null = null;
  onCardDragEnd: CardEventHandler | null = null;
  onCardDrop: CardEventHandler | null = null;

  /**
   * 생성자
   * @param eventDispatcher 이벤트 디스패처
   */
  constructor(eventDispatcher: DomainEventDispatcher) {
    if (!eventDispatcher) {
      throw new Error('Event dispatcher is required');
    }
    this._eventDispatcher = eventDispatcher;
  }

  /**
   * 컨테이너 설정
   */
  setContainer(container: HTMLElement): void {
    this._container = container;
    this._setupEventListeners();
  }

  /**
   * 이벤트 리스너 설정
   */
  private _setupEventListeners(): void {
    if (!this._container) return;

    // 클릭 이벤트
    this._container.addEventListener('click', this._handleClick.bind(this));
    
    // 더블클릭 이벤트
    this._container.addEventListener('dblclick', this._handleDoubleClick.bind(this));
    
    // 컨텍스트 메뉴 이벤트
    this._container.addEventListener('contextmenu', this._handleContextMenu.bind(this));
    
    // 드래그 이벤트
    this._container.addEventListener('dragstart', this._handleDragStart.bind(this));
    this._container.addEventListener('dragend', this._handleDragEnd.bind(this));
    this._container.addEventListener('dragover', this._handleDragOver.bind(this));
    this._container.addEventListener('drop', this._handleDrop.bind(this));
    
    // 선택 이벤트
    this._container.addEventListener('mousedown', this._handleMouseDown.bind(this));
    this._container.addEventListener('mouseup', this._handleMouseUp.bind(this));
  }

  /**
   * 카드 선택
   */
  selectCard(cardId: string): void {
    this._selectedCards.add(cardId);
    this._updateCardSelection();
  }

  /**
   * 카드 선택 해제
   */
  deselectCard(cardId: string): void {
    this._selectedCards.delete(cardId);
    this._updateCardSelection();
  }

  /**
   * 모든 카드 선택 해제
   */
  deselectAllCards(): void {
    this._selectedCards.clear();
    this._updateCardSelection();
  }

  /**
   * 선택된 카드 ID 목록 반환
   */
  getSelectedCardIds(): string[] {
    return Array.from(this._selectedCards);
  }

  /**
   * 클릭 이벤트 처리
   */
  private _handleClick(event: Event): void {
    const card = this._getCardFromEvent(event);
    if (!card || !this.onCardClick) return;

    this.onCardClick(card, event);
  }

  /**
   * 더블클릭 이벤트 처리
   */
  private _handleDoubleClick(event: Event): void {
    const card = this._getCardFromEvent(event);
    if (!card || !this.onCardDoubleClick) return;

    this.onCardDoubleClick(card, event);
  }

  /**
   * 컨텍스트 메뉴 이벤트 처리
   */
  private _handleContextMenu(event: Event): void {
    const card = this._getCardFromEvent(event);
    if (!card || !this.onCardContextMenu) return;

    this.onCardContextMenu(card, event);
  }

  /**
   * 드래그 시작 이벤트 처리
   */
  private _handleDragStart(event: DragEvent): void {
    const card = this._getCardFromEvent(event);
    if (!card || !this.onCardDragStart) return;

    this._draggedCard = card;
    this.onCardDragStart(card, event);
  }

  /**
   * 드래그 종료 이벤트 처리
   */
  private _handleDragEnd(event: DragEvent): void {
    if (!this._draggedCard || !this.onCardDragEnd) return;

    this.onCardDragEnd(this._draggedCard, event);
    this._draggedCard = null;
  }

  /**
   * 드래그 오버 이벤트 처리
   */
  private _handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * 드롭 이벤트 처리
   */
  private _handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const targetCard = this._getCardFromEvent(event);
    if (!targetCard || !this._draggedCard || !this.onCardDrop) return;

    this.onCardDrop(targetCard, event);
  }

  /**
   * 마우스 다운 이벤트 처리
   */
  private _handleMouseDown(event: MouseEvent): void {
    const card = this._getCardFromEvent(event);
    if (!card) return;

    if (event.shiftKey) {
      // Shift + 클릭: 범위 선택
      this._handleRangeSelection(card.id);
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + 클릭: 다중 선택
      this._handleMultiSelection(card.id);
    } else {
      // 일반 클릭: 단일 선택
      this._handleSingleSelection(card.id);
    }
  }

  /**
   * 마우스 업 이벤트 처리
   */
  private _handleMouseUp(event: MouseEvent): void {
    // 필요한 경우 추가 구현
  }

  /**
   * 이벤트에서 카드 가져오기
   */
  private _getCardFromEvent(event: Event): Card | null {
    const target = event.target as HTMLElement;
    const cardElement = target.closest('.card-navigator-card');
    if (!cardElement) return null;

    const cardId = cardElement.getAttribute('data-card-id');
    if (!cardId) return null;

    // TODO: CardService를 통해 카드 가져오기
    return null;
  }

  /**
   * 단일 선택 처리
   */
  private _handleSingleSelection(cardId: string): void {
    this._selectedCards.clear();
    this._selectedCards.add(cardId);
    this._updateCardSelection();
  }

  /**
   * 다중 선택 처리
   */
  private _handleMultiSelection(cardId: string): void {
    if (this._selectedCards.has(cardId)) {
      this._selectedCards.delete(cardId);
    } else {
      this._selectedCards.add(cardId);
    }
    this._updateCardSelection();
  }

  /**
   * 범위 선택 처리
   */
  private _handleRangeSelection(cardId: string): void {
    // TODO: 범위 선택 로직 구현
  }

  /**
   * 카드 선택 상태 업데이트
   */
  private _updateCardSelection(): void {
    if (!this._container) return;

    const cards = this._container.querySelectorAll('.card-navigator-card');
    cards.forEach(card => {
      const cardId = card.getAttribute('data-card-id');
      if (cardId) {
        if (this._selectedCards.has(cardId)) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
      }
    });
  }

  /**
   * 카드 포커스
   * @param card 포커스할 카드
   */
  public focusCard(card: Card): void {
    if (!this._eventDispatcher) {
      console.error('Event dispatcher is not initialized');
      return;
    }
    this._focusedCard = card;
    this._eventDispatcher.dispatch(new CardFocusedEvent(card));
  }

  /**
   * 포커스된 카드 반환
   */
  public getFocusedCard(): Card | null {
    return this._focusedCard;
  }

  /**
   * 포커스 해제
   */
  public blurCard(): void {
    if (!this._eventDispatcher) {
      console.error('Event dispatcher is not initialized');
      return;
    }
    this._focusedCard = null;
    this._eventDispatcher.dispatch(new CardBlurredEvent());
  }
} 