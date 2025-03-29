import { App } from 'obsidian';
import { CardSet } from '@/domain/models/CardSet';
import { ICardSetRepository } from '@/domain/repositories/ICardSetRepository';
import { ICardService } from '@/domain/services/CardService';

/**
 * 카드셋 리포지토리 클래스
 */
export class CardSetRepository implements ICardSetRepository {
  private readonly DATA_FILE = '.card-navigator/cardsets.json';

  constructor(
    private readonly app: App,
    private readonly cardService: ICardService
  ) {}

  async save(cardSet: CardSet): Promise<void> {
    const data = await this._loadData();
    const index = data.findIndex((cs: any) => cs.id === cardSet.id);
    
    const cardSetData = this._convertToData(cardSet);
    
    if (index === -1) {
      data.push(cardSetData);
    } else {
      data[index] = cardSetData;
    }

    await this._saveData(data);
  }

  async findById(id: string): Promise<CardSet | undefined> {
    const data = await this._loadData();
    const cardSetData = data.find((cs: any) => cs.id === id);
    
    if (!cardSetData) {
      return undefined;
    }

    return this._createCardSetFromData(cardSetData);
  }

  async findAll(): Promise<CardSet[]> {
    const data = await this._loadData();
    return data.map((cs: any) => this._createCardSetFromData(cs));
  }

  async delete(id: string): Promise<void> {
    const data = await this._loadData();
    const filteredData = data.filter((cs: any) => cs.id !== id);
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

  private _createCardSetFromData(data: any): CardSet {
    return new CardSet(
      data.id,
      data.name,
      data.description,
      data.config,
      this.app,
      this.cardService,
      data.layoutConfig,
      data.cardRenderConfig,
      data.cards.map((card: any) => ({
        id: card.id,
        fileName: card.fileName,
        filePath: card.filePath,
        firstHeader: card.firstHeader,
        content: card.content,
        tags: card.tags,
        frontmatter: card.frontmatter,
        createdAt: new Date(card.createdAt),
        updatedAt: new Date(card.updatedAt)
      })),
      data.activeCardId,
      data.focusedCardId,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  private _convertToData(cardSet: CardSet): any {
    return {
      id: cardSet.id,
      name: cardSet.name,
      description: cardSet.description,
      config: cardSet.config,
      layoutConfig: cardSet.layoutConfig,
      cardRenderConfig: cardSet.cardRenderConfig,
      cards: cardSet.cards.map(card => ({
        id: card.id,
        fileName: card.fileName,
        filePath: card.filePath,
        firstHeader: card.firstHeader,
        content: card.content,
        tags: card.tags,
        frontmatter: card.frontmatter,
        createdAt: new Date(card.createdAt).toISOString(),
        updatedAt: new Date(card.updatedAt).toISOString()
      })),
      activeCardId: cardSet.activeCardId,
      focusedCardId: cardSet.focusedCardId,
      createdAt: new Date(cardSet.createdAt).toISOString(),
      updatedAt: new Date(cardSet.updatedAt).toISOString()
    };
  }
} 