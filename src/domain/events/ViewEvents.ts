import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';

/**
 * 뷰 변경 이벤트
 */
export class ViewChangedEvent extends DomainEvent<typeof DomainEventType.VIEW_CHANGED> {
  constructor(view: string) {
    super(DomainEventType.VIEW_CHANGED, { view });
  }
}

/**
 * 뷰 활성화 이벤트
 */
export class ViewActivatedEvent extends DomainEvent<typeof DomainEventType.VIEW_ACTIVATED> {
  constructor(view: string) {
    super(DomainEventType.VIEW_ACTIVATED, { view });
  }
}

/**
 * 뷰 비활성화 이벤트
 */
export class ViewDeactivatedEvent extends DomainEvent<typeof DomainEventType.VIEW_DEACTIVATED> {
  constructor(view: string) {
    super(DomainEventType.VIEW_DEACTIVATED, { view });
  }
} 