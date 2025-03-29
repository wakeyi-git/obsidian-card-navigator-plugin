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
 * 도메인 이벤트 디스패처 클래스
 */
export class DomainEventDispatcher implements IDomainEventDispatcher {
  private listeners: Map<string, Set<Function>> = new Map();

  register<T extends DomainEvent>(eventType: string, handler: IDomainEventHandler<T>): void {
    this.addEventListener(
      class extends DomainEvent {
        constructor() {
          super(eventType);
        }
      },
      (event: T) => {
        handler.handle(event);
      }
    );
  }

  addEventListener<T extends DomainEvent>(eventType: new () => T, listener: (event: T) => void): void {
    const eventName = eventType.name;
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)?.add(listener);
  }

  removeEventListener<T extends DomainEvent>(eventType: new () => T, listener: (event: T) => void): void {
    const eventName = eventType.name;
    this.listeners.get(eventName)?.delete(listener);
  }

  dispatch(event: DomainEvent): void {
    const eventName = event.constructor.name;
    const eventListeners = this.listeners.get(eventName);
    
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error handling event ${eventName}:`, error);
        }
      });
    }
  }
} 