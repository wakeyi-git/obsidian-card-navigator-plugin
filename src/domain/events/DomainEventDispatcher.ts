import { DomainEvent } from './DomainEvent';
import { IDomainEventHandler } from './IDomainEventHandler';

/**
 * 도메인 이벤트 디스패처 인터페이스
 */
export interface IDomainEventDispatcher {
  /**
   * 이벤트 리스너 등록
   */
  addEventListener<T extends DomainEvent>(eventType: new () => T, listener: (event: T) => void): void;

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener<T extends DomainEvent>(eventType: new () => T, listener: (event: T) => void): void;

  /**
   * 이벤트 발생
   */
  dispatch(event: DomainEvent): void;
}

/**
 * 도메인 이벤트 디스패처
 */
export class DomainEventDispatcher {
  private handlers: Map<string, IDomainEventHandler<DomainEvent>[]> = new Map();

  /**
   * 이벤트 핸들러를 등록합니다.
   */
  register<T extends DomainEvent>(eventType: string, handler: IDomainEventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)?.push(handler as IDomainEventHandler<DomainEvent>);
  }

  /**
   * 이벤트 핸들러를 제거합니다.
   */
  unregister<T extends DomainEvent>(eventType: string, handler: IDomainEventHandler<T>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.findIndex(h => h === handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 이벤트를 디스패치합니다.
   */
  async dispatch(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      await Promise.all(handlers.map(handler => handler.handle(event)));
    }
  }
} 