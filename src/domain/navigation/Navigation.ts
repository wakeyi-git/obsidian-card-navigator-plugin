import { ICard } from '../card/Card';
import { ICardSet } from '../cardset/CardSet';
import { ILayout } from '../layout/Layout';
import { EventType, IEventPayloads, NavigationCardState } from '../../core/events/EventTypes';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { BaseEventPayload } from '../../core/events/EventTypes';
import { CardState } from '../card/CardState';

/**
 * 네비게이션 모드
 */
export enum NavigationMode {
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  LINEAR = 'linear',
  GRID = 'grid'
}

/**
 * 내비게이션 방향
 */
export type NavigationDirection = 'up' | 'down' | 'left' | 'right' | 'first' | 'last';

/**
 * 스크롤 동작
 */
export type ScrollBehavior = 'auto' | 'smooth';

/**
 * 그리드 정보 인터페이스
 */
export interface IGridInfo {
  columns: number;
  rows: number;
}

/**
 * 내비게이션 이벤트 페이로드 인터페이스
 */
export interface GridInfoChangedPayload {
  columns: number;
  rows: number;
}

export interface CardStateChangedPayload {
  activeCardId?: string | null;
  focusedCardId?: string | null;
  selectedCardIds?: Set<string>;
  card?: ICard;
  editMode?: boolean;
  index?: number;
  scrollBehavior?: ScrollBehavior;
}

export interface NavigationModeChangedPayload {
  navigationMode: NavigationMode;
}

export interface ScrollBehaviorChangedPayload {
  behavior: ScrollBehavior;
}

export interface CardEventPayload extends BaseEventPayload {
  card: string;
}

export interface CardSetEventPayload extends BaseEventPayload {
  cardSet: string;
}

export interface LayoutEventPayload extends BaseEventPayload {
  layout: string;
}

export interface NavigationEventPayload extends BaseEventPayload {
  card: string;
}

/**
 * 내비게이션 이벤트 발행자 인터페이스
 */
export interface INavigationEventPublisher {
  publishGridInfoChanged(payload: GridInfoChangedPayload): void;
  publishCardStateChanged(payload: CardStateChangedPayload): void;
  publishNavigationModeChanged(payload: NavigationModeChangedPayload): void;
  publishScrollBehaviorChanged(payload: ScrollBehaviorChangedPayload): void;
  publishCardEvent(payload: CardEventPayload): void;
  publishCardClicked(payload: CardEventPayload): void;
  publishCardContextMenu(payload: CardEventPayload): void;
  publishCardDoubleClicked(payload: CardEventPayload): void;
  publishCardFocused(payload: NavigationEventPayload): void;
  publishCardUnfocused(payload: NavigationEventPayload): void;
  publishCardScrolled(payload: NavigationEventPayload): void;
  publishCardSetCreated(payload: CardSetEventPayload): void;
  publishCardSetUpdated(payload: CardSetEventPayload): void;
  publishCardSetDeleted(payload: CardSetEventPayload): void;
  publishLayoutCreated(payload: LayoutEventPayload): void;
  publishLayoutUpdated(payload: LayoutEventPayload): void;
  publishLayoutDestroyed(payload: LayoutEventPayload): void;
  publishLayoutResized(payload: LayoutEventPayload): void;
}

/**
 * 내비게이션 인터페이스
 */
export interface INavigation {
  /**
   * 카드 선택
   */
  selectCard(cardId: string): void;

  /**
   * 카드 선택 해제
   */
  deselectCard(cardId: string): void;

  /**
   * 모든 카드 선택 해제
   */
  deselectAllCards(): void;

  /**
   * 카드 포커스
   */
  focusCard(cardId: string): boolean;

  /**
   * 카드 포커스 해제
   */
  unfocusCard(cardId: string): void;

  /**
   * 카드 열기
   */
  openCard(cardId: string): void;

  /**
   * 카드 닫기
   */
  closeCard(cardId: string): void;

  /**
   * 네비게이션 모드 설정
   */
  setNavigationMode(mode: NavigationMode): void;

