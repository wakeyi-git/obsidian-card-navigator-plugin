import type CardNavigatorPlugin from '../../main';
import { updateSettings, updateNestedSettings } from '../../domain/utils/settingsUtils';
import type { PluginSettings } from '../../domain/models/DefaultValues';
import type { ICardStyle } from '../../domain/models/CardStyle';
import type { ICardRenderConfig } from '../../domain/models/CardRenderConfig';
import type { IStyleProperties } from '../../domain/models/CardStyle';
import type { ISectionDisplayConfig } from '../../domain/models/CardRenderConfig';
import type { CardSetType } from '../../domain/models/CardSet';

/**
 * 이벤트 에미터 클래스
 */
class EventEmitter {
  private events: Record<string, Array<(data: any) => void>> = {};
  private eventIds: Record<string, number> = {};

  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param callback 콜백 함수
   * @returns 이벤트 ID (리스너 제거 시 사용)
   */
  on(event: string, callback: (data: any) => void): number {
    if (!this.events[event]) {
      this.events[event] = [];
      this.eventIds[event] = 0;
    }
    
    const id = ++this.eventIds[event];
    this.events[event].push(callback);
    
    return id;
  }

  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param id 이벤트 ID
   */
  off(event: string, id: number): void {
    if (!this.events[event]) return;
    
    const index = this.events[event].findIndex((_, i) => i === id - 1);
    if (index !== -1) {
      this.events[event].splice(index, 1);
    }
  }

  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param data 이벤트 데이터
   */
  emit(event: string, data: any): void {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * 모든 이벤트 리스너 제거
   */
  clear(): void {
    this.events = {};
    this.eventIds = {};
  }
}

/**
 * 설정 서비스 인터페이스
 */
export interface ISettingsService {
  /**
   * 설정 가져오기
   */
  getSettings(): PluginSettings;
  
  /**
   * 설정 업데이트
   * @param updater 업데이트 함수
   */
  updateSettings(updater: (draft: PluginSettings) => void): Promise<void>;
  
  /**
   * 중첩 설정 업데이트
   * @param path 속성 경로
   * @param value 새 값
   */
  updateNestedSettings(path: string, value: any): Promise<void>;
  
  /**
   * 카드 스타일 속성 업데이트
   * @param styleKey 스타일 키
   * @param property 속성
   * @param value 값
   */
  updateCardStyle(styleKey: keyof ICardStyle, property: keyof IStyleProperties, value: string): Promise<void>;
  
  /**
   * 카드 렌더링 설정 업데이트
   * @param property 속성
   * @param value 값
   */
  updateCardRenderConfig(property: keyof ICardRenderConfig, value: any): Promise<void>;
  
  /**
   * 카드 렌더링 섹션 설정 업데이트
   * @param section 섹션
   * @param property 속성
   * @param value 값
   */
  updateCardSectionDisplay(
    section: 'header' | 'body' | 'footer',
    property: keyof ISectionDisplayConfig,
    value: boolean | string[]
  ): Promise<void>;
  
  /**
   * 카드셋 타입 업데이트
   * @param type 타입
   */
  updateCardSetType(type: CardSetType): Promise<void>;
  
  /**
   * 설정 변경 이벤트 구독
   * @param callback 콜백 함수
   * @returns 구독 해제 함수
   */
  onSettingsChanged(callback: (data: {oldSettings: PluginSettings, newSettings: PluginSettings}) => void): () => void;
  
  /**
   * 서비스 정리
   */
  dispose(): void;
}

/**
 * 설정 서비스 구현
 */
export class SettingsService implements ISettingsService {
  private eventEmitter = new EventEmitter();
  
  constructor(private plugin: CardNavigatorPlugin) {}
  
  /**
   * 설정 가져오기
   */
  getSettings(): PluginSettings {
    return this.plugin.settings;
  }
  
