import { App, TFile } from 'obsidian';
import { ICard, NoteTitleDisplayType } from '@/domain/models/Card';
import { ICardFactory, ICardCreateConfig } from '@/domain/factories/ICardFactory';
import { ICardRenderConfig } from '@/domain/models/CardRenderConfig';
import { ErrorHandler } from '@/infrastructure/ErrorHandler';
import { LoggingService } from '@/infrastructure/LoggingService';
import { PerformanceMonitor } from '@/infrastructure/PerformanceMonitor';
import { AnalyticsService } from '@/infrastructure/AnalyticsService';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardCreatedEvent } from '@/domain/events/CardEvents';
import { CardServiceError } from '@/domain/errors/CardServiceError';
import { FileSystemUtils } from '@/domain/utils/fileSystemUtils';
import { MarkdownRenderer } from '@/domain/utils/markdownRenderer';
import { Container } from '@/infrastructure/di/Container';

/**
 * 카드 팩토리 구현체
 */
export class CardFactory implements ICardFactory {
  private readonly markdownRenderer: MarkdownRenderer;
  private static instance: CardFactory;

  private constructor(
    private readonly app: App,
    private readonly errorHandler: ErrorHandler,
    private readonly loggingService: LoggingService,
    private readonly performanceMonitor: PerformanceMonitor,
    private readonly analyticsService: AnalyticsService,
    private readonly eventDispatcher: DomainEventDispatcher
  ) {
    this.markdownRenderer = new MarkdownRenderer(app);
  }

  static getInstance(): CardFactory {
    if (!CardFactory.instance) {
      const app = Container.getInstance().resolve<App>('App');
      const errorHandler = Container.getInstance().resolve<ErrorHandler>('IErrorHandler');
      const loggingService = Container.getInstance().resolve<LoggingService>('ILoggingService');
      const performanceMonitor = Container.getInstance().resolve<PerformanceMonitor>('IPerformanceMonitor');
      const analyticsService = Container.getInstance().resolve<AnalyticsService>('IAnalyticsService');
      const eventDispatcher = Container.getInstance().resolve<DomainEventDispatcher>('IEventDispatcher');

      CardFactory.instance = new CardFactory(
        app,
        errorHandler,
        loggingService,
        performanceMonitor,
        analyticsService,
        eventDispatcher
      );
    }
    return CardFactory.instance;
  }

  /**
   * 기본 카드 생성
   */
  create(config: ICardCreateConfig): ICard {
    const perfMark = 'CardFactory.create';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 생성 시작', { fileName: config.fileName });

      const file = this.app.vault.getAbstractFileByPath(config.filePath) as TFile;
      if (!file) {
        throw new CardServiceError(
          '파일을 찾을 수 없습니다.',
          config.filePath,
          'create'
        );
      }

      const card: ICard = {
        id: config.filePath,
        file,
        fileName: config.fileName,
        firstHeader: config.firstHeader,
        content: config.content,
        tags: config.tags,
        properties: config.metadata,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
        metadata: config.metadata,
        renderConfig: config.renderConfig,
        titleDisplayType: config.titleDisplayType || NoteTitleDisplayType.FILENAME,
        validate: () => true,
        toString: () => `Card(${config.fileName})`
      };

      this.eventDispatcher.dispatch(new CardCreatedEvent(card));

      this.analyticsService.trackEvent('card_created', {
        fileName: config.fileName,
        hasFirstHeader: !!config.firstHeader,
        tagCount: config.tags.length,
        contentLength: config.content.length
      });

      this.loggingService.info('카드 생성 완료', { fileName: config.fileName });

      return card;
    } catch (error) {
      this.loggingService.error('카드 생성 실패', { 
        error,
        fileName: config.fileName
      });
      this.errorHandler.handleError(error as Error, 'CardFactory.create');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 파일 기반 카드 생성
   */
  async createFromFile(
    filePath: string,
    renderConfig: ICardRenderConfig
  ): Promise<ICard> {
    const perfMark = 'CardFactory.createFromFile';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('파일 기반 카드 생성 시작', { filePath });

      // 파일 시스템 유틸리티를 사용하여 파일 존재 여부 확인
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

      let content = await this.app.vault.read(abstractFile);
      
      // 마크다운 렌더링 설정이 있는 경우 렌더링 수행
      if (renderConfig.renderMarkdown) {
        const renderPerfMark = 'CardFactory.renderMarkdown';
        this.performanceMonitor.startMeasure(renderPerfMark);
        try {
          content = await this.markdownRenderer.render(content, {
            showImages: true,
            highlightCode: true,
            supportCallouts: true,
            supportMath: true
          });
        } finally {
          this.performanceMonitor.endMeasure(renderPerfMark);
        }
      }

      const config: ICardCreateConfig = {
        filePath: abstractFile.path,
        fileName: abstractFile.name,
        firstHeader: metadata.headings?.[0]?.heading || null,
        content,
        tags: metadata.tags?.map(tag => tag.tag) || [],
        createdAt: new Date(abstractFile.stat.ctime),
        updatedAt: new Date(abstractFile.stat.mtime),
        metadata: metadata.frontmatter || {},
        renderConfig,
        titleDisplayType: NoteTitleDisplayType.FILENAME // 기본값으로 파일명 사용
      };

      const card = await this.create(config);

      this.analyticsService.trackEvent('card_created_from_file', {
        filePath,
        renderMarkdown: renderConfig.renderMarkdown,
        hasMetadata: Object.keys(metadata.frontmatter || {}).length > 0
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
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
} 