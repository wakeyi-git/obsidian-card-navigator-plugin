import { Plugin } from 'obsidian';
import { ICardNavigatorSettings, ISettingsService } from './SettingsInterfaces';
import { DomainEventBus } from '../events/DomainEventBus';
import { CardSetSourceType } from '../cardset/CardSet';
import { EventType } from '../events/EventTypes';
import { DEFAULT_SETTINGS } from './DefaultSettings';

/**
 * 설정 클래스
 * 카드 네비게이터 설정을 관리합니다.
 */
export class Settings implements ISettingsService {
  /**
   * 현재 설정
   */
  private settings: ICardNavigatorSettings;
  
  /**
   * 플러그인 인스턴스
   */
  private plugin: Plugin;
  
  /**
   * 이벤트 버스
   */
  private eventBus: DomainEventBus;
  
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
   * 설정 로드
   * @returns 로드된 설정
   */
  async loadSettings(): Promise<ICardNavigatorSettings> {
    const loadedData = await this.plugin.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...loadedData } as ICardNavigatorSettings;
    this.emit(EventType.SETTINGS_LOADED, null);
    return this.settings;
  }
  
  /**
   * 설정 저장
   * @param settings 저장할 설정
   */
  async saveSettings(settings: ICardNavigatorSettings): Promise<void> {
    this.settings = settings;
    await this.plugin.saveData(this.settings);
    this.emit(EventType.SETTINGS_SAVED, null);
  }
  
  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   */
  async updateSettings(settings: Partial<ICardNavigatorSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.plugin.saveData(this.settings);
    this.emit(EventType.SETTINGS_CHANGED, { 
      settings: this.settings, 
      changedKeys: Object.keys(settings) 
    });
  }
  
  /**
   * 설정 초기화
   */
  async resetSettings(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS } as ICardNavigatorSettings;
    await this.plugin.saveData(this.settings);
    this.emit(EventType.SETTINGS_RESET, null);
  }
  
  /**
   * 현재 설정 가져오기
   * @returns 현재 설정
   */
  getSettings(): ICardNavigatorSettings {
    return { ...this.settings };
  }
  
  /**
   * 플러그인 인스턴스 가져오기
   * @returns 플러그인 인스턴스
   */
  getPlugin(): any {
    return this.plugin;
  }
  
  /**
   * 설정 변경 이벤트 리스너 등록
   * @param listener 리스너 함수
   */
  onSettingsChanged(listener: (settings: ICardNavigatorSettings) => void): void {
    this.on(EventType.SETTINGS_CHANGED, listener);
  }
  
  /**
   * 설정 변경 이벤트 리스너 제거
   * @param listener 리스너 함수
   */
  offSettingsChanged(listener: (settings: ICardNavigatorSettings) => void): void {
    this.off(EventType.SETTINGS_CHANGED, listener);
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
} 