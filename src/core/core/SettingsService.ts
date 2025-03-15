import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS } from '../../domain/settings/DefaultSettings';
import { ICardNavigatorSettings, ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';

/**
 * 설정 서비스
 * 플러그인 설정을 관리합니다.
 */
export class SettingsService implements ISettingsService {
  private plugin: Plugin;
  private settings: ICardNavigatorSettings;
  private eventBus: DomainEventBus;
  private settingsChangedListeners: ((settings: ICardNavigatorSettings) => void)[] = [];
  
  /**
   * 생성자
   * @param plugin 플러그인 인스턴스
   * @param eventBus 이벤트 버스
   */
  constructor(plugin: Plugin, eventBus: DomainEventBus) {
    this.plugin = plugin;
    this.eventBus = eventBus;
    this.settings = { ...DEFAULT_SETTINGS } as ICardNavigatorSettings;
  }
  
  /**
   * 플러그인 인스턴스 가져오기
   * @returns 플러그인 인스턴스
   */
  getPlugin(): any {
    return this.plugin;
  }
  
  /**
   * 설정 로드
   * @returns 로드된 설정
   */
  async loadSettings(): Promise<ICardNavigatorSettings> {
    const loadedData = await this.plugin.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...loadedData } as ICardNavigatorSettings;
    
    // 설정 로드 이벤트 발생
    this.emit(EventType.SETTINGS_LOADED, undefined);
    
    // 설정 변경 이벤트 발생 (모든 설정이 변경된 것으로 간주)
    this.emit(EventType.SETTINGS_CHANGED, {
      settings: this.settings,
      changedKeys: Object.keys(this.settings)
    });
    
    // 설정 변경 리스너 호출
    this.settingsChangedListeners.forEach(listener => listener(this.settings));
    
    return this.settings;
  }
  
  /**
   * 설정 저장
   * @param settings 저장할 설정
   */
  async saveSettings(settings?: Partial<ICardNavigatorSettings>): Promise<void> {
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }
    
    await this.plugin.saveData(this.settings);
    
    // 설정 저장 이벤트 발생
    this.emit(EventType.SETTINGS_SAVED, undefined);
  }
  
  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   */
  async updateSettings(settings: Partial<ICardNavigatorSettings>): Promise<void> {
    const previousSettings = { ...this.settings };
    this.settings = { ...this.settings, ...settings };
    
    // 디버깅: 업데이트되는 설정 값 로깅
    console.log('설정 업데이트:');
    Object.keys(settings).forEach(key => {
      const settingKey = key as keyof ICardNavigatorSettings;
      console.log(`${key}: ${JSON.stringify(previousSettings[settingKey])} -> ${JSON.stringify(settings[settingKey])}`);
    });
    
    await this.plugin.saveData(this.settings);
    
    // 설정 변경 이벤트 발생
    this.emit(EventType.SETTINGS_CHANGED, {
      settings: this.settings,
      changedKeys: Object.keys(settings)
    });
    
    // 설정 변경 리스너 호출
    this.settingsChangedListeners.forEach(listener => listener(this.settings));
  }
  
  /**
   * 현재 설정 가져오기
   * @returns 현재 설정
   */
  getSettings(): ICardNavigatorSettings {
    return this.settings;
  }
  
  /**
   * 특정 설정 값 가져오기
   * @param key 설정 키
   * @param defaultValue 기본값
   * @returns 설정 값
   */
  getSetting<K extends keyof ICardNavigatorSettings>(key: K, defaultValue?: ICardNavigatorSettings[K]): ICardNavigatorSettings[K] {
    if (this.settings[key] !== undefined) {
      return this.settings[key];
    }
    return defaultValue as ICardNavigatorSettings[K];
  }
  
  /**
   * 특정 설정 값 설정
   * @param key 설정 키
   * @param value 설정 값
   */
  async setSetting<K extends keyof ICardNavigatorSettings>(key: K, value: ICardNavigatorSettings[K]): Promise<void> {
    // 이전 값과 다른 경우에만 업데이트
    if (this.settings[key] !== value) {
      const oldValue = this.settings[key];
      this.settings[key] = value;
      
      // 설정 저장
      await this.plugin.saveData(this.settings);
      
      // 설정 변경 이벤트 발생
      this.emit(EventType.SETTINGS_CHANGED, {
        settings: this.settings,
        changedKeys: [key]
      });
      
      // 설정 변경 리스너 호출
      this.settingsChangedListeners.forEach(listener => listener(this.settings));
    }
  }
  
  /**
   * 설정 초기화
   */
  async resetSettings(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS } as ICardNavigatorSettings;
    await this.plugin.saveData(this.settings);
    
    // 설정 초기화 이벤트 발생
    this.emit(EventType.SETTINGS_RESET, undefined);
    
    // 설정 변경 리스너 호출
    this.settingsChangedListeners.forEach(listener => listener(this.settings));
  }
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  on(event: EventType, listener: (...args: any[]) => void): void {
    this.eventBus.on(event, listener);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  off(event: EventType, listener: (...args: any[]) => void): void {
    this.eventBus.off(event, listener);
  }
  
  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param data 이벤트 데이터
   */
  emit(event: EventType, data: any): void {
    this.eventBus.emit(event, data);
  }
  
  /**
   * 설정 변경 이벤트 리스너 등록
   * @param listener 리스너 함수
   */
  onSettingsChanged(listener: (settings: ICardNavigatorSettings) => void): void {
    this.settingsChangedListeners.push(listener);
  }
  
  /**
   * 설정 변경 이벤트 리스너 제거
   * @param listener 리스너 함수
   */
  offSettingsChanged(listener: (settings: ICardNavigatorSettings) => void): void {
    const index = this.settingsChangedListeners.indexOf(listener);
    if (index !== -1) {
      this.settingsChangedListeners.splice(index, 1);
    }
  }
} 