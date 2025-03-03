import { EventHandler } from '../../types/event.types';
import { PresetEvent } from '../../types/event.types';

/**
 * 이벤트 관리자 인터페이스
 * 애플리케이션 내 이벤트 처리를 위한 인터페이스입니다.
 */
export interface IEventManager {
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param handler 이벤트 핸들러 함수
   */
  on(event: string | PresetEvent, handler: EventHandler): void;
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param handler 이벤트 핸들러 함수
   */
  off(event: string | PresetEvent, handler: EventHandler): void;
  
  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param data 이벤트 데이터
   */
  triggerEvent(event: string | PresetEvent, data?: any): void;
  
  /**
   * 모든 이벤트 리스너 제거
   */
  clearAllEventListeners(): void;
  
  /**
   * 특정 이벤트의 모든 리스너 제거
   * @param event 이벤트 이름
   */
  clearEventListeners(event: string | PresetEvent): void;
  
  /**
   * 이벤트 리스너 추가 (addEventListener 별칭)
   * ICardSetProvider와의 호환성을 위한 메소드입니다.
   * @param eventName 이벤트 이름
   * @param listener 리스너 함수
   */
  addEventListener(eventName: string | PresetEvent, listener: EventHandler): void;
  
  /**
   * 이벤트 리스너 제거 (removeEventListener 별칭)
   * ICardSetProvider와의 호환성을 위한 메소드입니다.
   * @param eventName 이벤트 이름
   * @param listener 리스너 함수
   */
  removeEventListener(eventName: string | PresetEvent, listener: EventHandler): void;
} 