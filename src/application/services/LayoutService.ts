import { ILayoutService } from '@/domain/services/ILayoutService';
import { ICardSet } from '@/domain/models/CardSet';
import { ILayoutResult, ICardPosition } from '@/domain/models/Layout';
import { 
  ILayoutConfig, 
  DEFAULT_LAYOUT_CONFIG,
  LayoutType,
  LayoutDirection,
} from '@/domain/models/LayoutConfig';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { LayoutConfigUpdatedEvent, LayoutCardPositionUpdatedEvent } from '@/domain/events/LayoutEvents';
import { LayoutServiceError } from '@/domain/errors/LayoutServiceError';
import { LayoutUtils } from '@/domain/utils/layoutUtils';
import { Container } from '@/infrastructure/di/Container';
import { App } from 'obsidian';

/**
 * 레이아웃 서비스 구현체
 */
export class LayoutService implements ILayoutService {
  private static instance: LayoutService | null = null;
  private layoutConfig: ILayoutConfig = DEFAULT_LAYOUT_CONFIG;
  private cardPositions: Map<string, { x: number; y: number }> = new Map();
  private viewportWidth: number = 0;
  private viewportHeight: number = 0;
  private _isInitialized: boolean = false;

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  /**
   * 레이아웃 서비스 인스턴스 가져오기
   */
  public static getInstance(): LayoutService {
    if (!LayoutService.instance) {
      try {
        console.debug('LayoutService.getInstance 호출됨');
        console.debug('LayoutService 인스턴스 생성 시작');
        
        // Container 인스턴스 획득
        const container = Container.getInstance();
        console.debug('Container 인스턴스 획득 성공');
        
        // 의존성 해결
        const errorHandler = container.resolve<IErrorHandler>('IErrorHandler');
        console.debug('IErrorHandler 해결 성공');
        
        const loggingService = container.resolve<ILoggingService>('ILoggingService');
        console.debug('ILoggingService 해결 성공');
        
        const performanceMonitor = container.resolve<IPerformanceMonitor>('IPerformanceMonitor');
        console.debug('IPerformanceMonitor 해결 성공');
        
        const analyticsService = container.resolve<IAnalyticsService>('IAnalyticsService');
        console.debug('IAnalyticsService 해결 성공');
        
        const eventDispatcher = container.resolve<IEventDispatcher>('IEventDispatcher');
        console.debug('IEventDispatcher 해결 성공');
        
        // 인스턴스 생성
        LayoutService.instance = new LayoutService(
          errorHandler,
          loggingService,
          performanceMonitor,
          analyticsService,
          eventDispatcher
        );
        
        console.debug('LayoutService 인스턴스 생성 완료');
        
        // 인스턴스 생성 후 자동으로 초기화
        if (!LayoutService.instance._isInitialized) {
          LayoutService.instance.initialize();
        }
      } catch (error) {
        console.error('LayoutService 인스턴스 생성 실패:', error);
        throw error;
      }
    } else {
      // 기존 인스턴스가 있지만 초기화되지 않은 경우 초기화
      if (!LayoutService.instance._isInitialized) {
        LayoutService.instance.initialize();
      }
    }
    
    return LayoutService.instance;
  }
  
  /**
   * 싱글톤 인스턴스 리셋 (테스트용)
   */
  public static resetInstance(): void {
    LayoutService.instance = null;
  }

