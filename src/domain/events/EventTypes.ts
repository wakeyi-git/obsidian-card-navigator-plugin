import { ICard } from '../card/Card';
import { CardSetSourceType } from '../cardset/index';
import { LayoutType } from '../layout/Layout';
import { SearchType } from '../search/index';
import { SelectionMode } from '../interaction/SelectionState';
import { SortDirection, SortType } from '../sorting/SortingInterfaces';
import { ToolbarItemType } from '../toolbar/ToolbarInterfaces';
import { TFile, WorkspaceLeaf } from 'obsidian';

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
 * 선택 변경 이벤트 데이터 인터페이스
 */
export interface SelectionChangedEventData {
  /**
   * 선택된 카드 목록
   */
  selectedCards: ICard[];
  
  /**
   * 선택된 카드 수
   */
  count: number;
  
  /**
   * 마지막으로 선택된 카드
   */
  lastSelectedCard: ICard | null;
  
  /**
   * 현재 선택 모드
   */
  selectionMode: SelectionMode;
}

/**
 * 선택 모드 변경 이벤트 데이터 인터페이스
 */
export interface SelectionModeChangedEventData {
  /**
   * 변경된 선택 모드
   */
  mode: SelectionMode;
}

/**
 * 카드셋 소스 타입 변경 이벤트 데이터 인터페이스
 */
export interface CardSetSourceTypeChangedEventData {
  sourceType: CardSetSourceType;
}

/**
 * 카드셋 소스 변경 이벤트 데이터 인터페이스
 */
export interface CardSetSourceChangedEventData {
  source: string;
}

/**
 * 레이아웃 타입 변경 이벤트 데이터 인터페이스
 */
export interface LayoutTypeChangedEventData {
  layoutType: LayoutType;
}

/**
 * 레이아웃 설정 변경 이벤트 데이터 인터페이스
 */
export interface LayoutSettingsChangedEventData {
  settings: any;
}

/**
 * 카드 표시 설정 변경 이벤트 데이터 인터페이스
 */
export interface CardDisplaySettingsChangedEventData {
  settings: any;
}

/**
 * 정렬 타입 변경 이벤트 데이터 인터페이스
 */
export interface SortTypeChangedEventData {
  sortType: SortType;
}

/**
 * 정렬 방향 변경 이벤트 데이터 인터페이스
 */
export interface SortDirectionChangedEventData {
  sortDirection: SortDirection;
}

/**
 * 포커스 변경 이벤트 데이터 인터페이스
 */
export interface FocusChangedEventData {
  /**
   * 포커스된 카드 인덱스
   */
  focusedIndex: number;
  
  /**
   * 스크롤 동작
   */
  scrollBehavior?: 'smooth' | 'instant';
}

/**
 * 활성 카드 변경 이벤트 데이터 인터페이스
 */
export interface ActiveCardChangedEventData {
  /**
   * 활성 카드
   */
  card: ICard;
}

/**
 * 카드 열림 이벤트 데이터 인터페이스
 */
export interface CardOpenedEventData {
  /**
   * 열린 카드
   */
  card: ICard;
  
  /**
   * 편집 모드 여부
   */
  editMode?: boolean;
}

/**
 * 네비게이션 오류 이벤트 데이터 인터페이스
 */
export interface NavigationErrorEventData {
  /**
   * 오류 메시지
   */
  message: string;
  
  /**
   * 오류 객체
   */
  error?: Error;
}

/**
 * 툴바 아이템 클릭 이벤트 데이터 인터페이스
 */
export interface ToolbarItemClickedEventData {
  /**
   * 클릭된 아이템 타입
   */
  itemType: ToolbarItemType;
}

/**
 * 검색어 변경 이벤트 데이터 인터페이스
 */
export interface SearchQueryChangedEventData {
  /**
   * 변경된 검색어
   */
  query: string;
}

/**
 * 팝업 표시 이벤트 데이터 인터페이스
 */
export interface PopupShownEventData {
  /**
   * 팝업 타입
   */
  popupType: ToolbarItemType;
  
  /**
   * 팝업 위치
   */
  position: {
    x: number;
    y: number;
  };
}

/**
 * 팝업 숨김 이벤트 데이터 인터페이스
 */
export interface PopupHiddenEventData {
  /**
   * 팝업 타입
   */
  popupType: ToolbarItemType;
}

/**
 * Obsidian 파일 열기 이벤트 데이터 인터페이스
 */
