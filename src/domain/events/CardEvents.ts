import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { ICard } from '../models/Card';
import { BaseEvent } from './BaseEvent';

/**
 * 카드 생성 이벤트
 */
export class CardCreatedEvent extends DomainEvent<ICard> {
  constructor(public readonly card: ICard) {
    super(DomainEventType.CARD_CREATED, card);
  }
}

/**
 * 카드 업데이트 이벤트
 */
export class CardUpdatedEvent extends DomainEvent<ICard> {
  constructor(public readonly card: ICard) {
    super(DomainEventType.CARD_UPDATED, card);
  }
}

/**
 * 카드 삭제 이벤트
 */
export class CardDeletedEvent extends DomainEvent<string> {
  constructor(public readonly cardId: string) {
    super(DomainEventType.CARD_DELETED, cardId);
  }
}

/**
 * 카드 선택 이벤트
 */
export class CardSelectedEvent extends DomainEvent<string> {
  constructor(public readonly cardId: string) {
    super(DomainEventType.CARD_SELECTED, cardId);
  }
}

/**
 * 카드 선택 해제 이벤트
 */
export class CardDeselectedEvent extends DomainEvent<string> {
  constructor(public readonly cardId: string) {
    super(DomainEventType.CARD_DESELECTED, cardId);
  }
}

/**
 * 카드 포커스 이벤트
 */
export class CardFocusedEvent extends DomainEvent<string> {
  constructor(public readonly cardId: string) {
    super(DomainEventType.CARD_FOCUSED, cardId);
  }
}

/**
 * 카드 드래그 이벤트
 */
export class CardDraggedEvent extends DomainEvent<string> {
  constructor(public readonly cardId: string) {
    super(DomainEventType.CARD_DRAGGED, cardId);
  }
}

/**
 * 카드 드롭 이벤트
 */
export class CardDroppedEvent extends DomainEvent<string> {
  constructor(public readonly cardId: string) {
    super(DomainEventType.CARD_DROPPED, cardId);
  }
}

/**
 * 카드 활성화 이벤트
 */
export class CardActivatedEvent extends DomainEvent<string> {
  constructor(public readonly cardId: string) {
    super(DomainEventType.CARD_ACTIVATED, cardId);
  }
}

/**
 * 카드 비활성화 이벤트
 */
export class CardDeactivatedEvent extends DomainEvent<string> {
  constructor(public readonly cardId: string) {
    super(DomainEventType.CARD_DEACTIVATED, cardId);
  }
}

/**
 * 카드 클릭 이벤트
 */
export class CardClickedEvent extends BaseEvent {
  constructor(
    public readonly cardId: string,
    public readonly metadata: Record<string, any> = {}
  ) {
    super('CardClickedEvent');
  }
}

/**
 * 카드 더블 클릭 이벤트
 */
export class CardDoubleClickedEvent extends BaseEvent {
  constructor(
    public readonly cardId: string,
    public readonly metadata: Record<string, any> = {}
  ) {
    super('CardDoubleClickedEvent');
  }
}

/**
 * 카드 컨텍스트 메뉴 이벤트
 */
export class CardContextMenuEvent extends BaseEvent {
  constructor(
    public readonly cardId: string,
    public readonly event: MouseEvent,
    public readonly metadata: Record<string, any> = {}
  ) {
    super('CardContextMenuEvent');
  }
}

/**
 * 카드 드래그 시작 이벤트
 */
export class CardDragStartEvent extends BaseEvent {
  constructor(
    public readonly cardId: string,
    public readonly metadata: Record<string, any> = {}
  ) {
    super('CardDragStartEvent');
  }
}

/**
 * 카드 드롭 이벤트 (새로운 형식)
 */
export class CardDropEvent extends BaseEvent {
  constructor(
    public readonly targetCardId: string,
    public readonly sourceData: string,
    public readonly metadata: Record<string, any> = {}
  ) {
    super('CardDropEvent');
  }
}

/**
 * 카드 위치 업데이트 이벤트
 */
export class LayoutCardPositionUpdatedEvent extends BaseEvent {
  constructor(
    public readonly cardId: string,
    public readonly x: number,
    public readonly y: number,
    public readonly metadata: Record<string, any> = {}
  ) {
    super('LayoutCardPositionUpdatedEvent');
  }
} 