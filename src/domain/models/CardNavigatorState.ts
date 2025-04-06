import { ICardConfig, DEFAULT_CARD_CONFIG } from './CardConfig';
import { ICardStyle, DEFAULT_CARD_STYLE } from './CardStyle';
import { ILayoutConfig, DEFAULT_LAYOUT_CONFIG } from './LayoutConfig';
import { ISortConfig, DEFAULT_SORT_CONFIG } from './SortConfig';
import { IFilterConfig } from './FilterConfig';
import { ICardSet } from './CardSet';
import { DEFAULT_FOLDER_CARD_SET_CONFIG } from './CardSetConfig';

/**
 * 카드 내비게이터 상태 인터페이스
 */
export interface ICardNavigatorState {
  /** 현재 정렬 설정 */
  readonly currentSortConfig: ISortConfig;
  /** 현재 필터 설정 */
  readonly currentFilterConfig: IFilterConfig;
  /** 현재 레이아웃 설정 */
  readonly currentLayoutConfig: ILayoutConfig;
  /** 현재 카드 설정 */
  readonly currentCardConfig: ICardConfig;
  /** 현재 카드 스타일 */
  readonly currentCardStyle: ICardStyle;
  /** 카드셋 목록 */
  readonly cardSets: ICardSet[];
  /** 활성 파일 */
  readonly activeFile: string | null;
  /** 선택된 카드 ID 목록 */
  readonly selectedCardIds: Set<string>;
  /** 포커스된 카드 ID */
  readonly focusedCardId: string | null;
  /** 활성 카드 ID */
  readonly activeCardId: string | null;
  /** 검색 모드 여부 */
  readonly isSearchMode: boolean;
  /** 검색 쿼리 */
  readonly searchQuery: string;
}

/**
 * 카드 내비게이터 상태 기본값
 */
export const DEFAULT_CARD_NAVIGATOR_STATE: ICardNavigatorState = {
  currentSortConfig: DEFAULT_SORT_CONFIG,
  currentFilterConfig: DEFAULT_FOLDER_CARD_SET_CONFIG.filterConfig,
  currentLayoutConfig: DEFAULT_LAYOUT_CONFIG,
  currentCardConfig: DEFAULT_CARD_CONFIG,
  currentCardStyle: DEFAULT_CARD_STYLE,
  cardSets: [],
  activeFile: null,
  selectedCardIds: new Set(),
  focusedCardId: null,
  activeCardId: null,
  isSearchMode: false,
  searchQuery: ''
}; 