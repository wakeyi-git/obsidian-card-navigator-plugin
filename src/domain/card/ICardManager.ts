import { ICard } from './Card';
import { CardState } from './CardState';

/**
 * 카드 관리자 인터페이스
 */
export interface ICardManager {
  /**
   * 카드 생성
   */
  createCard(content: string): ICard;

  /**
   * 카드 수정
   */
  updateCard(card: ICard): void;

  /**
   * 카드 삭제
   */
  deleteCard(card: ICard): void;

  /**
   * 카드 상태 변경
   */
  updateCardState(card: ICard, state: Partial<CardState>): void;

  /**
   * 카드 선택
   */
  selectCard(card: ICard): void;

  /**
   * 카드 선택 해제
   */
  deselectCard(card: ICard): void;

  /**
   * 모든 카드 선택 해제
   */
  deselectAllCards(): void;

  /**
   * 카드 포커스
   */
  focusCard(card: ICard): void;

  /**
   * 카드 포커스 해제
   */
  unfocusCard(card: ICard): void;

  /**
   * 카드 열기
   */
  openCard(card: ICard): void;

  /**
   * 카드 닫기
   */
  closeCard(card: ICard): void;
} 