import { App } from 'obsidian';
import { TFile } from 'obsidian';
import { IFileService } from '../../domain/services/IFileService';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';

/**
 * 파일 서비스 구현체
 */
export class FileService implements IFileService {
  private static instance: FileService;

  private constructor(
    private readonly app: App,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {}

  static getInstance(): FileService {
    if (!FileService.instance) {
      const container = Container.getInstance();
      FileService.instance = new FileService(
        container.resolve('App'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService')
      );
    }
    return FileService.instance;
  }

  /**
   * 서비스 초기화
   */
  initialize(): void {
    const perfMark = 'FileService.initialize';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('파일 서비스 초기화 시작');
      // 초기화 작업 없음
      this.loggingService.info('파일 서비스 초기화 완료');
    } catch (error) {
      this.loggingService.error('파일 서비스 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'FileService.initialize');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    const perfMark = 'FileService.cleanup';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('파일 서비스 정리 시작');
      // 정리 작업 없음
      this.loggingService.info('파일 서비스 정리 완료');
    } catch (error) {
      this.loggingService.error('파일 서비스 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'FileService.cleanup');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 파일 열기
   * @param file 파일
   */
  async openFile(file: TFile): Promise<void> {
    const perfMark = 'FileService.openFile';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('파일 열기 시작', { filePath: file.path });
      const leaf = this.app.workspace.getLeaf(true);
      await leaf.openFile(file);
      this.analyticsService.trackEvent('file_opened', { filePath: file.path });
      this.loggingService.info('파일 열기 완료', { filePath: file.path });
    } catch (error) {
      this.loggingService.error('파일 열기 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'FileService.openFile');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 여러 파일 열기
   * @param files 파일 목록
   */
  async openFiles(files: TFile[]): Promise<void> {
    const perfMark = 'FileService.openFiles';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('여러 파일 열기 시작', { fileCount: files.length });
      const leaf = this.app.workspace.getLeaf(true);
      await Promise.all(files.map(file => leaf.openFile(file)));
      this.analyticsService.trackEvent('files_opened', { fileCount: files.length });
      this.loggingService.info('여러 파일 열기 완료', { fileCount: files.length });
    } catch (error) {
      this.loggingService.error('여러 파일 열기 실패', { error, fileCount: files.length });
      this.errorHandler.handleError(error as Error, 'FileService.openFiles');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 파일 편집을 위해 열기
   * @param file 파일
   */
  async openFileForEditing(file: TFile): Promise<void> {
    const perfMark = 'FileService.openFileForEditing';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('파일 편집을 위해 열기 시작', { filePath: file.path });
      const leaf = this.app.workspace.getLeaf(true);
      await leaf.openFile(file, { active: true });
      this.analyticsService.trackEvent('file_opened_for_editing', { filePath: file.path });
      this.loggingService.info('파일 편집을 위해 열기 완료', { filePath: file.path });
    } catch (error) {
      this.loggingService.error('파일 편집을 위해 열기 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'FileService.openFileForEditing');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 편집창에 링크 삽입
   * @param file 파일
   */
  async insertLinkToEditor(file: TFile): Promise<void> {
    const perfMark = 'FileService.insertLinkToEditor';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('편집창에 링크 삽입 시작', { filePath: file.path });
      const editor = this.app.workspace.activeEditor?.editor;
      if (!editor) {
        throw new Error('활성 편집기가 없습니다.');
      }

      const link = `[[${file.basename}]]`;
      editor.replaceSelection(link);
      this.analyticsService.trackEvent('link_inserted_to_editor', { filePath: file.path });
      this.loggingService.info('편집창에 링크 삽입 완료', { filePath: file.path });
    } catch (error) {
      this.loggingService.error('편집창에 링크 삽입 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'FileService.insertLinkToEditor');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 파일에 링크 삽입
   * @param sourceFile 소스 파일
   * @param targetFile 대상 파일
   */
  async insertLinkToFile(sourceFile: TFile, targetFile: TFile): Promise<void> {
    const perfMark = 'FileService.insertLinkToFile';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('파일에 링크 삽입 시작', { 
        sourcePath: sourceFile.path,
        targetPath: targetFile.path 
      });
      const editor = this.app.workspace.activeEditor?.editor;
      if (!editor) {
        throw new Error('활성 편집기가 없습니다.');
      }

      const link = `[[${sourceFile.basename}]]`;
      editor.replaceSelection(link);
      this.analyticsService.trackEvent('link_inserted_to_file', { 
        sourcePath: sourceFile.path,
        targetPath: targetFile.path 
      });
      this.loggingService.info('파일에 링크 삽입 완료', { 
        sourcePath: sourceFile.path,
        targetPath: targetFile.path 
      });
    } catch (error) {
      this.loggingService.error('파일에 링크 삽입 실패', { 
        error, 
        sourcePath: sourceFile.path,
        targetPath: targetFile.path 
      });
      this.errorHandler.handleError(error as Error, 'FileService.insertLinkToFile');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
} 