import { ICard } from '../../domain/models/Card';
import { ICardRenderConfig, DEFAULT_CARD_RENDER_CONFIG } from '../../domain/models/CardRenderConfig';
import { ICardStyle, DEFAULT_CARD_STYLE } from '../../domain/models/CardStyle';
import { IRenderManager } from '../../domain/managers/IRenderManager';
import { IEventDispatcher } from '../../domain/events/DomainEvent';
import { CardUpdatedEvent } from '../../domain/events/CardEvents';
import { ILoggingService } from '../../domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '../../domain/infrastructure/IPerformanceMonitor';
import { IErrorHandler } from '../../domain/infrastructure/IErrorHandler';
import { App, MarkdownRenderer, Component } from 'obsidian';
import { Container } from '../../infrastructure/di/Container';

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
 * 렌더링 관련 기능을 담당하는 매니저 클래스
 */
export class RenderManager extends Component implements IRenderManager {
  private static instance: RenderManager;
  
  // 카드 상태 관리
  private cards: Map<string, ICard>;
  
  // 작업 큐 및 캐시
  private renderQueue: Map<string, IRenderTask>;
  private renderCache: Map<string, { html: string; timestamp: number }>;
  private activeRenderTasks: Set<string>;
  
  // 렌더링 설정 및 스타일
  private currentRenderConfig: ICardRenderConfig;
  private currentCardStyle: ICardStyle | null;
  
  // 초기화 상태
  private _isInitialized: boolean;
  
  // 작업 관리
  private renderingCards: Set<string>;
  private renderEventSubscribers: Set<(event: any) => void>;
  private _renderTimestamps: Map<string, number>;
  private _renderPromises: Map<string, Promise<string>> | null;
  
  // 작업 제한 설정
  private readonly MAX_CONCURRENT_RENDERS = 5;
  private readonly CACHE_EXPIRY_MS = 3600000; // 1시간
  private isProcessingQueue = false;
  private lastJobId = 0;
  
  private constructor(
    private readonly app: App,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly errorHandler: IErrorHandler
  ) {
    super();
    
    // 상태 초기화
    this.cards = new Map();
    this.renderQueue = new Map();
    this.renderCache = new Map();
    this.activeRenderTasks = new Set();
    this.renderingCards = new Set();
    this.renderEventSubscribers = new Set();
    this._renderTimestamps = new Map();
    this._renderPromises = new Map();
    
    // 기본 설정
    this.currentRenderConfig = DEFAULT_CARD_RENDER_CONFIG;
    this.currentCardStyle = DEFAULT_CARD_STYLE;
    this._isInitialized = false;
    
    this.loggingService.debug('RenderManager 인스턴스 생성됨');
  }
  
  /**
   * RenderManager 인스턴스 가져오기
   */
  public static getInstance(): RenderManager {
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
    }
    
