import { Card } from '@/domain/models/Card';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardFocusedEvent, CardBlurredEvent } from '@/domain/events/DomainEvent';
import { ICardService } from '@/domain/services/ICardService';

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
  private _cardService: ICardService;

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
   * @param cardService 카드 서비스
   */
  constructor(eventDispatcher: DomainEventDispatcher, cardService: ICardService) {
    if (!eventDispatcher) {
      throw new Error('Event dispatcher is required');
    }
    if (!cardService) {
      throw new Error('Card service is required');
    }
    this._eventDispatcher = eventDispatcher;
    this._cardService = cardService;
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
    this._container.addEventListener('click', (event) => {
      this._handleClick(event).catch(error => {
        console.error('Failed to handle click event:', error);
      });
    });
    
    // 더블클릭 이벤트
    this._container.addEventListener('dblclick', (event) => {
      this._handleDoubleClick(event).catch(error => {
        console.error('Failed to handle double click event:', error);
      });
    });
    
    // 컨텍스트 메뉴 이벤트
    this._container.addEventListener('contextmenu', (event) => {
      this._handleContextMenu(event).catch(error => {
        console.error('Failed to handle context menu event:', error);
      });
    });
    
    // 드래그 이벤트
    this._container.addEventListener('dragstart', (event) => {
      this._handleDragStart(event as DragEvent).catch(error => {
        console.error('Failed to handle drag start event:', error);
      });
    });
    this._container.addEventListener('dragend', this._handleDragEnd.bind(this));
    this._container.addEventListener('dragover', this._handleDragOver.bind(this));
    this._container.addEventListener('drop', (event) => {
      this._handleDrop(event as DragEvent).catch(error => {
        console.error('Failed to handle drop event:', error);
      });
    });
    
    // 선택 이벤트
    this._container.addEventListener('mousedown', (event) => {
      this._handleMouseDown(event as MouseEvent).catch(error => {
        console.error('Failed to handle mouse down event:', error);
      });
    });
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
  private async _handleClick(event: Event): Promise<void> {
    const card = await this._getCardFromEvent(event);
    if (!card || !this.onCardClick) return;

    this.onCardClick(card, event);
  }

  /**
   * 더블클릭 이벤트 처리
   */
  private async _handleDoubleClick(event: Event): Promise<void> {
    const card = await this._getCardFromEvent(event);
    if (!card || !this.onCardDoubleClick) return;

    this.onCardDoubleClick(card, event);
  }

  /**
   * 컨텍스트 메뉴 이벤트 처리
   */
  private async _handleContextMenu(event: Event): Promise<void> {
    const card = await this._getCardFromEvent(event);
    if (!card || !this.onCardContextMenu) return;

    this.onCardContextMenu(card, event);
  }

  /**
   * 드래그 시작 이벤트 처리
   */
  private async _handleDragStart(event: DragEvent): Promise<void> {
    const card = await this._getCardFromEvent(event);
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
  private async _handleDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    const targetCard = await this._getCardFromEvent(event);
    if (!targetCard || !this._draggedCard || !this.onCardDrop) return;

    this.onCardDrop(targetCard, event);
  }

  /**
   * 마우스 다운 이벤트 처리
   */
  private async _handleMouseDown(event: MouseEvent): Promise<void> {
    const card = await this._getCardFromEvent(event);
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
  private async _getCardFromEvent(event: Event): Promise<Card | null> {
    const target = event.target as HTMLElement;
    const cardElement = target.closest('.card-navigator-card');
    if (!cardElement) return null;

    const cardId = cardElement.getAttribute('data-card-id');
    if (!cardId) return null;

    try {
      return await this._cardService.getCardById(cardId);
    } catch (error) {
      console.error('Failed to get card:', error);
      return null;
    }
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