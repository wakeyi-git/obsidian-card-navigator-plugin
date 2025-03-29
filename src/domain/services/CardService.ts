import { App, TFile } from 'obsidian';
import { Card } from '../models/Card';
import { ICardRepository } from '../repositories/ICardRepository';
import { CardContent, CardStyle, CardSectionType, CardPosition } from '../models/types';
import { DomainEventDispatcher } from '../events/DomainEventDispatcher';
import { CardCreatedEvent, CardUpdatedEvent, CardDeletedEvent, CardStyleChangedEvent, CardPositionChangedEvent } from '../events/CardEvents';
import { CardResponseDto } from '../../application/dtos/CardDto';

export interface ICardService {
  createCard(file: TFile): Promise<Card>;
  getCard(id: string): Promise<CardResponseDto>;
  updateCard(card: Card): Promise<void>;
  deleteCard(id: string): Promise<void>;
  getAllCards(): Promise<Card[]>;
  findCardByFile(file: TFile): Promise<Card | null>;
  findCardById(cardId: string): Promise<Card | null>;
  updateCardCache(card: Card): Promise<void>;
  removeFromCardCache(card: Card): Promise<void>;
  changeCardStyle(card: Card, style: CardStyle): Promise<void>;
  changeCardPosition(card: Card, position: { x: number; y: number }): Promise<void>;
}

/**
 * 카드 서비스
 */
export class CardService implements ICardService {
  private cardCache: Map<string, Card> = new Map();

  constructor(
    private readonly app: App,
    private readonly cardRepository: ICardRepository,
    private readonly eventDispatcher: DomainEventDispatcher
  ) {}

  /**
   * 모든 카드를 가져옵니다.
   */
  async getAllCards(): Promise<Card[]> {
    return Array.from(this.cardCache.values());
  }

  /**
   * 파일로 카드를 찾습니다.
   */
  async findCardByFile(file: TFile): Promise<Card | null> {
    return this.cardCache.get(file.path) || null;
  }

  /**
   * ID로 카드를 찾습니다.
   */
  async findCardById(cardId: string): Promise<Card | null> {
    return this.cardCache.get(cardId) || null;
  }

  /**
   * 카드 캐시를 업데이트합니다.
   */
  async updateCardCache(card: Card): Promise<void> {
    this.cardCache.set(card.getId(), card);
  }

  /**
   * 카드 캐시에서 카드를 제거합니다.
   */
  async removeFromCardCache(card: Card): Promise<void> {
    this.cardCache.delete(card.getId());
  }

  /**
   * 카드를 생성합니다.
   */
  async createCard(file: TFile): Promise<Card> {
    const content = await this.createCardContent(file);
    const style = this.createDefaultCardStyle();
    const position = { left: 0, top: 0, width: style.width, height: style.height };
    const card = new Card(file.path, file, content, style, position, this.app);
    
    await this.updateCardCache(card);
    
    const event = new CardCreatedEvent(card);
    await this.eventDispatcher.dispatch(event);
    
    return card;
  }

  /**
   * 카드를 가져옵니다.
   */
  async getCard(id: string): Promise<CardResponseDto> {
    const card = await this.findCardById(id);
    if (!card) {
      throw new Error(`Card not found: ${id}`);
    }
    return {
      id: card.getId(),
      filePath: card.getFilePath(),
      content: card.getContent(),
      style: card.getStyle(),
      position: card.getPosition(),
      isActive: false,
      isFocused: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * 카드를 업데이트합니다.
   */
  async updateCard(card: Card): Promise<void> {
    await this.updateCardCache(card);
    
    const event = new CardUpdatedEvent(card);
    await this.eventDispatcher.dispatch(event);
  }

  /**
   * 카드를 삭제합니다.
   */
  async deleteCard(id: string): Promise<void> {
    const card = await this.findCardById(id);
    if (!card) {
      throw new Error(`Card not found: ${id}`);
    }
    await this.removeFromCardCache(card);
    
    const event = new CardDeletedEvent(card.getId());
    await this.eventDispatcher.dispatch(event);
  }

  /**
   * 카드 스타일을 변경합니다.
   */
  async changeCardStyle(card: Card, style: CardStyle): Promise<void> {
    await this.cardRepository.updateStyle(card.getId(), style);
    await this.updateCardCache(card);
    
    const event = new CardStyleChangedEvent(card.getId(), style);
    await this.eventDispatcher.dispatch(event);
  }

  /**
   * 카드 위치를 변경합니다.
   */
  async changeCardPosition(card: Card, position: { x: number; y: number }): Promise<void> {
    const cardPosition: CardPosition = {
      left: position.x,
      top: position.y,
      width: card.getStyle().width,
      height: card.getStyle().height
    };
    
    await this.cardRepository.updatePosition(card.getId(), cardPosition);
    await this.updateCardCache(card);
    
    const event = new CardPositionChangedEvent(card.getId(), cardPosition);
    await this.eventDispatcher.dispatch(event);
  }

  /**
   * 파일의 내용을 읽어 카드 컨텐츠를 생성합니다.
   */
  private async createCardContent(file: TFile): Promise<CardContent> {
    const content = await file.vault.read(file);
    const { frontmatter, content: body } = this.parseContent(content);

    return {
      header: [
        {
          type: 'text' as CardSectionType,
          content: file.name,
          level: 1
        },
        ...(frontmatter ? [{
          type: 'text' as CardSectionType,
          content: JSON.stringify(frontmatter),
          level: 2
        }] : [])
      ],
      body: [{
        type: 'text' as CardSectionType,
        content: body
      }],
      footer: []
    };
  }

  /**
   * 파일 내용을 파싱합니다.
   */
  private parseContent(content: string): { frontmatter?: any; content: string } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (match) {
      try {
        const frontmatter = JSON.parse(match[1]);
        return { frontmatter, content: match[2] };
      } catch (e) {
        return { content };
      }
    }

    return { content };
  }

  /**
   * 기본 카드 스타일을 생성합니다.
   */
  private createDefaultCardStyle(): CardStyle {
    return {
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
  }
} 