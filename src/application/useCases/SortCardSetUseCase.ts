import { IUseCase } from './IUseCase';
import { ICardSetService } from '../../domain/services/ICardSetService';
import { ICardSet } from '../../domain/models/CardSet';
import { ISortConfig } from '../../domain/models/SortConfig';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';

/**
 * 카드셋 정렬 유즈케이스의 입력 데이터
 */
export interface SortCardSetInput {
  /**
   * 정렬할 카드셋
   */
  cardSet: ICardSet;

  /**
   * 정렬 설정
   */
  sortConfig: ISortConfig;
}

/**
 * 카드셋 정렬 유즈케이스
 */
export class SortCardSetUseCase implements IUseCase<SortCardSetInput, ICardSet> {
  private static instance: SortCardSetUseCase;

  private constructor(
    private readonly cardSetService: ICardSetService,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {}

  public static getInstance(): SortCardSetUseCase {
    if (!SortCardSetUseCase.instance) {
      const container = Container.getInstance();
      SortCardSetUseCase.instance = new SortCardSetUseCase(
        container.resolve<ICardSetService>('ICardSetService'),
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService')
      );
    }
    return SortCardSetUseCase.instance;
  }

  async execute(input: SortCardSetInput): Promise<ICardSet> {
    const startTime = performance.now();
    this.loggingService.info('카드셋 정렬 시작', { 
      cardSetId: input.cardSet.id,
      sortField: input.sortConfig.field,
      sortOrder: input.sortConfig.order
    });

    try {
      // 1. 카드셋 정렬
      const sortedCardSet = await this.cardSetService.sortCardSet(
        input.cardSet,
        input.sortConfig
      );

      const duration = performance.now() - startTime;
      this.performanceMonitor.startMeasure('sortCardSet');
      this.performanceMonitor.endMeasure('sortCardSet');
      this.analyticsService.trackEvent('card_set_sorted', {
        cardSetId: input.cardSet.id,
        sortField: input.sortConfig.field,
        sortOrder: input.sortConfig.order,
        duration
      });

      this.loggingService.info('카드셋 정렬 완료', { 
        cardSetId: input.cardSet.id,
        sortField: input.sortConfig.field,
        sortOrder: input.sortConfig.order
      });

      return sortedCardSet;
    } catch (error) {
      this.errorHandler.handleError(error, '카드셋 정렬 중 오류 발생');
      throw error;
    }
  }
} 