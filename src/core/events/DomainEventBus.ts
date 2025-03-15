import { EventType } from '../../domain/events/EventTypes';

/**
 * 도메인 이벤트 버스
 * 컴포넌트 간 통신을 위한 이벤트 버스입니다.
 */
export class DomainEventBus {
  private listeners: Map<string, Array<(data: any) => void>> = new Map();
  private state: Map<string, any> = new Map();
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 타입
   * @param callback 콜백 함수
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)?.push(callback);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 타입
   * @param callback 콜백 함수
   */
  off(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  /**
   * 이벤트 발생
   * @param event 이벤트 타입
   * @param data 이벤트 데이터
   */
  emit(event: string, data?: any): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`이벤트 처리 중 오류 발생: ${event}`, error);
        }
      });
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
  removeAllListenersForEvent(event: string): void {
    this.listeners.delete(event);
  }
  
  /**
   * 상태 설정
   * @param key 상태 키
   * @param value 상태 값
   */
  setState(key: string, value: any): void {
    this.state.set(key, value);
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
   * 상태 삭제
   * @param key 상태 키
   */
  deleteState(key: string): void {
    this.state.delete(key);
  }
  
  /**
   * 모든 상태 초기화
   */
  clearState(): void {
    this.state.clear();
  }
  
  /**
   * 리스너 수 가져오기
   * @param event 이벤트 타입
   * @returns 리스너 수
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.length || 0;
  }
  
  /**
   * 등록된 이벤트 이름 목록 가져오기
   * @returns 이벤트 이름 목록
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
} 