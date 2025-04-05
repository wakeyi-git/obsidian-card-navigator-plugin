import { IUseCase } from './IUseCase';
import { ILayoutService } from '../../domain/services/ILayoutService';
import { ICardSet } from '../../domain/models/CardSet';
import { ILayoutConfig } from '../../domain/models/LayoutConfig';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';

/**
 * 레이아웃 적용 유스케이스 입력
 */
export interface ApplyLayoutInput {
  /** 카드셋 */
  cardSet: ICardSet;
  /** 레이아웃 설정 */
  layout: ILayoutConfig;
  /** 컨테이너 너비 */
  containerWidth: number;
  /** 컨테이너 높이 */
  containerHeight: number;
}

/**
 * 레이아웃 적용 유스케이스
 */
export class ApplyLayoutUseCase implements IUseCase<ApplyLayoutInput, void> {
  private static instance: ApplyLayoutUseCase;

  private constructor(
    private readonly layoutService: ILayoutService,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {}

  static getInstance(): ApplyLayoutUseCase {
    if (!ApplyLayoutUseCase.instance) {
      const container = Container.getInstance();
      ApplyLayoutUseCase.instance = new ApplyLayoutUseCase(
        container.resolve('ILayoutService'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService')
      );
    }
    return ApplyLayoutUseCase.instance;
  }

  /**
   * 레이아웃 적용
   * @param input 입력
   */
  async execute(input: ApplyLayoutInput): Promise<void> {
    const perfMark = 'ApplyLayoutUseCase.execute';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('레이아웃 적용 시작', { cardSetId: input.cardSet.id });

      // 레이아웃 설정 업데이트
      this.layoutService.updateLayoutConfig(input.layout);

      // 레이아웃 계산
      const layoutResult = this.layoutService.calculateLayout(
        input.cardSet,
        input.containerWidth,
        input.containerHeight
      );

      // 레이아웃 결과 적용
      layoutResult.cardPositions.forEach(position => {
        this.layoutService.updateCardPosition(position.cardId, position.x, position.y);
      });

      this.analyticsService.trackEvent('layout_applied', {
        cardSetId: input.cardSet.id,
        layoutType: input.layout.cardHeightFixed ? 'grid' : 'masonry',
        containerWidth: input.containerWidth,
        containerHeight: input.containerHeight
      });

      this.loggingService.info('레이아웃 적용 완료', { cardSetId: input.cardSet.id });
    } catch (error) {
      this.loggingService.error('레이아웃 적용 실패', { error, cardSetId: input.cardSet.id });
      this.errorHandler.handleError(error as Error, 'ApplyLayoutUseCase.execute');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
} 