  /**
   * 네비게이션 모드 조회
   */
  getNavigationMode(): NavigationMode;

  /**
   * 스크롤 동작 설정
   */
  setScrollBehavior(behavior: 'auto'): void;

  /**
   * 스크롤 동작 조회
   */
  getScrollBehavior(): 'auto';

  /**
   * 초기화
   */
  initialize(): void;
}

/**
 * 내비게이션 도메인 모델 구현
 */
export class Navigation implements INavigation {
  /**
   * 카드 목록
   */
  private cards: ICard[] = [];
  
  /**
   * 포커스된 카드 인덱스
   */
  private focusedIndex = -1;
  
  /**
   * 활성 카드
   */
  private activeCard: ICard | null = null;
  
  /**
   * 활성 카드 인덱스
   */
  private activeCardIndex = -1;
  
  /**
   * 스크롤 동작
   */
  private scrollBehavior: ScrollBehavior = 'smooth';
  
  /**
   * 내비게이션 모드
   */
  private navigationMode: NavigationMode = NavigationMode.KEYBOARD;
  
  /**
   * 선택된 카드 ID 목록
   */
  private selectedCardIds = new Set<string>();
  
  /**
   * 그리드 레이아웃 정보
   */
  private gridInfo: IGridInfo = {
    columns: 1,
    rows: 1
  };
  
  /**
   * 이벤트 버스
   */
  private eventBus: DomainEventBus;
  
  constructor() {
    this.eventBus = DomainEventBus.getInstance();
  }
  
  /**
   * 카드 목록 설정
   * @param cards 카드 목록
   */
  setCards(cards: ICard[]): void {
    this.cards = cards;
    this.updateIndices();
  }
  
  /**
   * 그리드 정보 설정
   */
  setGridInfo(columns: number, rows: number): void {
    this.gridInfo = { columns, rows };
    this.eventBus.publish(EventType.GRID_INFO_CHANGED, { 
      columns, 
      spacing: 0 // 기본값으로 0 설정
    }, 'Navigation');
  }
  
  /**
   * 카드 상태 가져오기
   */
  getCardState(): CardState {
    const focusedCard = this.getFocusedCard();
    const activeCard = this.activeCard;
    
    return {
      isSelected: this.selectedCardIds.size > 0,
      isFocused: this.focusedIndex !== -1,
      isOpen: activeCard !== null,
      isModified: false,
      isDeleted: false,
      activeCardId: activeCard?.getId() ?? null,
      focusedCardId: focusedCard?.getId() ?? null,
      selectedCardIds: new Set(this.selectedCardIds),
      index: this.activeCardIndex
    };
  }
  
  /**
   * 네비게이션 카드 상태 가져오기
   */
  private getNavigationCardState(): NavigationCardState {
    return {
      activeCardId: this.activeCard?.getId() ?? null,
      focusedCardId: this.getFocusedCard()?.getId() ?? null,
      selectedCardIds: new Set(this.selectedCardIds),
      index: this.activeCardIndex
    };
  }
  
  /**
   * 카드 상태 설정
   */
  setCardState(state: Partial<CardState>): void {
    if (state.isOpen !== undefined) {
      const card = this.cards.find(c => c.getId() === this.activeCard?.getId());
      if (card) {
        this.setActiveCard(card);
      }
    }

    if (state.isFocused !== undefined) {
      if (state.isFocused) {
        this.focusCard(this.getFocusedCard()?.getId() ?? '');
      } else {
        this.unfocusCard(this.getFocusedCard()?.getId() ?? '');
      }
    }

    if (state.isSelected !== undefined) {
      if (state.isSelected) {
        this.selectCard(this.getFocusedCard()?.getId() ?? '');
      } else {
        this.deselectCard(this.getFocusedCard()?.getId() ?? '');
      }
    }

    this.eventBus.publish(EventType.CARD_STATE_CHANGED, { 
      card: this.getFocusedCard()?.getId() ?? '',
      state: this.getNavigationCardState()
    }, 'Navigation');
  }
  
