import { ILayoutConfig } from '@/domain/models/LayoutConfig';
import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';

/**
 * 레이아웃 설정 업데이트 이벤트
 */
export class LayoutConfigUpdatedEvent extends DomainEvent<ILayoutConfig> {
  constructor(data: ILayoutConfig) {
    super(DomainEventType.LAYOUT_CONFIG_UPDATED, data);
  }
}

/**
 * 레이아웃 모드 변경 이벤트
 */
export class LayoutModeChangedEvent extends DomainEvent<ILayoutConfig> {
  constructor(data: ILayoutConfig) {
    super(DomainEventType.LAYOUT_MODE_CHANGED, data);
  }
}

/**
 * 레이아웃 카드 너비 변경 이벤트
 */
export class LayoutCardWidthChangedEvent extends DomainEvent<ILayoutConfig> {
  constructor(data: ILayoutConfig) {
    super(DomainEventType.LAYOUT_CARD_WIDTH_CHANGED, data);
  }
}

/**
 * 레이아웃 카드 높이 변경 이벤트
 */
export class LayoutCardHeightChangedEvent extends DomainEvent<ILayoutConfig> {
  constructor(data: ILayoutConfig) {
    super(DomainEventType.LAYOUT_CARD_HEIGHT_CHANGED, data);
  }
}

/**
 * 카드 위치 업데이트 이벤트
 */
export class LayoutCardPositionUpdatedEvent extends DomainEvent<ILayoutConfig> {
  constructor(data: ILayoutConfig) {
    super(DomainEventType.LAYOUT_CARD_POSITION_UPDATED, data);
  }
}

/**
 * 레이아웃 변경 이벤트
 */
export class LayoutChangedEvent extends DomainEvent<ILayoutConfig> {
  constructor(data: ILayoutConfig) {
    super(DomainEventType.LAYOUT_CHANGED, data);
  }
}

/**
 * 레이아웃 크기 변경 이벤트
 */
export class LayoutResizedEvent extends DomainEvent<ILayoutConfig> {
  constructor(data: ILayoutConfig) {
    super(DomainEventType.LAYOUT_RESIZED, data);
  }
} 