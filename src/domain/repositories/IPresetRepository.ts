import { Preset } from '@/domain/models/Preset';

/**
 * 프리셋 리포지토리 인터페이스
 */
export interface IPresetRepository {
  /**
   * 프리셋 저장
   * @param preset 저장할 프리셋
   */
  save(preset: Preset): Promise<void>;

  /**
   * ID로 프리셋 찾기
   * @param id 프리셋 ID
   */
  findById(id: string): Promise<Preset | undefined>;

  /**
   * 모든 프리셋 찾기
   */
  findAll(): Promise<Preset[]>;

  /**
   * 프리셋 삭제
   * @param id 프리셋 ID
   */
  delete(id: string): Promise<void>;
} 