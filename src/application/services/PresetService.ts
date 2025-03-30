import { App } from 'obsidian';
import { Preset, IPreset, IPresetConfig, IPresetMapping, PresetType } from '@/domain/models/Preset';
import { ICardRenderConfig } from '@/domain/models/Card';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { PresetCreatedEvent, PresetUpdatedEvent, PresetDeletedEvent } from '@/domain/events/PresetEvents';
import { TFile } from 'obsidian';
import { IPresetService } from '@/domain/services/IPresetService';
import { ICardSetConfig } from '@/domain/models/CardSet';
import { ILayoutConfig } from '@/domain/models/Layout';
import { PresetServiceError } from '@/domain/errors/PresetServiceError';
import { LoggingService } from '@/infrastructure/services/LoggingService';

/**
 * 프리셋 서비스 클래스
 */
export class PresetService implements IPresetService {
  private presets: Map<string, Preset> = new Map();
  private mappings: Map<string, Map<string, IPresetMapping>> = new Map();
  private priority: Map<string, string[]> = new Map();

  constructor(
    private readonly app: App,
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly logger: LoggingService
  ) {}

  /**
   * 프리셋 초기화
   */
  initialize(): void {
    this.loadPresets();
  }

  /**
   * 프리셋 정리
   */
  cleanup(): void {
    this.savePresets();
  }

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
    const config: IPresetConfig = {
      name,
      description,
      cardSetConfig,
      layoutConfig,
      cardRenderConfig,
      mappings: []
    };

    const preset = new Preset(
      crypto.randomUUID(),
      config.name,
      config.description,
      config.cardSetConfig,
      config.layoutConfig,
      config.cardRenderConfig,
      config.mappings
    );

    this.presets.set(preset.id, preset);
    this.mappings.set(preset.id, new Map());
    this.priority.set(preset.id, []);

    // 이벤트 발생
    this.eventDispatcher.dispatch(new PresetCreatedEvent(preset));

