import { Preset, IPresetConfig, IPresetMapping, PresetType } from '@/domain/models/Preset';
import { IPresetService } from '@/domain/services/IPresetService';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { App } from 'obsidian';
import { ICardSetConfig } from '@/domain/models/CardSet';
import { ILayoutConfig } from '@/domain/models/Layout';
import { ICardRenderConfig } from '@/domain/models/Card';
import { PresetServiceError } from '@/domain/errors/PresetServiceError';

/**
 * 프리셋 유스케이스
 */
export class PresetUseCases {
  constructor(
    private readonly app: App,
    private readonly presetService: IPresetService,
    private readonly eventDispatcher: DomainEventDispatcher
  ) {}

  /**
   * 프리셋 생성
   */
  async createPreset(
    name: string,
    description: string,
    cardSetConfig: ICardSetConfig,
    layoutConfig: ILayoutConfig,
    cardRenderConfig: ICardRenderConfig
  ): Promise<Preset> {
    try {
      return await this.presetService.createPreset(
        name,
        description,
        cardSetConfig,
        layoutConfig,
        cardRenderConfig
      );
    } catch (error) {
      throw new PresetServiceError(`프리셋 생성 실패: ${error.message}`);
    }
  }

  /**
   * 프리셋 업데이트
   */
  async updatePreset(preset: Preset): Promise<void> {
    try {
      const existingPreset = await this.presetService.getPreset(preset.id);
      if (!existingPreset) {
        throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${preset.id}`);
      }
      await this.presetService.updatePreset(preset);
    } catch (error) {
      throw new PresetServiceError(`프리셋 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 프리셋 삭제
   */
  async deletePreset(id: string): Promise<void> {
    try {
      const preset = await this.presetService.getPreset(id);
      if (!preset) {
        throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${id}`);
      }
      await this.presetService.deletePreset(id);
    } catch (error) {
      throw new PresetServiceError(`프리셋 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 프리셋 복제
   */
  async clonePreset(presetId: string): Promise<Preset> {
    try {
      const preset = await this.presetService.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${presetId}`);
      }

      const clonedPreset = preset.clone();
      return await this.presetService.createPreset(
        `${clonedPreset.name} (복사본)`,
        clonedPreset.description || '',
        clonedPreset.cardSetConfig,
        clonedPreset.layoutConfig,
        clonedPreset.cardRenderConfig
      );
    } catch (error) {
      throw new PresetServiceError(`프리셋 복제 실패: ${error.message}`);
    }
  }

  /**
   * 프리셋 매핑 추가
   */
  async addMapping(presetId: string, mapping: IPresetMapping): Promise<void> {
    try {
      const preset = await this.presetService.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${presetId}`);
      }

      if (mapping.type === PresetType.FOLDER) {
        await this.presetService.addFolderMapping(
          mapping.value,
          presetId,
          mapping.includeSubfolders || false
        );
      } else if (mapping.type === PresetType.TAG) {
        await this.presetService.addTagMapping(
          mapping.value,
          presetId
        );
      }
    } catch (error) {
      throw new PresetServiceError(`매핑 추가 실패: ${error.message}`);
    }
  }

  /**
   * 프리셋 매핑 업데이트
   */
  async updateMapping(presetId: string, mappingId: string, mapping: Partial<IPresetMapping>): Promise<void> {
    try {
      const preset = await this.presetService.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${presetId}`);
      }

      const existingMapping = preset.mappings.find(m => m.id === mappingId);
      if (!existingMapping) {
        throw new PresetServiceError(`매핑을 찾을 수 없습니다: ${mappingId}`);
      }

      if (existingMapping.type === PresetType.FOLDER) {
        await this.presetService.updateFolderMapping(
          existingMapping.value,
          presetId,
          mapping.includeSubfolders ?? existingMapping.includeSubfolders ?? false
        );
      } else if (existingMapping.type === PresetType.TAG) {
        await this.presetService.updateTagMapping(
          existingMapping.value,
          presetId
        );
      }
    } catch (error) {
      throw new PresetServiceError(`매핑 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 프리셋 매핑 삭제
   */
  async deleteMapping(presetId: string, mappingId: string): Promise<void> {
    try {
      const preset = await this.presetService.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${presetId}`);
      }

      const existingMapping = preset.mappings.find(m => m.id === mappingId);
      if (!existingMapping) {
        throw new PresetServiceError(`매핑을 찾을 수 없습니다: ${mappingId}`);
      }

      if (existingMapping.type === PresetType.FOLDER) {
        await this.presetService.removeFolderMapping(existingMapping.value);
      } else if (existingMapping.type === PresetType.TAG) {
        await this.presetService.removeTagMapping(existingMapping.value);
      }
    } catch (error) {
      throw new PresetServiceError(`매핑 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 프리셋 매핑 우선순위 업데이트
   */
  async updateMappingPriority(mappings: { type: 'folder' | 'tag'; key: string; priority: number }[]): Promise<void> {
    try {
      await this.presetService.updateMappingPriority(mappings);
    } catch (error) {
      throw new PresetServiceError(`매핑 우선순위 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 프리셋 가져오기
   */
  async importPreset(json: string): Promise<Preset> {
    try {
      return await this.presetService.importPreset(json);
    } catch (error) {
      throw new PresetServiceError(`프리셋 가져오기 실패: ${error.message}`);
    }
  }

  /**
   * 프리셋 내보내기
   */
  async exportPreset(id: string): Promise<string> {
    try {
      const preset = await this.presetService.getPreset(id);
      if (!preset) {
        throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${id}`);
      }
      return await this.presetService.exportPreset(id);
    } catch (error) {
      throw new PresetServiceError(`프리셋 내보내기 실패: ${error.message}`);
    }
  }

  /**
   * 프리셋 미리보기
   */
  async previewPreset(presetId: string): Promise<IPresetConfig> {
    const preset = await this.presetService.getPreset(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }
    return preset.preview();
  }

  /**
   * 프리셋 조회
   */
  async getPreset(id: string): Promise<Preset> {
    const preset = await this.presetService.getPreset(id);
    if (!preset) {
      throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${id}`);
    }
    return preset;
  }

  /**
   * 모든 프리셋 조회
   */
  async getAllPresets(): Promise<Preset[]> {
    try {
      return await this.presetService.getAllPresets();
    } catch (error) {
      throw new PresetServiceError(`프리셋 목록 조회 실패: ${error.message}`);
    }
  }

  /**
   * 프리셋 적용
   */
  async applyPreset(id: string): Promise<void> {
    try {
      const preset = await this.presetService.getPreset(id);
      if (!preset) {
        throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${id}`);
      }
      await this.presetService.applyPreset(id);
    } catch (error) {
      throw new PresetServiceError(`프리셋 적용 실패: ${error.message}`);
    }
  }

  /**
   * 폴더 매핑 추가
   */
  async addFolderMapping(folderPath: string, presetId: string, includeSubfolders: boolean): Promise<void> {
    try {
      const preset = await this.presetService.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${presetId}`);
      }
      await this.presetService.addFolderMapping(folderPath, presetId, includeSubfolders);
    } catch (error) {
      throw new PresetServiceError(`폴더 매핑 추가 실패: ${error.message}`);
    }
  }

  /**
   * 폴더 매핑 업데이트
   */
  async updateFolderMapping(folderPath: string, presetId: string, includeSubfolders: boolean): Promise<void> {
    try {
      const preset = await this.presetService.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${presetId}`);
      }
      await this.presetService.updateFolderMapping(folderPath, presetId, includeSubfolders);
    } catch (error) {
      throw new PresetServiceError(`폴더 매핑 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 폴더 매핑 제거
   */
  async removeFolderMapping(folderPath: string): Promise<void> {
    try {
      await this.presetService.removeFolderMapping(folderPath);
    } catch (error) {
      throw new PresetServiceError(`폴더 매핑 제거 실패: ${error.message}`);
    }
  }

  /**
   * 태그 매핑 추가
   */
  async addTagMapping(tag: string, presetId: string): Promise<void> {
    try {
      const preset = await this.presetService.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${presetId}`);
      }
      await this.presetService.addTagMapping(tag, presetId);
    } catch (error) {
      throw new PresetServiceError(`태그 매핑 추가 실패: ${error.message}`);
    }
  }

  /**
   * 태그 매핑 업데이트
   */
  async updateTagMapping(tag: string, presetId: string): Promise<void> {
    try {
      const preset = await this.presetService.getPreset(presetId);
      if (!preset) {
        throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${presetId}`);
      }
      await this.presetService.updateTagMapping(tag, presetId);
    } catch (error) {
      throw new PresetServiceError(`태그 매핑 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 태그 매핑 제거
   */
  async removeTagMapping(tag: string): Promise<void> {
    try {
      await this.presetService.removeTagMapping(tag);
    } catch (error) {
      throw new PresetServiceError(`태그 매핑 제거 실패: ${error.message}`);
    }
  }
} 