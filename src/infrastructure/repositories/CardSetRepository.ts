import { App } from 'obsidian';
import { CardSet, ICardSetConfig } from '@/domain/models/CardSet';
import { ICardRenderConfig } from '@/domain/models/Card';
import { ICardSetRepository } from '@/domain/repositories/ICardSetRepository';
import { ICardService } from '@/domain/services/ICardService';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { ILayoutConfig } from '@/domain/models/Layout';
import { LoggingService } from '@/infrastructure/services/LoggingService';

/**
 * 카드셋 저장소 클래스
 */
export class CardSetRepository implements ICardSetRepository {
  private _cardSets: Map<string, CardSet> = new Map();

  constructor(
    private readonly app: App,
    private readonly cardService: ICardService,
    private readonly layoutService: ILayoutService,
    private readonly loggingService: LoggingService
  ) {}

  /**
   * 카드셋 생성
   */
  async createCardSet(
    name: string,
    description: string,
    config: ICardSetConfig,
    app: App,
    cardService: ICardService,
    layoutService: ILayoutService,
    layoutConfig: ILayoutConfig,
    cardRenderConfig: ICardRenderConfig
  ): Promise<CardSet> {
    try {
      this.loggingService.debug('카드셋 생성 시작:', { name, description });

      const cardSet = new CardSet(
        crypto.randomUUID(),
        name,
        description,
        config,
        app,
        cardService,
        layoutService,
        layoutConfig,
        cardRenderConfig,
        [],
        undefined,
        undefined,
        new Date(),
        new Date()
      );

      this._cardSets.set(cardSet.id, cardSet);
      this.loggingService.debug('카드셋 생성 완료:', cardSet.id);
      return cardSet;
    } catch (error) {
      this.loggingService.error('카드셋 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 카드셋에 카드 추가
   */
  async addCardToCardSet(cardSetId: string, cardId: string): Promise<void> {
    try {
      this.loggingService.debug('카드셋에 카드 추가 시작:', { cardSetId, cardId });

      const cardSet = this._cardSets.get(cardSetId);
      if (!cardSet) {
        throw new Error('카드셋을 찾을 수 없음');
      }

      const card = await this.cardService.getCardById(cardId);
      if (!card) {
        throw new Error('카드를 찾을 수 없음');
      }

      cardSet.addCard(card);
      this.loggingService.debug('카드셋에 카드 추가 완료');
    } catch (error) {
      this.loggingService.error('카드셋에 카드 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 카드셋 업데이트
   */
  async updateCardSet(cardSet: CardSet): Promise<void> {
    this._cardSets.set(cardSet.id, cardSet);
  }

  /**
   * 카드셋 삭제
   */
  async deleteCardSet(id: string): Promise<void> {
    this._cardSets.delete(id);
  }

  /**
   * 카드셋 조회
   */
  async getCardSet(id: string): Promise<CardSet | null> {
    return this._cardSets.get(id) || null;
  }

  /**
   * 카드셋 파일 경로 조회
   */
  private _getCardSetPath(id: string): string {
    return `.obsidian/plugins/obsidian-card-navigator-plugin/card-sets/${id}.json`;
  }

  /**
   * 모든 카드셋 조회
   */
  async getAllCardSets(): Promise<CardSet[]> {
    return Array.from(this._cardSets.values());
  }

  /**
   * 카드셋 저장
   */
  async saveCardSet(cardSet: CardSet): Promise<void> {
    try {
      this.loggingService.debug(`[CardSetRepository] 카드셋 저장 시작: ${cardSet.id}`);

      // 카드셋 데이터 준비
      const cardSetData = {
        id: cardSet.id,
        name: cardSet.name,
        description: cardSet.description,
        config: cardSet.config,
        cards: cardSet.cards.map(card => card.id),
        activeCardId: cardSet.activeCardId,
        focusedCardId: cardSet.focusedCardId,
        createdAt: cardSet.createdAt,
        updatedAt: cardSet.updatedAt
      };

      // 저장 디렉토리 생성
      const cardSetPath = this._getCardSetPath(cardSet.id);
      const cardSetDir = cardSetPath.substring(0, cardSetPath.lastIndexOf('/'));
      
      try {
        await this.app.vault.adapter.mkdir(cardSetDir);
      } catch (error) {
        // 디렉토리가 이미 존재하는 경우 무시
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }

      // 카드셋 데이터 저장
      await this.app.vault.adapter.write(
        cardSetPath,
        JSON.stringify(cardSetData, null, 2)
      );

      // 카드셋을 메모리에 추가
      this._cardSets.set(cardSet.id, cardSet);

      this.loggingService.debug(`[CardSetRepository] 카드셋 저장 완료: ${cardSet.id}`);
    } catch (error) {
      this.loggingService.error(`[CardSetRepository] 카드셋 저장 실패: ${cardSet.id}`, error);
      throw error;
    }
  }

  /**
   * 카드셋 데이터를 저장소 형식으로 변환
   */
  private _toStorageFormat(cardSet: CardSet): any {
    return {
      id: cardSet.id,
      name: cardSet.name,
      description: cardSet.description,
      config: cardSet.config,
      layoutConfig: cardSet.layoutConfig,
      cardRenderConfig: cardSet.cardRenderConfig,
      cards: cardSet.cards.map(card => card.id),
      activeCardId: cardSet.activeCardId,
      focusedCardId: cardSet.focusedCardId,
      createdAt: cardSet.createdAt.toISOString(),
      updatedAt: cardSet.updatedAt.toISOString()
    };
  }

  /**
   * 저장소 데이터를 카드셋으로 변환
   */
  private async _fromStorageFormat(data: any): Promise<CardSet> {
    try {
      const cards = await Promise.all(
        data.cards.map(async (cardId: string) => {
          const card = await this.cardService.getCardById(cardId);
          if (!card) {
            throw new Error(`카드를 찾을 수 없음: ${cardId}`);
          }
          return card;
        })
      );

      return new CardSet(
        data.id,
        data.name,
        data.description,
        data.config,
        this.app,
        this.cardService,
        this.layoutService,
        data.layoutConfig,
        data.cardRenderConfig,
        cards,
        data.activeCardId,
        data.focusedCardId,
        new Date(data.createdAt),
        new Date(data.updatedAt)
      );
    } catch (error) {
      this.loggingService.error('저장소 데이터를 카드셋으로 변환 실패:', error);
      throw error;
    }
  }

  /**
   * 저장소 정리
   */
  dispose(): void {
    this._cardSets.clear();
  }
} 