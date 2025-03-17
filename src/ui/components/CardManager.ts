import { ICard } from '../../domain/card/Card';
import { ICardDisplaySettings } from '../../domain/card/Card';
import { ICardStyle } from '../../domain/card/Card';
import { CardComponent } from './Card';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType } from '../../core/events/EventTypes';
import { DomainErrorBus } from '../../core/errors/DomainErrorBus';
import { ErrorCode } from '../../core/errors/ErrorTypes';
import { MarkdownRendererService } from '../../infrastructure/services/MarkdownRenderer';

/**
 * 카드 매니저
 * 카드 컴포넌트들을 관리하고 이벤트를 처리하는 클래스입니다.
 */
export class CardManager {
  private cards: Map<string, CardComponent> = new Map();
  private eventBus: DomainEventBus;
  private errorBus: DomainErrorBus;
  private renderer: MarkdownRendererService;

  constructor(
    renderer: MarkdownRendererService,
    eventBus: DomainEventBus,
    errorBus: DomainErrorBus
  ) {
    this.renderer = renderer;
    this.eventBus = eventBus;
    this.errorBus = errorBus;
  }

  /**
   * 카드 생성
   */
  public async createCard(
    card: ICard,
    displaySettings: ICardDisplaySettings,
    style: ICardStyle
  ): Promise<CardComponent> {
    try {
      const cardComponent = new CardComponent(
        card,
        displaySettings,
        style,
        this.renderer,
        this.eventBus,
        this.errorBus
      );
      
      this.cards.set(card.getId(), cardComponent);
      return cardComponent;
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_CREATION_FAILED, {
        cardData: card,
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  /**
   * 카드 업데이트
   */
  public async updateCard(card: ICard): Promise<void> {
    const cardComponent = this.cards.get(card.getId());
    if (!cardComponent) {
      this.errorBus.publish(ErrorCode.CARD_NOT_FOUND, {
        cardId: card.getId()
      });
      return;
    }

    try {
      await cardComponent.update(card);
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_UPDATE_FAILED, {
        cardId: card.getId(),
        updates: {},
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  /**
   * 카드 삭제
   */
  public deleteCard(cardId: string): void {
    const cardComponent = this.cards.get(cardId);
    if (!cardComponent) {
      this.errorBus.publish(ErrorCode.CARD_NOT_FOUND, {
        cardId
      });
      return;
    }

    try {
      cardComponent.destroy();
      this.cards.delete(cardId);
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_DELETION_FAILED, {
        cardId,
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  /**
   * 카드 가져오기
   */
  public getCard(cardId: string): CardComponent | undefined {
    return this.cards.get(cardId);
  }

  /**
   * 모든 카드 가져오기
   */
  public getAllCards(): CardComponent[] {
    return Array.from(this.cards.values());
  }
} 