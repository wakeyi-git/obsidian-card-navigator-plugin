import { CardNavigatorSettings } from '../main';
import CardNavigatorPlugin from '../main';
import { TypedEventEmitter } from '../infrastructure/EventEmitter';
import { EventType, SettingsChangedEventData } from '../domain/events/EventTypes';

/**
 * 설정 서비스 인터페이스
 * 설정 관리를 위한 인터페이스입니다.
 */
export interface ISettingsService {
  /**
   * 설정 가져오기
   * @returns 현재 설정
   */
  getSettings(): CardNavigatorSettings;
  
  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   * @param save 설정 저장 여부
   */
  updateSettings(settings: Partial<CardNavigatorSettings>, save?: boolean): Promise<void>;
  
  /**
   * 설정 저장
   */
  saveSettings(): Promise<void>;
  
  /**
   * 설정 초기화
   */
  resetSettings(): Promise<void>;
  
  /**
   * 설정 변경 이벤트 리스너 등록
   * @param listener 리스너 함수
   */
  onSettingsChanged(listener: (data: SettingsChangedEventData) => void): void;
  
  /**
   * 설정 변경 이벤트 리스너 제거
   * @param listener 리스너 함수
   */
  offSettingsChanged(listener: (data: SettingsChangedEventData) => void): void;
}

/**
 * 설정 서비스 구현 클래스
 * 설정 관리를 위한 서비스입니다.
 */
export class SettingsService implements ISettingsService {
  private plugin: CardNavigatorPlugin;
  private eventEmitter: TypedEventEmitter;
  
  /**
   * 생성자
   * @param plugin 플러그인 인스턴스
   */
  constructor(plugin: CardNavigatorPlugin) {
    this.plugin = plugin;
    this.eventEmitter = new TypedEventEmitter();
  }
  
  /**
   * 설정 가져오기
   * @returns 현재 설정
   */
  getSettings(): CardNavigatorSettings {
    return this.plugin.settings;
  }
  
  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   * @param save 설정 저장 여부 (기본값: true)
   */
  async updateSettings(settings: Partial<CardNavigatorSettings>, save = true): Promise<void> {
    // 변경된 설정 키를 추적하기 위한 배열 정의
    const changedKeys: string[] = [];
    
    // 변경된 설정 키 추적
    for (const key in settings) {
      if (Object.prototype.hasOwnProperty.call(settings, key)) {
        const typedKey = key as keyof CardNavigatorSettings;
        if (JSON.stringify(this.plugin.settings[typedKey]) !== JSON.stringify(settings[typedKey])) {
          changedKeys.push(key);
        }
      }
    }
    
    // 설정 업데이트
    Object.assign(this.plugin.settings, settings);
    
    // 설정 저장
    if (save) {
      await this.saveSettings();
    }
    
    // 변경된 설정이 있으면 이벤트 발생
    if (changedKeys.length > 0) {
      this.eventEmitter.emit(EventType.SETTINGS_CHANGED, {
        settings: this.plugin.settings,
        changedKeys
      });
    }
  }
  
  /**
   * 설정 저장
   */
  async saveSettings(): Promise<void> {
    await this.plugin.saveSettings();
  }
  
  /**
   * 설정 초기화
   */
  async resetSettings(): Promise<void> {
    const defaultSettings = this.plugin.settings;
    await this.updateSettings(defaultSettings);
  }
  
  /**
   * 설정 변경 이벤트 리스너 등록
   * @param listener 리스너 함수
   */
  onSettingsChanged(listener: (data: SettingsChangedEventData) => void): void {
    this.eventEmitter.on(EventType.SETTINGS_CHANGED, listener);
  }
  
  /**
   * 설정 변경 이벤트 리스너 제거
   * @param listener 리스너 함수
   */
  offSettingsChanged(listener: (data: SettingsChangedEventData) => void): void {
    this.eventEmitter.off(EventType.SETTINGS_CHANGED, listener);
  }
} 