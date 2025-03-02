import { CardNavigatorSettings } from '../types/settings.types';

/**
 * 설정 관리자 인터페이스
 * 플러그인 설정 관리와 관련된 기능을 정의합니다.
 */
export interface ISettingsManager {
  /**
   * 설정 로드
   * @returns 로드된 설정
   */
  loadSettings(): Promise<CardNavigatorSettings>;

  /**
   * 설정 저장
   * @param settings 저장할 설정
   */
  saveSettings(settings?: Partial<CardNavigatorSettings>): Promise<void>;

  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   */
  updateSettings(settings: Partial<CardNavigatorSettings>): Promise<void>;

  /**
   * 설정 가져오기
   * @returns 현재 설정
   */
  getSettings(): CardNavigatorSettings;

  /**
   * 특정 설정 값 가져오기
   * @param key 설정 키
   * @returns 설정 값
   */
  getSetting<K extends keyof CardNavigatorSettings>(key: K): CardNavigatorSettings[K];

  /**
   * 특정 설정 값 설정
   * @param key 설정 키
   * @param value 설정 값
   */
  setSetting<K extends keyof CardNavigatorSettings>(key: K, value: CardNavigatorSettings[K]): Promise<void>;

  /**
   * 설정 초기화
   */
  resetSettings(): Promise<void>;

  /**
   * 설정 마이그레이션
   * @param oldSettings 이전 설정
   * @returns 마이그레이션된 설정
   */
  migrateSettings(oldSettings: any): CardNavigatorSettings;
} 