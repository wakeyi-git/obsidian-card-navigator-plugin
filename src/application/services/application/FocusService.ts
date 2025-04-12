import { TFile } from 'obsidian';
import { ICard } from '@/domain/models/Card';
import { IFocusService, FocusDirection } from '@/domain/services/application/IFocusService';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { ICardService } from '@/domain/services/domain/ICardService';
import { ICardSelectionService } from '@/domain/services/domain/ICardSelectionService';
import { IFocusManager } from '@/domain/managers/IFocusManager';
import { ICardManager } from '@/domain/managers/ICardManager';
import { ICardFactory } from '@/domain/factories/ICardFactory';
import { FocusChangedEvent, FocusBlurredEvent, FocusStateUpdatedEvent } from '@/domain/events/FocusEvents';
import { ILayoutService } from '@/domain/services/application/ILayoutService';
import { LayoutDirection } from '@/domain/models/Layout';

/**
 * 포커스 서비스 구현체
 */
export class FocusService implements IFocusService {
  private initialized: boolean = false;
  private focusEventCallbacks: Array<(event: {
    type: 'focus' | 'blur';
    card: ICard;
    previousCard?: ICard;
  }) => void> = [];

  constructor(
    private readonly cardService: ICardService,
    private readonly cardSelectionService: ICardSelectionService,
    private readonly focusManager: IFocusManager,
    private readonly cardManager: ICardManager,
    private readonly cardFactory: ICardFactory,
    private readonly errorHandler: IErrorHandler,
    private readonly logger: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly layoutService: ILayoutService
  ) {}

