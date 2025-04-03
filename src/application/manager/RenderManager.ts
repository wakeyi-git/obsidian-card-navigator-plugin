import { ICard } from '../../domain/models/Card';
import { ICardRenderConfig } from '../../domain/models/CardRenderConfig';
import { ICardStyle } from '../../domain/models/CardStyle';
import { IRenderManager } from '../../domain/managers/IRenderManager';
import { CardServiceError } from '../../domain/errors/CardServiceError';
import { CardRenderedEvent } from '../../domain/events/CardEvents';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/interfaces/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/interfaces/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/interfaces/events/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';
import { RenderUtils } from '@/domain/utils/renderUtils';
import { App } from 'obsidian';

/**
 * 렌더링 관리자 구현체
 */
export class RenderManager implements IRenderManager {
  private static instance: RenderManager;
  private renderCache: Map<string, string> = new Map();
  private renderingCards: Set<string> = new Set();
  private currentRenderConfig: ICardRenderConfig | null = null;
  private currentStyle: ICardStyle | null = null;
  private renderEventSubscribers: Set<(event: any) => void> = new Set();

  private constructor(
    private readonly app: App,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {
    RenderUtils.initialize(app);
  }

  static getInstance(): RenderManager {
    if (!RenderManager.instance) {
      const container = Container.getInstance();
      RenderManager.instance = new RenderManager(
        container.resolve('App'),
        container.resolve('IEventDispatcher'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService')
      );
    }
    return RenderManager.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    const perfMark = 'RenderManager.initialize';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('렌더링 관리자 초기화 시작');
      
      this.renderCache.clear();
      this.renderingCards.clear();
      this.currentRenderConfig = null;
      this.currentStyle = null;
      this.renderEventSubscribers.clear();

      this.loggingService.info('렌더링 관리자 초기화 완료');
    } catch (error) {
      this.loggingService.error('렌더링 관리자 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'RenderManager.initialize');
      throw new CardServiceError(
        '렌더링 관리자 초기화 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'initialize',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 정리
   */
  cleanup(): void {
    const perfMark = 'RenderManager.cleanup';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('렌더링 관리자 정리 시작');
      this.initialize();
      this.loggingService.info('렌더링 관리자 정리 완료');
    } catch (error) {
      this.loggingService.error('렌더링 관리자 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'RenderManager.cleanup');
      throw new CardServiceError(
        '렌더링 관리자 정리 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'cleanup',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 렌더링
   * @param card 카드
   * @param config 렌더링 설정
   * @param style 스타일
   */
  async renderCard(card: ICard, config: ICardRenderConfig, style: ICardStyle): Promise<string> {
    const perfMark = 'RenderManager.renderCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 렌더링 시작', { cardId: card.id });

      // 이미 렌더링 중인 경우 캐시된 결과 반환
      if (this.isCardRendered(card.id)) {
        this.loggingService.debug('캐시된 카드 렌더링 결과 사용', { cardId: card.id });
        return this.renderCache.get(card.id) || '';
      }

      // 렌더링 중 상태 설정
      this.renderingCards.add(card.id);

      // 렌더링 이벤트 발생
      this.notifyRenderEvent('render', card.id);

      // RenderUtils를 사용하여 카드 렌더링
      const header = RenderUtils.renderCardHeader(card, config);
      const body = await RenderUtils.renderCardBody(card, config);
      const footer = RenderUtils.renderCardFooter(card, config);

      // 렌더링된 내용 조합
      const renderedContent = [header, body, footer].filter(Boolean).join('\n');

      // 캐시 저장
      this.renderCache.set(card.id, renderedContent);

      // 렌더링 완료 이벤트 발생
      this.eventDispatcher.dispatch(new CardRenderedEvent(card));

      // 렌더링 중 상태 해제
      this.renderingCards.delete(card.id);

      this.analyticsService.trackEvent('card_rendered', {
        cardId: card.id,
        renderMarkdown: config.renderMarkdown,
        hasStyle: !!style
      });

      this.loggingService.info('카드 렌더링 완료', { cardId: card.id });
      return renderedContent;
    } catch (error) {
      // 렌더링 중 상태 해제
      this.renderingCards.delete(card.id);
      this.loggingService.error('카드 렌더링 실패', { error, cardId: card.id });
      this.errorHandler.handleError(error as Error, 'RenderManager.renderCard');
      throw new CardServiceError(
        '카드 렌더링 중 오류가 발생했습니다.',
        card.id,
        card.fileName,
        'render',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 렌더링 캐시 업데이트
   * @param cardId 카드 ID
   */
  async updateCardRenderCache(cardId: string): Promise<void> {
    const perfMark = 'RenderManager.updateCardRenderCache';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 렌더링 캐시 업데이트 시작', { cardId });

      // 캐시 삭제
      this.removeCardRenderCache(cardId);

      // 렌더링 이벤트 발생
      this.notifyRenderEvent('cache-update', cardId);

      this.analyticsService.trackEvent('card_render_cache_updated', { cardId });
      this.loggingService.info('카드 렌더링 캐시 업데이트 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 렌더링 캐시 업데이트 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'RenderManager.updateCardRenderCache');
      throw new CardServiceError(
        '카드 렌더링 캐시 업데이트 중 오류가 발생했습니다.',
        cardId,
        undefined,
        'updateCache',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 렌더링 캐시 삭제
   * @param cardId 카드 ID
   */
  removeCardRenderCache(cardId: string): void {
    const perfMark = 'RenderManager.removeCardRenderCache';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 렌더링 캐시 삭제 시작', { cardId });
      this.renderCache.delete(cardId);
      this.loggingService.info('카드 렌더링 캐시 삭제 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 렌더링 캐시 삭제 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'RenderManager.removeCardRenderCache');
      throw new CardServiceError(
        '카드 렌더링 캐시 삭제 중 오류가 발생했습니다.',
        cardId,
        undefined,
        'removeCache',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 렌더링 캐시 초기화
   */
  clearRenderCache(): void {
    const perfMark = 'RenderManager.clearRenderCache';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('렌더링 캐시 초기화 시작');
      this.renderCache.clear();
      this.notifyRenderEvent('cache-update');

      this.analyticsService.trackEvent('render_cache_cleared', {
        cacheSize: this.renderCache.size
      });

      this.loggingService.info('렌더링 캐시 초기화 완료');
    } catch (error) {
      this.loggingService.error('렌더링 캐시 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'RenderManager.clearRenderCache');
      throw new CardServiceError(
        '렌더링 캐시 초기화 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'clearCache',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 렌더링 설정 업데이트
   * @param config 렌더링 설정
   */
  updateRenderConfig(config: ICardRenderConfig): void {
    const perfMark = 'RenderManager.updateRenderConfig';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('렌더링 설정 업데이트 시작');
      this.currentRenderConfig = config;
      this.notifyRenderEvent('config-update', undefined, config);

      this.analyticsService.trackEvent('render_config_updated', {
        renderMarkdown: config.renderMarkdown,
        showImages: config.showImages,
        highlightCode: config.highlightCode,
        supportCallouts: config.supportCallouts,
        supportMath: config.supportMath
      });

      this.loggingService.info('렌더링 설정 업데이트 완료');
    } catch (error) {
      this.loggingService.error('렌더링 설정 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'RenderManager.updateRenderConfig');
      throw new CardServiceError(
        '렌더링 설정 업데이트 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'updateConfig',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 스타일 업데이트
   * @param style 스타일
   */
  updateStyle(style: ICardStyle): void {
    const perfMark = 'RenderManager.updateStyle';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('스타일 업데이트 시작');
      this.currentStyle = style;
      this.notifyRenderEvent('style-update', undefined, style);

      this.analyticsService.trackEvent('card_style_updated', {
        hasStyle: !!style
      });

      this.loggingService.info('스타일 업데이트 완료');
    } catch (error) {
      this.loggingService.error('스타일 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'RenderManager.updateStyle');
      throw new CardServiceError(
        '스타일 업데이트 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'updateStyle',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 렌더링 이벤트 구독
   * @param callback 콜백 함수
   */
  subscribeToRenderEvents(callback: (event: {
    type: 'render' | 'cache-update' | 'config-update' | 'style-update';
    cardId?: string;
    data?: any;
  }) => void): void {
    const perfMark = 'RenderManager.subscribeToRenderEvents';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('렌더링 이벤트 구독 시작');
      this.renderEventSubscribers.add(callback);
      this.loggingService.info('렌더링 이벤트 구독 완료');
    } catch (error) {
      this.loggingService.error('렌더링 이벤트 구독 실패', { error });
      this.errorHandler.handleError(error as Error, 'RenderManager.subscribeToRenderEvents');
      throw new CardServiceError(
        '렌더링 이벤트 구독 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'subscribe',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 렌더링 이벤트 구독 해제
   * @param callback 콜백 함수
   */
  unsubscribeFromRenderEvents(callback: (event: any) => void): void {
    const perfMark = 'RenderManager.unsubscribeFromRenderEvents';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('렌더링 이벤트 구독 해제 시작');
      this.renderEventSubscribers.delete(callback);
      this.loggingService.info('렌더링 이벤트 구독 해제 완료');
    } catch (error) {
      this.loggingService.error('렌더링 이벤트 구독 해제 실패', { error });
      this.errorHandler.handleError(error as Error, 'RenderManager.unsubscribeFromRenderEvents');
      throw new CardServiceError(
        '렌더링 이벤트 구독 해제 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'unsubscribe',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 렌더링 상태 확인
   * @param cardId 카드 ID
   */
  isCardRendered(cardId: string): boolean {
    return this.renderCache.has(cardId);
  }

  /**
   * 렌더링 진행 상태 확인
   * @param cardId 카드 ID
   */
  isCardRendering(cardId: string): boolean {
    return this.renderingCards.has(cardId);
  }

  /**
   * 렌더링 이벤트 알림
   * @param type 이벤트 타입
   * @param cardId 카드 ID
   * @param data 이벤트 데이터
   */
  private notifyRenderEvent(
    type: 'render' | 'cache-update' | 'config-update' | 'style-update',
    cardId?: string,
    data?: any
  ): void {
    const event = { type, cardId, data };
    this.renderEventSubscribers.forEach(callback => callback(event));
  }
} 