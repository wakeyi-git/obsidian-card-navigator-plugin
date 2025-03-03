import { IEventManager } from '../../core/interfaces/manager/IEventManager';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { ErrorCode } from '../../core/constants/error.constants';
import { EventHandler, PresetEvent } from '../../core/types/event.types';
import { Log } from "src/utils/log/Log";

/**
 * 이벤트 관리자 클래스
 * 컴포넌트 간 이벤트 기반 통신을 관리합니다.
 */
export class EventManager implements IEventManager {
  private static instance: EventManager;
  private listeners: Map<string, Set<(data?: any) => void>>;
  private onceListeners: Map<string, Set<(data?: any) => void>>;

  private constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
    Log.debug("EventManager initialized");
  }

  /**
   * 이벤트 관리자 인스턴스를 가져옵니다.
   * @returns EventManager 인스턴스
   */
  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * 이벤트를 발생시킵니다.
   * @param event 이벤트 이름
   * @param data 이벤트 데이터 (선택사항)
   */
  public emit(event: string, data?: any): void {
    try {
      Log.debug(`Emitting event: ${event}`, data);

      // 일반 리스너 실행
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            Log.error(`Error in event listener for ${event}:`, error);
          }
        });
      }

      // 일회성 리스너 실행 및 제거
      const onceEventListeners = this.onceListeners.get(event);
      if (onceEventListeners) {
        onceEventListeners.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            Log.error(`Error in once event listener for ${event}:`, error);
          }
        });
        this.onceListeners.delete(event);
      }
    } catch (error) {
      Log.error(`Failed to emit event: ${event}`, error);
      throw error;
    }
  }

  /**
   * 이벤트 리스너를 등록합니다.
   * @param event 이벤트 이름
   * @param callback 이벤트 핸들러 함수
   */
  public on(event: string, callback: (data?: any) => void): void {
    try {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event)!.add(callback);
      Log.debug(`Event listener added for: ${event}`);
    } catch (error) {
      Log.error(`Failed to add event listener: ${event}`, error);
      throw error;
    }
  }

  /**
   * 이벤트 리스너를 제거합니다.
   * @param event 이벤트 이름
   * @param callback 제거할 이벤트 핸들러 함수
   */
  public off(event: string, callback: (data?: any) => void): void {
    try {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
        Log.debug(`Event listener removed for: ${event}`);
      }
    } catch (error) {
      Log.error(`Failed to remove event listener: ${event}`, error);
      throw error;
    }
  }

  /**
   * 한 번만 실행되는 이벤트 리스너를 등록합니다.
   * @param event 이벤트 이름
   * @param callback 이벤트 핸들러 함수
   */
  public once(event: string, callback: (data?: any) => void): void {
    try {
      if (!this.onceListeners.has(event)) {
        this.onceListeners.set(event, new Set());
      }
      this.onceListeners.get(event)!.add(callback);
      Log.debug(`Once event listener added for: ${event}`);
    } catch (error) {
      Log.error(`Failed to add once event listener: ${event}`, error);
      throw error;
    }
  }

  /**
   * 특정 이벤트의 모든 리스너를 제거합니다.
   * @param event 이벤트 이름
   */
  public removeAllListeners(event: string): void {
    try {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
      Log.debug(`All listeners removed for event: ${event}`);
    } catch (error) {
      Log.error(`Failed to remove all listeners for event: ${event}`, error);
      throw error;
    }
  }

  /**
   * 등록된 모든 이벤트 리스너를 제거합니다.
   */
  public clearAllListeners(): void {
    try {
      this.listeners.clear();
      this.onceListeners.clear();
      Log.debug("All event listeners cleared");
    } catch (error) {
      Log.error("Failed to clear all event listeners", error);
      throw error;
    }
  }
} 