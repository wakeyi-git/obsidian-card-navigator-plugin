import { ICardSet } from './CardSet';
import { ICardRenderConfig } from './CardRenderConfig';
import { ICardStyle } from './CardStyle';

/**
 * 카드 내비게이터 상태 인터페이스
 */
export interface ICardNavigatorState {
  /** 현재 카드셋 */
  currentCardSet: ICardSet | null;
  /** 포커스된 카드 ID */
  focusedCardId: string | null;
  /** 선택된 카드 ID 목록 */
  selectedCardIds: Set<string>;
  /** 활성화된 카드 ID */
  activeCardId: string | null;
  /** 검색 모드 여부 */
  isSearchMode: boolean;
  /** 검색어 */
  searchQuery: string;
  /** 현재 정렬 설정 */
  currentSortConfig: any | null;
  /** 현재 필터 설정 */
  currentFilterConfig: any | null;
  /** 현재 레이아웃 설정 */
  currentLayoutConfig: any | null;
  /** 현재 렌더링 설정 */
  currentRenderConfig: ICardRenderConfig | null;
  /** 현재 스타일 설정 */
  currentStyle: ICardStyle | null;
}

/**
 * 기본 카드 내비게이터 상태
 */
export const DEFAULT_CARD_NAVIGATOR_STATE: ICardNavigatorState = {
  currentCardSet: null,
  focusedCardId: null,
  selectedCardIds: new Set(),
  activeCardId: null,
  isSearchMode: false,
  searchQuery: '',
  currentSortConfig: null,
  currentFilterConfig: null,
  currentLayoutConfig: null,
  currentRenderConfig: null,
  currentStyle: null
}; 