import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { ICard } from '../models/Card';

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