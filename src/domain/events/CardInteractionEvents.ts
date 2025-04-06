import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { ICard } from '../models/Card';
import { TFile } from 'obsidian';

/**
 * 카드 선택 이벤트
 */
export class CardSelectedEvent extends DomainEvent<typeof DomainEventType.CARD_SELECTED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_SELECTED, { card });
  }
}

/**
 * 카드 포커스 이벤트
 */
export class CardFocusedEvent extends DomainEvent<typeof DomainEventType.CARD_FOCUSED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_FOCUSED, { card });
  }
}

/**
 * 카드 드래그 시작 이벤트
 */
export class CardDragStartEvent extends DomainEvent<typeof DomainEventType.CARD_DRAG_START> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_DRAG_START, { card });
  }
}

/**
 * 카드 드롭 이벤트
 */
export class CardDropEvent extends DomainEvent<typeof DomainEventType.CARD_DROP> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_DROP, { card });
  }
}

/**
 * 카드 컨텍스트 메뉴 열림 이벤트
 */
export class CardContextMenuOpenedEvent extends DomainEvent<typeof DomainEventType.CARD_CONTEXT_MENU> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_CONTEXT_MENU, { card });
  }
}

/**
 * 카드 인라인 편집 시작 이벤트
 */
export class CardInlineEditStartedEvent extends DomainEvent<typeof DomainEventType.CARD_INLINE_EDIT_STARTED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_INLINE_EDIT_STARTED, { card });
  }
}

/**
 * 카드 인라인 편집 종료 이벤트
 */
export class CardInlineEditEndedEvent extends DomainEvent<typeof DomainEventType.CARD_INLINE_EDIT_ENDED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_INLINE_EDIT_ENDED, { card });
  }
}

/**
 * 카드 링크 생성 이벤트
 */
export class CardLinkCreatedEvent extends DomainEvent<typeof DomainEventType.CARD_LINK_CREATED> {
  constructor(card: ICard) {
    super(DomainEventType.CARD_LINK_CREATED, { card });
  }
} 