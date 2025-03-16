import { Plugin } from 'obsidian';
import { ICardNavigatorSettings, CardSetSourceMode } from '../../domain/settings/SettingsInterfaces';
import { DEFAULT_SETTINGS } from '../../domain/settings/DefaultSettings';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';

/**
 * 설정 서비스
 * 플러그인 설정을 관리합니다.
 */
export class SettingsService {
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
    // 이전 설정 저장
    const previousSettings = this.settings ? { ...this.settings } : null;
    
    // 설정 로드
    const loadedData = await this.plugin.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...loadedData } as ICardNavigatorSettings;
    
    // cardSetSourceMode가 설정되어 있지 않은 경우 기본값으로 FOLDER 설정
    if (this.settings.cardSetSourceMode === undefined || this.settings.cardSetSourceMode === null) {
      console.log('loadSettings: cardSetSourceMode가 설정되어 있지 않아 기본값(FOLDER)으로 설정');
      this.settings.cardSetSourceMode = CardSetSourceMode.FOLDER;
    }
    
    // 설정 로드 이벤트 발생
    this.emit(EventType.SETTINGS_LOADED, undefined);
    
    // 이전 설정이 있는 경우에만 변경 여부 확인
    if (previousSettings) {
      // 변경된 설정 키 찾기
      const changedKeys = this.findChangedSettingKeys(previousSettings, this.settings);
      
      // 변경된 설정이 있는 경우에만 이벤트 발생
      if (changedKeys.length > 0) {
        console.log('설정 변경 감지, 이벤트 발생:', changedKeys);
        
        // 설정 변경 이벤트 발생
        this.emit(EventType.SETTINGS_CHANGED, {
          settings: this.settings,
          changedKeys: changedKeys
        });
        
        // 설정 변경 리스너 호출
        this.settingsChangedListeners.forEach(listener => listener(this.settings));
      } else {
        console.log('설정 변경 없음, 이벤트 발생 생략');
      }
    } else {
      // 최초 로드인 경우 모든 설정이 변경된 것으로 간주
      console.log('최초 설정 로드, 모든 설정 변경 이벤트 발생');
      
      // 설정 변경 이벤트 발생
      this.emit(EventType.SETTINGS_CHANGED, {
        settings: this.settings,
        changedKeys: Object.keys(this.settings)
      });
      
      // 설정 변경 리스너 호출
      this.settingsChangedListeners.forEach(listener => listener(this.settings));
    }
    
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
    // 이전 설정 저장
    const previousSettings = { ...this.settings };
    
    // 실제로 변경된 설정 키 찾기
    const actualChangedKeys: string[] = [];
    
    // 업데이트할 설정 키 확인
    for (const key in settings) {
      if (Object.prototype.hasOwnProperty.call(settings, key)) {
        const typedKey = key as keyof ICardNavigatorSettings;
        const oldValue = previousSettings[typedKey];
        const newValue = settings[typedKey];
        
        // 값이 변경된 경우에만 처리
        if (this.isComplexValue(oldValue) || this.isComplexValue(newValue)) {
          // 복잡한 값(배열, 객체)은 JSON 문자열로 변환하여 비교
          const oldJson = JSON.stringify(oldValue);
          const newJson = JSON.stringify(newValue);
          
          if (oldJson !== newJson) {
            actualChangedKeys.push(key);
          }
        } else {
          // 기본 값은 직접 비교
          if (oldValue !== newValue) {
            actualChangedKeys.push(key);
          }
        }
      }
    }
    
    // 변경된 설정이 없는 경우 종료
    if (actualChangedKeys.length === 0) {
      console.log('실제 변경된 설정 없음, 업데이트 생략');
      return;
    }
    
    // 설정 업데이트
    this.settings = { ...this.settings, ...settings };
    
    // 디버깅: 업데이트되는 설정 값 로깅
    console.log('설정 업데이트:');
    actualChangedKeys.forEach(key => {
      const settingKey = key as keyof ICardNavigatorSettings;
      console.log(`${key}: ${JSON.stringify(previousSettings[settingKey])} -> ${JSON.stringify(settings[settingKey])}`);
    });
    
    // 설정 저장
    await this.plugin.saveData(this.settings);
    
    // 설정 변경 이벤트 발생
    this.emit(EventType.SETTINGS_CHANGED, {
      settings: this.settings,
      changedKeys: actualChangedKeys
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
    const oldValue = this.settings[key];
    
    // 값이 변경된 경우에만 처리
    let isChanged = false;
    
    if (this.isComplexValue(oldValue) || this.isComplexValue(value)) {
      // 복잡한 값(배열, 객체)은 JSON 문자열로 변환하여 비교
      const oldJson = JSON.stringify(oldValue);
      const newJson = JSON.stringify(value);
      isChanged = oldJson !== newJson;
    } else {
      // 기본 값은 직접 비교
      isChanged = oldValue !== value;
    }
    
    // 변경된 경우에만 업데이트
    if (isChanged) {
      console.log(`설정 값 변경: ${String(key)}, ${JSON.stringify(oldValue)} -> ${JSON.stringify(value)}`);
      
      // 설정 업데이트
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
    } else {
      console.log(`설정 값 변경 없음: ${String(key)}`);
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
  
  /**
   * 변경된 설정 키 찾기
   * @param oldSettings 이전 설정
   * @param newSettings 새 설정
   * @returns 변경된 설정 키 목록
   */
  private findChangedSettingKeys(
    oldSettings: ICardNavigatorSettings,
    newSettings: ICardNavigatorSettings
  ): string[] {
    const changedKeys: string[] = [];
    
    // 모든 설정 키 확인
    for (const key in newSettings) {
      if (Object.prototype.hasOwnProperty.call(newSettings, key)) {
        const typedKey = key as keyof ICardNavigatorSettings;
        
        // 배열이나 객체인 경우 JSON 문자열로 변환하여 비교
        const oldValue = oldSettings[typedKey];
        const newValue = newSettings[typedKey];
        
        if (this.isComplexValue(oldValue) || this.isComplexValue(newValue)) {
          // 복잡한 값(배열, 객체)은 JSON 문자열로 변환하여 비교
          const oldJson = JSON.stringify(oldValue);
          const newJson = JSON.stringify(newValue);
          
          if (oldJson !== newJson) {
            changedKeys.push(key);
          }
        } else {
          // 기본 값은 직접 비교
          if (oldValue !== newValue) {
            changedKeys.push(key);
          }
        }
      }
    }
    
    return changedKeys;
  }
  
  /**
   * 복잡한 값(배열, 객체) 여부 확인
   * @param value 확인할 값
   * @returns 복잡한 값 여부
   */
  private isComplexValue(value: any): boolean {
    return value !== null && typeof value === 'object';
  }
} 