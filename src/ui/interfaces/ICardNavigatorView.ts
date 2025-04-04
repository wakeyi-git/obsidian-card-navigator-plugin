import { ICardNavigatorState } from '../../domain/models/CardNavigatorState';
import { ICardSet } from '../../domain/models/CardSet';

/**
 * 카드 내비게이터 뷰 인터페이스
 */
export interface ICardNavigatorView {
  /**
   * 상태 업데이트
   * @param state 새로운 상태
   */
  updateState(state: ICardNavigatorState): void;

  /**
   * 카드셋 업데이트
   * @param cardSet 새로운 카드셋
   */
  updateCardSet(cardSet: ICardSet): void;

  /**
   * 포커스된 카드 업데이트
   * @param cardId 포커스된 카드 ID
   */
  updateFocusedCard(cardId: string | null): void;

  /**
   * 선택된 카드 업데이트
   * @param cardIds 선택된 카드 ID 목록
   */
  updateSelectedCards(cardIds: Set<string>): void;

  /**
   * 활성화된 카드 업데이트
   * @param cardId 활성화된 카드 ID
   */
  updateActiveCard(cardId: string | null): void;

  /**
   * 검색 모드 업데이트
   * @param isSearchMode 검색 모드 여부
   * @param query 검색어
   */
  updateSearchMode(isSearchMode: boolean, query: string): void;

  /**
   * 로딩 상태 표시
   * @param isLoading 로딩 중 여부
   */
  showLoading(isLoading: boolean): void;

  /**
   * 에러 메시지 표시
   * @param message 에러 메시지
   */
  showError(message: string): void;

  /**
   * 뷰 정리
   */
  cleanup(): void;
} 