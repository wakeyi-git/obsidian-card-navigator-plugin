import { IUseCase } from './IUseCase';
import { ICard } from '../../domain/models/Card';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';

/**
 * 카드 포커스 유즈케이스의 입력 데이터
 */
export interface FocusCardInput {
  /**
   * 포커스할 카드
   */
  card: ICard;
}

/**
 * 카드 포커스 유즈케이스
 */
export class FocusCardUseCase implements IUseCase<FocusCardInput, ICard> {
  private static instance: FocusCardUseCase;

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  public static getInstance(): FocusCardUseCase {
    if (!FocusCardUseCase.instance) {
      const container = Container.getInstance();
      FocusCardUseCase.instance = new FocusCardUseCase(
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService'),
        container.resolve<IEventDispatcher>('IEventDispatcher')
      );
    }
    return FocusCardUseCase.instance;
  }

  async execute(input: FocusCardInput): Promise<ICard> {
    const startTime = performance.now();
    const timer = this.performanceMonitor.startTimer('focusCard');
    this.loggingService.info('카드 포커스 시작', { cardId: input.card.id });

    try {
      // 1. 이벤트 발송
      const event = new DomainEvent(
        DomainEventType.CARD_FOCUSED,
        {
          card: input.card
        }
      );
      this.eventDispatcher.dispatch(event);

      const duration = performance.now() - startTime;
      this.analyticsService.trackEvent('card_focused', {
        cardId: input.card.id,
        duration
      });

      this.loggingService.info('카드 포커스 완료', { cardId: input.card.id });
      return input.card;
    } catch (error) {
      this.errorHandler.handleError(error, '카드 포커스 중 오류 발생');
      throw error;
    } finally {
      timer.stop();
    }
  }
} 