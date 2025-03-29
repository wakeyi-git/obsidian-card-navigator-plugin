import { DomainEvent } from './DomainEvent';
import { CardSet } from '../models/CardSet';

/**
 * 카드셋 이벤트 타입
 */
export type CardSetEvent = 
    | CardSetCreatedEvent 
    | CardSetUpdatedEvent 
    | CardSetDeletedEvent;

/**
 * 카드셋 이벤트 상수
 */
export const CardSetEventType = {
    CARD_SET_CREATED: 'CARD_SET_CREATED',
    CARD_SET_UPDATED: 'CARD_SET_UPDATED',
    CARD_SET_DELETED: 'CARD_SET_DELETED'
} as const;

/**
 * 카드셋 생성 이벤트
 */
export class CardSetCreatedEvent extends DomainEvent {
    constructor(public readonly cardSet: CardSet) {
        super(CardSetEventType.CARD_SET_CREATED);
    }
}

/**
 * 카드셋 수정 이벤트
 */
export class CardSetUpdatedEvent extends DomainEvent {
    constructor(public readonly cardSet: CardSet) {
        super(CardSetEventType.CARD_SET_UPDATED);
    }
}

/**
 * 카드셋 삭제 이벤트
 */
export class CardSetDeletedEvent extends DomainEvent {
    constructor(public readonly cardSetId: string) {
        super(CardSetEventType.CARD_SET_DELETED);
    }
} 