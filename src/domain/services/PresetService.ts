import { App } from 'obsidian';
import { Preset, IPreset, IPresetConfig, IPresetMapping } from '../models/Preset';
import { CardSet } from '../models/CardSet';
import { Layout } from '../models/Layout';
import { ICardRenderConfig } from '../models/Card';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { PresetCreatedEvent, PresetUpdatedEvent, PresetDeletedEvent } from '@/domain/events/PresetEvents';
import { TFile } from 'obsidian';

/**
 * 프리셋 서비스 인터페이스
 */
export interface IPresetService {
  /**
   * 프리셋 생성
   */
  createPreset(config: IPresetConfig): Promise<Preset>;

  /**
   * 프리셋 업데이트
   */
  updatePreset(preset: Preset): Promise<void>;

  /**
   * 프리셋 삭제
   */
  deletePreset(presetId: string): Promise<void>;

  /**
   * 프리셋 조회
   */
  getPreset(presetId: string): Promise<Preset | undefined>;

  /**
   * 모든 프리셋 조회
   */
  getAllPresets(): Promise<Preset[]>;

  /**
   * 매핑 추가
   */
  addMapping(presetId: string, mapping: IPresetMapping): Promise<void>;

  /**
   * 매핑 업데이트
   */
  updateMapping(presetId: string, mappingId: string, mapping: Partial<IPresetMapping>): Promise<void>;

  /**
   * 매핑 제거
   */
  removeMapping(presetId: string, mappingId: string): Promise<void>;

  /**
   * 매핑 우선순위 업데이트
   */
  updateMappingPriority(presetId: string, priority: string[]): Promise<void>;

  /**
   * 매핑 우선순위 정렬
   */
  sortMappingsByPriority(presetId: string): Promise<void>;

  /**
   * 매핑 조회
   */
  getMapping(presetId: string, mappingId: string): Promise<IPresetMapping | undefined>;

  /**
   * 타입별 매핑 조회
   */
  getMappingsByType(presetId: string, type: string): Promise<IPresetMapping[]>;

  /**
   * 값별 매핑 조회
   */
  getMappingsByValue(presetId: string, value: string): Promise<IPresetMapping[]>;

  /**
   * 매핑 존재 여부 확인
   */
  hasMapping(presetId: string, type: string, value: string): Promise<boolean>;
}

/**
 * 프리셋 서비스 클래스
 */
export class PresetService implements IPresetService {
  private readonly _presets: Map<string, Preset>;

  constructor(
    private readonly app: App,
    private readonly eventDispatcher: DomainEventDispatcher
  ) {
    this._presets = new Map();
  }

  /**
   * 프리셋 생성
   */
  async createPreset(config: IPresetConfig): Promise<Preset> {
    const preset = new Preset(
      crypto.randomUUID(),
      config.name,
      config.description,
      config.cardSetConfig,
      config.layoutConfig,
      config.cardRenderConfig,
      config.mappings
    );
    this._presets.set(preset.id, preset);
    this.eventDispatcher.dispatch(new PresetCreatedEvent(preset));
    return preset;
  }

  /**
   * 프리셋 업데이트
   */
  async updatePreset(preset: Preset): Promise<void> {
    const existingPreset = this._presets.get(preset.id);
    if (!existingPreset) {
      throw new Error(`Preset not found: ${preset.id}`);
    }

    this._presets.set(preset.id, preset);
    this.eventDispatcher.dispatch(new PresetUpdatedEvent(preset));
  }

  /**
   * 프리셋 삭제
   */
  async deletePreset(presetId: string): Promise<void> {
    const preset = this._presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    this._presets.delete(presetId);
    this.eventDispatcher.dispatch(new PresetDeletedEvent(preset.id));
  }

  /**
   * 프리셋 조회
   */
  async getPreset(presetId: string): Promise<Preset | undefined> {
    return this._presets.get(presetId);
  }

  /**
   * 모든 프리셋 조회
   */
  async getAllPresets(): Promise<Preset[]> {
    return Array.from(this._presets.values());
  }

  /**
   * 매핑 추가
   */
  async addMapping(presetId: string, mapping: IPresetMapping): Promise<void> {
    const preset = this._presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    preset.addMapping(mapping);
    this.eventDispatcher.dispatch(new PresetUpdatedEvent(preset));
  }

  /**
   * 매핑 업데이트
   */
  async updateMapping(presetId: string, mappingId: string, mapping: Partial<IPresetMapping>): Promise<void> {
    const preset = this._presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    const existingMapping = preset.getMapping(mappingId);
    if (!existingMapping) {
      throw new Error(`Mapping not found: ${mappingId}`);
    }

    const updatedMapping: IPresetMapping = {
      ...existingMapping,
      ...mapping,
      id: mappingId // id는 변경하지 않음
    };

    preset.updateMapping(mappingId, updatedMapping);
    this.eventDispatcher.dispatch(new PresetUpdatedEvent(preset));
  }

