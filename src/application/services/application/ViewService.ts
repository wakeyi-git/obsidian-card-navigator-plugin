import { IViewService } from '@/domain/services/application/IViewService';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';
import { ICardService } from '@/domain/services/domain/ICardService';
import { ICardSetService } from '@/domain/services/domain/ICardSetService';
import { ICardManager } from '@/domain/managers/ICardManager';
import { ICardFactory } from '@/domain/factories/ICardFactory';
import { ViewActivatedEvent, ViewDeactivatedEvent } from '@/domain/events/ViewEvents';

/**
 * 뷰 서비스 구현체
 */
export class ViewService implements IViewService {
  private static instance: ViewService;
  private initialized: boolean = false;
  private activeViewId: string | null = null;
  private views: Map<string, boolean> = new Map();

  constructor(
    private readonly cardService: ICardService,
    private readonly cardSetService: ICardSetService,
    private readonly cardManager: ICardManager,
    private readonly cardFactory: ICardFactory,
    private readonly errorHandler: IErrorHandler,
    private readonly logger: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): ViewService {
    if (!ViewService.instance) {
      const container = Container.getInstance();
      ViewService.instance = new ViewService(
        container.resolve<ICardService>('ICardService'),
        container.resolve<ICardSetService>('ICardSetService'),
        container.resolve<ICardManager>('ICardManager'),
        container.resolve<ICardFactory>('ICardFactory'),
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService'),
        container.resolve<IEventDispatcher>('IEventDispatcher')
      );
    }
    return ViewService.instance;
  }

  /**
   * 뷰 초기화
   */
  initializeViews(): void {
    const timer = this.performanceMonitor.startTimer('ViewService.initializeViews');
    try {
      if (this.initialized) {
        this.logger.debug('뷰 서비스가 이미 초기화되어 있습니다.');
        return;
      }

      this.logger.debug('뷰 서비스 초기화 시작');
      
      // 기본 뷰 등록
      this.views.set('card-navigator', false);
      
      this.initialized = true;
      this.logger.info('뷰 서비스 초기화 완료');
    } catch (error) {
      this.logger.error('뷰 서비스 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'ViewService.initializeViews');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 뷰 활성화
   * @param viewId 뷰 ID
   */
  activateView(viewId: string): void {
    const timer = this.performanceMonitor.startTimer('ViewService.activateView');
    try {
      if (!this.initialized) {
        throw new Error('뷰 서비스가 초기화되지 않았습니다.');
      }

      this.logger.debug('뷰 활성화 시작', { viewId });

      if (!this.views.has(viewId)) {
        throw new Error(`존재하지 않는 뷰입니다: ${viewId}`);
      }

      // 이전 활성 뷰 비활성화
      if (this.activeViewId) {
        this.deactivateView(this.activeViewId);
      }

      // 새 뷰 활성화
      this.views.set(viewId, true);
      this.activeViewId = viewId;

      // 이벤트 발송
      this.eventDispatcher.dispatch(new ViewActivatedEvent(viewId));

      this.analyticsService.trackEvent('view_activated', {
        viewId,
        previousViewId: this.activeViewId
      });

      this.logger.info('뷰 활성화 완료', { viewId });
    } catch (error) {
      this.logger.error('뷰 활성화 실패', { error, viewId });
      this.errorHandler.handleError(error as Error, 'ViewService.activateView');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 뷰 비활성화
   * @param viewId 뷰 ID
   */
  deactivateView(viewId: string): void {
    const timer = this.performanceMonitor.startTimer('ViewService.deactivateView');
    try {
      if (!this.initialized) {
        throw new Error('뷰 서비스가 초기화되지 않았습니다.');
      }

      this.logger.debug('뷰 비활성화 시작', { viewId });

      if (!this.views.has(viewId)) {
        throw new Error(`존재하지 않는 뷰입니다: ${viewId}`);
      }

      // 뷰 비활성화
      this.views.set(viewId, false);
      if (this.activeViewId === viewId) {
        this.activeViewId = null;
      }

      // 이벤트 발송
      this.eventDispatcher.dispatch(new ViewDeactivatedEvent(viewId));

      this.analyticsService.trackEvent('view_deactivated', {
        viewId
      });

      this.logger.info('뷰 비활성화 완료', { viewId });
    } catch (error) {
      this.logger.error('뷰 비활성화 실패', { error, viewId });
      this.errorHandler.handleError(error as Error, 'ViewService.deactivateView');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 활성 뷰 조회
   * @returns 활성 뷰 ID 또는 null
   */
  getActiveView(): string | null {
    const timer = this.performanceMonitor.startTimer('ViewService.getActiveView');
    try {
      if (!this.initialized) {
        throw new Error('뷰 서비스가 초기화되지 않았습니다.');
      }

      this.logger.debug('활성 뷰 조회');
      return this.activeViewId;
    } catch (error) {
      this.logger.error('활성 뷰 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'ViewService.getActiveView');
      return null;
    } finally {
      timer.stop();
    }
  }
} 