import { Preset, IPreset, IPresetConfig, IPresetMapping, PresetMappingType } from '@/domain/models/Preset';
import { PresetService } from '@/domain/services/PresetService';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { App } from 'obsidian';

/**
 * 프리셋 유스케이스
 */
export class PresetUseCases {
  constructor(
    private readonly app: App,
    private readonly presetService: PresetService,
    private readonly eventDispatcher: DomainEventDispatcher
  ) {}

  /**
   * 프리셋 생성
   */
  async createPreset(config: IPresetConfig): Promise<Preset> {
    return this.presetService.createPreset(config);
  }

  /**
   * 프리셋 업데이트
   */
  async updatePreset(preset: Preset): Promise<void> {
    await this.presetService.updatePreset(preset);
  }

  /**
   * 프리셋 삭제
   */
  async deletePreset(presetId: string): Promise<void> {
    await this.presetService.deletePreset(presetId);
  }

  /**
   * 프리셋 복제
   */
  async clonePreset(presetId: string): Promise<Preset> {
    const preset = await this.presetService.getPreset(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    const clonedPreset = preset.clone();
    return this.presetService.createPreset({
      name: clonedPreset.name,
      description: clonedPreset.description,
      cardSetConfig: clonedPreset.cardSetConfig,
      layoutConfig: clonedPreset.layoutConfig,
      cardRenderConfig: clonedPreset.cardRenderConfig,
      mappings: clonedPreset.mappings
    });
  }

  /**
   * 프리셋 매핑 추가
   */
  async addMapping(presetId: string, mapping: IPresetMapping): Promise<void> {
    await this.presetService.addMapping(presetId, mapping);
  }

  /**
   * 프리셋 매핑 업데이트
   */
  async updateMapping(presetId: string, mappingId: string, mapping: Partial<IPresetMapping>): Promise<void> {
    await this.presetService.updateMapping(presetId, mappingId, mapping);
  }

  /**
   * 프리셋 매핑 삭제
   */
  async deleteMapping(presetId: string, mappingId: string): Promise<void> {
    await this.presetService.removeMapping(presetId, mappingId);
  }

  /**
   * 프리셋 매핑 우선순위 업데이트
   */
  async updateMappingPriority(presetId: string, priority: string[]): Promise<void> {
    await this.presetService.updateMappingPriority(presetId, priority);
  }

  /**
   * 프리셋 가져오기
   */
  async importPreset(json: string): Promise<Preset> {
    const preset = Preset.fromJSON(json);
    return this.presetService.createPreset({
      name: preset.name,
      description: preset.description,
      cardSetConfig: preset.cardSetConfig,
      layoutConfig: preset.layoutConfig,
      cardRenderConfig: preset.cardRenderConfig,
      mappings: preset.mappings
    });
  }

  /**
   * 프리셋 내보내기
   */
  async exportPreset(presetId: string): Promise<string> {
    const preset = await this.presetService.getPreset(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }
    return preset.toJSON();
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
} 