  static getInstance(): FocusService {
    const container = Container.getInstance();
    return new FocusService(
      container.resolve('ICardService'),
      container.resolve('ICardSelectionService'),
      container.resolve('IFocusManager'),
      container.resolve('ICardManager'),
      container.resolve('ICardFactory'),
      container.resolve('IErrorHandler'),
      container.resolve('ILoggingService'),
      container.resolve('IPerformanceMonitor'),
      container.resolve('IAnalyticsService'),
      container.resolve('ILayoutService')
    );
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    const timer = this.performanceMonitor.startTimer('FocusService.initialize');
    try {
      this.logger.debug('포커스 서비스 초기화 시작');
      
      // 포커스 상태 변경 이벤트 구독
      this.focusManager.subscribeToFocusEvents((event) => {
        if (event instanceof FocusChangedEvent) {
          const card = this.cardManager.getCardById(event.data.card.id);
          if (!card) return;

          this.focusEventCallbacks.forEach(callback => {
            callback({
              type: 'focus',
              card,
              previousCard: undefined
            });
          });
        } else if (event instanceof FocusBlurredEvent) {
          const card = this.cardManager.getCardById(event.data.card.id);
          if (!card) return;

          this.focusEventCallbacks.forEach(callback => {
            callback({
              type: 'blur',
              card,
              previousCard: undefined
            });
          });
        } else if (event instanceof FocusStateUpdatedEvent) {
          const card = this.cardManager.getCardById(event.data.card.id);
          if (!card) return;

          const previousCard = event.data.previousCard
            ? this.cardManager.getCardById(event.data.previousCard.id)
            : undefined;

          this.focusEventCallbacks.forEach(callback => {
            callback({
              type: event.data.previousCard ? 'blur' : 'focus',
              card,
              previousCard
            });
          });
        }
      });

      this.initialized = true;
      this.logger.info('포커스 서비스 초기화 완료');
    } catch (error) {
      this.logger.error('포커스 서비스 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'FocusService.initialize');
      throw error;
    } finally {
      timer.stop();
    }
  }

  async cleanup(): Promise<void> {
    const timer = this.performanceMonitor.startTimer('FocusService.cleanup');
    try {
      this.logger.debug('포커스 서비스 정리 시작');
      
      this.focusEventCallbacks = [];
      this.initialized = false;
      
      this.logger.info('포커스 서비스 정리 완료');
    } catch (error) {
      this.logger.error('포커스 서비스 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'FocusService.cleanup');
      throw error;
    } finally {
      timer.stop();
    }
  }

  async focusByFile(file: TFile): Promise<void> {
    const timer = this.performanceMonitor.startTimer('FocusService.focusByFile');
    try {
      this.logger.debug('파일로 포커스 설정 시작', { file: file.path });
      
      const card = this.cardManager.getCardByFile(file);
      if (!card) {
        throw new Error(`카드를 찾을 수 없습니다: ${file.path}`);
      }

      await this.focusCard(card);
      
      this.logger.info('파일로 포커스 설정 완료', { file: file.path });
    } catch (error) {
      this.logger.error('파일로 포커스 설정 실패', { error, file: file.path });
      this.errorHandler.handleError(error as Error, 'FocusService.focusByFile');
      throw error;
    } finally {
      timer.stop();
    }
  }

  async focusCard(card: ICard): Promise<void> {
    const timer = this.performanceMonitor.startTimer('FocusService.focusCard');
    try {
      this.logger.debug('카드로 포커스 설정 시작', { cardId: card.id });
      
      // 이전에 포커스된 카드 찾기
      const focusStates = this.focusManager.getAllFocusStates();
      const previousCardId = focusStates
        .find(state => state.isFocused)?.cardId;

      // 이전 카드 포커스 해제
      if (previousCardId) {
        this.focusManager.updateFocusState(previousCardId, false);
      }

      // 새 카드 포커스 설정
      this.focusManager.updateFocusState(card.id, true);
      
      this.logger.info('카드로 포커스 설정 완료', { cardId: card.id });
    } catch (error) {
      this.logger.error('카드로 포커스 설정 실패', { error, cardId: card.id });
      this.errorHandler.handleError(error as Error, 'FocusService.focusCard');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * FocusDirection을 LayoutDirection으로 변환
   * @param direction FocusDirection
   * @returns LayoutDirection
   */
  private convertToLayoutDirection(direction: FocusDirection): LayoutDirection {
    switch (direction) {
      case FocusDirection.UP:
      case FocusDirection.DOWN:
        return LayoutDirection.VERTICAL;
      case FocusDirection.LEFT:
      case FocusDirection.RIGHT:
        return LayoutDirection.HORIZONTAL;
      default:
        return LayoutDirection.VERTICAL;
    }
  }

  async moveFocus(direction: FocusDirection): Promise<void> {
    const timer = this.performanceMonitor.startTimer('FocusService.moveFocus');
    try {
      this.logger.debug('포커스 이동 시작', { direction });
      
      const currentCard = this.getFocusedCard();
      if (!currentCard) {
        throw new Error('포커스된 카드가 없습니다.');
      }

      // FocusDirection을 LayoutDirection으로 변환
      const layoutDirection = this.convertToLayoutDirection(direction);
      
      // LayoutService를 통해 다음 카드 찾기
      const nextCard = this.layoutService.getNextCard(currentCard, layoutDirection);
      if (nextCard) {
        await this.focusCard(nextCard);
      }
      
      this.logger.info('포커스 이동 완료', { direction });
    } catch (error) {
      this.logger.error('포커스 이동 실패', { error, direction });
      this.errorHandler.handleError(error as Error, 'FocusService.moveFocus');
      throw error;
    } finally {
      timer.stop();
    }
  }

  getFocusedCard(): ICard | null {
    const timer = this.performanceMonitor.startTimer('FocusService.getFocusedCard');
    try {
      this.logger.debug('포커스된 카드 조회 시작');
      
      const focusStates = this.focusManager.getAllFocusStates();
      const focusedCardId = focusStates
        .find(state => state.isFocused)?.cardId;

      if (!focusedCardId) {
        return null;
      }

      const card = this.cardManager.getCardById(focusedCardId);
      if (!card) {
        return null;
      }
      
      this.logger.info('포커스된 카드 조회 완료', { cardId: focusedCardId });
      return card;
    } catch (error) {
      this.logger.error('포커스된 카드 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'FocusService.getFocusedCard');
      return null;
    } finally {
      timer.stop();
    }
  }

  subscribeToFocusEvents(callback: (event: {
    type: 'focus' | 'blur';
    card: ICard;
    previousCard?: ICard;
  }) => void): void {
    this.focusEventCallbacks.push(callback);
  }

  unsubscribeFromFocusEvents(callback: (event: {
    type: 'focus' | 'blur';
    card: ICard;
    previousCard?: ICard;
  }) => void): void {
    this.focusEventCallbacks = this.focusEventCallbacks.filter(c => c !== callback);
  }
} 