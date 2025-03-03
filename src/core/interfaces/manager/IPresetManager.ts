import { App, TFile } from 'obsidian';
import { IFolderPresetManager } from './IFolderPresetManager';
import { ITagPresetManager } from './ITagPresetManager';
import { ISettingsManager } from './ISettingsManager';
import { IPreset, PresetSettings } from '../../types/preset.types';
import { PresetEvent, PresetEventData, PresetEventHandler } from '../../types/event.types';

/**
 * 프리셋 관리자 인터페이스
 * 카드 네비게이터의 프리셋을 관리하는 인터페이스입니다.
 */
export interface IPresetManager {
  /**
   * 폴더 프리셋 관리자
   */
  readonly folderPresetManager: IFolderPresetManager;
  
  /**
   * 태그 프리셋 관리자
   */
  readonly tagPresetManager: ITagPresetManager;
  
  /**
   * 설정 관리자
   */
  readonly settingsManager: ISettingsManager;
  
  /**
   * Obsidian 앱 인스턴스
   */
  readonly app: App;
  
  /**
   * Obsidian 앱 인스턴스 가져오기
   * @returns Obsidian 앱 인스턴스
   */
  getApp(): App;
  
  /**
   * 프리셋 관리자 초기화
   */
  initialize(): Promise<void>;
  
  /**
   * 모든 프리셋 가져오기
   * @returns 프리셋 목록
   */
  getAllPresets(): IPreset[];
  
  /**
   * 프리셋 존재 여부 확인
   * @param presetId 프리셋 ID
   * @returns 존재 여부
   */
  hasPreset(presetId: string): boolean;
  
  /**
   * 새 프리셋 생성
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   * @returns 생성된 프리셋
   */
  createPreset(name: string, description?: string): Promise<IPreset>;
  
  /**
   * 프리셋 가져오기
   * @param presetId 프리셋 ID
   * @returns 프리셋 또는 null
   */
  getPreset(presetId: string): IPreset | null;
  
  /**
   * 프리셋 업데이트
   * @param presetId 프리셋 ID
   * @param updates 업데이트할 내용
   * @returns 업데이트된 프리셋
   */
  updatePreset(presetId: string, updates: Partial<IPreset>): Promise<IPreset>;
  
  /**
   * 프리셋 삭제
   * @param presetId 프리셋 ID
   * @returns 성공 여부
   */
  deletePreset(presetId: string): Promise<boolean>;
  
  /**
   * 프리셋 복제
   * @param presetId 복제할 프리셋 ID
   * @param newName 새 프리셋 이름
   * @returns 복제된 프리셋
   */
  clonePreset(presetId: string, newName: string): Promise<IPreset>;
  
  /**
   * 프리셋 적용
   * @param presetId 적용할 프리셋 ID
   * @returns 성공 여부
   */
  applyPreset(presetId: string): Promise<boolean>;
  
  /**
   * 프리셋 가져오기
   * @param data 가져올 프리셋 데이터
   * @returns 가져온 프리셋 목록
   */
  importPreset(data: string): Promise<IPreset[]>;
  
  /**
   * 프리셋 내보내기
   * @param presetIds 내보낼 프리셋 ID 목록
   * @returns 내보낸 프리셋 데이터
   */
  exportPreset(presetIds: string[]): Promise<string>;
  
  /**
   * 프리셋 ID 변경
   * @param oldPresetId 이전 프리셋 ID
   * @param newPresetId 새 프리셋 ID
   * @returns 성공 여부
   */
  changePresetId(oldPresetId: string, newPresetId: string): Promise<boolean>;
  
  /**
   * 활성 프리셋 ID 가져오기
   * @returns 활성 프리셋 ID
   */
  getActivePresetId(): string | null;
  
  /**
   * 기본 프리셋 ID 가져오기
   * @returns 기본 프리셋 ID
   */
  getDefaultPresetId(): string | null;
  
  /**
   * 전역 기본 프리셋 ID 가져오기
   * @returns 전역 기본 프리셋 ID
   */
  getGlobalDefaultPresetId(): string | null;
  
  /**
   * 파일에 적합한 프리셋 선택 및 적용
   * @param file 파일
   * @returns 적용된 프리셋 ID 또는 null
   */
  selectAndApplyPresetForFile(file: TFile): Promise<string | null>;
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param handler 이벤트 핸들러
   */
  on(event: PresetEvent, handler: PresetEventHandler): void;
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param handler 이벤트 핸들러
   */
  off(event: PresetEvent, handler: PresetEventHandler): void;
  
  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param data 이벤트 데이터
   */
  emit(event: PresetEvent, data: PresetEventData): void;
  
  /**
   * 폴더 프리셋 변경 이벤트 발생
   * @param folderPath 폴더 경로
   * @param presetId 프리셋 ID
   */
  notifyFolderPresetChanged(folderPath: string, presetId: string): void;
  
  /**
   * 폴더 프리셋 제거 이벤트 발생
   * @param folderPath 폴더 경로
   * @param presetId 프리셋 ID
   */
  notifyFolderPresetRemoved(folderPath: string, presetId: string): void;
  
  /**
   * 태그 프리셋 변경 이벤트 발생
   * @param tag 태그 이름
   * @param presetId 프리셋 ID
   */
  notifyTagPresetChanged(tag: string, presetId: string): void;
  
  /**
   * 태그 프리셋 제거 이벤트 발생
   * @param tag 태그 이름
   * @param presetId 프리셋 ID
   */
  notifyTagPresetRemoved(tag: string, presetId: string): void;
  
  /**
   * 프리셋 설정 가져오기
   * @param presetId 프리셋 ID
   * @returns 프리셋 설정
   */
  getPresetSettings(presetId: string): PresetSettings;
  
  /**
   * 충돌 해결 방법 설정
   * @param conflictResolution 충돌 해결 방법
   */
  setConflictResolution(conflictResolution: 'priority-only' | 'merge-priority' | 'merge-custom'): Promise<void>;
}