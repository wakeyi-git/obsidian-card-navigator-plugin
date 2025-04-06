import { DomainEvent } from './DomainEvent';
import { ICard } from '../models/Card';
import { DomainEventType } from './DomainEventType';
import { ILayoutConfig } from '../models/LayoutConfig';

/**
 * 메타데이터 타입
 */
export interface ICardEventMetadata {
  timestamp?: number;
  source?: string;
  target?: string;
  position?: { x: number; y: number };
  dimensions?: { width: number; height: number };
  [key: string]: unknown;
}

/**
 * 카드 생성 이벤트
 */
export class CardCreatedEvent extends DomainEvent<typeof DomainEventType.CARD_CREATED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_CREATED, { card });
  }
}

/**
 * 카드 업데이트 이벤트
 */
export class CardUpdatedEvent extends DomainEvent<typeof DomainEventType.CARD_UPDATED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_UPDATED, { card });
  }
}

/**
 * 카드 삭제 이벤트
 */
export class CardDeletedEvent extends DomainEvent<typeof DomainEventType.CARD_DELETED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_DELETED, { card });
  }
}

/**
 * 카드 선택 이벤트
 */
export class CardSelectedEvent extends DomainEvent<typeof DomainEventType.CARD_SELECTED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_SELECTED, { card });
  }
}

/**
 * 카드 선택 해제 이벤트
 */
export class CardDeselectedEvent extends DomainEvent<typeof DomainEventType.CARD_DESELECTED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_DESELECTED, { card });
  }
}

/**
 * 선택 해제 이벤트
 */
export class SelectionClearedEvent extends DomainEvent<typeof DomainEventType.SELECTION_CLEARED> {
  constructor(cards: ICard[]) {
    super(DomainEventType.SELECTION_CLEARED, { cards });
  }
}

/**
 * 카드 포커스 이벤트
 */
export class CardFocusedEvent extends DomainEvent<typeof DomainEventType.CARD_FOCUSED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_FOCUSED, { card });
  }
}

/**
 * 카드 드래그 이벤트
 */
export class CardDraggedEvent extends DomainEvent<typeof DomainEventType.CARD_DRAGGED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_DRAGGED, { card });
  }
}

/**
 * 카드 드롭 이벤트
 */
export class CardDroppedEvent extends DomainEvent<typeof DomainEventType.CARD_DROPPED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_DROPPED, { card });
  }
}

/**
 * 카드 활성화 이벤트
 */
export class CardActivatedEvent extends DomainEvent<typeof DomainEventType.CARD_ACTIVATED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_ACTIVATED, { card });
  }
}

/**
 * 카드 비활성화 이벤트
 */
export class CardDeactivatedEvent extends DomainEvent<typeof DomainEventType.CARD_DEACTIVATED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_DEACTIVATED, { card });
  }
}

/**
 * 카드 클릭 이벤트
 */
export class CardClickedEvent extends DomainEvent<typeof DomainEventType.CARD_CLICKED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_CLICKED, { card });
  }
}

/**
 * 카드 더블 클릭 이벤트
 */
export class CardDoubleClickedEvent extends DomainEvent<typeof DomainEventType.CARD_DOUBLE_CLICKED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_DOUBLE_CLICKED, { card });
  }
}

/**
 * 카드 컨텍스트 메뉴 이벤트
 */
export class CardContextMenuEvent extends DomainEvent<typeof DomainEventType.CARD_CONTEXT_MENU> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_CONTEXT_MENU, { card });
  }
}

/**
 * 카드 드래그 시작 이벤트
 */
export class CardDragStartEvent extends DomainEvent<typeof DomainEventType.CARD_DRAG_START> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_DRAG_START, { card });
  }
}

/**
 * 카드 드롭 이벤트
 */
export class CardDropEvent extends DomainEvent<typeof DomainEventType.CARD_DROP> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_DROP, { card });
  }
}

/**
 * 카드 위치 업데이트 이벤트
 */
export class CardPositionUpdatedEvent extends DomainEvent<typeof DomainEventType.LAYOUT_CARD_POSITION_UPDATED> {
  constructor(cardId: string, x: number, y: number, layoutConfig: ILayoutConfig) {
    super(DomainEventType.LAYOUT_CARD_POSITION_UPDATED, { cardId, x, y, layoutConfig });
  }
}

/**
 * 카드 렌더링 이벤트
 */
export class CardRenderingEvent extends DomainEvent<typeof DomainEventType.CARD_RENDERING> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_RENDERING, { card });
  }
} 