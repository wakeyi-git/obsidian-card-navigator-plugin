import { IPreset } from '../../domain/settings/Settings';
import { ICard } from '../../domain/card/Card';
import { CardState } from '../../domain/card/CardState';
import { CardSetSourceMode } from '../../domain/cardset/CardSet';
import { ISearchResult } from '../../domain/search/Search';
import { LayoutType, LayoutOptions } from '../../domain/layout/Layout';

/**
 * 도메인 이벤트 기본 페이로드 인터페이스
 */
export interface BaseEventPayload {
  /**
   * 이벤트 발생 시간
   */
  timestamp: number;

  /**
   * 이벤트 소스
   */
  source: string;
}

/**
 * 네비게이션 카드 상태 인터페이스
 */
export interface NavigationCardState {
  /**
   * 활성 카드 ID
   */
  activeCardId: string | null;

  /**
   * 포커스된 카드 ID
   */
  focusedCardId: string | null;

  /**
   * 선택된 카드 ID 목록
   */
  selectedCardIds: Set<string>;

  /**
   * 현재 인덱스
   */
  index: number;
}

/**
 * 이벤트 타입 열거형
 * 카드 네비게이터 플러그인의 이벤트 타입을 정의합니다.
 */
export enum EventType {
  // View Events
  VIEW_OPENED = 'VIEW_OPENED',
  VIEW_CLOSED = 'VIEW_CLOSED',
  CARDS_LOADED = 'CARDS_LOADED',

  // Card Events
  CARD_CLICKED = 'CARD_CLICKED',
  CARD_DOUBLE_CLICKED = 'CARD_DOUBLE_CLICKED',
  CARD_CONTEXT_MENU = 'CARD_CONTEXT_MENU',
  CARD_FOCUSED = 'CARD_FOCUSED',
  CARD_UNFOCUSED = 'CARD_UNFOCUSED',
  CARD_SELECTED = 'CARD_SELECTED',
  CARD_DESELECTED = 'CARD_DESELECTED',
  CARD_OPENED = 'CARD_OPENED',
  CARD_CLOSED = 'CARD_CLOSED',
  CARD_SCROLLED = 'CARD_SCROLLED',
  CARD_CREATED = 'CARD_CREATED',
  CARD_UPDATED = 'CARD_UPDATED',
  CARD_DELETED = 'CARD_DELETED',
  CARD_STATE_CHANGED = 'CARD_STATE_CHANGED',
  CARDS_DESELECTED = 'CARDS_DESELECTED',
  CARD_SERVICE_DESTROYED = 'CARD_SERVICE_DESTROYED',
  CARD_DESTROYED = 'CARD_DESTROYED',

  // CardSet Events
  CARDSET_CLICKED = 'CARDSET_CLICKED',
  CARDSET_DOUBLE_CLICKED = 'CARDSET_DOUBLE_CLICKED',
  CARDSET_CONTEXT_MENU = 'CARDSET_CONTEXT_MENU',
  CARDSET_CREATED = 'CARDSET_CREATED',
  CARDSET_UPDATED = 'CARDSET_UPDATED',
  CARDSET_DESTROYED = 'CARDSET_DESTROYED',
  CARD_ADDED_TO_SET = 'CARD_ADDED_TO_SET',
  CARD_REMOVED_FROM_SET = 'CARD_REMOVED_FROM_SET',
  CARDS_CLEARED_FROM_SET = 'CARDS_CLEARED_FROM_SET',
  CARD_SET_SERVICE_DESTROYED = 'CARD_SET_SERVICE_DESTROYED',

