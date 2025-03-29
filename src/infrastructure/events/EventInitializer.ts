import { IDomainEvent } from '../../domain/events/DomainEvent';
import { DomainEventDispatcher } from '../../domain/events/DomainEventDispatcher';
import { IEventStore } from '../../domain/events/IEventStore';
import { CardCreatedEventHandler, CardUpdatedEventHandler, CardDeletedEventHandler, CardStyleChangedEventHandler, CardPositionChangedEventHandler } from './CardEventHandlers';
import { ILogger } from '../logging/Logger';
import { ExtendedApp } from '../types/AppExtensions';

/**
 * 이벤트 초기화 클래스
 */
export class EventInitializer {
  constructor(
    private readonly app: ExtendedApp,
    private readonly eventStore: IEventStore,
    private readonly logger: ILogger
  ) {}

  /**
   * 이벤트 시스템을 초기화합니다.
   */
  async initialize(): Promise<void> {
    try {
      const eventDispatcher = new DomainEventDispatcher();

      // 이벤트 핸들러 등록
      eventDispatcher.register('CardCreatedEvent', new CardCreatedEventHandler(this.app, this.logger, this.eventStore));
      eventDispatcher.register('CardUpdatedEvent', new CardUpdatedEventHandler(this.app, this.logger, this.eventStore));
      eventDispatcher.register('CardDeletedEvent', new CardDeletedEventHandler(this.app, this.logger, this.eventStore));
      eventDispatcher.register('CardStyleChangedEvent', new CardStyleChangedEventHandler(this.app, this.logger, this.eventStore));
      eventDispatcher.register('CardPositionChangedEvent', new CardPositionChangedEventHandler(this.app, this.logger, this.eventStore));

      this.logger.info('Event system initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize event system', error as Error);
      throw error;
    }
  }
} 