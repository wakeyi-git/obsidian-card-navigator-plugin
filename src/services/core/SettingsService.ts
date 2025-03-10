import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS } from '../../domain/settings/Settings';
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
  
  /**
   * 생성자
   * @param plugin 플러그인 인스턴스
   * @param eventBus 이벤트 버스
   */
  constructor(plugin: Plugin, eventBus: DomainEventBus) {
    this.plugin = plugin;
    this.eventBus = eventBus;
    this.settings = { ...DEFAULT_SETTINGS };
  }
  
  /**
   * 설정 로드
   * @returns 로드된 설정
   */
  async loadSettings(): Promise<ICardNavigatorSettings> {
    const loadedData = await this.plugin.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...loadedData };
    
    // 설정 로드 이벤트 발생
    this.eventBus.emit(EventType.SETTINGS_LOADED, this.settings);
    
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
    this.eventBus.emit(EventType.SETTINGS_SAVED, this.settings);
  }
  
  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   */
  async updateSettings(settings: Partial<ICardNavigatorSettings>): Promise<void> {
    const previousSettings = { ...this.settings };
    this.settings = { ...this.settings, ...settings };
    
    await this.plugin.saveData(this.settings);
    
    // 설정 변경 이벤트 발생
    this.eventBus.emit(EventType.SETTINGS_CHANGED, {
      settings: this.settings,
      changedKeys: Object.keys(settings),
      previousSettings
    });
  }
  
  /**
   * 설정 가져오기
   * @returns 현재 설정
   */
  getSettings(): ICardNavigatorSettings {
    return this.settings;
  }
  
  /**
   * 특정 설정 값 가져오기
   * @param key 설정 키
   * @returns 설정 값
   */
  getSetting<K extends keyof ICardNavigatorSettings>(key: K): ICardNavigatorSettings[K] {
    return this.settings[key];
  }
  
  /**
   * 특정 설정 값 설정하기
   * @param key 설정 키
   * @param value 설정 값
   */
  async setSetting<K extends keyof ICardNavigatorSettings>(key: K, value: ICardNavigatorSettings[K]): Promise<void> {
    const settings = { [key]: value } as Partial<ICardNavigatorSettings>;
    await this.updateSettings(settings);
  }
  
  /**
   * 설정 초기화
   */
  async resetSettings(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.saveSettings();
    
    // 설정 초기화 이벤트 발생
    this.eventBus.emit(EventType.SETTINGS_RESET, this.settings);
  }
} 