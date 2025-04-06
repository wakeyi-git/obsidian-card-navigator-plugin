import { IUseCase } from './IUseCase';
import { IRenderManager } from '../../domain/managers/IRenderManager';
import { ICard } from '../../domain/models/Card';
import { ICardConfig } from '../../domain/models/CardConfig';
import { ICardStyle } from '../../domain/models/CardStyle';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';

/**
 * 카드 커스터마이즈 유스케이스 입력
 */
export interface CustomizeCardInput {
  /** 카드 */
  card: ICard;
  /** 렌더링 설정 */
  renderConfig: ICardConfig;
  /** 스타일 */
  style: ICardStyle;
}

/**
 * 카드 커스터마이즈 유스케이스
 */
export class CustomizeCardUseCase implements IUseCase<CustomizeCardInput, void> {
  private static instance: CustomizeCardUseCase;

  private constructor(
    private readonly renderManager: IRenderManager,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): CustomizeCardUseCase {
    if (!CustomizeCardUseCase.instance) {
      const container = Container.getInstance();
      CustomizeCardUseCase.instance = new CustomizeCardUseCase(
        container.resolve('IRenderManager'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return CustomizeCardUseCase.instance;
  }

  /**
   * 카드 커스터마이즈
   * @param input 입력
   */
  async execute(input: CustomizeCardInput): Promise<void> {
    const timer = this.performanceMonitor.startTimer('CustomizeCardUseCase.execute');
    try {
      this.loggingService.debug('카드 커스터마이즈 시작', { cardId: input.card.id });

      // 1. 카드 렌더링 요청
      await this.renderManager.requestRender(input.card.id, input.card);

      // 2. 이벤트 발송
      const event = new DomainEvent(
        DomainEventType.CARD_CONFIG_CHANGED,
        {
          oldConfig: input.card.config,
          newConfig: input.renderConfig
        }
      );
      this.eventDispatcher.dispatch(event);

      this.analyticsService.trackEvent('card_customized', {
        cardId: input.card.id,
        renderConfig: input.renderConfig,
        style: input.style
      });

      this.loggingService.info('카드 커스터마이즈 완료', { cardId: input.card.id });
    } catch (error) {
      this.loggingService.error('카드 커스터마이즈 실패', { error, cardId: input.card.id });
      this.errorHandler.handleError(error as Error, 'CustomizeCardUseCase.execute');
      throw error;
    } finally {
      timer.stop();
    }
  }
} 