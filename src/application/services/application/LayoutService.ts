import { ILayoutService, ILayoutResult } from '@/domain/services/application/ILayoutService';
import { ICardSet } from '@/domain/models/CardSet';
import { ILayoutConfig, LayoutType, LayoutDirection, DEFAULT_LAYOUT_CONFIG } from '@/domain/models/Layout';
import { LayoutUtils } from '@/domain/utils/layoutUtils';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { LayoutConfigUpdatedEvent, LayoutCardPositionUpdatedEvent, ViewportDimensionsUpdatedEvent } from '@/domain/events/LayoutEvents';
import { LayoutServiceError } from '@/domain/errors/LayoutServiceError';
import { Container } from '@/infrastructure/di/Container';
import { ICard } from '@/domain/models/Card';
import { IScrollService } from '@/domain/services/application/IScrollService';
import { 
  LayoutModeChangedEvent,
  LayoutCardWidthChangedEvent,
  LayoutCardHeightChangedEvent,
  LayoutChangedEvent,
  LayoutResizedEvent,
  LayoutCardStyleUpdatedEvent
} from '@/domain/events/LayoutEvents';
import { ICardService } from '@/domain/services/domain/ICardService';
import { ICardSetService } from '@/domain/services/domain/ICardSetService';
import { ICardManager } from '@/domain/managers/ICardManager';
import { ICardDisplayManager } from '@/domain/managers/ICardDisplayManager';
import { ICardRenderManager } from '@/domain/managers/ICardRenderManager';
import { ICardFactory } from '@/domain/factories/ICardFactory';

/**
 * 레이아웃 서비스 구현체
 */
export class LayoutService implements ILayoutService {
  private static instance: LayoutService | null = null;
  private initialized: boolean = false;
  private layoutConfig: ILayoutConfig = DEFAULT_LAYOUT_CONFIG;
  private lastLayoutCalculation: {
    containerWidth: number;
    containerHeight: number;
    result: ILayoutResult;
  } | null = null;
  private lastCardPositions: Map<string, {x: number, y: number}> = new Map();
  private viewportWidth: number = 0;
  private viewportHeight: number = 0;
  private resizeObserver: ResizeObserver | null = null;
  private containerElement: HTMLElement | null = null;
  private eventDispatcher: IEventDispatcher;
  private scrollService: IScrollService;

  constructor(
    private readonly cardService: ICardService,
    private readonly cardSetService: ICardSetService,
    private readonly cardManager: ICardManager,
    private readonly cardDisplayManager: ICardDisplayManager,
    private readonly cardRenderManager: ICardRenderManager,
    private readonly cardFactory: ICardFactory,
    private readonly errorHandler: IErrorHandler,
    private readonly logger: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    eventDispatcher: IEventDispatcher,
    scrollService: IScrollService
  ) {
    this.eventDispatcher = eventDispatcher;
    this.scrollService = scrollService;
  }

