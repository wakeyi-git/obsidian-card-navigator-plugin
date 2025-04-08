import { IPreset } from '../models/Preset';

/**
 * 프리셋 이벤트 타입
 */
export type PresetEventType = 
  | 'preset_created'
  | 'preset_updated'
  | 'preset_deleted'
  | 'preset_applied'
  | 'preset_mapping_added'
  | 'preset_mapping_removed'
  | 'preset_mapping_priority_updated';

/**
 * 프리셋 이벤트
 */
export interface IPresetEvent {
  type: PresetEventType;
  presetId: string;
  mappingId?: string;
  timestamp: Date;
}

/**
 * 프리셋 상태
 */
export interface IPresetState {
  preset: IPreset;
  isActive: boolean;
  lastAppliedAt?: Date;
}

/**
 * 프리셋 매핑 상태
 */
export interface IPresetMappingState {
  mappingId: string;
  presetId: string;
  targetType: 'folder' | 'tag' | 'created_date' | 'modified_date' | 'property';
  targetValue: string;
  priority: number;
  includeSubfolders?: boolean;
  useRegex?: boolean;
  startDate?: Date;
  endDate?: Date;
}

/**
 * 프리셋 관리자 인터페이스
 * 
 * 프리셋 상태와 매핑을 관리하는 매니저
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
   * 초기화 여부 확인
   * @returns 초기화 여부
   */
  isInitialized(): boolean;

  /**
   * 프리셋 상태 등록
   * @param presetId 프리셋 ID
   * @param state 프리셋 상태
   */
  registerPresetState(presetId: string, state: IPresetState): void;

  /**
   * 프리셋 상태 등록 해제
   * @param presetId 프리셋 ID
   */
  unregisterPresetState(presetId: string): void;

  /**
   * 프리셋 상태 조회
   * @param presetId 프리셋 ID
   * @returns 프리셋 상태
   */
  getPresetState(presetId: string): IPresetState | null;

  /**
   * 모든 프리셋 상태 조회
   * @returns 프리셋 상태 Map
   */
  getPresetStates(): Map<string, IPresetState>;

  /**
   * 프리셋 상태 업데이트
   * @param presetId 프리셋 ID
   * @param state 업데이트할 프리셋 상태
   */
  updatePresetState(presetId: string, state: Partial<IPresetState>): void;

  /**
   * 프리셋 매핑 상태 등록
   * @param mappingId 매핑 ID
   * @param state 매핑 상태
   */
  registerPresetMappingState(mappingId: string, state: IPresetMappingState): void;

  /**
   * 프리셋 매핑 상태 등록 해제
   * @param mappingId 매핑 ID
   */
  unregisterPresetMappingState(mappingId: string): void;

  /**
   * 프리셋 매핑 상태 조회
   * @param mappingId 매핑 ID
   * @returns 매핑 상태
   */
  getPresetMappingState(mappingId: string): IPresetMappingState | null;

  /**
   * 모든 프리셋 매핑 상태 조회
   * @returns 매핑 상태 Map
   */
  getPresetMappingStates(): Map<string, IPresetMappingState>;

  /**
   * 프리셋 매핑 상태 업데이트
   * @param mappingId 매핑 ID
   * @param state 업데이트할 매핑 상태
   */
  updatePresetMappingState(mappingId: string, state: Partial<IPresetMappingState>): void;

  /**
   * 프리셋 이벤트 구독
   * @param callback 이벤트 콜백
   */
  subscribeToPresetEvents(callback: (event: IPresetEvent) => void): void;

  /**
   * 프리셋 이벤트 구독 해제
   * @param callback 이벤트 콜백
   */
  unsubscribeFromPresetEvents(callback: (event: IPresetEvent) => void): void;
} 