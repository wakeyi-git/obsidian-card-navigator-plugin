import { DomainEvent } from './DomainEvent';
import { Card } from '../models/Card';
import { CardStyle, CardPosition } from '../models/types';

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
 * 카드 생성 이벤트
 */
export class CardCreatedEvent extends DomainEvent {
    constructor(public readonly card: Card) {
        super();
    }
}

/**
 * 카드 수정 이벤트
 */
export class CardUpdatedEvent extends DomainEvent {
    constructor(public readonly card: Card) {
        super();
    }
}

/**
 * 카드 삭제 이벤트
 */
export class CardDeletedEvent extends DomainEvent {
    constructor(public readonly cardId: string) {
        super();
    }
}

/**
 * 카드 스타일 변경 이벤트
 */
export class CardStyleChangedEvent extends DomainEvent {
    constructor(
        public readonly cardId: string,
        public readonly style: CardStyle
    ) {
        super();
    }
}

/**
 * 카드 위치 변경 이벤트
 */
export class CardPositionChangedEvent extends DomainEvent {
    constructor(
        public readonly cardId: string,
        public readonly position: CardPosition
    ) {
        super();
    }
} 