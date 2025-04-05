import { App, TFile } from 'obsidian';
import { IActiveFileWatcher } from '@/domain/services/IActiveFileWatcher';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';

/**
 * 활성 파일 감시자 구현체
 */
export class ActiveFileWatcher implements IActiveFileWatcher {
  private static instance: ActiveFileWatcher;
  private activeFile: TFile | null;
  private subscribers: Set<(file: TFile | null) => void>;
  private isInitializedFlag: boolean;
  private lastFileChangeTime: number = 0;
  private pendingFileChange: TFile | null = null;
  private fileChangeTimeoutId: number | null = null;
  private readonly FILE_CHANGE_DEBOUNCE_TIME = 500; // 500ms로 증가 (원래 300ms)

  private constructor(
    private readonly app: App,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {
    this.activeFile = null;
    this.subscribers = new Set();
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
      this.performanceMonitor.endMeasure(perfMark);
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
    const perfMark = 'ActiveFileWatcher.cleanup';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.info('활성 파일 감시자 정리 시작');

      // 구독자 목록 초기화
      this.subscribers.clear();
      this.activeFile = null;
      
      // 대기 중인 타이머 취소
      if (this.fileChangeTimeoutId !== null) {
        window.clearTimeout(this.fileChangeTimeoutId);
        this.fileChangeTimeoutId = null;
      }
      this.pendingFileChange = null;

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
   * 활성 파일 변경 이벤트 발생 (디바운싱 적용)
   */
  public notifyActiveFileChange(file: TFile | null): void {
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
      this.errorHandler.handleError(error as Error, 'ActiveFileWatcher.notifyActiveFileChange');
      throw error;
    }
  }
  
  /**
   * 실제 파일 변경 처리 (디바운싱 후 호출되는 내부 메서드)
   */
  private processFileChange(file: TFile | null): void {
    const perfMark = 'ActiveFileWatcher.processFileChange';
    this.performanceMonitor.startMeasure(perfMark);
    
    try {
      this.loggingService.debug('활성 파일 변경 이벤트 발생', { 
        filePath: file?.path || null,
        previousFilePath: this.activeFile?.path || null
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

      // 구독자들에게 이벤트 알림
      this.subscribers.forEach(callback => {
        try {
          callback(file);
        } catch (error) {
          this.loggingService.error('구독자 콜백 실행 실패', { error });
        }
      });

      this.analyticsService.trackEvent('active_file_changed', {
        filePath: file?.path || null,
        previousFilePath: this.activeFile?.path || null
      });
      
      this.loggingService.info('활성 파일 변경 이벤트 처리 완료');
    } catch (error) {
      this.loggingService.error('활성 파일 변경 처리 실패', { error });
      this.errorHandler.handleError(error as Error, 'ActiveFileWatcher.processFileChange');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  private handleFileOpen(file: TFile | null): void {
    // 메서드 자체에 추가 로직 없이 notifyActiveFileChange를 호출하여
    // 모든 디바운싱 및 중복 체크 논리를 notifyActiveFileChange에서 처리
    this.notifyActiveFileChange(file);
  }
} 