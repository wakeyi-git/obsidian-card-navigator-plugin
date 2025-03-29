import { App, TFile } from 'obsidian';
import { Card } from '../models/Card';
import { ICardRepository } from '../repositories/ICardRepository';
import { CardContent, CardStyle, CardSectionType, CardPosition } from '../models/types';

/**
 * 카드 서비스
 */
export class CardService {
  constructor(
    private readonly app: App,
    private readonly cardRepository: ICardRepository
  ) {}

  /**
   * 파일로부터 카드를 생성합니다.
   */
  async createCard(file: TFile): Promise<Card> {
    return this.cardRepository.createFromFile(file, this.app);
  }

  /**
   * ID로 카드를 조회합니다.
   */
  async findCardById(id: string): Promise<Card | null> {
    return this.cardRepository.findById(id);
  }

  /**
   * 파일로 카드를 조회합니다.
   */
  async findCardByFile(file: TFile): Promise<Card | null> {
    return this.cardRepository.findByFile(file);
  }

  /**
   * 카드의 컨텐츠를 업데이트합니다.
   */
  async updateCardContent(card: Card, content: CardContent): Promise<void> {
    await this.cardRepository.updateContent(card.getId(), content);
  }

  /**
   * 카드의 스타일을 업데이트합니다.
   */
  async updateCardStyle(card: Card, style: CardStyle): Promise<void> {
    await this.cardRepository.updateStyle(card.getId(), style);
  }

  /**
   * 카드의 위치를 업데이트합니다.
   */
  async updateCardPosition(card: Card, x: number, y: number): Promise<void> {
    const currentPosition = card.getPosition();
    const position: CardPosition = {
      left: x,
      top: y,
      width: currentPosition.width,
      height: currentPosition.height
    };
    await this.cardRepository.updatePosition(card.getId(), position);
  }

  /**
   * 카드를 삭제합니다.
   */
  async deleteCard(card: Card): Promise<void> {
    await this.cardRepository.delete(card.getId());
  }

  /**
   * 파일의 내용을 읽어 카드 컨텐츠를 생성합니다.
   */
  async createCardContent(file: TFile): Promise<CardContent> {
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
   * 기본 컨텐츠 스타일을 반환합니다.
   */
  private getDefaultContentStyle(): CardStyle {
    return {
      width: 300,
      height: 200,
      fontSize: 14,
      lineHeight: 1.5,
      padding: 12,
      margin: 8,
      borderRadius: 8,
      backgroundColor: '#ffffff',
      textColor: '#000000',
      borderWidth: 1,
      borderColor: '#e0e0e0',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
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
   * 파일 내용을 파싱하여 카드 내용을 생성합니다.
   */
  private parseFileContent(content: string): CardContent {
    const lines = content.split('\n');
    const header: CardContent['header'] = [];
    const body: CardContent['body'] = [];
    const footer: CardContent['footer'] = [];

    let currentSection = body;
    let currentHeaderLevel = 0;

    for (const line of lines) {
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        if (level <= 3) {
          currentHeaderLevel = level;
          header.push({
            type: 'header' as CardSectionType,
            content: line.replace(/^#+\s*/, ''),
            level
          });
        } else {
          body.push({
            type: 'header' as CardSectionType,
            content: line.replace(/^#+\s*/, ''),
            level
          });
        }
      } else if (line.trim()) {
        body.push({
          type: 'text' as CardSectionType,
          content: line
        });
      }
    }

    return { header, body, footer };
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