import { ICardRenderManager } from '@/domain/managers/ICardRenderManager';
import { IRenderConfig, IRenderState, DEFAULT_CARD_STYLE, DEFAULT_CARD_DOMAIN_SETTINGS, DEFAULT_CARD_SECTION } from '@/domain/models/Card';
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
import { ISettingsService } from '@/domain/services/application/ISettingsService';
import { TitleSource } from '@/domain/models/Card';

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
    private readonly eventBus: EventBus,
    private readonly settingsService: ISettingsService
  ) {}

  static getInstance(): CardRenderManager {
    if (!CardRenderManager.instance) {
      const container = Container.getInstance();
      CardRenderManager.instance = new CardRenderManager(
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService'),
        container.resolve<EventBus>('EventBus'),
        container.resolve<ISettingsService>('ISettingsService')
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
      
      // 설정 변경 이벤트 구독
      this.eventBus.subscribe(DomainEventType.CARD_SECTION_DISPLAY_CHANGED, (event: DomainEvent<typeof DomainEventType.CARD_SECTION_DISPLAY_CHANGED>) => {
        this.logger.debug('카드 섹션 표시 설정 변경 이벤트 수신', { event });
        // 모든 카드의 렌더링 상태를 PENDING으로 변경
        this.renderStates.forEach((state, cardId) => {
          this.updateRenderState(cardId, {
            status: RenderStatus.PENDING,
            startTime: Date.now(),
            endTime: 0,
            error: null,
            timestamp: Date.now()
          });
        });
      });
      
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
      
      // 설정 서비스에서 설정값 가져오기
      const settings = this.settingsService.getSettings();
      const cardSettings = settings.card || DEFAULT_CARD_DOMAIN_SETTINGS;
      
      const config: IRenderConfig = {
        type: cardSettings.renderConfig.type,
        contentLengthLimitEnabled: cardSettings.renderConfig.contentLengthLimitEnabled,
        contentLengthLimit: cardSettings.renderConfig.contentLengthLimit,
        style: cardSettings.stateStyle.normal,
        sections: {
          header: {
            displayOptions: cardSettings.sections.header.displayOptions
          },
          body: {
            displayOptions: cardSettings.sections.body.displayOptions
          },
          footer: {
            displayOptions: cardSettings.sections.footer.displayOptions
          }
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
        style: DEFAULT_CARD_STYLE,
        sections: {
          header: {
            displayOptions: DEFAULT_CARD_SECTION.displayOptions
          },
          body: {
            displayOptions: DEFAULT_CARD_SECTION.displayOptions
          },
          footer: {
            displayOptions: DEFAULT_CARD_SECTION.displayOptions
          }
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
   * @param container 카드를 렌더링할 컨테이너
   * @returns 렌더링된 카드 요소
   */
  renderCard(card: ICard, container: HTMLElement): HTMLElement {
    const timer = this.performanceMonitor.startTimer('CardRenderManager.renderCard');
    try {
      this.logger.debug('카드 렌더링 시작', { cardId: card.id });

      // 기존 카드 요소 제거
      const existingCard = container.querySelector(`[data-card-id="${card.id}"]`);
      if (existingCard) {
        existingCard.remove();
      }

      // 카드 컨테이너 생성
      const cardEl = document.createElement('div');
      cardEl.className = 'card-navigator-card';
      cardEl.setAttribute('data-card-id', card.id);

      // 설정에서 스타일 가져오기
      const settings = this.settingsService.getSettings();
      const cardSettings = settings.card || DEFAULT_CARD_DOMAIN_SETTINGS;
      const style = cardSettings.stateStyle.normal;

      // 카드 스타일 적용
      Object.assign(cardEl.style, style);

      // 헤더 섹션 생성
      const headerEl = document.createElement('div');
      headerEl.className = 'card-navigator-card-header';

      // 타이틀 생성
      const titleEl = document.createElement('div');
      titleEl.className = 'card-navigator-card-title';
      
      // 설정에서 타이틀 소스 가져오기
      const titleSource = settings.card?.titleSource || TitleSource.FIRST_HEADER;
      const title = titleSource === TitleSource.FIRST_HEADER ? card.firstHeader : card.fileName;
      titleEl.textContent = title || card.fileName.replace(/\.[^/.]+$/, '');

      headerEl.appendChild(titleEl);
      cardEl.appendChild(headerEl);

      // 바디 섹션 생성
      const bodyEl = document.createElement('div');
      bodyEl.className = 'card-navigator-card-body';

      // 컨텐츠 생성
      const contentEl = document.createElement('div');
      contentEl.className = 'card-navigator-card-content';
      contentEl.textContent = card.content;
      bodyEl.appendChild(contentEl);

      // 태그 생성
      if (card.tags && card.tags.length > 0) {
        const tagsEl = document.createElement('div');
        tagsEl.className = 'card-navigator-card-tags';
        tagsEl.textContent = card.tags.join(' ');
        bodyEl.appendChild(tagsEl);
      }

      cardEl.appendChild(bodyEl);

      // 푸터 섹션 생성
      const footerEl = document.createElement('div');
      footerEl.className = 'card-navigator-card-footer';

      // 생성일, 수정일, 프로퍼티 추가
      if (card.createdAt) {
        const createdAtEl = document.createElement('div');
        createdAtEl.className = 'card-navigator-card-created-at';
        createdAtEl.textContent = card.createdAt.toLocaleString();
        footerEl.appendChild(createdAtEl);
      }

      if (card.updatedAt) {
        const updatedAtEl = document.createElement('div');
        updatedAtEl.className = 'card-navigator-card-updated-at';
        updatedAtEl.textContent = card.updatedAt.toLocaleString();
        footerEl.appendChild(updatedAtEl);
      }

      if (card.properties) {
        const propertiesEl = document.createElement('div');
        propertiesEl.className = 'card-navigator-card-properties';
        propertiesEl.textContent = JSON.stringify(card.properties);
        footerEl.appendChild(propertiesEl);
      }

      cardEl.appendChild(footerEl);

      // 컨테이너에 카드 추가
      container.appendChild(cardEl);

      // 렌더링 상태 업데이트
      this.updateRenderState(card.id, {
        status: RenderStatus.COMPLETED,
        endTime: Date.now(),
        timestamp: Date.now()
      });

      this.logger.info('카드 렌더링 완료', { cardId: card.id });
      return cardEl;
    } catch (error) {
      this.logger.error('카드 렌더링 실패', { error, cardId: card.id });
      this.errorHandler.handleError(error as Error, 'CardRenderManager.renderCard');
      
      // 에러 상태 업데이트
      this.updateRenderState(card.id, {
        status: RenderStatus.FAILED,
        endTime: Date.now(),
        error: (error as Error).message,
        timestamp: Date.now()
      });

      // 에러 요소 반환
      const errorEl = document.createElement('div');
      errorEl.className = 'card-navigator-card-error';
      errorEl.textContent = '카드 렌더링 중 오류가 발생했습니다.';
      return errorEl;
    } finally {
      timer.stop();
    }
  }
} 