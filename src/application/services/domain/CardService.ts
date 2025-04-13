import { App, TFile } from 'obsidian';
import { ICard, ICardSection } from '@/domain/models/Card';
import { ICardService } from '@/domain/services/domain/ICardService';
import { ICardFactory } from '@/domain/factories/ICardFactory';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { CardUpdatedEvent, CardDeletedEvent } from '@/domain/events/CardEvents';
import { CardServiceError } from '@/domain/errors/CardServiceError';
import { Container } from '@/infrastructure/di/Container';
import { DEFAULT_CARD_CREATE_CONFIG } from '@/domain/models/Card';

/**
 * 카드 서비스 구현체
 */
export class CardService implements ICardService {
  private static instance: CardService;
  private selectedCards: Set<string> = new Set();
  private cardFactory: ICardFactory | null = null;
  private initialized: boolean = false;

  private constructor(
    private readonly app: App,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): CardService {
    if (!CardService.instance) {
      const app = Container.getInstance().resolve<App>('App');
      const errorHandler = Container.getInstance().resolve<IErrorHandler>('IErrorHandler');
      const loggingService = Container.getInstance().resolve<ILoggingService>('ILoggingService');
      const performanceMonitor = Container.getInstance().resolve<IPerformanceMonitor>('IPerformanceMonitor');
      const analyticsService = Container.getInstance().resolve<IAnalyticsService>('IAnalyticsService');
      const eventDispatcher = Container.getInstance().resolve<IEventDispatcher>('IEventDispatcher');
      const cardFactory = Container.getInstance().resolve<ICardFactory>('ICardFactory');

      CardService.instance = new CardService(
        app,
        errorHandler,
        loggingService,
        performanceMonitor,
        analyticsService,
        eventDispatcher
      );
      CardService.instance.setCardFactory(cardFactory);
    }
    return CardService.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    const timer = this.performanceMonitor.startTimer('CardService.initialize');
    try {
      if (this.initialized) {
        this.loggingService.warn('카드 서비스가 이미 초기화되어 있습니다.');
        return;
      }

      this.loggingService.debug('카드 서비스 초기화 시작');
      this.selectedCards.clear();
      const cardFactory = Container.getInstance().resolve<ICardFactory>('ICardFactory');
      this.setCardFactory(cardFactory);
      this.initialized = true;
      this.loggingService.info('카드 서비스 초기화 완료');
    } catch (error) {
      this.loggingService.error('카드 서비스 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardService.initialize');
      throw new CardServiceError('INITIALIZATION_FAILED', '카드 서비스 초기화에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 정리
   */
  cleanup(): void {
    const timer = this.performanceMonitor.startTimer('CardService.cleanup');
    try {
      this.loggingService.debug('카드 서비스 정리 시작');
      this.selectedCards.clear();
      this.cardFactory = null;
      this.initialized = false;
      this.loggingService.info('카드 서비스 정리 완료');
    } catch (error) {
      this.loggingService.error('카드 서비스 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardService.cleanup');
      throw new CardServiceError('CLEANUP_FAILED', '카드 서비스 정리에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 팩토리를 설정합니다.
   */
  setCardFactory(cardFactory: ICardFactory): void {
    this.cardFactory = cardFactory;
  }

  /**
   * 파일로부터 카드 생성
   */
  async createCardFromFile(file: TFile, section: ICardSection): Promise<ICard> {
    if (!this.cardFactory) {
      throw new CardServiceError('CARD_FACTORY_NOT_SET', '카드 팩토리가 설정되지 않았습니다.');
    }

    const timer = this.performanceMonitor.startTimer('CardService.createCardFromFile');
    try {
      this.loggingService.debug('파일로부터 카드 생성 시작', { filePath: file.path });
      const content = await this.app.vault.read(file);
      const metadata = this.app.metadataCache.getFileCache(file);
      const firstHeader = metadata?.headings?.[0]?.heading ?? null;
      const tags = metadata?.tags?.map(tag => tag.tag) || [];
      const properties = metadata?.frontmatter || {};

      const card = this.cardFactory.create(
        file.path,
        file,
        file.path,
        file.name.replace(/\.[^/.]+$/, ''),
        file.name,
        firstHeader,
        content,
        tags,
        properties,
        new Date(file.stat.ctime),
        new Date(file.stat.mtime),
        DEFAULT_CARD_CREATE_CONFIG
      );

      if (!card) {
        throw new CardServiceError('CARD_CREATION_FAILED', '카드 생성에 실패했습니다.');
      }

      this.analyticsService.trackEvent('card_created_from_file', {
        filePath: file.path,
        fileName: file.name,
        hasFirstHeader: !!firstHeader,
        tagCount: tags.length,
        propertyCount: Object.keys(properties).length
      });

      this.loggingService.info('파일로부터 카드 생성 완료', { filePath: file.path });
      return card;
    } catch (error) {
      this.loggingService.error('파일로부터 카드 생성 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'CardService.createCardFromFile');
      throw new CardServiceError('CARD_CREATION_FAILED', '카드 생성에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 파일로부터 카드를 가져옵니다.
   */
  async getCardByFile(file: TFile): Promise<ICard | null> {
    const timer = this.performanceMonitor.startTimer('CardService.getCardByFile');
    try {
      this.loggingService.debug('파일로부터 카드 조회 시작', { filePath: file.path });
      const content = await this.app.vault.read(file);
      const metadata = this.app.metadataCache.getFileCache(file);
      const firstHeader = metadata?.headings?.[0]?.heading ?? null;
      const tags = metadata?.tags?.map(tag => tag.tag) || [];
      const properties = metadata?.frontmatter || {};

      const card = this.cardFactory?.create(
        file.path,
        file,
        file.path,
        file.name.replace(/\.[^/.]+$/, ''),
        file.name,
        firstHeader,
        content,
        tags,
        properties,
        new Date(file.stat.ctime),
        new Date(file.stat.mtime),
        DEFAULT_CARD_CREATE_CONFIG
      ) ?? null;

      this.loggingService.info('파일로부터 카드 조회 완료', { filePath: file.path });
      return card;
    } catch (error) {
      this.loggingService.error('파일로부터 카드 조회 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'CardService.getCardByFile');
      return null;
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 업데이트
   */
  async updateCard(card: ICard, section: ICardSection): Promise<ICard> {
    const timer = this.performanceMonitor.startTimer('CardService.updateCard');
    try {
      this.loggingService.debug('카드 업데이트 시작', { cardId: card.id });
      
      // 카드 업데이트 이벤트 발송
      this.eventDispatcher.dispatch(new CardUpdatedEvent(card));

      this.analyticsService.trackEvent('card_updated', {
        cardId: card.id,
        fileName: card.fileName,
        hasFirstHeader: !!card.firstHeader,
        tagCount: card.tags.length,
        propertyCount: Object.keys(card.properties).length
      });

      this.loggingService.info('카드 업데이트 완료', { cardId: card.id });
      return card;
    } catch (error) {
      this.loggingService.error('카드 업데이트 실패', { error, cardId: card.id });
      this.errorHandler.handleError(error as Error, 'CardService.updateCard');
      throw new CardServiceError(
        '카드 업데이트 중 오류가 발생했습니다.',
        card.id,
        undefined,
        'update',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 삭제
   */
  async deleteCard(card: ICard): Promise<void> {
    const timer = this.performanceMonitor.startTimer('CardService.deleteCard');
    try {
      this.loggingService.debug('카드 삭제 시작', { cardId: card.id });
      
      // 카드 삭제 이벤트 발송
      this.eventDispatcher.dispatch(new CardDeletedEvent(card));

      this.analyticsService.trackEvent('card_deleted', {
        cardId: card.id,
        fileName: card.fileName
      });

      this.loggingService.info('카드 삭제 완료', { cardId: card.id });
    } catch (error) {
      this.loggingService.error('카드 삭제 실패', { error, cardId: card.id });
      this.errorHandler.handleError(error as Error, 'CardService.deleteCard');
      throw new CardServiceError(
        '카드 삭제 중 오류가 발생했습니다.',
        card.id,
        undefined,
        'delete',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 유효성 검사
   */
  validateCard(card: ICard): boolean {
    try {
      if (!card.id) return false;
      if (!card.fileName) return false;
      if (!card.content) return false;
      if (!Array.isArray(card.tags)) return false;
      if (!card.createdAt || !(card.createdAt instanceof Date)) return false;
      if (!card.updatedAt || !(card.updatedAt instanceof Date)) return false;
      if (!card.properties || typeof card.properties !== 'object') return false;
      return true;
    } catch (error) {
      this.loggingService.error('카드 유효성 검사 실패', { error, cardId: card.id });
      return false;
    }
  }
} 