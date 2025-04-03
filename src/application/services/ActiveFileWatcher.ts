import { App, TFile } from 'obsidian';
import { IActiveFileWatcher } from '@/domain/services/IActiveFileWatcher';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/interfaces/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/interfaces/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';

/**
 * 활성 파일 감시자 구현체
 */
export class ActiveFileWatcher implements IActiveFileWatcher {
  private static instance: ActiveFileWatcher;
  private activeFile: TFile | null = null;
  private subscribers: Set<(file: TFile | null) => void> = new Set();

  private constructor(
    private readonly app: App,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {}

  public static getInstance(): ActiveFileWatcher {
    if (!ActiveFileWatcher.instance) {
      const container = Container.getInstance();
      ActiveFileWatcher.instance = new ActiveFileWatcher(
        container.resolve('App'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService')
      );
      // 인스턴스 생성 시 자동으로 초기화
      ActiveFileWatcher.instance.initialize();
    }
    return ActiveFileWatcher.instance;
  }

  /**
   * 서비스 초기화
   */
  public initialize(): void {
    const perfMark = 'ActiveFileWatcher.initialize';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.info('활성 파일 감시자 초기화 시작');

      // 초기 활성 파일 설정
      this.activeFile = this.app.workspace.getActiveFile();

      // 활성 파일 변경 이벤트 구독
      this.app.workspace.on('file-open', (file: TFile | null) => {
        if (file !== this.activeFile) {
          this.notifyActiveFileChange(file);
        }
      });

      this.analyticsService.trackEvent('active_file_watcher_initialized');
      this.loggingService.info('활성 파일 감시자 초기화 완료');
    } catch (error) {
      this.loggingService.error('활성 파일 감시자 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'ActiveFileWatcher.initialize');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 서비스 정리
   */
  public cleanup(): void {
    const perfMark = 'ActiveFileWatcher.cleanup';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.info('활성 파일 감시자 정리 시작');

      // 구독자 목록 초기화
      this.subscribers.clear();
      this.activeFile = null;

      this.analyticsService.trackEvent('active_file_watcher_cleaned_up');
      this.loggingService.info('활성 파일 감시자 정리 완료');
    } catch (error) {
      this.loggingService.error('활성 파일 감시자 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'ActiveFileWatcher.cleanup');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 현재 활성 파일 조회
   */
  public getActiveFile(): TFile | null {
    const perfMark = 'ActiveFileWatcher.getActiveFile';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      return this.activeFile;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 활성 파일 변경 이벤트 구독
   */
  public subscribeToActiveFileChanges(callback: (file: TFile | null) => void): void {
    const perfMark = 'ActiveFileWatcher.subscribeToActiveFileChanges';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('활성 파일 변경 이벤트 구독 시작');
      this.subscribers.add(callback);
      this.loggingService.info('활성 파일 변경 이벤트 구독 완료');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 활성 파일 변경 이벤트 구독 해제
   */
  public unsubscribeFromActiveFileChanges(callback: (file: TFile | null) => void): void {
    const perfMark = 'ActiveFileWatcher.unsubscribeFromActiveFileChanges';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('활성 파일 변경 이벤트 구독 해제 시작');
      this.subscribers.delete(callback);
      this.loggingService.info('활성 파일 변경 이벤트 구독 해제 완료');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 활성 파일 변경 이벤트 발생
   */
  public notifyActiveFileChange(file: TFile | null): void {
    const perfMark = 'ActiveFileWatcher.notifyActiveFileChange';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('활성 파일 변경 이벤트 발생', { 
        filePath: file?.path || null,
        previousFilePath: this.activeFile?.path || null
      });

      this.activeFile = file;

      // 구독자들에게 이벤트 알림
      this.subscribers.forEach(callback => {
        try {
          callback(file);
        } catch (error) {
          this.loggingService.error('구독자 콜백 실행 실패', { error });
          this.errorHandler.handleError(error as Error, 'ActiveFileWatcher.notifyActiveFileChange');
        }
      });

      this.analyticsService.trackEvent('active_file_changed', {
        filePath: file?.path || null,
        previousFilePath: this.activeFile?.path || null
      });

      this.loggingService.info('활성 파일 변경 이벤트 처리 완료');
    } catch (error) {
      this.loggingService.error('활성 파일 변경 이벤트 처리 실패', { error });
      this.errorHandler.handleError(error as Error, 'ActiveFileWatcher.notifyActiveFileChange');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
} 