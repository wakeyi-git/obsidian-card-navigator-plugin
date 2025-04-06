import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { ILayoutConfig } from '../models/LayoutConfig';
import { ICard } from '../models/Card';

/**
 * 레이아웃 설정 업데이트 이벤트
 */
export class LayoutConfigUpdatedEvent extends DomainEvent<typeof DomainEventType.LAYOUT_CONFIG_UPDATED> {
  constructor(layoutConfig: ILayoutConfig) {
    super(DomainEventType.LAYOUT_CONFIG_UPDATED, { layoutConfig });
  }
}

/**
 * 레이아웃 모드 변경 이벤트
 */
export class LayoutModeChangedEvent extends DomainEvent<typeof DomainEventType.LAYOUT_MODE_CHANGED> {
  constructor(layoutConfig: ILayoutConfig) {
    super(DomainEventType.LAYOUT_MODE_CHANGED, { layoutConfig });
  }
}

/**
 * 레이아웃 카드 너비 변경 이벤트
 */
export class LayoutCardWidthChangedEvent extends DomainEvent<typeof DomainEventType.LAYOUT_CARD_WIDTH_CHANGED> {
  constructor(layoutConfig: ILayoutConfig) {
    super(DomainEventType.LAYOUT_CARD_WIDTH_CHANGED, { layoutConfig });
  }
}

/**
 * 레이아웃 카드 높이 변경 이벤트
 */
export class LayoutCardHeightChangedEvent extends DomainEvent<typeof DomainEventType.LAYOUT_CARD_HEIGHT_CHANGED> {
  constructor(layoutConfig: ILayoutConfig) {
    super(DomainEventType.LAYOUT_CARD_HEIGHT_CHANGED, { layoutConfig });
  }
}

/**
 * 레이아웃 변경 이벤트
 */
export class LayoutChangedEvent extends DomainEvent<typeof DomainEventType.LAYOUT_CHANGED> {
  constructor(layoutConfig: ILayoutConfig) {
    super(DomainEventType.LAYOUT_CHANGED, { layoutConfig });
  }
}

/**
 * 레이아웃 크기 변경 이벤트
 */
export class LayoutResizedEvent extends DomainEvent<typeof DomainEventType.LAYOUT_RESIZED> {
  constructor(layoutConfig: ILayoutConfig) {
    super(DomainEventType.LAYOUT_RESIZED, { layoutConfig });
  }
}

/**
 * 레이아웃 카드 위치 업데이트 이벤트
 */
export class LayoutCardPositionUpdatedEvent extends DomainEvent<typeof DomainEventType.LAYOUT_CARD_POSITION_UPDATED> {
  constructor(cardId: string, x: number, y: number, layoutConfig: ILayoutConfig) {
    super(DomainEventType.LAYOUT_CARD_POSITION_UPDATED, { cardId, x, y, layoutConfig });
  }
}

/**
 * 뷰포트 크기 업데이트 이벤트
 */
export class ViewportDimensionsUpdatedEvent extends DomainEvent<typeof DomainEventType.VIEWPORT_DIMENSIONS_UPDATED> {
  constructor(width: number, height: number, layoutConfig: ILayoutConfig) {
    super(DomainEventType.VIEWPORT_DIMENSIONS_UPDATED, { width, height, layoutConfig });
  }
} 