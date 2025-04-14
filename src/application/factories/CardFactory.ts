import { App, TFile } from 'obsidian';
import { ICard, ICardCreateConfig, TitleSource, DEFAULT_CARD_CREATE_CONFIG } from '@/domain/models/Card';
import { ICardFactory } from '@/domain/factories/ICardFactory';
import { ErrorHandler } from '@/infrastructure/ErrorHandler';
import { LoggingService } from '@/infrastructure/LoggingService';
import { PerformanceMonitor } from '@/infrastructure/PerformanceMonitor';
import { AnalyticsService } from '@/infrastructure/AnalyticsService';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardCreatedEvent } from '@/domain/events/CardEvents';
import { CardServiceError } from '@/domain/errors/CardServiceError';
import { FileSystemUtils } from '@/domain/utils/fileSystemUtils';
import { CustomMarkdownRenderer } from '@/domain/utils/markdownRenderer';
import { Container } from '@/infrastructure/di/Container';
import { ISettingsService } from '@/domain/services/application/ISettingsService';

/**
 * 카드 팩토리 구현체
 */
export class CardFactory implements ICardFactory {
  private markdownRenderer: CustomMarkdownRenderer;
  private static instance: CardFactory;

  private constructor(
    private readonly app: App,
    private readonly errorHandler: ErrorHandler,
    private readonly loggingService: LoggingService,
    private readonly performanceMonitor: PerformanceMonitor,
    private readonly analyticsService: AnalyticsService,
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly settingsService: ISettingsService
  ) {
    this.markdownRenderer = CustomMarkdownRenderer.getInstance(app);
  }

  static getInstance(): CardFactory {
    if (!CardFactory.instance) {
      const app = Container.getInstance().resolve<App>('App');
      const errorHandler = Container.getInstance().resolve<ErrorHandler>('IErrorHandler');
      const loggingService = Container.getInstance().resolve<LoggingService>('ILoggingService');
      const performanceMonitor = Container.getInstance().resolve<PerformanceMonitor>('IPerformanceMonitor');
      const analyticsService = Container.getInstance().resolve<AnalyticsService>('IAnalyticsService');
      const eventDispatcher = Container.getInstance().resolve<DomainEventDispatcher>('IEventDispatcher');
      const settingsService = Container.getInstance().resolve<ISettingsService>('ISettingsService');

      CardFactory.instance = new CardFactory(
        app,
        errorHandler,
        loggingService,
        performanceMonitor,
        analyticsService,
        eventDispatcher,
        settingsService
      );
    }
    return CardFactory.instance;
  }

