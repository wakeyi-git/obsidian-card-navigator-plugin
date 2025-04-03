import { App } from 'obsidian';
import { TFile } from 'obsidian';
import { IClipboardService } from '../../domain/services/IClipboardService';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/interfaces/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/interfaces/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';

/**
 * 클립보드 서비스 구현체
 */
export class ClipboardService implements IClipboardService {
  private static instance: ClipboardService;

  private constructor(
    private readonly app: App,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {}

  static getInstance(): ClipboardService {
    if (!ClipboardService.instance) {
      const container = Container.getInstance();
      ClipboardService.instance = new ClipboardService(
        container.resolve('App'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService')
      );
    }
    return ClipboardService.instance;
  }

  /**
   * 서비스 초기화
   */
  initialize(): void {
    const perfMark = 'ClipboardService.initialize';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('클립보드 서비스 초기화 시작');
      // 초기화 작업 없음
      this.loggingService.info('클립보드 서비스 초기화 완료');
    } catch (error) {
      this.loggingService.error('클립보드 서비스 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'ClipboardService.initialize');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    const perfMark = 'ClipboardService.cleanup';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('클립보드 서비스 정리 시작');
      // 정리 작업 없음
      this.loggingService.info('클립보드 서비스 정리 완료');
    } catch (error) {
      this.loggingService.error('클립보드 서비스 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'ClipboardService.cleanup');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 파일 링크 복사
   * @param file 파일
   */
  async copyLink(file: TFile): Promise<void> {
    const perfMark = 'ClipboardService.copyLink';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('파일 링크 복사 시작', { filePath: file.path });
      const link = `[[${file.basename}]]`;
      await navigator.clipboard.writeText(link);
      this.analyticsService.trackEvent('file_link_copied', { filePath: file.path });
      this.loggingService.info('파일 링크 복사 완료', { filePath: file.path });
    } catch (error) {
      this.loggingService.error('파일 링크 복사 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'ClipboardService.copyLink');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 파일 내용 복사
   * @param file 파일
   */
  async copyContent(file: TFile): Promise<void> {
    const perfMark = 'ClipboardService.copyContent';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('파일 내용 복사 시작', { filePath: file.path });
      const content = await this.app.vault.read(file);
      await navigator.clipboard.writeText(content);
      this.analyticsService.trackEvent('file_content_copied', { filePath: file.path });
      this.loggingService.info('파일 내용 복사 완료', { filePath: file.path });
    } catch (error) {
      this.loggingService.error('파일 내용 복사 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'ClipboardService.copyContent');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 여러 파일의 링크 복사
   * @param files 파일 목록
   */
  async copyLinks(files: TFile[]): Promise<void> {
    const perfMark = 'ClipboardService.copyLinks';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('여러 파일 링크 복사 시작', { fileCount: files.length });
      const links = files.map(file => `[[${file.basename}]]`).join('\n');
      await navigator.clipboard.writeText(links);
      this.analyticsService.trackEvent('file_links_copied', { fileCount: files.length });
      this.loggingService.info('여러 파일 링크 복사 완료', { fileCount: files.length });
    } catch (error) {
      this.loggingService.error('여러 파일 링크 복사 실패', { error, fileCount: files.length });
      this.errorHandler.handleError(error as Error, 'ClipboardService.copyLinks');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 여러 파일의 내용 복사
   * @param files 파일 목록
   */
  async copyContents(files: TFile[]): Promise<void> {
    const perfMark = 'ClipboardService.copyContents';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('여러 파일 내용 복사 시작', { fileCount: files.length });
      const contents = await Promise.all(
        files.map(file => this.app.vault.read(file))
      );
      await navigator.clipboard.writeText(contents.join('\n\n---\n\n'));
      this.analyticsService.trackEvent('file_contents_copied', { fileCount: files.length });
      this.loggingService.info('여러 파일 내용 복사 완료', { fileCount: files.length });
    } catch (error) {
      this.loggingService.error('여러 파일 내용 복사 실패', { error, fileCount: files.length });
      this.errorHandler.handleError(error as Error, 'ClipboardService.copyContents');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
} 