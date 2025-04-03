import { ILayoutService } from '@/domain/services/ILayoutService';
import { ICardSet } from '@/domain/models/CardSet';
import { ILayoutResult, ICardPosition } from '@/domain/models/Layout';
import { 
  ILayoutConfig, 
  DEFAULT_LAYOUT_CONFIG,
  LayoutType,
  LayoutDirection,
} from '@/domain/models/LayoutConfig';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/interfaces/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/interfaces/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/interfaces/events/IEventDispatcher';
import { LayoutConfigUpdatedEvent, CardPositionUpdatedEvent } from '@/domain/events/LayoutEvents';
import { LayoutServiceError } from '@/domain/errors/LayoutServiceError';
import { LayoutUtils } from '@/domain/utils/layoutUtils';
import { Container } from '@/infrastructure/di/Container';

/**
 * 레이아웃 서비스 구현체
 */
export class LayoutService implements ILayoutService {
  private static instance: LayoutService;

  private config: ILayoutConfig;
  private viewportWidth: number;
  private viewportHeight: number;
  private cardPositions: Map<string, { x: number; y: number }>;

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {
    this.config = DEFAULT_LAYOUT_CONFIG;
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.cardPositions = new Map();
  }

  static getInstance(): LayoutService {
    if (!LayoutService.instance) {
      const container = Container.getInstance();
      LayoutService.instance = new LayoutService(
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return LayoutService.instance;
  }

  /**
   * 서비스 초기화
   */
  initialize(): void {
    const perfMark = 'LayoutService.initialize';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('레이아웃 서비스 초기화 시작');
      // 초기화 시 필요한 작업이 있다면 여기에 구현
      this.loggingService.info('레이아웃 서비스 초기화 완료');
    } catch (error) {
      this.loggingService.error('레이아웃 서비스 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.initialize');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    const perfMark = 'LayoutService.cleanup';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('레이아웃 서비스 정리 시작');
      this.cardPositions.clear();
      this.loggingService.info('레이아웃 서비스 정리 완료');
    } catch (error) {
      this.loggingService.error('레이아웃 서비스 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.cleanup');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 레이아웃 설정 조회
   */
  getLayoutConfig(): ILayoutConfig {
    const perfMark = 'LayoutService.getLayoutConfig';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('레이아웃 설정 조회');
      return { ...this.config };
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 레이아웃 설정 업데이트
   */
  updateLayoutConfig(config: ILayoutConfig): void {
    const perfMark = 'LayoutService.updateLayoutConfig';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('레이아웃 설정 업데이트 시작', { config });
      this.config = { ...config };
      this.eventDispatcher.dispatch(new LayoutConfigUpdatedEvent(this.config));

      this.analyticsService.trackEvent('layout_config_updated', {
        fixedHeight: config.fixedHeight,
        minCardWidth: config.minCardWidth,
        minCardHeight: config.minCardHeight,
        padding: config.padding,
        gap: config.gap
      });

      this.loggingService.info('레이아웃 설정 업데이트 완료');
    } catch (error) {
      this.loggingService.error('레이아웃 설정 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.updateLayoutConfig');
      throw new LayoutServiceError('LAYOUT_CONFIG_UPDATE_FAILED', '레이아웃 설정 업데이트에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 레이아웃 계산
   */
  calculateLayout(
    cardSet: ICardSet,
    containerWidth: number,
    containerHeight: number
  ): ILayoutResult {
    const perfMark = 'LayoutService.calculateLayout';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('레이아웃 계산 시작', { 
        cardCount: cardSet.cards.length,
        containerWidth,
        containerHeight
      });

      const layoutType = this.determineLayoutType(containerWidth, containerHeight, this.config);
      const direction = this.determineLayoutDirection(containerWidth, containerHeight, this.config);
      
      // 카드 위치 초기화
      const initialPositions: ICardPosition[] = cardSet.cards.map(card => ({
        cardId: card.id,
        columnIndex: 0,
        rowIndex: 0,
        x: 0,
        y: 0,
        width: this.config.minCardWidth,
        height: this.config.minCardHeight
      }));

      // LayoutUtils를 사용하여 레이아웃 계산
      const cardPositions = LayoutUtils.calculateLayout(
        initialPositions,
        this.config,
        containerWidth,
        containerHeight,
        layoutType,
        direction
      );

      // 열 수와 행 수 계산
      const columnCount = this.calculateColumnCount(containerWidth, this.config);
      const rowCount = this.calculateRowCount(containerHeight, this.config);

      this.analyticsService.trackEvent('layout_calculated', {
        cardCount: cardSet.cards.length,
        layoutType,
        direction,
        columnCount,
        rowCount
      });

      this.loggingService.info('레이아웃 계산 완료', { 
        cardCount: cardSet.cards.length,
        columnCount,
        rowCount
      });

      return {
        cardPositions,
        columnCount,
        rowCount
      };
    } catch (error) {
      this.loggingService.error('레이아웃 계산 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.calculateLayout');
      throw new LayoutServiceError('LAYOUT_CALCULATION_FAILED', '레이아웃 계산에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 뷰포트 크기 업데이트
   */
  updateViewportDimensions(width: number, height: number): void {
    const perfMark = 'LayoutService.updateViewportDimensions';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('뷰포트 크기 업데이트 시작', { width, height });
      this.viewportWidth = width;
      this.viewportHeight = height;
      this.loggingService.info('뷰포트 크기 업데이트 완료');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 위치 업데이트
   */
  updateCardPosition(cardId: string, x: number, y: number): void {
    const perfMark = 'LayoutService.updateCardPosition';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 위치 업데이트 시작', { cardId, x, y });
      this.cardPositions.set(cardId, { x, y });
      this.eventDispatcher.dispatch(new CardPositionUpdatedEvent(cardId, x, y));

      this.analyticsService.trackEvent('card_position_updated', {
        cardId,
        x,
        y
      });

      this.loggingService.info('카드 위치 업데이트 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 위치 업데이트 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'LayoutService.updateCardPosition');
      throw new LayoutServiceError('CARD_POSITION_UPDATE_FAILED', '카드 위치 업데이트에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 위치 초기화
   */
  resetCardPositions(): void {
    const perfMark = 'LayoutService.resetCardPositions';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 위치 초기화 시작');
      const previousCount = this.cardPositions.size;
      this.cardPositions.clear();

      this.analyticsService.trackEvent('card_positions_reset', {
        previousCount
      });

      this.loggingService.info('카드 위치 초기화 완료', { previousCount });
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 기본 레이아웃 설정 반환
   */
  getDefaultLayoutConfig(): ILayoutConfig {
    const perfMark = 'LayoutService.getDefaultLayoutConfig';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('기본 레이아웃 설정 조회');
      return { ...DEFAULT_LAYOUT_CONFIG };
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 레이아웃 타입 결정
   */
  determineLayoutType(
    containerWidth: number,
    containerHeight: number,
    config: ILayoutConfig
  ): LayoutType {
    const perfMark = 'LayoutService.determineLayoutType';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      const layoutType = config.fixedHeight ? LayoutType.GRID : LayoutType.MASONRY;
      this.loggingService.debug('레이아웃 타입 결정', { 
        layoutType,
        containerWidth,
        containerHeight,
        fixedHeight: config.fixedHeight
      });
      return layoutType;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 레이아웃 방향 결정
   */
  determineLayoutDirection(
    containerWidth: number,
    containerHeight: number,
    config: ILayoutConfig
  ): LayoutDirection {
    const perfMark = 'LayoutService.determineLayoutDirection';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      let direction: LayoutDirection;
      if (config.fixedHeight) {
        direction = containerWidth > containerHeight ? LayoutDirection.HORIZONTAL : LayoutDirection.VERTICAL;
      } else {
        direction = LayoutDirection.VERTICAL; // 메이슨리 레이아웃은 항상 세로 방향
      }

      this.loggingService.debug('레이아웃 방향 결정', { 
        direction,
        containerWidth,
        containerHeight,
        fixedHeight: config.fixedHeight
      });
      return direction;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 열 수 계산
   */
  calculateColumnCount(containerWidth: number, config: ILayoutConfig): number {
    const perfMark = 'LayoutService.calculateColumnCount';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      const availableWidth = containerWidth - (2 * config.padding);
      const columnCount = Math.floor(
        (availableWidth + config.gap) / (config.minCardWidth + config.gap)
      );
      const result = Math.max(1, columnCount);
      this.loggingService.debug('열 수 계산', { 
        containerWidth,
        availableWidth,
        columnCount: result
      });
      return result;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 행 수 계산
   */
  calculateRowCount(containerHeight: number, config: ILayoutConfig): number {
    const perfMark = 'LayoutService.calculateRowCount';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      const availableHeight = containerHeight - (2 * config.padding);
      const rowCount = Math.floor(
        (availableHeight + config.gap) / (config.minCardHeight + config.gap)
      );
      const result = Math.max(1, rowCount);
      this.loggingService.debug('행 수 계산', { 
        containerHeight,
        availableHeight,
        rowCount: result
      });
      return result;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
} 