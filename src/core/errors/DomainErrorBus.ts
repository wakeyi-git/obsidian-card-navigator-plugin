import { DomainError, ErrorHandler, IErrorBus, IErrorSubscription } from './DomainError';
import { IErrorPayloads } from './ErrorTypes';

/**
 * 도메인 에러 버스 구현체
 */
export class DomainErrorBus implements IErrorBus {
  private static instance: DomainErrorBus;
  private handlers: Map<keyof IErrorPayloads, Set<ErrorHandler<keyof IErrorPayloads>>> = new Map();

  private constructor() {}

  /**
   * 도메인 에러 버스 인스턴스 가져오기
   */
  public static getInstance(): DomainErrorBus {
    if (!DomainErrorBus.instance) {
      DomainErrorBus.instance = new DomainErrorBus();
    }
    return DomainErrorBus.instance;
  }

  /**
   * 에러 발행
   * @param code 에러 코드
   * @param payload 에러 페이로드
   * @param source 에러 소스
   */
  async publish<T extends keyof IErrorPayloads>(
    code: T,
    payload: Omit<IErrorPayloads[T], 'timestamp' | 'source'>,
    source: string = 'system'
  ): Promise<void> {
    const fullPayload = {
      ...payload,
      timestamp: Date.now(),
      source
    } as IErrorPayloads[T];

    const error = new DomainError(code, fullPayload);
    const handlers = this.handlers.get(code);

    if (handlers) {
      const promises = Array.from(handlers).map(handler => handler(error));
      await Promise.all(promises);
    }
  }

  /**
   * 에러 구독
   * @param code 에러 코드
   * @param handler 에러 핸들러
   * @returns 구독 정보
   */
  subscribe<T extends keyof IErrorPayloads>(
    code: T,
    handler: ErrorHandler<T>
  ): IErrorSubscription {
    if (!this.handlers.has(code)) {
      this.handlers.set(code, new Set());
    }

    const handlers = this.handlers.get(code)!;
    handlers.add(handler as ErrorHandler<keyof IErrorPayloads>);

    return {
      unsubscribe: () => {
        handlers.delete(handler as ErrorHandler<keyof IErrorPayloads>);
        if (handlers.size === 0) {
          this.handlers.delete(code);
        }
      }
    };
  }

  /**
   * 모든 에러 구독 해제
   */
  unsubscribeAll(): void {
    this.handlers.clear();
  }
} 