import { DomainEvent } from '@/domain/events/DomainEvent';
import { ICard } from '@/domain/models/Card';
import { DomainEventType } from '@/domain/events/DomainEventType';

/**
 * 포커스 변경 이벤트
 */
export class FocusChangedEvent extends DomainEvent<typeof DomainEventType.FOCUS_CHANGED> {
  constructor(card: ICard) {
    super(DomainEventType.FOCUS_CHANGED, { card });
  }
} 