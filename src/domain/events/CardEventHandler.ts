import { IDomainEventHandler } from './IDomainEventHandler';
import { ICardService } from '../services/ICardService';
import { CardCreatedEvent, CardUpdatedEvent, CardDeletedEvent } from './CardEvents';
import { LoggingService } from '@/infrastructure/services/LoggingService';
import { ICardRenderConfig } from '@/domain/models/Card';

/**
 * 카드 이벤트 핸들러
 */
export class CardEventHandler implements IDomainEventHandler<CardCreatedEvent | CardUpdatedEvent | CardDeletedEvent> {
  private readonly defaultRenderConfig: ICardRenderConfig;

  constructor(
    private readonly cardService: ICardService,
    private readonly loggingService: LoggingService
  ) {
    this.defaultRenderConfig = this.cardService.getDefaultRenderConfig();
  }

  /**
   * 이벤트를 처리합니다.
   * @param event 이벤트
   */
  async handle(event: CardCreatedEvent | CardUpdatedEvent | CardDeletedEvent): Promise<void> {
    const startTime = performance.now();
    this.loggingService.debug(`[CardNavigator] 카드 이벤트 처리 시작: ${event.constructor.name}`);

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
        default:
          this.loggingService.warn(`[CardNavigator] 처리하지 않는 이벤트 타입: ${event.constructor.name}`);
      }
    } catch (error) {
      this.loggingService.error(`[CardNavigator] 카드 이벤트 처리 실패: ${event.constructor.name}`, error);
      throw error;
    } finally {
      const endTime = performance.now();
      this.loggingService.debug(
        `[CardNavigator] 카드 이벤트 처리 완료: ${event.constructor.name} (소요 시간: ${(endTime - startTime).toFixed(2)}ms)`
      );
    }
  }

  /**
   * 카드 생성 이벤트를 처리합니다.
   * @param event 카드 생성 이벤트
   */
  private async handleCardCreated(event: CardCreatedEvent): Promise<void> {
    const { card } = event;
    try {
      // 이벤트에 렌더링 설정이 포함되어 있으면 사용하고, 없으면 기본 설정 사용
      const renderConfig = event.renderConfig || this.defaultRenderConfig;
      await this.cardService.renderCard(card, renderConfig);
      this.loggingService.debug(`[CardNavigator] 카드 렌더링 완료: ${card.id}`);
    } catch (error) {
      this.loggingService.error(`[CardNavigator] 카드 렌더링 실패: ${card.id}`, error);
      throw error;
    }
  }

  /**
   * 카드 업데이트 이벤트를 처리합니다.
   * @param event 카드 업데이트 이벤트
   */
  private async handleCardUpdated(event: CardUpdatedEvent): Promise<void> {
    const { card } = event;
    try {
      // 이벤트에 렌더링 설정이 포함되어 있으면 카드의 렌더링 설정 업데이트
      if (event.renderConfig) {
        card.updateRenderConfig(event.renderConfig);
      }
      await this.cardService.updateCard(card);
      this.loggingService.debug(`[CardNavigator] 카드 업데이트 완료: ${card.id}`);
    } catch (error) {
      this.loggingService.error(`[CardNavigator] 카드 업데이트 실패: ${card.id}`, error);
      throw error;
    }
  }

  /**
   * 카드 삭제 이벤트를 처리합니다.
   * @param event 카드 삭제 이벤트
   */
  private async handleCardDeleted(event: CardDeletedEvent): Promise<void> {
    const { cardId } = event;
    try {
      await this.cardService.deleteCard(cardId);
      this.loggingService.debug(`[CardNavigator] 카드 삭제 완료: ${cardId}`);
    } catch (error) {
      this.loggingService.error(`[CardNavigator] 카드 삭제 실패: ${cardId}`, error);
      throw error;
    }
  }
} 