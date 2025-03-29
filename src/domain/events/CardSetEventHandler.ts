import { CardSet } from '../models/CardSet';
import { ICardSetService } from '../services/CardSetService';
import { IDomainEventHandler } from './IDomainEventHandler';
import {
  CardSetEvent,
  CardSetCreatedEvent,
  CardSetUpdatedEvent,
  CardSetDeletedEvent
} from './CardSetEvents';

/**
 * 카드셋 이벤트 핸들러
 */
export class CardSetEventHandler implements IDomainEventHandler<CardSetEvent> {
  constructor(private readonly cardSetService: ICardSetService) {}

  /**
   * 이벤트를 처리합니다.
   */
  async handle(event: CardSetEvent): Promise<void> {
    console.debug(`[CardNavigator] 이벤트 처리 시작: ${event.constructor.name}`);
    
    try {
      switch (event.constructor.name) {
        case 'CardSetCreatedEvent':
          await this.handleCardSetCreated(event as CardSetCreatedEvent);
          break;
        case 'CardSetUpdatedEvent':
          await this.handleCardSetUpdated(event as CardSetUpdatedEvent);
          break;
        case 'CardSetDeletedEvent':
          await this.handleCardSetDeleted(event as CardSetDeletedEvent);
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
   * 카드셋 생성 이벤트 처리
   */
  private async handleCardSetCreated(event: CardSetCreatedEvent): Promise<void> {
    const cardSet = event.cardSet;
    await this.cardSetService.updateCardSet(cardSet);
  }

  /**
   * 카드셋 업데이트 이벤트 처리
   */
  private async handleCardSetUpdated(event: CardSetUpdatedEvent): Promise<void> {
    const cardSet = event.cardSet;
    await this.cardSetService.updateCardSet(cardSet);
  }

  /**
   * 카드셋 삭제 이벤트 처리
   */
  private async handleCardSetDeleted(event: CardSetDeletedEvent): Promise<void> {
    const cardSetId = event.cardSetId;
    await this.cardSetService.deleteCardSet(cardSetId);
  }
} 