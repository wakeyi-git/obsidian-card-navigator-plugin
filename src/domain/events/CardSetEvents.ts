import { DomainEvent, DomainEventType } from './DomainEvent';
import { ICardSet } from '../models/CardSet';

/**
 * 카드셋 생성 이벤트
 */
export class CardSetCreatedEvent extends DomainEvent {
  constructor(public readonly cardSet: ICardSet) {
    super('cardSet.created' as DomainEventType);
  }
}

/**
 * 카드셋 업데이트 이벤트
 */
export class CardSetUpdatedEvent extends DomainEvent {
  constructor(public readonly cardSet: ICardSet) {
    super('cardSet.updated' as DomainEventType);
  }
}

/**
 * 카드셋 삭제 이벤트
 */
export class CardSetDeletedEvent extends DomainEvent {
  constructor(public readonly cardSetId: string) {
    super('cardSet.deleted' as DomainEventType);
  }
}

/**
 * 카드셋 선택 이벤트
 */
export class CardSetSelectedEvent extends DomainEvent {
  constructor(public readonly cardSet: ICardSet) {
    super('cardSet.selected' as DomainEventType);
  }
}

/**
 * 카드셋 선택 해제 이벤트
 */
export class CardSetDeselectedEvent extends DomainEvent {
  constructor(public readonly cardSet: ICardSet) {
    super('cardSet.deselected' as DomainEventType);
  }
}

/**
 * 카드셋 필터링 이벤트
 */
export class CardSetFilteredEvent extends DomainEvent {
  constructor(public readonly cardSet: ICardSet) {
    super('cardSet.filtered' as DomainEventType);
  }
}

/**
 * 카드셋 정렬 이벤트
 */
export class CardSetSortedEvent extends DomainEvent {
  constructor(public readonly cardSet: ICardSet) {
    super('cardSet.sorted' as DomainEventType);
  }
} 