export interface FileOpenedEventData {
  file: TFile;
}

/**
 * Obsidian 파일 생성 이벤트 데이터 인터페이스
 */
export interface FileCreatedEventData {
  file: TFile;
}

/**
 * Obsidian 파일 수정 이벤트 데이터 인터페이스
 */
export interface FileModifiedEventData {
  file: TFile;
}

/**
 * Obsidian 파일 삭제 이벤트 데이터 인터페이스
 */
export interface FileDeletedEventData {
  file: TFile;
}

/**
 * Obsidian 파일 이름 변경 이벤트 데이터 인터페이스
 */
export interface FileRenamedEventData {
  file: TFile;
  oldPath: string;
}

/**
 * Obsidian 레이아웃 변경 이벤트 데이터 인터페이스
 */
export interface ObsidianLayoutChangedEventData {
  // 추가 데이터가 필요한 경우 여기에 정의
}

/**
 * Obsidian 활성 리프 변경 이벤트 데이터 인터페이스
 */
export interface ActiveLeafChangedEventData {
  leaf: WorkspaceLeaf;
}

/**
 * 카드 리스트 업데이트 이벤트 데이터 인터페이스
 */
export interface CardListUpdatedEventData {
  /**
   * 리스트 ID
   */
  listId: string;
  
  /**
   * 카드 리스트
   */
  cardList: any;
}

/**
 * 카드 추가 이벤트 데이터 인터페이스
 */
export interface CardAddedEventData {
  /**
   * 리스트 ID
   */
  listId: string;
  
  /**
   * 카드 ID
   */
  cardId: string;
  
  /**
   * 카드 데이터
   */
  card: ICard;
}

/**
 * 카드 제거 이벤트 데이터 인터페이스
 */
export interface CardRemovedEventData {
  /**
   * 리스트 ID
   */
  listId: string;
  
  /**
   * 카드 ID
   */
  cardId: string;
}

/**
 * 카드 업데이트 이벤트 데이터 인터페이스
 */
export interface CardUpdatedEventData {
  /**
   * 카드 ID
   */
  cardId: string;
  
  /**
   * 카드 데이터
   */
  card: ICard;
}

/**
 * 카드 선택 이벤트 데이터 인터페이스
 */
export interface CardSelectedEventData {
  /**
   * 카드 ID
   */
  cardId: string;
  
  /**
   * 카드 데이터
   */
  card: ICard;
}

/**
 * 카드 정렬 이벤트 데이터 인터페이스
 */
export interface CardsSortedEventData {
  /**
   * 리스트 ID
   */
  listId: string;
  
  /**
   * 정렬 타입
   */
  sortType: string;
  
  /**
   * 정렬 방향
   */
  sortDirection: 'asc' | 'desc';
  
  /**
   * 카드 리스트
   */
  cardList: any;
}

/**
 * 정렬 요청 이벤트 데이터 인터페이스
 */
export interface SortRequestedEventData {
  /**
   * 리스트 ID
   */
  listId: string;
  
  /**
   * 정렬 타입
   */
  sortType: string;
  
  /**
   * 정렬 방향
   */
  sortDirection: 'asc' | 'desc';
}

/**
 * 페이지 변경 이벤트 데이터 인터페이스
 */
export interface PageChangedEventData {
  /**
   * 리스트 ID
   */
  listId: string;
  
  /**
   * 페이지 번호
   */
  page: number;
}

/**
 * 새 카드 요청 이벤트 데이터 인터페이스
 */
export interface NewCardRequestedEventData {
  /**
   * 리스트 ID
   */
  listId: string;
}

/**
 * 카드 선택 요청 이벤트 데이터 인터페이스
 */
export interface CardSelectRequestedEventData {
  /**
   * 카드 ID
   */
  cardId: string;
}

/**
 * 카드 열기 요청 이벤트 데이터 인터페이스
 */
export interface CardOpenRequestedEventData {
  /**
   * 카드 ID
   */
  cardId: string;
}

/**
 * 카드 편집 요청 이벤트 데이터 인터페이스
 */
export interface CardEditRequestedEventData {
  /**
   * 카드 ID
   */
  cardId: string;
}

/**
 * 검색 결과 이벤트 데이터 인터페이스
 */
export interface SearchResultsEventData {
  /**
   * 검색 결과
   */
  results: any[];
  
  /**
   * 검색어
   */
  query: string;
  
