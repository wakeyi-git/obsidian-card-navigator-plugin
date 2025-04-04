import { ICard } from '../../domain/models/Card';
import { ICardRenderConfig } from '../../domain/models/CardRenderConfig';
import { ICardStyle } from '../../domain/models/CardStyle';
import { IRenderManager } from '../../domain/managers/IRenderManager';
import { IEventDispatcher } from '../../domain/events/DomainEvent';
import { CardCreatedEvent, CardUpdatedEvent, CardDeletedEvent, CardSelectedEvent, CardFocusedEvent, CardDraggedEvent, CardDroppedEvent } from '../../domain/events/CardEvents';
import { ILoggingService } from '../../domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '../../domain/infrastructure/IPerformanceMonitor';
import { IErrorHandler } from '../../domain/infrastructure/IErrorHandler';
import { RenderUtils } from '../../domain/utils/renderUtils';
import { App } from 'obsidian';
import { Container } from '../../infrastructure/di/Container';

/**
 * 렌더링 관리자
 */
export class RenderManager implements IRenderManager {
  private static instance: RenderManager;
  private cards: Map<string, ICard>;
  private currentRenderConfig: ICardRenderConfig | null;
  private currentCardStyle: ICardStyle | null;
  private isInitialized: boolean;
  private renderCache: Map<string, string>;
  private renderingCards: Set<string>;
  private renderEventSubscribers: Set<(event: any) => void>;

  private constructor(
    private readonly app: App,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly errorHandler: IErrorHandler
  ) {
    this.cards = new Map();
    this.currentRenderConfig = null;
    this.currentCardStyle = null;
    this.isInitialized = false;
    this.renderCache = new Map();
    this.renderingCards = new Set();
    this.renderEventSubscribers = new Set();
    RenderUtils.initialize(app);
  }

