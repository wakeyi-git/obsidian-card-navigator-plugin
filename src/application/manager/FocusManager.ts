import { ICard } from '@/domain/models/Card';
import { IFocusManager, IFocusState } from '@/domain/managers/IFocusManager';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';
import { FocusChangedEvent, FocusBlurredEvent, FocusStateUpdatedEvent } from '@/domain/events/FocusEvents';

/**
 * 포커스 관리자 구현체
 */
export class FocusManager implements IFocusManager {
  private static instance: FocusManager | null = null;
  private focusStates: Map<string, IFocusState> = new Map();
  private isInitialized = false;
  private errorHandler: IErrorHandler;
  private logger: ILoggingService;
  private performanceMonitor: IPerformanceMonitor;
  private analyticsService: IAnalyticsService;
  private eventDispatcher: IEventDispatcher;
  private focusEventCallbacks: ((event: FocusChangedEvent | FocusBlurredEvent | FocusStateUpdatedEvent) => void)[] = [];
  private scrollContainer: HTMLElement | null = null;

  private constructor(
    errorHandler: IErrorHandler,
    logger: ILoggingService,
    performanceMonitor: IPerformanceMonitor,
    analyticsService: IAnalyticsService,
    eventDispatcher: IEventDispatcher
  ) {
    this.errorHandler = errorHandler;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.analyticsService = analyticsService;
    this.eventDispatcher = eventDispatcher;
  }

