import { DomainEvent } from './DomainEvent';
import { ICardRenderConfig } from '@/domain/models/Card';
import { ILayoutConfig } from '@/domain/models/Layout';

/**
 * 툴바 이벤트 타입
 */
export type ToolbarEvent = 
    | ToolbarSearchEvent 
    | ToolbarSortEvent 
    | ToolbarSettingsEvent 
    | ToolbarCardSetTypeChangeEvent 
    | ToolbarPresetChangeEvent 
    | ToolbarCreateEvent 
    | ToolbarUpdateEvent
    | ToolbarCardRenderConfigChangeEvent
    | ToolbarLayoutConfigChangeEvent;

/**
 * 툴바 이벤트 타입 열거형
 */
export enum ToolbarEventType {
    TOOLBAR_SEARCH = 'TOOLBAR_SEARCH',
    TOOLBAR_SORT = 'TOOLBAR_SORT',
    TOOLBAR_SETTINGS = 'TOOLBAR_SETTINGS',
    TOOLBAR_CARD_SET_TYPE_CHANGE = 'TOOLBAR_CARD_SET_TYPE_CHANGE',
    TOOLBAR_PRESET_CHANGE = 'TOOLBAR_PRESET_CHANGE',
    TOOLBAR_CREATE = 'TOOLBAR_CREATE',
    TOOLBAR_UPDATE = 'TOOLBAR_UPDATE',
    TOOLBAR_CARD_RENDER_CONFIG_CHANGE = 'TOOLBAR_CARD_RENDER_CONFIG_CHANGE',
    TOOLBAR_LAYOUT_CONFIG_CHANGE = 'TOOLBAR_LAYOUT_CONFIG_CHANGE'
}

/**
 * 검색 이벤트
 */
export class ToolbarSearchEvent extends DomainEvent {
    constructor(public query: string) {
        super(ToolbarEventType.TOOLBAR_SEARCH);
    }
}

/**
 * 정렬 이벤트
 */
export class ToolbarSortEvent extends DomainEvent {
    constructor(
        public criterion: string,
        public order: 'asc' | 'desc'
    ) {
        super(ToolbarEventType.TOOLBAR_SORT);
    }
}

/**
 * 설정 이벤트
 */
export class ToolbarSettingsEvent extends DomainEvent {
    constructor() {
        super(ToolbarEventType.TOOLBAR_SETTINGS);
    }
}

/**
 * 카드셋 타입 변경 이벤트
 */
export class ToolbarCardSetTypeChangeEvent extends DomainEvent {
    constructor(public type: string) {
        super(ToolbarEventType.TOOLBAR_CARD_SET_TYPE_CHANGE);
    }
}

/**
 * 프리셋 변경 이벤트
 */
export class ToolbarPresetChangeEvent extends DomainEvent {
    constructor(public presetId: string) {
        super(ToolbarEventType.TOOLBAR_PRESET_CHANGE);
    }
}

/**
 * 생성 이벤트
 */
export class ToolbarCreateEvent extends DomainEvent {
    constructor() {
        super(ToolbarEventType.TOOLBAR_CREATE);
    }
}

/**
 * 업데이트 이벤트
 */
export class ToolbarUpdateEvent extends DomainEvent {
    constructor() {
        super(ToolbarEventType.TOOLBAR_UPDATE);
    }
}

/**
 * 카드 렌더링 설정 변경 이벤트
 */
export class ToolbarCardRenderConfigChangeEvent extends DomainEvent {
    constructor(public config: ICardRenderConfig) {
        super(ToolbarEventType.TOOLBAR_CARD_RENDER_CONFIG_CHANGE);
    }
}

/**
 * 레이아웃 설정 변경 이벤트
 */
export class ToolbarLayoutConfigChangeEvent extends DomainEvent {
    constructor(public config: ILayoutConfig) {
        super(ToolbarEventType.TOOLBAR_LAYOUT_CONFIG_CHANGE);
    }
} 