import { IPreset } from '../models/Preset';
import { ICardRenderConfig } from '../models/CardRenderConfig';
import { ICardStyle } from '../models/CardStyle';
import { ISearchFilter } from '../models/SearchFilter';
import { ISortConfig } from '../models/SortConfig';

/**
 * 프리셋 관리자 인터페이스
 * - 프리셋 생성, 수정, 삭제, 적용
 * - 프리셋 매핑 관리
 * - 프리셋 우선순위 관리
 */
export interface IPresetManager {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 프리셋 생성
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   * @param config 프리셋 설정
   */
  createPreset(name: string, description: string, config: {
    renderConfig: ICardRenderConfig;
    cardStyle: ICardStyle;
    searchFilter: ISearchFilter;
    sortConfig: ISortConfig;
  }): Promise<IPreset>;

  /**
   * 프리셋 수정
   * @param preset 프리셋
   */
  updatePreset(preset: IPreset): Promise<void>;

  /**
   * 프리셋 삭제
   * @param presetId 프리셋 ID
   */
  deletePreset(presetId: string): Promise<void>;

  /**
   * 프리셋 적용
   * @param presetId 프리셋 ID
   */
  applyPreset(presetId: string): Promise<void>;

  /**
   * 프리셋 목록 조회
   */
  getPresets(): Promise<IPreset[]>;

  /**
   * 프리셋 조회
   * @param presetId 프리셋 ID
   */
  getPreset(presetId: string): Promise<IPreset | null>;

  /**
   * 폴더에 프리셋 매핑
   * @param folderPath 폴더 경로
   * @param presetId 프리셋 ID
   */
  mapPresetToFolder(folderPath: string, presetId: string): Promise<void>;

  /**
   * 태그에 프리셋 매핑
   * @param tag 태그
   * @param presetId 프리셋 ID
   */
  mapPresetToTag(tag: string, presetId: string): Promise<void>;

  /**
   * 프리셋 매핑 제거
   * @param folderPathOrTag 폴더 경로 또는 태그
   */
  removePresetMapping(folderPathOrTag: string): Promise<void>;

  /**
   * 프리셋 매핑 우선순위 업데이트
   * @param mappings 매핑 목록
   */
  updatePresetMappingPriority(mappings: Array<{
    folderPathOrTag: string;
    presetId: string;
    priority: number;
  }>): Promise<void>;

  /**
   * 현재 적용된 프리셋 조회
   */
  getCurrentPreset(): Promise<IPreset | null>;

  /**
   * 프리셋 내보내기
   * @param presetId 프리셋 ID
   */
  exportPreset(presetId: string): Promise<string>;

  /**
   * 프리셋 가져오기
   * @param presetJson 프리셋 JSON 문자열
   */
  importPreset(presetJson: string): Promise<IPreset>;
} 