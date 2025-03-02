import { TFile } from 'obsidian';
import { FolderPresetMapping } from '../types/preset.types';
import { IPresetManager } from './IPresetManager';

/**
 * 폴더별 프리셋 관리자 인터페이스
 * 폴더별 프리셋을 관리하는 인터페이스입니다.
 */
export interface IFolderPresetManager {
  /**
   * 폴더 프리셋 관리자 초기화
   * @param presetManager 프리셋 관리자
   * @param mapping 폴더-프리셋 매핑
   * @param autoApply 자동 적용 여부
   */
  initialize(presetManager: IPresetManager, mapping: FolderPresetMapping, autoApply: boolean): void;
  
  /**
   * 폴더-프리셋 매핑 설정
   * @param mapping 폴더-프리셋 매핑
   */
  setFolderPresetMapping(mapping: FolderPresetMapping): void;
  
  /**
   * 폴더-프리셋 매핑 가져오기
   * @returns 폴더-프리셋 매핑
   */
  getFolderPresetMapping(): FolderPresetMapping;
  
  /**
   * 폴더에 프리셋 할당
   * @param folderPath 폴더 경로
   * @param presetId 프리셋 ID
   */
  assignPresetToFolder(folderPath: string, presetId: string): void;
  
  /**
   * 폴더에서 프리셋 할당 해제
   * @param folderPath 폴더 경로
   */
  unassignPresetFromFolder(folderPath: string): void;
  
  /**
   * 폴더에 할당된 프리셋 ID 가져오기
   * @param folderPath 폴더 경로
   * @returns 프리셋 ID 또는 null
   */
  getPresetIdForFolder(folderPath: string): string | null;
  
  /**
   * 프리셋 자동 적용 여부 설정
   * @param autoApply 자동 적용 여부
   */
  setAutoApplyPresets(autoApply: boolean): void;
  
  /**
   * 프리셋 자동 적용 여부 가져오기
   * @returns 자동 적용 여부
   */
  getAutoApplyPresets(): boolean;
  
  /**
   * 현재 활성 파일의 폴더에 할당된 프리셋 ID 가져오기
   * @returns 프리셋 ID 또는 null
   */
  getPresetIdForActiveFolder(): string | null;
  
  /**
   * 현재 파일에 적합한 프리셋 ID 선택
   * @param file 현재 파일
   * @returns 선택된 프리셋 ID
   */
  selectPresetForFile(file: TFile): Promise<string>;
  
  /**
   * 프리셋 ID가 사용 중인지 확인
   * @param presetId 프리셋 ID
   * @returns 사용 중 여부
   */
  isPresetInUse(presetId: string): boolean;
  
  /**
   * 프리셋 ID를 사용 중인 폴더 경로 목록 가져오기
   * @param presetId 프리셋 ID
   * @returns 폴더 경로 목록
   */
  getFoldersUsingPreset(presetId: string): string[];
  
  /**
   * 프리셋 ID 변경 처리
   * @param oldPresetId 이전 프리셋 ID
   * @param newPresetId 새 프리셋 ID
   */
  handlePresetIdChange(oldPresetId: string, newPresetId: string): void;
  
  /**
   * 프리셋 삭제 처리
   * @param presetId 프리셋 ID
   */
  handlePresetDeletion(presetId: string): void;
  
  /**
   * 활성 파일 변경 처리
   * @param file 활성 파일
   */
  handleActiveFileChange(file: TFile | null): Promise<void>;
} 