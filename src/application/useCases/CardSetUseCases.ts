import { App } from 'obsidian';
import { ICardRenderConfig } from '@/domain/models/Card';
import { CardSet, CardFilter, CardSort, ICardSetConfig, CardSetType } from '@/domain/models/CardSet';
import { ICardSetService } from '@/domain/services/ICardSetService';
import { ICardSetRepository } from '@/domain/repositories/ICardSetRepository';
import { ICardService } from '@/domain/services/ICardService';
import { ILayoutConfig } from '@/domain/models/Layout';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { IPresetService } from '@/domain/services/IPresetService';
import { LoggingService } from '@/infrastructure/services/LoggingService';

/**
 * 카드셋 유스케이스 클래스
 */
export class CardSetUseCases {
  constructor(
    private readonly app: App,
    private readonly cardService: ICardService,
    private readonly cardSetRepository: ICardSetRepository,
    private readonly layoutService: ILayoutService,
    private readonly presetService: IPresetService
  ) {}

  /**
   * 카드셋 생성
   */
  async createCardSet(
    name: string,
    description: string,
    config: ICardSetConfig,
    layoutConfig: ILayoutConfig,
    cardRenderConfig: ICardRenderConfig
  ): Promise<CardSet> {
    return await this.cardSetRepository.createCardSet(
      name,
      description,
      config,
      this.app,
      this.cardService,
      this.layoutService,
      layoutConfig,
      cardRenderConfig
    );
  }

  /**
   * 카드셋 업데이트
   */
  async updateCardSet(cardSet: CardSet): Promise<void> {
    await this.cardSetRepository.updateCardSet(cardSet);
  }

  /**
   * 카드셋 삭제
   */
  async deleteCardSet(id: string): Promise<void> {
    await this.cardSetRepository.deleteCardSet(id);
  }

  /**
   * 카드셋 조회
   */
  async getCardSet(id: string): Promise<CardSet | undefined> {
    return await this.cardSetRepository.getCardSet(id);
  }

  /**
   * 모든 카드셋 조회
   */
  async getAllCardSets(): Promise<CardSet[]> {
    return await this.cardSetRepository.getAllCardSets();
  }

  /**
   * 카드셋에 카드 추가
   */
  async addCardToSet(cardSetId: string, cardId: string): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    const card = await this.cardService.getCardById(cardId);
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }

    cardSet.addCard(card);
    await this.updateCardSet(cardSet);
  }

  /**
   * 카드셋에서 카드 제거
   */
  async removeCardFromSet(cardSetId: string, cardId: string): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.removeCard(cardId);
    await this.updateCardSet(cardSet);
  }

  /**
   * 카드셋 활성 카드 설정
   */
  async setActiveCard(cardSetId: string, cardId: string): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.activeCardId = cardId;
    await this.updateCardSet(cardSet);
  }

  /**
   * 카드셋 포커스 카드 설정
   */
  async setFocusedCard(cardSetId: string, cardId: string): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.focusedCardId = cardId;
    await this.updateCardSet(cardSet);
  }

  /**
   * 카드셋 카드 정렬
   */
  async sortCards(cardSetId: string): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.sortCards();
    await this.updateCardSet(cardSet);
  }

  /**
   * 카드셋 카드 필터링
   */
  async filterCards(cardSetId: string, filter: CardFilter): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.filterCards(filter);
    await this.updateCardSet(cardSet);
  }

  /**
   * 카드셋 타입 업데이트
   */
  async updateCardSetType(cardSetId: string, type: CardSetType): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.updateType(type);
    await this.updateCardSet(cardSet);
  }

  /**
   * 프리셋 적용
   */
  async applyPreset(cardSetId: string, presetId: string): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    const preset = await this.presetService.getPreset(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    cardSet.applyPreset(preset);
    await this.updateCardSet(cardSet);
  }
}

/**
 * 카드셋 생성 유스케이스
 */
export class CreateCardSetUseCase {
  constructor(
    private readonly cardSetService: ICardSetService,
    private readonly loggingService: LoggingService
  ) {}

  async execute(
    name: string,
    description: string,
    config: ICardSetConfig,
    layoutConfig: ILayoutConfig,
    cardRenderConfig: ICardRenderConfig
  ): Promise<CardSet> {
    try {
      this.loggingService.debug('카드셋 생성 시작:', name);
      const cardSet = await this.cardSetService.createCardSet(
        name,
        description,
        config,
        layoutConfig,
        cardRenderConfig
      );
      this.loggingService.debug('카드셋 생성 완료:', cardSet.id);
      return cardSet;
    } catch (error) {
      this.loggingService.error('카드셋 생성 실패:', error);
      throw error;
    }
  }
}

/**
 * 카드셋 업데이트 유스케이스
 */
export class UpdateCardSetUseCase {
  constructor(private readonly cardSetService: ICardSetService) {}

  /**
   * 카드셋 업데이트
   */
  async execute(cardSet: CardSet): Promise<CardSet> {
    await this.cardSetService.updateCardSet(cardSet);
    const updatedCardSet = await this.cardSetService.getCardSet(cardSet.id);
    if (!updatedCardSet) {
      throw new Error(`CardSet not found after update: ${cardSet.id}`);
    }
    return updatedCardSet;
  }
}

/**
 * 카드셋 삭제 유스케이스
 */
export class DeleteCardSetUseCase {
  constructor(private readonly cardSetService: ICardSetService) {}

