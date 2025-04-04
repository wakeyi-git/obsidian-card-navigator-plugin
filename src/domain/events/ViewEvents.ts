import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';

/**
 * 뷰 변경 이벤트
 */
export class ViewChangedEvent extends DomainEvent<{ viewType: string }> {
  constructor(data: { viewType: string }) {
    super(DomainEventType.VIEW_CHANGED, data);
  }
}

/**
 * 뷰 활성화 이벤트
 */
export class ViewActivatedEvent extends DomainEvent<void> {
  constructor() {
    super(DomainEventType.VIEW_ACTIVATED, undefined);
  }
}

/**
 * 뷰 비활성화 이벤트
 */
export class ViewDeactivatedEvent extends DomainEvent<void> {
  constructor() {
    super(DomainEventType.VIEW_DEACTIVATED, undefined);
  }
} 