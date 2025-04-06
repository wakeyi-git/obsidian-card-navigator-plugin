import { App, TFile } from 'obsidian';
import { ICard } from '@/domain/models/Card';
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
import { ISettingsService } from '../../domain/services/ISettingsService';

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
    filePath: string,
    fileName: string,
    firstHeader: string | null,
    content: string,
    tags: string[],
    createdAt: Date,
    updatedAt: Date,
    metadata: Record<string, any>
  ): ICard {
    const timer = this.performanceMonitor.startTimer('CardFactory.create');
    try {
      this.loggingService.debug('카드 생성 시작', { fileName });

      const file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
      if (!file) {
        throw new CardServiceError(
          '파일을 찾을 수 없습니다.',
          filePath,
          'create'
        );
      }

      const card: ICard = {
        id: filePath,
        file,
        filePath,
        fileName,
        title: fileName,
        firstHeader,
        content,
        tags,
        properties: metadata,
        createdAt,
        updatedAt,
        metadata,
        config: this.settingsService.getCardConfig(),
        validate: () => true,
        preview: () => ({
          id: filePath,
          filePath,
          fileName,
          firstHeader,
          content,
          tags,
          properties: metadata,
          createdAt,
          updatedAt,
          metadata
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
  async createFromFile(filePath: string): Promise<ICard> {
    const timer = this.performanceMonitor.startTimer('CardFactory.createFromFile');
    try {
      this.loggingService.debug('파일 기반 카드 생성 시작', { filePath });

      const abstractFile = this.app.vault.getAbstractFileByPath(filePath);
      if (!abstractFile) {
        this.loggingService.warn('파일을 찾을 수 없음', { filePath });
        throw new CardServiceError('FILE_NOT_FOUND', `파일을 찾을 수 없습니다: ${filePath}`);
      }

      if (!(abstractFile instanceof TFile)) {
        this.loggingService.warn('유효하지 않은 파일 타입', { filePath });
        throw new CardServiceError('INVALID_FILE_TYPE', `파일이 아닙니다: ${filePath}`);
      }

      if (!FileSystemUtils.isMarkdownFile(abstractFile)) {
        this.loggingService.warn('마크다운 파일이 아님', { filePath });
        throw new CardServiceError('INVALID_FILE_TYPE', `마크다운 파일이 아닙니다: ${filePath}`);
      }

      const metadata = this.app.metadataCache.getFileCache(abstractFile);
      if (!metadata) {
        this.loggingService.warn('메타데이터를 찾을 수 없음', { filePath });
        throw new CardServiceError('METADATA_NOT_FOUND', `파일 메타데이터를 가져올 수 없습니다: ${filePath}`);
      }

      const content = await this.app.vault.read(abstractFile);
      const firstHeader = metadata.headings?.[0]?.heading || null;
      const tags = metadata.tags?.map(tag => tag.tag) || [];
      const properties = metadata.frontmatter || {};

      const card = this.create(
        filePath,
        abstractFile.name,
        firstHeader,
        content,
        tags,
        new Date(abstractFile.stat.ctime),
        new Date(abstractFile.stat.mtime),
        properties
      );

      this.analyticsService.trackEvent('card_created_from_file', {
        filePath,
        hasMetadata: Object.keys(properties).length > 0
      });

      this.loggingService.info('파일 기반 카드 생성 완료', { cardId: card.id, filePath });
      return card;
    } catch (error) {
      this.loggingService.error('파일 기반 카드 생성 실패', { error, filePath });
      this.errorHandler.handleError(error as Error, 'CardFactory.createFromFile');
      if (error instanceof CardServiceError) {
        throw error;
      }
      throw new CardServiceError('CARD_CREATION_FAILED', '카드 생성에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }
} 