  static getInstance(): RenderManager {
    if (!RenderManager.instance) {
      const app = Container.getInstance().resolve<App>('App');
      const eventDispatcher = Container.getInstance().resolve<IEventDispatcher>('IEventDispatcher');
      const loggingService = Container.getInstance().resolve<ILoggingService>('ILoggingService');
      const performanceMonitor = Container.getInstance().resolve<IPerformanceMonitor>('IPerformanceMonitor');
      const errorHandler = Container.getInstance().resolve<IErrorHandler>('IErrorHandler');

      RenderManager.instance = new RenderManager(
        app,
        eventDispatcher,
        loggingService,
        performanceMonitor,
        errorHandler
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
      
      this.cards.clear();
      this.currentRenderConfig = null;
      this.currentCardStyle = null;
      this.renderCache.clear();
      this.renderingCards.clear();
      this.renderEventSubscribers.clear();
      this.isInitialized = true;

      this.loggingService.info('렌더링 관리자 초기화 완료');
    } catch (error) {
      this.loggingService.error('렌더링 관리자 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'RenderManager.initialize');
      throw error;
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
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 등록
   * @param card 카드
   */
  registerCard(card: ICard): void {
    const perfMark = 'RenderManager.registerCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 등록 시작', { cardId: card.id });

      if (!this.isInitialized) {
        throw new Error('렌더링 관리자가 초기화되지 않았습니다.');
      }

      this.cards.set(card.id, card);
      this.eventDispatcher.dispatch(new CardCreatedEvent(card));

      this.loggingService.info('카드 등록 완료', { cardId: card.id });
    } catch (error) {
      this.loggingService.error('카드 등록 실패', { error, cardId: card.id });
      this.errorHandler.handleError(error as Error, 'RenderManager.registerCard');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 등록 해제
   * @param cardId 카드 ID
   */
  unregisterCard(cardId: string): void {
    const perfMark = 'RenderManager.unregisterCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 등록 해제 시작', { cardId });

      if (!this.isInitialized) {
        throw new Error('렌더링 관리자가 초기화되지 않았습니다.');
      }

      const card = this.cards.get(cardId);
      if (card) {
        this.cards.delete(cardId);
        this.eventDispatcher.dispatch(new CardDeletedEvent(cardId));
      }

      this.loggingService.info('카드 등록 해제 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 등록 해제 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'RenderManager.unregisterCard');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 업데이트
   * @param card 카드
   */
  updateCard(card: ICard): void {
    const perfMark = 'RenderManager.updateCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 업데이트 시작', { cardId: card.id });

      if (!this.isInitialized) {
        throw new Error('렌더링 관리자가 초기화되지 않았습니다.');
      }

      this.cards.set(card.id, card);
      this.eventDispatcher.dispatch(new CardUpdatedEvent(card));

      this.loggingService.info('카드 업데이트 완료', { cardId: card.id });
    } catch (error) {
      this.loggingService.error('카드 업데이트 실패', { error, cardId: card.id });
      this.errorHandler.handleError(error as Error, 'RenderManager.updateCard');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 선택
   * @param cardId 카드 ID
   */
  selectCard(cardId: string): void {
    const perfMark = 'RenderManager.selectCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 선택 시작', { cardId });

      if (!this.isInitialized) {
        throw new Error('렌더링 관리자가 초기화되지 않았습니다.');
      }

      const card = this.cards.get(cardId);
      if (card) {
        this.eventDispatcher.dispatch(new CardSelectedEvent(cardId));
      }

      this.loggingService.info('카드 선택 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 선택 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'RenderManager.selectCard');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 포커스
   * @param cardId 카드 ID
   */
  focusCard(cardId: string): void {
    const perfMark = 'RenderManager.focusCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 포커스 시작', { cardId });

      if (!this.isInitialized) {
        throw new Error('렌더링 관리자가 초기화되지 않았습니다.');
      }

      const card = this.cards.get(cardId);
      if (card) {
        this.eventDispatcher.dispatch(new CardFocusedEvent(cardId));
      }

      this.loggingService.info('카드 포커스 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 포커스 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'RenderManager.focusCard');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 드래그
   * @param cardId 카드 ID
   */
  dragCard(cardId: string): void {
    const perfMark = 'RenderManager.dragCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 드래그 시작', { cardId });

      if (!this.isInitialized) {
        throw new Error('렌더링 관리자가 초기화되지 않았습니다.');
      }

      const card = this.cards.get(cardId);
      if (card) {
        this.eventDispatcher.dispatch(new CardDraggedEvent(cardId));
      }

      this.loggingService.info('카드 드래그 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 드래그 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'RenderManager.dragCard');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 드롭
   * @param cardId 카드 ID
   */
  dropCard(cardId: string): void {
    const perfMark = 'RenderManager.dropCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 드롭 시작', { cardId });

      if (!this.isInitialized) {
        throw new Error('렌더링 관리자가 초기화되지 않았습니다.');
      }

      const card = this.cards.get(cardId);
      if (card) {
        this.eventDispatcher.dispatch(new CardDroppedEvent(cardId));
      }

      this.loggingService.info('카드 드롭 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 드롭 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'RenderManager.dropCard');
      throw error;
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

      if (!this.isInitialized) {
        throw new Error('렌더링 관리자가 초기화되지 않았습니다.');
      }

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

      // 렌더링 중 상태 해제
      this.renderingCards.delete(card.id);

      this.loggingService.info('카드 렌더링 완료', { cardId: card.id });
      return renderedContent;
    } catch (error) {
      // 렌더링 중 상태 해제
      this.renderingCards.delete(card.id);
      this.loggingService.error('카드 렌더링 실패', { error, cardId: card.id });
      this.errorHandler.handleError(error as Error, 'RenderManager.renderCard');
      throw error;
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

      if (!this.isInitialized) {
        throw new Error('렌더링 관리자가 초기화되지 않았습니다.');
      }

      this.currentRenderConfig = config;
      this.notifyRenderEvent('config-update', undefined, config);

      // 모든 카드의 렌더링 설정 업데이트
      this.cards.forEach(card => {
        this.eventDispatcher.dispatch(new CardUpdatedEvent(card));
      });

      this.loggingService.info('렌더링 설정 업데이트 완료');
    } catch (error) {
      this.loggingService.error('렌더링 설정 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'RenderManager.updateRenderConfig');
      throw error;
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

      if (!this.isInitialized) {
        throw new Error('렌더링 관리자가 초기화되지 않았습니다.');
      }

      this.currentCardStyle = style;
      this.notifyRenderEvent('style-update', undefined, style);

      // 모든 카드의 스타일 업데이트
      this.cards.forEach(card => {
        this.eventDispatcher.dispatch(new CardUpdatedEvent(card));
      });

      this.loggingService.info('스타일 업데이트 완료');
    } catch (error) {
      this.loggingService.error('스타일 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'RenderManager.updateStyle');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 현재 렌더링 설정 조회
   */
  getCurrentRenderConfig(): ICardRenderConfig | null {
    return this.currentRenderConfig;
  }

  /**
   * 현재 카드 스타일 조회
   */
  getCurrentCardStyle(): ICardStyle | null {
    return this.currentCardStyle;
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
      this.loggingService.info('렌더링 캐시 초기화 완료');
    } catch (error) {
      this.loggingService.error('렌더링 캐시 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'RenderManager.clearRenderCache');
      throw error;
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

      if (!this.isInitialized) {
        throw new Error('렌더링 관리자가 초기화되지 않았습니다.');
      }

      // 캐시 삭제
      this.removeCardRenderCache(cardId);

      // 렌더링 이벤트 발생
      this.notifyRenderEvent('cache-update', cardId);

      this.loggingService.info('카드 렌더링 캐시 업데이트 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 렌더링 캐시 업데이트 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'RenderManager.updateCardRenderCache');
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
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