    return preset;
  }

  /**
   * 프리셋 업데이트
   */
  async updatePreset(preset: Preset): Promise<void> {
    const existingPreset = this.presets.get(preset.id);
    if (!existingPreset) {
      throw new Error(`Preset not found: ${preset.id}`);
    }

    this.presets.set(preset.id, preset);

    // 이벤트 발생
    this.eventDispatcher.dispatch(new PresetUpdatedEvent(preset));
  }

  /**
   * 프리셋 삭제
   */
  async deletePreset(id: string): Promise<void> {
    const preset = this.presets.get(id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    this.presets.delete(id);
    this.mappings.delete(id);
    this.priority.delete(id);

    // 이벤트 발생
    this.eventDispatcher.dispatch(new PresetDeletedEvent(id));
  }

  /**
   * 프리셋 조회
   */
  async getPreset(id: string): Promise<Preset | undefined> {
    try {
      const preset = this.presets.get(id);
      if (!preset) {
        return undefined;
      }
      return preset;
    } catch (error) {
      this.logger.error('프리셋 조회 실패', { id, error });
      throw new PresetServiceError(`프리셋 조회 실패: ${error.message}`);
    }
  }

  /**
   * 모든 프리셋 조회
   */
  async getAllPresets(): Promise<Preset[]> {
    return Array.from(this.presets.values());
  }

  /**
   * 프리셋 적용
   */
  async applyPreset(id: string): Promise<void> {
    const preset = await this.getPreset(id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    // 프리셋 적용 로직 구현
  }

  /**
   * 프리셋 내보내기
   */
  async exportPreset(id: string): Promise<string> {
    const preset = await this.getPreset(id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    return JSON.stringify(preset, null, 2);
  }

  /**
   * 프리셋 가져오기
   */
  async importPreset(presetJson: string): Promise<Preset> {
    try {
      const presetData = JSON.parse(presetJson);
      const preset = new Preset(
        presetData.id || crypto.randomUUID(),
        presetData.name,
        presetData.description,
        presetData.cardSetConfig,
        presetData.layoutConfig,
        presetData.cardRenderConfig,
        presetData.mappings || []
      );

      await this.updatePreset(preset);
      return preset;
    } catch (error) {
      throw new Error(`Failed to import preset: ${error.message}`);
    }
  }

  /**
   * 매핑 추가
   */
  async addMapping(presetId: string, mapping: IPresetMapping): Promise<void> {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    const presetMappings = this.mappings.get(presetId);
    if (!presetMappings) {
      throw new Error(`Mappings not found for preset: ${presetId}`);
    }

    presetMappings.set(mapping.id, mapping);
    preset.mappings.push(mapping);

    // 우선순위 업데이트
    const priority = this.priority.get(presetId) || [];
    if (!priority.includes(mapping.id)) {
      priority.push(mapping.id);
      this.priority.set(presetId, priority);
    }
  }

  /**
   * 매핑 업데이트
   */
  async updateMapping(presetId: string, mappingId: string, mapping: Partial<IPresetMapping>): Promise<void> {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    const presetMappings = this.mappings.get(presetId);
    if (!presetMappings) {
      throw new Error(`Mappings not found for preset: ${presetId}`);
    }

    const existingMapping = presetMappings.get(mappingId);
    if (!existingMapping) {
      throw new Error(`Mapping not found: ${mappingId}`);
    }

    const updatedMapping = { ...existingMapping, ...mapping };
    presetMappings.set(mappingId, updatedMapping);

    // 프리셋의 매핑 목록 업데이트
    const index = preset.mappings.findIndex(m => m.id === mappingId);
    if (index !== -1) {
      preset.mappings[index] = updatedMapping;
    }
  }

  /**
   * 매핑 제거
   */
  async removeMapping(presetId: string, mappingId: string): Promise<void> {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    const presetMappings = this.mappings.get(presetId);
    if (!presetMappings) {
      throw new Error(`Mappings not found for preset: ${presetId}`);
    }

    presetMappings.delete(mappingId);

    // 프리셋의 매핑 목록에서 제거
    preset.mappings = preset.mappings.filter(m => m.id !== mappingId);

    // 우선순위에서 제거
    const priority = this.priority.get(presetId) || [];
    const priorityIndex = priority.indexOf(mappingId);
    if (priorityIndex !== -1) {
      priority.splice(priorityIndex, 1);
      this.priority.set(presetId, priority);
    }
  }

  /**
   * 매핑 우선순위 업데이트
   */
  async updateMappingPriority(mappings: { type: 'folder' | 'tag'; key: string; priority: number }[]): Promise<void> {
    try {
      const presets = await this.getAllPresets();

      for (const preset of presets) {
        const updatedMappings = [...preset.mappings];
        
        mappings.forEach(({ type, key, priority }) => {
          const mappingIndex = updatedMappings.findIndex(
            m => (type === 'folder' && m.type === PresetType.FOLDER) || 
                (type === 'tag' && m.type === PresetType.TAG) && 
                m.value === key
          );
          
          if (mappingIndex !== -1) {
            updatedMappings[mappingIndex] = {
              ...updatedMappings[mappingIndex],
              priority
            };
          }
        });

        updatedMappings.sort((a, b) => (a.priority || 0) - (b.priority || 0));

        const updatedPreset = new Preset(
          preset.id,
          preset.name,
          preset.description,
          preset.cardSetConfig,
          preset.layoutConfig,
          preset.cardRenderConfig,
          updatedMappings
        );

        await this.updatePreset(updatedPreset);
      }

      this.eventDispatcher.dispatch(new PresetUpdatedEvent(presets[0]));
    } catch (error) {
      this.logger.error('매핑 우선순위 업데이트 실패', { error });
      throw new PresetServiceError(`매핑 우선순위 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 매핑 우선순위 정렬
   */
  async sortMappingsByPriority(presetId: string): Promise<void> {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    const priority = this.priority.get(presetId) || [];
    const presetMappings = this.mappings.get(presetId);
    if (!presetMappings) {
      throw new Error(`Mappings not found for preset: ${presetId}`);
    }

    // 우선순위에 따라 매핑 정렬
    preset.mappings.sort((a, b) => {
      const aIndex = priority.indexOf(a.id);
      const bIndex = priority.indexOf(b.id);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }

  /**
   * 매핑 조회
   */
  async getMapping(presetId: string, mappingId: string): Promise<IPresetMapping | undefined> {
    const presetMappings = this.mappings.get(presetId);
    if (!presetMappings) {
      return undefined;
    }

    return presetMappings.get(mappingId);
  }

  /**
   * 타입별 매핑 조회
   */
  async getMappingsByType(presetId: string, type: PresetType): Promise<IPresetMapping[]> {
    const presetMappings = this.mappings.get(presetId);
    if (!presetMappings) {
      return [];
    }

    return Array.from(presetMappings.values())
      .filter(mapping => mapping.type === type);
  }

  /**
   * 값별 매핑 조회
   */
  async getMappingsByValue(presetId: string, value: string): Promise<IPresetMapping[]> {
    const presetMappings = this.mappings.get(presetId);
    if (!presetMappings) {
      return [];
    }

    return Array.from(presetMappings.values())
      .filter(mapping => mapping.value === value);
  }

  /**
   * 매핑 존재 여부 확인
   */
  async hasMapping(presetId: string, type: PresetType, value: string): Promise<boolean> {
    const preset = this.presets.get(presetId);
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
      case PresetType.FOLDER:
        if (file.path.startsWith(mapping.value)) {
          return mapping.includeSubfolders ? 3 : 2;
        }
        break;

      case PresetType.TAG:
        const fileTags = this._getFileTags(file);
        if (fileTags.includes(mapping.value)) {
          return 2;
        }
        break;

      case PresetType.DATE:
        if (mapping.dateRange) {
          const fileDate = this._getFileDate(file);
          if (fileDate >= mapping.dateRange.start && fileDate <= mapping.dateRange.end) {
            return 1;
          }
        }
        break;

      case PresetType.PROPERTY:
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

  /**
   * 프리셋 저장
   */
  async savePresets(): Promise<void> {
    const presetsData = {
      presets: Array.from(this.presets.values()),
      mappings: Object.fromEntries(
        Array.from(this.mappings.entries()).map(([id, mappings]) => [
          id,
          Array.from(mappings.values())
        ])
      ),
      priority: Object.fromEntries(this.priority)
    };

    await this.app.vault.adapter.write(
      '.obsidian/plugins/obsidian-card-navigator-plugin/data.json',
      JSON.stringify(presetsData, null, 2)
    );
  }

  /**
   * 프리셋 불러오기
   */
  async loadPresets(): Promise<void> {
    try {
      const data = await this.app.vault.adapter.read(
        '.obsidian/plugins/obsidian-card-navigator-plugin/data.json'
      );

      const presetsData = JSON.parse(data);

      // 프리셋 로드
      this.presets.clear();
      for (const preset of presetsData.presets) {
        this.presets.set(preset.id, new Preset(
          preset.id,
          preset.name,
          preset.description,
          preset.cardSetConfig,
          preset.layoutConfig,
          preset.cardRenderConfig,
          preset.mappings
        ));
      }

      // 매핑 로드
      this.mappings.clear();
      for (const [presetId, mappings] of Object.entries(presetsData.mappings)) {
        const presetMappings = new Map<string, IPresetMapping>();
        for (const mapping of mappings as IPresetMapping[]) {
          presetMappings.set(mapping.id, mapping);
        }
        this.mappings.set(presetId, presetMappings);
      }

      // 우선순위 로드
      this.priority.clear();
      for (const [presetId, priority] of Object.entries(presetsData.priority)) {
        this.priority.set(presetId, priority as string[]);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
    }
  }

  /**
   * 폴더 매핑 추가
   */
  async addFolderMapping(folderPath: string, presetId: string, includeSubfolders: boolean = false): Promise<void> {
    const preset = await this.getPreset(presetId);
    if (!preset) {
      throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${presetId}`);
    }

    const mapping: IPresetMapping = {
      id: crypto.randomUUID(),
      type: PresetType.FOLDER,
      value: folderPath,
      includeSubfolders
    };

    await this.addMapping(presetId, mapping);
  }

  /**
   * 폴더 매핑 업데이트
   */
  async updateFolderMapping(folderPath: string, presetId: string, includeSubfolders: boolean): Promise<void> {
    const preset = await this.getPreset(presetId);
    if (!preset) {
      throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${presetId}`);
    }

    const mapping = preset.mappings.find(m => m.type === PresetType.FOLDER && m.value === folderPath);
    if (!mapping) {
      throw new PresetServiceError(`폴더 매핑을 찾을 수 없습니다: ${folderPath}`);
    }

    await this.updateMapping(presetId, mapping.id, { includeSubfolders });
  }

  /**
   * 폴더 매핑 제거
   */
  async removeFolderMapping(folderPath: string): Promise<void> {
    const presets = await this.getAllPresets();
    for (const preset of presets) {
      const mapping = preset.mappings.find(m => m.type === PresetType.FOLDER && m.value === folderPath);
      if (mapping) {
        await this.removeMapping(preset.id, mapping.id);
      }
    }
  }

  /**
   * 태그 매핑 추가
   */
  async addTagMapping(tag: string, presetId: string): Promise<void> {
    const preset = await this.getPreset(presetId);
    if (!preset) {
      throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${presetId}`);
    }

    const mapping: IPresetMapping = {
      id: crypto.randomUUID(),
      type: PresetType.TAG,
      value: tag
    };

    await this.addMapping(presetId, mapping);
  }

  /**
   * 태그 매핑 업데이트
   */
  async updateTagMapping(tag: string, presetId: string): Promise<void> {
    const preset = await this.getPreset(presetId);
    if (!preset) {
      throw new PresetServiceError(`프리셋을 찾을 수 없습니다: ${presetId}`);
    }

    const mapping = preset.mappings.find(m => m.type === PresetType.TAG && m.value === tag);
    if (!mapping) {
      throw new PresetServiceError(`태그 매핑을 찾을 수 없습니다: ${tag}`);
    }

    await this.updateMapping(presetId, mapping.id, {});
  }

  /**
   * 태그 매핑 제거
   */
  async removeTagMapping(tag: string): Promise<void> {
    const presets = await this.getAllPresets();
    for (const preset of presets) {
      const mapping = preset.mappings.find(m => m.type === PresetType.TAG && m.value === tag);
      if (mapping) {
        await this.removeMapping(preset.id, mapping.id);
      }
    }
  }
} 