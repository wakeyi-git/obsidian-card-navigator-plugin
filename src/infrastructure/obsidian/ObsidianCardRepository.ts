import { App, TFile } from 'obsidian';
import { Card } from '../../domain/models/Card';
import { ICardRepository } from '../../domain/repositories/ICardRepository';
import { CardContent, CardStyle, CardSectionType, CardPosition } from '../../domain/models/types';

/**
 * Obsidian 카드 리포지토리
 */
export class ObsidianCardRepository implements ICardRepository {
  private cardCache: Map<string, Card> = new Map();

  constructor(private readonly app: App) {}

  /**
   * 파일로부터 카드를 생성합니다.
   */
  async createFromFile(file: TFile, app: App): Promise<Card> {
    const content = await file.vault.read(file);
    const cardContent: CardContent = {
      header: [
        {
          type: 'text' as CardSectionType,
          content: file.name,
          level: 1
        }
      ],
      body: [{
        type: 'text' as CardSectionType,
        content: content
      }],
      footer: []
    };

    const cardStyle: CardStyle = {
      width: 300,
      height: 200,
      fontSize: 14,
      lineHeight: 1.5,
      padding: 12,
      margin: 8,
      borderRadius: 8,
      backgroundColor: 'var(--background-primary)',
      textColor: 'var(--text-normal)',
      borderWidth: 1,
      borderColor: 'var(--background-modifier-border)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    };

    const cardPosition: CardPosition = {
      left: 0,
      top: 0,
      width: cardStyle.width,
      height: cardStyle.height
    };

    const card = new Card(
      file.path,
      file,
      cardContent,
      cardStyle,
      cardPosition,
      app
    );

    this.cardCache.set(card.getId(), card);
    return card;
  }

  /**
   * ID로 카드를 조회합니다.
   */
  async findById(id: string): Promise<Card | null> {
    return this.cardCache.get(id) || null;
  }

  /**
   * 파일로 카드를 조회합니다.
   */
  async findByFile(file: TFile): Promise<Card | null> {
    return this.findById(file.path);
  }

  /**
   * 카드의 컨텐츠를 업데이트합니다.
   */
  async updateContent(id: string, content: CardContent): Promise<void> {
    const card = await this.findById(id);
    if (!card) {
      throw new Error(`Card not found: ${id}`);
    }
    card.updateContent(content);
    this.cardCache.set(id, card);
  }

  /**
   * 카드의 스타일을 업데이트합니다.
   */
  async updateStyle(id: string, style: CardStyle): Promise<void> {
    const card = await this.findById(id);
    if (!card) {
      throw new Error(`Card not found: ${id}`);
    }
    card.updateStyle(style);
    this.cardCache.set(id, card);
  }

  /**
   * 카드의 위치를 업데이트합니다.
   */
  async updatePosition(id: string, position: CardPosition): Promise<void> {
    const card = await this.findById(id);
    if (!card) {
      throw new Error(`Card not found: ${id}`);
    }
    card.updatePosition(position);
    this.cardCache.set(id, card);
  }

  /**
   * 카드를 삭제합니다.
   */
  async delete(id: string): Promise<void> {
    this.cardCache.delete(id);
  }

  /**
   * 카드 캐시를 초기화합니다.
   */
  clearCache(): void {
    this.cardCache.clear();
  }
} 