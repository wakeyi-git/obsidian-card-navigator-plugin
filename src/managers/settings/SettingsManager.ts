import { App } from 'obsidian';
import { ISettingsManager } from '../../core/interfaces/ISettingsManager';
import { CardNavigatorSettings, SettingsVersion } from '../../core/types/settings.types';
import { ErrorCode } from '../../core/constants/error.constants';

/**
 * 기본 설정값
 */
const DEFAULT_SETTINGS: CardNavigatorSettings = {
  version: '1.0.0',
  
  // 카드 내용 설정
  showFileName: true,
  showFirstHeader: true,
  showBody: true,
  showTags: true,
  maxBodyLength: 200,
  
  // 카드 스타일 설정
  titleFontSize: 16,
  bodyFontSize: 14,
  tagFontSize: 12,
  cardPadding: 16,
  cardBorderRadius: 8,
  cardBorderWidth: 1,
  enableCardShadow: true,
  
  // 레이아웃 설정
  cardThresholdWidth: 250,
  alignCardHeight: false,
  useFixedHeight: false,
  fixedCardHeight: 200,
  cardsPerColumn: 3,
  enableScrollAnimation: true,
  enableSnapToCard: false,
  
  // 레이아웃 스타일 설정
  containerPadding: 16,
  cardGap: 16,
  
  // 프리셋 설정
  globalPreset: null,
  lastActivePreset: null,
  autoApplyPresets: true,
  folderPresets: {},
  
  // 카드셋 설정
  defaultCardSetType: 'active-folder',
  lastSelectedFolder: null,
  
  // 검색 설정
  searchInTitle: true,
  searchInHeader: true,
  searchInTags: true,
  searchInContent: true,
  searchInFrontmatter: false,
  caseSensitiveSearch: false,
  useRegexSearch: false,
  
  // 카드 상호작용 설정
  enableDragAndDrop: true,
  enableContextMenu: true,
  enableKeyboardNavigation: true,
  
  // 기타 설정
  debugMode: false
};

/**
 * 설정 관리자 구현 클래스
 * 플러그인 설정 관리와 관련된 기능을 구현합니다.
 */
export class SettingsManager implements ISettingsManager {
  /**
   * Obsidian 앱 인스턴스
   */
  private app: App;
  
  /**
   * 플러그인 ID
   */
  private pluginId: string;
  
  /**
   * 현재 설정
   */
  private settings: CardNavigatorSettings;
  
  /**
   * 설정 변경 콜백 함수 목록
   */
  private changeCallbacks: Array<(settings: CardNavigatorSettings) => void> = [];
  
  /**
   * 설정 관리자 생성자
   * @param app Obsidian 앱 인스턴스
   * @param pluginId 플러그인 ID
   */
  constructor(app: App, pluginId: string) {
    this.app = app;
    this.pluginId = pluginId;
    this.settings = { ...DEFAULT_SETTINGS };
  }
  
  /**
   * 설정 로드
   */
  async loadSettings(): Promise<CardNavigatorSettings> {
    try {
      // 저장된 설정 로드
      const loadedData = await this.app.loadData(this.pluginId);
      
      // 설정 병합
      if (loadedData) {
        this.settings = {
          ...DEFAULT_SETTINGS,
          ...loadedData
        };
        
        // 설정 마이그레이션 확인
        await this.migrateSettings();
      }
      
      return this.settings;
    } catch (error: any) {
      console.error(`${ErrorCode.SETTINGS_LOAD_ERROR}: ${error.message}`, error);
      // 오류 발생 시 기본 설정 사용
      this.settings = { ...DEFAULT_SETTINGS };
      return this.settings;
    }
  }
  
  /**
   * 설정 저장
   */
  async saveSettings(): Promise<void> {
    try {
      await this.app.saveData(this.pluginId, this.settings);
    } catch (error: any) {
      console.error(`${ErrorCode.SETTINGS_SAVE_ERROR}: ${error.message}`, error);
      throw new Error(`${ErrorCode.SETTINGS_SAVE_ERROR}: ${error.message}`);
    }
  }
  
  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   */
  async updateSettings(settings: Partial<CardNavigatorSettings>): Promise<void> {
    try {
      // 이전 설정 저장
      const previousSettings = { ...this.settings };
      
      // 설정 업데이트
      this.settings = {
        ...this.settings,
        ...settings
      };
      
      // 설정 저장
      await this.saveSettings();
      
      // 변경 콜백 호출
      this.notifyChangeCallbacks();
    } catch (error: any) {
      console.error(`${ErrorCode.SETTINGS_UPDATE_ERROR}: ${error.message}`, error);
      throw new Error(`${ErrorCode.SETTINGS_UPDATE_ERROR}: ${error.message}`);
    }
  }
  
