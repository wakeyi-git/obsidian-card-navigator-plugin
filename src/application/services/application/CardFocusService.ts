import { ICard } from '@/domain/models/Card';
import { ICardFocusService, IFocusEvent } from '@/domain/services/application/ICardFocusService';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { FocusManager } from '@/application/manager/FocusManager';
import { IScrollService } from '@/domain/services/application/IScrollService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { FocusChangedEvent, FocusBlurredEvent, FocusStateUpdatedEvent } from '@/domain/events/FocusEvents';
import { ICardManager } from '@/domain/managers/ICardManager';

/**
 * 카드 포커스 서비스 구현체
 */
export class CardFocusService implements ICardFocusService {
    private static instance: CardFocusService | null = null;
    private focusedCard: ICard | null = null;
    private isInitialized = false;
    private focusManager: FocusManager;
    private scrollService: IScrollService;
    private errorHandler: IErrorHandler;
    private logger: ILoggingService;
    private performanceMonitor: IPerformanceMonitor;
    private analyticsService: IAnalyticsService;
    private eventDispatcher: IEventDispatcher;
    private cardManager: ICardManager;

    private constructor(
        focusManager: FocusManager,
        scrollService: IScrollService,
        errorHandler: IErrorHandler,
        logger: ILoggingService,
        performanceMonitor: IPerformanceMonitor,
        analyticsService: IAnalyticsService,
        eventDispatcher: IEventDispatcher,
        cardManager: ICardManager
    ) {
        this.focusManager = focusManager;
        this.scrollService = scrollService;
        this.errorHandler = errorHandler;
        this.logger = logger;
        this.performanceMonitor = performanceMonitor;
        this.analyticsService = analyticsService;
        this.eventDispatcher = eventDispatcher;
        this.cardManager = cardManager;
    }

    public static getInstance(): CardFocusService {
        if (!CardFocusService.instance) {
            const container = Container.getInstance();
            CardFocusService.instance = new CardFocusService(
                container.resolve<FocusManager>('IFocusManager'),
                container.resolve<IScrollService>('IScrollService'),
                container.resolve<IErrorHandler>('IErrorHandler'),
                container.resolve<ILoggingService>('ILoggingService'),
                container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
                container.resolve<IAnalyticsService>('IAnalyticsService'),
                container.resolve<IEventDispatcher>('IEventDispatcher'),
                container.resolve<ICardManager>('ICardManager')
            );
        }
        return CardFocusService.instance;
    }

    /**
     * 초기화
     */
    public initialize(): void {
        if (this.isInitialized) {
            this.logger.warn('카드 포커스 서비스가 이미 초기화되어 있습니다.');
            return;
        }

        this.logger.debug('카드 포커스 서비스 초기화 시작');
        this.focusManager.initialize();
        this.scrollService.initialize();
        this.isInitialized = true;
        this.logger.info('카드 포커스 서비스 초기화 완료');
    }

    /**
     * 정리
     */
    public cleanup(): void {
        if (!this.isInitialized) {
            this.logger.debug('카드 포커스 서비스가 초기화되지 않았습니다.');
            return;
        }

        this.logger.debug('카드 포커스 서비스 정리 시작');
        this.focusManager.cleanup();
        this.scrollService.cleanup();
        this.focusedCard = null;
        this.isInitialized = false;
        this.logger.info('카드 포커스 서비스 정리 완료');
    }

    /**
     * 카드에 포커스 설정
     */
    focusCard(card: ICard): void {
        const timer = this.performanceMonitor.startTimer('CardFocusService.focusCard');
        try {
            this.logger.debug('카드 포커스 설정 시작', { cardId: card.id });
            
            // FocusManager를 통해 포커스 상태 업데이트
            this.focusManager.updateFocusState(card.id, true);
            
            // 카드를 뷰포트 중앙에 위치
            this.scrollService.centerCard(card);
            
            this.logger.info('카드 포커스 설정 완료', { cardId: card.id });
        } catch (error) {
            this.logger.error('카드 포커스 설정 실패', { error, cardId: card.id });
            this.errorHandler.handleError(error as Error, 'CardFocusService.focusCard');
        } finally {
            timer.stop();
        }
    }

    /**
     * 포커스 해제
     */
    blurCard(): void {
        const timer = this.performanceMonitor.startTimer('CardFocusService.blurCard');
        try {
            this.logger.debug('카드 포커스 해제 시작');
            
            const focusedCard = this.getFocusedCard();
            if (focusedCard) {
                this.focusManager.updateFocusState(focusedCard.id, false);
            }
            
            this.logger.info('카드 포커스 해제 완료');
        } catch (error) {
            this.logger.error('카드 포커스 해제 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardFocusService.blurCard');
        } finally {
            timer.stop();
        }
    }

    /**
     * 포커스된 카드 조회
     */
    getFocusedCard(): ICard | null {
        const focusStates = this.focusManager.getAllFocusStates();
        const focusedCardId = focusStates
            .find(state => state.isFocused)?.cardId;

        if (!focusedCardId) {
            return null;
        }

        const card = this.cardManager.getCardById(focusedCardId);
        return card || null;
    }

    /**
     * 포커스 이벤트 구독
     */
    subscribeToFocusEvents(callback: (event: IFocusEvent) => void): void {
        this.focusManager.subscribeToFocusEvents((event) => {
            if (event instanceof FocusChangedEvent) {
                const focusEvent: IFocusEvent = {
                    type: 'focus',
                    cardId: event.data.card.id,
                    timestamp: new Date()
                };
                callback(focusEvent);
            } else if (event instanceof FocusBlurredEvent) {
                const focusEvent: IFocusEvent = {
                    type: 'blur',
                    cardId: event.data.card.id,
                    timestamp: new Date()
                };
                callback(focusEvent);
            } else if (event instanceof FocusStateUpdatedEvent) {
                const focusEvent: IFocusEvent = {
                    type: event.data.previousCard ? 'blur' : 'focus',
                    cardId: event.data.card.id,
                    previousCardId: event.data.previousCard?.id,
                    timestamp: new Date()
                };
                callback(focusEvent);
            }
        });
    }

    /**
     * 포커스 이벤트 구독 해제
     */
    unsubscribeFromFocusEvents(callback: (event: IFocusEvent) => void): void {
        this.focusManager.unsubscribeFromFocusEvents((event) => {
            if (event instanceof FocusChangedEvent) {
                const focusEvent: IFocusEvent = {
                    type: 'focus',
                    cardId: event.data.card.id,
                    timestamp: new Date()
                };
                callback(focusEvent);
            } else if (event instanceof FocusBlurredEvent) {
                const focusEvent: IFocusEvent = {
                    type: 'blur',
                    cardId: event.data.card.id,
                    timestamp: new Date()
                };
                callback(focusEvent);
            } else if (event instanceof FocusStateUpdatedEvent) {
                const focusEvent: IFocusEvent = {
                    type: event.data.previousCard ? 'blur' : 'focus',
                    cardId: event.data.card.id,
                    previousCardId: event.data.previousCard?.id,
                    timestamp: new Date()
                };
                callback(focusEvent);
            }
        });
    }
}