  /**
   * 키보드 이벤트 처리
   * @param event 키보드 이벤트
   * @returns 이벤트 처리 여부
   */
  async handleKeyEvent(event: KeyboardEvent): Promise<boolean> {
    if (this.cards.length === 0) {
      return false;
    }
    
    switch (event.key) {
      case 'ArrowUp':
        return this.navigate('up');
      case 'ArrowDown':
        return this.navigate('down');
      case 'ArrowLeft':
        return this.navigate('left');
      case 'ArrowRight':
        return this.navigate('right');
      case 'Enter':
        return await this.openFocusedCard();
      case 'e':
      case 'E':
        if (event.ctrlKey || event.metaKey) {
          return await this.editFocusedCard();
        }
        return false;
      default:
        return false;
    }
  }
  
  /**
   * 방향키 이동
   * @param direction 이동 방향
   * @returns 이동 성공 여부
   */
  navigate(direction: NavigationDirection): boolean {
    if (this.navigationMode === NavigationMode.LINEAR) {
      return this.navigateLinear(direction);
    }
    return this.navigateGrid(direction);
  }
  
  /**
   * 현재 포커스된 카드 열기
   * @returns 성공 여부
   */
  async openFocusedCard(): Promise<boolean> {
    const focusedCard = this.getFocusedCard();
    if (!focusedCard) {
      return false;
    }
    
    this.eventBus.publish(EventType.CARD_OPENED, {
      card: focusedCard.getId()
    }, 'Navigation');
    return true;
  }
  
  /**
   * 현재 포커스된 카드 편집
   */
  async editFocusedCard(): Promise<boolean> {
    const focusedCard = this.getFocusedCard();
    if (!focusedCard) {
      return false;
    }
    
    this.eventBus.publish(EventType.CARD_STATE_CHANGED, {
      card: focusedCard.getId(),
      state: this.getNavigationCardState()
    }, 'Navigation');
    return true;
  }
  
  /**
   * 현재 포커스된 카드 인덱스 가져오기
   * @returns 포커스된 카드 인덱스 또는 -1
   */
  getFocusedIndex(): number {
    return this.focusedIndex;
  }
  
  /**
   * 특정 카드로 스크롤
   */
  scrollToCard(cardIndex: number, behavior?: ScrollBehavior): void {
    const card = this.cards[cardIndex];
    if (!card) return;

    this.eventBus.publish(EventType.CARD_SCROLLED, { 
      card: card.getId()
    }, 'Navigation');
  }
  
  /**
   * 활성 카드로 스크롤
   * @param behavior 스크롤 동작
   */
  scrollToActiveCard(behavior?: ScrollBehavior): void {
    if (this.activeCardIndex !== -1) {
      this.scrollToCard(this.activeCardIndex, behavior);
    }
  }
  
  /**
   * 포커스된 카드로 스크롤
   * @param behavior 스크롤 동작
   */
  scrollToFocusedCard(behavior?: ScrollBehavior): void {
    if (this.focusedIndex !== -1) {
      this.scrollToCard(this.focusedIndex, behavior);
    }
  }
  
  /**
   * 카드 포커스
   * @param cardId 카드 ID
   * @returns 성공 여부
   */
  focusCard(cardId: string): boolean {
    const cardIndex = this.getCardIndexById(cardId);
    if (cardIndex !== -1) {
      this.focusedIndex = cardIndex;
      this.scrollToCard(cardIndex);
      return true;
    }
    return false;
  }
  
  /**
   * 카드 포커스 (인덱스 기반)
   * @param cardIndex 카드 인덱스
   * @returns 성공 여부
   */
  private focusCardByIndex(cardIndex: number): boolean {
    if (cardIndex >= 0 && cardIndex < this.cards.length) {
      return this.focusCard(this.cards[cardIndex].getId());
    }
    return false;
  }
  
  /**
   * 활성 카드 포커스
   * @returns 성공 여부
   */
  focusActiveCard(): boolean {
    if (this.activeCardIndex === -1) {
      return false;
    }
    return this.focusCardByIndex(this.activeCardIndex);
  }
  