  // Layout Events
  LAYOUT_CLICKED = 'LAYOUT_CLICKED',
  LAYOUT_DOUBLE_CLICKED = 'LAYOUT_DOUBLE_CLICKED',
  LAYOUT_CONTEXT_MENU = 'LAYOUT_CONTEXT_MENU',
  LAYOUT_CREATED = 'LAYOUT_CREATED',
  LAYOUT_DESTROYED = 'LAYOUT_DESTROYED',
  LAYOUT_RESIZED = 'LAYOUT_RESIZED',
  LAYOUT_INITIALIZED = 'LAYOUT_INITIALIZED',
  LAYOUT_TYPE_CHANGED = 'LAYOUT_TYPE_CHANGED',
  LAYOUT_OPTIONS_CHANGED = 'LAYOUT_OPTIONS_CHANGED',
  CARD_ADDED = 'CARD_ADDED',
  CARD_REMOVED = 'CARD_REMOVED',
  CARDS_CLEARED = 'CARDS_CLEARED',
  LAYOUT_UPDATED = 'LAYOUT_UPDATED',

  // Navigation Events
  NAVIGATION_MODE_CHANGED = 'NAVIGATION_MODE_CHANGED',
  SCROLL_BEHAVIOR_CHANGED = 'SCROLL_BEHAVIOR_CHANGED',
  GRID_INFO_CHANGED = 'GRID_INFO_CHANGED',

  // Search Events
  SEARCH_STARTED = 'SEARCH_STARTED',
  SEARCH_COMPLETED = 'SEARCH_COMPLETED',
  SEARCH_PERFORMED = 'SEARCH_PERFORMED',
  INDEX_UPDATED = 'INDEX_UPDATED',

  // Card Lifecycle Events
  CARD_LIFECYCLE_CREATED = 'CARD_LIFECYCLE_CREATED',
  CARD_LIFECYCLE_UPDATED = 'CARD_LIFECYCLE_UPDATED',
  CARD_LIFECYCLE_DELETED = 'CARD_LIFECYCLE_DELETED',

  // 컨테이너 이벤트
  CONTAINER_CLEARED = 'CONTAINER_CLEARED',

  // 설정 관련 이벤트
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  PRESET_SAVED = 'PRESET_SAVED',
  PRESET_APPLIED = 'PRESET_APPLIED',
  PRESET_DELETED = 'PRESET_DELETED',
}

/**
 * 이벤트 페이로드 타입 정의
 */
export interface IEventPayloads {
  // View Events
  [EventType.VIEW_OPENED]: BaseEventPayload & {
    viewId: string;
  };
  [EventType.VIEW_CLOSED]: BaseEventPayload & {
    viewId: string;
  };
  [EventType.CARDS_LOADED]: BaseEventPayload & {
    viewId: string;
    cardCount: number;
  };