  public static getInstance(): FocusManager {
    if (!FocusManager.instance) {
      const container = Container.getInstance();
      FocusManager.instance = new FocusManager(
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService'),
        container.resolve<IEventDispatcher>('IEventDispatcher')
      );
    }
    return FocusManager.instance;
  }

  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.debug('FocusManager 초기화 시작');
      this.isInitialized = true;
      this.logger.debug('FocusManager 초기화 완료');
    } catch (error) {
      this.errorHandler.handleError(error, 'FocusManager 초기화 중 오류 발생');
      throw error;
    }
  }

  public cleanup(): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      this.logger.debug('FocusManager 정리 시작');
      this.focusStates.clear();
      this.focusEventCallbacks = [];
      this.isInitialized = false;
      this.logger.debug('FocusManager 정리 완료');
    } catch (error) {
      this.errorHandler.handleError(error, 'FocusManager 정리 중 오류 발생');
      throw error;
    }
  }

  public registerFocusState(cardId: string, isFocused: boolean): void {
    if (!this.isInitialized) {
      throw new Error('FocusManager가 초기화되지 않았습니다.');
    }

    const timer = this.performanceMonitor.startTimer('registerFocusState');
    try {
      this.logger.debug(`포커스 상태 등록 시작: ${cardId}`);

      const previousState = this.focusStates.get(cardId);
      const state: IFocusState = {
        cardId,
        isFocused,
        timestamp: new Date()
      };

      this.focusStates.set(cardId, state);
      this.eventDispatcher.dispatch(new FocusStateUpdatedEvent(
        { id: cardId } as ICard,
        previousState ? { id: previousState.cardId } as ICard : undefined
      ));

      this.analyticsService.trackEvent('focus_state_registered', { cardId });
      this.logger.debug(`포커스 상태 등록 완료: ${cardId}`);
    } catch (error) {
      this.errorHandler.handleError(error, `포커스 상태 등록 중 오류 발생: ${cardId}`);
      throw error;
    } finally {
      timer.stop();
    }
  }

  public unregisterFocusState(cardId: string): void {
    if (!this.isInitialized) {
      throw new Error('FocusManager가 초기화되지 않았습니다.');
    }

    const timer = this.performanceMonitor.startTimer('unregisterFocusState');
    try {
      this.logger.debug(`포커스 상태 해제 시작: ${cardId}`);

      this.focusStates.delete(cardId);
      this.eventDispatcher.dispatch(new FocusBlurredEvent({ id: cardId } as ICard));

      this.analyticsService.trackEvent('focus_state_unregistered', { cardId });
      this.logger.debug(`포커스 상태 해제 완료: ${cardId}`);
    } catch (error) {
      this.errorHandler.handleError(error, `포커스 상태 해제 중 오류 발생: ${cardId}`);
      throw error;
    } finally {
      timer.stop();
    }
  }

  public updateFocusState(cardId: string, isFocused: boolean): void {
    if (!this.isInitialized) {
      throw new Error('FocusManager가 초기화되지 않았습니다.');
    }

    const timer = this.performanceMonitor.startTimer('updateFocusState');
    try {
      this.logger.debug(`포커스 상태 업데이트 시작: ${cardId}`);

      const previousState = this.focusStates.get(cardId);
      const state: IFocusState = {
        cardId,
        isFocused,
        timestamp: new Date()
      };

      this.focusStates.set(cardId, state);
      this.eventDispatcher.dispatch(new FocusChangedEvent({ id: cardId } as ICard));

      this.analyticsService.trackEvent('focus_state_updated', { cardId });
      this.logger.debug(`포커스 상태 업데이트 완료: ${cardId}`);
    } catch (error) {
      this.errorHandler.handleError(error, `포커스 상태 업데이트 중 오류 발생: ${cardId}`);
      throw error;
    } finally {
      timer.stop();
    }
  }

  public getFocusState(cardId: string): IFocusState | undefined {
    return this.focusStates.get(cardId);
  }

  public getAllFocusStates(): IFocusState[] {
    return Array.from(this.focusStates.values());
  }

  public subscribeToFocusEvents(callback: (event: FocusChangedEvent | FocusBlurredEvent | FocusStateUpdatedEvent) => void): void {
    this.focusEventCallbacks.push(callback);
  }

  public unsubscribeFromFocusEvents(callback: (event: FocusChangedEvent | FocusBlurredEvent | FocusStateUpdatedEvent) => void): void {
    this.focusEventCallbacks = this.focusEventCallbacks.filter(cb => cb !== callback);
  }

  public scrollToCard(card: ICard): void {
    const timer = this.performanceMonitor.startTimer('FocusManager.scrollToCard');
    try {
      if (!this.scrollContainer) {
        this.logger.warn('스크롤 컨테이너가 설정되지 않았습니다.');
        return;
      }

      const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
      if (!cardElement) {
        this.logger.warn('카드 요소를 찾을 수 없음', { cardId: card.id });
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
        behavior: 'smooth'
      });

      this.analyticsService.trackEvent('card_scrolled', {
        cardId: card.id
      });

      this.logger.info('카드로 스크롤 완료', { cardId: card.id });
    } catch (error) {
      this.logger.error('카드로 스크롤 실패', { error });
      this.errorHandler.handleError(error as Error, 'FocusManager.scrollToCard');
    } finally {
      timer.stop();
    }
  }

  public setScrollContainer(container: HTMLElement): void {
    this.scrollContainer = container;
    this.logger.debug('스크롤 컨테이너 설정', { 
      containerId: container.id,
      className: container.className
    });
  }

  public focusCard(card: ICard): void {
    if (!this.isInitialized) {
      throw new Error('FocusManager가 초기화되지 않았습니다.');
    }

    const timer = this.performanceMonitor.startTimer('focusCard');
    try {
      this.logger.debug(`카드 포커스 설정 시작: ${card.id}`);
      this.updateFocusState(card.id, true);
      this.scrollToCard(card);
      this.logger.debug(`카드 포커스 설정 완료: ${card.id}`);
    } catch (error) {
      this.errorHandler.handleError(error, `카드 포커스 설정 중 오류 발생: ${card.id}`);
      throw error;
    } finally {
      timer.stop();
    }
  }

  public unfocusCard(card: ICard): void {
    if (!this.isInitialized) {
      throw new Error('FocusManager가 초기화되지 않았습니다.');
    }

    const timer = this.performanceMonitor.startTimer('unfocusCard');
    try {
      this.logger.debug(`카드 포커스 해제 시작: ${card.id}`);
      this.updateFocusState(card.id, false);
      this.logger.debug(`카드 포커스 해제 완료: ${card.id}`);
    } catch (error) {
      this.errorHandler.handleError(error, `카드 포커스 해제 중 오류 발생: ${card.id}`);
      throw error;
    } finally {
      timer.stop();
    }
  }

  public getFocusedCard(): ICard | null {
    const focusStates = this.getAllFocusStates();
    const focusedState = focusStates.find(state => state.isFocused);
    return focusedState ? { id: focusedState.cardId } as ICard : null;
  }

  public isCardFocused(card: ICard): boolean {
    const state = this.getFocusState(card.id);
    return state?.isFocused ?? false;
  }

  public focusNextCard(): void {
    const focusStates = this.getAllFocusStates();
    const currentIndex = focusStates.findIndex(state => state.isFocused);
    if (currentIndex === -1 || currentIndex === focusStates.length - 1) {
      return;
    }
    const nextCard = { id: focusStates[currentIndex + 1].cardId } as ICard;
    this.focusCard(nextCard);
  }

  public focusPreviousCard(): void {
    const focusStates = this.getAllFocusStates();
    const currentIndex = focusStates.findIndex(state => state.isFocused);
    if (currentIndex <= 0) {
      return;
    }
    const previousCard = { id: focusStates[currentIndex - 1].cardId } as ICard;
    this.focusCard(previousCard);
  }

  public focusFirstCard(): void {
    const focusStates = this.getAllFocusStates();
    if (focusStates.length === 0) {
      return;
    }
    const firstCard = { id: focusStates[0].cardId } as ICard;
    this.focusCard(firstCard);
  }

  public focusLastCard(): void {
    const focusStates = this.getAllFocusStates();
    if (focusStates.length === 0) {
      return;
    }
    const lastCard = { id: focusStates[focusStates.length - 1].cardId } as ICard;
    this.focusCard(lastCard);
  }

  public focusCardById(cardId: string): void {
    const card = { id: cardId } as ICard;
    this.focusCard(card);
  }

  public focusCardByIndex(index: number): void {
    const focusStates = this.getAllFocusStates();
    if (index < 0 || index >= focusStates.length) {
      return;
    }
    const card = { id: focusStates[index].cardId } as ICard;
    this.focusCard(card);
  }

  public scrollToFocusedCard(): void {
    const focusedCard = this.getFocusedCard();
    if (focusedCard) {
      this.scrollToCard(focusedCard);
    }
  }

  public centerFocusedCard(): void {
    const focusedCard = this.getFocusedCard();
    if (focusedCard && this.scrollContainer) {
      const cardElement = document.querySelector(`[data-card-id="${focusedCard.id}"]`);
      if (cardElement) {
        const containerRect = this.scrollContainer.getBoundingClientRect();
        const cardRect = cardElement.getBoundingClientRect();
        
        const scrollLeft = this.scrollContainer.scrollLeft + 
          (cardRect.left - containerRect.left) - 
          (containerRect.width - cardRect.width) / 2;
        
        const scrollTop = this.scrollContainer.scrollTop + 
          (cardRect.top - containerRect.top) - 
          (containerRect.height - cardRect.height) / 2;

        this.scrollContainer.scrollTo({
          left: scrollLeft,
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
  }
}