import { TFile, TFolder } from 'obsidian';
import { Preset } from '../models/Preset';
import { CardNavigatorSettings } from '../types/settings.types';
import { PresetData } from '../types/preset.types';

/**
 * 프리셋 관리자 인터페이스
 * 카드 네비게이터의 프리셋을 관리하는 인터페이스입니다.
 */
export interface IPresetManager {
  /**
   * 프리셋 관리자 초기화
   * @param presetsData 프리셋 데이터 배열
   * @param globalDefaultPresetId 전역 기본 프리셋 ID
   */
  initialize(presetsData: PresetData[], globalDefaultPresetId: string | null): void;

  /**
   * 모든 프리셋 가져오기
   * @returns 프리셋 배열
   */
  getAllPresets(): Preset[];

  /**
   * 프리셋 가져오기
   * @param presetId 프리셋 ID
   * @returns 프리셋 객체 또는 undefined
   */
  getPreset(presetId: string): Preset | undefined;

  /**
   * 전역 기본 프리셋 가져오기
   * @returns 전역 기본 프리셋 또는 undefined
   */
  getGlobalDefaultPreset(): Preset | undefined;

  /**
   * 전역 기본 프리셋 ID 가져오기
   * @returns 전역 기본 프리셋 ID 또는 null
   */
  getGlobalDefaultPresetId(): string | null;

  /**
   * 전역 기본 프리셋 설정하기
   * @param presetId 프리셋 ID
   */
  setGlobalDefaultPreset(presetId: string): void;

  /**
   * 전역 기본 프리셋 해제하기
   */
  clearGlobalDefaultPreset(): void;

  /**
   * 프리셋 생성하기
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   * @param basePresetId 기반 프리셋 ID (선택 사항)
   * @returns 생성된 프리셋
   */
  createPreset(name: string, description?: string, basePresetId?: string): Preset;

  /**
   * 프리셋 업데이트하기
   * @param presetId 프리셋 ID
   * @param data 업데이트할 데이터
   * @returns 업데이트된 프리셋 또는 undefined
   */
  updatePreset(presetId: string, data: Partial<PresetData>): Preset | undefined;

  /**
   * 프리셋 삭제하기
   * @param presetId 프리셋 ID
   * @returns 삭제 성공 여부
   */
  deletePreset(presetId: string): boolean;

  /**
   * 프리셋 복제하기
   * @param presetId 프리셋 ID
   * @param newName 새 프리셋 이름 (선택 사항)
   * @returns 복제된 프리셋 또는 undefined
   */
  clonePreset(presetId: string, newName?: string): Preset | undefined;

  /**
   * 프리셋 가져오기
   * @param presetData 프리셋 데이터
   * @returns 가져온 프리셋 또는 undefined
   */
  importPreset(presetData: PresetData): Preset | undefined;

  /**
   * 프리셋 내보내기
   * @param presetId 프리셋 ID
   * @returns 프리셋 데이터 또는 undefined
   */
  exportPreset(presetId: string): PresetData | undefined;

  /**
   * 모든 프리셋 데이터 가져오기
   * @returns 프리셋 데이터 배열
   */
  getAllPresetData(): PresetData[];

  /**
   * 프리셋 ID 변경하기
   * @param oldPresetId 이전 프리셋 ID
   * @param newPresetId 새 프리셋 ID
   * @returns 성공 여부
   */
  changePresetId(oldPresetId: string, newPresetId: string): boolean;

  /**
   * 프리셋 적용
   * @param presetId 적용할 프리셋 ID
   * @returns 적용된 설정
   */
  applyPreset(presetId: string): Promise<Partial<CardNavigatorSettings>>;

  /**
   * 폴더에 프리셋 할당
   * @param folderPath 폴더 경로
   * @param presetId 프리셋 ID
   */
  assignPresetToFolder(folderPath: string, presetId: string): Promise<void>;

  /**
   * 폴더에 할당된 프리셋 ID 가져오기
   * @param folderPath 폴더 경로
   * @returns 프리셋 ID 또는 null
   */
  getPresetForFolder(folderPath: string): string | null;

  /**
   * 프리셋 데이터 가져오기
   * @param presetDataJson 프리셋 데이터 JSON 문자열
   * @returns 가져온 프리셋 배열
   */
  importPresets(presetDataJson: string): Promise<Preset[]>;

  /**
   * 프리셋 데이터 내보내기
   * @returns 프리셋 데이터 JSON 문자열
   */
  exportPresets(): Promise<string>;

  /**
   * 현재 파일에 적합한 프리셋 ID 선택
   * @param file 현재 파일
   * @returns 선택된 프리셋 ID
   */
  selectPresetForFile(file: TFile): Promise<string>;
} 