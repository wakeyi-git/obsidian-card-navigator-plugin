import { Card } from '../models/Card';
import { ICardService } from '../services/CardService';
import { IDomainEventHandler } from './IDomainEventHandler';
import {
  CardEvent,
  CardCreatedEvent,
  CardUpdatedEvent,
  CardDeletedEvent,
  CardStyleChangedEvent,
  CardPositionChangedEvent
} from './CardEvents';

/**
 * 카드 이벤트 핸들러
 */
export class CardEventHandler implements IDomainEventHandler<CardEvent> {
  constructor(private readonly cardService: ICardService) {}

  /**
   * 이벤트를 처리합니다.
   */
  async handle(event: CardEvent): Promise<void> {
    console.debug(`[CardNavigator] 이벤트 처리 시작: ${event.constructor.name}`);
    
    try {
      switch (event.constructor.name) {
        case 'CardCreatedEvent':
          await this.handleCardCreated(event as CardCreatedEvent);
          break;
        case 'CardUpdatedEvent':
          await this.handleCardUpdated(event as CardUpdatedEvent);
          break;
        case 'CardDeletedEvent':
          await this.handleCardDeleted(event as CardDeletedEvent);
          break;
        case 'CardStyleChangedEvent':
          await this.handleCardStyleChanged(event as CardStyleChangedEvent);
          break;
        case 'CardPositionChangedEvent':
          await this.handleCardPositionChanged(event as CardPositionChangedEvent);
          break;
        default:
          console.warn(`[CardNavigator] 알 수 없는 이벤트 타입: ${event.constructor.name}`);
      }
    } catch (error) {
      console.error(`[CardNavigator] 이벤트 처리 중 오류 발생: ${event.constructor.name}`, error);
      throw error;
    }
  }

  /**
   * 카드 생성 이벤트 처리
   */
  private async handleCardCreated(event: CardCreatedEvent): Promise<void> {
    const card = event.card;
    await this.cardService.updateCard(card);
  }

  /**
   * 카드 업데이트 이벤트 처리
   */
  private async handleCardUpdated(event: CardUpdatedEvent): Promise<void> {
    const card = event.card;
    await this.cardService.updateCard(card);
  }

  /**
   * 카드 삭제 이벤트 처리
   */
  private async handleCardDeleted(event: CardDeletedEvent): Promise<void> {
    const cardId = event.cardId;
    await this.cardService.deleteCard(cardId);
  }

  /**
   * 카드 스타일 변경 이벤트 처리
   */
  private async handleCardStyleChanged(event: CardStyleChangedEvent): Promise<void> {
    const card = await this.cardService.getCard(event.cardId);
    if (!card) {
      throw new Error(`Card not found: ${event.cardId}`);
    }

    // 카드 스타일 변경 후 처리 로직
  }

  /**
   * 카드 위치 변경 이벤트 처리
   */
  private async handleCardPositionChanged(event: CardPositionChangedEvent): Promise<void> {
    const card = await this.cardService.getCard(event.cardId);
    if (!card) {
      throw new Error(`Card not found: ${event.cardId}`);
    }

    // 카드 위치 변경 후 처리 로직
  }
} 