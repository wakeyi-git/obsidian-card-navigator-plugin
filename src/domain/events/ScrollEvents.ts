import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { ICard } from '../models/Card';

/**
 * 카드 중앙 정렬 이벤트
 */
export class CardCenteredEvent extends DomainEvent<typeof DomainEventType.CARD_CENTERED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_CENTERED, { card });
  }
}

/**
 * 스크롤 위치 업데이트 이벤트
 */
export class ScrollPositionUpdatedEvent extends DomainEvent<typeof DomainEventType.SCROLL_POSITION_UPDATED> {
  constructor(position: number) {
    super(DomainEventType.SCROLL_POSITION_UPDATED, { position });
  }
}

/**
 * 스크롤 동작 변경 이벤트
 */
export class ScrollBehaviorChangedEvent extends DomainEvent<typeof DomainEventType.SCROLL_BEHAVIOR_CHANGED> {
  constructor(behavior: string) {
    super(DomainEventType.SCROLL_BEHAVIOR_CHANGED, { behavior });
  }
}

/**
 * 부드러운 스크롤 설정 변경 이벤트
 */
export class SmoothScrollChangedEvent extends DomainEvent<typeof DomainEventType.SMOOTH_SCROLL_CHANGED> {
  constructor(smooth: boolean) {
    super(DomainEventType.SMOOTH_SCROLL_CHANGED, { smooth });
  }
} 