  /**
   * 검색 타입
   */
  searchType: string;
}

/**
 * 알림 이벤트 데이터 인터페이스
 */
export interface NotificationEventData {
  /**
   * 알림 메시지
   */
  message: string;
  
  /**
   * 알림 타입
   */
  type: 'info' | 'warning' | 'error' | 'success';
}

/**
 * 컨텍스트 메뉴 요청 이벤트 데이터 인터페이스
 */
export interface ContextMenuRequestedEventData {
  /**
   * 카드 ID
   */
  cardId: string;
  
  /**
   * 카드 데이터
   */
  card: ICard;
  
  /**
   * X 좌표
   */
  x: number;
  
  /**
   * Y 좌표
   */
  y: number;
  
  /**
   * 메뉴 항목
   */
  items: {
    id: string;
    label: string;
    icon: string;
    action: () => void;
  }[];
}

/**
 * 태그 클릭 이벤트 데이터 인터페이스
 */
export interface TagClickedEventData {
  /**
   * 태그
   */
  tag: string;
  
  /**
   * 카드 ID
   */
  cardId: string;
  
  /**
   * 카드 데이터
   */
  card: ICard;
}

/**
 * 카드 드래그 시작 이벤트 데이터 인터페이스
 */
export interface CardDragStartedEventData {
  /**
   * 카드 ID
   */
  cardId: string;
  
  /**
   * 드래그 모드
   */
  dragMode: string;
}

/**
 * 카드 드래그 종료 이벤트 데이터 인터페이스
 */
export interface CardDragEndedEventData {
  /**
   * 소스 카드 ID
   */
  sourceCardId: string;
  
  /**
   * 타겟 카드 ID
   */
  targetCardId: string;
  
  /**
   * 드래그 모드
   */
  dragMode: string;
}

/**
 * 카드 드래그 취소 이벤트 데이터 인터페이스
 */
export interface CardDragCancelledEventData {
  /**
   * 소스 카드 ID
   */
  sourceCardId: string;
  
  /**
   * 드래그 모드
   */
  dragMode: string;
}

/**
 * 스크롤 이벤트 데이터 인터페이스
 */
export interface ScrollToCardEventData {
  /**
   * 스크롤할 카드 인덱스
   */
  index: number;
  
  /**
   * 스크롤 동작
   */
  behavior: 'smooth' | 'instant';
}

/**
 * 내비게이션 모드 변경 이벤트 데이터 인터페이스
 */
export interface NavigationModeChangedEventData {
  /**
   * 내비게이션 모드
   */
  navigationMode: string;
}

/**
 * 카드 선택 변경 이벤트 데이터 인터페이스
 */
export interface CardSelectionChangedEventData {
  /**
   * 선택된 카드 ID 목록
   */
  selectedCardIds: string[];
  
  /**
   * 선택 모드
   */
  selectionMode: SelectionMode;
}

/**
 * 카드 클릭 이벤트 데이터 인터페이스
 */
export interface CardClickedEventData {
  /**
   * 클릭된 카드 ID
   */
  cardId: string;
}

/**
 * 카드 더블 클릭 이벤트 데이터 인터페이스
 */
export interface CardDoubleClickedEventData {
  /**
   * 더블 클릭된 카드 ID
   */
  cardId: string;
}

/**
 * 카드 컨텍스트 메뉴 이벤트 데이터 인터페이스
 */
export interface CardContextMenuEventData {
  /**
   * 카드 ID
   */
  cardId: string;
  
  /**
   * 이벤트 객체
   */
  event: any;
}

/**
 * 레이아웃 적용 이벤트 데이터 인터페이스
 */
export interface LayoutAppliedEventData {
  /**
   * 레이아웃 정보
   */
  layoutInfo: any;
}

/**
 * 설정 UI 변경 이벤트 데이터
 */
export interface SettingsUIChangedEventData {
  /**
   * 변경된 설정 키
   */
  key: string;
  
  /**
   * 변경된 설정 값
   */
  value: any;
  
  /**
   * 설정 섹션
   */
  section: string;
}

/**
 * 설정 미리보기 업데이트 이벤트 데이터
 */
export interface SettingsPreviewUpdateEventData {
  /**
   * 업데이트 요청 소스
   */
  source: string;
}

/**
 * 설정 탭 변경 이벤트 데이터 인터페이스
 */
