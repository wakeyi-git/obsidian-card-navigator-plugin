import { App, TFile } from 'obsidian';
import { Card } from '@/domain/models/Card';
import { ICardRepository } from '@/domain/repositories/ICardRepository';
import { LoggingService } from '@/infrastructure/services/LoggingService';

/**
 * 카드 리포지토리 클래스
 */
export class CardRepository implements ICardRepository {
  private readonly _cards = new Map<string, Card>();
  private readonly loggingService: LoggingService;

  constructor(private readonly app: App) {
    this.loggingService = new LoggingService(app);
  }

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

  /**
   * ID로 카드 조회
   */
  async findById(id: string): Promise<Card | null> {
    try {
      this.loggingService.debug('ID로 카드 조회 시작:', id);

      const card = this._cards.get(id);
      if (!card) {
        this.loggingService.debug('카드를 찾을 수 없음');
        return null;
      }

      this.loggingService.debug('ID로 카드 조회 완료');
      return card;
    } catch (error) {
      this.loggingService.error('ID로 카드 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 경로로 카드 조회
   */
  async findByPath(filePath: string): Promise<Card | null> {
    try {
      this.loggingService.debug('파일 경로로 카드 조회 시작:', filePath);

      const card = Array.from(this._cards.values()).find(card => card.filePath === filePath);
      if (!card) {
        this.loggingService.debug('카드를 찾을 수 없음');
        return null;
      }

      this.loggingService.debug('파일 경로로 카드 조회 완료');
      return card;
    } catch (error) {
      this.loggingService.error('파일 경로로 카드 조회 실패:', error);
      throw error;
    }
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

  /**
   * 카드 조회 또는 생성
   */
  async getOrCreateCard(file: TFile): Promise<Card> {
    try {
      this.loggingService.debug('카드 조회 또는 생성 시작:', file.path);

      // 기존 카드 조회
      const existingCard = await this.findByPath(file.path);
      if (existingCard) {
        this.loggingService.debug('기존 카드 발견');
        return existingCard;
      }

      // 프론트매터 조회
      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
      if (!frontmatter?.cardId) {
        this.loggingService.warn('카드 ID를 찾을 수 없음');
        throw new Error('카드 ID를 찾을 수 없음');
      }

      // 새 카드 생성
      const card = await this._createCardFromFile(file, frontmatter);
      if (!card) {
        this.loggingService.warn('카드를 생성할 수 없음');
        throw new Error('카드를 생성할 수 없음');
      }

      // 카드 저장
      this._cards.set(card.id, card);
      this.loggingService.debug('새 카드 생성 완료');
      return card;
    } catch (error) {
      this.loggingService.error('카드 조회 또는 생성 실패:', error);
      throw error;
    }
  }
} 