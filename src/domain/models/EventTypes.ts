/**
 * 카드 이벤트 타입
 */
export enum CardEventType {
  CARD_CREATED = 'card.created',
  CARD_UPDATED = 'card.updated',
  CARD_DELETED = 'card.deleted',
  CARD_STYLE_CHANGED = 'card.styleChanged',
  CARD_POSITION_CHANGED = 'card.positionChanged',
  CARD_RENDERED = 'card.rendered'
}

/**
 * 카드셋 이벤트 타입
 */
export enum CardSetEventType {
  CARD_SET_CREATED = 'cardSet.created',
  CARD_SET_UPDATED = 'cardSet.updated',
  CARD_SET_DELETED = 'cardSet.deleted'
}

/**
 * 레이아웃 이벤트 타입
 */
export enum LayoutEventType {
  LAYOUT_CREATED = 'layout.created',
  LAYOUT_UPDATED = 'layout.updated',
  LAYOUT_DELETED = 'layout.deleted',
  LAYOUT_CARD_POSITION_UPDATED = 'layout.cardPositionUpdated',
  LAYOUT_CARD_POSITION_ADDED = 'layout.cardPositionAdded',
  LAYOUT_CARD_POSITION_REMOVED = 'layout.cardPositionRemoved',
  LAYOUT_CARD_POSITIONS_RESET = 'layout.cardPositionsReset',
  LAYOUT_CONFIG_UPDATED = 'layout.configUpdated',
  LAYOUT_CALCULATED = 'layout.calculated'
} 