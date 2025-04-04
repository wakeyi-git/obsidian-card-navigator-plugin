/**
 * 도메인 이벤트 타입
 */
export enum DomainEventType {
  // 카드셋 이벤트
  CARDSET_CREATED = 'cardset:created',
  CARDSET_UPDATED = 'cardset:updated',
  CARDSET_DELETED = 'cardset:deleted',

  // 카드 이벤트
  CARD_CREATED = 'card:created',
  CARD_UPDATED = 'card:updated',
  CARD_DELETED = 'card:deleted',
  CARD_SELECTED = 'card:selected',
  CARD_DESELECTED = 'card:deselected',
  CARD_FOCUSED = 'card:focused',
  CARD_DRAGGED = 'card:dragged',
  CARD_DROPPED = 'card:dropped',
  CARD_ACTIVATED = 'card:activated',
  CARD_DEACTIVATED = 'card:deactivated',

  // 프리셋 이벤트
  PRESET_CREATED = 'preset:created',
  PRESET_UPDATED = 'preset:updated',
  PRESET_DELETED = 'preset:deleted',
  PRESET_APPLIED = 'preset:applied',

  // 레이아웃 이벤트
  LAYOUT_CONFIG_UPDATED = 'layout:config:updated',
  LAYOUT_MODE_CHANGED = 'layout:mode:changed',
  LAYOUT_CARD_WIDTH_CHANGED = 'layout:card:width:changed',
  LAYOUT_CARD_HEIGHT_CHANGED = 'layout:card:height:changed',
  LAYOUT_CARD_POSITION_UPDATED = 'layout:card:position:updated',
  LAYOUT_CHANGED = 'layout:changed',
  LAYOUT_RESIZED = 'layout:resized',

  // 카드셋 필터 이벤트
  CARDSET_FILTERED = 'cardset:filtered',
  CARDSET_SORTED = 'cardset:sorted',

  // 검색 이벤트
  SEARCH_STARTED = 'search:started',
  SEARCH_COMPLETED = 'search:completed',
  SEARCH_FAILED = 'search:failed',
  SEARCH_CLEARED = 'search:cleared',

  // 정렬 이벤트
  SORT_STARTED = 'sort:started',
  SORT_COMPLETED = 'sort:completed',
  SORT_CLEARED = 'sort:cleared',

  // 툴바 이벤트
  TOOLBAR_ACTION = 'toolbar:action',

  // 뷰 이벤트
  VIEW_CHANGED = 'view:changed',
  VIEW_ACTIVATED = 'view:activated',
  VIEW_DEACTIVATED = 'view:deactivated',

  // 카드셋 이벤트
  CARD_SET_CREATED = 'cardSet:created',
  CARD_SET_UPDATED = 'cardSet:updated',
  CARD_SET_DELETED = 'cardSet:deleted',
  CARD_SET_FILTERED = 'cardSet:filtered',
  CARD_SET_SORTED = 'cardSet:sorted',
  CARD_SET_LAYOUT_CHANGED = 'cardSet:layoutChanged',
  CARD_SET_RESIZED = 'cardSet:resized'
} 