  // Card Events
  [EventType.CARD_CLICKED]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_DOUBLE_CLICKED]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_CONTEXT_MENU]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_FOCUSED]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_UNFOCUSED]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_SELECTED]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_DESELECTED]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_OPENED]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_CLOSED]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_SCROLLED]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_CREATED]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_UPDATED]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_DELETED]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_STATE_CHANGED]: BaseEventPayload & {
    card: string;
    state: Partial<CardState>;
  };
  [EventType.CARDS_DESELECTED]: BaseEventPayload;
  [EventType.CARD_SERVICE_DESTROYED]: BaseEventPayload;
  [EventType.CARD_DESTROYED]: { cardId: string };

  // CardSet Events
  [EventType.CARDSET_CLICKED]: BaseEventPayload & {
    cardSet: string;
  };
  [EventType.CARDSET_DOUBLE_CLICKED]: BaseEventPayload & {
    cardSet: string;
  };
  [EventType.CARDSET_CONTEXT_MENU]: BaseEventPayload & {
    cardSet: string;
  };
  [EventType.CARDSET_CREATED]: BaseEventPayload & {
    cardSet: string;
  };
  [EventType.CARDSET_UPDATED]: BaseEventPayload & {
    cardSet: string;
  };
  [EventType.CARDSET_DESTROYED]: BaseEventPayload & {
    cardSet: string;
  };
  [EventType.CARD_ADDED_TO_SET]: BaseEventPayload & {
    cardSet: string;
    card: string;
  };
  [EventType.CARD_REMOVED_FROM_SET]: BaseEventPayload & {
    cardSet: string;
    card: string;
  };
  [EventType.CARDS_CLEARED_FROM_SET]: BaseEventPayload & {
    cardSet: string;
  };
  [EventType.CARD_SET_SERVICE_DESTROYED]: BaseEventPayload;

  // Layout Events
  [EventType.LAYOUT_CLICKED]: BaseEventPayload & {
    layout: string;
  };
  [EventType.LAYOUT_DOUBLE_CLICKED]: BaseEventPayload & {
    layout: string;
  };
  [EventType.LAYOUT_CONTEXT_MENU]: BaseEventPayload & {
    layout: string;
  };
  [EventType.LAYOUT_CREATED]: BaseEventPayload & {
    layout: string;
  };
  [EventType.LAYOUT_DESTROYED]: BaseEventPayload & {
    layout: string;
  };
  [EventType.LAYOUT_RESIZED]: BaseEventPayload & {
    layout: string;
  };
  [EventType.LAYOUT_INITIALIZED]: BaseEventPayload & {
    layout: string;
  };
  [EventType.LAYOUT_TYPE_CHANGED]: BaseEventPayload & {
    layout: string;
    type: LayoutType;
  };
  [EventType.LAYOUT_OPTIONS_CHANGED]: BaseEventPayload & {
    layout: string;
    options: Partial<LayoutOptions>;
  };
  [EventType.CARD_ADDED]: BaseEventPayload & {
    layout: string;
    card: string;
  };
  [EventType.CARD_REMOVED]: BaseEventPayload & {
    layout: string;
    card: string;
  };
  [EventType.CARDS_CLEARED]: BaseEventPayload & {
    layout: string;
  };
  [EventType.LAYOUT_UPDATED]: BaseEventPayload & {
    layout: string;
  };

  // Navigation Events
  [EventType.NAVIGATION_MODE_CHANGED]: BaseEventPayload & {
    mode: 'normal' | 'vim';
    previousMode: 'normal' | 'vim';
  };
  [EventType.SCROLL_BEHAVIOR_CHANGED]: BaseEventPayload & {
    behavior: 'smooth' | 'instant';
  };
  [EventType.GRID_INFO_CHANGED]: BaseEventPayload & {
    columns: number;
    spacing: number;
  };

  // Search Events
  [EventType.SEARCH_STARTED]: BaseEventPayload & {
    query: string;
  };
  [EventType.SEARCH_COMPLETED]: BaseEventPayload & {
    results: string[];
  };
  [EventType.SEARCH_PERFORMED]: BaseEventPayload & {
    query: string;
  };
  [EventType.INDEX_UPDATED]: BaseEventPayload;

  // Card Lifecycle Events
  [EventType.CARD_LIFECYCLE_CREATED]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_LIFECYCLE_UPDATED]: BaseEventPayload & {
    card: string;
  };
  [EventType.CARD_LIFECYCLE_DELETED]: BaseEventPayload & {
    card: string;
  };

  // 컨테이너 이벤트
  [EventType.CONTAINER_CLEARED]: BaseEventPayload & {
    containerId: string;
  };

  // 설정 관련 이벤트
  [EventType.SETTINGS_UPDATED]: BaseEventPayload & {
    settings: Record<string, any>;
  };
  [EventType.PRESET_SAVED]: BaseEventPayload & {
    preset: string;
    settings: Record<string, any>;
  };
  [EventType.PRESET_APPLIED]: BaseEventPayload & {
    preset: string;
    settings: Record<string, any>;
  };
  [EventType.PRESET_DELETED]: BaseEventPayload & {
    preset: string;
  };
}

/**
 * 도메인 이벤트 인터페이스
 */
export interface IDomainEvent<T extends keyof IEventPayloads> {
  /**
   * 이벤트 타입
   */
  type: T;

  /**
   * 이벤트 페이로드
   */
  payload: IEventPayloads[T];
} 