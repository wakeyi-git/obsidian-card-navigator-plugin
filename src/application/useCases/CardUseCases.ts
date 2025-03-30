import { Card, ICardRenderConfig } from '@/domain/models/Card';
import { ICardService } from '@/domain/services/ICardService';
import { TFile } from 'obsidian';
import { LoggingService } from '@/infrastructure/services/LoggingService';

/**
 * 카드 생성 유스케이스
 */
export class CreateCardUseCase {
  constructor(
    private readonly cardService: ICardService,
    private readonly loggingService: LoggingService
  ) {}

  /**
   * 파일로부터 카드 생성
   */
  async execute(file: TFile): Promise<Card> {
    try {
      this.loggingService.debug('카드 생성 시작:', file.path);
      const card = await this.cardService.createFromFile(file);
      this.loggingService.debug('카드 생성 완료:', card.id);
      return card;
    } catch (error) {
      this.loggingService.error('카드 생성 실패:', error);
      throw error;
    }
  }
}

/**
 * 카드 업데이트 유스케이스
 */
export class UpdateCardUseCase {
  constructor(
    private readonly cardService: ICardService,
    private readonly loggingService: LoggingService
  ) {}

  /**
   * 카드 업데이트
   */
  async execute(card: Card): Promise<void> {
    try {
      this.loggingService.debug('카드 업데이트 시작:', card.id);
      await this.cardService.updateCard(card);
      this.loggingService.debug('카드 업데이트 완료:', card.id);
    } catch (error) {
      this.loggingService.error('카드 업데이트 실패:', error);
      throw error;
    }
  }
}

/**
 * 카드 삭제 유스케이스
 */
export class DeleteCardUseCase {
  constructor(
    private readonly cardService: ICardService,
    private readonly loggingService: LoggingService
  ) {}

  /**
   * 카드 삭제
   */
  async execute(id: string): Promise<void> {
    try {
      this.loggingService.debug('카드 삭제 시작:', id);
      await this.cardService.deleteCard(id);
      this.loggingService.debug('카드 삭제 완료:', id);
    } catch (error) {
      this.loggingService.error('카드 삭제 실패:', error);
      throw error;
    }
  }
}

/**
 * 카드 조회 유스케이스
 */
export class GetCardUseCase {
  constructor(
    private readonly cardService: ICardService,
    private readonly loggingService: LoggingService
  ) {}

  /**
   * 카드 조회
   */
  async execute(id: string): Promise<Card | null> {
    try {
      this.loggingService.debug('카드 조회 시작:', id);
      const card = await this.cardService.getCardById(id);
      this.loggingService.debug('카드 조회 완료:', id);
      return card;
    } catch (error) {
      this.loggingService.error('카드 조회 실패:', error);
      throw error;
    }
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
  constructor(
    private readonly cardService: ICardService,
    private readonly loggingService: LoggingService
  ) {}

  /**
   * 모든 카드 조회
   */
  async execute(): Promise<Card[]> {
    try {
      this.loggingService.debug('모든 카드 조회 시작');
      const cards = await this.cardService.getCards();
      this.loggingService.debug('모든 카드 조회 완료:', cards.length);
      return cards;
    } catch (error) {
      this.loggingService.error('모든 카드 조회 실패:', error);
      throw error;
    }
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