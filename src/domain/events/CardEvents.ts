import { DomainEvent, DomainEventType } from './DomainEvent';
import { ICard } from '../models/Card';

/**
 * 카드 생성 이벤트
 */
export class CardCreatedEvent extends DomainEvent {
  constructor(public readonly card: ICard) {
    super('card.created' as DomainEventType);
  }
}

/**
 * 카드 업데이트 이벤트
 */
export class CardUpdatedEvent extends DomainEvent {
  constructor(public readonly card: ICard) {
    super('card.updated' as DomainEventType);
  }
}

/**
 * 카드 삭제 이벤트
 */
export class CardDeletedEvent extends DomainEvent {
  constructor(public readonly cardId: string) {
    super('card.deleted' as DomainEventType);
  }
}

/**
 * 카드 선택 이벤트
 */
export class CardSelectedEvent extends DomainEvent {
  constructor(public readonly card: ICard) {
    super('card.selected' as DomainEventType);
  }
}

/**
 * 카드 선택 해제 이벤트
 */
export class CardDeselectedEvent extends DomainEvent {
  constructor(public readonly card: ICard) {
    super('card.deselected' as DomainEventType);
  }
}

/**
 * 카드 렌더링 완료 이벤트
 */
export class CardRenderedEvent extends DomainEvent {
  constructor(public readonly card: ICard) {
    super('card.rendered' as DomainEventType);
  }
} 