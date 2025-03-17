import { IEventBus } from '../../core/events/IEventBus';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { 
  CardSet, 
  ICardSet, 
  CardSortCriteria, 
  CardFilterCriteria,
  CardSetSourceMode,
  CardSetType 
} from '../../domain/cardset/CardSet';
import { Card } from '../../domain/card/Card';
import { ILayout } from '../../domain/layout/Layout';
import { EventType } from '../../core/events/EventTypes';
import { ICard } from '../../domain/card/Card';
import { ICardSetManager } from '../../domain/cardset/CardSetManager';

/**
 * 카드셋 서비스 인터페이스
 */
export interface ICardSetService {
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
  deleteCardSet(cardSetId: string): void;

  /**
   * 카드셋에 카드 추가
   */
  addCardToSet(cardSetId: string, card: ICard): void;

  /**
   * 카드셋에서 카드 제거
   */
  removeCardFromSet(cardSetId: string, card: ICard): void;

  /**
   * 카드셋의 모든 카드 제거
   */
  clearCardsFromSet(cardSetId: string): void;

  /**
   * 카드셋 가져오기
   */
  getCardSet(cardSetId: string): ICardSet | null;

  /**
   * 모든 카드셋 가져오기
   */
  getAllCardSets(): ICardSet[];

  /**
   * 카드셋의 카드 가져오기
   */
  getCardsInSet(cardSetId: string): ICard[];

  /**
   * 서비스 정리
   */
  destroy(): void;
}

/**
 * 카드셋 서비스 구현체
 */
export class CardSetService implements ICardSetService {
  private cardSets: Map<string, ICardSet> = new Map();
  private eventBus: DomainEventBus;

  constructor(
    private readonly cardSetManager: ICardSetManager
  ) {
    this.eventBus = DomainEventBus.getInstance();
  }

  /**
   * 카드셋 생성
   */
  createCardSet(name: string, description?: string): ICardSet {
    const cardSet = this.cardSetManager.createCardSet(name, description);
    this.cardSets.set(cardSet.getId(), cardSet);
    this.eventBus.publish(EventType.CARDSET_CREATED, { cardSet: cardSet.getId() });
    return cardSet;
  }

  /**
   * 카드셋 수정
   */
  updateCardSet(cardSet: ICardSet): void {
    if (this.cardSets.has(cardSet.getId())) {
      this.cardSets.set(cardSet.getId(), cardSet);
      this.cardSetManager.updateCardSet(cardSet);
      this.eventBus.publish(EventType.CARDSET_UPDATED, { cardSet: cardSet.getId() });
    }
  }

  /**
   * 카드셋 삭제
   */
  deleteCardSet(cardSetId: string): void {
    const cardSet = this.cardSets.get(cardSetId);
    if (cardSet) {
      this.cardSets.delete(cardSetId);
      this.cardSetManager.deleteCardSet(cardSet);
      this.eventBus.publish(EventType.CARDSET_DESTROYED, { cardSet: cardSetId });
    }
  }

  /**
   * 카드셋에 카드 추가
   */
  addCardToSet(cardSetId: string, card: ICard): void {
    const cardSet = this.cardSets.get(cardSetId);
    if (cardSet) {
      this.cardSetManager.addCardToSet(cardSet, card);
      this.eventBus.publish(EventType.CARD_ADDED_TO_SET, { cardSet: cardSetId, card: card.getId() });
    }
  }

  /**
   * 카드셋에서 카드 제거
   */
  removeCardFromSet(cardSetId: string, card: ICard): void {
    const cardSet = this.cardSets.get(cardSetId);
    if (cardSet) {
      this.cardSetManager.removeCardFromSet(cardSet, card);
      this.eventBus.publish(EventType.CARD_REMOVED_FROM_SET, { cardSet: cardSetId, card: card.getId() });
    }
  }

  /**
   * 카드셋의 모든 카드 제거
   */
  clearCardsFromSet(cardSetId: string): void {
    const cardSet = this.cardSets.get(cardSetId);
    if (cardSet) {
      this.cardSetManager.clearCardsFromSet(cardSet);
      this.eventBus.publish(EventType.CARDS_CLEARED_FROM_SET, { cardSet: cardSetId });
    }
  }

  /**
   * 카드셋 가져오기
   */
  getCardSet(cardSetId: string): ICardSet | null {
    return this.cardSets.get(cardSetId) || null;
  }

  /**
   * 모든 카드셋 가져오기
   */
  getAllCardSets(): ICardSet[] {
    return Array.from(this.cardSets.values());
  }

  /**
   * 카드셋의 카드 가져오기
   */
  getCardsInSet(cardSetId: string): ICard[] {
    const cardSet = this.cardSets.get(cardSetId);
    return cardSet ? cardSet.getCards() : [];
  }

  /**
   * 서비스 정리
   */
  destroy(): void {
    this.cardSets.clear();
    this.eventBus.publish(EventType.CARD_SET_SERVICE_DESTROYED, {});
  }
} 