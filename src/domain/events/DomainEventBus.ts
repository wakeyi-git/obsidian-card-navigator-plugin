import { EventType, EventListener, EventDataMap, IEventEmitter } from './EventTypes';

/**
 * 도메인 이벤트 버스 클래스
 * 도메인 이벤트를 중앙에서 관리하고 전파하는 싱글톤 클래스입니다.
 */
export class DomainEventBus implements IEventEmitter {
  private static instance: DomainEventBus;
  private listeners: Map<EventType, Set<EventListener<any>>> = new Map();
  
  /**
   * 싱글톤 인스턴스 가져오기
   * @returns DomainEventBus 인스턴스
   */
  public static getInstance(): DomainEventBus {
    if (!DomainEventBus.instance) {
      DomainEventBus.instance = new DomainEventBus();
    }
    return DomainEventBus.instance;
  }
  
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
        console.error(`[DomainEventBus] 이벤트 처리 중 오류 발생: ${event}`, error);
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