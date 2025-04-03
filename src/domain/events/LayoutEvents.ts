import { ILayoutConfig } from '@/domain/models/LayoutConfig';
import { DomainEvent } from './DomainEvent';

/**
 * 레이아웃 설정 업데이트 이벤트
 */
export class LayoutConfigUpdatedEvent extends DomainEvent {
  constructor(public readonly config: ILayoutConfig) {
    super('layout:configUpdated');
  }
}

/**
 * 레이아웃 모드 변경 이벤트
 */
export class LayoutModeChangedEvent extends DomainEvent {
  constructor(public readonly mode: 'grid' | 'masonry') {
    super('layout:modeChanged');
  }
}

/**
 * 레이아웃 카드 너비 변경 이벤트
 */
export class LayoutCardWidthChangedEvent extends DomainEvent {
  constructor(public readonly width: number) {
    super('layout:cardWidthChanged');
  }
}

/**
 * 레이아웃 카드 높이 변경 이벤트
 */
export class LayoutCardHeightChangedEvent extends DomainEvent {
  constructor(public readonly height: number) {
    super('layout:cardHeightChanged');
  }
}

/**
 * 카드 위치 업데이트 이벤트
 */
export class CardPositionUpdatedEvent extends DomainEvent {
  constructor(
    public readonly cardId: string,
    public readonly x: number,
    public readonly y: number
  ) {
    super('layout:cardPositionUpdated');
  }
}

/**
 * 레이아웃 변경 이벤트
 */
export class LayoutChangedEvent extends DomainEvent {
  constructor(public readonly layoutType: string) {
    super('layout:changed');
  }
}

/**
 * 레이아웃 크기 변경 이벤트
 */
export class LayoutResizedEvent extends DomainEvent {
  constructor(public readonly width: number, public readonly height: number) {
    super('layout:resized');
  }
} 