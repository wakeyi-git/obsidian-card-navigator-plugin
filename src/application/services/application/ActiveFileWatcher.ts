import { App, TFile } from 'obsidian';
import { IActiveFileWatcher } from '@/domain/services/application/IActiveFileWatcher';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { ActiveFileChangedEvent, ActiveFileWatchStartedEvent, ActiveFileWatchStoppedEvent } from '@/domain/events/ActiveFileEvents';

/**
 * 활성 파일 감시자 구현체
 */
export class ActiveFileWatcher implements IActiveFileWatcher {
  private static instance: ActiveFileWatcher;
  private activeFile: TFile | null;
  private isInitializedFlag: boolean;
  private lastFileChangeTime: number = 0;
  private pendingFileChange: TFile | null = null;
  private fileChangeTimeoutId: number | null = null;
  private readonly FILE_CHANGE_DEBOUNCE_TIME = 500; // 500ms로 증가 (원래 300ms)
  private isWatching: boolean = false;

  private constructor(
    private readonly app: App,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {
    this.activeFile = null;
    this.isInitializedFlag = false;
  }

  public static getInstance(): ActiveFileWatcher {
    if (!ActiveFileWatcher.instance) {
      const container = Container.getInstance();
      ActiveFileWatcher.instance = new ActiveFileWatcher(
        container.resolve('App'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
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
    const timer = this.performanceMonitor.startTimer('ActiveFileWatcher.initialize');
    try {
      // 이미 초기화된 경우 중복 작업 방지
      if (this.isInitializedFlag) {
        this.loggingService.debug('활성 파일 감시자가 이미 초기화되어 있습니다.');
        return;
      }
      
      this.loggingService.info('활성 파일 감시자 초기화 시작');
      
      // 현재 활성 파일 저장
      this.activeFile = this.app.workspace.getActiveFile();
      
      // 활성 파일 변경 이벤트 리스너 등록
      this.app.workspace.on('file-open', this.handleFileOpen.bind(this));
      
      // 초기화 완료 표시
      this.isInitializedFlag = true;
      
      // 이벤트 기록
      this.analyticsService.trackEvent('active_file_watcher_initialized');
      
      this.loggingService.info('활성 파일 감시자 초기화 완료');
    } catch (error) {
      this.loggingService.error('활성 파일 감시자 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'ActiveFileWatcher.initialize');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 초기화 여부 확인
   */
  public isInitialized(): boolean {
    return this.isInitializedFlag;
  }

  /**
   * 서비스 정리
   */
  public cleanup(): void {
    const timer = this.performanceMonitor.startTimer('ActiveFileWatcher.cleanup');
    try {
      this.loggingService.info('활성 파일 감시자 정리 시작');

      // 대기 중인 타이머 취소
      if (this.fileChangeTimeoutId !== null) {
        window.clearTimeout(this.fileChangeTimeoutId);
        this.fileChangeTimeoutId = null;
      }
      this.pendingFileChange = null;
      this.activeFile = null;

      this.analyticsService.trackEvent('active_file_watcher_cleaned_up');
      this.loggingService.info('활성 파일 감시자 정리 완료');
    } catch (error) {
      this.loggingService.error('활성 파일 감시자 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'ActiveFileWatcher.cleanup');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 현재 활성 파일 조회
   */
  public getActiveFile(): TFile | null {
    const timer = this.performanceMonitor.startTimer('ActiveFileWatcher.getActiveFile');
    try {
      return this.activeFile;
    } finally {
      timer.stop();
    }
  }

  /**
   * 활성 파일 변경 이벤트 발생 (디바운싱 적용)
   */
  public notifyFileChange(file: TFile | null): void {
    try {
      // 중복 이벤트 필터링 - 정확히 같은 파일이면 무시 (null도 동일하게 처리)
      if ((file === null && this.activeFile === null) ||
          (file && this.activeFile && file.path === this.activeFile.path)) {
        this.loggingService.debug('동일한 파일로의 변경 무시', {
          filePath: file?.path || 'null',
          currentPath: this.activeFile?.path || 'null'
        });
        return;
      }
      
      // 파일 경로 로깅
      const filePath = file?.path || 'null';
      const previousFilePath = this.activeFile?.path || 'null';
      this.loggingService.debug('파일 변경 감지', {
        filePath,
        previousFilePath,
        timeStamp: Date.now()
      });
      
      // 마지막 이벤트로부터 너무 빠른 시간 내에 발생한 이벤트는 디바운싱
      const now = Date.now();
      
      // 항상 디바운싱을 적용하여 여러 번의 연속된 파일 변경을 하나로 처리
      // 기존 타이머 취소
      if (this.fileChangeTimeoutId !== null) {
        window.clearTimeout(this.fileChangeTimeoutId);
        this.loggingService.debug('기존 타이머 취소됨');
      }
      
      // 가장 최근 파일 변경 정보 저장
      this.pendingFileChange = file;
      
      // 디바운스 타이머 시작
      this.fileChangeTimeoutId = window.setTimeout(() => {
        // 최종 파일 변경 처리 전에 한 번 더 중복 체크
        if ((this.pendingFileChange === null && this.activeFile === null) ||
            (this.pendingFileChange && this.activeFile && 
             this.pendingFileChange.path === this.activeFile.path)) {
          this.loggingService.debug('디바운스 후 동일한 파일로의 변경 무시', {
            pendingFilePath: this.pendingFileChange?.path || 'null',
            currentFilePath: this.activeFile?.path || 'null'
          });
          this.fileChangeTimeoutId = null;
          this.pendingFileChange = null;
          return;
        }
        
        this.processFileChange(this.pendingFileChange);
        this.fileChangeTimeoutId = null;
        this.pendingFileChange = null;
      }, this.FILE_CHANGE_DEBOUNCE_TIME);
 
      this.loggingService.debug('파일 변경 이벤트 디바운싱', {
        filePath: filePath,
        previousPath: previousFilePath,
        delay: this.FILE_CHANGE_DEBOUNCE_TIME
      });
    } catch (error) {
      this.loggingService.error('활성 파일 변경 이벤트 처리 실패', { error });
      this.errorHandler.handleError(error as Error, 'ActiveFileWatcher.notifyFileChange');
      throw error;
    }
  }
  
  /**
   * 실제 파일 변경 처리 (디바운싱 후 호출되는 내부 메서드)
   */
  private processFileChange(file: TFile | null): void {
    const timer = this.performanceMonitor.startTimer('ActiveFileWatcher.processFileChange');
    try {
      this.loggingService.debug('활성 파일 변경 이벤트 발생', { 
        filePath: file?.path || 'null',
        previousPath: this.activeFile?.path || 'null'
      });

      // 마지막 처리로부터의 시간 체크 (디바운싱을 이미 적용했지만 추가 확인)
      const now = Date.now();
      if (now - this.lastFileChangeTime < this.FILE_CHANGE_DEBOUNCE_TIME) {
        this.loggingService.debug('너무 빠른 파일 변경 이벤트 무시', {
          elapsed: now - this.lastFileChangeTime,
          threshold: this.FILE_CHANGE_DEBOUNCE_TIME
        });
        return;
      }
      
      // 현재 시간 기록 (디바운싱 목적)
      this.lastFileChangeTime = now;
      
      // 활성 파일 업데이트
      this.activeFile = file;

      // 도메인 이벤트 발행
      this.eventDispatcher.dispatch(new ActiveFileChangedEvent(file));

      this.analyticsService.trackEvent('active_file_changed', {
        filePath: file?.path || null,
        previousFilePath: this.activeFile?.path || null
      });
      
      this.loggingService.info('활성 파일 변경 이벤트 처리 완료');
    } catch (error) {
      this.loggingService.error('활성 파일 변경 처리 실패', { error });
      this.errorHandler.handleError(error as Error, 'ActiveFileWatcher.processFileChange');
    } finally {
      timer.stop();
    }
  }

  private handleFileOpen = (file: TFile | null): void => {
    try {
      this.notifyFileChange(file);
      this.loggingService.info(`활성 파일 변경: ${file?.path || 'null'}`);
    } catch (error) {
      this.errorHandler.handleError(error as Error, '활성 파일 변경 처리 실패');
    }
  };

  public start(): void {
    if (this.isWatching) {
      return;
    }

    try {
      this.app.workspace.on('file-open', this.handleFileOpen);
      this.isWatching = true;
      this.eventDispatcher.dispatch(new ActiveFileWatchStartedEvent(this.activeFile));
      this.loggingService.info('ActiveFileWatcher 시작');
    } catch (error) {
      this.errorHandler.handleError(error as Error, 'ActiveFileWatcher 시작 실패');
    }
  }

  public stop(): void {
    if (!this.isWatching) {
      return;
    }

    try {
      this.app.workspace.off('file-open', this.handleFileOpen);
      this.isWatching = false;
      this.eventDispatcher.dispatch(new ActiveFileWatchStoppedEvent(this.activeFile));
      this.loggingService.info('ActiveFileWatcher 중지');
    } catch (error) {
      this.errorHandler.handleError(error as Error, 'ActiveFileWatcher 중지 실패');
    }
  }
} 