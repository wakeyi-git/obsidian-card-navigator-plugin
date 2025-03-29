import { App, TFile } from 'obsidian';
import { Card } from '../../domain/models/Card';
import { ICardRepository } from '../../domain/repositories/ICardRepository';
import { CreateCardDto, UpdateCardDto, CardResponseDto } from '../dtos/CardDto';
import { CardContent, CardStyle } from '../../domain/models/types';
import { CardCreatedEvent, CardUpdatedEvent, CardDeletedEvent, CardStyleChangedEvent, CardPositionChangedEvent } from '../../domain/events/CardEvents';
import { DomainEventDispatcher } from '../../domain/events/DomainEventDispatcher';

/**
 * 카드 유스케이스
 */
export class CardUseCase {
  constructor(
    private readonly cardRepository: ICardRepository,
    private readonly app: App,
    private readonly eventDispatcher: DomainEventDispatcher
  ) {}

  /**
   * 카드를 생성합니다.
   */
  async createCard(file: TFile): Promise<Card> {
    const card = await this.cardRepository.createFromFile(file, this.app);
    await this.eventDispatcher.dispatch(new CardCreatedEvent(card));
    return card;
  }

  /**
   * 카드를 업데이트합니다.
   */
  async updateCard(card: Card): Promise<void> {
    // 카드의 각 속성을 개별적으로 업데이트
    await this.cardRepository.updateContent(card.getId(), card.getContent());
    await this.cardRepository.updateStyle(card.getId(), card.getStyle());
    await this.cardRepository.updatePosition(card.getId(), card.getPosition());
    
    // 업데이트 이벤트 발생
    await this.eventDispatcher.dispatch(new CardUpdatedEvent(card));
  }

  /**
   * 카드를 삭제합니다.
   */
  async deleteCard(cardId: string): Promise<void> {
    await this.cardRepository.delete(cardId);
    await this.eventDispatcher.dispatch(new CardDeletedEvent(cardId));
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

  async changeCardStyle(cardId: string, style: any): Promise<void> {
    const card = await this.cardRepository.findById(cardId);
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }
    await this.eventDispatcher.dispatch(new CardStyleChangedEvent(cardId, style));
  }

  async changeCardPosition(cardId: string, position: any): Promise<void> {
    const card = await this.cardRepository.findById(cardId);
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }
    await this.eventDispatcher.dispatch(new CardPositionChangedEvent(cardId, position));
  }

  async findCardById(id: string): Promise<Card | null> {
    return this.cardRepository.findById(id);
  }

  async findCardByFile(file: TFile): Promise<Card | null> {
    return this.cardRepository.findByFile(file);
  }
} 