import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { ICardSet } from '../models/CardSet';

/**
 * 카드셋 생성 이벤트
 */
export class CardSetCreatedEvent extends DomainEvent<ICardSet> {
  constructor(public readonly cardSet: ICardSet) {
    super(DomainEventType.CARD_SET_CREATED, cardSet);
  }
}

/**
 * 카드셋 업데이트 이벤트
 */
export class CardSetUpdatedEvent extends DomainEvent<ICardSet> {
  constructor(public readonly cardSet: ICardSet) {
    super(DomainEventType.CARD_SET_UPDATED, cardSet);
  }
}

/**
 * 카드셋 삭제 이벤트
 */
export class CardSetDeletedEvent extends DomainEvent<string> {
  constructor(public readonly cardSetId: string) {
    super(DomainEventType.CARD_SET_DELETED, cardSetId);
  }
}

/**
 * 카드셋 필터링 이벤트
 */
export class CardSetFilteredEvent extends DomainEvent<ICardSet> {
  constructor(public readonly cardSet: ICardSet) {
    super(DomainEventType.CARD_SET_FILTERED, cardSet);
  }
}

/**
 * 카드셋 정렬 이벤트
 */
export class CardSetSortedEvent extends DomainEvent<ICardSet> {
  constructor(public readonly cardSet: ICardSet) {
    super(DomainEventType.CARD_SET_SORTED, cardSet);
  }
}

/**
 * 카드셋 레이아웃 변경 이벤트
 */
export class CardSetLayoutChangedEvent extends DomainEvent<ICardSet> {
  constructor(public readonly cardSet: ICardSet) {
    super(DomainEventType.CARD_SET_LAYOUT_CHANGED, cardSet);
  }
}

/**
 * 카드셋 크기 변경 이벤트
 */
export class CardSetResizedEvent extends DomainEvent<ICardSet> {
  constructor(public readonly cardSet: ICardSet) {
    super(DomainEventType.CARD_SET_RESIZED, cardSet);
  }
} 