    return RenderManager.instance;
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
    this._isInitialized = false;
  }
  
  /**
   * 렌더링 관리자 초기화
   */
  initialize(): void {
    if (this._isInitialized) {
      this.loggingService.debug('RenderManager가 이미 초기화되어 있습니다.');
      return;
    }
    
    this.loggingService.debug('RenderManager 초기화 시작');
    
    // 이벤트 리스너 설정, 캐시 초기화 등 필요한 초기화 작업 수행
    this._isInitialized = true;
    
    this.loggingService.debug('RenderManager 초기화 완료');
  }
  
  /**
   * 리소스 정리
   */
  cleanup(): void {
    const perfMark = 'RenderManager.cleanup';
    this.performanceMonitor.startMeasure(perfMark);
    
    try {
      this.loggingService.debug('RenderManager 리소스 정리 시작');
      
      // 진행 중인 모든 작업 취소
      this.renderQueue.clear();
      this.activeRenderTasks.clear();
      
      // 캐시 및 이벤트 구독 정리
      this.renderCache.clear();
      this.renderingCards.clear();
      this.renderEventSubscribers.clear();
      
      // 초기화 상태 재설정
      this._isInitialized = false;
      
      this.loggingService.debug('RenderManager 리소스 정리 완료');
    } catch (error) {
      this.loggingService.error('RenderManager 리소스 정리 중 오류', { error });
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
  
  /**
   * 렌더링 관리자 초기화 상태 확인
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }
  
  /**
   * 렌더링 설정 업데이트
   * @param config 렌더링 설정
   */
  updateRenderConfig(config: ICardRenderConfig): void {
    const perfMark = 'RenderManager.updateRenderConfig';
    this.performanceMonitor.startMeasure(perfMark);
    
    try {
      this.loggingService.debug('렌더링 설정 업데이트', { config });
      this.currentRenderConfig = config;
    } catch (error) {
      this.loggingService.error('렌더링 설정 업데이트 중 오류', { error });
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
  
  /**
   * 스타일 업데이트
   * @param style 카드 스타일
   */
  updateStyle(style: ICardStyle): void {
    const perfMark = 'RenderManager.updateStyle';
    this.performanceMonitor.startMeasure(perfMark);
    
    try {
      this.loggingService.debug('카드 스타일 업데이트', { style });
      this.currentCardStyle = style;
    } catch (error) {
      this.loggingService.error('카드 스타일 업데이트 중 오류', { error });
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
  
  /**
   * 카드 렌더링 요청
   * @param cardId 카드 ID
   * @param card 카드
   * @param renderConfig 렌더링 설정 (선택 사항)
   * @param cardStyle 카드 스타일 (선택 사항)
   * @returns 렌더링된 HTML
   */
  async requestRender(
    cardId: string,
    card: ICard,
    renderConfig?: ICardRenderConfig,
    cardStyle?: ICardStyle
  ): Promise<string> {
    if (!this._isInitialized) {
      this.initialize();
    }
    
    const perfMark = `RenderManager.requestRender.${cardId}`;
    this.performanceMonitor.startMeasure(perfMark);
    
    try {
      if (!card) {
        throw new Error('카드가 유효하지 않습니다');
      }
      
      this.loggingService.debug('카드 렌더링 요청', { cardId });
      
      // 카드 추적 및 DOM 상태 업데이트
      this.cards.set(cardId, card);
      this.updateCardElementStatus(cardId, 'loading');
      
      // 캐시 키 생성
      const finalConfig = renderConfig || this.currentRenderConfig;
      const finalStyle = cardStyle || this.currentCardStyle || DEFAULT_CARD_STYLE;
      const cacheKey = this.getCacheKey(cardId, finalConfig, finalStyle);
      
      // 캐시 확인
      const cachedResult = this.renderCache.get(cacheKey);
      if (cachedResult && (Date.now() - cachedResult.timestamp) < this.CACHE_EXPIRY_MS) {
        // 캐시된 결과로 DOM 업데이트
        this.updateCardElementStatus(cardId, 'ready', undefined, cachedResult.html);
        
        this.performanceMonitor.endMeasure(perfMark);
        return cachedResult.html;
      }
      
      // 이미 진행 중인 렌더링 작업이 있는지 확인
      const existingTask = this.renderQueue.get(cardId);
      if (existingTask && existingTask.status === 'processing') {
        this.loggingService.debug('이미 진행 중인 렌더링 작업 존재', { cardId });
        return existingTask.promise as Promise<string>;
      }
      
      // 새 렌더링 작업 생성
      const renderPromise = new Promise<string>((resolve, reject) => {
        const task: IRenderTask = {
          cardId,
          card,
          status: 'pending',
          timestamp: Date.now()
        };
        
        // 작업 큐에 추가
        this.renderQueue.set(cardId, task);
        
        // 비동기적으로 큐 처리 시작
        setTimeout(() => {
          this.processRenderQueue()
            .then(() => {
              const completedTask = this.renderQueue.get(cardId);
              if (completedTask && completedTask.status === 'completed') {
                resolve(completedTask.result as string);
              } else if (completedTask && completedTask.status === 'failed') {
                reject(completedTask.error);
              } else {
                reject(new Error('렌더링 작업 실패: 알 수 없는 상태'));
              }
            })
            .catch(reject);
        }, 0);
      });
      
      // 작업에 프로미스 연결
      const task = this.renderQueue.get(cardId);
      if (task) {
        task.promise = renderPromise;
        this.renderQueue.set(cardId, task);
      }
      
      // 작업 추적을 위한 프로미스 저장
      this._renderPromises?.set(cardId, renderPromise);
      
      return renderPromise;
    } catch (error) {
      this.loggingService.error('렌더링 요청 처리 중 오류', { cardId, error });
      this.updateCardElementStatus(cardId, 'error', error.message);
      this.performanceMonitor.endMeasure(perfMark);
      return Promise.reject(error);
    }
  }
  
  /**
   * 카드 렌더링
   * @param card 카드
   * @param config 렌더링 설정
   * @param style 스타일
   * @returns 렌더링된 HTML
   */
  async renderCard(card: ICard, config: ICardRenderConfig, style: ICardStyle): Promise<string> {
    return this.requestRender(card.id, card, config, style);
  }
  
  /**
   * 렌더링 캐시 초기화
   */
  clearRenderCache(): void {
    const now = Date.now();
    const perfMark = 'RenderManager.clearRenderCache';
    this.performanceMonitor.startMeasure(perfMark);
    
    try {
      this.loggingService.debug('렌더링 캐시 초기화');
      this.renderCache.clear();
    } catch (error) {
      this.loggingService.error('캐시 초기화 중 오류 발생', { error });
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
      this.loggingService.debug('카드 렌더링 캐시 업데이트', { cardId });
      this.removeCardRenderCache(cardId);
      
      // 카드가 있으면 다시 렌더링 요청
      const card = this.cards.get(cardId);
      if (card) {
        await this.requestRender(cardId, card);
      }
    } catch (error) {
      this.loggingService.error('카드 캐시 업데이트 중 오류 발생', { cardId, error });
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
      // 캐시 키에서 카드 ID로 시작하는 모든 항목 찾기
      Array.from(this.renderCache.keys())
        .filter(key => key.startsWith(`${cardId}|`))
        .forEach(key => this.renderCache.delete(key));
        
      this.loggingService.debug('카드 렌더링 캐시 삭제됨', { cardId });
    } catch (error) {
      this.loggingService.error('카드 캐시 삭제 중 오류 발생', { cardId, error });
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
      this.loggingService.error('렌더링 큐 처리 중 오류 발생', { error });
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
    const perfMark = `RenderManager.processRenderTask.${cardId}`;
    this.performanceMonitor.startMeasure(perfMark);
    
    // 작업 상태 업데이트
    task.status = 'processing';
    this.renderQueue.set(cardId, task);
    this.activeRenderTasks.add(cardId);
    
    try {
      this.loggingService.debug('카드 렌더링 시작', { cardId });
      
      // 실제 렌더링 수행
      const finalConfig = this.currentRenderConfig;
      const finalStyle = this.currentCardStyle || DEFAULT_CARD_STYLE;
      
      // 캐시 키 생성
      const cacheKey = this.getCacheKey(cardId, finalConfig, finalStyle);
      
      // 마크다운 렌더링 여부에 따라 다른 처리
      let renderedHtml: string;
      
      if (!finalConfig.renderMarkdown) {
        // 일반 텍스트 렌더링
        renderedHtml = this.renderPlainTextCard(card, finalConfig, finalStyle);
      } else {
        try {
          // 마크다운 렌더링
          renderedHtml = await this.renderMarkdownCard(card, finalConfig, finalStyle);
        } catch (renderError) {
          // 마크다운 렌더링 실패 시 일반 텍스트로 대체
          this.loggingService.error('마크다운 렌더링 실패, 일반 텍스트로 대체', { 
            renderError, 
            cardId 
          });
          renderedHtml = this.renderPlainTextCard(card, finalConfig, finalStyle);
        }
      }
      
      // 결과 캐싱 및 작업 완료 처리
      this.renderCache.set(cacheKey, { html: renderedHtml, timestamp: Date.now() });
      task.status = 'completed';
      task.result = renderedHtml;
      this.renderQueue.set(cardId, task);
      
      // DOM 업데이트
      this.updateCardElementStatus(cardId, 'ready', undefined, renderedHtml);
      
      this.loggingService.debug('카드 렌더링 완료', { cardId });
      this.performanceMonitor.endMeasure(perfMark);
      
      // 이벤트 발송
      if (this.eventDispatcher) {
        this.eventDispatcher.dispatch(new CardUpdatedEvent(card));
      }
    } catch (error) {
      // 오류 처리
      this.loggingService.error('카드 렌더링 실패', { cardId, error });
      task.status = 'failed';
      task.error = error;
      this.renderQueue.set(cardId, task);
      
      // DOM 업데이트 (오류 상태)
      this.updateCardElementStatus(cardId, 'error', error.message);
      
      this.performanceMonitor.endMeasure(perfMark);
      
      // 에러 핸들러에 오류 전달
      this.errorHandler.handleError(error, 'RenderManager.processRenderTask');
    } finally {
      // 활성 작업에서 제거
      this.activeRenderTasks.delete(cardId);
      
      // 렌더링 중인 카드 목록에서 제거
      this.renderingCards.delete(cardId);
      
      // 렌더링 타임스탬프 업데이트
      this._renderTimestamps.set(cardId, Date.now());
    }
  }
  
  /**
   * 일반 텍스트 카드 렌더링
   * @param card 카드
   * @param config 렌더링 설정
   * @param style 카드 스타일
   * @returns 렌더링된 HTML
   */
  private renderPlainTextCard(card: ICard, config: ICardRenderConfig, style: ICardStyle): string {
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
      this.loggingService.error('일반 텍스트 렌더링 실패', { error, cardId: card.id });
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
  private async renderMarkdownCard(card: ICard, config: ICardRenderConfig, style: ICardStyle): Promise<string> {
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
      
      // 마크다운 렌더링용 컨테이너 생성
      const containerEl = document.createElement('div');
      containerEl.className = 'content';
      
      // 마크다운 렌더링
      await MarkdownRenderer.renderMarkdown(
        displayContent,
        containerEl,
        card.file.path,
        this
      );
      
      return containerEl.outerHTML;
    } catch (error) {
      this.loggingService.error('마크다운 렌더링 실패', { error, cardId: card.id });
      throw error;
    }
  }
  
  /**
   * 카드 요소 상태 업데이트
   * @param cardId 카드 ID
   * @param status 상태 ('loading', 'ready', 'error')
   * @param errorMessage 오류 메시지 (status가 'error'인 경우)
   * @param renderedContent 렌더링된 HTML 콘텐츠 (status가 'ready'인 경우)
   */
  private updateCardElementStatus(
    cardId: string, 
    status: 'loading' | 'ready' | 'error', 
    errorMessage?: string,
    renderedContent?: string
  ): void {
    try {
      // 카드 ID로 모든 카드 요소 찾기 (중복 요소가 있을 수 있음)
      const cardElements = document.querySelectorAll(`.card-navigator-card[data-card-id="${cardId}"]`);
      if (!cardElements || cardElements.length === 0) {
        this.loggingService.debug(`카드 요소를 찾을 수 없음: ${cardId}`);
        return;
      }
      
      // 각 카드 요소에 대해 상태 업데이트 수행
      cardElements.forEach((cardElement: HTMLElement) => {
        // 이미 처리된 카드인지 확인 (status가 ready인 경우)
        const isRegistered = cardElement.getAttribute('data-registered') === 'true';
        const isCurrentlyLoading = cardElement.querySelector('.card-loading') !== null;
        
        // 카드 바디 요소 찾기
        let bodyElement = cardElement.querySelector('.card-body') as HTMLElement;
        
        // 카드 바디가 없으면 생성
        if (!bodyElement) {
          bodyElement = document.createElement('div');
          bodyElement.className = 'card-body';
          
          // 헤더 다음에 삽입
          const headerElement = cardElement.querySelector('.card-header');
          if (headerElement) {
            headerElement.after(bodyElement);
          } else {
            cardElement.appendChild(bodyElement);
          }
        }
        
        // 상태에 따른 처리
        switch (status) {
          case 'loading':
            // 이미 등록된 카드는 로딩 상태로 되돌리지 않음
            if (isRegistered && !isCurrentlyLoading) {
              this.loggingService.debug(`이미 렌더링된 카드는 로딩 상태로 변경하지 않음: ${cardId}`);
              return;
            }
            
            // 로딩 표시가 없는 경우에만 추가
            if (!isCurrentlyLoading) {
              // 로딩 요소 추가
              const loadingDiv = document.createElement('div');
              loadingDiv.className = 'card-loading';
              loadingDiv.innerHTML = '<span class="loading-spinner"></span><span>카드 로딩 중...</span>';
              
              // 기존 콘텐츠는 유지하고 로딩 표시만 추가
              bodyElement.appendChild(loadingDiv);
            }
            break;
            
          case 'ready':
            if (renderedContent) {
              // 로딩 및 에러 요소 제거
              const loadingElement = bodyElement.querySelector('.card-loading');
              if (loadingElement) loadingElement.remove();
              
              const errorElement = bodyElement.querySelector('.card-error');
              if (errorElement) errorElement.remove();
              
              // 기존 콘텐츠 요소 찾기
              let contentElement = bodyElement.querySelector('.content');
              
              // 콘텐츠 요소가 없거나 등록되지 않은 카드인 경우에만 새로 추가
              if (!contentElement || !isRegistered) {
                // HTML 문자열을 파싱하여 DOM 요소로 변환
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = renderedContent;
                
                // 첫 번째 자식이 .content 클래스를 가진 요소인지 확인
                if (tempContainer.firstChild && 
                    (tempContainer.firstChild as HTMLElement).classList.contains('content')) {
                  contentElement = tempContainer.firstChild as HTMLElement;
                } else {
                  // .content 요소가 없으면 새로 생성하여 래핑
                  contentElement = document.createElement('div');
                  contentElement.className = 'content';
                  contentElement.innerHTML = renderedContent;
                }
                
                // 기존 contentElement 제거 후 새로운 contentElement 추가
                if (bodyElement.querySelector('.content')) {
                  bodyElement.querySelector('.content')?.remove();
                }
                
                bodyElement.appendChild(contentElement);
                
                // 카드가 등록됨을 표시
                cardElement.setAttribute('data-registered', 'true');
                
                this.loggingService.debug(`카드 콘텐츠 렌더링 완료: ${cardId}`);
              } else {
                this.loggingService.debug(`이미 렌더링된 카드 콘텐츠 건너뜀: ${cardId}`);
              }
            }
            break;
            
          case 'error':
            // 로딩 요소 제거
            const loadingElement = bodyElement.querySelector('.card-loading');
            if (loadingElement) loadingElement.remove();
            
            // 기존 에러 요소 제거
            let errorElement = bodyElement.querySelector('.card-error');
            if (errorElement) errorElement.remove();
            
            // 에러 요소 생성 및 추가
            errorElement = document.createElement('div');
            errorElement.className = 'card-error';
            errorElement.textContent = errorMessage || '카드 렌더링 중 오류가 발생했습니다.';
            bodyElement.appendChild(errorElement);
            
            this.loggingService.error(`카드 렌더링 에러: ${cardId}`, { error: errorMessage });
            break;
        }
      });
    } catch (error) {
      this.loggingService.error('카드 요소 상태 업데이트 실패', {
        cardId,
        status,
        error: error.message
      });
      this.errorHandler.handleError(error, 'RenderManager.updateCardElementStatus');
    }
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
      this.loggingService.debug('만료된 렌더링 캐시 정리', { expiredCount });
    }
  }
  
  /**
   * 캐시 키 생성
   * @param cardId 카드 ID
   * @param config 렌더링 설정
   * @param style 카드 스타일
   * @returns 캐시 키
   */
  private getCacheKey(cardId: string, config: ICardRenderConfig, style: ICardStyle): string {
    const configKey = [
      config.renderMarkdown ? 'md' : 'txt',
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
} 