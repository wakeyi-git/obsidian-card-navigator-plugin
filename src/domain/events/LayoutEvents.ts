import { DomainEvent } from './DomainEvent';
import { Layout } from '../models/Layout';
import { ICardPosition } from '../models/Layout';

/**
 * 레이아웃 이벤트 타입
 */
export type LayoutEvent = 
    | LayoutCreatedEvent 
    | LayoutUpdatedEvent 
    | LayoutDeletedEvent
    | LayoutCardPositionUpdatedEvent
    | LayoutCardPositionAddedEvent
    | LayoutCardPositionRemovedEvent
    | LayoutCardPositionsResetEvent
    | LayoutConfigUpdatedEvent
    | LayoutCalculatedEvent;

/**
 * 레이아웃 이벤트 상수
 */
export const LayoutEventType = {
    LAYOUT_CREATED: 'LAYOUT_CREATED',
    LAYOUT_UPDATED: 'LAYOUT_UPDATED',
    LAYOUT_DELETED: 'LAYOUT_DELETED',
    LAYOUT_CARD_POSITION_UPDATED: 'LAYOUT_CARD_POSITION_UPDATED',
    LAYOUT_CARD_POSITION_ADDED: 'LAYOUT_CARD_POSITION_ADDED',
    LAYOUT_CARD_POSITION_REMOVED: 'LAYOUT_CARD_POSITION_REMOVED',
    LAYOUT_CARD_POSITIONS_RESET: 'LAYOUT_CARD_POSITIONS_RESET',
    LAYOUT_CONFIG_UPDATED: 'LAYOUT_CONFIG_UPDATED',
    LAYOUT_CALCULATED: 'LAYOUT_CALCULATED'
} as const;

/**
 * 레이아웃 생성 이벤트
 */
export class LayoutCreatedEvent extends DomainEvent {
    constructor(public readonly layout: Layout) {
        super(LayoutEventType.LAYOUT_CREATED);
    }
}

/**
 * 레이아웃 수정 이벤트
 */
export class LayoutUpdatedEvent extends DomainEvent {
    constructor(public readonly layout: Layout) {
        super(LayoutEventType.LAYOUT_UPDATED);
    }
}

/**
 * 레이아웃 삭제 이벤트
 */
export class LayoutDeletedEvent extends DomainEvent {
    constructor(public readonly layoutId: string) {
        super(LayoutEventType.LAYOUT_DELETED);
    }
}

/**
 * 레이아웃 카드 위치 업데이트 이벤트
 */
export class LayoutCardPositionUpdatedEvent extends DomainEvent {
    constructor(
        public readonly layoutId: string,
        public readonly cardPosition: ICardPosition
    ) {
        super(LayoutEventType.LAYOUT_CARD_POSITION_UPDATED);
    }
}

/**
 * 레이아웃 카드 위치 추가 이벤트
 */
export class LayoutCardPositionAddedEvent extends DomainEvent {
    constructor(
        public readonly layoutId: string,
        public readonly cardPosition: ICardPosition
    ) {
        super(LayoutEventType.LAYOUT_CARD_POSITION_ADDED);
    }
}

/**
 * 레이아웃 카드 위치 제거 이벤트
 */
export class LayoutCardPositionRemovedEvent extends DomainEvent {
    constructor(
        public readonly layoutId: string,
        public readonly cardId: string
    ) {
        super(LayoutEventType.LAYOUT_CARD_POSITION_REMOVED);
    }
}

/**
 * 레이아웃 카드 위치 초기화 이벤트
 */
export class LayoutCardPositionsResetEvent extends DomainEvent {
    constructor(public readonly layoutId: string) {
        super(LayoutEventType.LAYOUT_CARD_POSITIONS_RESET);
    }
}

/**
 * 레이아웃 설정 업데이트 이벤트
 */
export class LayoutConfigUpdatedEvent extends DomainEvent {
    constructor(public readonly layoutId: string) {
        super(LayoutEventType.LAYOUT_CONFIG_UPDATED);
    }
}

/**
 * 레이아웃 계산 이벤트
 */
export class LayoutCalculatedEvent extends DomainEvent {
    constructor(public readonly layoutId: string) {
        super(LayoutEventType.LAYOUT_CALCULATED);
    }
} 