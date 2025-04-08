import { IScrollService } from '@/domain/services/application/IScrollService';
import { ICard } from '@/domain/models/Card';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';
import { 
  CardCenteredEvent, 
  ScrollBehaviorChangedEvent, 
  SmoothScrollChangedEvent 
} from '@/domain/events/ScrollEvents';
import { ICardService } from '@/domain/services/domain/ICardService';
import { ICardSelectionService } from '@/domain/services/domain/ICardSelectionService';
import { ICardManager } from '@/domain/managers/ICardManager';
import { ICardDisplayManager } from '@/domain/managers/ICardDisplayManager';
import { ICardFactory } from '@/domain/factories/ICardFactory';

/**
 * 스크롤 이벤트 리스너 타입
 */
type ScrollEventListener = (event: Event) => void;

/**
 * 스크롤 서비스 구현체
 */
export class ScrollService implements IScrollService {
  private static instance: ScrollService | null = null;
  private initialized: boolean = false;
  private scrollPosition: number = 0;
  private scrollDirection: 'up' | 'down' | null = null;
  private lastScrollTime: number = 0;
  private scrollThreshold: number = 50;
  private scrollTimeout: number | null = null;
  private scrollEventListeners: Set<ScrollEventListener> = new Set();
  private errorHandler: IErrorHandler;
  private loggingService: ILoggingService;
  private performanceMonitor: IPerformanceMonitor;
  private analyticsService: IAnalyticsService;
  private eventDispatcher: IEventDispatcher;
  private scrollContainer: HTMLElement | null = null;
  private smoothScroll: boolean = true;
  private scrollBehavior: 'auto' | 'smooth' | 'instant' = 'smooth';

  constructor(
    private readonly cardService: ICardService,
    private readonly cardSelectionService: ICardSelectionService,
    private readonly cardManager: ICardManager,
    private readonly cardDisplayManager: ICardDisplayManager,
    private readonly cardFactory: ICardFactory,
    errorHandler: IErrorHandler,
    loggingService: ILoggingService,
    performanceMonitor: IPerformanceMonitor,
    analyticsService: IAnalyticsService,
    eventDispatcher: IEventDispatcher
  ) {
    this.errorHandler = errorHandler;
    this.loggingService = loggingService;
    this.performanceMonitor = performanceMonitor;
    this.analyticsService = analyticsService;
    this.eventDispatcher = eventDispatcher;
  }

