/**
 * 로그 레벨 열거형
 */
export enum LogLevel {
  /**
   * 디버그 레벨
   */
  DEBUG = 'DEBUG',
  
  /**
   * 정보 레벨
   */
  INFO = 'INFO',
  
  /**
   * 경고 레벨
   */
  WARN = 'WARN',
  
  /**
   * 오류 레벨
   */
  ERROR = 'ERROR'
}

/**
 * 로깅 클래스
 * 애플리케이션 전체에서 일관된 로깅을 제공합니다.
 */
export class Log {
  /**
   * 현재 로그 레벨
   * @private
   */
  private static currentLevel: LogLevel = LogLevel.INFO;
  
  /**
   * 로그 활성화 여부
   * @private
   */
  private static enabled: boolean = true;
  
  /**
   * 로그 레벨 설정
   * @param level 로그 레벨
   */
  public static setLevel(level: LogLevel): void {
    Log.currentLevel = level;
  }
  
  /**
   * 로깅 활성화/비활성화
   * @param enabled 활성화 여부
   */
  public static setEnabled(enabled: boolean): void {
    Log.enabled = enabled;
  }
  
  /**
   * 디버그 로그 출력
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  public static debug(message: string, data?: any): void {
    Log.log(LogLevel.DEBUG, message, data);
  }
  
  /**
   * 정보 로그 출력
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  public static info(message: string, data?: any): void {
    Log.log(LogLevel.INFO, message, data);
  }
  
  /**
   * 경고 로그 출력
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  public static warn(message: string, data?: any): void {
    Log.log(LogLevel.WARN, message, data);
  }
  
  /**
   * 오류 로그 출력
   * @param message 로그 메시지
   * @param error 오류 객체
   */
  public static error(message: string, error?: unknown): void {
    Log.log(LogLevel.ERROR, message, error);
  }
  
  /**
   * 로그 출력 함수
   * @param level 로그 레벨
   * @param message 로그 메시지
   * @param data 추가 데이터
   * @private
   */
  private static log(level: LogLevel, message: string, data?: any): void {
    if (!Log.enabled || !Log.shouldLog(level)) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const prefix = `[Card Navigator] [${timestamp}] [${level}]`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${message}`, data || '');
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${message}`, data || '');
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${message}`, data || '');
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${message}`, data || '');
        if (data instanceof Error && data.stack) {
          console.error(`${prefix} Stack trace:`, data.stack);
        }
        break;
    }
  }
  
  /**
   * 현재 레벨에서 로깅해야 하는지 확인
   * @param level 확인할 로그 레벨
   * @returns 로깅 여부
   * @private
   */
  private static shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(Log.currentLevel);
    const targetLevelIndex = levels.indexOf(level);
    
    return targetLevelIndex >= currentLevelIndex;
  }
} 