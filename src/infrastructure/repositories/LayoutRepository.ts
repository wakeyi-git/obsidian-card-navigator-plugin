import { App } from 'obsidian';
import { Layout, ILayoutConfig, ICardPosition } from '@/domain/models/Layout';
import { ILayoutRepository } from '@/domain/repositories/ILayoutRepository';

/**
 * 레이아웃 리포지토리 클래스
 */
export class LayoutRepository implements ILayoutRepository {
  private readonly DATA_FILE = '.card-navigator/layouts.json';

  constructor(private readonly app: App) {}

  async save(layout: Layout): Promise<void> {
    const data = await this._loadData();
    const index = data.findIndex((l: any) => l.id === layout.id);
    
    if (index === -1) {
      data.push(layout);
    } else {
      data[index] = layout;
    }

    await this._saveData(data);
  }

  async findById(id: string): Promise<Layout | undefined> {
    const data = await this._loadData();
    const layoutData = data.find((l: any) => l.id === id);
    
    if (!layoutData) {
      return undefined;
    }

    return this._createLayoutFromData(layoutData);
  }

  async findAll(): Promise<Layout[]> {
    const data = await this._loadData();
    return data.map((l: any) => this._createLayoutFromData(l));
  }

  async delete(id: string): Promise<void> {
    const data = await this._loadData();
    const filteredData = data.filter((l: any) => l.id !== id);
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

  private _createLayoutFromData(data: any): Layout {
    return new Layout(
      data.id,
      data.name,
      data.description,
      data.config as ILayoutConfig,
      data.cardPositions as ICardPosition[],
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }
} 