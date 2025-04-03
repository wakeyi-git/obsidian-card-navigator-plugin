import { App, TFile } from 'obsidian';
import { ICard, NoteTitleDisplayType } from '@/domain/models/Card';
import { ICardService } from '@/domain/services/ICardService';
import { ICardFactory } from '@/domain/factories/ICardFactory';
import { ICardRenderConfig, DEFAULT_CARD_RENDER_CONFIG } from '@/domain/models/CardRenderConfig';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/interfaces/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/interfaces/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/interfaces/events/IEventDispatcher';
import { CardCreatedEvent, CardUpdatedEvent, CardDeletedEvent } from '@/domain/events/CardEvents';
import { CardServiceError } from '@/domain/errors/CardServiceError';
import { ICardStyle, DEFAULT_CARD_STYLE } from '@/domain/models/CardStyle';
import { Container } from '@/infrastructure/di/Container';
import { RenderManager } from '@/application/manager/RenderManager';

/**
 * 카드 서비스 구현체
 */
export class CardService implements ICardService {
  private static instance: CardService;
  private readonly renderManager: RenderManager;

  private constructor(
    private readonly app: App,
    private readonly cardFactory: ICardFactory,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {
    this.renderManager = RenderManager.getInstance();
  }

  static getInstance(): CardService {
    if (!CardService.instance) {
      const app = Container.getInstance().resolve<App>('App');
      const cardFactory = Container.getInstance().resolve<ICardFactory>('ICardFactory');
      const errorHandler = Container.getInstance().resolve<IErrorHandler>('IErrorHandler');
      const loggingService = Container.getInstance().resolve<ILoggingService>('ILoggingService');
      const performanceMonitor = Container.getInstance().resolve<IPerformanceMonitor>('IPerformanceMonitor');
      const analyticsService = Container.getInstance().resolve<IAnalyticsService>('IAnalyticsService');
      const eventDispatcher = Container.getInstance().resolve<IEventDispatcher>('IEventDispatcher');

      CardService.instance = new CardService(
        app,
        cardFactory,
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
   * ID로 카드 조회
   */
  async getCardById(id: string): Promise<ICard | null> {
    const perfMark = 'CardService.getCardById';
    this.performanceMonitor.startMeasure(perfMark);
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
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 파일 경로로 카드 조회
   */
  async getCardByPath(filePath: string): Promise<ICard | null> {
    const perfMark = 'CardService.getCardByPath';
    this.performanceMonitor.startMeasure(perfMark);
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
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 파일로부터 카드 조회
   */
  async getCardByFile(file: TFile): Promise<ICard | null> {
    const perfMark = 'CardService.getCardByFile';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('파일로부터 카드 조회 시작', { filePath: file.path });
      const content = await this.app.vault.read(file);
      const metadata = this.app.metadataCache.getFileCache(file);
      const firstHeader = metadata?.headings?.[0]?.heading ?? null;
      const tags = metadata?.tags?.map(tag => tag.tag) || [];
      const properties = metadata?.frontmatter || {};

      const card = this.createCard({
        filePath: file.path,
        fileName: file.name,
        firstHeader,
        content,
        tags,
        createdAt: new Date(file.stat.ctime),
        updatedAt: new Date(file.stat.mtime),
        metadata: properties,
        renderConfig: DEFAULT_CARD_RENDER_CONFIG
      });

      this.loggingService.info('파일로부터 카드 조회 완료', { filePath: file.path });
      return card;
    } catch (error) {
      this.loggingService.error('파일로부터 카드 조회 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'CardService.getCardByFile');
      throw new CardServiceError('CARD_FETCH_FAILED', '카드 조회에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 파일로부터 카드 생성
   */
  async createFromFile(file: TFile): Promise<ICard | null> {
    const perfMark = 'CardService.createFromFile';
    this.performanceMonitor.startMeasure(perfMark);
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
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 기본 카드 생성
   */
  createCard(config: {
    filePath: string;
    fileName: string;
    firstHeader: string | null;
    content: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, any>;
    renderConfig?: ICardRenderConfig;
    titleDisplayType?: NoteTitleDisplayType;
  }): ICard {
    const perfMark = 'CardService.createCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('기본 카드 생성 시작', { filePath: config.filePath });
      const card = this.cardFactory.create({
        ...config,
        renderConfig: config.renderConfig || DEFAULT_CARD_RENDER_CONFIG
      });

      // 카드 생성 이벤트 발송
      this.eventDispatcher.dispatch(new CardCreatedEvent(card));

      this.analyticsService.trackEvent('card_created', {
        filePath: config.filePath,
        fileName: config.fileName,
        hasFirstHeader: !!config.firstHeader,
        tagCount: config.tags.length,
        propertyCount: Object.keys(config.metadata).length
      });

      this.loggingService.info('기본 카드 생성 완료', { filePath: config.filePath });
      return card;
    } catch (error) {
      this.loggingService.error('기본 카드 생성 실패', { error, filePath: config.filePath });
      this.errorHandler.handleError(error as Error, 'CardService.createCard');
      throw new CardServiceError('CARD_CREATION_FAILED', '카드 생성에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 업데이트
   */
  async updateCard(card: ICard): Promise<void> {
    const perfMark = 'CardService.updateCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 업데이트 시작', { cardId: card.id });
      const file = this.app.vault.getAbstractFileByPath(card.id);
      if (!file || !(file instanceof TFile)) {
        throw new Error('파일을 찾을 수 없습니다.');
      }

      await this.app.vault.modify(file, card.content);

      // 카드 업데이트 이벤트 발송
      this.eventDispatcher.dispatch(new CardUpdatedEvent(card));

      this.analyticsService.trackEvent('card_updated', {
        cardId: card.id,
        filePath: card.id,
        hasFirstHeader: !!card.firstHeader,
        tagCount: card.tags.length,
        propertyCount: Object.keys(card.metadata).length
      });

      this.loggingService.info('카드 업데이트 완료', { cardId: card.id });
    } catch (error) {
      this.loggingService.error('카드 업데이트 실패', { error, cardId: card.id });
      this.errorHandler.handleError(error as Error, 'CardService.updateCard');
      throw new CardServiceError('CARD_UPDATE_FAILED', '카드 업데이트에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 삭제
   */
  async deleteCard(cardId: string): Promise<void> {
    const perfMark = 'CardService.deleteCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 삭제 시작', { cardId });
      const file = this.app.vault.getAbstractFileByPath(cardId);
      if (!file || !(file instanceof TFile)) {
        throw new Error('파일을 찾을 수 없습니다.');
      }

      await this.app.vault.delete(file);

      // 카드 삭제 이벤트 발송
      this.eventDispatcher.dispatch(new CardDeletedEvent(cardId));

      this.analyticsService.trackEvent('card_deleted', {
        cardId,
        filePath: cardId
      });

      this.loggingService.info('카드 삭제 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 삭제 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardService.deleteCard');
      throw new CardServiceError('CARD_DELETION_FAILED', '카드 삭제에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 모든 카드 조회
   */
  async getCards(): Promise<ICard[]> {
    const perfMark = 'CardService.getCards';
    this.performanceMonitor.startMeasure(perfMark);
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
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 렌더링
   */
  async renderCard(card: ICard, config: ICardRenderConfig): Promise<string> {
    const perfMark = 'CardService.renderCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 렌더링 시작', { cardId: card.id });
      const style = DEFAULT_CARD_STYLE;
      const renderedContent = await this.renderManager.renderCard(card, config, style);

      this.analyticsService.trackEvent('card_rendered', {
        cardId: card.id,
        renderMarkdown: config.renderMarkdown,
        showImages: config.showImages,
        highlightCode: config.highlightCode,
        supportCallouts: config.supportCallouts,
        supportMath: config.supportMath
      });

      this.loggingService.info('카드 렌더링 완료', { cardId: card.id });
      return renderedContent;
    } catch (error) {
      this.loggingService.error('카드 렌더링 실패', { error, cardId: card.id });
      this.errorHandler.handleError(error as Error, 'CardService.renderCard');
      throw new CardServiceError('CARD_RENDER_FAILED', '카드 렌더링에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 기본 렌더링 설정 가져오기
   */
  getDefaultRenderConfig(): ICardRenderConfig {
    return DEFAULT_CARD_RENDER_CONFIG;
  }

  /**
   * 기본 스타일 가져오기
   */
  getDefaultStyle(): ICardStyle {
    return DEFAULT_CARD_STYLE;
  }
} 