import { EventType, EventListener, IEventEmitter, EventDataMap } from '../domain/events/EventTypes';

/**
 * 이벤트 이미터 구현 클래스
 * 타입 안전한 이벤트 처리를 제공합니다.
 */
export class TypedEventEmitter implements IEventEmitter {
  private listeners: Map<EventType, Set<EventListener<any>>> = new Map();
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 타입
   * @param listener 리스너 함수
   */
  on<T extends EventType>(event: T, listener: EventListener<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(listener);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 타입
   * @param listener 리스너 함수
   */
  off<T extends EventType>(event: T, listener: EventListener<T>): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    this.listeners.get(event)!.delete(listener);
    
    // 리스너가 없으면 맵에서 제거
    if (this.listeners.get(event)!.size === 0) {
      this.listeners.delete(event);
    }
  }
  
  /**
   * 이벤트 발생
   * @param event 이벤트 타입
   * @param data 이벤트 데이터
   */
  emit<T extends EventType>(event: T, data: EventDataMap[T]): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    for (const listener of this.listeners.get(event)!) {
      try {
        listener(data);
      } catch (error) {
        console.error(`[EventEmitter] 이벤트 처리 중 오류 발생: ${event}`, error);
      }
    }
  }
  
  /**
   * 모든 이벤트 리스너 제거
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }
  
  /**
   * 특정 이벤트의 모든 리스너 제거
   * @param event 이벤트 타입
   */
  removeAllListenersForEvent<T extends EventType>(event: T): void {
    this.listeners.delete(event);
  }
  
  /**
   * 특정 이벤트의 리스너 수 가져오기
   * @param event 이벤트 타입
   * @returns 리스너 수
   */
  listenerCount<T extends EventType>(event: T): number {
    if (!this.listeners.has(event)) {
      return 0;
    }
    
    return this.listeners.get(event)!.size;
  }
  
  /**
   * 모든 이벤트 타입 가져오기
   * @returns 이벤트 타입 배열
   */
  eventNames(): EventType[] {
    return Array.from(this.listeners.keys());
  }
} 