  /**
   * 카드셋 삭제
   */
  async execute(cardSetId: string): Promise<CardSet> {
    const cardSet = await this.cardSetService.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }
    await this.cardSetService.deleteCardSet(cardSetId);
    return cardSet;
  }
}

/**
 * 카드셋 조회 유스케이스
 */
export class GetCardSetUseCase {
  constructor(
    private readonly cardSetService: ICardSetService,
    private readonly loggingService: LoggingService
  ) {}

  async execute(id: string): Promise<CardSet | null> {
    try {
      this.loggingService.debug('카드셋 조회 시작:', id);
      const cardSet = await this.cardSetService.getCardSet(id);
      this.loggingService.debug('카드셋 조회 완료:', id);
      return cardSet || null;
    } catch (error) {
      this.loggingService.error('카드셋 조회 실패:', error);
      throw error;
    }
  }
}

/**
 * 모든 카드셋 조회 유스케이스
 */
export class GetAllCardSetsUseCase {
  constructor(
    private readonly cardSetService: ICardSetService,
    private readonly loggingService: LoggingService
  ) {}

  async execute(): Promise<CardSet[]> {
    try {
      this.loggingService.debug('모든 카드셋 조회 시작');
      const cardSets = await this.cardSetService.getAllCardSets();
      this.loggingService.debug('모든 카드셋 조회 완료:', cardSets.length);
      return cardSets;
    } catch (error) {
      this.loggingService.error('모든 카드셋 조회 실패:', error);
      throw error;
    }
  }
}

/**
 * 카드셋에 카드 추가 유스케이스
 */
export class AddCardToSetUseCase {
  constructor(
    private readonly cardSetService: ICardSetService,
    private readonly cardService: ICardService,
    private readonly loggingService: LoggingService
  ) {}

  async execute(cardSetId: string, cardId: string): Promise<void> {
    try {
      this.loggingService.debug('카드셋에 카드 추가 시작:', { cardSetId, cardId });
      const card = await this.cardService.getCardById(cardId);
      if (!card) {
        throw new Error(`Card not found: ${cardId}`);
      }
      await this.cardSetService.addCardToSet(cardSetId, cardId);
      this.loggingService.debug('카드셋에 카드 추가 완료:', { cardSetId, cardId });
    } catch (error) {
      this.loggingService.error('카드셋에 카드 추가 실패:', error);
      throw error;
    }
  }
}

/**
 * 카드셋에서 카드 제거 유스케이스
 */
export class RemoveCardFromSetUseCase {
  constructor(private readonly cardSetService: ICardSetService) {}

  /**
   * 카드셋에서 카드 제거
   */
  async execute(cardSetId: string, cardId: string): Promise<CardSet> {
    await this.cardSetService.removeCardFromSet(cardSetId, cardId);
    const updatedCardSet = await this.cardSetService.getCardSet(cardSetId);
    if (!updatedCardSet) {
      throw new Error(`CardSet not found after removing card: ${cardSetId}`);
    }
    return updatedCardSet;
  }
}

/**
 * 카드셋의 활성 카드 설정 유스케이스
 */
export class SetActiveCardUseCase {
  constructor(private readonly cardSetService: ICardSetService) {}

  /**
   * 카드셋의 활성 카드 설정
   */
  async execute(cardSetId: string, cardId: string): Promise<CardSet> {
    await this.cardSetService.setActiveCard(cardSetId, cardId);
    const updatedCardSet = await this.cardSetService.getCardSet(cardSetId);
    if (!updatedCardSet) {
      throw new Error(`CardSet not found after setting active card: ${cardSetId}`);
    }
    return updatedCardSet;
  }
}

/**
 * 카드셋의 포커스 카드 설정 유스케이스
 */
export class SetFocusedCardUseCase {
  constructor(private readonly cardSetService: ICardSetService) {}

  /**
   * 카드셋의 포커스 카드 설정
   */
  async execute(cardSetId: string, cardId: string): Promise<CardSet> {
    await this.cardSetService.setFocusedCard(cardSetId, cardId);
    const updatedCardSet = await this.cardSetService.getCardSet(cardSetId);
    if (!updatedCardSet) {
      throw new Error(`CardSet not found after setting focused card: ${cardSetId}`);
    }
    return updatedCardSet;
  }
}

/**
 * 카드셋의 카드 정렬 유스케이스
 */
export class SortCardsUseCase {
  constructor(private readonly cardSetService: ICardSetService) {}

  /**
   * 카드셋의 카드 정렬
   */
  async execute(cardSetId: string, sort: CardSort): Promise<CardSet> {
    await this.cardSetService.sortCards(cardSetId);
    const updatedCardSet = await this.cardSetService.getCardSet(cardSetId);
    if (!updatedCardSet) {
      throw new Error(`CardSet not found after sorting cards: ${cardSetId}`);
    }
    return updatedCardSet;
  }
}

/**
 * 카드셋의 카드 필터링 유스케이스
 */
export class FilterCardsUseCase {
  constructor(private readonly cardSetService: ICardSetService) {}

  /**
   * 카드셋의 카드 필터링
   */
  async execute(cardSetId: string, filter: CardFilter): Promise<CardSet> {
    await this.cardSetService.filterCards(cardSetId, filter);
    const updatedCardSet = await this.cardSetService.getCardSet(cardSetId);
    if (!updatedCardSet) {
      throw new Error(`CardSet not found after filtering cards: ${cardSetId}`);
    }
    return updatedCardSet;
  }
} 