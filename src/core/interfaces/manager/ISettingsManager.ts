import { App } from 'obsidian';
import { CardNavigatorSettings } from '../../types/settings.types';
import { FolderPresetMapping, FolderPresetPriorities, PresetManagementOptions, PresetSettings, TagPresetMapping, TagPresetPriorities } from '../../types/preset.types';

/**
 * 설정 관리자 인터페이스
 * 카드 네비게이터 설정을 관리하는 인터페이스입니다.
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
   * 기본 설정 가져오기
   * @returns 기본 설정
   */
  getDefaultSettings(): CardNavigatorSettings;

  /**
   * 설정 마이그레이션
   * @param oldSettings 이전 설정
   * @returns 마이그레이션된 설정
   */
  migrateSettings(oldSettings: any): CardNavigatorSettings;
  
  /**
   * 프리셋 설정을 가져옵니다.
   * @returns 프리셋 설정
   */
  getPresetSettings(): PresetSettings;
  
  /**
   * 프리셋 설정을 업데이트합니다.
   * @param presetSettings 업데이트할 프리셋 설정
   * @returns 업데이트된 프리셋 설정
   */
  updatePresetSettings(presetSettings: PresetSettings): Promise<PresetSettings>;
  
  /**
   * 프리셋 설정을 적용합니다.
   * @param presetSettings 적용할 프리셋 설정
   * @returns 적용된 프리셋 설정
   */
  applyPresetSettings(presetSettings: PresetSettings): Promise<PresetSettings>;
  
  /**
   * 프리셋 관리 옵션을 업데이트합니다.
   * @param options 업데이트할 프리셋 관리 옵션
   * @returns 업데이트된 프리셋 관리 옵션
   */
  updatePresetManagementOptions(options: Partial<PresetManagementOptions>): Promise<PresetManagementOptions>;
  
  /**
   * 폴더 프리셋 매핑을 가져옵니다.
   * @returns 폴더 프리셋 매핑
   */
  getFolderPresetMapping(): FolderPresetMapping;
  
  /**
   * 폴더 프리셋 매핑을 업데이트합니다.
   * @param mapping 업데이트할 폴더 프리셋 매핑
   * @returns 업데이트된 폴더 프리셋 매핑
   */
  updateFolderPresetMapping(mapping: FolderPresetMapping): Promise<FolderPresetMapping>;
  
  /**
   * 태그 프리셋 매핑을 가져옵니다.
   * @returns 태그 프리셋 매핑
   */
  getTagPresetMapping(): TagPresetMapping;
  
  /**
   * 태그 프리셋 매핑을 업데이트합니다.
   * @param mapping 업데이트할 태그 프리셋 매핑
   * @returns 업데이트된 태그 프리셋 매핑
   */
  updateTagPresetMapping(mapping: TagPresetMapping): Promise<TagPresetMapping>;
  
  /**
   * 폴더 프리셋 우선순위를 가져옵니다.
   * @returns 폴더 프리셋 우선순위
   */
  getFolderPresetPriorities(): FolderPresetPriorities;
  
  /**
   * 폴더 프리셋 우선순위를 업데이트합니다.
   * @param priorities 업데이트할 폴더 프리셋 우선순위
   * @returns 업데이트된 폴더 프리셋 우선순위
   */
  updateFolderPresetPriorities(priorities: FolderPresetPriorities): Promise<FolderPresetPriorities>;
  
  /**
   * 태그 프리셋 우선순위를 가져옵니다.
   * @returns 태그 프리셋 우선순위
   */
  getTagPresetPriorities(): TagPresetPriorities;
  
  /**
   * 태그 프리셋 우선순위를 업데이트합니다.
   * @param priorities 업데이트할 태그 프리셋 우선순위
   * @returns 업데이트된 태그 프리셋 우선순위
   */
  updateTagPresetPriorities(priorities: TagPresetPriorities): Promise<TagPresetPriorities>;

  /**
   * 설정 변경 콜백을 등록합니다.
   * @param callback 설정 변경 시 호출될 콜백 함수
   * @returns 콜백 ID
   */
  registerChangeCallback(callback: (settings: CardNavigatorSettings) => void): string;

  /**
   * 설정 변경 콜백을 해제합니다.
   * @param callbackId 해제할 콜백 ID
   * @returns 해제 성공 여부
   */
  unregisterChangeCallback(callbackId: string): boolean;
} 