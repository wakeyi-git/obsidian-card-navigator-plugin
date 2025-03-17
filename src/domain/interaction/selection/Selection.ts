import { ICard } from '../../card/Card';

/**
 * 선택 모드
 */
export type SelectionMode = 'single' | 'multiple';

/**
 * 선택 상태 인터페이스
 */
export interface ISelectionState {
  selectedCards: Set<string>;
  focusedCard: string | null;
  selectionMode: SelectionMode;
}

/**
 * 선택 관리자 인터페이스
 */
export interface ISelectionManager {
  /**
   * 현재 선택 상태 조회
   */
  getState(): ISelectionState;
  
  /**
   * 카드 선택
   */
  selectCard(card: ICard): void;
  
  /**
   * 카드 선택 해제
   */
  deselectCard(card: ICard): void;
  
  /**
   * 모든 선택 해제
   */
  clearSelection(): void;
  
  /**
   * 카드 포커스
   */
  focusCard(card: ICard): void;
  
  /**
   * 선택 모드 설정
   */
  setSelectionMode(mode: SelectionMode): void;
  
  /**
   * 카드가 선택되었는지 확인
   */
  isSelected(cardId: string): boolean;
  
  /**
   * 카드가 포커스되었는지 확인
   */
  isFocused(cardId: string): boolean;
} 