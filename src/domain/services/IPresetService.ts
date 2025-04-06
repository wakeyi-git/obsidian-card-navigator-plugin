import { IPreset, IPresetMapping } from '../models/Preset';
import { ICardConfig } from '../models/CardConfig';
import { ICardSetConfig } from '../models/CardSetConfig';
import { ILayoutConfig } from '../models/LayoutConfig';
import { ISortConfig } from '../models/SortConfig';
import { ISearchConfig } from '../models/SearchConfig';

/**
 * 프리셋 서비스 인터페이스
 * - 프리셋 생성 및 관리
 * - 프리셋 매핑
 * - 프리셋 우선순위
 */
export interface IPresetService {
  /**
   * 서비스 초기화
   */
  initialize(): Promise<void>;

  /**
   * 서비스 정리
   */
  cleanup(): Promise<void>;

  /**
   * 현재 프리셋 가져오기
   */
  getCurrentPreset(): Promise<IPreset | null>;

  /**
   * 기본 프리셋 로드
   */
  loadDefaultPreset(): Promise<IPreset>;

  /**
   * 프리셋 생성
   */
  createPreset(
    name: string,
    description: string,
    category: string,
    cardConfig: ICardConfig,
    cardSetConfig: ICardSetConfig,
    layoutConfig: ILayoutConfig,
    sortConfig: ISortConfig,
    searchConfig: ISearchConfig
  ): Promise<IPreset>;

  /**
   * 프리셋 업데이트
   */
  updatePreset(
    preset: IPreset,
    cardConfig: ICardConfig,
    cardSetConfig: ICardSetConfig,
    layoutConfig: ILayoutConfig,
    sortConfig: ISortConfig,
    searchConfig: ISearchConfig
  ): Promise<IPreset>;

  /**
   * 프리셋 삭제
   */
  deletePreset(presetId: string): Promise<void>;

  /**
   * 프리셋 복제
   */
  clonePreset(presetId: string, newName: string): Promise<IPreset | null>;

  /**
   * 프리셋 적용
   */
  applyPreset(presetId: string): Promise<void>;

  /**
   * 프리셋 가져오기
   */
  getPreset(presetId: string): Promise<IPreset | null>;

  /**
   * 모든 프리셋 가져오기
   */
  getAllPresets(): Promise<IPreset[]>;

  /**
   * 프리셋 유효성 검사
   */
  validatePreset(preset: IPreset): boolean;

  /**
   * 프리셋 내보내기
   * @param presetId 프리셋 ID
   */
  exportPreset(presetId: string): Promise<string>;

  /**
   * 프리셋 가져오기
   * @param presetJson 프리셋 JSON
   */
  importPreset(presetJson: string): Promise<IPreset | null>;

  /**
   * 프리셋 매핑 생성
   * @param presetId 프리셋 ID
   * @param mapping 매핑
   */
  createPresetMapping(
    presetId: string,
    mapping: Omit<IPresetMapping, 'id'>
  ): Promise<IPresetMapping | null>;

  /**
   * 프리셋 매핑 업데이트
   * @param mappingId 매핑 ID
   * @param mapping 매핑
   */
  updatePresetMapping(
    mappingId: string,
    mapping: Partial<IPresetMapping>
  ): Promise<void>;

  /**
   * 프리셋 매핑 삭제
   * @param mappingId 매핑 ID
   */
  deletePresetMapping(mappingId: string): Promise<void>;

  /**
   * 매핑 우선순위 업데이트
   * @param mappingIds 매핑 ID 목록
   */
  updateMappingPriority(mappingIds: string[]): Promise<void>;

  /**
   * 프리셋 이벤트 구독
   * @param callback 콜백 함수
   */
  subscribeToPresetEvents(callback: (event: any) => void): void;

  /**
   * 프리셋 이벤트 구독 해제
   * @param callback 콜백 함수
   */
  unsubscribeFromPresetEvents(callback: (event: any) => void): void;
} 