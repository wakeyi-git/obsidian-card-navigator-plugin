/**
 * 로그 레벨 열거형
 */
export enum LogLevel {
  /**
   * 디버그 레벨
   */
  DEBUG = 'debug',
  
  /**
   * 정보 레벨
   */
  INFO = 'info',
  
  /**
   * 경고 레벨
   */
  WARN = 'warn',
  
  /**
   * 오류 레벨
   */
  ERROR = 'error'
}

/**
 * 로깅 유틸리티 클래스
 */
export class Log {
  private static readonly PREFIX = '[Card Navigator]';
  private static logLevel: LogLevel = LogLevel.INFO;
  
  /**
   * 로그 레벨을 설정합니다.
   * @param level 설정할 로그 레벨
   */
  public static setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
  
  /**
   * 디버그 로그를 출력합니다.
   * @param message 로그 메시지
   * @param args 추가 인자
   */
  public static debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`${this.PREFIX} ${message}`, ...args);
    }
  }
  
  /**
   * 정보 로그를 출력합니다.
   * @param message 로그 메시지
   * @param args 추가 인자
   */
  public static info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`${this.PREFIX} ${message}`, ...args);
    }
  }
  
  /**
   * 경고 로그를 출력합니다.
   * @param message 로그 메시지
   * @param args 추가 인자
   */
  public static warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`${this.PREFIX} ${message}`, ...args);
    }
  }
  
  /**
   * 에러 로그를 출력합니다.
   * @param message 로그 메시지
   * @param args 추가 인자
   */
  public static error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`${this.PREFIX} ${message}`, ...args);
    }
  }
  
  /**
   * 현재 로그 레벨에서 로깅해야 하는지 확인합니다.
   * @param level 확인할 로그 레벨
   * @returns 로깅 여부
   */
  private static shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentIndex = levels.indexOf(this.logLevel);
    const targetIndex = levels.indexOf(level);
    return targetIndex >= currentIndex;
  }
} 