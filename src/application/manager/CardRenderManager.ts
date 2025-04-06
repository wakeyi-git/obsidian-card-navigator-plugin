import { ICardRenderer } from '../../domain/renderders/ICardRenderer';
import { ICard } from '../../domain/models/Card';
import { ILoggingService } from '../../domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '../../domain/infrastructure/IPerformanceMonitor';
import { ISettingsService } from '../../domain/services/ISettingsService';
import { App } from 'obsidian';
import { ICardConfig, IRenderConfig, RenderType } from '../../domain/models/CardConfig';
import { ICardStyle } from '../../domain/models/CardStyle';
import { Container } from '../../infrastructure/di/Container';
import { IErrorHandler } from '../../domain/infrastructure/IErrorHandler';
import { IAnalyticsService } from '../../domain/infrastructure/IAnalyticsService';
import { CardServiceError } from '../../domain/errors/CardServiceError';
import { CustomMarkdownRenderer } from '../../domain/utils/markdownRenderer';
import { IEventDispatcher } from '../../domain/infrastructure/IEventDispatcher';
import { DEFAULT_CARD_CONFIG } from '../../domain/models/CardConfig';
import { DEFAULT_CARD_STYLE } from '../../domain/models/CardStyle';
import { CardService } from '../services/CardService';

/**
 * 렌더링 작업의 상태를 나타내는 타입
 */
type RenderTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 렌더링 작업을 나타내는 인터페이스
 */
interface IRenderTask {
  cardId: string;
  card: ICard;
  status: RenderTaskStatus;
  timestamp: number;
  promise?: Promise<string>;
  result?: string;
  error?: Error;
}

/**
 * 카드 렌더링을 담당하는 클래스
 */
export class CardRenderManager implements ICardRenderer {
  private static instance: CardRenderManager | null = null;
  private initialized: boolean = false;
  
  // 카드 상태 관리
  private cards: Map<string, ICard>;
  
  // 작업 큐 및 캐시
  private renderQueue: Map<string, IRenderTask>;
  private renderCache: Map<string, { content: string; timestamp: number }>;
  private activeRenderTasks: Set<string>;
  private renderingCards: Map<string, Promise<string>>;
  
  // 렌더링 설정 및 스타일
  private currentRenderConfig: IRenderConfig;
  private currentCardConfig: ICardConfig;
  private currentCardStyle: ICardStyle | null;
  
  // 작업 관리
  private renderEventSubscribers: Set<(event: {
    type: 'render' | 'cache-update';
    cardId?: string;
    data?: any;
  }) => void>;
  private _renderTimestamps: Map<string, number>;
  private _renderPromises: Map<string, Promise<string>> | null;
  
  // 작업 제한 설정
  private readonly MAX_CONCURRENT_RENDERS = 5;
  private readonly CACHE_EXPIRY_MS = 3600000; // 1시간
  private isProcessingQueue = false;
  private lastJobId = 0;
  
  private markdownRenderer: CustomMarkdownRenderer;
  private app: App;
  private eventDispatcher: IEventDispatcher;
  private settingsService: ISettingsService;
  private cardService: CardService;
  private intervals: number[] = [];

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly logger: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {
    // 상태 초기화
    this.cards = new Map();
    this.renderQueue = new Map();
    this.renderCache = new Map();
    this.activeRenderTasks = new Set();
    this.renderingCards = new Map();
    this.renderEventSubscribers = new Set();
    this._renderTimestamps = new Map();
    this._renderPromises = new Map();
    
    // 기본 설정
    this.currentRenderConfig = {
      type: RenderType.HTML,
      showImages: true,
      highlightCode: true,
      supportCallouts: true,
      supportMath: true,
      contentLengthLimitEnabled: false,
      contentLengthLimit: 0
    };
    this.currentCardConfig = DEFAULT_CARD_CONFIG;
    this.currentCardStyle = DEFAULT_CARD_STYLE;
    
    // 의존성 주입
    const container = Container.getInstance();
    this.app = container.resolve<App>('App');
    this.eventDispatcher = container.resolve<IEventDispatcher>('IEventDispatcher');
    this.settingsService = container.resolve<ISettingsService>('ISettingsService');
    this.cardService = CardService.getInstance();
    this.markdownRenderer = CustomMarkdownRenderer.getInstance(this.app);
    
    this.logger.debug('CardRenderManager 인스턴스 생성됨');
  }

