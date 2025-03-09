import { ICard } from '../card/Card';
import { CardSetSourceType } from '../cardset/index';
import { LayoutType } from '../layout/Layout';
import { SearchType } from '../search/index';

/**
 * 카드셋 변경 이벤트 데이터 인터페이스
 */
export interface CardSetChangedEventData {
  cardSet: string | null;
  sourceType: CardSetSourceType;
  isFixed: boolean;
}

/**
 * 소스 변경 이벤트 데이터 인터페이스
 */
export interface SourceChangedEventData {
  previousSourceType: CardSetSourceType;
  newSourceType: CardSetSourceType;
}

/**
 * 카드 목록 변경 이벤트 데이터 인터페이스
 */
export interface CardsChangedEventData {
  cards: ICard[];
  totalCount: number;
  filteredCount: number;
}

/**
 * 레이아웃 변경 이벤트 데이터 인터페이스
 */
export interface LayoutChangedEventData {
  previousLayout: LayoutType;
  newLayout: LayoutType;
}

/**
 * 검색 변경 이벤트 데이터 인터페이스
 */
export interface SearchChangedEventData {
  query: string;
  searchType: SearchType;
  caseSensitive: boolean;
  frontmatterKey?: string;
}

/**
 * 설정 변경 이벤트 데이터 인터페이스
 */
export interface SettingsChangedEventData {
  settings: any;
  changedKeys: string[];
}

/**
 * 이벤트 타입 열거형
 */
export enum EventType {
  // 카드셋 관련 이벤트
  CARD_SET_CHANGED = 'cardSetChanged',
  SOURCE_CHANGED = 'sourceChanged',
  INCLUDE_SUBFOLDERS_CHANGED = 'includeSubfoldersChanged',
  TAG_CASE_SENSITIVE_CHANGED = 'tagCaseSensitiveChanged',
  
  // 카드 관련 이벤트
  CARDS_CHANGED = 'cardsChanged',
  CARD_SELECTED = 'cardSelected',
  CARD_DESELECTED = 'cardDeselected',
  
  // 레이아웃 관련 이벤트
  LAYOUT_CHANGED = 'layoutChanged',
  
  // 검색 관련 이벤트
  SEARCH_CHANGED = 'searchChanged',
  SEARCH_TYPE_CHANGED = 'searchTypeChanged',
  SEARCH_CASE_SENSITIVE_CHANGED = 'searchCaseSensitiveChanged',
  
  // 설정 관련 이벤트
  SETTINGS_CHANGED = 'settingsChanged',
  
  // 플러그인 관련 이벤트
  PLUGIN_LOADED = 'pluginLoaded',
  PLUGIN_UNLOADED = 'pluginUnloaded'
}

/**
 * 이벤트 데이터 타입 매핑
 */
export type EventDataMap = {
  [EventType.CARD_SET_CHANGED]: CardSetChangedEventData;
  [EventType.SOURCE_CHANGED]: SourceChangedEventData;
  [EventType.INCLUDE_SUBFOLDERS_CHANGED]: boolean;
  [EventType.TAG_CASE_SENSITIVE_CHANGED]: boolean;
  [EventType.CARDS_CHANGED]: CardsChangedEventData;
  [EventType.CARD_SELECTED]: ICard;
  [EventType.CARD_DESELECTED]: ICard;
  [EventType.LAYOUT_CHANGED]: LayoutChangedEventData;
  [EventType.SEARCH_CHANGED]: SearchChangedEventData;
  [EventType.SEARCH_TYPE_CHANGED]: SearchType;
  [EventType.SEARCH_CASE_SENSITIVE_CHANGED]: boolean;
  [EventType.SETTINGS_CHANGED]: SettingsChangedEventData;
  [EventType.PLUGIN_LOADED]: void;
  [EventType.PLUGIN_UNLOADED]: void;
}

/**
 * 이벤트 리스너 타입
 */
export type EventListener<T extends EventType> = (data: EventDataMap[T]) => void;

/**
 * 이벤트 이미터 인터페이스
 */
export interface IEventEmitter {
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 타입
   * @param listener 리스너 함수
   */
  on<T extends EventType>(event: T, listener: EventListener<T>): void;
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 타입
   * @param listener 리스너 함수
   */
  off<T extends EventType>(event: T, listener: EventListener<T>): void;
  
  /**
   * 이벤트 발생
   * @param event 이벤트 타입
   * @param data 이벤트 데이터
   */
  emit<T extends EventType>(event: T, data: EventDataMap[T]): void;
} 