  /**
   * 다음 카드 포커스
   * @returns 성공 여부
   */
  focusNextCard(): boolean {
    if (this.focusedIndex === -1) {
      return this.focusCardByIndex(0);
    }
    return this.focusCardByIndex(Math.min(this.focusedIndex + 1, this.cards.length - 1));
  }
  
  /**
   * 이전 카드 포커스
   * @returns 성공 여부
   */
  focusPreviousCard(): boolean {
    if (this.focusedIndex === -1) {
      return this.focusCardByIndex(this.cards.length - 1);
    }
    return this.focusCardByIndex(Math.max(this.focusedIndex - 1, 0));
  }
  
  /**
   * 포커스된 카드 가져오기
   * @returns 포커스된 카드 또는 null
   */
  getFocusedCard(): ICard | null {
    if (this.focusedIndex === -1 || this.focusedIndex >= this.cards.length) {
      return null;
    }
    
    return this.cards[this.focusedIndex];
  }
  
  /**
   * 포커스된 카드 인덱스 가져오기
   * @returns 포커스된 카드 인덱스 또는 -1
   */
  getFocusedCardIndex(): number {
    return this.focusedIndex;
  }
  
  /**
   * 활성 카드 설정
   */
  setActiveCard(card: ICard): void {
    this.activeCard = card;
    this.activeCardIndex = this.cards.findIndex(c => c.getId() === card.getId());
    this.eventBus.publish(EventType.CARD_STATE_CHANGED, {
      card: card.getId(),
      state: this.getNavigationCardState()
    }, 'Navigation');
  }
  
  /**
   * 활성 카드 가져오기
   * @returns 활성 카드 또는 null
   */
  getActiveCard(): ICard | null {
    return this.activeCard;
  }
  
  /**
   * 활성 카드 인덱스 가져오기
   * @returns 활성 카드 인덱스 또는 -1
   */
  getActiveCardIndex(): number {
    return this.activeCardIndex;
  }
  
  /**
   * 카드 선택
   */
  selectCard(cardId: string): void {
    this.selectedCardIds.add(cardId);
    this.eventBus.publish(EventType.CARD_SELECTED, {
      card: cardId
    }, 'Navigation');
  }

  /**
   * 카드 선택 해제
   */
  deselectCard(cardId: string): void {
    this.selectedCardIds.delete(cardId);
    this.eventBus.publish(EventType.CARD_DESELECTED, {
      card: cardId
    }, 'Navigation');
  }

  /**
   * 모든 카드 선택 해제
   */
  deselectAllCards(): void {
    this.selectedCardIds.clear();
    this.eventBus.publish(EventType.CARDS_DESELECTED, {}, 'Navigation');
  }

  private updateIndices(): void {
    // 활성 카드 인덱스 업데이트
    if (this.activeCard) {
      this.activeCardIndex = this.cards.findIndex(card => card.getId() === this.activeCard?.getId());
      if (this.activeCardIndex === -1) {
        this.activeCard = null;
      }
    }

    // 포커스된 카드 인덱스 업데이트
    if (this.focusedIndex >= this.cards.length) {
      this.focusedIndex = this.cards.length > 0 ? 0 : -1;
    }

    // 선택된 카드 ID 업데이트
    const validSelectedIds = new Set<string>();
    for (const id of this.selectedCardIds) {
      if (this.cards.some(card => card.getId() === id)) {
        validSelectedIds.add(id);
      }
    }
    if (validSelectedIds.size !== this.selectedCardIds.size) {
      this.selectedCardIds = validSelectedIds;
      this.eventBus.publish(EventType.CARD_STATE_CHANGED, { 
        card: Array.from(this.selectedCardIds)[0] || '',
        state: this.getNavigationCardState()
      }, 'Navigation');
    }
  }

