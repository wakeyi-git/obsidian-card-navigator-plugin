/**
 * 로그 레벨
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * 로거 인터페이스
 */
export interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error, ...args: any[]): void;
}

/**
 * Obsidian 로거
 */
export class ObsidianLogger implements ILogger {
  private readonly prefix = '[Card Navigator]';

  constructor(private readonly app: any) {}

  debug(message: string, ...args: any[]): void {
    console.debug(this.prefix, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    console.info(this.prefix, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.prefix, message, ...args);
  }

  error(message: string, error?: Error, ...args: any[]): void {
    console.error(this.prefix, message, error, ...args);
    if (error) {
      this.app.notices.show(`Card Navigator Error: ${message}`);
    }
  }
} 