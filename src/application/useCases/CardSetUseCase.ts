import { App } from 'obsidian';
import { ICardSetRepository } from '../../domain/repositories/ICardSetRepository';
import { CardSet } from '../../domain/models/CardSet';
import { CardSetType, CardFilter, CardSort } from '../../domain/models/types';
import { Card } from '../../domain/models/Card';

/**
 * 카드셋 관련 유스케이스를 처리하는 클래스
 */
export class CardSetUseCase {
  constructor(
    private readonly cardSetRepository: ICardSetRepository,
    private readonly app: App
  ) {}

  /**
   * 카드셋을 생성합니다.
   */
  async createCardSet(
    type: CardSetType,
    source: string,
    filter: CardFilter,
    sort: CardSort
  ): Promise<CardSet> {
    return this.cardSetRepository.create(type, source, filter, sort);
  }

  /**
   * 카드셋을 업데이트합니다.
   */
  async updateCardSet(cardSet: CardSet, dto: { filter?: CardFilter; sort?: CardSort }): Promise<CardSet> {
    let updatedCardSet = cardSet;
    
    if (dto.filter) {
      updatedCardSet = await this.cardSetRepository.updateFilter(updatedCardSet, dto.filter);
    }
    
    if (dto.sort) {
      updatedCardSet = await this.cardSetRepository.updateSort(updatedCardSet, dto.sort);
    }
    
    return updatedCardSet;
  }

  /**
   * ID로 카드셋을 찾습니다.
   */
  async findById(id: string): Promise<CardSet | null> {
    return this.cardSetRepository.findById(id);
  }

  /**
   * 모든 카드셋을 가져옵니다.
   */
  async getAllCardSets(): Promise<CardSet[]> {
    return this.cardSetRepository.findAll();
  }

  /**
   * 카드셋을 삭제합니다.
   */
  async deleteCardSet(cardSet: CardSet): Promise<void> {
    await this.cardSetRepository.delete(cardSet);
  }
} 