  private navigateLinear(direction: NavigationDirection): boolean {
    switch (direction) {
      case 'right':
      case 'down':
        return this.focusNextCard();
      case 'left':
      case 'up':
        return this.focusPreviousCard();
      case 'first':
        return this.focusCardByIndex(0);
      case 'last':
        return this.focusCardByIndex(this.cards.length - 1);
      default:
        return false;
    }
  }

  private navigateGrid(direction: NavigationDirection): boolean {
    if (this.focusedIndex === -1) {
      return this.focusCardByIndex(0);
    }

    const currentRow = Math.floor(this.focusedIndex / this.gridInfo.columns);
    const currentCol = this.focusedIndex % this.gridInfo.columns;

    let nextIndex = -1;

    switch (direction) {
      case 'right':
        if (currentCol < this.gridInfo.columns - 1) {
          nextIndex = this.focusedIndex + 1;
        }
        break;
      case 'left':
        if (currentCol > 0) {
          nextIndex = this.focusedIndex - 1;
        }
        break;
      case 'down':
        if (currentRow < this.gridInfo.rows - 1) {
          nextIndex = this.focusedIndex + this.gridInfo.columns;
        }
        break;
      case 'up':
        if (currentRow > 0) {
          nextIndex = this.focusedIndex - this.gridInfo.columns;
        }
        break;
      case 'first':
        nextIndex = 0;
        break;
      case 'last':
        nextIndex = this.cards.length - 1;
        break;
    }

    if (nextIndex >= 0 && nextIndex < this.cards.length) {
      return this.focusCardByIndex(nextIndex);
    }

    return false;
  }

  /**
   * 카드 목록 가져오기
   */
  getCards(): ICard[] {
    return [...this.cards];
  }

  /**
   * 네비게이션 모드 설정
   */
  setNavigationMode(mode: NavigationMode): void {
    const previousMode = this.navigationMode;
    this.navigationMode = mode;
    this.eventBus.publish(EventType.NAVIGATION_MODE_CHANGED, {
      mode: mode === NavigationMode.KEYBOARD ? 'normal' : 'vim',
      previousMode: previousMode === NavigationMode.KEYBOARD ? 'normal' : 'vim'
    }, 'Navigation');
  }

  /**
   * 네비게이션 모드 조회
   */
  getNavigationMode(): NavigationMode {
    return this.navigationMode;
  }

  /**
   * 그리드 정보 가져오기
   */
  getGridInfo(): IGridInfo {
    return { ...this.gridInfo };
  }

  private getCardIndexById(id: string): number {
    return this.cards.findIndex(card => card.getId() === id);
  }

  /**
   * 카드 포커스 해제
   */
  unfocusCard(cardId: string): void {
    if (this.focusedIndex !== -1 && this.cards[this.focusedIndex]?.getId() === cardId) {
      this.focusedIndex = -1;
      this.eventBus.publish(EventType.CARD_UNFOCUSED, {
        card: cardId
      }, 'Navigation');
    }
  }

  /**
   * 카드 열기
   */
  openCard(cardId: string): void {
    this.eventBus.publish(EventType.CARD_OPENED, {
      card: cardId
    }, 'Navigation');
  }

  /**
   * 카드 닫기
   */
  closeCard(cardId: string): void {
    this.eventBus.publish(EventType.CARD_CLOSED, {
      card: cardId
    }, 'Navigation');
  }

  /**
   * 스크롤 동작 설정
   */
  setScrollBehavior(behavior: 'auto'): void {
    this.scrollBehavior = behavior;
    this.eventBus.publish(EventType.SCROLL_BEHAVIOR_CHANGED, {
      behavior: behavior as 'smooth' | 'instant'
    }, 'Navigation');
  }

  /**
   * 스크롤 동작 조회
   */
  getScrollBehavior(): 'auto' {
    return 'auto';
  }

  /**
   * 초기화
   */
  initialize(): void {
    this.focusedIndex = -1;
    this.activeCard = null;
    this.activeCardIndex = -1;
    this.selectedCardIds.clear();
    this.navigationMode = NavigationMode.KEYBOARD;
    this.scrollBehavior = 'auto';
  }
} 