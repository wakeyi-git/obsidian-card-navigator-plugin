import { ICardManager } from '@/domain/services/ICardManager';
import { ICard } from '@/domain/models/Card';
import { ICardConfig } from '@/domain/models/CardConfig';
import { TFile } from 'obsidian';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { Container } from '@/infrastructure/di/Container';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { CardCreatedEvent, CardUpdatedEvent, CardDeletedEvent } from '@/domain/events/CardEvents';

/**
 * 카드 관리자 구현체
 */
export class CardManager implements ICardManager {
  private static instance: CardManager;
  private cards: Map<string, ICard> = new Map();

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly logger: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): CardManager {
    if (!CardManager.instance) {
      const container = Container.getInstance();
      CardManager.instance = new CardManager(
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IEventDispatcher>('IEventDispatcher')
      );
    }
    return CardManager.instance;
  }

  /**
   * 파일로부터 카드 객체를 가져옵니다.
   */
  getCardByFile(file: TFile): ICard | undefined {
    const timer = this.performanceMonitor.startTimer('CardManager.getCardByFile');
    try {
      this.logger.debug('카드 객체 조회 시작', { filePath: file.path });
      
      const card = this.cards.get(file.path);
      
      this.logger.info('카드 객체 조회 완료', { filePath: file.path });
      return card;
    } catch (error) {
      this.logger.error('카드 객체 조회 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'CardManager.getCardByFile');
      return undefined;
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 ID로부터 카드 객체를 가져옵니다.
   */
  getCardById(cardId: string): ICard | undefined {
    const timer = this.performanceMonitor.startTimer('CardManager.getCardById');
    try {
      this.logger.debug('카드 객체 조회 시작', { cardId });
      
      const card = this.cards.get(cardId);
      
      this.logger.info('카드 객체 조회 완료', { cardId });
      return card;
    } catch (error) {
      this.logger.error('카드 객체 조회 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardManager.getCardById');
      return undefined;
    } finally {
      timer.stop();
    }
  }

  /**
   * 모든 카드 객체를 가져옵니다.
   */
  getAllCards(): ICard[] {
    const timer = this.performanceMonitor.startTimer('CardManager.getAllCards');
    try {
      this.logger.debug('모든 카드 객체 조회 시작');
      
      const cards = Array.from(this.cards.values());
      
      this.logger.info('모든 카드 객체 조회 완료');
      return cards;
    } catch (error) {
      this.logger.error('모든 카드 객체 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardManager.getAllCards');
      return [];
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 객체를 생성합니다.
   */
  createCard(file: TFile): ICard {
    const timer = this.performanceMonitor.startTimer('CardManager.createCard');
    try {
      this.logger.debug('카드 객체 생성 시작', { filePath: file.path });
      
      const card: ICard = {
        id: file.path,
        file: file,
        filePath: file.path,
        fileName: file.basename,
        title: file.basename,
        firstHeader: null,
        content: '',
        tags: [],
        properties: {},
        createdAt: new Date(file.stat.ctime),
        updatedAt: new Date(file.stat.mtime),
        metadata: {},
        config: null as unknown as ICardConfig,
        validate: function() { return true; },
        preview: function() { return this; },
        toString: function() { return this.title; }
      };
      
      this.cards.set(card.id, card);
      
      // 이벤트 발송
      this.eventDispatcher.dispatch(new CardCreatedEvent(card));
      
      this.logger.info('카드 객체 생성 완료', { filePath: file.path });
      return card;
    } catch (error) {
      this.logger.error('카드 객체 생성 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'CardManager.createCard');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 객체를 업데이트합니다.
   */
  updateCard(card: ICard): void {
    const timer = this.performanceMonitor.startTimer('CardManager.updateCard');
    try {
      this.logger.debug('카드 객체 업데이트 시작', { cardId: card.id });
      
      this.cards.set(card.id, card);
      
      // 이벤트 발송
      this.eventDispatcher.dispatch(new CardUpdatedEvent(card));
      
      this.logger.info('카드 객체 업데이트 완료', { cardId: card.id });
    } catch (error) {
      this.logger.error('카드 객체 업데이트 실패', { error, cardId: card.id });
      this.errorHandler.handleError(error as Error, 'CardManager.updateCard');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 객체를 삭제합니다.
   */
  deleteCard(cardId: string): void {
    const timer = this.performanceMonitor.startTimer('CardManager.deleteCard');
    try {
      this.logger.debug('카드 객체 삭제 시작', { cardId });
      
      const card = this.cards.get(cardId);
      if (card) {
        this.cards.delete(cardId);
        
        // 이벤트 발송
        this.eventDispatcher.dispatch(new CardDeletedEvent(card));
      }
      
      this.logger.info('카드 객체 삭제 완료', { cardId });
    } catch (error) {
      this.logger.error('카드 객체 삭제 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardManager.deleteCard');
    } finally {
      timer.stop();
    }
  }
} 