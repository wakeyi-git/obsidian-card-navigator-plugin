import { IPreset, IPresetConfig } from '../models/Preset';

/**
 * 프리셋 저장소 인터페이스
 */
export interface IPresetRepository {
  /**
   * 프리셋을 생성합니다.
   */
  createPreset(config: IPresetConfig): Promise<IPreset>;

  /**
   * 프리셋을 업데이트합니다.
   */
  updatePreset(preset: IPreset): Promise<void>;

  /**
   * 프리셋을 삭제합니다.
   */
  deletePreset(presetId: string): Promise<void>;

  /**
   * 프리셋을 조회합니다.
   */
  getPreset(presetId: string): Promise<IPreset | null>;

  /**
   * 모든 프리셋을 조회합니다.
   */
  getPresets(): Promise<IPreset[]>;
} 