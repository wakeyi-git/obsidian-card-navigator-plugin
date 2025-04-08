import { ICard } from '@/domain/models/Card';
import { ISortConfig, SortConfig, SortType, SortOrder } from '@/domain/models/Sort';
import { ISortService } from '@/domain/services/application/ISortService';
import { SortServiceError } from '@/domain/errors/SortServiceError';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import {
  SortStartedEvent,
  SortCompletedEvent,
  SortFailedEvent
} from '@/domain/events/SortEvents';
import { CardService } from '@/application/services/domain/CardService';
import { CardSetService } from '@/application/services/domain/CardSetService';
import { CardManager } from '@/application/manager/CardManager';
import { CardFactory } from '@/application/factories/CardFactory';

/**
 * 정렬 서비스 구현체
 */
export class SortService implements ISortService {
  private static instance: SortService;

  private constructor(
    private readonly cardService: CardService,
    private readonly cardSetService: CardSetService,
    private readonly cardManager: CardManager,
    private readonly cardFactory: CardFactory,
    private readonly errorHandler: IErrorHandler,
    private readonly logger: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): SortService {
    if (!SortService.instance) {
      const container = Container.getInstance();
      SortService.instance = new SortService(
        container.resolve('CardService'),
        container.resolve('CardSetService'),
        container.resolve('CardManager'),
        container.resolve('CardFactory'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return SortService.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    this.logger.debug('정렬 서비스 초기화');
  }

  /**
   * 정리
   */
  cleanup(): void {
    this.logger.debug('정렬 서비스 정리');
  }

  /**
   * 카드 목록 정렬
   * @param cards 정렬할 카드 목록
   * @param config 정렬 설정
   * @returns 정렬된 카드 목록
   */
  async sortCards(cards: readonly ICard[], config: ISortConfig): Promise<readonly ICard[]> {
    const timer = this.performanceMonitor.startTimer('SortService.sortCards');
    try {
      this.logger.debug('카드 목록 정렬 시작', { 
        cardCount: cards.length,
        sortField: config.field,
        sortOrder: config.order
      });

      this.eventDispatcher.dispatch(new SortStartedEvent(cards, config));

      if (!this.validateSortConfig(config)) {
        this.logger.warn('유효하지 않은 정렬 설정', { 
          sortField: config.field,
          sortOrder: config.order
        });
        throw new SortServiceError('유효하지 않은 정렬 설정입니다.');
      }

      // 카드 목록 복사
      const sortedCards = Array.from(cards);

      // 정렬 수행
      sortedCards.sort((a, b) => {
        let comparison = 0;

        switch (config.field) {
          case 'fileName':
            comparison = a.fileName.localeCompare(b.fileName);
            break;

          case 'modified':
            comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
            break;

          case 'created':
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
            break;
        }

        return config.order === 'asc' ? comparison : -comparison;
      });

      this.eventDispatcher.dispatch(new SortCompletedEvent(sortedCards, config));

      this.analyticsService.trackEvent('cards_sorted', {
        cardCount: sortedCards.length,
        sortField: config.field,
        sortOrder: config.order
      });

      this.logger.info('카드 목록 정렬 완료', { 
        cardCount: sortedCards.length
      });

      return sortedCards;
    } catch (error) {
      this.logger.error('카드 목록 정렬 실패', { 
        error,
        sortField: config.field,
        sortOrder: config.order
      });
      const sortError = new SortServiceError('정렬 중 오류가 발생했습니다.');
      this.errorHandler.handleError(error as Error, 'SortService.sortCards');
      this.eventDispatcher.dispatch(new SortFailedEvent(cards, config, sortError));
      throw sortError;
    } finally {
      timer.stop();
    }
  }

  /**
   * 정렬 설정 유효성 검사
   * @param config 검사할 정렬 설정
   * @returns 유효성 여부
   */
  validateSortConfig(config: ISortConfig): boolean {
    const timer = this.performanceMonitor.startTimer('SortService.validateSortConfig');
    try {
      this.logger.debug('정렬 설정 유효성 검사', { 
        sortField: config.field,
        sortOrder: config.order
      });

      if (!config.field || !['fileName', 'created', 'modified', 'custom'].includes(config.field)) {
        return false;
      }

      if (!config.order || !['asc', 'desc'].includes(config.order)) {
        return false;
      }

      if (config.field === 'custom' && !config.customField) {
        return false;
      }

      return true;
    } finally {
      timer.stop();
    }
  }

  /**
   * 기본 정렬 설정 반환
   * @returns 기본 정렬 설정
   */
  getDefaultSortConfig(): ISortConfig {
    const timer = this.performanceMonitor.startTimer('SortService.getDefaultSortConfig');
    try {
      this.logger.debug('기본 정렬 설정 조회');
      return new SortConfig(SortType.NAME, SortOrder.ASC, 'fileName', 'asc');
    } finally {
      timer.stop();
    }
  }
} 