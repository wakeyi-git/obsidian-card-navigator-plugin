import { DomainEvent } from './DomainEvent';
import { Card } from '../models/Card';

/**
 * 카드 이벤트 타입
 */
export type CardEvent = 
    | CardCreatedEvent 
    | CardUpdatedEvent 
    | CardDeletedEvent 
    | CardStyleChangedEvent 
    | CardPositionChangedEvent;

/**
 * 카드 이벤트 상수
 */
export const CardEventType = {
    CARD_CREATED: 'CARD_CREATED',
    CARD_UPDATED: 'CARD_UPDATED',
    CARD_DELETED: 'CARD_DELETED',
    CARD_STYLE_CHANGED: 'CARD_STYLE_CHANGED',
    CARD_POSITION_CHANGED: 'CARD_POSITION_CHANGED'
} as const;

/**
 * 카드 생성 이벤트
 */
export class CardCreatedEvent extends DomainEvent {
    constructor(public readonly card: Card) {
        super(CardEventType.CARD_CREATED);
    }
}

/**
 * 카드 수정 이벤트
 */
export class CardUpdatedEvent extends DomainEvent {
    constructor(public readonly card: Card) {
        super(CardEventType.CARD_UPDATED);
    }
}

/**
 * 카드 삭제 이벤트
 */
export class CardDeletedEvent extends DomainEvent {
    constructor(public readonly cardId: string) {
        super(CardEventType.CARD_DELETED);
    }
}

/**
 * 카드 스타일 변경 이벤트
 */
export class CardStyleChangedEvent extends DomainEvent {
    constructor(
        public readonly cardId: string,
    ) {
        super(CardEventType.CARD_STYLE_CHANGED);
    }
}

/**
 * 카드 위치 변경 이벤트
 */
export class CardPositionChangedEvent extends DomainEvent {
    constructor(
        public readonly cardId: string,
    ) {
        super(CardEventType.CARD_POSITION_CHANGED);
    }
} 