import { App, TFile } from 'obsidian';
import { Card } from '../../domain/models/Card';
import { ICardRepository } from '../../domain/repositories/ICardRepository';
import { CreateCardDto, UpdateCardDto, CardResponseDto } from '../dtos/CardDto';
import { CardContent, CardStyle } from '../../domain/models/types';

/**
 * 카드 유스케이스
 */
export class CardUseCase {
  constructor(
    private readonly cardRepository: ICardRepository,
    private readonly app: App
  ) {}

  /**
   * 카드를 생성합니다.
   */
  async createCard(dto: CreateCardDto): Promise<CardResponseDto> {
    const file = this.app.vault.getAbstractFileByPath(dto.filePath);
    if (!file || !(file instanceof TFile)) {
      throw new Error(`File not found: ${dto.filePath}`);
    }

    const card = await this.cardRepository.createFromFile(file, this.app);
    if (dto.style) {
      card.updateStyle(dto.style);
    }
    if (dto.position) {
      card.updatePosition(dto.position);
    }

    return this.toResponseDto(card);
  }

  /**
   * 카드를 업데이트합니다.
   */
  async updateCard(id: string, dto: UpdateCardDto): Promise<CardResponseDto> {
    const card = await this.cardRepository.findById(id);
    if (!card) {
      throw new Error(`Card not found: ${id}`);
    }

    if (dto.content) {
      card.updateContent(dto.content);
    }
    if (dto.style) {
      card.updateStyle(dto.style);
    }
    if (dto.position) {
      card.updatePosition(dto.position);
    }

    return this.toResponseDto(card);
  }

  /**
   * 카드를 삭제합니다.
   */
  async deleteCard(id: string): Promise<void> {
    const card = await this.cardRepository.findById(id);
    if (!card) {
      throw new Error(`Card not found: ${id}`);
    }
    await this.cardRepository.delete(id);
  }

  /**
   * 카드를 조회합니다.
   */
  async getCard(id: string): Promise<CardResponseDto> {
    const card = await this.cardRepository.findById(id);
    if (!card) {
      throw new Error(`Card not found: ${id}`);
    }

    return this.toResponseDto(card);
  }

  /**
   * 카드를 응답 DTO로 변환합니다.
   */
  private toResponseDto(card: Card): CardResponseDto {
    return {
      id: card.getId(),
      filePath: card.getFilePath(),
      content: card.getContent(),
      style: card.getStyle(),
      position: card.getPosition(),
      isActive: card.isActive(),
      isFocused: card.isFocused(),
      createdAt: card.getCreatedAt(),
      updatedAt: card.getUpdatedAt()
    };
  }

  /**
   * 카드 내용을 업데이트합니다.
   */
  async updateCardContent(card: Card): Promise<void> {
    await this.cardRepository.updateContent(card.getId(), card.getContent());
  }

  /**
   * 카드 스타일을 업데이트합니다.
   */
  async updateCardStyle(card: Card): Promise<void> {
    await this.cardRepository.updateStyle(card.getId(), card.getStyle());
  }

  /**
   * 카드 위치를 업데이트합니다.
   */
  async updateCardPosition(card: Card): Promise<void> {
    await this.cardRepository.updatePosition(card.getId(), card.getPosition());
  }
} 