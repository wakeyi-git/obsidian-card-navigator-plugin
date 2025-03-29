import { App } from 'obsidian';
import { Preset, IPresetConfig } from '@/domain/models/Preset';
import { IPresetRepository } from '@/domain/repositories/IPresetRepository';

/**
 * 프리셋 리포지토리 클래스
 */
export class PresetRepository implements IPresetRepository {
  private readonly DATA_FILE = '.card-navigator/presets.json';

  constructor(private readonly app: App) {}

  async save(preset: Preset): Promise<void> {
    const data = await this._loadData();
    const index = data.findIndex((p: any) => p.id === preset.id);
    
    if (index === -1) {
      data.push(preset);
    } else {
      data[index] = preset;
    }

    await this._saveData(data);
  }

  async findById(id: string): Promise<Preset | undefined> {
    const data = await this._loadData();
    const presetData = data.find((p: any) => p.id === id);
    
    if (!presetData) {
      return undefined;
    }

    return this._createPresetFromData(presetData);
  }

  async findAll(): Promise<Preset[]> {
    const data = await this._loadData();
    return data.map((p: any) => this._createPresetFromData(p));
  }

  async delete(id: string): Promise<void> {
    const data = await this._loadData();
    const filteredData = data.filter((p: any) => p.id !== id);
    await this._saveData(filteredData);
  }

  private async _loadData(): Promise<any[]> {
    try {
      const data = await this.app.vault.adapter.read(this.DATA_FILE);
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  private async _saveData(data: any[]): Promise<void> {
    const jsonData = JSON.stringify(data, null, 2);
    await this.app.vault.adapter.write(this.DATA_FILE, jsonData);
  }

  private _createPresetFromData(data: any): Preset {
    const config: IPresetConfig = {
      name: data.name,
      description: data.description,
      cardSetConfig: data.cardSetConfig,
      layoutConfig: data.layoutConfig,
      cardRenderConfig: data.cardRenderConfig,
      mappings: data.mappings
    };

    return new Preset(
      data.id,
      config,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }
} 