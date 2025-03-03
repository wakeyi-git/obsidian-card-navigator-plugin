import { EventHandler } from '../../types/event.types';
import { PresetEvent } from '../../types/event.types';

/**
 * 이벤트 관리자 인터페이스
 * 컴포넌트 간 이벤트 기반 통신을 위한 인터페이스를 정의합니다.
 */
export interface IEventManager {
  /**
   * 이벤트를 발생시킵니다.
   * @param event 이벤트 이름
   * @param data 이벤트 데이터 (선택사항)
   */
  emit(event: string, data?: any): void;

  /**
   * 이벤트 리스너를 등록합니다.
   * @param event 이벤트 이름
   * @param callback 이벤트 핸들러 함수
   */
  on(event: string, callback: (data?: any) => void): void;

  /**
   * 이벤트 리스너를 제거합니다.
   * @param event 이벤트 이름
   * @param callback 제거할 이벤트 핸들러 함수
   */
  off(event: string, callback: (data?: any) => void): void;

  /**
   * 한 번만 실행되는 이벤트 리스너를 등록합니다.
   * @param event 이벤트 이름
   * @param callback 이벤트 핸들러 함수
   */
  once(event: string, callback: (data?: any) => void): void;

  /**
   * 특정 이벤트의 모든 리스너를 제거합니다.
   * @param event 이벤트 이름
   */
  removeAllListeners(event: string): void;

  /**
   * 등록된 모든 이벤트 리스너를 제거합니다.
   */
  clearAllListeners(): void;
} 