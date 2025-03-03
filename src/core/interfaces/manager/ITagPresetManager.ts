import { TFile } from 'obsidian';
import { IPresetManager } from './IPresetManager';
import { ISettingsManager } from './ISettingsManager';

/**
 * 태그 프리셋 관리자 인터페이스
 * 태그별 프리셋을 관리하는 인터페이스입니다.
 */
export interface ITagPresetManager {
  /**
   * 태그 프리셋 관리자 초기화
   * @param presetManager 프리셋 관리자
   * @param settingsManager 설정 관리자
   */
  initialize(
    presetManager: IPresetManager, 
    settingsManager: ISettingsManager
  ): Promise<void>;
  
  /**
   * 태그에 프리셋 할당
   * @param tagName 태그 이름
   * @param presetId 프리셋 ID
   * @param overrideGlobal 전역 프리셋보다 우선 적용 여부
   */
  assignPresetToTag(tagName: string, presetId: string, overrideGlobal?: boolean): Promise<void>;
  
  /**
   * 태그에서 프리셋 할당 해제
   * @param tagName 태그 이름
   */
  unassignPresetFromTag(tagName: string): Promise<void>;
  
  /**
   * 태그에 할당된 프리셋 ID 가져오기
   * @param tagName 태그 이름
   * @returns 프리셋 ID 또는 null
   */
  getPresetIdForTag(tagName: string): string | null;
  
  /**
   * 태그 프리셋 우선순위 설정
   * @param tagName 태그 이름
   * @param overrideGlobal 전역 프리셋보다 우선 적용 여부
   */
  setTagPresetPriority(tagName: string, overrideGlobal: boolean): Promise<void>;
  
  /**
   * 태그 프리셋 우선순위 가져오기
   * @param tagName 태그 이름
   * @returns 전역 프리셋보다 우선 적용 여부
   */
  getTagPresetPriority(tagName: string): boolean;
  
  /**
   * 프리셋 자동 적용 설정
   * @param autoApply 자동 적용 여부
   */
  setAutoApplyPresets(autoApply: boolean): Promise<void>;
  
  /**
   * 프리셋 자동 적용 여부 가져오기
   * @returns 자동 적용 여부
   */
  getAutoApplyPresets(): boolean;
  
  /**
   * 파일에 대한 프리셋 선택
   * @param file 파일
   * @returns 프리셋 ID 또는 null
   */
  selectPresetForFile(file: TFile): Promise<string | null>;
  
  /**
   * 프리셋 ID 변경 처리
   * @param oldPresetId 이전 프리셋 ID
   * @param newPresetId 새 프리셋 ID
   */
  handlePresetIdChange(oldPresetId: string, newPresetId: string): Promise<void>;
  
  /**
   * 프리셋 삭제 처리
   * @param presetId 삭제된 프리셋 ID
   */
  handlePresetDeletion(presetId: string): Promise<void>;
  
  /**
   * 태그에 프리셋 설정
   * @param tagName 태그 이름
   * @param presetId 프리셋 ID
   */
  setTagPreset(tagName: string, presetId: string): Promise<void>;
} 