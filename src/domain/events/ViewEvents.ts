import { DomainEvent, DomainEventType } from './DomainEvent';

/**
 * 뷰 변경 이벤트
 */
export class ViewChangedEvent extends DomainEvent {
  constructor(public readonly viewType: string) {
    super('view.changed' as DomainEventType);
  }
}

/**
 * 뷰 활성화 이벤트
 */
export class ViewActivatedEvent extends DomainEvent {
  constructor() {
    super('view.activated' as DomainEventType);
  }
}

/**
 * 뷰 비활성화 이벤트
 */
export class ViewDeactivatedEvent extends DomainEvent {
  constructor() {
    super('view.deactivated' as DomainEventType);
  }
} 