  /**
   * 초기화
   */
  initialize(): void {
    const perfMark = 'LayoutService.initialize';
    this.performanceMonitor.startMeasure(perfMark);
    
    try {
      // 이미 초기화 되었는지 확인
      if (this._isInitialized) {
        this.loggingService.debug('레이아웃 서비스가 이미 초기화되어 있습니다. 초기화 작업을 건너뜁니다.');
        return;
      }
      
      this.loggingService.debug('레이아웃 서비스 초기화 시작');
      
      // 레이아웃 설정 초기화
      this.layoutConfig = { ...DEFAULT_LAYOUT_CONFIG };
      this.cardPositions = new Map();
      this.viewportWidth = 0;
      this.viewportHeight = 0;
      
      // 초기화 완료 설정
      this._isInitialized = true;
      
      this.loggingService.info('레이아웃 서비스 초기화 완료');
    } catch (error) {
      this.loggingService.error('레이아웃 서비스 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.initialize');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 초기화 여부 확인
   * @returns 초기화 완료 여부
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 정리
   */
  cleanup(): void {
    const perfMark = 'LayoutService.cleanup';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('레이아웃 서비스 정리 시작');
      this.layoutConfig = { ...DEFAULT_LAYOUT_CONFIG };
      this.cardPositions.clear();
      this.viewportWidth = 0;
      this.viewportHeight = 0;
      this._isInitialized = false;
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
      return { ...this.layoutConfig };
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
      this.layoutConfig = { ...config };
      this.eventDispatcher.dispatch(new LayoutConfigUpdatedEvent(this.layoutConfig));

      this.analyticsService.trackEvent('layout_config_updated', {
        fixedHeight: config.cardHeightFixed,
        minCardWidth: config.cardMinWidth,
        minCardHeight: config.cardMinHeight,
        padding: config.cardPadding,
        gap: config.cardGap
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
   * @param cardSet 카드셋
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @returns 레이아웃 결과
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

      // 레이아웃 타입과 방향 결정
      const layoutType = this.determineLayoutType(containerWidth, containerHeight, this.layoutConfig);
      const direction = this.determineLayoutDirection(containerWidth, containerHeight, this.layoutConfig);
      
      // 카드 위치 초기화
      const initialPositions = cardSet.cards.map(card => ({
        cardId: card.id,
        columnIndex: 0,
        rowIndex: 0,
        x: 0,
        y: 0,
        width: this.layoutConfig.cardMinWidth,
        height: this.layoutConfig.cardMinHeight
      }));

      // LayoutUtils를 사용하여 레이아웃 계산
      const cardPositions = LayoutUtils.calculateLayout(
        initialPositions,
        this.layoutConfig,
        containerWidth,
        containerHeight,
        layoutType as LayoutType,
        direction as LayoutDirection
      );

      // 열 수와 행 수 계산
      const columnCount = this.calculateColumnCount(containerWidth, this.layoutConfig);
      const rowCount = this.calculateRowCount(containerHeight, this.layoutConfig);

      this.analyticsService.trackEvent('layout_calculated', {
        cardCount: cardSet.cards.length,
        layoutType,
        direction,
        columnCount,
        rowCount
      });

      // 카드 위치 업데이트
      cardPositions.forEach(pos => {
        this.updateCardPosition(pos.cardId, pos.x, pos.y);
      });

      this.loggingService.info('레이아웃 계산 완료', { cardCount: cardSet.cards.length, columnCount, rowCount });

      return {
        cardPositions,
        columnCount,
        rowCount
      };
    } catch (error) {
      this.loggingService.error('레이아웃 계산 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.calculateLayout');
      // 오류 발생 시 빈 레이아웃 반환
      return {
        cardPositions: [],
        columnCount: 1,
        rowCount: 1
      };
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
      this.eventDispatcher.dispatch(new LayoutCardPositionUpdatedEvent({
        cardId,
        x,
        y,
        layoutConfig: this.layoutConfig
      }));

      this.analyticsService.trackEvent('card_position_updated', {
        cardId,
        x,
        y
      });

      this.loggingService.info('카드 위치 업데이트 완료', { cardId, x, y });
    } catch (error) {
      this.loggingService.error('카드 위치 업데이트 실패', { error, cardId, x, y });
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
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param config 레이아웃 설정
   * @returns 레이아웃 타입
   */
  determineLayoutType(
    containerWidth: number,
    containerHeight: number,
    config: ILayoutConfig
  ): string {
    const perfMark = 'LayoutService.determineLayoutType';
    this.performanceMonitor.startMeasure(perfMark);
    
    try {
      const layoutType = config.cardHeightFixed ? 'grid' : 'masonry';
      
      this.loggingService.debug('레이아웃 타입 결정', { 
        layoutType,
        containerWidth,
        containerHeight,
        cardHeightFixed: config.cardHeightFixed
      });
      
      return layoutType;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 레이아웃 방향 결정
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param config 레이아웃 설정
   * @returns 레이아웃 방향
   */
  determineLayoutDirection(
    containerWidth: number,
    containerHeight: number,
    config: ILayoutConfig
  ): string {
    const perfMark = 'LayoutService.determineLayoutDirection';
    this.performanceMonitor.startMeasure(perfMark);
    
    try {
      const aspectRatio = containerWidth / containerHeight;
      // 가로/세로 비율에 따라 방향 결정
      // 가로가 세로보다 길면 가로 방향, 아니면 세로 방향
      const direction = aspectRatio > 1 ? 'horizontal' : 'vertical';
      
      this.loggingService.debug('레이아웃 방향 결정', { 
        direction,
        containerWidth,
        containerHeight,
        aspectRatio,
        cardHeightFixed: config.cardHeightFixed
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
      const availableWidth = containerWidth - (2 * config.cardPadding);
      const columnCount = Math.floor(
        (availableWidth + config.cardGap) / (config.cardMinWidth + config.cardGap)
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
      const availableHeight = containerHeight - (2 * config.cardPadding);
      const rowCount = Math.floor(
        (availableHeight + config.cardGap) / (config.cardMinHeight + config.cardGap)
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