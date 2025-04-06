import { ICard } from '../models/Card';
import { IPreset } from '../models/Preset';
import { TFile } from 'obsidian';
import { ILayoutConfig } from '../models/LayoutConfig';
import { ICardSet } from '../models/CardSet';
import { ISearchConfig } from '../models/SearchConfig';
import { IPluginSettings } from '../models/PluginSettings';
import { ICardConfig, ICardSectionConfig } from '../models/CardConfig';
import { ICardSetConfig } from '../models/CardSetConfig';
import { IFilterConfig } from '../models/FilterConfig';
import { ISortConfig } from '../models/SortConfig';
import { ICardStyle } from '../models/CardStyle';
import { CardSetType } from '../../domain/models/CardSetConfig';
import { ISearchCriteria } from '../models/SearchResult';

/**
 * 도메인 이벤트 타입
 */
export const DomainEventType = {
  // 카드셋 이벤트
  CARDSET_CREATED: 'cardset:created',
  CARDSET_UPDATED: 'cardset:updated',
  CARDSET_DELETED: 'cardset:deleted',
  CARDSET_FILTERED: 'cardset:filtered',
  CARDSET_SORTED: 'cardset:sorted',

  // 카드 이벤트
  CARD_CREATED: 'card:created',
  CARD_UPDATED: 'card:updated',
  CARD_DELETED: 'card:deleted',
  CARD_SELECTED: 'card:selected',
  CARD_DESELECTED: 'card:deselected',
  SELECTION_CLEARED: 'selection:cleared',
  CARD_FOCUSED: 'card:focused',
  FOCUS_CHANGED: 'focus:changed',
  CARD_DRAGGED: 'card:dragged',
  CARD_DROPPED: 'card:dropped',
  CARD_ACTIVATED: 'card:activated',
  CARD_DEACTIVATED: 'card:deactivated',
  CARD_CLICKED: 'card:clicked',
  CARD_DOUBLE_CLICKED: 'card:doubleClicked',
  CARD_CONTEXT_MENU: 'card:contextMenu',
  CARD_DRAG_START: 'card:dragStart',
  CARD_DROP: 'card:drop',
  CARD_RENDERING: 'card:rendering',
  LAYOUT_CARD_POSITION_UPDATED: 'layout:card:position:updated',
  CARD_INLINE_EDIT_STARTED: 'card:inline:edit:started',
  CARD_INLINE_EDIT_ENDED: 'card:inline:edit:ended',
  CARD_LINK_CREATED: 'card:link:created',

  // 프리셋 이벤트
  PRESET_CREATED: 'preset:created',
  PRESET_UPDATED: 'preset:updated',
  PRESET_DELETED: 'preset:deleted',
  PRESET_APPLIED: 'preset:applied',

  // 레이아웃 이벤트
  LAYOUT_CONFIG_UPDATED: 'layout:config:updated',
  LAYOUT_MODE_CHANGED: 'layout:mode:changed',
  LAYOUT_CARD_WIDTH_CHANGED: 'layout:card:width:changed',
  LAYOUT_CARD_HEIGHT_CHANGED: 'layout:card:height:changed',
  LAYOUT_CHANGED: 'layout:changed',
  LAYOUT_RESIZED: 'layout:resized',
  VIEWPORT_DIMENSIONS_UPDATED: 'viewport:dimensions:updated',

  // 렌더링 이벤트
  RENDER_CONFIG_UPDATED: 'render:config:updated',
  RENDER_STYLE_UPDATED: 'render:style:updated',
  RENDER_CACHE_CLEARED: 'render:cache:cleared',

  // 검색 이벤트
  SEARCH_STARTED: 'search:started',
  SEARCH_COMPLETED: 'search:completed',
  SEARCH_FAILED: 'search:failed',
  SEARCH_RESULTS_FILTERED: 'search:results:filtered',
  SEARCH_RESULTS_SORTED: 'search:results:sorted',
  SEARCH_INDEX_UPDATED: 'search:index:updated',
  SEARCH_INDEX_REMOVED: 'search:index:removed',

  // 정렬 이벤트
  SORT_STARTED: 'sort:started',
  SORT_COMPLETED: 'sort:completed',
  SORT_CLEARED: 'sort:cleared',
  CARD_SET_SORT_STARTED: 'card:set:sort:started',
  CARD_SET_SORT_COMPLETED: 'card:set:sort:completed',
  CARD_SET_SORT_FAILED: 'card:set:sort:failed',
  SEARCH_RESULT_SORT_STARTED: 'search:result:sort:started',
  SEARCH_RESULT_SORT_COMPLETED: 'search:result:sort:completed',
  SEARCH_RESULT_SORT_FAILED: 'search:result:sort:failed',
  PRIORITY_TAGS_SORT_STARTED: 'priority:tags:sort:started',
  PRIORITY_TAGS_SORT_COMPLETED: 'priority:tags:sort:completed',
  PRIORITY_TAGS_SORT_FAILED: 'priority:tags:sort:failed',
  PRIORITY_FOLDERS_SORT_STARTED: 'priority:folders:sort:started',
  PRIORITY_FOLDERS_SORT_COMPLETED: 'priority:folders:sort:completed',
  PRIORITY_FOLDERS_SORT_FAILED: 'priority:folders:sort:failed',

  // 툴바 이벤트
  TOOLBAR_ACTION: 'toolbar:action',
  TOOLBAR_CARD_SET_TYPE_CHANGED: 'toolbar:cardSetType:changed',
  TOOLBAR_SEARCH_CONFIG_CHANGED: 'toolbar:searchConfig:changed',
  TOOLBAR_SORT_CONFIG_CHANGED: 'toolbar:sortConfig:changed',
  TOOLBAR_CARD_CONFIG_CHANGED: 'toolbar:cardConfig:changed',
  TOOLBAR_CARD_STYLE_CHANGED: 'toolbar:cardStyle:changed',
  TOOLBAR_LAYOUT_CONFIG_CHANGED: 'toolbar:layoutConfig:changed',

  // 뷰 이벤트
  VIEW_CHANGED: 'view:changed',
  VIEW_ACTIVATED: 'view:activated',
  VIEW_DEACTIVATED: 'view:deactivated',

  // 활성 파일 이벤트
  ACTIVE_FILE_CHANGED: 'active:file:changed',
  ACTIVE_FILE_WATCH_STARTED: 'active:file:watch:started',
  ACTIVE_FILE_WATCH_STOPPED: 'active:file:watch:stopped',

  // 캐시 이벤트
  CACHE_INITIALIZED: 'cache:initialized',
  CACHE_CLEANED: 'cache:cleaned',
  CACHE_DATA_STORED: 'cache:data:stored',
  CACHE_DATA_DELETED: 'cache:data:deleted',
  CACHE_DATA_CLEARED: 'cache:data:cleared',

  // 클립보드 이벤트
  FILE_LINK_COPIED: 'file:link:copied',
  FILE_CONTENT_COPIED: 'file:content:copied',
  FILE_LINKS_COPIED: 'file:links:copied',
  FILE_CONTENTS_COPIED: 'file:contents:copied',

  // 파일 이벤트
  FILE_OPENED: 'file:opened',
  FILES_OPENED: 'files:opened',
  FILE_OPENED_FOR_EDITING: 'file:opened:for:editing',
  LINK_INSERTED_TO_EDITOR: 'link:inserted:to:editor',
  LINK_INSERTED_TO_FILE: 'link:inserted:to:file',

  // 스크롤 이벤트
  CARD_CENTERED: 'card:centered',
  SCROLL_POSITION_UPDATED: 'scroll:position:updated',
  SCROLL_BEHAVIOR_CHANGED: 'scroll:behavior:changed',
  SMOOTH_SCROLL_CHANGED: 'scroll:smooth:changed',

  // 설정 이벤트
  SETTINGS_CHANGED: 'settings:changed',
  CARD_CONFIG_CHANGED: 'card:config:changed',
  CARD_SET_CONFIG_CHANGED: 'card:set:config:changed',
  LAYOUT_CONFIG_CHANGED: 'layout:config:changed',
  SORT_CONFIG_CHANGED: 'sort:config:changed',
  FILTER_CONFIG_CHANGED: 'filter:config:changed',
  SEARCH_CONFIG_CHANGED: 'search:config:changed',
  CARD_STYLE_CHANGED: 'card:style:changed',
  CARD_SECTION_DISPLAY_CHANGED: 'card:section:display:changed',

  // 카드 프리뷰 이벤트
  CARD_PREVIEW_CREATED: 'card:preview:created',
  CARD_SECTION_SELECTED: 'card:section:selected',
  CARD_RENDER_CONFIG_UPDATED: 'card:render:config:updated',
  CARD_STYLE_UPDATED: 'card:style:updated',
  CARD_PREVIEW_CLEANED: 'card:preview:cleaned',

  // 설정 섹션 이벤트
  CARD_SETTINGS_SECTION_CHANGED: 'card:settings:section:changed',
  LAYOUT_SETTINGS_SECTION_CHANGED: 'layout:settings:section:changed',
  PRESET_SETTINGS_SECTION_CHANGED: 'preset:settings:section:changed',
  SEARCH_SETTINGS_SECTION_CHANGED: 'search:settings:section:changed',
  SORT_SETTINGS_SECTION_CHANGED: 'sort:settings:section:changed',
  CARD_SET_SETTINGS_SECTION_CHANGED: 'card:set:settings:section:changed',
} as const;

