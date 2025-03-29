import { Card, ICardRenderConfig } from '../../domain/models/Card';
import { ICardService } from '../../domain/services/CardService';
import { TFile } from 'obsidian';

/**
 * 카드 생성 유스케이스
 */
export class CreateCardUseCase {
  constructor(private readonly cardService: ICardService) {}

  /**
   * 파일로부터 카드 생성
   */
  async execute(file: TFile): Promise<Card> {
    return this.cardService.createCardFromFile(file);
  }
}

/**
 * 카드 업데이트 유스케이스
 */
export class UpdateCardUseCase {
  constructor(private readonly cardService: ICardService) {}

  /**
   * 카드 업데이트
   */
  async execute(card: Card): Promise<Card> {
    await this.cardService.updateCard(card);
    const updatedCard = await this.cardService.getCard(card.id);
    if (!updatedCard) {
      throw new Error(`Card not found after update: ${card.id}`);
    }
    return updatedCard;
  }
}

/**
 * 카드 삭제 유스케이스
 */
export class DeleteCardUseCase {
  constructor(private readonly cardService: ICardService) {}

  /**
   * 카드 삭제
   */
  async execute(cardId: string): Promise<Card> {
    const card = await this.cardService.getCard(cardId);
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }
    await this.cardService.deleteCard(cardId);
    return card;
  }
}

/**
 * 카드 조회 유스케이스
 */
export class GetCardUseCase {
  constructor(private readonly cardService: ICardService) {}

  /**
   * 카드 조회
   */
  async execute(cardId: string): Promise<Card | null> {
    const card = await this.cardService.getCard(cardId);
    return card || null;
  }
}

/**
 * 파일 경로로 카드 조회 유스케이스
 */
export class GetCardByPathUseCase {
  constructor(private readonly cardService: ICardService) {}

  /**
   * 파일 경로로 카드 조회
   */
  async execute(filePath: string): Promise<Card | null> {
    const card = await this.cardService.getCardByPath(filePath);
    return card || null;
  }
}

/**
 * 모든 카드 조회 유스케이스
 */
export class GetAllCardsUseCase {
  constructor(private readonly cardService: ICardService) {}

  /**
   * 모든 카드 조회
   */
  async execute(): Promise<Card[]> {
    return this.cardService.getAllCards();
  }
}

/**
 * 카드 렌더링 유스케이스
 */
export class RenderCardUseCase {
  constructor(private readonly cardService: ICardService) {}

  async execute(card: Card, config: ICardRenderConfig): Promise<string> {
    return this.cardService.renderCard(card, config);
  }
} 