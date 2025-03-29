import { Preset, IPresetConfig, IPresetMapping } from '../../domain/models/Preset';
import { IPresetService } from '../../domain/services/PresetService';

/**
 * 프리셋 생성 유스케이스
 */
export class CreatePresetUseCase {
  constructor(private readonly presetService: IPresetService) {}

  /**
   * 프리셋 생성
   */
  async execute(config: IPresetConfig): Promise<Preset> {
    return this.presetService.createPreset(config);
  }
}

/**
 * 프리셋 업데이트 유스케이스
 */
export class UpdatePresetUseCase {
  constructor(private readonly presetService: IPresetService) {}

  /**
   * 프리셋 업데이트
   */
  async execute(preset: Preset): Promise<void> {
    await this.presetService.updatePreset(preset);
  }
}

/**
 * 프리셋 삭제 유스케이스
 */
export class DeletePresetUseCase {
  constructor(private readonly presetService: IPresetService) {}

  /**
   * 프리셋 삭제
   */
  async execute(presetId: string): Promise<void> {
    await this.presetService.deletePreset(presetId);
  }
}

/**
 * 프리셋 조회 유스케이스
 */
export class GetPresetUseCase {
  constructor(private readonly presetService: IPresetService) {}

  /**
   * 프리셋 조회
   */
  async execute(presetId: string): Promise<Preset | undefined> {
    return this.presetService.getPreset(presetId);
  }
}

/**
 * 모든 프리셋 조회 유스케이스
 */
export class GetAllPresetsUseCase {
  constructor(private readonly presetService: IPresetService) {}

  /**
   * 모든 프리셋 조회
   */
  async execute(): Promise<Preset[]> {
    return this.presetService.getAllPresets();
  }
}

/**
 * 프리셋 매핑 생성 유스케이스
 */
export class CreatePresetMappingUseCase {
  constructor(private readonly presetService: IPresetService) {}

  /**
   * 프리셋 매핑 생성
   */
  async execute(
    presetId: string,
    type: 'folder' | 'file' | 'tag',
    value: string,
    priority: number
  ): Promise<void> {
    const mapping: IPresetMapping = {
      id: crypto.randomUUID(),
      presetId,
      type,
      value,
      priority
    };
    await this.presetService.addMapping(presetId, mapping);
  }
}

/**
 * 프리셋 매핑 업데이트 유스케이스
 */
export class UpdatePresetMappingUseCase {
  constructor(private readonly presetService: IPresetService) {}

  /**
   * 프리셋 매핑 업데이트
   */
  async execute(
    presetId: string,
    mappingId: string,
    type: 'folder' | 'file' | 'tag',
    value: string,
    priority: number
  ): Promise<void> {
    const mapping: Partial<IPresetMapping> = {
      type,
      value,
      priority
    };
    await this.presetService.updateMapping(presetId, mappingId, mapping);
  }
}

/**
 * 프리셋 매핑 삭제 유스케이스
 */
export class DeletePresetMappingUseCase {
  constructor(private readonly presetService: IPresetService) {}

  /**
   * 프리셋 매핑 삭제
   */
  async execute(presetId: string, mappingId: string): Promise<void> {
    await this.presetService.removeMapping(presetId, mappingId);
  }
}

/**
 * 프리셋 매핑 우선순위 업데이트 유스케이스
 */
export class UpdatePresetMappingPriorityUseCase {
  constructor(private readonly presetService: IPresetService) {}

  /**
   * 프리셋 매핑 우선순위 업데이트
   */
  async execute(
    presetId: string,
    mappingId: string,
    priority: number
  ): Promise<void> {
    await this.presetService.updateMappingPriority(presetId, mappingId, priority);
  }
}

/**
 * 프리셋 가져오기 유스케이스
 */
export class ImportPresetUseCase {
  constructor(private readonly presetService: IPresetService) {}

  /**
   * 프리셋 가져오기
   */
  async execute(jsonString: string): Promise<Preset> {
    const config = JSON.parse(jsonString) as IPresetConfig;
    return this.presetService.createPreset(config);
  }
}

/**
 * 프리셋 내보내기 유스케이스
 */
export class ExportPresetUseCase {
  constructor(private readonly presetService: IPresetService) {}

  /**
   * 프리셋 내보내기
   */
  async execute(presetId: string): Promise<string> {
    const preset = await this.presetService.getPreset(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }
    return JSON.stringify(preset.config);
  }
} 