  /**
   * 전체 설정 가져오기
   * @returns 현재 설정
   */
  getSettings(): CardNavigatorSettings {
    return { ...this.settings };
  }
  
  /**
   * 특정 설정 가져오기
   * @param key 설정 키
   * @returns 설정 값
   */
  getSetting<K extends keyof CardNavigatorSettings>(key: K): CardNavigatorSettings[K] {
    return this.settings[key];
  }
  
  /**
   * 특정 설정 설정하기
   * @param key 설정 키
   * @param value 설정 값
   */
  async setSetting<K extends keyof CardNavigatorSettings>(
    key: K,
    value: CardNavigatorSettings[K]
  ): Promise<void> {
    try {
      // 이전 값과 동일한지 확인
      if (this.settings[key] === value) {
        return;
      }
      
      // 설정 업데이트
      this.settings[key] = value;
      
      // 설정 저장
      await this.saveSettings();
      
      // 변경 콜백 호출
      this.notifyChangeCallbacks();
    } catch (error: any) {
      console.error(`${ErrorCode.SETTINGS_UPDATE_ERROR}: ${error.message}`, error);
      throw new Error(`${ErrorCode.SETTINGS_UPDATE_ERROR}: ${error.message}`);
    }
  }
  
  /**
   * 설정 초기화
   */
  async resetSettings(): Promise<void> {
    try {
      // 설정 초기화
      this.settings = { ...DEFAULT_SETTINGS };
      
      // 설정 저장
      await this.saveSettings();
      
      // 변경 콜백 호출
      this.notifyChangeCallbacks();
    } catch (error: any) {
      console.error(`${ErrorCode.SETTINGS_RESET_ERROR}: ${error.message}`, error);
      throw new Error(`${ErrorCode.SETTINGS_RESET_ERROR}: ${error.message}`);
    }
  }
  
  /**
   * 설정 변경 콜백 등록
   * @param callback 콜백 함수
   */
  registerChangeCallback(callback: (settings: CardNavigatorSettings) => void): void {
    this.changeCallbacks.push(callback);
  }
  
  /**
   * 설정 변경 콜백 제거
   * @param callback 콜백 함수
   */
  unregisterChangeCallback(callback: (settings: CardNavigatorSettings) => void): void {
    const index = this.changeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.changeCallbacks.splice(index, 1);
    }
  }
  
  /**
   * 설정 마이그레이션
   * 이전 버전의 설정을 현재 버전으로 마이그레이션합니다.
   */
  async migrateSettings(): Promise<void> {
    try {
      // 버전 확인
      const currentVersion = this.settings.version || '0.0.0';
      
      // 버전별 마이그레이션 수행
      if (this.compareVersions(currentVersion, '1.0.0') < 0) {
        await this.migrateToV1();
      }
      
      // 추가 버전 마이그레이션은 여기에 추가
      
      // 현재 버전으로 업데이트
      this.settings.version = DEFAULT_SETTINGS.version;
      
      // 설정 저장
      await this.saveSettings();
    } catch (error: any) {
      console.error(`${ErrorCode.SETTINGS_MIGRATION_ERROR}: ${error.message}`, error);
      // 마이그레이션 오류 시 기본 설정으로 복원
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }
  
  /**
   * v1.0.0으로 마이그레이션
   */
  private async migrateToV1(): Promise<void> {
    // v1.0.0 이전 버전에서 마이그레이션 로직
    // 예: 이전 버전의 설정 구조가 다른 경우 변환
    
    // 폴더 프리셋 구조 변경 예시
    if (this.settings.folderPresets === undefined) {
      this.settings.folderPresets = {};
    }
    
    // 카드셋 타입 설정 추가
    if (this.settings.defaultCardSetType === undefined) {
      this.settings.defaultCardSetType = 'active-folder';
    }
    
    // 검색 설정 추가
    if (this.settings.searchInTitle === undefined) {
      this.settings.searchInTitle = true;
      this.settings.searchInHeader = true;
      this.settings.searchInTags = true;
      this.settings.searchInContent = true;
      this.settings.searchInFrontmatter = false;
      this.settings.caseSensitiveSearch = false;
      this.settings.useRegexSearch = false;
    }
  }
  
  /**
   * 버전 비교
   * @param v1 버전 1
   * @param v2 버전 2
   * @returns 비교 결과 (v1 < v2: -1, v1 = v2: 0, v1 > v2: 1)
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }
    
    return 0;
  }
  
  /**
   * 변경 콜백 호출
   */
  private notifyChangeCallbacks(): void {
    const settingsCopy = { ...this.settings };
    for (const callback of this.changeCallbacks) {
      try {
        callback(settingsCopy);
      } catch (error: any) {
        console.error(`설정 변경 콜백 오류: ${error.message}`, error);
      }
    }
  }
} 