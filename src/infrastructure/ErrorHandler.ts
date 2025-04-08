import { Notice } from 'obsidian';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { Container } from '@/infrastructure/di/Container';
import { ErrorHandlerError } from '@/domain/errors/ErrorHandlerError';
import { CacheServiceError } from '@/domain/errors/CacheServiceError';
import { CardServiceError } from '@/domain/errors/CardServiceError';
import { LayoutServiceError } from '@/domain/errors/LayoutServiceError';
import { SearchServiceError } from '@/domain/errors/SearchServiceError';
import { EventError } from '@/domain/errors/EventError';
import { PresetError } from '@/domain/errors/PresetError';
import { CardSetError } from '@/domain/errors/CardSetError';

/**
 * 에러 처리 서비스
 * - 전역 에러 처리 및 로깅 담당
 */
export class ErrorHandler implements IErrorHandler {
  private static instance: ErrorHandler;
  private readonly logger: ILoggingService;

  private constructor() {
    const container = Container.getInstance();
    this.logger = container.resolve('ILoggingService');
  }

  /**
   * ErrorHandler 인스턴스 가져오기
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 에러를 처리하고 로깅합니다.
   */
  public handleError(error: Error, context: string): void {
    try {
      this.logger.error(`[${context}] ${error.message}`, error);

      if (error instanceof ErrorHandlerError) {
        this.handleErrorHandlerError(error, context);
      } else if (error instanceof CacheServiceError) {
        this.handleCacheError(error, context);
      } else if (error instanceof CardServiceError) {
        this.handleCardError(error, context);
      } else if (error instanceof LayoutServiceError) {
        this.handleLayoutError(error, context);
      } else if (error instanceof PresetError) {
        this.handlePresetError(error, context);
      } else if (error instanceof CardSetError) {
        this.handleCardSetError(error, context);
      } else if (error instanceof SearchServiceError) {
        this.handleSearchError(error, context);
      } else if (error instanceof EventError) {
        this.handleEventError(error, context);
      } else {
        this.handleUnknownError(error, context);
      }
    } catch (e) {
      this.handleUnknownError(e as Error, 'ErrorHandler');
    }
  }

  private handleErrorHandlerError(error: ErrorHandlerError, context: string): void {
    new Notice(`[${context}] 에러 처리 중 오류가 발생했습니다: ${error.message}`);
  }

  private handleCacheError(error: CacheServiceError, context: string): void {
    new Notice(`[${context}] 캐시 처리 중 오류가 발생했습니다: ${error.message}`);
  }

  private handleCardError(error: CardServiceError, context: string): void {
    new Notice(`[${context}] 카드 처리 중 오류가 발생했습니다: ${error.message}`);
  }

  private handleLayoutError(error: LayoutServiceError, context: string): void {
    new Notice(`[${context}] 레이아웃 처리 중 오류가 발생했습니다: ${error.message}`);
  }

  private handlePresetError(error: PresetError, context: string): void {
    new Notice(`[${context}] 프리셋 처리 중 오류가 발생했습니다: ${error.message}`);
  }

  private handleCardSetError(error: CardSetError, context: string): void {
    new Notice(`[${context}] 카드셋 처리 중 오류가 발생했습니다: ${error.message}`);
  }

  private handleSearchError(error: SearchServiceError, context: string): void {
    new Notice(`[${context}] 검색 처리 중 오류가 발생했습니다: ${error.message}`);
  }

  private handleEventError(error: EventError, context: string): void {
    new Notice(`[${context}] 이벤트 처리 중 오류가 발생했습니다: ${error.message}`);
  }

  private handleUnknownError(error: Error, context: string): void {
    new Notice(`[${context}] 알 수 없는 오류가 발생했습니다: ${error.message}`);
  }

  /**
   * Promise 기반 비동기 작업의 에러를 처리합니다.
   */
  public async handlePromise<T>(
    promise: Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      this.handleError(error as Error, context);
      throw error;
    }
  }
} 