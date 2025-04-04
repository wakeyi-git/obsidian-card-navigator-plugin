import { IUseCase } from './IUseCase';
import { IToolbarService } from '../../domain/services/IToolbarService';
import { ICardRenderConfig } from '../../domain/models/CardRenderConfig';
import { ILayoutConfig } from '../../domain/models/LayoutConfig';
import { ISortConfig } from '../../domain/models/SortConfig';
import { ILayout } from '../../domain/models/Layout';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';

/**
 * 툴바 처리 유스케이스 입력
 */
export interface HandleToolbarInput {
  /** 액션 타입 */
  action: 'changeCardSetType' | 'search' | 'applySort' | 'toggleSetting';
  /** 액션 값 */
  value: any;
}

/**
 * 툴바 처리 유스케이스
 */
export class HandleToolbarUseCase implements IUseCase<HandleToolbarInput, void> {
  private static instance: HandleToolbarUseCase;

  private constructor(
    private readonly toolbarService: IToolbarService,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {}

  static getInstance(): HandleToolbarUseCase {
    if (!HandleToolbarUseCase.instance) {
      const container = Container.getInstance();
      HandleToolbarUseCase.instance = new HandleToolbarUseCase(
        container.resolve('IToolbarService'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService')
      );
    }
    return HandleToolbarUseCase.instance;
  }

  /**
   * 툴바 액션 처리
   * @param input 입력
   */
  async execute(input: HandleToolbarInput): Promise<void> {
    const perfMark = 'HandleToolbarUseCase.execute';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('툴바 액션 처리 시작', { action: input.action, value: input.value });

      switch (input.action) {
        case 'changeCardSetType':
          this.toolbarService.changeCardSetType(input.value);
          break;
        case 'search':
          this.toolbarService.search(input.value);
          break;
        case 'applySort':
          this.toolbarService.applySort(input.value as ISortConfig);
          break;
        case 'toggleSetting':
          this.toolbarService.toggleSetting(input.value.type, input.value.value);
          break;
      }

      this.analyticsService.trackEvent('toolbar_action', {
        action: input.action,
        value: input.value
      });

      this.loggingService.info('툴바 액션 처리 완료', { action: input.action });
    } catch (error) {
      this.loggingService.error('툴바 액션 처리 실패', { error, action: input.action });
      this.errorHandler.handleError(error as Error, 'HandleToolbarUseCase.execute');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
} 