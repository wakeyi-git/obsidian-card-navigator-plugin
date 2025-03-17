/**
 * 카드 상태 인터페이스
 */
export interface CardState {
  /**
   * 선택 여부
   */
  isSelected: boolean;

  /**
   * 포커스 여부
   */
  isFocused: boolean;

  /**
   * 열림 여부
   */
  isOpen: boolean;

  /**
   * 수정 여부
   */
  isModified: boolean;

  /**
   * 삭제 여부
   */
  isDeleted: boolean;

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