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
      const container = Container.getInstance();
      const app = container.resolve<App>('App');
      const eventDispatcher = container.resolve<IEventDispatcher>('IEventDispatcher');
      const loggingService = container.resolve<ILoggingService>('ILoggingService');
      const performanceMonitor = container.resolve<IPerformanceMonitor>('IPerformanceMonitor');
      const errorHandler = container.resolve<IErrorHandler>('IErrorHandler');

      RenderManager.instance = new RenderManager(
        app,
        eventDispatcher,
        loggingService,
        performanceMonitor,
        errorHandler
      );
      
      // 인스턴스 생성 시 자동으로 초기화
      RenderManager.instance.initialize();
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
      // 이미 초기화되었는지 확인
      if (this.isInitialized) {
        this.loggingService.debug('렌더링 관리자가 이미 초기화되어 있습니다. 초기화 작업을 건너뜁니다.');
        return;
      }
      
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
      // 입력 유효성 검사
      if (!card || !card.id) {
        this.loggingService.error('잘못된 카드 객체', { card });
        return '<div class="card-error">잘못된 카드</div>';
      }
    
      // 성능 최적화: 캐시 키 생성은 한 번만 수행
      const cacheKey = this.generateCacheKey(card.id, config, style);
      
      // 캐시된 결과가 있는지 확인
      if (this.renderCache.has(cacheKey)) {
        this.loggingService.debug('캐시된 카드 렌더링 결과 사용', { cardId: card.id });
        const cachedResult = this.renderCache.get(cacheKey);
        this.performanceMonitor.endMeasure(perfMark);
        return cachedResult || '';
      }

      this.loggingService.debug('카드 렌더링 시작', { cardId: card.id });

      if (!this.isInitialized) {
        // 필요시 초기화 자동 수행
        this.initialize();
      }

      // 이미 렌더링 중인 경우 대기
      if (this.renderingCards.has(card.id)) {
        this.loggingService.debug('이미 렌더링 중인 카드입니다. 캐시된 결과를 기다립니다.', { cardId: card.id });
        
        // 최대 100ms 동안 캐시 결과를 기다립니다
        let waited = 0;
        while (waited < 100 && !this.renderCache.has(cacheKey) && this.renderingCards.has(card.id)) {
          await new Promise(resolve => setTimeout(resolve, 10));
          waited += 10;
        }
        
        // 캐시 결과가 생겼는지 다시 확인
        if (this.renderCache.has(cacheKey)) {
          this.loggingService.debug('렌더링 완료된 결과를 사용합니다', { cardId: card.id, waitedMs: waited });
          const cachedResult = this.renderCache.get(cacheKey);
          this.performanceMonitor.endMeasure(perfMark);
          return cachedResult || '';
        }
      }

      // 렌더링 중 상태 설정
      this.renderingCards.add(card.id);

      try {
        // 카드가 이미 등록되어 있는지 확인
        if (!this.cards.has(card.id)) {
          this.loggingService.debug('카드가 등록되지 않음. 자동 등록', { cardId: card.id });
          this.cards.set(card.id, card);
        }
        
        try {
          // 빈 카드 체크 - 최적화
          if (!card.content && !card.fileName && !card.firstHeader) {
            const emptyCardHtml = `<div class="card-empty">빈 카드</div>`;
            this.renderCache.set(cacheKey, emptyCardHtml);
            return emptyCardHtml;
          }
        
          // RenderUtils를 사용하여 카드 렌더링 - 성능을 위해 병렬 처리
          const [header, body, footer] = await Promise.all([
            Promise.resolve(RenderUtils.renderCardHeader(card, config)),
            RenderUtils.renderCardBody(card, config),
            Promise.resolve(RenderUtils.renderCardFooter(card, config))
          ]);

          // 렌더링된 내용 조합
          const renderedContent = [header, body, footer].filter(Boolean).join('\n');

          // 캐시 저장
          this.renderCache.set(cacheKey, renderedContent);
          
          // 로그 레벨 변경: info -> debug로 변경하여 중복 로깅 줄임
          this.loggingService.debug('카드 렌더링 완료', { cardId: card.id });
          return renderedContent;
        } catch (renderError) {
          // 렌더링 실패 시 에러 카드 반환
          const errorHtml = `<div class="card-error">렌더링 실패: ${renderError.message}</div>`;
          this.loggingService.error('카드 내용 렌더링 실패', { 
            error: renderError, 
            cardId: card.id 
          });
          
          // 에러 상태도 캐싱 (동일한 에러 반복 방지)
          this.renderCache.set(cacheKey, errorHtml);
          return errorHtml;
        }
      } finally {
        // 항상 렌더링 중 상태를 해제
        this.renderingCards.delete(card.id);
      }
    } catch (error) {
      this.loggingService.error('카드 렌더링 실패', { error, cardId: card?.id });
      this.errorHandler.handleError(error as Error, 'RenderManager.renderCard');
      // 마지막 에러 처리 - 항상 무언가를 반환해야 함
      return `<div class="card-error">오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}</div>`;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 캐시 키 생성
   * 카드 ID, 렌더링 설정, 스타일을 고려한 고유 키 생성
   */
  private generateCacheKey(cardId: string, config: ICardRenderConfig, style: ICardStyle): string {
    // 카드 ID, 업데이트 시간, 렌더링 설정, 스타일을 고려한 캐시 키 생성
    // 카드 내용이 변경되면 업데이트 시간이 변경되므로 캐시도 갱신됨
    const card = this.cards.get(cardId);
    const updatedAt = card?.updatedAt?.getTime() || Date.now();
    
    // 헤더, 바디, 푸터 표시 여부 및 렌더링 방식을 포함
    const configKey = [
      config.type,
      config.renderMarkdown ? '1' : '0',
      config.showHeader ? '1' : '0',
      config.showBody ? '1' : '0',
      config.showFooter ? '1' : '0',
      config.contentLengthLimitEnabled ? `limit:${config.contentLengthLimit}` : 'nolimit',
      config.showImages ? '1' : '0',
      config.highlightCode ? '1' : '0'
    ].join('.');
    
    // 섹션별 표시 설정 포함
    const headerDisplayKey = this.getDisplayConfigKey(config.headerDisplay);
    const bodyDisplayKey = this.getDisplayConfigKey(config.bodyDisplay);
    const footerDisplayKey = this.getDisplayConfigKey(config.footerDisplay);
    
    // 스타일 변경에 따른 캐시키 요소 계산 - 모든 주요 스타일 속성 포함
    const styleKey = [
      // 일반 카드 스타일
      this.getStyleKey(style.card),
      // 활성 카드 스타일
      this.getStyleKey(style.activeCard),
      // 포커스된 카드 스타일
      this.getStyleKey(style.focusedCard),
      // 헤더 스타일
      this.getStyleKey(style.header),
      // 본문 스타일
      this.getStyleKey(style.body),
      // 푸터 스타일 
      this.getStyleKey(style.footer)
    ].join(':');
    
    // 현재 시간을 추가하여 개발 모드에서의 테스트를 쉽게 함
    // (10초마다 캐시 갱신, 개발 중에는 주석 해제, 배포 시에는 주석 처리)
    // const devTimestamp = Math.floor(Date.now() / 10000);
    
    return `${cardId}:${updatedAt}:${configKey}:${headerDisplayKey}:${bodyDisplayKey}:${footerDisplayKey}:${styleKey}`;
  }
  
  /**
   * 스타일 속성에서 캐시 키 생성
   */
  private getStyleKey(style: any): string {
    return [
      style.backgroundColor,
      style.fontSize,
      style.borderColor,
      style.borderWidth
    ].join('-');
  }
  
  /**
   * 섹션 표시 설정에서 캐시 키 생성
   */
  private getDisplayConfigKey(display: any): string {
    return [
      display.showFileName ? '1' : '0',
      display.showFirstHeader ? '1' : '0',
      display.showContent ? '1' : '0',
      display.showTags ? '1' : '0',
      display.showCreatedDate ? '1' : '0',
      display.showUpdatedDate ? '1' : '0',
      display.showProperties?.length > 0 ? '1' : '0'
    ].join('.');
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

      // 이전 설정과 비교하여 변경된 부분 식별
      const prevConfig = this.currentRenderConfig;
      
      // 선택적 캐시 초기화
      if (prevConfig) {
        // 전체 레이아웃이나 중요 설정이 변경된 경우만 전체 캐시 초기화
        if (config.type !== prevConfig.type || 
            config.renderMarkdown !== prevConfig.renderMarkdown ||
            config.showHeader !== prevConfig.showHeader ||
            config.showBody !== prevConfig.showBody ||
            config.showFooter !== prevConfig.showFooter) {
          this.loggingService.debug('주요 렌더링 설정 변경으로 전체 캐시 초기화');
          this.clearRenderCache();
        } else {
          // 세부 설정만 변경된 경우 관련 캐시만 선택적으로 제거
          this.loggingService.debug('세부 렌더링 설정 변경으로 선택적 캐시 초기화');
          this.selectiveClearCache('config', config, prevConfig);
        }
      } else {
        // 이전 설정이 없는 경우 전체 캐시 초기화
        this.clearRenderCache();
      }
      
      // 현재 설정 업데이트
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

      // 이전 스타일과 비교하여 변경된 부분 식별
      const prevStyle = this.currentCardStyle;
      
      // 선택적 캐시 초기화
      if (prevStyle) {
        // 변경된 스타일에 따른 선택적 캐시 초기화
        this.loggingService.debug('스타일 변경으로 선택적 캐시 초기화');
        this.selectiveClearCache('style', style, prevStyle);
      } else {
        // 이전 스타일이 없는 경우 전체 캐시 초기화
        this.clearRenderCache();
      }
      
      // 현재 스타일 업데이트
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
   * 선택적 캐시 초기화
   * @param type 업데이트 유형 ('config' | 'style')
   * @param newValue 새 값
   * @param oldValue 이전 값
   */
  private selectiveClearCache(type: 'config' | 'style', newValue: any, oldValue: any): void {
    try {
      // 캐시 키 추출
      const cacheKeys = Array.from(this.renderCache.keys());
      let invalidatedCount = 0;
      
      if (type === 'config') {
        // 특정 섹션의 설정 변경 시 해당 섹션이 포함된 캐시만 초기화
        const newConfig = newValue as ICardRenderConfig;
        const oldConfig = oldValue as ICardRenderConfig;
        
        // 헤더 설정 변경 확인
        const headerChanged = this.isDisplayConfigChanged(newConfig.headerDisplay, oldConfig.headerDisplay);
        
        // 본문 설정 변경 확인
        const bodyChanged = this.isDisplayConfigChanged(newConfig.bodyDisplay, oldConfig.bodyDisplay) || 
                         (newConfig.contentLengthLimitEnabled !== oldConfig.contentLengthLimitEnabled) ||
                         (newConfig.contentLengthLimit !== oldConfig.contentLengthLimit);
                         
        // 푸터 설정 변경 확인
        const footerChanged = this.isDisplayConfigChanged(newConfig.footerDisplay, oldConfig.footerDisplay);
        
        // 미디어 설정 변경 확인 (이미지, 코드 등)
        const mediaChanged = newConfig.showImages !== oldConfig.showImages ||
                           newConfig.highlightCode !== oldConfig.highlightCode ||
                           newConfig.supportCallouts !== oldConfig.supportCallouts ||
                           newConfig.supportMath !== oldConfig.supportMath;
        
        // 변경된 부분에 따른 캐시 초기화
        cacheKeys.forEach(key => {
          let shouldInvalidate = false;
          
          // 헤더 관련 캐시 초기화
          if (headerChanged && key.includes(':header:')) {
            shouldInvalidate = true;
          }
          
          // 본문 관련 캐시 초기화 
          if (bodyChanged && key.includes(':body:')) {
            shouldInvalidate = true;
          }
          
          // 푸터 관련 캐시 초기화
          if (footerChanged && key.includes(':footer:')) {
            shouldInvalidate = true;
          }
          
          // 미디어 관련 캐시 초기화
          if (mediaChanged && (key.includes('image') || key.includes('code'))) {
            shouldInvalidate = true;
          }
          
          if (shouldInvalidate) {
            this.renderCache.delete(key);
            invalidatedCount++;
          }
        });
      } else if (type === 'style') {
        // 스타일 변경 시 관련 스타일이 포함된 캐시만 초기화
        const newStyle = newValue as ICardStyle;
        const oldStyle = oldValue as ICardStyle;
        
        // 각 스타일 컴포넌트 변경 확인
        const cardStyleChanged = this.isStyleChanged(newStyle.card, oldStyle.card);
        const activeCardStyleChanged = this.isStyleChanged(newStyle.activeCard, oldStyle.activeCard);
        const focusedCardStyleChanged = this.isStyleChanged(newStyle.focusedCard, oldStyle.focusedCard);
        const headerStyleChanged = this.isStyleChanged(newStyle.header, oldStyle.header);
        const bodyStyleChanged = this.isStyleChanged(newStyle.body, oldStyle.body);
        const footerStyleChanged = this.isStyleChanged(newStyle.footer, oldStyle.footer);
        
        // 변경된 스타일에 따른 캐시 초기화
        cacheKeys.forEach(key => {
          let shouldInvalidate = false;
          
          // 일반 카드 스타일 변경
          if (cardStyleChanged && key.includes(':card:')) {
            shouldInvalidate = true;
          }
          
          // 활성 카드 스타일 변경
          if (activeCardStyleChanged && key.includes(':activeCard:')) {
            shouldInvalidate = true;
          }
          
          // 포커스 카드 스타일 변경
          if (focusedCardStyleChanged && key.includes(':focusedCard:')) {
            shouldInvalidate = true;
          }
          
          // 헤더 스타일 변경
          if (headerStyleChanged && key.includes(':header:')) {
            shouldInvalidate = true;
          }
          
          // 본문 스타일 변경
          if (bodyStyleChanged && key.includes(':body:')) {
            shouldInvalidate = true;
          }
          
          // 푸터 스타일 변경
          if (footerStyleChanged && key.includes(':footer:')) {
            shouldInvalidate = true;
          }
          
          if (shouldInvalidate) {
            this.renderCache.delete(key);
            invalidatedCount++;
          }
        });
      }
      
      this.loggingService.debug(`선택적 캐시 초기화 완료: ${invalidatedCount}개 캐시 항목 초기화`);
      this.notifyRenderEvent('cache-update');
    } catch (error) {
      this.loggingService.error('선택적 캐시 초기화 실패', { error });
      // 오류 발생 시 안전하게 전체 캐시 초기화
      this.clearRenderCache();
    }
  }
  
  /**
   * 두 스타일 객체 간의 차이 확인
   */
  private isStyleChanged(newStyle: any, oldStyle: any): boolean {
    if (!newStyle || !oldStyle) return true;
    
    return newStyle.backgroundColor !== oldStyle.backgroundColor ||
           newStyle.fontSize !== oldStyle.fontSize ||
           newStyle.borderColor !== oldStyle.borderColor ||
           newStyle.borderWidth !== oldStyle.borderWidth;
  }
  
  /**
   * 두 표시 설정 객체 간의 차이 확인
   */
  private isDisplayConfigChanged(newConfig: any, oldConfig: any): boolean {
    if (!newConfig || !oldConfig) return true;
    
    return newConfig.showFileName !== oldConfig.showFileName ||
           newConfig.showFirstHeader !== oldConfig.showFirstHeader ||
           newConfig.showContent !== oldConfig.showContent ||
           newConfig.showTags !== oldConfig.showTags ||
           newConfig.showCreatedDate !== oldConfig.showCreatedDate ||
           newConfig.showUpdatedDate !== oldConfig.showUpdatedDate ||
           this.isArrayDifferent(newConfig.showProperties, oldConfig.showProperties);
  }
  
  /**
   * 두 배열 간의 차이 확인
   */
  private isArrayDifferent(arr1: any[], arr2: any[]): boolean {
    if (!arr1 || !arr2) return true;
    if (arr1.length !== arr2.length) return true;
    
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return true;
    }
    
    return false;
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