export interface SettingsTabChangedEventData {
  /**
   * 변경된 탭 ID
   */
  tabId: string;
}

/**
 * 이벤트 타입 열거형
 */
export enum EventType {
  // 카드셋 관련 이벤트
  CARD_SET_CHANGED = 'card-set-changed',
  SOURCE_CHANGED = 'source-changed',
  INCLUDE_SUBFOLDERS_CHANGED = 'includeSubfoldersChanged',
  TAG_CASE_SENSITIVE_CHANGED = 'tagCaseSensitiveChanged',
  CARD_SET_SOURCE_TYPE_CHANGED = 'card-set-source-type-changed',
  CARD_SET_SOURCE_CHANGED = 'card-set-source-changed',
  
  // 카드 관련 이벤트
  CARDS_CHANGED = 'cards-changed',
  CARD_SELECTION = 'card-selection',
  CARD_DESELECTED = 'card-deselected',
  CARD_DISPLAY_SETTINGS_CHANGED = 'card-display-settings-changed',
  
  // 레이아웃 관련 이벤트
  LAYOUT_CHANGED = 'layout-changed',
  LAYOUT_TYPE_CHANGED = 'layout-type-changed',
  LAYOUT_SETTINGS_CHANGED = 'layout-settings-changed',
  LAYOUT_APPLIED = 'layout-applied',
  
  // 정렬 관련 이벤트
  SORT_TYPE_CHANGED = 'sort-type-changed',
  SORT_DIRECTION_CHANGED = 'sort-direction-changed',
  
  // 검색 관련 이벤트
  SEARCH_CHANGED = 'search-changed',
  SEARCH_TYPE_CHANGED = 'search-type-changed',
  SEARCH_CASE_SENSITIVE_CHANGED = 'search-case-sensitive-changed',
  SEARCH_QUERY_CHANGED = 'search-query-changed',
  SEARCH_RESULTS_CHANGED = 'search:results-changed',
  SEARCH_HISTORY_CHANGED = 'search:history-changed',
  
  // 설정 관련 이벤트
  SETTINGS_CHANGED = 'settings-changed',
  SETTINGS_LOADED = 'settings-loaded',
  SETTINGS_SAVED = 'settings-saved',
  SETTINGS_RESET = 'settings-reset',
  SETTINGS_UI_CHANGED = 'settings-ui-changed',
  SETTINGS_PREVIEW_UPDATE = 'settings-preview-update',
  SETTINGS_TAB_CHANGED = 'settings-tab-changed',
  
  // 플러그인 관련 이벤트
  PLUGIN_LOADED = 'pluginLoaded',
  PLUGIN_UNLOADED = 'pluginUnloaded',
  
  // 선택 관련 이벤트
  SELECTION_CHANGED = 'selection-changed',
  SELECTION_MODE_CHANGED = 'selection-mode-changed',
  
  // 네비게이션 관련 이벤트
  FOCUS_CHANGED = 'focus-changed',
  ACTIVE_CARD_CHANGED = 'active-card-changed',
  CARD_OPENED = 'card-opened',
  NAVIGATION_ERROR = 'navigation-error',
  
  // 툴바 관련 이벤트
  TOOLBAR_ITEM_CLICKED = 'toolbar-item-clicked',
  POPUP_SHOWN = 'popup-shown',
  POPUP_HIDDEN = 'popup-hidden',
  
  // 카드셋 이벤트 (CardSetEventType에서 통합)
  SOURCE_TYPE_CHANGED = 'source-changed',
  CARDSET_CHANGED = 'cardset-changed',
  CARDS_UPDATED = 'cards-updated',
  FILTER_CHANGED = 'filter-changed',
  
  // Obsidian 관련 이벤트 타입
  FILE_OPENED = 'obsidian-file-opened',
  FILE_CREATED = 'file-created',
  FILE_MODIFIED = 'file-modified',
  FILE_DELETED = 'file-deleted',
  FILE_RENAMED = 'file-renamed',
  ACTIVE_LEAF_CHANGED = 'active-leaf-changed',
  
