/**
 * 이벤트 핸들러 타입
 */
export type EventHandler = (...args: any[]) => void;

/**
 * 이벤트 매니저 인터페이스
 * 이벤트 관리를 위한 인터페이스입니다.
 */
export interface IEventManager {
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param handler 이벤트 핸들러
   */
  on(event: string, handler: EventHandler): void;
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param handler 이벤트 핸들러
   */
  off(event: string, handler: EventHandler): void;
  
  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param args 이벤트 인자
   */
  emit(event: string, ...args: any[]): void;
  
  /**
   * 한 번만 실행되는 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param handler 이벤트 핸들러
   */
  once(event: string, handler: EventHandler): void;
  
  /**
   * 모든 이벤트 리스너 제거
   * @param event 이벤트 이름 (생략 시 모든 이벤트)
   */
  removeAllListeners(event?: string): void;
}

/**
 * 이벤트 매니저 클래스
 * 이벤트 관리를 위한 클래스입니다.
 */
export class EventManager implements IEventManager {
  private events: Map<string, Set<EventHandler>>;
  
  constructor() {
    this.events = new Map<string, Set<EventHandler>>();
  }
  
  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set<EventHandler>());
    }
    
    this.events.get(event)?.add(handler);
  }
  
  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    
    if (handlers) {
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }
  
  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
  
  once(event: string, handler: EventHandler): void {
    const onceHandler = (...args: any[]) => {
      this.off(event, onceHandler);
      handler(...args);
    };
    
    this.on(event, onceHandler);
  }
  
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
  
  /**
   * 이벤트 리스너 개수 가져오기
   * @param event 이벤트 이름
   * @returns 리스너 개수
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.size || 0;
  }
  
  /**
   * 등록된 이벤트 목록 가져오기
   * @returns 이벤트 목록
   */
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }
} 