  /**
   * 매핑 제거
   */
  async removeMapping(presetId: string, mappingId: string): Promise<void> {
    const preset = this._presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    preset.removeMapping(mappingId);
    this.eventDispatcher.dispatch(new PresetUpdatedEvent(preset));
  }

  /**
   * 매핑 우선순위 업데이트
   */
  async updateMappingPriority(presetId: string, priority: string[]): Promise<void> {
    const preset = this._presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    preset.updateMappingPriority(priority);
    this.eventDispatcher.dispatch(new PresetUpdatedEvent(preset));
  }

  /**
   * 매핑 우선순위 정렬
   */
  async sortMappingsByPriority(presetId: string): Promise<void> {
    const preset = this._presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    preset.sortMappingsByPriority();
    this.eventDispatcher.dispatch(new PresetUpdatedEvent(preset));
  }

  /**
   * 매핑 조회
   */
  async getMapping(presetId: string, mappingId: string): Promise<IPresetMapping | undefined> {
    const preset = this._presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    return preset.getMapping(mappingId);
  }

  /**
   * 타입별 매핑 조회
   */
  async getMappingsByType(presetId: string, type: string): Promise<IPresetMapping[]> {
    const preset = this._presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    return preset.getMappingsByType(type);
  }

  /**
   * 값별 매핑 조회
   */
  async getMappingsByValue(presetId: string, value: string): Promise<IPresetMapping[]> {
    const preset = this._presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    return preset.getMappingsByValue(value);
  }

  /**
   * 매핑 존재 여부 확인
   */
  async hasMapping(presetId: string, type: string, value: string): Promise<boolean> {
    const preset = this._presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    return preset.hasMapping(type, value);
  }

  /**
   * 파일에 적용할 프리셋 찾기
   */
  findApplicablePreset(file: TFile, presets: IPreset[]): IPreset | null {
    let applicablePreset: IPreset | null = null;
    let highestPriority = -1;

    for (const preset of presets) {
      for (const mapping of preset.mappings) {
        const priority = this._calculateMappingPriority(mapping, file);
        if (priority > highestPriority) {
          highestPriority = priority;
          applicablePreset = preset;
        }
      }
    }

    return applicablePreset;
  }

  /**
   * 매핑 우선순위 계산
   */
  private _calculateMappingPriority(mapping: IPresetMapping, file: TFile): number {
    switch (mapping.type) {
      case 'folder':
        if (file.path.startsWith(mapping.value)) {
          return mapping.includeSubfolders ? 3 : 2;
        }
        break;

      case 'tag':
        const fileTags = this._getFileTags(file);
        if (fileTags.includes(mapping.value)) {
          return 2;
        }
        break;

      case 'date':
        if (mapping.dateRange) {
          const fileDate = this._getFileDate(file);
          if (fileDate >= mapping.dateRange.start && fileDate <= mapping.dateRange.end) {
            return 1;
          }
        }
        break;

      case 'property':
        if (mapping.property) {
          const fileProperties = this._getFileProperties(file);
          if (fileProperties[mapping.property.name] === mapping.property.value) {
            return 1;
          }
        }
        break;
    }

    return 0;
  }

  /**
   * 파일의 태그 가져오기
   */
  private _getFileTags(file: TFile): string[] {
    const tags: string[] = [];
    const content = this.app.vault.getAbstractFileByPath(file.path);
    if (content) {
      const tagRegex = /#[\w-]+/g;
      const matches = content.toString().match(tagRegex);
      if (matches) {
        tags.push(...matches);
      }
    }
    return tags;
  }

  /**
   * 파일의 날짜 가져오기
   */
  private _getFileDate(file: TFile): Date {
    return new Date(file.stat.mtime);
  }

  /**
   * 파일의 속성 가져오기
   */
  private _getFileProperties(file: TFile): Record<string, string> {
    const properties: Record<string, string> = {};
    const content = this.app.vault.getAbstractFileByPath(file.path);
    if (content) {
      const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
      const match = content.toString().match(frontmatterRegex);
      if (match) {
        const frontmatter = match[1];
        const lines = frontmatter.split('\n');
        for (const line of lines) {
          const [key, value] = line.split(':').map(s => s.trim());
          if (key && value) {
            properties[key] = value;
          }
        }
      }
    }
    return properties;
  }
} 