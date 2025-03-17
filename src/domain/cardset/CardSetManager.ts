import { ICardSet } from './CardSet';
import { ICard } from '../card/Card';

/**
 * 카드셋 관리자 인터페이스
 */
export interface ICardSetManager {
  /**
   * 카드셋 생성
   */
  createCardSet(name: string, description?: string): ICardSet;

  /**
   * 카드셋 수정
   */
  updateCardSet(cardSet: ICardSet): void;

  /**
   * 카드셋 삭제
   */
  deleteCardSet(cardSet: ICardSet): void;

  /**
   * 카드셋에 카드 추가
   */
  addCardToSet(cardSet: ICardSet, card: ICard): void;

  /**
   * 카드셋에서 카드 제거
   */
  removeCardFromSet(cardSet: ICardSet, card: ICard): void;

  /**
   * 카드셋의 모든 카드 제거
   */
  clearCardsFromSet(cardSet: ICardSet): void;

  /**
   * 카드셋 정렬
   */
  sortCardSet(cardSet: ICardSet, sortBy: string, order: 'asc' | 'desc'): void;

  /**
   * 카드셋 필터링
   */
  filterCardSet(cardSet: ICardSet, filter: (card: ICard) => boolean): void;
} 