  /**
   * 레이아웃 서비스 인스턴스 가져오기
   */
  static getInstance(): LayoutService {
    if (!LayoutService.instance) {
      const container = Container.getInstance();
      LayoutService.instance = new LayoutService(
        container.resolve('ICardService'),
        container.resolve('ICardSetService'),
        container.resolve('ICardManager'),
        container.resolve('ICardDisplayManager'),
        container.resolve('ICardRenderManager'),
        container.resolve('ICardFactory'),
        container.resolve('IScrollService'),
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
   * 초기화
   */
  initialize(): void {
    const timer = this.performanceMonitor.startTimer('LayoutService.initialize');
    
    try {
      if (this.initialized) {
        this.logger.debug('레이아웃 서비스가 이미 초기화되어 있습니다.');
        return;
      }
      
      this.logger.debug('레이아웃 서비스 초기화 시작');
      
      // 레이아웃 설정 초기화
      this.layoutConfig = { ...DEFAULT_LAYOUT_CONFIG };
      this.lastCardPositions = new Map();
      this.viewportWidth = 0;
      this.viewportHeight = 0;
      
      // ResizeObserver 초기화
      this.initializeResizeObserver();
      
      this.initialized = true;
      this.logger.info('레이아웃 서비스 초기화 완료');
    } catch (error) {
      this.logger.error('레이아웃 서비스 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.initialize');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * ResizeObserver 초기화
   */
  private initializeResizeObserver(): void {
    try {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          this.updateViewportDimensions(width, height);
        }
      });
      
      this.logger.debug('ResizeObserver 초기화 완료');
    } catch (error) {
      this.logger.error('ResizeObserver 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.initializeResizeObserver');
    }
  }

  /**
   * 컨테이너 요소 설정
   */
  setContainerElement(element: HTMLElement): void {
    const timer = this.performanceMonitor.startTimer('LayoutService.setContainerElement');
    
    try {
      this.logger.debug('컨테이너 요소 설정 시작');
      
      // 이전 컨테이너 관찰 중지
      if (this.containerElement && this.resizeObserver) {
        this.resizeObserver.unobserve(this.containerElement);
      }
      
      // 새 컨테이너 설정
      this.containerElement = element;
      
      // 새 컨테이너 관찰 시작
      if (this.resizeObserver) {
        this.resizeObserver.observe(element);
        this.updateViewportDimensions(element.clientWidth, element.clientHeight);
      }
      
      this.logger.info('컨테이너 요소 설정 완료');
    } catch (error) {
      this.logger.error('컨테이너 요소 설정 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.setContainerElement');
    } finally {
      timer.stop();
    }
  }

  /**
   * 뷰포트 크기 업데이트
   */
  updateViewportDimensions(width: number, height: number): void {
    const timer = this.performanceMonitor.startTimer('LayoutService.updateViewportDimensions');
    
    try {
      // 크기가 변경된 경우에만 업데이트
      if (this.viewportWidth !== width || this.viewportHeight !== height) {
        this.logger.debug('뷰포트 크기 업데이트 시작', { width, height });
        
        this.viewportWidth = width;
        this.viewportHeight = height;
        
        // 이벤트 발송
        this.eventDispatcher.dispatch(new ViewportDimensionsUpdatedEvent(
          width,
          height,
          this.layoutConfig
        ));
        
        this.analyticsService.trackEvent('viewport_dimensions_updated', {
          width,
          height
        });
        
        this.logger.info('뷰포트 크기 업데이트 완료');
      }
    } catch (error) {
      this.logger.error('뷰포트 크기 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.updateViewportDimensions');
    } finally {
      timer.stop();
    }
  }

  /**
   * 현재 뷰포트 크기 조회
   */
  getViewportDimensions(): { width: number; height: number } {
    return {
      width: this.viewportWidth,
      height: this.viewportHeight
    };
  }

  /**
   * 초기화 여부 확인
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 정리
   */
  cleanup(): void {
    const timer = this.performanceMonitor.startTimer('LayoutService.cleanup');
    
    try {
      this.logger.debug('레이아웃 서비스 정리 시작');
      
      // ResizeObserver 정리
      if (this.resizeObserver) {
        if (this.containerElement) {
          this.resizeObserver.unobserve(this.containerElement);
        }
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      
      this.layoutConfig = { ...DEFAULT_LAYOUT_CONFIG };
      this.lastCardPositions.clear();
      this.viewportWidth = 0;
      this.viewportHeight = 0;
      this.containerElement = null;
      this.initialized = false;
      this.lastLayoutCalculation = null;
      
      this.logger.info('레이아웃 서비스 정리 완료');
    } catch (error) {
      this.logger.error('레이아웃 서비스 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.cleanup');
    } finally {
      timer.stop();
    }
  }

  /**
   * 레이아웃 설정 조회
   */
  getLayoutConfig(): ILayoutConfig {
    const timer = this.performanceMonitor.startTimer('LayoutService.getLayoutConfig');
    try {
      this.logger.debug('레이아웃 설정 조회');
      return { ...this.layoutConfig };
    } finally {
      timer.stop();
    }
  }

  /**
   * 레이아웃 설정을 업데이트합니다.
   * @param config - 새로운 레이아웃 설정
   */
  updateLayoutConfig(config: ILayoutConfig): void {
    const timer = this.performanceMonitor.startTimer('LayoutService.updateLayoutConfig');
    try {
      this.logger.debug('레이아웃 설정 업데이트 시작', { config });
      this.layoutConfig = { ...config };
      this.eventDispatcher.dispatch(new LayoutConfigUpdatedEvent(this.layoutConfig));

      this.analyticsService.trackEvent('layout_config_updated', {
        fixedHeight: config.fixedCardHeight,
        minCardWidth: config.cardThresholdWidth,
        minCardHeight: config.cardThresholdHeight,
        padding: config.padding,
        gap: config.cardGap
      });

      this.logger.info('레이아웃 설정 업데이트 완료');
    } catch (error) {
      this.logger.error('레이아웃 설정 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.updateLayoutConfig');
      throw new LayoutServiceError('레이아웃 설정 업데이트에 실패했습니다.');
    } finally {
      timer.stop();
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
    // 이전 계산 결과와 동일한 조건이면 캐시된 결과 반환
    if (this.lastLayoutCalculation &&
        this.lastLayoutCalculation.containerWidth === containerWidth &&
        this.lastLayoutCalculation.containerHeight === containerHeight) {
      return this.lastLayoutCalculation.result;
    }

    const timer = this.performanceMonitor.startTimer('LayoutService.calculateLayout');
    
    try {
      this.logger.debug('레이아웃 계산 시작', { 
        cardCount: cardSet.cards.length,
        containerWidth,
        containerHeight
      });

      // 레이아웃 타입과 방향 결정
      const layoutType = LayoutUtils.determineLayoutType(containerWidth, containerHeight, this.layoutConfig);
      const direction = LayoutUtils.determineLayoutDirection(containerWidth, containerHeight, this.layoutConfig);
      
      // 카드 위치 초기화
      const initialPositions = cardSet.cards.map(card => ({
        cardId: card.id,
        columnIndex: 0,
        rowIndex: 0,
        x: 0,
        y: 0,
        width: this.layoutConfig.cardThresholdWidth,
        height: this.layoutConfig.cardThresholdHeight
      }));

      // LayoutUtils를 사용하여 레이아웃 계산
      const cardPositions = LayoutUtils.calculateLayout(
        initialPositions,
        this.layoutConfig,
        containerWidth,
        containerHeight,
        layoutType,
        direction
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

      this.logger.info('레이아웃 계산 완료', { cardCount: cardSet.cards.length, columnCount, rowCount });

      // 결과 캐싱
      this.lastLayoutCalculation = {
        containerWidth,
        containerHeight,
        result: {
          type: layoutType,
          direction,
          columnCount,
          rowCount,
          cardWidth: this.layoutConfig.cardThresholdWidth,
          cardHeight: this.layoutConfig.cardThresholdHeight,
          cardPositions: new Map(cardPositions.map(pos => [pos.cardId, { x: pos.x, y: pos.y }]))
        }
      };

      return this.lastLayoutCalculation.result;
    } catch (error) {
      this.logger.error('레이아웃 계산 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.calculateLayout');
      // 오류 발생 시 빈 레이아웃 반환
      return {
        type: LayoutType.MASONRY,
        direction: LayoutDirection.VERTICAL,
        columnCount: 1,
        rowCount: 1,
        cardWidth: this.layoutConfig.cardThresholdWidth,
        cardHeight: this.layoutConfig.cardThresholdHeight,
        cardPositions: new Map()
      };
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 위치를 업데이트합니다.
   * @param cardId - 카드 ID
   * @param x - X 좌표
   * @param y - Y 좌표
   */
  updateCardPosition(cardId: string, x: number, y: number): void {
    this.eventDispatcher.dispatch(new LayoutCardPositionUpdatedEvent(cardId, x, y, this.layoutConfig));
  }

  /**
   * 카드 위치 초기화
   */
  resetCardPositions(): void {
    const timer = this.performanceMonitor.startTimer('LayoutService.resetCardPositions');
    try {
      this.logger.debug('카드 위치 초기화 시작');
      const previousCount = this.lastCardPositions.size;
      this.lastCardPositions.clear();

      this.analyticsService.trackEvent('card_positions_reset', {
        previousCount
      });

      this.logger.info('카드 위치 초기화 완료', { previousCount });
    } finally {
      timer.stop();
    }
  }

  /**
   * 기본 레이아웃 설정 반환
   */
  getDefaultLayoutConfig(): ILayoutConfig {
    const timer = this.performanceMonitor.startTimer('LayoutService.getDefaultLayoutConfig');
    try {
      this.logger.debug('기본 레이아웃 설정 조회');
      return { ...DEFAULT_LAYOUT_CONFIG };
    } finally {
      timer.stop();
    }
  }

  /**
   * 열 수 계산
   */
  calculateColumnCount(containerWidth: number, config: ILayoutConfig): number {
    const timer = this.performanceMonitor.startTimer('LayoutService.calculateColumnCount');
    try {
      const availableWidth = containerWidth - (2 * config.padding);
      const columnCount = Math.floor(
        (availableWidth + config.cardGap) / (config.cardThresholdWidth + config.cardGap)
      );
      const result = Math.max(1, columnCount);
      this.logger.debug('열 수 계산', { 
        containerWidth,
        availableWidth,
        columnCount: result
      });
      return result;
    } finally {
      timer.stop();
    }
  }

  /**
   * 행 수 계산
   */
  calculateRowCount(containerHeight: number, config: ILayoutConfig): number {
    const timer = this.performanceMonitor.startTimer('LayoutService.calculateRowCount');
    try {
      const availableHeight = containerHeight - (2 * config.padding);
      const rowCount = Math.floor(
        (availableHeight + config.cardGap) / (config.cardThresholdHeight + config.cardGap)
      );
      const result = Math.max(1, rowCount);
      this.logger.debug('행 수 계산', { 
        containerHeight,
        availableHeight,
        rowCount: result
      });
      return result;
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 위치 조회
   * @param card 카드
   * @returns 카드 위치 또는 null
   */
  getCardPosition(card: ICard): { x: number; y: number } | null {
    const timer = this.performanceMonitor.startTimer('LayoutService.getCardPosition');
    try {
      if (!this.initialized) {
        throw new Error('레이아웃 서비스가 초기화되지 않았습니다.');
      }

      this.logger.debug('카드 위치 조회 시작', { cardId: card.id });
      
      const position = this.lastCardPositions.get(card.id);
      if (!position) {
        this.logger.warn('카드 위치를 찾을 수 없음', { cardId: card.id });
        return null;
      }

      this.analyticsService.trackEvent('card_position_retrieved', {
        cardId: card.id,
        x: position.x,
        y: position.y
      });

      this.logger.info('카드 위치 조회 완료', { 
        cardId: card.id,
        position 
      });

      return position;
    } catch (error) {
      this.logger.error('카드 위치 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.getCardPosition');
      return null;
    } finally {
      timer.stop();
    }
  }

  /**
   * 다음 카드 조회
   * @param currentCard 현재 카드
   * @param direction 방향
   * @returns 다음 카드 또는 null
   */
  getNextCard(currentCard: ICard, direction: LayoutDirection): ICard | null {
    const timer = this.performanceMonitor.startTimer('LayoutService.getNextCard');
    try {
      if (!this.initialized) {
        throw new Error('레이아웃 서비스가 초기화되지 않았습니다.');
      }

      this.logger.debug('다음 카드 조회 시작', { 
        currentCardId: currentCard.id,
        direction 
      });

      const currentPosition = this.lastCardPositions.get(currentCard.id);
      if (!currentPosition) {
        this.logger.warn('현재 카드의 위치를 찾을 수 없음', { cardId: currentCard.id });
        return null;
      }

      // 방향에 따라 다음 카드 찾기
      let nextCard: ICard | undefined;

      this.analyticsService.trackEvent('next_card_retrieved', {
        currentCardId: currentCard.id,
        direction
      });

      this.logger.info('다음 카드 조회 완료', { 
        currentCardId: currentCard.id,
        direction 
      });

      return nextCard || null;
    } catch (error) {
      this.logger.error('다음 카드 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.getNextCard');
      return null;
    } finally {
      timer.stop();
    }
  }

  /**
   * 이전 카드 조회
   * @param currentCard 현재 카드
   * @param direction 레이아웃 방향
   * @returns 이전 카드 또는 null
   */
  getPreviousCard(currentCard: ICard, direction: LayoutDirection): ICard | null {
    const timer = this.performanceMonitor.startTimer('LayoutService.getPreviousCard');
    try {
      if (!this.initialized) {
        throw new Error('레이아웃 서비스가 초기화되지 않았습니다.');
      }

      this.logger.debug('이전 카드 조회 시작', { 
        currentCardId: currentCard.id,
        direction 
      });

      this.analyticsService.trackEvent('previous_card_retrieved', {
        currentCardId: currentCard.id,
        direction
      });

      this.logger.info('이전 카드 조회 완료', { 
        currentCardId: currentCard.id,
        direction 
      });

      return null;
    } catch (error) {
      this.logger.error('이전 카드 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.getPreviousCard');
      return null;
    } finally {
      timer.stop();
    }
  }

  /**
   * 레이아웃 모드를 변경합니다.
   * @param fixedCardHeight - 카드 높이 고정 여부
   */
  changeLayoutMode(fixedCardHeight: boolean): void {
    const newConfig: ILayoutConfig = {
      ...this.layoutConfig,
      fixedCardHeight
    };
    this.updateLayoutConfig(newConfig);
    this.eventDispatcher.dispatch(new LayoutModeChangedEvent(newConfig));
  }

  /**
   * 카드 너비를 변경합니다.
   * @param width - 새로운 카드 너비
   */
  changeCardWidth(width: number): void {
    const newConfig: ILayoutConfig = {
      ...this.layoutConfig,
      cardThresholdWidth: width
    };
    this.updateLayoutConfig(newConfig);
    this.eventDispatcher.dispatch(new LayoutCardWidthChangedEvent(newConfig));
  }

  /**
   * 카드 높이를 변경합니다.
   * @param height - 새로운 카드 높이
   */
  changeCardHeight(height: number): void {
    const newConfig: ILayoutConfig = {
      ...this.layoutConfig,
      cardThresholdHeight: height
    };
    this.updateLayoutConfig(newConfig);
    this.eventDispatcher.dispatch(new LayoutCardHeightChangedEvent(newConfig));
  }

  /**
   * 레이아웃을 변경합니다.
   */
  changeLayout(): void {
    this.eventDispatcher.dispatch(new LayoutChangedEvent(this.layoutConfig));
  }

  /**
   * 레이아웃 크기를 변경합니다.
   * @param width - 새로운 너비
   * @param height - 새로운 높이
   */
  resizeLayout(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.eventDispatcher.dispatch(new LayoutResizedEvent(this.layoutConfig));
    this.eventDispatcher.dispatch(new ViewportDimensionsUpdatedEvent(width, height, this.layoutConfig));
  }

  /**
   * 카드 스타일을 업데이트합니다.
   * @param card 카드
   * @param style 스타일 타입
   */
  updateCardStyle(card: ICard, style: 'normal' | 'active' | 'focused'): void {
    const timer = this.performanceMonitor.startTimer('LayoutService.updateCardStyle');
    try {
      this.logger.debug('카드 스타일 업데이트 시작', { cardId: card.id, style });
      
      // 카드 디스플레이 매니저에 스타일 적용 요청
      const cardStyle = this.cardDisplayManager.getCardStyle();
      this.cardDisplayManager.applyCardStyle(card.id, cardStyle);
      
      // 이벤트 발송
      this.eventDispatcher.dispatch(new LayoutCardStyleUpdatedEvent(card.id, style));
      
      this.analyticsService.trackEvent('card_style_updated', {
        cardId: card.id,
        style
      });
      
      this.logger.info('카드 스타일 업데이트 완료', { cardId: card.id, style });
    } catch (error) {
      this.logger.error('카드 스타일 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'LayoutService.updateCardStyle');
    } finally {
      timer.stop();
    }
  }
} 