import { IPreset } from './Preset';

/**
 * 프리셋 매핑 인터페이스
 * 폴더나 태그에 프리셋을 매핑하기 위한 인터페이스입니다.
 */
export interface IPresetMapping {
  /**
   * 매핑 ID
   */
  id: string;
  
  /**
   * 매핑 타입 (폴더 또는 태그)
   */
  type: 'folder' | 'tag';
  
  /**
   * 매핑 대상 (폴더 경로 또는 태그 이름)
   */
  target: string;
  
  /**
   * 프리셋 ID
   */
  presetId: string;
  
  /**
   * 우선순위 (낮을수록 우선)
   */
  priority: number;
}

/**
 * 프리셋 관리자 인터페이스
 * 프리셋 관리 기능을 정의합니다.
 */
export interface IPresetManager {
  /**
   * 모든 프리셋 가져오기
   * @returns 프리셋 목록
   */
  getAllPresets(): IPreset[];
  
  /**
   * 프리셋 가져오기
   * @param id 프리셋 ID
   * @returns 프리셋 또는 undefined
   */
  getPreset(id: string): IPreset | undefined;
  
  /**
   * 프리셋 추가
   * @param preset 추가할 프리셋
   * @returns 추가된 프리셋
   */
  addPreset(preset: IPreset): IPreset;
  
  /**
   * 프리셋 업데이트
   * @param id 프리셋 ID
   * @param preset 업데이트할 프리셋 데이터
   * @returns 업데이트된 프리셋 또는 undefined
   */
  updatePreset(id: string, preset: Partial<IPreset>): IPreset | undefined;
  
  /**
   * 프리셋 삭제
   * @param id 삭제할 프리셋 ID
   * @returns 삭제 성공 여부
   */
  deletePreset(id: string): boolean;
  
  /**
   * 모든 매핑 가져오기
   * @returns 매핑 목록
   */
  getAllMappings(): IPresetMapping[];
  
  /**
   * 매핑 추가
   * @param mapping 추가할 매핑
   * @returns 추가된 매핑
   */
  addMapping(mapping: IPresetMapping): IPresetMapping;
  
  /**
   * 매핑 업데이트
   * @param id 매핑 ID
   * @param mapping 업데이트할 매핑 데이터
   * @returns 업데이트된 매핑 또는 undefined
   */
  updateMapping(id: string, mapping: Partial<IPresetMapping>): IPresetMapping | undefined;
  
  /**
   * 매핑 삭제
   * @param id 삭제할 매핑 ID
   * @returns 삭제 성공 여부
   */
  deleteMapping(id: string): boolean;
  
  /**
   * 폴더에 적용할 프리셋 찾기
   * @param folderPath 폴더 경로
   * @returns 프리셋 또는 undefined
   */
  findPresetForFolder(folderPath: string): IPreset | undefined;
  
  /**
   * 태그에 적용할 프리셋 찾기
   * @param tag 태그 이름
   * @returns 프리셋 또는 undefined
   */
  findPresetForTag(tag: string): IPreset | undefined;
}