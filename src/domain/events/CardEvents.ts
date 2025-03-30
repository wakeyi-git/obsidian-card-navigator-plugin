import { DomainEvent } from './DomainEvent';
import { Card } from '@/domain/models/Card';

/**
 * 카드 이벤트 타입
 */
export type CardEvent = 
    | CardCreatedEvent 
    | CardUpdatedEvent 
    | CardDeletedEvent 
    | CardStyleChangedEvent 
    | CardPositionChangedEvent 
    | CardRenderedEvent
    | CardClickEvent
    | CardOpenEvent
    | CardFocusEvent
    | CardSelectEvent;

/**
 * 카드 이벤트 상수
 */
export const CardEventType = {
    CARD_CREATED: 'CARD_CREATED',
    CARD_UPDATED: 'CARD_UPDATED',
    CARD_DELETED: 'CARD_DELETED',
    CARD_STYLE_CHANGED: 'CARD_STYLE_CHANGED',
    CARD_POSITION_CHANGED: 'CARD_POSITION_CHANGED',
    CARD_RENDERED: 'CARD_RENDERED',
    CARD_CLICK: 'CARD_CLICK',
    CARD_OPEN: 'CARD_OPEN',
    CARD_FOCUS: 'CARD_FOCUS',
    CARD_SELECT: 'CARD_SELECT'
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

/**
 * 카드 렌더링 완료 이벤트
 */
export class CardRenderedEvent extends DomainEvent {
    constructor(
        public readonly cardId: string,
        public readonly html: string
    ) {
        super(CardEventType.CARD_RENDERED);
    }
}

/**
 * 카드 클릭 이벤트
 */
export class CardClickEvent extends DomainEvent {
    constructor(public readonly card: Card) {
        super(CardEventType.CARD_CLICK);
    }
}

/**
 * 카드 열기 이벤트
 */
export class CardOpenEvent extends DomainEvent {
    constructor(public readonly card: Card) {
        super(CardEventType.CARD_OPEN);
    }
}

/**
 * 카드 포커스 이벤트
 */
export class CardFocusEvent extends DomainEvent {
    constructor(public readonly card: Card) {
        super(CardEventType.CARD_FOCUS);
    }
}

/**
 * 카드 선택 이벤트
 */
export class CardSelectEvent extends DomainEvent {
    constructor(public readonly card: Card) {
        super(CardEventType.CARD_SELECT);
    }
} 