  /**
   * 설정 업데이트
   * @param updater 업데이트 함수
   */
  async updateSettings(updater: (draft: PluginSettings) => void): Promise<void> {
    try {
      const oldSettings = { ...this.plugin.settings };
      this.plugin.settings = updateSettings(this.plugin.settings, updater);
      await this.plugin.saveSettings();
      
      this.notifySettingsChanged(oldSettings, this.plugin.settings);
    } catch (error) {
      console.error('설정 업데이트 실패:', error);
      throw error;
    }
  }
  
  /**
   * 중첩 설정 업데이트
   * @param path 속성 경로
   * @param value 새 값
   */
  async updateNestedSettings(path: string, value: any): Promise<void> {
    try {
      const oldSettings = { ...this.plugin.settings };
      this.plugin.settings = updateNestedSettings(this.plugin.settings, path, value);
      await this.plugin.saveSettings();
      
      this.notifySettingsChanged(oldSettings, this.plugin.settings);
    } catch (error) {
      console.error('중첩 설정 업데이트 실패:', error);
      throw error;
    }
  }
  
  /**
   * 카드 스타일 속성 업데이트
   * @param styleKey 스타일 키
   * @param property 속성
   * @param value 값
   */
  async updateCardStyle(
    styleKey: keyof ICardStyle, 
    property: keyof IStyleProperties, 
    value: string
  ): Promise<void> {
    await this.updateNestedSettings(`cardStyle.${styleKey}.${property}`, value);
  }
  
  /**
   * 카드 렌더링 설정 업데이트
   * @param property 속성
   * @param value 값
   */
  async updateCardRenderConfig(property: keyof ICardRenderConfig, value: any): Promise<void> {
    await this.updateNestedSettings(`cardRenderConfig.${property}`, value);
  }
  
  /**
   * 카드 렌더링 섹션 설정 업데이트
   * @param section 섹션
   * @param property 속성
   * @param value 값
   */
  async updateCardSectionDisplay(
    section: 'header' | 'body' | 'footer',
    property: keyof ISectionDisplayConfig,
    value: boolean | string[]
  ): Promise<void> {
    await this.updateNestedSettings(`cardRenderConfig.${section}Display.${property}`, value);
  }
  
  /**
   * 카드셋 타입 업데이트
   * @param type 타입
   */
  async updateCardSetType(type: CardSetType): Promise<void> {
    await this.updateNestedSettings('defaultCardSetType', type);
  }
  
  /**
   * 설정 변경 이벤트 구독
   * @param callback 콜백 함수
   * @returns 구독 해제 함수
   */
  onSettingsChanged(callback: (data: {oldSettings: PluginSettings, newSettings: PluginSettings}) => void): () => void {
    const id = this.eventEmitter.on('settings-changed', callback);
    return () => this.eventEmitter.off('settings-changed', id);
  }
  
  /**
   * 설정 변경 알림
   * @param oldSettings 이전 설정
   * @param newSettings 새 설정
   */
  private notifySettingsChanged(oldSettings: PluginSettings, newSettings: PluginSettings): void {
    this.eventEmitter.emit('settings-changed', { oldSettings, newSettings });
  }
  
  /**
   * 서비스 정리
   */
  dispose(): void {
    this.eventEmitter.clear();
  }
}

/**
 * 설정 서비스를 위한 간단한 의존성 주입 컨테이너
 */
export class ServiceContainer {
  private static instance: ServiceContainer | null = null;
  private services: Map<string, any> = new Map();
  
  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
  
  /**
   * 싱글톤 인스턴스 리셋
   */
  static resetInstance(): void {
    ServiceContainer.instance = null;
  }
  
  /**
   * 서비스 등록
   * @param key 서비스 키
   * @param service 서비스 인스턴스
   */
  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }
  
  /**
   * 서비스 가져오기
   * @param key 서비스 키
   * @returns 서비스 인스턴스
   */
  resolve<T>(key: string): T {
    if (!this.services.has(key)) {
      throw new Error(`서비스를 찾을 수 없음: ${key}`);
    }
    return this.services.get(key) as T;
  }
  
  /**
   * 모든 서비스 정리
   */
  dispose(): void {
    for (const [_, service] of this.services.entries()) {
      if (service && typeof service.dispose === 'function') {
        service.dispose();
      }
    }
    this.services.clear();
  }
}