import { App } from 'obsidian';
import { TFile } from 'obsidian';
import { IFileService } from '@/domain/services/application/IFileService';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { IEventDispatcher } from '@/domain/events/DomainEvent';
import { FileOpenedEvent, FilesOpenedEvent, FileOpenedForEditingEvent, LinkInsertedToEditorEvent, LinkInsertedToFileEvent } from '@/domain/events/FileEvents';

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
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): FileService {
    if (!FileService.instance) {
      const container = Container.getInstance();
      FileService.instance = new FileService(
        container.resolve('App'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return FileService.instance;
  }

  /**
   * 서비스 초기화
   */
  initialize(): void {
    const timer = this.performanceMonitor.startTimer('FileService.initialize');
    try {
      this.loggingService.debug('파일 서비스 초기화 시작');
      // 초기화 작업 없음
      this.loggingService.info('파일 서비스 초기화 완료');
    } catch (error) {
      this.loggingService.error('파일 서비스 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'FileService.initialize');
    } finally {
      timer.stop();
    }
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    const timer = this.performanceMonitor.startTimer('FileService.cleanup');
    try {
      this.loggingService.debug('파일 서비스 정리 시작');
      // 정리 작업 없음
      this.loggingService.info('파일 서비스 정리 완료');
    } catch (error) {
      this.loggingService.error('파일 서비스 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'FileService.cleanup');
    } finally {
      timer.stop();
    }
  }

  /**
   * 파일을 엽니다.
   * @param file - 열 파일
   */
  async openFile(file: TFile): Promise<void> {
    const timer = this.performanceMonitor.startTimer('FileService.openFile');
    try {
      this.loggingService.debug('파일 열기 시작', { filePath: file.path });
      await this.app.workspace.getLeaf().openFile(file);
      await this.eventDispatcher.dispatch(new FileOpenedEvent(file));
      this.analyticsService.trackEvent('file_opened', { filePath: file.path });
      this.loggingService.info('파일 열기 완료', { filePath: file.path });
    } catch (error) {
      this.loggingService.error('파일 열기 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'FileService.openFile');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 여러 파일을 엽니다.
   * @param files - 열 파일 목록
   */
  async openFiles(files: TFile[]): Promise<void> {
    const timer = this.performanceMonitor.startTimer('FileService.openFiles');
    try {
      this.loggingService.debug('여러 파일 열기 시작', { fileCount: files.length });
      for (const file of files) {
        await this.app.workspace.getLeaf().openFile(file);
      }
      await this.eventDispatcher.dispatch(new FilesOpenedEvent(files));
      this.analyticsService.trackEvent('files_opened', { fileCount: files.length });
      this.loggingService.info('여러 파일 열기 완료', { fileCount: files.length });
    } catch (error) {
      this.loggingService.error('여러 파일 열기 실패', { error, fileCount: files.length });
      this.errorHandler.handleError(error as Error, 'FileService.openFiles');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 파일을 편집 모드로 엽니다.
   * @param file - 편집할 파일
   */
  async openFileForEditing(file: TFile): Promise<void> {
    const timer = this.performanceMonitor.startTimer('FileService.openFileForEditing');
    try {
      this.loggingService.debug('파일 편집을 위해 열기 시작', { filePath: file.path });
      await this.app.workspace.getLeaf().openFile(file, { active: true });
      await this.eventDispatcher.dispatch(new FileOpenedForEditingEvent(file));
      this.analyticsService.trackEvent('file_opened_for_editing', { filePath: file.path });
      this.loggingService.info('파일 편집을 위해 열기 완료', { filePath: file.path });
    } catch (error) {
      this.loggingService.error('파일 편집을 위해 열기 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'FileService.openFileForEditing');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 에디터에 링크를 삽입합니다.
   * @param file - 링크할 파일
   */
  async insertLinkToEditor(file: TFile): Promise<void> {
    const timer = this.performanceMonitor.startTimer('FileService.insertLinkToEditor');
    try {
      this.loggingService.debug('편집창에 링크 삽입 시작', { filePath: file.path });
      const editor = this.app.workspace.activeEditor?.editor;
      if (!editor) {
        throw new Error('활성 편집기가 없습니다.');
      }

      const link = `[[${file.basename}]]`;
      editor.replaceSelection(link);
      await this.eventDispatcher.dispatch(new LinkInsertedToEditorEvent(file));
      this.analyticsService.trackEvent('link_inserted_to_editor', { filePath: file.path });
      this.loggingService.info('편집창에 링크 삽입 완료', { filePath: file.path });
    } catch (error) {
      this.loggingService.error('편집창에 링크 삽입 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'FileService.insertLinkToEditor');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 파일에 링크를 삽입합니다.
   * @param sourceFile - 링크를 삽입할 파일
   * @param targetFile - 링크할 파일
   */
  async insertLinkToFile(sourceFile: TFile, targetFile: TFile): Promise<void> {
    const timer = this.performanceMonitor.startTimer('FileService.insertLinkToFile');
    try {
      this.loggingService.debug('파일에 링크 삽입 시작', { 
        sourcePath: sourceFile.path,
        targetPath: targetFile.path 
      });
      const content = await this.app.vault.read(sourceFile);
      const link = `[[${targetFile.basename}]]`;
      await this.app.vault.modify(sourceFile, content + '\n' + link);
      await this.eventDispatcher.dispatch(new LinkInsertedToFileEvent(sourceFile, targetFile));
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
      timer.stop();
    }
  }
} 