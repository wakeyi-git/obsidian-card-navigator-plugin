import { Preset } from '@/domain/models/Preset';
import { ICardSetConfig } from '@/domain/models/CardSet';
import { ILayoutConfig } from '@/domain/models/Layout';
import { ICardRenderConfig } from '@/domain/models/Card';

/**
 * 프리셋 서비스 인터페이스
 */
export interface IPresetService {
  /**
   * 서비스 초기화
   */
  initialize(): void;

  /**
   * 서비스 정리
   */
  cleanup(): void;

  /**
   * 프리셋 생성
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   * @param cardSetConfig 카드셋 설정
   * @param layoutConfig 레이아웃 설정
   * @param cardRenderConfig 카드 렌더링 설정
   */
  createPreset(
    name: string,
    description: string,
    cardSetConfig: ICardSetConfig,
    layoutConfig: ILayoutConfig,
    cardRenderConfig: ICardRenderConfig
  ): Promise<Preset>;

  /**
   * 프리셋 업데이트
   * @param preset 프리셋
   */
  updatePreset(preset: Preset): Promise<void>;

  /**
   * 프리셋 삭제
   * @param id 프리셋 ID
   */
  deletePreset(id: string): Promise<void>;

  /**
   * 프리셋 조회
   * @param id 프리셋 ID
   */
  getPreset(id: string): Promise<Preset | undefined>;

  /**
   * 모든 프리셋 조회
   */
  getAllPresets(): Promise<Preset[]>;

  /**
   * 프리셋 적용
   * @param id 프리셋 ID
   */
  applyPreset(id: string): Promise<void>;

  /**
   * 프리셋 내보내기
   * @param id 프리셋 ID
   */
  exportPreset(id: string): Promise<string>;

  /**
   * 프리셋 가져오기
   * @param json 프리셋 JSON
   */
  importPreset(json: string): Promise<Preset>;

  /**
   * 폴더 매핑 추가
   */
  addFolderMapping(folderPath: string, presetId: string, includeSubfolders: boolean): Promise<void>;

  /**
   * 폴더 매핑 업데이트
   */
  updateFolderMapping(folderPath: string, presetId: string, includeSubfolders: boolean): Promise<void>;

  /**
   * 폴더 매핑 제거
   */
  removeFolderMapping(folderPath: string): Promise<void>;

  /**
   * 태그 매핑 추가
   */
  addTagMapping(tag: string, presetId: string): Promise<void>;

  /**
   * 태그 매핑 업데이트
   */
  updateTagMapping(tag: string, presetId: string): Promise<void>;

  /**
   * 태그 매핑 제거
   */
  removeTagMapping(tag: string): Promise<void>;

  /**
   * 매핑 우선순위 업데이트
   */
  updateMappingPriority(mappings: { type: 'folder' | 'tag'; key: string; priority: number }[]): Promise<void>;
} 