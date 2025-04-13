import { ICardRenderManager } from '@/domain/managers/ICardRenderManager';
import { IRenderConfig, IRenderState } from '@/domain/models/Card';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { RenderType, RenderStatus } from '@/domain/models/Card';
import { ICard } from '@/domain/models/Card';
import { EventBus } from '@/domain/events/EventBus';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { DomainEvent } from '@/domain/events/DomainEvent';

/**
 * 카드 렌더링 관리자 구현체
 */
export class CardRenderManager implements ICardRenderManager {
  private static instance: CardRenderManager;
  private initialized: boolean = false;
  private renderStates: Map<string, IRenderState> = new Map();
  private renderResources: Map<string, any> = new Map();

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly logger: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventBus: EventBus
  ) {}

  static getInstance(): CardRenderManager {
    if (!CardRenderManager.instance) {
      const container = Container.getInstance();
      CardRenderManager.instance = new CardRenderManager(
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService'),
        container.resolve<EventBus>('EventBus')
      );
    }
    return CardRenderManager.instance;
  }

  initialize(): void {
    const timer = this.performanceMonitor.startTimer('CardRenderManager.initialize');
    try {
      this.logger.debug('카드 렌더링 관리자 초기화 시작');
      
      // 렌더링 상태 초기화
      this.renderStates.clear();
      this.renderResources.clear();
      
      // 초기화 완료
      this.initialized = true;
      
      this.logger.info('카드 렌더링 관리자 초기화 완료');
    } catch (error) {
      this.logger.error('카드 렌더링 관리자 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardRenderManager.initialize');
    } finally {
      timer.stop();
    }
  }

  cleanup(): void {
    const timer = this.performanceMonitor.startTimer('CardRenderManager.cleanup');
    try {
      this.renderStates.clear();
      this.renderResources.clear();
      this.initialized = false;
      this.logger.debug('카드 렌더링 관리자 정리 완료');
    } catch (error) {
      this.logger.error('카드 렌더링 관리자 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardRenderManager.cleanup');
    } finally {
      timer.stop();
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  registerRenderState(cardId: string, state: IRenderState): void {
    const timer = this.performanceMonitor.startTimer('CardRenderManager.registerRenderState');
    try {
      this.logger.debug('렌더링 상태 등록 시작', { cardId });
      this.renderStates.set(cardId, state);
      this.logger.info('렌더링 상태 등록 완료', { cardId });
    } catch (error) {
      this.logger.error('렌더링 상태 등록 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardRenderManager.registerRenderState');
    } finally {
      timer.stop();
    }
  }

  unregisterRenderState(cardId: string): void {
    const timer = this.performanceMonitor.startTimer('CardRenderManager.unregisterRenderState');
    try {
      this.logger.debug('렌더링 상태 등록 해제 시작', { cardId });
      this.renderStates.delete(cardId);
      this.logger.info('렌더링 상태 등록 해제 완료', { cardId });
    } catch (error) {
      this.logger.error('렌더링 상태 등록 해제 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardRenderManager.unregisterRenderState');
    } finally {
      timer.stop();
    }
  }

  getRenderState(cardId: string): IRenderState | null {
    const timer = this.performanceMonitor.startTimer('CardRenderManager.getRenderState');
    try {
      this.logger.debug('렌더링 상태 조회 시작', { cardId });
      const state = this.renderStates.get(cardId) || null;
      this.logger.info('렌더링 상태 조회 완료', { cardId });
      return state;
    } catch (error) {
      this.logger.error('렌더링 상태 조회 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardRenderManager.getRenderState');
      return null;
    } finally {
      timer.stop();
    }
  }

  updateRenderState(cardId: string, state: Partial<IRenderState>): void {
    const timer = this.performanceMonitor.startTimer('CardRenderManager.updateRenderState');
    try {
      this.logger.debug('렌더링 상태 업데이트 시작', { cardId });
      const currentState = this.renderStates.get(cardId);
      if (currentState) {
        this.renderStates.set(cardId, { ...currentState, ...state });
      }
      this.logger.info('렌더링 상태 업데이트 완료', { cardId });
    } catch (error) {
      this.logger.error('렌더링 상태 업데이트 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardRenderManager.updateRenderState');
    } finally {
      timer.stop();
    }
  }

  subscribeToRenderEvents(callback: (event: {
    type: 'render' | 'cache-update';
    cardId?: string;
    data?: {
      status: string;
      config?: IRenderConfig;
      error?: string;
    };
  }) => void): void {
    this.eventBus.subscribe(DomainEventType.CARD_RENDERING, (event: DomainEvent<typeof DomainEventType.CARD_RENDERING>) => {
      callback({
        type: 'render',
        cardId: event.data.card.id,
        data: {
          status: 'completed'
        }
      });
    });
  }

  unsubscribeFromRenderEvents(callback: (event: any) => void): void {
    this.eventBus.unsubscribe(DomainEventType.CARD_RENDERING, callback);
  }

  registerRenderResource(cardId: string, resource: any): void {
    const timer = this.performanceMonitor.startTimer('CardRenderManager.registerRenderResource');
    try {
      this.logger.debug('렌더링 리소스 등록 시작', { cardId });
      this.renderResources.set(cardId, resource);
      this.logger.info('렌더링 리소스 등록 완료', { cardId });
    } catch (error) {
      this.logger.error('렌더링 리소스 등록 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardRenderManager.registerRenderResource');
    } finally {
      timer.stop();
    }
  }

  unregisterRenderResource(cardId: string): void {
    const timer = this.performanceMonitor.startTimer('CardRenderManager.unregisterRenderResource');
    try {
      this.logger.debug('렌더링 리소스 등록 해제 시작', { cardId });
      this.renderResources.delete(cardId);
      this.logger.info('렌더링 리소스 등록 해제 완료', { cardId });
    } catch (error) {
      this.logger.error('렌더링 리소스 등록 해제 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardRenderManager.unregisterRenderResource');
    } finally {
      timer.stop();
    }
  }

  getRenderResource(cardId: string): any | null {
    const timer = this.performanceMonitor.startTimer('CardRenderManager.getRenderResource');
    try {
      this.logger.debug('렌더링 리소스 조회 시작', { cardId });
      const resource = this.renderResources.get(cardId) || null;
      this.logger.info('렌더링 리소스 조회 완료', { cardId });
      return resource;
    } catch (error) {
      this.logger.error('렌더링 리소스 조회 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardRenderManager.getRenderResource');
      return null;
    } finally {
      timer.stop();
    }
  }

  /**
   * 렌더링 설정을 가져옵니다.
   * @returns 렌더링 설정
   */
  getRenderConfig(): IRenderConfig {
    const timer = this.performanceMonitor.startTimer('getRenderConfig');
    try {
      this.logger.debug('렌더링 설정 가져오기 시작');
      
      const config: IRenderConfig = {
        type: RenderType.MARKDOWN,
        contentLengthLimitEnabled: true,
        contentLengthLimit: 1000, // 기본값 1000자
        style: {
          classes: ['card'],
          backgroundColor: 'var(--background-primary)',
          fontSize: 'var(--font-size-normal)',
          color: 'var(--text-normal)',
          border: {
            width: '1px',
            color: 'var(--background-modifier-border)',
            style: 'solid',
            radius: '8px'
          },
          padding: 'var(--size-4-2)',
          boxShadow: 'var(--shadow-s)',
          lineHeight: 'var(--line-height-normal)',
          fontFamily: 'var(--font-family)'
        },
        state: {
          status: RenderStatus.PENDING,
          startTime: Date.now(),
          endTime: 0,
          error: null,
          timestamp: Date.now()
        }
      };
      
      this.logger.debug('렌더링 설정 가져오기 완료', { config });
      return config;
    } catch (error) {
      this.logger.error('렌더링 설정 가져오기 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardRenderManager.getRenderConfig');
      return {
        type: RenderType.MARKDOWN,
        contentLengthLimitEnabled: false,
        contentLengthLimit: 0,
        style: {
          classes: [],
          backgroundColor: '',
          fontSize: '',
          color: '',
          border: {
            width: '',
            color: '',
            style: '',
            radius: ''
          },
          padding: '',
          boxShadow: '',
          lineHeight: '',
          fontFamily: ''
        },
        state: {
          status: RenderStatus.PENDING,
          startTime: 0,
          endTime: 0,
          error: null,
          timestamp: Date.now()
        }
      };
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드를 렌더링합니다.
   * @param card 렌더링할 카드
   * @returns 렌더링된 HTML 요소
   */
  renderCard(card: ICard): HTMLElement {
    const timer = this.performanceMonitor.startTimer('CardRenderManager.renderCard');
    const startTime = Date.now();
    try {
      this.logger.debug('카드 렌더링 시작', { cardId: card.id });

      // 렌더링 설정 가져오기
      const config = this.getRenderConfig();

      // 카드 요소 생성
      const cardEl = document.createElement('div');
      cardEl.className = 'card-navigator-card';
      cardEl.setAttribute('data-card-id', card.id);

      // 스타일 적용
      const style = config.style;
      cardEl.style.backgroundColor = style.backgroundColor;
      cardEl.style.fontSize = style.fontSize;
      cardEl.style.color = style.color;
      cardEl.style.borderWidth = style.border.width;
      cardEl.style.borderColor = style.border.color;
      cardEl.style.borderStyle = style.border.style;
      cardEl.style.borderRadius = style.border.radius;
      cardEl.style.padding = style.padding;
      cardEl.style.boxShadow = style.boxShadow;
      cardEl.style.lineHeight = style.lineHeight;
      cardEl.style.fontFamily = style.fontFamily;

      // 헤더
      const headerEl = document.createElement('div');
      headerEl.className = 'card-navigator-card-header';
      headerEl.textContent = card.firstHeader || card.title || card.fileName || '제목 없음';
      cardEl.appendChild(headerEl);

      // 바디
      const bodyEl = document.createElement('div');
      bodyEl.className = 'card-navigator-card-body';
      bodyEl.textContent = card.content || '내용 없음';
      cardEl.appendChild(bodyEl);

      // 풋터
      const footerEl = document.createElement('div');
      footerEl.className = 'card-navigator-card-footer';
      footerEl.textContent = card.tags && card.tags.length > 0 ? card.tags.join(', ') : '태그 없음';
      cardEl.appendChild(footerEl);

      // 렌더링 상태 등록
      this.registerRenderState(card.id, {
        status: RenderStatus.COMPLETED,
        startTime: startTime,
        endTime: Date.now(),
        error: null,
        timestamp: Date.now()
      });

      // 렌더링 이벤트 발생
      this.eventBus.dispatch(new DomainEvent(DomainEventType.CARD_RENDERING, { card }));

      this.logger.info('카드 렌더링 완료', { cardId: card.id });
      return cardEl;
    } catch (error) {
      this.logger.error('카드 렌더링 실패', { error, cardId: card.id });
      this.errorHandler.handleError(error as Error, 'CardRenderManager.renderCard');
      throw error;
    } finally {
      timer.stop();
    }
  }
} 