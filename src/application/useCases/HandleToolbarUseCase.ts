import { IUseCase } from './IUseCase';
import { IToolbarService } from '../../domain/services/IToolbarService';
import { ISortConfig } from '../../domain/models/SortConfig';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { CardSetType } from '@/domain/models/CardSetConfig';
import { ISearchConfig } from '@/domain/models/SearchConfig';
import { ICardConfig } from '@/domain/models/CardConfig';
import { ICardStyle } from '@/domain/models/CardStyle';
import { ILayoutConfig } from '@/domain/models/LayoutConfig';

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
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): HandleToolbarUseCase {
    if (!HandleToolbarUseCase.instance) {
      const container = Container.getInstance();
      HandleToolbarUseCase.instance = new HandleToolbarUseCase(
        container.resolve('IToolbarService'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return HandleToolbarUseCase.instance;
  }

  /**
   * 툴바 액션 처리
   * @param input 입력
   */
  async execute(input: HandleToolbarInput): Promise<void> {
    const timer = this.performanceMonitor.startTimer('HandleToolbarUseCase.execute');
    try {
      this.loggingService.debug('툴바 액션 처리 시작', { action: input.action, value: input.value });

      switch (input.action) {
        case 'changeCardSetType':
          this.toolbarService.changeCardSetType(input.value);
          const cardSetTypeEvent = new DomainEvent(
            DomainEventType.TOOLBAR_CARD_SET_TYPE_CHANGED,
            {
              oldType: this.toolbarService.getCurrentCardSetType(),
              newType: input.value as CardSetType
            }
          );
          this.eventDispatcher.dispatch(cardSetTypeEvent);
          break;

        case 'search':
          this.toolbarService.updateSearchConfig(input.value);
          const searchConfigEvent = new DomainEvent(
            DomainEventType.TOOLBAR_SEARCH_CONFIG_CHANGED,
            {
              oldConfig: this.toolbarService.getCurrentSearchConfig(),
              newConfig: input.value as ISearchConfig
            }
          );
          this.eventDispatcher.dispatch(searchConfigEvent);
          break;

        case 'applySort':
          this.toolbarService.updateSortConfig(input.value as ISortConfig);
          const sortConfigEvent = new DomainEvent(
            DomainEventType.TOOLBAR_SORT_CONFIG_CHANGED,
            {
              oldConfig: this.toolbarService.getCurrentSortConfig(),
              newConfig: input.value as ISortConfig
            }
          );
          this.eventDispatcher.dispatch(sortConfigEvent);
          break;

        case 'toggleSetting':
          if (input.value.type === 'cardConfig') {
            this.toolbarService.updateCardRenderConfig(input.value.value);
            const cardConfigEvent = new DomainEvent(
              DomainEventType.TOOLBAR_CARD_CONFIG_CHANGED,
              {
                oldConfig: this.toolbarService.getCurrentCardRenderConfig(),
                newConfig: input.value.value as ICardConfig
              }
            );
            this.eventDispatcher.dispatch(cardConfigEvent);
          } else if (input.value.type === 'cardStyle') {
            this.toolbarService.updateCardStyle(input.value.value);
            const cardStyleEvent = new DomainEvent(
              DomainEventType.TOOLBAR_CARD_STYLE_CHANGED,
              {
                oldStyle: this.toolbarService.getCurrentCardStyle(),
                newStyle: input.value.value as ICardStyle
              }
            );
            this.eventDispatcher.dispatch(cardStyleEvent);
          } else if (input.value.type === 'layoutConfig') {
            this.toolbarService.updateLayoutConfig(input.value.value);
            const layoutConfigEvent = new DomainEvent(
              DomainEventType.TOOLBAR_LAYOUT_CONFIG_CHANGED,
              {
                oldConfig: this.toolbarService.getCurrentLayoutConfig(),
                newConfig: input.value.value as ILayoutConfig
              }
            );
            this.eventDispatcher.dispatch(layoutConfigEvent);
          }
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
      timer.stop();
    }
  }
} 