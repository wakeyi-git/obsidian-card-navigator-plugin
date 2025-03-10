import { EventType, EventListener, EventDataMap, IEventEmitter } from './EventTypes';

/**
 * 도메인 이벤트 버스 클래스
 * 도메인 이벤트를 중앙에서 관리하고 전파하는 싱글톤 클래스입니다.
 */
export class DomainEventBus implements IEventEmitter {
  private static instance: DomainEventBus;
  private listeners: Map<EventType, Set<EventListener<any>>> = new Map();
  private state: Map<string, any> = new Map();
  
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
  on<T extends EventType>(event: T | string, listener: EventListener<any>): void {
    if (!this.listeners.has(event as EventType)) {
      this.listeners.set(event as EventType, new Set());
    }
    
    this.listeners.get(event as EventType)!.add(listener);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 타입
   * @param listener 리스너 함수
   */
  off<T extends EventType>(event: T | string, listener: EventListener<any>): void {
    if (!this.listeners.has(event as EventType)) {
      return;
    }
    
    this.listeners.get(event as EventType)!.delete(listener);
    
    // 리스너가 없으면 맵에서 제거
    if (this.listeners.get(event as EventType)!.size === 0) {
      this.listeners.delete(event as EventType);
    }
  }
  
  /**
   * 이벤트 발생
   * @param event 이벤트 타입
   * @param data 이벤트 데이터
   */
  emit<T extends EventType>(event: T | string, data: any): void {
    if (!this.listeners.has(event as EventType)) {
      return;
    }
    
    console.log(`[DomainEventBus] 이벤트 발생: ${event}`);
    
    // 이벤트 리스너 호출
    this.listeners.get(event as EventType)!.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`[DomainEventBus] 이벤트 처리 중 오류 발생: ${event}`, error);
      }
    });
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
  
  /**
   * 상태 가져오기
   * @param key 상태 키
   * @returns 상태 값
   */
  getState(key: string): any {
    return this.state.get(key);
  }
  
  /**
   * 상태 설정하기
   * @param key 상태 키
   * @param value 상태 값
   */
  setState(key: string, value: any): void {
    this.state.set(key, value);
  }
  
  /**
   * 이벤트에 따라 상태 업데이트
   * @param event 이벤트 타입
   * @param data 이벤트 데이터
   */
  private updateState<T extends EventType>(event: T, data: EventDataMap[T]): void {
    switch (event) {
      case EventType.CARD_SET_SOURCE_TYPE_CHANGED:
        this.setState('cardSetSourceType', (data as any).sourceType);
        break;
      case EventType.CARD_SET_SOURCE_CHANGED:
        this.setState('cardSetSource', (data as any).source);
        break;
      case EventType.LAYOUT_TYPE_CHANGED:
        this.setState('layoutType', (data as any).layoutType);
        break;
      case EventType.LAYOUT_SETTINGS_CHANGED:
        this.setState('layoutSettings', (data as any).settings);
        break;
      case EventType.CARD_DISPLAY_SETTINGS_CHANGED:
        this.setState('cardDisplaySettings', (data as any).settings);
        break;
      case EventType.SORT_TYPE_CHANGED:
        this.setState('sortType', (data as any).sortType);
        break;
      case EventType.SORT_DIRECTION_CHANGED:
        this.setState('sortDirection', (data as any).sortDirection);
        break;
      case EventType.SETTINGS_CHANGED:
        // 설정 변경 이벤트는 여러 설정을 한 번에 변경할 수 있음
        const settings = (data as any).settings;
        const changedKeys = (data as any).changedKeys;
        
        if (settings && changedKeys) {
          for (const key of changedKeys) {
            if (settings[key] !== undefined) {
              this.setState(key, settings[key]);
            }
          }
        }
        break;
    }
  }
} 