  static getInstance(): ScrollService {
    if (!ScrollService.instance) {
      const container = Container.getInstance();
      const errorHandler = container.resolve<IErrorHandler>('IErrorHandler');
      const loggingService = container.resolve<ILoggingService>('ILoggingService');
      const performanceMonitor = container.resolve<IPerformanceMonitor>('IPerformanceMonitor');
      const analyticsService = container.resolve<IAnalyticsService>('IAnalyticsService');
      const eventDispatcher = container.resolve<IEventDispatcher>('IEventDispatcher');
      
      ScrollService.instance = new ScrollService(
        container.resolve<ICardService>('ICardService'),
        container.resolve<ICardSelectionService>('ICardSelectionService'),
        container.resolve<ICardManager>('ICardManager'),
        container.resolve<ICardDisplayManager>('ICardDisplayManager'),
        container.resolve<ICardFactory>('ICardFactory'),
        errorHandler,
        loggingService,
        performanceMonitor,
        analyticsService,
        eventDispatcher
      );
    }
    return ScrollService.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    const timer = this.performanceMonitor.startTimer('ScrollService.initialize');
    try {
      if (this.initialized) {
        this.loggingService.debug('스크롤 서비스가 이미 초기화되어 있습니다.');
        return;
      }

      this.loggingService.debug('스크롤 서비스 초기화 시작');
      
      // 기본 스크롤 컨테이너 설정
      const defaultContainer = document.querySelector('.card-navigator-grid');
      if (defaultContainer instanceof HTMLElement) {
        this.setScrollContainer(defaultContainer);
      }

      this.initialized = true;
      this.loggingService.info('스크롤 서비스 초기화 완료');
    } catch (error) {
      this.loggingService.error('스크롤 서비스 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'ScrollService.initialize');
    } finally {
      timer.stop();
    }
  }

  /**
   * 정리
   */
  cleanup(): void {
    const timer = this.performanceMonitor.startTimer('ScrollService.cleanup');
    try {
      this.loggingService.debug('스크롤 서비스 정리 시작');
      this.scrollContainer = null;
      this.initialized = false;
      this.loggingService.info('스크롤 서비스 정리 완료');
    } catch (error) {
      this.loggingService.error('스크롤 서비스 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'ScrollService.cleanup');
    } finally {
      timer.stop();
    }
  }

  /**
   * 초기화 여부 확인
   * @returns 초기화 완료 여부
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 카드를 뷰포트 중앙에 위치
   * @param card 카드
   */
  centerCard(card: ICard): void {
    const timer = this.performanceMonitor.startTimer('ScrollService.centerCard');
    try {
      if (!this.initialized) {
        throw new Error('스크롤 서비스가 초기화되지 않았습니다.');
      }

      if (!this.scrollContainer) {
        throw new Error('스크롤 컨테이너가 설정되지 않았습니다.');
      }

      this.loggingService.debug('카드 중앙 정렬 시작', { cardId: card.id });

      const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
      if (!cardElement) {
        this.loggingService.warn('카드 요소를 찾을 수 없음', { cardId: card.id });
        return;
      }

      // 카드 요소의 위치 계산
      const containerRect = this.scrollContainer.getBoundingClientRect();
      const cardRect = cardElement.getBoundingClientRect();

      // 중앙 정렬을 위한 스크롤 위치 계산
      const scrollLeft = this.scrollContainer.scrollLeft + 
        (cardRect.left - containerRect.left) - 
        (containerRect.width - cardRect.width) / 2;
      
      const scrollTop = this.scrollContainer.scrollTop + 
        (cardRect.top - containerRect.top) - 
        (containerRect.height - cardRect.height) / 2;

      // 스크롤 실행
      this.scrollContainer.scrollTo({
        left: scrollLeft,
        top: scrollTop,
        behavior: this.smoothScroll ? this.scrollBehavior : 'auto'
      });

      // 이벤트 발송
      this.eventDispatcher.dispatch(new CardCenteredEvent(card));

      this.analyticsService.trackEvent('card_centered', {
        cardId: card.id,
        smoothScroll: this.smoothScroll,
        scrollBehavior: this.scrollBehavior
      });

      this.loggingService.info('카드 중앙 정렬 완료', { cardId: card.id });
    } catch (error) {
      this.loggingService.error('카드 중앙 정렬 실패', { error });
      this.errorHandler.handleError(error as Error, 'ScrollService.centerCard');
    } finally {
      timer.stop();
    }
  }

  /**
   * 부드러운 스크롤 여부 설정
   * @param enabled 부드러운 스크롤 사용 여부
   */
  setSmoothScroll(enabled: boolean): void {
    this.smoothScroll = enabled;
    this.eventDispatcher.dispatch(new SmoothScrollChangedEvent(enabled));
    this.loggingService.debug('부드러운 스크롤 설정 변경', { enabled });
  }

  /**
   * 부드러운 스크롤 여부 확인
   * @returns 부드러운 스크롤 사용 여부
   */
  isSmoothScrollEnabled(): boolean {
    return this.smoothScroll;
  }

  /**
   * 스크롤 동작 설정
   * @param behavior 스크롤 동작
   */
  setScrollBehavior(behavior: 'auto' | 'smooth' | 'instant'): void {
    this.scrollBehavior = behavior;
    this.eventDispatcher.dispatch(new ScrollBehaviorChangedEvent(behavior));
    this.loggingService.debug('스크롤 동작 설정 변경', { behavior });
  }

  /**
   * 스크롤 동작 확인
   * @returns 스크롤 동작
   */
  getScrollBehavior(): 'auto' | 'smooth' | 'instant' {
    return this.scrollBehavior;
  }

  /**
   * 스크롤 컨테이너 설정
   * @param container 스크롤 컨테이너 요소
   */
  setScrollContainer(container: HTMLElement): void {
    this.scrollContainer = container;
    this.loggingService.debug('스크롤 컨테이너 설정', { 
      containerId: container.id,
      className: container.className
    });
  }

  /**
   * 스크롤 컨테이너 확인
   * @returns 스크롤 컨테이너 요소
   */
  getScrollContainer(): HTMLElement | null {
    return this.scrollContainer;
  }

  scrollToCard(card: ICard): void {
    const timer = this.performanceMonitor.startTimer('ScrollService.scrollToCard');
    try {
      if (!this.initialized) {
        throw new Error('스크롤 서비스가 초기화되지 않았습니다.');
      }

      if (!this.scrollContainer) {
        throw new Error('스크롤 컨테이너가 설정되지 않았습니다.');
      }

      this.loggingService.debug('카드로 스크롤 시작', { cardId: card.id });

      const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
      if (!cardElement) {
        this.loggingService.warn('카드 요소를 찾을 수 없음', { cardId: card.id });
        return;
      }

      // 카드 요소의 위치 계산
      const containerRect = this.scrollContainer.getBoundingClientRect();
      const cardRect = cardElement.getBoundingClientRect();

      // 스크롤 위치 계산
      const scrollLeft = this.scrollContainer.scrollLeft + 
        (cardRect.left - containerRect.left);
      
      const scrollTop = this.scrollContainer.scrollTop + 
        (cardRect.top - containerRect.top);

      // 스크롤 실행
      this.scrollContainer.scrollTo({
        left: scrollLeft,
        top: scrollTop,
        behavior: this.smoothScroll ? this.scrollBehavior : 'auto'
      });

      this.analyticsService.trackEvent('card_scrolled', {
        cardId: card.id,
        smoothScroll: this.smoothScroll,
        scrollBehavior: this.scrollBehavior
      });

      this.loggingService.info('카드로 스크롤 완료', { cardId: card.id });
    } catch (error) {
      this.loggingService.error('카드로 스크롤 실패', { error });
      this.errorHandler.handleError(error as Error, 'ScrollService.scrollToCard');
    } finally {
      timer.stop();
    }
  }
} 