  // 새로운 이벤트 타입
  CARD_LIST_UPDATED = 'card-list-updated',
  CARD_ADDED = 'card-added',
  CARD_REMOVED = 'card-removed',
  CARD_UPDATED = 'card-updated',
  CARD_SELECTED = 'card-selected',
  CARDS_SORTED = 'cards-sorted',
  SORT_REQUESTED = 'sort-requested',
  PAGE_CHANGED = 'page-changed',
  NEW_CARD_REQUESTED = 'new-card-requested',
  CARD_SELECT_REQUESTED = 'card-select-requested',
  CARD_OPEN_REQUESTED = 'card-open-requested',
  CARD_EDIT_REQUESTED = 'card-edit-requested',
  SEARCH_RESULTS = 'search-results',
  NOTIFICATION = 'notification',
  CONTEXT_MENU_REQUESTED = 'context-menu-requested',
  TAG_CLICKED = 'tag-clicked',
  CARD_DRAG_STARTED = 'card-drag-started',
  CARD_DRAG_ENDED = 'card-drag-ended',
  CARD_EDITED = 'card-edited',
  
  // 카드 상호작용 관련 이벤트
  CARD_SELECTION_CHANGED = 'card-selection-changed',
  CARD_CLICKED = 'card-clicked',
  CARD_DOUBLE_CLICKED = 'card-double-clicked',
  CARD_CONTEXT_MENU = 'card-context-menu',
  CARD_DRAG_CANCELLED = 'card-drag-cancelled',
  
  // 내비게이션 관련 이벤트
  SCROLL_TO_CARD = 'scroll-to-card',
  NAVIGATION_MODE_CHANGED = 'navigation-mode-changed'
}

/**
 * 이벤트 데이터 맵 타입
 * 이벤트 타입에 따른 이벤트 데이터 타입을 매핑합니다.
 */
export interface EventDataMap {
  [EventType.CARD_SET_CHANGED]: CardSetChangedEventData;
  [EventType.SOURCE_CHANGED]: SourceChangedEventData;
  [EventType.CARDS_CHANGED]: CardsChangedEventData;
  [EventType.LAYOUT_CHANGED]: LayoutChangedEventData;
  [EventType.LAYOUT_APPLIED]: LayoutAppliedEventData;
  [EventType.SEARCH_CHANGED]: SearchChangedEventData;
  [EventType.SETTINGS_CHANGED]: SettingsChangedEventData;
  [EventType.SETTINGS_UI_CHANGED]: SettingsUIChangedEventData;
  [EventType.SETTINGS_PREVIEW_UPDATE]: SettingsPreviewUpdateEventData;
  [EventType.SELECTION_CHANGED]: SelectionChangedEventData;
  [EventType.SELECTION_MODE_CHANGED]: SelectionModeChangedEventData;
  [EventType.CARD_SET_SOURCE_TYPE_CHANGED]: CardSetSourceTypeChangedEventData;
  [EventType.CARD_SET_SOURCE_CHANGED]: CardSetSourceChangedEventData;
  [EventType.LAYOUT_TYPE_CHANGED]: LayoutTypeChangedEventData;
  [EventType.LAYOUT_SETTINGS_CHANGED]: LayoutSettingsChangedEventData;
  [EventType.CARD_DISPLAY_SETTINGS_CHANGED]: CardDisplaySettingsChangedEventData;
  [EventType.SORT_TYPE_CHANGED]: SortTypeChangedEventData;
  [EventType.SORT_DIRECTION_CHANGED]: SortDirectionChangedEventData;
  [EventType.FOCUS_CHANGED]: FocusChangedEventData;
  [EventType.ACTIVE_CARD_CHANGED]: ActiveCardChangedEventData;
  [EventType.CARD_OPENED]: CardOpenedEventData;
  [EventType.NAVIGATION_ERROR]: NavigationErrorEventData;
  [EventType.TOOLBAR_ITEM_CLICKED]: ToolbarItemClickedEventData;
  [EventType.SEARCH_QUERY_CHANGED]: SearchQueryChangedEventData;
  [EventType.POPUP_SHOWN]: PopupShownEventData;
  [EventType.POPUP_HIDDEN]: PopupHiddenEventData;
  [EventType.SEARCH_RESULTS_CHANGED]: any;
  [EventType.SEARCH_HISTORY_CHANGED]: any;
  [EventType.SETTINGS_TAB_CHANGED]: SettingsTabChangedEventData;
  
  // 인덱스 시그니처 추가
  [key: string]: any;
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
  
  /**
   * 상태 가져오기
   * @param key 상태 키
   * @returns 상태 값
   */
  getState(key: string): any;
  
  /**
   * 상태 설정하기
   * @param key 상태 키
   * @param value 상태 값
   */
  setState(key: string, value: any): void;
} 