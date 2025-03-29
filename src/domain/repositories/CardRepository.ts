import { App, TFile } from 'obsidian';
import { Card } from '../models/Card';
import { ICardRenderConfig } from '../models/Card';
import { ICardStyle } from '../models/Card';
import { ICardRepository } from './ICardRepository';

/**
 * 카드 저장소
 */
export class CardRepository implements ICardRepository {
  private cards: Map<string, Card> = new Map();

  constructor(private readonly app: App) {}

  /**
   * 카드 저장
   */
  async save(card: Card): Promise<void> {
    this.cards.set(card.id, card);
  }

  /**
   * ID로 카드 찾기
   */
  async findById(id: string): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  /**
   * 경로로 카드 찾기
   */
  async findByPath(filePath: string): Promise<Card | undefined> {
    return this.cards.get(filePath);
  }

  /**
   * 모든 카드 찾기
   */
  async findAll(): Promise<Card[]> {
    return Array.from(this.cards.values());
  }

  /**
   * 카드 삭제
   */
  async delete(id: string): Promise<void> {
    this.cards.delete(id);
  }

  /**
   * 파일로부터 카드 가져오기 또는 생성
   */
  getOrCreateCard(file: TFile): Card {
    if (this.cards.has(file.path)) {
      return this.cards.get(file.path)!;
    }

    const defaultRenderConfig: ICardRenderConfig = {
      header: {
        showFileName: true,
        showFirstHeader: true,
        showTags: true,
        showCreatedDate: true,
        showUpdatedDate: true,
        showProperties: [],
        renderMarkdown: false
      },
      body: {
        showFileName: false,
        showFirstHeader: false,
        showContent: true,
        showTags: false,
        showCreatedDate: false,
        showUpdatedDate: false,
        showProperties: [],
        contentLength: 200,
        renderMarkdown: true
      },
      footer: {
        showFileName: false,
        showFirstHeader: false,
        showTags: true,
        showCreatedDate: true,
        showUpdatedDate: true,
        showProperties: [],
        renderMarkdown: false
      },
      renderAsHtml: false
    };

    const defaultStyle: ICardStyle = {
      card: {
        background: 'var(--background-secondary)',
        fontSize: '14px',
        borderColor: 'var(--background-modifier-border)',
        borderWidth: '1px'
      },
      activeCard: {
        background: 'var(--background-modifier-hover)',
        fontSize: '14px',
        borderColor: 'var(--interactive-accent)',
        borderWidth: '2px'
      },
      focusedCard: {
        background: 'var(--background-modifier-hover)',
        fontSize: '14px',
        borderColor: 'var(--interactive-accent)',
        borderWidth: '2px'
      },
      header: {
        background: 'var(--background-secondary)',
        fontSize: '14px',
        borderColor: 'var(--background-modifier-border)',
        borderWidth: '1px'
      },
      body: {
        background: 'var(--background-primary)',
        fontSize: '14px',
        borderColor: 'var(--background-modifier-border)',
        borderWidth: '1px'
      },
      footer: {
        background: 'var(--background-secondary)',
        fontSize: '12px',
        borderColor: 'var(--background-modifier-border)',
        borderWidth: '1px'
      }
    };

    const card = new Card(
      crypto.randomUUID(),
      file.path,
      file.name,
      file.basename,
      file.extension,
      (file.parent?.path || '').split('/'),
      file.stat.ctime,
      file.stat.mtime,
      this.app,
      defaultRenderConfig,
      defaultStyle
    );

    this.cards.set(file.path, card);
    return card;
  }

  /**
   * 카드 가져오기
   */
  getCard(filePath: string): Card | undefined {
    return this.cards.get(filePath);
  }

  /**
   * 모든 카드 가져오기
   */
  getAllCards(): Card[] {
    return Array.from(this.cards.values());
  }
} 