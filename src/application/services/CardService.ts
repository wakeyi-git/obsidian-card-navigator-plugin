import { App, TFile } from 'obsidian';
import { ICard } from '@/domain/models/Card';
import { ICardService } from '@/domain/services/ICardService';
import { ICardFactory } from '@/domain/factories/ICardFactory';
import { ICardConfig } from '@/domain/models/CardConfig';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { CardCreatedEvent, CardUpdatedEvent, CardDeletedEvent, CardSelectedEvent, CardDeselectedEvent, CardRenderingEvent } from '@/domain/events/CardEvents';
import { CardServiceError } from '@/domain/errors/CardServiceError';
import { ICardStyle, DEFAULT_CARD_STYLE } from '@/domain/models/CardStyle';
import { Container } from '@/infrastructure/di/Container';

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

      CardService.instance = new CardService(
        app,
        errorHandler,
        loggingService,
        performanceMonitor,
        analyticsService,
        eventDispatcher
      );
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
   * ID로 카드 조회
   */
  async getCardById(id: string): Promise<ICard | null> {
    const timer = this.performanceMonitor.startTimer('getCardById');
    try {
      this.loggingService.debug('ID로 카드 조회 시작', { id });
      const file = this.app.vault.getAbstractFileByPath(id);
      if (!file || !(file instanceof TFile)) {
        this.loggingService.warn('파일을 찾을 수 없음', { id });
        return null;
      }
      const card = await this.getCardByFile(file);
      this.loggingService.info('ID로 카드 조회 완료', { id });
      return card;
    } catch (error) {
      this.loggingService.error('ID로 카드 조회 실패', { error, id });
      this.errorHandler.handleError(error as Error, 'CardService.getCardById');
      throw new CardServiceError('CARD_FETCH_FAILED', '카드 조회에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 파일 경로로 카드 조회
   */
  async getCardByPath(filePath: string): Promise<ICard | null> {
    const timer = this.performanceMonitor.startTimer('CardService.getCardByPath');
    try {
      this.loggingService.debug('파일 경로로 카드 조회 시작', { filePath });
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!file || !(file instanceof TFile)) {
        this.loggingService.warn('파일을 찾을 수 없음', { filePath });
        return null;
      }
      const card = await this.getCardByFile(file);
      this.loggingService.info('파일 경로로 카드 조회 완료', { filePath });
      return card;
    } catch (error) {
      this.loggingService.error('파일 경로로 카드 조회 실패', { error, filePath });
      this.errorHandler.handleError(error as Error, 'CardService.getCardByPath');
      throw new CardServiceError('CARD_FETCH_FAILED', '카드 조회에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 파일로부터 카드 조회
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

      const card = this.createCard({
        id: file.path,
        fileName: file.name,
        firstHeader,
        content,
        tags,
        createdAt: new Date(file.stat.ctime),
        updatedAt: new Date(file.stat.mtime),
        metadata: properties,
        renderConfig: this.getDefaultRenderConfig()
      });

      this.loggingService.info('파일로부터 카드 조회 완료', { filePath: file.path });
      return card;
    } catch (error) {
      this.loggingService.error('파일로부터 카드 조회 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'CardService.getCardByFile');
      throw new CardServiceError('CARD_FETCH_FAILED', '카드 조회에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 파일로부터 카드 생성
   */
  async createFromFile(file: TFile): Promise<ICard | null> {
    const timer = this.performanceMonitor.startTimer('CardService.createFromFile');
    try {
      this.loggingService.debug('파일로부터 카드 생성 시작', { filePath: file.path });
      const card = await this.getCardByFile(file);
      if (!card) {
        this.loggingService.warn('카드를 생성할 수 없음', { filePath: file.path });
        return null;
      }

      this.analyticsService.trackEvent('card_created_from_file', {
        filePath: file.path,
        fileName: file.name,
        hasFirstHeader: !!card.firstHeader,
        tagCount: card.tags.length,
        propertyCount: Object.keys(card.metadata).length
      });

      this.loggingService.info('파일로부터 카드 생성 완료', { filePath: file.path });
      return card;
    } catch (error) {
      this.loggingService.error('파일로부터 카드 생성 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'CardService.createFromFile');
      return null;
    } finally {
      timer.stop();
    }
  }

  /**
   * 파일로부터 카드 생성
   */
  async createCardFromFile(file: TFile, config: ICardConfig): Promise<ICard> {
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
        file.name,
        firstHeader,
        content,
        tags,
        new Date(file.stat.ctime),
        new Date(file.stat.mtime),
        properties
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
   * 기본 카드 생성
   */
  createCard(config: {
    id: string;
    fileName: string;
    firstHeader: string | null;
    content: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, any>;
    renderConfig?: ICardConfig;
  }): ICard {
    if (!this.cardFactory) {
      throw new CardServiceError('CARD_FACTORY_NOT_SET', '카드 팩토리가 설정되지 않았습니다.');
    }

    const timer = this.performanceMonitor.startTimer('CardService.createCard');
    try {
      this.loggingService.debug('기본 카드 생성 시작', { id: config.id });
      const card = this.cardFactory.create(
        config.id,
        config.fileName,
        config.firstHeader,
        config.content,
        config.tags,
        config.createdAt,
        config.updatedAt,
        config.metadata
      );

      if (!card) {
        throw new CardServiceError('CARD_CREATION_FAILED', '카드 생성에 실패했습니다.');
      }

      // 카드 생성 이벤트 발송
      this.eventDispatcher.dispatch(new CardCreatedEvent(card));

      this.analyticsService.trackEvent('card_created', {
        id: config.id,
        fileName: config.fileName,
        hasFirstHeader: !!config.firstHeader,
        tagCount: config.tags.length,
        propertyCount: Object.keys(config.metadata).length
      });

      this.loggingService.info('기본 카드 생성 완료', { id: config.id });
      return card;
    } catch (error) {
      this.loggingService.error('기본 카드 생성 실패', { error, id: config.id });
      this.errorHandler.handleError(error as Error, 'CardService.createCard');
      throw new CardServiceError('CARD_CREATION_FAILED', '카드 생성에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 업데이트
   */
  async updateCard(card: ICard): Promise<ICard> {
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
   * 모든 카드 조회
   */
  async getCards(): Promise<ICard[]> {
    const timer = this.performanceMonitor.startTimer('CardService.getCards');
    try {
      this.loggingService.debug('모든 카드 조회 시작');
      const files = this.app.vault.getMarkdownFiles();
      const cards = await Promise.all(
        files.map(file => this.getCardByFile(file))
      );
      const result = cards.filter((card): card is ICard => card !== null);

      this.analyticsService.trackEvent('cards_fetched', {
        totalFiles: files.length,
        validCards: result.length
      });

      this.loggingService.info('모든 카드 조회 완료', { 
        totalFiles: files.length,
        validCards: result.length
      });

      return result;
    } catch (error) {
      this.loggingService.error('모든 카드 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardService.getCards');
      throw new CardServiceError('CARD_FETCH_FAILED', '카드 목록 조회에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 렌더링
   */
  async renderCard(card: ICard, config: ICardConfig): Promise<string> {
    const timer = this.performanceMonitor.startTimer('CardService.renderCard');
    try {
      this.loggingService.debug('카드 렌더링 시작', { cardId: card.id });
      
      // 카드 렌더링 이벤트 발송
      this.eventDispatcher.dispatch(new CardRenderingEvent(card));

      this.analyticsService.trackEvent('card_rendering_started', {
        cardId: card.id,
        fileName: card.fileName,
        renderType: config.renderType,
        showImages: config.body.content || false,
        highlightCode: config.body.content || false,
        supportCallouts: config.body.content || false,
        supportMath: config.body.content || false
      });

      this.loggingService.info('카드 렌더링 완료', { cardId: card.id });
      return '';
    } catch (error) {
      this.loggingService.error('카드 렌더링 실패', { error, cardId: card.id });
      this.errorHandler.handleError(error as Error, 'CardService.renderCard');
      throw new CardServiceError(
        '카드 렌더링 중 오류가 발생했습니다.',
        card.id,
        undefined,
        'render',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 기본 렌더링 설정 가져오기
   */
  getDefaultRenderConfig(): ICardConfig {
    return {
      header: {
        display: true,
        fileName: true,
        firstHeader: true,
        content: false,
        tags: true,
        date: true,
        properties: true
      },
      body: {
        display: true,
        fileName: false,
        firstHeader: false,
        content: true,
        tags: false,
        date: false,
        properties: false
      },
      footer: {
        display: true,
        fileName: false,
        firstHeader: false,
        content: false,
        tags: true,
        date: true,
        properties: true
      },
      renderType: 'html',
      showImages: true,
      highlightCode: true,
      supportCallouts: true,
      supportMath: true,
      style: DEFAULT_CARD_STYLE
    };
  }

  /**
   * 기본 스타일 가져오기
   */
  getDefaultStyle(): ICardStyle {
    return DEFAULT_CARD_STYLE;
  }

  /**
   * 카드 선택
   */
  async selectCard(cardId: string): Promise<void> {
    try {
      this.selectedCards.add(cardId);
      const card = await this.getCardById(cardId);
      if (card) {
        await this.eventDispatcher.dispatch(new CardSelectedEvent(card));
      }
      this.loggingService.debug(`[CardService] Card selected: ${cardId}`);
    } catch (error) {
      this.errorHandler.handleError(error, 'CardService.selectCard');
      throw error;
    }
  }

  /**
   * 카드 선택 해제
   */
  async deselectCard(cardId: string): Promise<void> {
    try {
      this.selectedCards.delete(cardId);
      const card = await this.getCardById(cardId);
      if (card) {
        await this.eventDispatcher.dispatch(new CardDeselectedEvent(card));
      }
      this.loggingService.debug(`[CardService] Card deselected: ${cardId}`);
    } catch (error) {
      this.errorHandler.handleError(error, 'CardService.deselectCard');
      throw error;
    }
  }

  /**
   * 선택된 카드 목록 조회
   */
  async getSelectedCards(): Promise<string[]> {
    try {
      return Array.from(this.selectedCards);
    } catch (error) {
      this.errorHandler.handleError(error, 'CardService.getSelectedCards');
      throw error;
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
      if (!card.metadata || typeof card.metadata !== 'object') return false;
      return true;
    } catch (error) {
      this.loggingService.error('카드 유효성 검사 실패', { error, cardId: card.id });
      return false;
    }
  }
} 