/**
 * 도메인 이벤트 타입의 유니온 타입
 */
export type DomainEventType = typeof DomainEventType[keyof typeof DomainEventType];

/**
 * 이벤트 데이터 타입
 */
export type EventDataType = {
  'cardset:created': { cardSet: ICardSet };
  'cardset:updated': { cardSet: ICardSet };
  'cardset:deleted': { cardSet: ICardSet };
  'cardset:filtered': { cardSet: ICardSet };
  'cardset:sorted': { cardSet: ICardSet };
  'card:created': { card: ICard };
  'card:updated': { card: ICard };
  'card:deleted': { card: ICard };
  'card:selected': { card: ICard };
  'card:deselected': { card: ICard };
  'selection:cleared': { cards: ICard[] };
  'card:focused': { card: ICard };
  'focus:changed': { card: ICard };
  'card:dragged': { card: ICard };
  'card:dropped': { card: ICard };
  'card:activated': { card: ICard };
  'card:deactivated': { card: ICard };
  'card:clicked': { card: ICard };
  'card:doubleClicked': { card: ICard };
  'card:contextMenu': { card: ICard };
  'card:dragStart': { card: ICard };
  'card:drop': { card: ICard };
  'card:rendering': { card: ICard };
  'layout:card:position:updated': { 
    cardId: string; 
    x: number; 
    y: number; 
    layoutConfig: ILayoutConfig 
  };
  'card:inline:edit:started': { card: ICard };
  'card:inline:edit:ended': { card: ICard };
  'card:link:created': { card: ICard };
  'preset:created': { preset: IPreset };
  'preset:updated': { preset: IPreset };
  'preset:deleted': { preset: IPreset };
  'preset:applied': { preset: IPreset };
  'layout:config:updated': { layoutConfig: ILayoutConfig };
  'layout:mode:changed': { layoutConfig: ILayoutConfig };
  'layout:card:width:changed': { layoutConfig: ILayoutConfig };
  'layout:card:height:changed': { layoutConfig: ILayoutConfig };
  'layout:changed': { layoutConfig: ILayoutConfig };
  'layout:resized': { layoutConfig: ILayoutConfig };
  'viewport:dimensions:updated': { 
    width: number; 
    height: number; 
    layoutConfig: ILayoutConfig 
  };
  'render:config:updated': { renderConfig: Record<string, unknown> };
  'render:style:updated': { renderStyle: Record<string, unknown> };
  'render:cache:cleared': { cacheKey: string };
  'search:started': { query: string; config: ISearchConfig };
  'search:completed': { result: { criteria: ISearchCriteria; cardIds: string[]; searchTime: number; totalCount: number; filteredCount: number } };
  'search:failed': { error: Error; query: string; config: ISearchConfig };
  'search:results:filtered': { result: { criteria: ISearchCriteria; cardIds: string[]; searchTime: number; totalCount: number; filteredCount: number }; config: ISearchConfig };
  'search:results:sorted': { result: { criteria: ISearchCriteria; cardIds: string[]; searchTime: number; totalCount: number; filteredCount: number }; config: ISearchConfig };
  'search:index:updated': { card: ICard };
  'search:index:removed': { cardId: string };
  'sort:started': { sortBy: string };
  'sort:completed': { sortedCards: ICard[] };
  'sort:cleared': { };
  'toolbar:action': {
    cardSetType: CardSetType;
    searchConfig: ISearchConfig;
    sortConfig: ISortConfig;
    cardConfig: ICardConfig;
    cardStyle: ICardStyle;
    layoutConfig: ILayoutConfig;
  };
  'view:changed': { view: string };
  'view:activated': { view: string };
  'view:deactivated': { view: string };
  'active:file:changed': { file: TFile | null };
  'active:file:watch:started': { file: TFile | null };
  'active:file:watch:stopped': { file: TFile | null };
  'cache:initialized': { };
  'cache:cleaned': { };
  'cache:data:stored': { key: string; data: unknown };
  'cache:data:deleted': { key: string };
  'cache:data:cleared': { };
  'file:link:copied': { file: TFile; link: string };
  'file:content:copied': { file: TFile; content: string };
  'file:links:copied': { files: TFile[]; links: string };
  'file:contents:copied': { files: TFile[]; contents: string };
  'file:opened': { file: TFile };
  'files:opened': { files: TFile[] };
  'file:opened:for:editing': { file: TFile };
  'link:inserted:to:editor': { file: TFile };
  'link:inserted:to:file': { sourceFile: TFile; targetFile: TFile };
  'card:centered': { card: ICard };
  'scroll:position:updated': { position: number };
  'scroll:behavior:changed': { behavior: string };
  'scroll:smooth:changed': { smooth: boolean };
  'settings:changed': { oldSettings: IPluginSettings; newSettings: IPluginSettings };
  'card:section:display:changed': { section: 'header' | 'body' | 'footer'; property: keyof ICardSectionConfig; oldValue: boolean; newValue: boolean };
  'toolbar:cardSetType:changed': {
    oldType: CardSetType;
    newType: CardSetType;
  };
  'toolbar:searchConfig:changed': {
    oldConfig: ISearchConfig;
    newConfig: ISearchConfig;
  };
  'toolbar:sortConfig:changed': {
    oldConfig: ISortConfig;
    newConfig: ISortConfig;
  };
  'toolbar:cardConfig:changed': {
    oldConfig: ICardConfig;
    newConfig: ICardConfig;
  };
  'toolbar:cardStyle:changed': {
    oldStyle: ICardStyle;
    newStyle: ICardStyle;
  };
  'toolbar:layoutConfig:changed': {
    oldConfig: ILayoutConfig;
    newConfig: ILayoutConfig;
  };
  'card:config:changed': { oldConfig: ICardConfig; newConfig: ICardConfig };
  'card:set:config:changed': { type: string; oldConfig: ICardSetConfig; newConfig: ICardSetConfig };
  'layout:config:changed': { oldConfig: ILayoutConfig; newConfig: ILayoutConfig };
  'sort:config:changed': { oldConfig: ISortConfig; newConfig: ISortConfig };
  'filter:config:changed': { oldConfig: IFilterConfig; newConfig: IFilterConfig };
  'search:config:changed': { oldConfig: ISearchConfig; newConfig: ISearchConfig };
  'card:style:changed': { oldStyle: ICardStyle; newStyle: ICardStyle };
  'card:set:sort:started': { cardSet: ICardSet; config: ISortConfig };
  'card:set:sort:completed': { cardSet: ICardSet; config: ISortConfig };
  'card:set:sort:failed': { cardSet: ICardSet; config: ISortConfig; error: Error };
  'search:result:sort:started': { result: { criteria: ISearchCriteria; cardIds: string[]; searchTime: number; totalCount: number; filteredCount: number }; config: ISortConfig };
  'search:result:sort:completed': { result: { criteria: ISearchCriteria; cardIds: string[]; searchTime: number; totalCount: number; filteredCount: number }; config: ISortConfig };
  'search:result:sort:failed': { result: { criteria: ISearchCriteria; cardIds: string[]; searchTime: number; totalCount: number; filteredCount: number }; config: ISortConfig; error: Error };
  'priority:tags:sort:started': { cardSet: ICardSet; priorityTags: string[] };
  'priority:tags:sort:completed': { cardSet: ICardSet; priorityTags: string[] };
  'priority:tags:sort:failed': { cardSet: ICardSet; priorityTags: string[]; error: Error };
  'priority:folders:sort:started': { cardSet: ICardSet; priorityFolders: string[] };
  'priority:folders:sort:completed': { cardSet: ICardSet; priorityFolders: string[] };
  'priority:folders:sort:failed': { cardSet: ICardSet; priorityFolders: string[]; error: Error };
  'card:preview:created': { 
    cardConfig: ICardConfig;
    cardStyle: ICardStyle;
  };
  'card:section:selected': { section: string };
  'card:render:config:updated': { config: ICardConfig };
  'card:style:updated': { style: ICardStyle };
  'card:preview:cleaned': { };
  'card:settings:section:changed': { 
    oldConfig: ICardConfig;
    newConfig: ICardConfig;
    oldStyle: ICardStyle;
    newStyle: ICardStyle;
  };
  'layout:settings:section:changed': { 
    oldConfig: ILayoutConfig;
    newConfig: ILayoutConfig;
  };
  'preset:settings:section:changed': { 
    oldPreset: IPreset | null;
    newPreset: IPreset | null;
  };
  'search:settings:section:changed': { 
    oldConfig: ISearchConfig;
    newConfig: ISearchConfig;
  };
  'sort:settings:section:changed': { 
    oldConfig: ISortConfig;
    newConfig: ISortConfig;
  };
  'card:set:settings:section:changed': { 
    oldConfig: ICardSetConfig;
    newConfig: ICardSetConfig;
  };
};

export enum CardNavigatorEventType {
  CARD_SET_CREATED = 'CARD_SET_CREATED',
  CARD_SET_SORTED = 'CARD_SET_SORTED',
  CARDS_SELECTED = 'CARDS_SELECTED',
  CARD_NAVIGATOR_OPENED = 'CARD_NAVIGATOR_OPENED',
  CARD_NAVIGATED = 'CARD_NAVIGATED',
  PRESET_MAPPED = 'PRESET_MAPPED',
  CARD_INTERACTED = 'CARD_INTERACTED',
  PRESET_MANAGED = 'PRESET_MANAGED',
  CARD_CUSTOMIZED = 'CARD_CUSTOMIZED',
  TOOLBAR_HANDLED = 'TOOLBAR_HANDLED',
  LAYOUT_APPLIED = 'LAYOUT_APPLIED'
} 