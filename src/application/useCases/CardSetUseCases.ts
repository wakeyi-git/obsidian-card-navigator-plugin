import { App } from 'obsidian';
import { Card } from '../../domain/models/Card';
import { CardSet, CardFilter, CardSort, ICardSetConfig, ICardSetFilters, ICardSetSortConfig } from '../../domain/models/CardSet';
import { ICardSetService } from '../../domain/services/CardSetService';
import { ICardSetRepository } from '../../domain/repositories/ICardSetRepository';
import { ICardService } from '../../domain/services/CardService';

/**
 * 카드셋 유스케이스 클래스
 */
export class CardSetUseCases {
  constructor(
    private readonly app: App,
    private readonly cardService: ICardService,
    private readonly cardSetRepository: ICardSetRepository
  ) {}

  /**
   * 카드셋 생성
   */
  async createCardSet(config: ICardSetConfig): Promise<CardSet> {
    const id = crypto.randomUUID();
    const name = config.sourceFolder || '새 카드셋';
    const description = `카드셋: ${name}`;

    return new CardSet(
      id,
      name,
      description,
      config,
      this.app,
      this.cardService
    );
  }

  /**
   * 카드셋 업데이트
   */
  async updateCardSet(cardSet: CardSet): Promise<void> {
    await this.cardSetRepository.save(cardSet);
  }

  /**
   * 카드셋 삭제
   */
  async deleteCardSet(cardSetId: string): Promise<void> {
    await this.cardSetRepository.delete(cardSetId);
  }

  /**
   * 카드셋 조회
   */
  async getCardSet(cardSetId: string): Promise<CardSet | null> {
    const cardSet = await this.cardSetRepository.findById(cardSetId);
    return cardSet || null;
  }

  /**
   * 카드셋 목록 조회
   */
  async getCardSets(): Promise<CardSet[]> {
    return this.cardSetRepository.findAll();
  }

  /**
   * 카드셋 필터링
   */
  filterCardSet(cardSet: CardSet, filters: ICardSetFilters): void {
    cardSet.filterCards(card => {
      // 태그 필터링
      if (filters.tags?.length && !filters.tags.some(tag => card.tags.includes(tag))) {
        return false;
      }

      // 날짜 범위 필터링
      if (filters.dateRange) {
        const { start, end, dateField } = filters.dateRange;
        const cardDate = card[dateField];

        if (start && cardDate < start.getTime()) {
          return false;
        }
        if (end && cardDate > end.getTime()) {
          return false;
        }
      }

      // 프론트매터 필터링
      if (filters.frontmatter) {
        for (const [key, value] of Object.entries(filters.frontmatter)) {
          if (card.frontmatter?.[key] !== value) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * 카드셋 정렬
   */
  sortCardSet(cardSet: CardSet, sortConfig: ICardSetSortConfig): void {
    cardSet.config.sortBy = sortConfig.field;
    cardSet.config.sortOrder = sortConfig.order;
    cardSet.config.customSortField = sortConfig.customField;
    cardSet.sortCards();
  }

  /**
   * 카드셋 검색
   */
  async searchCardSet(cardSet: CardSet, query: string): Promise<CardSet> {
    const searchResults = cardSet.cards.filter(card => {
      const searchableContent = [
        card.fileName,
        card.firstHeader,
        card.content,
        ...card.tags,
        ...Object.values(card.frontmatter || {})
      ].join(' ').toLowerCase();

      return searchableContent.includes(query.toLowerCase());
    });

    const resultSet = new CardSet(
      crypto.randomUUID(),
      `${cardSet.name} - 검색 결과`,
      `"${query}" 검색 결과`,
      cardSet.config,
      this.app,
      this.cardService
    );

    searchResults.forEach(card => resultSet.addCard(card));
    return resultSet;
  }
}

/**
 * 카드셋 생성 유스케이스
 */
export class CreateCardSetUseCase {
  constructor(private readonly cardSetService: ICardSetService) {}

  /**
   * 카드셋 생성
   */
  async execute(name: string, description: string, config: CardSet['config']): Promise<CardSet> {
    return this.cardSetService.createCardSet(name, description, config);
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
  constructor(private readonly cardSetService: ICardSetService) {}

  /**
   * 카드셋 조회
   */
  async execute(cardSetId: string): Promise<CardSet | null> {
    const cardSet = await this.cardSetService.getCardSet(cardSetId);
    return cardSet || null;
  }
}

/**
 * 모든 카드셋 조회 유스케이스
 */
export class GetAllCardSetsUseCase {
  constructor(private readonly cardSetService: ICardSetService) {}

  /**
   * 모든 카드셋 조회
   */
  async execute(): Promise<CardSet[]> {
    return this.cardSetService.getAllCardSets();
  }
}

/**
 * 카드셋에 카드 추가 유스케이스
 */
export class AddCardToSetUseCase {
  constructor(private readonly cardSetService: ICardSetService) {}

  /**
   * 카드셋에 카드 추가
   */
  async execute(cardSetId: string, cardId: string): Promise<CardSet> {
    await this.cardSetService.addCardToSet(cardSetId, cardId);
    const updatedCardSet = await this.cardSetService.getCardSet(cardSetId);
    if (!updatedCardSet) {
      throw new Error(`CardSet not found after adding card: ${cardSetId}`);
    }
    return updatedCardSet;
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
    const filterFn = (card: Card): boolean => {
      switch (filter.type) {
        case 'search':
          return filter.criteria.value ? 
            card.content.toLowerCase().includes(filter.criteria.value.toLowerCase()) : true;
        case 'tag':
          return filter.criteria.tags ? 
            filter.criteria.tags.every(tag => card.tags.includes(tag)) : true;
        case 'folder':
          return filter.criteria.folderPath ? 
            card.filePath.startsWith(filter.criteria.folderPath) : true;
        case 'date':
          const cardDate = card.updatedAt;
          const startDate = filter.criteria.startDate?.getTime();
          const endDate = filter.criteria.endDate?.getTime();
          
          if (!startDate && !endDate) return true;
          if (startDate && !endDate) return cardDate >= startDate;
          if (!startDate && endDate) return cardDate <= endDate;
          return cardDate >= startDate! && cardDate <= endDate!;
        default:
          return true;
      }
    };

    await this.cardSetService.filterCards(cardSetId, filterFn);
    const updatedCardSet = await this.cardSetService.getCardSet(cardSetId);
    if (!updatedCardSet) {
      throw new Error(`CardSet not found after filtering cards: ${cardSetId}`);
    }
    return updatedCardSet;
  }
} 