  public static getInstance(): CardRenderManager {
    if (!CardRenderManager.instance) {
      const container = Container.getInstance();
      CardRenderManager.instance = new CardRenderManager(
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService')
      );
    }
    return CardRenderManager.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    if (this.initialized) return;
    this.markdownRenderer.initialize();
    this.initialized = true;
  }

  /**
   * 리소스 정리
   */
  cleanup(): void {
    this.markdownRenderer.cleanup();
    this.initialized = false;
  }

  /**
   * 카드 렌더링
   * @param card 카드
   * @param config 렌더링 설정
   * @param style 스타일
   */
  async render(card: ICard, config: ICardConfig, style: ICardStyle): Promise<string> {
    return this.requestRender(card.id, card);
  }

  /**
   * 마크다운 렌더링
   * @param markdown 마크다운 텍스트
   * @param config 렌더링 설정
   */
  async renderMarkdown(markdown: string, config: ICardConfig): Promise<string> {
    return this.markdownRenderer.render(markdown, {
      showImages: config.showImages,
      highlightCode: config.highlightCode,
      supportCallouts: config.supportCallouts,
      supportMath: config.supportMath
    });
  }

  /**
   * 카드 렌더링 요청
   * @param cardId 카드 ID
   * @param card 카드
   * @param renderConfig 렌더링 설정 (선택 사항)
   * @param cardStyle 카드 스타일 (선택 사항)
   */
  async requestRender(
    cardId: string,
    card: ICard,
    renderConfig?: ICardConfig,
    cardStyle?: ICardStyle
  ): Promise<string> {
    const timer = this.performanceMonitor.startTimer(`CardRenderManager.requestRender.${cardId}`);

    try {
      this.logger.debug('카드 렌더링 요청', { cardId });

      // 렌더링 설정과 스타일 업데이트
      if (renderConfig) {
        this.currentRenderConfig = {
          type: renderConfig.renderType === 'html' ? RenderType.HTML : RenderType.TEXT,
          showImages: renderConfig.showImages,
          highlightCode: renderConfig.highlightCode,
          supportCallouts: renderConfig.supportCallouts,
          supportMath: renderConfig.supportMath,
          contentLengthLimitEnabled: false,
          contentLengthLimit: 0
        };
        this.currentCardConfig = renderConfig;
      }
      if (cardStyle) {
        this.currentCardStyle = cardStyle;
      }

      // 카드 상태 업데이트
      this.cards.set(cardId, card);

      // 렌더링 작업 생성
      const task: IRenderTask = {
        cardId,
        card,
        status: 'pending',
        timestamp: Date.now()
      };

      // 작업 큐에 추가
      this.renderQueue.set(cardId, task);

      // 렌더링 큐 처리 시작
      this.processRenderQueue();

      // 렌더링 완료 대기
      const result = await this.waitForRenderCompletion(cardId);
      return result;
    } catch (error) {
      this.logger.error('카드 렌더링 요청 실패', { cardId, error });
      this.errorHandler.handleError(error as Error, 'CardRenderManager.requestRender');
      throw new CardServiceError(
        '카드 렌더링 요청 중 오류가 발생했습니다.',
        cardId,
        undefined,
        'requestRender',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 렌더링 완료 대기
   * @param cardId 카드 ID
   */
  private async waitForRenderCompletion(cardId: string): Promise<string> {
    const task = this.renderQueue.get(cardId);
    if (!task) {
      throw new CardServiceError('렌더링 작업을 찾을 수 없습니다.', cardId);
    }

    while (task.status === 'pending' || task.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (task.status === 'failed') {
      throw task.error || new CardServiceError('렌더링 실패', cardId);
    }

    return task.result || '';
  }

  /**
   * 렌더링 큐 처리
   * @returns 처리 완료 Promise
   */
  private async processRenderQueue(): Promise<void> {
    // 이미 처리 중이면 종료
    if (this.isProcessingQueue) return;
    
    try {
      this.isProcessingQueue = true;
      
      // 처리할 작업이 없을 때까지 반복
      while (this.getPendingTasks().length > 0) {
        // 동시 렌더링 제한에 도달했는지 확인
        if (this.activeRenderTasks.size >= this.MAX_CONCURRENT_RENDERS) {
          await this.waitForActiveTasks();
          continue;
        }
        
        // 다음 작업 가져오기
        const nextTasks = this.getPendingTasks()
          .slice(0, this.MAX_CONCURRENT_RENDERS - this.activeRenderTasks.size);
        
        // 작업 병렬 처리
        await Promise.all(nextTasks.map(task => this.processRenderTask(task)));
      }
    } catch (error) {
      this.logger.error('렌더링 큐 처리 중 오류 발생', { error });
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * 대기 중인 작업 목록 가져오기
   * @returns 대기 중인 작업 배열
   */
  private getPendingTasks(): IRenderTask[] {
    return Array.from(this.renderQueue.values())
      .filter(task => task.status === 'pending')
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 활성 작업 완료 대기
   * @returns 대기 완료 Promise
   */
  private waitForActiveTasks(): Promise<void> {
    if (this.activeRenderTasks.size === 0) {
      return Promise.resolve();
    }
    
    return new Promise<void>(resolve => {
      const checkInterval = setInterval(() => {
        if (this.activeRenderTasks.size < this.MAX_CONCURRENT_RENDERS) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    });
  }

  /**
   * 개별 렌더링 작업 처리
   * @param task 렌더링 작업
   * @returns 처리 완료 Promise
   */
  private async processRenderTask(task: IRenderTask): Promise<void> {
    const { cardId, card } = task;
    const timer = this.performanceMonitor.startTimer(`CardRenderManager.processRenderTask.${cardId}`);
    
    // 작업 상태 업데이트
    task.status = 'processing';
    this.renderQueue.set(cardId, task);
    this.activeRenderTasks.add(cardId);
    
    try {
      this.logger.debug('카드 렌더링 시작', { cardId });
      
      // 실제 렌더링 수행
      const finalConfig = this.currentRenderConfig;
      const finalStyle = this.currentCardStyle || DEFAULT_CARD_STYLE;
      
      // 캐시 키 생성
      const cacheKey = this.getCacheKey(cardId, finalConfig, finalStyle);
      
      // 마크다운 렌더링 여부에 따라 다른 처리
      let renderedHtml: string;
      
      if (finalConfig.type !== RenderType.HTML) {
        // 일반 텍스트 렌더링
        renderedHtml = this.renderPlainTextCard(card, finalConfig, finalStyle);
      } else {
        try {
          // 마크다운 렌더링
          renderedHtml = await this.renderMarkdownCard(card, finalConfig, finalStyle);
        } catch (renderError) {
          // 마크다운 렌더링 실패 시 일반 텍스트로 대체
          this.logger.error('마크다운 렌더링 실패, 일반 텍스트로 대체', { 
            renderError, 
            cardId 
          });
          renderedHtml = this.renderPlainTextCard(card, finalConfig, finalStyle);
        }
      }
      
      // 결과 캐싱 및 작업 완료 처리
      this.renderCache.set(cacheKey, { content: renderedHtml, timestamp: Date.now() });
      task.status = 'completed';
      task.result = renderedHtml;
      this.renderQueue.set(cardId, task);
      
      this.logger.debug('카드 렌더링 완료', { cardId });
    } catch (error) {
      // 오류 처리
      this.logger.error('카드 렌더링 실패', { cardId, error });
      task.status = 'failed';
      task.error = error;
      this.renderQueue.set(cardId, task);
      
      // 에러 핸들러에 오류 전달
      this.errorHandler.handleError(error, 'CardRenderManager.processRenderTask');
    } finally {
      // 활성 작업에서 제거
      this.activeRenderTasks.delete(cardId);
      
      // 렌더링 중인 카드 목록에서 제거
      this.renderingCards.delete(cardId);
      
      // 렌더링 타임스탬프 업데이트
      this._renderTimestamps.set(cardId, Date.now());
      
      timer.stop();
    }
  }

  /**
   * 일반 텍스트 카드 렌더링
   * @param card 카드
   * @param config 렌더링 설정
   * @param style 카드 스타일
   * @returns 렌더링된 HTML
   */
  private renderPlainTextCard(card: ICard, config: IRenderConfig, style: ICardStyle): string {
    if (!card.file) {
      return '<div class="content">파일 정보가 없습니다</div>';
    }
    
    try {
      // 카드 콘텐츠 준비
      const content = card.content || '내용이 없습니다';
      
      // 내용 길이 제한
      let displayContent = content;
      if (config.contentLengthLimitEnabled && content.length > config.contentLengthLimit) {
        displayContent = content.substring(0, config.contentLengthLimit) + '...';
      }
      
      // 일반 텍스트용 컨테이너 생성
      const containerEl = document.createElement('div');
      containerEl.className = 'content';
      containerEl.textContent = displayContent;
      
      return containerEl.outerHTML;
    } catch (error) {
      this.logger.error('일반 텍스트 렌더링 실패', { error, cardId: card.id });
      return `<div class="content">텍스트 렌더링 오류: ${error.message}</div>`;
    }
  }

  /**
   * 마크다운 카드 렌더링
   * @param card 카드
   * @param config 렌더링 설정
   * @param style 카드 스타일
   * @returns 렌더링된 HTML
   */
  private async renderMarkdownCard(card: ICard, config: IRenderConfig, style: ICardStyle): Promise<string> {
    if (!card.file) {
      return '<div class="content">파일 정보가 없습니다</div>';
    }
    
    try {
      // 카드 콘텐츠 준비
      const content = card.content || '내용이 없습니다';
      
      // 내용 길이 제한
      let displayContent = content;
      if (config.contentLengthLimitEnabled && content.length > config.contentLengthLimit) {
        displayContent = content.substring(0, config.contentLengthLimit) + '...';
      }
      
      // MarkdownRenderer를 사용하여 마크다운 렌더링
      const renderedContent = await this.markdownRenderer.render(displayContent, {
        showImages: config.showImages,
        highlightCode: config.highlightCode,
        supportCallouts: config.supportCallouts,
        supportMath: config.supportMath
      });
      
      // 렌더링된 내용을 컨테이너에 감싸서 반환
      return `<div class="content">${renderedContent}</div>`;
    } catch (error) {
      this.logger.error('마크다운 렌더링 실패', { error, cardId: card.id });
      throw error;
    }
  }

  /**
   * 캐시 키 생성
   * @param cardId 카드 ID
   * @param config 렌더링 설정
   * @param style 카드 스타일
   * @returns 캐시 키
   */
  private getCacheKey(cardId: string, config: IRenderConfig, style: ICardStyle): string {
    const configKey = [
      config.type === RenderType.HTML ? 'html' : 'txt',
      config.showImages ? 'img' : 'noimg',
      config.highlightCode ? 'hl' : 'nohl',
      config.supportCallouts ? 'co' : 'noco',
      config.supportMath ? 'math' : 'nomath',
      config.contentLengthLimitEnabled ? `lim${config.contentLengthLimit}` : 'nolim'
    ].join('-');
    
    const styleKey = this.getStyleKey(style);
    
    return `${cardId}|${configKey}|${styleKey}`;
  }

  /**
   * 스타일에서 키 생성
   * @param style 카드 스타일
   * @returns 스타일 키
   */
  private getStyleKey(style: ICardStyle): string {
    // 스타일 객체에서 고유 식별자 생성 (간단한 해시)
    return [
      this.hashStyle(style.card),
      this.hashStyle(style.activeCard),
      this.hashStyle(style.focusedCard),
      this.hashStyle(style.header),
      this.hashStyle(style.body),
      this.hashStyle(style.footer)
    ].join('|');
  }

  /**
   * 개별 스타일 요소 해시
   * @param styleElement 스타일 요소
   * @returns 해시 문자열
   */
  private hashStyle(styleElement: any): string {
    return Object.values(styleElement).join('-');
  }

  /**
   * 만료된 캐시 항목 정리
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    this.renderCache.forEach((value, key) => {
      if (now - value.timestamp > this.CACHE_EXPIRY_MS) {
        this.renderCache.delete(key);
        expiredCount++;
      }
    });
    
    if (expiredCount > 0) {
      this.logger.debug('만료된 렌더링 캐시 정리', { expiredCount });
    }
  }

  /**
   * 렌더링 캐시 초기화
   */
  clearRenderCache(): void {
    const timer = this.performanceMonitor.startTimer('CardRenderManager.clearRenderCache');
    
    try {
      this.logger.debug('렌더링 캐시 초기화');
      this.renderCache.clear();
    } catch (error) {
      this.logger.error('캐시 초기화 중 오류 발생', { error });
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 렌더링 캐시 업데이트
   * @param cardId 카드 ID
   */
  async updateCardRenderCache(cardId: string): Promise<void> {
    const timer = this.performanceMonitor.startTimer('CardRenderManager.updateCardRenderCache');
    
    try {
      this.logger.debug('카드 렌더링 캐시 업데이트', { cardId });
      this.removeCardRenderCache(cardId);
      
      // 카드가 있으면 다시 렌더링 요청
      const card = this.cards.get(cardId);
      if (card) {
        await this.render(card, this.currentCardConfig, this.currentCardStyle || DEFAULT_CARD_STYLE);
      }
    } catch (error) {
      this.logger.error('카드 캐시 업데이트 중 오류 발생', { cardId, error });
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 렌더링 캐시 삭제
   * @param cardId 카드 ID
   */
  removeCardRenderCache(cardId: string): void {
    const timer = this.performanceMonitor.startTimer('CardRenderManager.removeCardRenderCache');
    
    try {
      // 캐시 키에서 카드 ID로 시작하는 모든 항목 찾기
      Array.from(this.renderCache.keys())
        .filter(key => key.startsWith(`${cardId}|`))
        .forEach(key => this.renderCache.delete(key));
        
      this.logger.debug('카드 렌더링 캐시 삭제됨', { cardId });
    } catch (error) {
      this.logger.error('카드 캐시 삭제 중 오류 발생', { cardId, error });
    } finally {
      timer.stop();
    }
  }

  /**
   * 렌더링 이벤트 구독
   * @param callback 콜백 함수
   */
  subscribeToRenderEvents(callback: (event: {
    type: 'render' | 'cache-update';
    cardId?: string;
    data?: any;
  }) => void): void {
    this.renderEventSubscribers.add(callback);
  }

  /**
   * 렌더링 이벤트 구독 해제
   * @param callback 콜백 함수
   */
  unsubscribeFromRenderEvents(callback: (event: any) => void): void {
    this.renderEventSubscribers.delete(callback);
  }

  /**
   * 렌더링 상태 확인
   * @param cardId 카드 ID
   */
  isCardRendered(cardId: string): boolean {
    return Array.from(this.renderCache.keys()).some(key => key.startsWith(`${cardId}|`));
  }

  /**
   * 렌더링 진행 상태 확인
   * @param cardId 카드 ID
   */
  isCardRendering(cardId: string): boolean {
    return this.activeRenderTasks.has(cardId);
  }

  /**
   * 컴포넌트 로드 시 호출
   */
  onload(): void {
    this.registerInterval(
      window.setInterval(() => this.cleanExpiredCache(), this.CACHE_EXPIRY_MS / 2)
    );
  }

  /**
   * 컴포넌트 언로드 시 호출
   */
  onunload(): void {
    this.renderQueue.clear();
    this.renderCache.clear();
    this.activeRenderTasks.clear();
    this.renderingCards.clear();
    this.renderEventSubscribers.clear();
    this._renderTimestamps.clear();
    this._renderPromises?.clear();
    this._renderPromises = null;
    this.initialized = false;
  }

  private registerInterval(intervalId: number): void {
    this.intervals.push(intervalId);
  }

  private clearIntervals(): void {
    this.intervals.forEach(intervalId => window.clearInterval(intervalId));
    this.intervals = [];
  }
} 