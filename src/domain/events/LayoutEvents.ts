import { DomainEvent } from './DomainEvent';
import { Layout } from '@/domain/models/Layout';
import { CardPosition } from '@/domain/models/Card';

/**
 * 레이아웃 이벤트 타입
 */
export enum LayoutEventType {
    LAYOUT_CREATED = 'LAYOUT_CREATED',
    LAYOUT_UPDATED = 'LAYOUT_UPDATED',
    LAYOUT_DELETED = 'LAYOUT_DELETED',
    LAYOUT_CARD_POSITION_UPDATED = 'LAYOUT_CARD_POSITION_UPDATED',
    LAYOUT_CARD_POSITION_ADDED = 'LAYOUT_CARD_POSITION_ADDED',
    LAYOUT_CARD_POSITION_REMOVED = 'LAYOUT_CARD_POSITION_REMOVED',
    LAYOUT_CARD_POSITIONS_RESET = 'LAYOUT_CARD_POSITIONS_RESET',
    LAYOUT_CONFIG_UPDATED = 'LAYOUT_CONFIG_UPDATED',
    LAYOUT_CALCULATED = 'LAYOUT_CALCULATED'
}

/**
 * 레이아웃 이벤트 기본 클래스
 */
export abstract class LayoutEvent extends DomainEvent {
    constructor(
        public readonly type: LayoutEventType,
        public readonly layoutId: string
    ) {
        super(type);
    }
}

/**
 * 레이아웃 생성 이벤트
 */
export class LayoutCreatedEvent extends LayoutEvent {
    constructor(
        public readonly layout: Layout
    ) {
        super(LayoutEventType.LAYOUT_CREATED, layout.id);
    }
}

/**
 * 레이아웃 업데이트 이벤트
 */
export class LayoutUpdatedEvent extends LayoutEvent {
    constructor(
        public readonly layout: Layout
    ) {
        super(LayoutEventType.LAYOUT_UPDATED, layout.id);
    }
}

/**
 * 레이아웃 삭제 이벤트
 */
export class LayoutDeletedEvent extends LayoutEvent {
    constructor(
        public readonly layoutId: string
    ) {
        super(LayoutEventType.LAYOUT_DELETED, layoutId);
    }
}

/**
 * 레이아웃 카드 위치 업데이트 이벤트
 */
export class LayoutCardPositionUpdatedEvent extends LayoutEvent {
    constructor(
        public readonly layoutId: string,
        public readonly cardPosition: CardPosition
    ) {
        super(LayoutEventType.LAYOUT_CARD_POSITION_UPDATED, layoutId);
    }
}

/**
 * 레이아웃 카드 위치 추가 이벤트
 */
export class LayoutCardPositionAddedEvent extends LayoutEvent {
    constructor(
        public readonly layoutId: string,
        public readonly cardPosition: CardPosition
    ) {
        super(LayoutEventType.LAYOUT_CARD_POSITION_ADDED, layoutId);
    }
}

/**
 * 레이아웃 카드 위치 제거 이벤트
 */
export class LayoutCardPositionRemovedEvent extends LayoutEvent {
    constructor(
        public readonly layoutId: string,
        public readonly cardId: string
    ) {
        super(LayoutEventType.LAYOUT_CARD_POSITION_REMOVED, layoutId);
    }
}

/**
 * 레이아웃 카드 위치 초기화 이벤트
 */
export class LayoutCardPositionsResetEvent extends LayoutEvent {
    constructor(
        public readonly layoutId: string
    ) {
        super(LayoutEventType.LAYOUT_CARD_POSITIONS_RESET, layoutId);
    }
}

/**
 * 레이아웃 설정 업데이트 이벤트
 */
export class LayoutConfigUpdatedEvent extends LayoutEvent {
    constructor(
        public readonly layoutId: string
    ) {
        super(LayoutEventType.LAYOUT_CONFIG_UPDATED, layoutId);
    }
}

/**
 * 레이아웃 계산 이벤트
 */
export class LayoutCalculatedEvent extends LayoutEvent {
    constructor(
        public readonly layoutId: string
    ) {
        super(LayoutEventType.LAYOUT_CALCULATED, layoutId);
    }
}

/**
 * 레이아웃 초기화 이벤트
 */
export class LayoutClearedEvent extends DomainEvent {
    constructor() {
        super('LayoutClearedEvent');
    }
} 