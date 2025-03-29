import { App, TFile } from 'obsidian';
import { Card } from '@/domain/models/Card';
import { ICardRepository } from '@/domain/repositories/ICardRepository';

/**
 * 카드 리포지토리 클래스
 */
export class CardRepository implements ICardRepository {
  constructor(private readonly app: App) {}

  async save(card: Card): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(card.filePath);
    if (!file || !(file instanceof TFile)) {
      throw new Error(`File not found: ${card.filePath}`);
    }

    // 파일 메타데이터 업데이트
    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.cardId = card.id;
      frontmatter.cardFileName = card.fileName;
      frontmatter.cardFirstHeader = card.firstHeader;
      frontmatter.cardContent = card.content;
      frontmatter.cardTags = card.tags;
      frontmatter.cardCreatedAt = new Date(card.createdAt).toISOString();
      frontmatter.cardUpdatedAt = new Date(card.updatedAt).toISOString();
      frontmatter.cardFrontmatter = card.frontmatter;
      frontmatter.cardRenderConfig = card.renderConfig;
      frontmatter.cardStyle = card.style;
    });
  }

  async findById(id: string): Promise<Card | undefined> {
    const files = this.app.vault.getMarkdownFiles();
    for (const file of files) {
      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
      if (frontmatter?.cardId === id) {
        return this._createCardFromFile(file, frontmatter);
      }
    }
    return undefined;
  }

  async findByPath(filePath: string): Promise<Card | undefined> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!file || !(file instanceof TFile)) {
      return undefined;
    }

    const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
    return this._createCardFromFile(file, frontmatter);
  }

  async findAll(): Promise<Card[]> {
    const files = this.app.vault.getMarkdownFiles();
    const cards: Card[] = [];

    for (const file of files) {
      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
      if (frontmatter?.cardId) {
        const card = await this._createCardFromFile(file, frontmatter);
        if (card) {
          cards.push(card);
        }
      }
    }

    return cards;
  }

  async delete(id: string): Promise<void> {
    const card = await this.findById(id);
    if (!card) {
      throw new Error(`Card not found: ${id}`);
    }

    const file = this.app.vault.getAbstractFileByPath(card.filePath);
    if (!file || !(file instanceof TFile)) {
      throw new Error(`File not found: ${card.filePath}`);
    }

    // 파일 메타데이터에서 카드 정보 제거
    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      delete frontmatter.cardId;
      delete frontmatter.cardFileName;
      delete frontmatter.cardFirstHeader;
      delete frontmatter.cardContent;
      delete frontmatter.cardTags;
      delete frontmatter.cardCreatedAt;
      delete frontmatter.cardUpdatedAt;
      delete frontmatter.cardFrontmatter;
      delete frontmatter.cardRenderConfig;
      delete frontmatter.cardStyle;
    });
  }

  private async _createCardFromFile(file: TFile, frontmatter?: Record<string, any>): Promise<Card | undefined> {
    if (!frontmatter?.cardId) {
      return undefined;
    }

    const cache = this.app.metadataCache.getFileCache(file);
    const firstHeader = cache?.headings?.[0]?.heading;
    const tags = cache?.tags?.map(tag => tag.tag) || [];
    const content = await this.app.vault.read(file);

    return new Card(
      frontmatter.cardId,
      file.path,
      frontmatter.cardFileName || file.basename,
      frontmatter.cardFirstHeader || firstHeader || '',
      frontmatter.cardContent || content,
      frontmatter.cardTags || tags,
      frontmatter.cardCreatedAt ? new Date(frontmatter.cardCreatedAt).getTime() : file.stat.ctime,
      frontmatter.cardUpdatedAt ? new Date(frontmatter.cardUpdatedAt).getTime() : file.stat.mtime,
      frontmatter.cardFrontmatter || {},
      frontmatter.cardRenderConfig || {},
      frontmatter.cardStyle || {}
    );
  }
} 