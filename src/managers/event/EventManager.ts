import { IEventManager } from '../../core/interfaces/manager/IEventManager';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { ErrorCode } from '../../core/constants/error.constants';
import { EventHandler, PresetEvent } from '../../core/types/event.types';

/**
 * 이벤트 관리자 클래스
 * 애플리케이션 내 이벤트 처리를 담당합니다.
 */
export class EventManager implements IEventManager {
  /**
   * 이벤트 핸들러 맵
   * 키: 이벤트 이름, 값: 이벤트 핸들러 배열
   */
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  
  /**
   * 생성자
   */
  constructor() {
    console.log('EventManager 초기화됨');
  }
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param handler 이벤트 핸들러 함수
   */
  on(event: string | PresetEvent, handler: EventHandler): void {
    const eventName = typeof event === 'string' ? event : event;
    
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    
    const handlers = this.eventHandlers.get(eventName);
    if (handlers && !handlers.includes(handler)) {
      handlers.push(handler);
    }
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param handler 이벤트 핸들러 함수
   */
  off(event: string | PresetEvent, handler: EventHandler): void {
    const eventName = typeof event === 'string' ? event : event;
    
    if (!this.eventHandlers.has(eventName)) {
      return;
    }
    
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
      
      // 핸들러가 없으면 이벤트 제거
      if (handlers.length === 0) {
        this.eventHandlers.delete(eventName);
      }
    }
  }
  
  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param data 이벤트 데이터
   */
  triggerEvent(event: string | PresetEvent, data?: any): void {
    const eventName = typeof event === 'string' ? event : event;
    
    if (!this.eventHandlers.has(eventName)) {
      return;
    }
    
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          ErrorHandler.handleErrorWithCode(
            ErrorCode.EVENT_HANDLER_ERROR,
            { message: `이벤트 핸들러 실행 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`, event: eventName },
            true
          );
        }
      });
    }
  }
  
  /**
   * 모든 이벤트 리스너 제거
   */
  clearAllEventListeners(): void {
    this.eventHandlers.clear();
  }
  
  /**
   * 특정 이벤트의 모든 리스너 제거
   * @param event 이벤트 이름
   */
  clearEventListeners(event: string | PresetEvent): void {
    const eventName = typeof event === 'string' ? event : event;
    this.eventHandlers.delete(eventName);
  }
  
  /**
   * 이벤트 리스너 추가 (addEventListener 별칭)
   * ICardSetProvider와의 호환성을 위한 메소드입니다.
   * @param eventName 이벤트 이름
   * @param listener 리스너 함수
   */
  addEventListener(eventName: string | PresetEvent, listener: EventHandler): void {
    this.on(eventName, listener);
  }
  
  /**
   * 이벤트 리스너 제거 (removeEventListener 별칭)
   * ICardSetProvider와의 호환성을 위한 메소드입니다.
   * @param eventName 이벤트 이름
   * @param listener 리스너 함수
   */
  removeEventListener(eventName: string | PresetEvent, listener: EventHandler): void {
    this.off(eventName, listener);
  }
} 