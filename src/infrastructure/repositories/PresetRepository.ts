import { App } from 'obsidian';
import { Preset, IPreset, IPresetConfig } from '@/domain/models/Preset';
import { IPresetRepository } from '@/domain/repositories/IPresetRepository';

/**
 * 프리셋 리포지토리 클래스
 */
export class PresetRepository implements IPresetRepository {
  private readonly DATA_FILE = '.card-navigator/presets.json';

  constructor(private readonly app: App) {}

  /**
   * 프리셋을 생성합니다.
   */
  async createPreset(config: IPresetConfig): Promise<IPreset> {
    const preset = new Preset(
      crypto.randomUUID(),
      config.name,
      config.description,
      config.cardSetConfig,
      config.layoutConfig,
      config.cardRenderConfig
    );

    // 매핑 추가
    config.mappings.forEach(mapping => {
      preset.addMapping(mapping);
    });

    // 프리셋 저장
    await this.save(preset);

    return preset;
  }

  /**
   * 프리셋을 업데이트합니다.
   */
  async updatePreset(preset: IPreset): Promise<void> {
    await this.save(preset as Preset);
  }

  /**
   * 프리셋을 삭제합니다.
   */
  async deletePreset(presetId: string): Promise<void> {
    await this.delete(presetId);
  }

  /**
   * 프리셋을 조회합니다.
   */
  async getPreset(presetId: string): Promise<IPreset | null> {
    const preset = await this.findById(presetId);
    return preset || null;
  }

  /**
   * 모든 프리셋을 조회합니다.
   */
  async getPresets(): Promise<IPreset[]> {
    return await this.findAll();
  }

  /**
   * 프리셋을 저장합니다.
   */
  private async save(preset: Preset): Promise<void> {
    const data = await this._loadData();
    const index = data.findIndex((p: any) => p.id === preset.id);
    
    if (index === -1) {
      data.push(preset);
    } else {
      data[index] = preset;
    }

    await this._saveData(data);
  }

  /**
   * ID로 프리셋을 찾습니다.
   */
  private async findById(id: string): Promise<Preset | undefined> {
    const data = await this._loadData();
    const presetData = data.find((p: any) => p.id === id);
    
    if (!presetData) {
      return undefined;
    }

    return this._createPresetFromData(presetData);
  }

  /**
   * 모든 프리셋을 찾습니다.
   */
  private async findAll(): Promise<Preset[]> {
    const data = await this._loadData();
    return data.map((p: any) => this._createPresetFromData(p));
  }

  /**
   * 프리셋을 삭제합니다.
   */
  private async delete(id: string): Promise<void> {
    const data = await this._loadData();
    const filteredData = data.filter((p: any) => p.id !== id);
    await this._saveData(filteredData);
  }

  /**
   * 데이터를 로드합니다.
   */
  private async _loadData(): Promise<any[]> {
    try {
      const data = await this.app.vault.adapter.read(this.DATA_FILE);
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  /**
   * 데이터를 저장합니다.
   */
  private async _saveData(data: any[]): Promise<void> {
    const jsonData = JSON.stringify(data, null, 2);
    await this.app.vault.adapter.write(this.DATA_FILE, jsonData);
  }

  /**
   * 데이터로부터 프리셋을 생성합니다.
   */
  private _createPresetFromData(data: any): Preset {
    return new Preset(
      data.id,
      data.name,
      data.description,
      data.cardSetConfig,
      data.layoutConfig,
      data.cardRenderConfig
    );
  }
} 