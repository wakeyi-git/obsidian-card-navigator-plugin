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

/**
 * 포커스 블러 이벤트
 */
export class FocusBlurredEvent extends DomainEvent<typeof DomainEventType.FOCUS_BLURRED> {
  constructor(card: ICard) {
    super(DomainEventType.FOCUS_BLURRED, { card });
  }
}

/**
 * 포커스 상태 업데이트 이벤트
 */
export class FocusStateUpdatedEvent extends DomainEvent<typeof DomainEventType.FOCUS_STATE_UPDATED> {
  constructor(card: ICard, previousCard?: ICard) {
    super(DomainEventType.FOCUS_STATE_UPDATED, { card, previousCard });
  }
} 