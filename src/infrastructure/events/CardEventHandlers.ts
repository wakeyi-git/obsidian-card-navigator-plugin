import { IDomainEventHandler } from '../../domain/events/IDomainEventHandler';
import { CardCreatedEvent, CardUpdatedEvent, CardDeletedEvent, CardStyleChangedEvent, CardPositionChangedEvent } from '../../domain/events/CardEvents';
import { TFile } from 'obsidian';
import { ILogger } from '../logging/Logger';
import { IEventStore } from '../../domain/events/IEventStore';
import { IDomainEvent } from '../../domain/events/DomainEvent';
import { Card } from '../../domain/models/Card';
import { CardStyle, CardPosition } from '../../domain/models/types';
import { ExtendedApp } from '../types/AppExtensions';

/**
 * 카드 이벤트 핸들러 기본 클래스
 */
abstract class BaseCardEventHandler<T extends IDomainEvent> implements IDomainEventHandler<T> {
  constructor(
    protected readonly app: ExtendedApp,
    protected readonly logger: ILogger,
    protected readonly eventStore: IEventStore
  ) {}

  async handle(event: T): Promise<void> {
    try {
      await this.eventStore.save(event);
      await this.handleEvent(event);
      this.logger.info(`Successfully handled ${event.constructor.name}`);
    } catch (error) {
      this.logger.error(`Failed to handle ${event.constructor.name}`, error as Error);
      throw error;
    }
  }

  protected abstract handleEvent(event: T): Promise<void>;

  /**
   * 파일을 찾습니다.
   */
  protected async findFile(filePath: string): Promise<TFile> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!file || !(file instanceof TFile)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return file;
  }

  /**
   * 카드를 찾습니다.
   */
  protected async findCard(cardId: string): Promise<Card> {
    const file = await this.findFile(cardId);
    const card = await this.app.cardService.findCardByFile(file);
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }
    return card;
  }
}

/**
 * 카드 생성 이벤트 핸들러
 */
export class CardCreatedEventHandler extends BaseCardEventHandler<CardCreatedEvent> {
  protected async handleEvent(event: CardCreatedEvent): Promise<void> {
    const card = event.card;
    this.logger.info(`Creating card: ${card.getId()}`);

    // 카드 캐시 업데이트
    await this.app.cardService.updateCardCache(card);

    // UI 업데이트
    this.app.cardNavigatorView?.refreshCardView(card.getId());

    // 이벤트 발생
    this.app.workspace.trigger('card-navigator:card-created', card);
  }
}

/**
 * 카드 수정 이벤트 핸들러
 */
export class CardUpdatedEventHandler extends BaseCardEventHandler<CardUpdatedEvent> {
  protected async handleEvent(event: CardUpdatedEvent): Promise<void> {
    const card = event.card;
    this.logger.info(`Updating card: ${card.getId()}`);

    // 카드 캐시 업데이트
    await this.app.cardService.updateCardCache(card);

    // UI 업데이트
    this.app.cardNavigatorView?.refreshCardView(card.getId());

    // 이벤트 발생
    this.app.workspace.trigger('card-navigator:card-updated', card);
  }
}

/**
 * 카드 삭제 이벤트 핸들러
 */
export class CardDeletedEventHandler extends BaseCardEventHandler<CardDeletedEvent> {
  protected async handleEvent(event: CardDeletedEvent): Promise<void> {
    const cardId = event.cardId;
    this.logger.info(`Deleting card: ${cardId}`);

    // 카드를 찾아서 캐시에서 제거
    const card = await this.findCard(cardId);
    await this.app.cardService.removeFromCardCache(card);

    // UI 업데이트
    this.app.cardNavigatorView?.removeCardView(cardId);

    // 이벤트 발생
    this.app.workspace.trigger('card-navigator:card-deleted', cardId);
  }
}

/**
 * 카드 스타일 변경 이벤트 핸들러
 */
export class CardStyleChangedEventHandler extends BaseCardEventHandler<CardStyleChangedEvent> {
  protected async handleEvent(event: CardStyleChangedEvent): Promise<void> {
    const { cardId, style } = event;
    this.logger.info(`Updating card style: ${cardId}`);

    // 카드 스타일 업데이트
    const card = await this.findCard(cardId);
    card.updateStyle(style);

    // UI 업데이트
    this.app.cardNavigatorView?.updateCardStyle(card);

    // 이벤트 발생
    this.app.workspace.trigger('card-navigator:card-style-changed', { cardId, style });
  }
}

/**
 * 카드 위치 변경 이벤트 핸들러
 */
export class CardPositionChangedEventHandler extends BaseCardEventHandler<CardPositionChangedEvent> {
  protected async handleEvent(event: CardPositionChangedEvent): Promise<void> {
    const { cardId, position } = event;
    this.logger.info(`Updating card position: ${cardId}`);

    // 카드 위치 업데이트
    const card = await this.findCard(cardId);
    card.updatePosition(position);

    // UI 업데이트
    this.app.cardNavigatorView?.updateCardPosition(card);

    // 이벤트 발생
    this.app.workspace.trigger('card-navigator:card-position-changed', { cardId, position });
  }
} 