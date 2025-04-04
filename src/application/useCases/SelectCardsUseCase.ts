import { IUseCase } from './IUseCase';
import { ICard } from '../../domain/models/Card';
import { IClipboardService } from '../../domain/services/IClipboardService';
import { IFileService } from '../../domain/services/IFileService';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';

/**
 * 카드 선택 유즈케이스의 입력 데이터
 */
export interface SelectCardsInput {
  /**
   * 선택할 카드
   */
  card: ICard;

  /**
   * 선택 타입
   */
  type: 'single' | 'range' | 'all';

  /**
   * 선택 옵션
   */
  options?: {
    /**
     * 범위 선택 시작 카드
     */
    startCard?: ICard;

    /**
     * 일괄 작업 타입
     */
    batchAction?: 'copyContent' | 'openFiles' | 'copyLinks';
  };
}

/**
 * 카드 선택 유즈케이스
 */
export class SelectCardsUseCase implements IUseCase<SelectCardsInput, ICard[]> {
  private static instance: SelectCardsUseCase;

  private constructor(
    private readonly clipboardService: IClipboardService,
    private readonly fileService: IFileService,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {}

  public static getInstance(): SelectCardsUseCase {
    if (!SelectCardsUseCase.instance) {
      const container = Container.getInstance();
      SelectCardsUseCase.instance = new SelectCardsUseCase(
        container.resolve<IClipboardService>('IClipboardService'),
        container.resolve<IFileService>('IFileService'),
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService')
      );
    }
    return SelectCardsUseCase.instance;
  }

  async execute(input: SelectCardsInput): Promise<ICard[]> {
    const startTime = performance.now();
    this.loggingService.info('카드 선택 시작', { type: input.type });

    try {
      let selectedCards: ICard[] = [];

      // 1. 카드 선택
      switch (input.type) {
        case 'single':
          selectedCards = [input.card];
          break;

        case 'range':
          if (input.options?.startCard) {
            selectedCards = await this.selectCardRange(
              input.options.startCard,
              input.card
            );
          }
          break;

        case 'all':
          selectedCards = await this.selectAllCards();
          break;
      }

      // 2. 일괄 작업 실행
      if (input.options?.batchAction) {
        await this.executeBatchAction(
          selectedCards,
          input.options.batchAction
        );
      }

      const duration = performance.now() - startTime;
      this.performanceMonitor.startMeasure('selectCards');
      this.performanceMonitor.endMeasure('selectCards');
      this.analyticsService.trackEvent('cards_selected', {
        type: input.type,
        count: selectedCards.length,
        duration
      });

      this.loggingService.info('카드 선택 완료', { 
        type: input.type,
        count: selectedCards.length 
      });
      return selectedCards;
    } catch (error) {
      this.errorHandler.handleError(error, '카드 선택 중 오류 발생');
      throw error;
    }
  }

  private async selectCardRange(
    startCard: ICard,
    endCard: ICard
  ): Promise<ICard[]> {
    // TODO: 카드 범위 선택 로직 구현
    return [];
  }

  private async selectAllCards(): Promise<ICard[]> {
    // TODO: 모든 카드 선택 로직 구현
    return [];
  }

  private async executeBatchAction(
    cards: ICard[],
    action: 'copyContent' | 'openFiles' | 'copyLinks'
  ): Promise<void> {
    switch (action) {
      case 'copyContent':
        await this.clipboardService.copyContents(cards.map(card => card.file));
        break;

      case 'openFiles':
        await this.fileService.openFiles(cards.map(card => card.file));
        break;

      case 'copyLinks':
        await this.clipboardService.copyLinks(cards.map(card => card.file));
        break;
    }
  }
} 