  /**
   * 기본 카드 생성
   */
  create(
    id: string,
    file: TFile | null,
    filePath: string,
    title: string,
    fileName: string,
    firstHeader: string | null,
    content: string,
    tags: string[],
    properties: Record<string, unknown>,
    createdAt: Date,
    updatedAt: Date,
    config: ICardCreateConfig
  ): ICard {
    const timer = this.performanceMonitor.startTimer('CardFactory.create');
    try {
      this.loggingService.debug('카드 생성 시작', { fileName });

      const settings = this.settingsService.getSettings();
      const titleSource = settings.card.titleSource || TitleSource.FILE_NAME;
      
      const finalTitle = titleSource === TitleSource.FIRST_HEADER && firstHeader 
        ? firstHeader 
        : fileName.replace(/\.[^/.]+$/, '');

      const card: ICard = {
        id,
        file,
        filePath,
        fileName,
        title: finalTitle,
        firstHeader,
        content,
        tags,
        properties,
        createdAt,
        updatedAt,
        validate: () => true,
        preview: () => ({
          id,
          file,
          filePath,
          fileName,
          title: finalTitle,
          firstHeader,
          content,
          tags,
          properties,
          createdAt,
          updatedAt
        }),
        toString: () => `Card(${fileName})`
      };

      this.eventDispatcher.dispatch(new CardCreatedEvent(card));

      this.analyticsService.trackEvent('card_created', {
        fileName,
        hasFirstHeader: !!firstHeader,
        tagCount: tags.length
      });

      this.loggingService.info('카드 생성 완료', { fileName });

      return card;
    } catch (error) {
      this.loggingService.error('카드 생성 실패', { 
        error,
        fileName
      });
      this.errorHandler.handleError(error as Error, 'CardFactory.create');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 파일 기반 카드 생성
   */
  async createFromFile(filePath: string, config: ICardCreateConfig): Promise<ICard> {
    const timer = this.performanceMonitor.startTimer('CardFactory.createFromFile');
    try {
      this.loggingService.debug('파일 기반 카드 생성 시작', { filePath });

      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!file || !(file instanceof TFile)) {
        throw new CardServiceError(
          '파일을 찾을 수 없습니다.',
          undefined,
          filePath,
          'create'
        );
      }

      const fileContent = await this.app.vault.read(file);
      const firstHeader = FileSystemUtils.extractFirstHeader(fileContent);
      const tags = FileSystemUtils.extractTags(fileContent);
      const properties = FileSystemUtils.extractProperties(fileContent);
      const id = this.generateCardId(filePath);
      
      // 설정에서 타이틀 소스를 가져와서 전달
      const settings = this.settingsService.getSettings();
      const titleConfig: ICardCreateConfig = {
        ...config,
        titleSource: settings.card.titleSource
      };
      const title = this.generateCardTitle(file.basename, firstHeader, titleConfig);

      const card = this.create(
        id,
        file,
        filePath,
        title,
        file.basename,
        firstHeader,
        fileContent,
        tags,
        properties,
        file.stat.ctime ? new Date(file.stat.ctime) : new Date(),
        file.stat.mtime ? new Date(file.stat.mtime) : new Date(),
        titleConfig
      );

      this.analyticsService.trackEvent('card_created_from_file', {
        filePath,
        hasFirstHeader: !!firstHeader,
        tagCount: tags.length
      });

      return card;
    } catch (error) {
      this.loggingService.error('파일 기반 카드 생성 실패', { error, filePath });
      this.errorHandler.handleError(error as Error, 'CardFactory.createFromFile');
      throw new CardServiceError(
        '파일 기반 카드 생성에 실패했습니다.',
        undefined,
        filePath,
        'create',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 생성
   */
  async createCard(file: TFile): Promise<ICard> {
    const timer = this.performanceMonitor.startTimer('CardFactory.createCard');
    try {
      this.loggingService.debug('카드 생성 시작', { fileName: file.name });

      const content = await this.app.vault.read(file);
      const metadata = this.app.metadataCache.getFileCache(file);
      const firstHeader = metadata?.headings?.[0]?.heading ?? null;
      const tags = metadata?.tags?.map(tag => tag.tag) || [];
      const properties = metadata?.frontmatter || {};
      const id = this.generateCardId(file.path);
      
      // 설정에서 타이틀 소스를 가져와서 전달
      const settings = this.settingsService.getSettings();
      const config: ICardCreateConfig = {
        ...DEFAULT_CARD_CREATE_CONFIG,
        titleSource: settings.card.titleSource
      };
      const title = this.generateCardTitle(file.basename, firstHeader, config);

      const card = this.create(
        id,
        file,
        file.path,
        title,
        file.basename,
        firstHeader,
        content,
        tags,
        properties,
        new Date(file.stat.ctime),
        new Date(file.stat.mtime),
        config
      );

      this.loggingService.info('카드 생성 완료', { fileName: file.name });
      return card;
    } catch (error) {
      this.loggingService.error('카드 생성 실패', { error, fileName: file.name });
      this.errorHandler.handleError(error as Error, 'CardFactory.createCard');
      throw new CardServiceError(
        '카드 생성에 실패했습니다.',
        undefined,
        file.name,
        'create',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 여러 카드 생성
   */
  async createCards(files: TFile[]): Promise<ICard[]> {
    const timer = this.performanceMonitor.startTimer('CardFactory.createCards');
    try {
      this.loggingService.debug('여러 카드 생성 시작', { fileCount: files.length });

      const cards = await Promise.all(files.map(file => this.createCard(file)));

      this.loggingService.info('여러 카드 생성 완료', { fileCount: files.length });
      return cards;
    } catch (error) {
      this.loggingService.error('여러 카드 생성 실패', { error, fileCount: files.length });
      this.errorHandler.handleError(error as Error, 'CardFactory.createCards');
      throw new CardServiceError(
        '여러 카드 생성에 실패했습니다.',
        undefined,
        undefined,
        'create',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 업데이트
   */
  async updateCard(card: ICard, file: TFile): Promise<ICard> {
    const timer = this.performanceMonitor.startTimer('CardFactory.updateCard');
    try {
      this.loggingService.debug('카드 업데이트 시작', { cardId: card.id, fileName: file.name });

      const content = await this.app.vault.read(file);
      const metadata = this.app.metadataCache.getFileCache(file);
      const firstHeader = metadata?.headings?.[0]?.heading ?? null;
      const tags = metadata?.tags?.map(tag => tag.tag) || [];
      const properties = metadata?.frontmatter || {};

      const updatedCard = this.create(
        card.id,
        file,
        file.path,
        file.name.replace(/\.[^/.]+$/, ''),
        file.name,
        firstHeader,
        content,
        tags,
        properties,
        card.createdAt,
        new Date(file.stat.mtime),
        DEFAULT_CARD_CREATE_CONFIG
      );

      this.loggingService.info('카드 업데이트 완료', { cardId: card.id, fileName: file.name });
      return updatedCard;
    } catch (error) {
      this.loggingService.error('카드 업데이트 실패', { error, cardId: card.id, fileName: file.name });
      this.errorHandler.handleError(error as Error, 'CardFactory.updateCard');
      throw new CardServiceError(
        '카드 업데이트에 실패했습니다.',
        card.id,
        file.name,
        'update',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 여러 카드 업데이트
   */
  async updateCards(cards: ICard[], files: TFile[]): Promise<ICard[]> {
    const timer = this.performanceMonitor.startTimer('CardFactory.updateCards');
    try {
      this.loggingService.debug('여러 카드 업데이트 시작', { cardCount: cards.length, fileCount: files.length });

      if (cards.length !== files.length) {
        throw new CardServiceError(
          '카드와 파일의 개수가 일치하지 않습니다.',
          undefined,
          undefined,
          'update'
        );
      }

      const updatedCards = await Promise.all(cards.map((card, index) => this.updateCard(card, files[index])));

      this.loggingService.info('여러 카드 업데이트 완료', { cardCount: cards.length, fileCount: files.length });
      return updatedCards;
    } catch (error) {
      this.loggingService.error('여러 카드 업데이트 실패', { error, cardCount: cards.length, fileCount: files.length });
      this.errorHandler.handleError(error as Error, 'CardFactory.updateCards');
      throw new CardServiceError(
        '여러 카드 업데이트에 실패했습니다.',
        undefined,
        undefined,
        'update',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 ID 생성
   */
  generateCardId(filePath: string): string {
    return `card_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  /**
   * 카드 제목 생성
   */
  generateCardTitle(
    fileName: string,
    firstHeader: string | null,
    config: ICardCreateConfig
  ): string {
    const titleSource = config.titleSource || TitleSource.FILE_NAME;

    if (titleSource === TitleSource.FIRST_HEADER) {
      return firstHeader || fileName.replace(/\.[^/.]+$/, ''); // 퍼스트헤더가 없으면 파일명 사용
    }
    return fileName.replace(/\.[^/.]+$/, ''); // 확장자 제거
  }
} 