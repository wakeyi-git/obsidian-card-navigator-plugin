import { ICard } from '../../domain/card/Card';
import { CardState } from '../../domain/card/CardState';
import { ICardManager } from '../../domain/card/ICardManager';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType, IEventPayloads } from '../../core/events/EventTypes';
import { DomainErrorBus } from '../../core/errors/DomainErrorBus';
import { ErrorCode } from '../../core/errors/ErrorTypes';
import { DomainError } from '../../core/errors/DomainError';

/**
 * 카드 서비스 인터페이스
 */
export interface ICardService {
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
  deleteCard(cardId: string): void;

  /**
   * 카드 상태 변경
   */
  updateCardState(cardId: string, state: Partial<CardState>): void;

  /**
   * 카드 선택
   */
  selectCard(cardId: string): void;

  /**
   * 카드 선택 해제
   */
  deselectCard(cardId: string): void;

  /**
   * 모든 카드 선택 해제
   */
  deselectAllCards(): void;

  /**
   * 카드 포커스
   */
  focusCard(cardId: string): void;

  /**
   * 카드 포커스 해제
   */
  unfocusCard(cardId: string): void;

  /**
   * 카드 열기
   */
  openCard(cardId: string): void;

  /**
   * 카드 닫기
   */
  closeCard(cardId: string): void;

  /**
   * 카드 ID로 카드 조회
   */
  getCard(cardId: string): ICard | undefined;

  /**
   * 서비스 정리
   */
  destroy(): void;
}

/**
 * 카드 서비스 구현체
 */
export class CardService implements ICardService {
  private cards: Map<string, ICard> = new Map();
  private eventBus: DomainEventBus;
  private errorBus: DomainErrorBus;

  constructor(
    private readonly cardManager: ICardManager
  ) {
    this.eventBus = DomainEventBus.getInstance();
    this.errorBus = DomainErrorBus.getInstance();
  }

  /**
   * 카드 생성
   */
  createCard(content: string): ICard {
    const card = this.cardManager.createCard(content);
    this.cards.set(card.getId(), card);
    this.publishCardCreated(card);
    return card;
  }

  /**
   * 카드 수정
   */
  updateCard(card: ICard): void {
    if (this.cards.has(card.getId())) {
      this.cards.set(card.getId(), card);
      this.cardManager.updateCard(card);
      this.publishCardUpdated(card);
    }
  }

  /**
   * 카드 삭제
   */
  deleteCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (card) {
      this.cards.delete(cardId);
      this.cardManager.deleteCard(card);
      this.publishCardDeleted(card);
    }
  }

  /**
   * 카드 상태 변경 이벤트 발행
   */
  private publishCardStateChanged(cardId: string, state: CardState): void {
    this.eventBus.publish(EventType.CARD_STATE_CHANGED, {
      card: cardId,
      state: {
        ...state,
        activeCardId: state.isOpen ? cardId : null,
        focusedCardId: state.isFocused ? cardId : null,
        selectedCardIds: new Set(state.isSelected ? [cardId] : []),
        index: Array.from(this.cards.keys()).indexOf(cardId)
      }
    }, 'CardService');
  }

  /**
   * ID로 카드 가져오기
   */
  private getCardById(cardId: string): ICard | undefined {
    return this.cards.get(cardId);
  }

  /**
   * 카드 상태 업데이트
   */
  async updateCardState(cardId: string, state: Partial<CardState>): Promise<void> {
    const card = this.getCardById(cardId);
    if (!card) {
      this.errorBus.publish(ErrorCode.CARD_NOT_FOUND, {
        cardId,
        details: { message: '카드를 찾을 수 없습니다.' }
      }, 'CardService');
      return;
    }

    const currentState = card.getState();
    const newState = { ...currentState, ...state };
    card.setState(newState);

    this.publishCardStateChanged(cardId, newState);
  }

  /**
   * 카드 선택
   */
  selectCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (card) {
      this.cardManager.selectCard(card);
      this.eventBus.publish(EventType.CARD_SELECTED, { card: cardId });
    }
  }

  /**
   * 카드 선택 해제
   */
  deselectCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (card) {
      this.cardManager.deselectCard(card);
      this.eventBus.publish(EventType.CARD_DESELECTED, { card: cardId });
    }
  }

  /**
   * 모든 카드 선택 해제
   */
  deselectAllCards(): void {
    this.cardManager.deselectAllCards();
    this.eventBus.publish(EventType.CARDS_DESELECTED, {});
  }

  /**
   * 카드 포커스
   */
  focusCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (card) {
      this.cardManager.focusCard(card);
      this.eventBus.publish(EventType.CARD_FOCUSED, { card: cardId });
    }
  }

  /**
   * 카드 포커스 해제
   */
  unfocusCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (card) {
      this.cardManager.unfocusCard(card);
      this.eventBus.publish(EventType.CARD_UNFOCUSED, { card: cardId });
    }
  }

  /**
   * 카드 열기
   */
  openCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (card) {
      this.cardManager.openCard(card);
      this.eventBus.publish(EventType.CARD_OPENED, { card: cardId });
    }
  }

  /**
   * 카드 닫기
   */
  closeCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (card) {
      this.cardManager.closeCard(card);
      this.eventBus.publish(EventType.CARD_CLOSED, { card: cardId });
    }
  }

  /**
   * 카드 ID로 카드 조회
   */
  getCard(cardId: string): ICard | undefined {
    return this.cards.get(cardId);
  }

  /**
   * 서비스 정리
   */
  destroy(): void {
    this.cards.clear();
    this.eventBus.publish(EventType.CARD_SERVICE_DESTROYED, {});
  }

  /**
   * 카드 생성 이벤트 발행
   */
  private publishCardCreated(card: ICard): void {
    this.eventBus.publish(EventType.CARD_CREATED, {
      card: card.getId()
    }, 'CardService');
  }

  /**
   * 카드 업데이트 이벤트 발행
   */
  private publishCardUpdated(card: ICard): void {
    this.eventBus.publish(EventType.CARD_UPDATED, {
      card: card.getId()
    });
  }

  /**
   * 카드 삭제 이벤트 발행
   */
  private publishCardDeleted(card: ICard): void {
    this.eventBus.publish(EventType.CARD_DELETED, {
      card: card.getId()
    });
  }

  /**
   * 카드 제거 이벤트 발행
   */
  private publishCardDestroyed(cardId: string): void {
    this.eventBus.publish(EventType.CARD_DESTROYED, {
      cardId
    }, 'CardService');
  }
} 