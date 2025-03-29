import { CardSet } from '../models/CardSet';
import { CardSetType, CardFilter, CardSort } from '../models/types';
import { ICardSetRepository } from '../repositories/ICardSetRepository';
import { CardService } from './CardService';

/**
 * 카드셋 도메인 서비스
 */
export class CardSetService {
  constructor(
    private readonly cardSetRepository: ICardSetRepository,
    private readonly cardService: CardService
  ) {}

  /**
   * ID로 카드셋을 조회합니다.
   */
  async findCardSetById(id: string): Promise<CardSet | null> {
    return this.cardSetRepository.findById(id);
  }

  /**
   * 타입과 소스로 카드셋을 조회합니다.
   */
  async findCardSetByTypeAndSource(type: CardSetType, source: string): Promise<CardSet | null> {
    return this.cardSetRepository.findByTypeAndSource(type, source);
  }

  /**
   * 새로운 카드셋을 생성합니다.
   */
  async createCardSet(type: CardSetType, source: string, filter: CardFilter, sort: CardSort): Promise<CardSet> {
    return this.cardSetRepository.create(type, source, filter, sort);
  }

  /**
   * 카드셋의 필터를 업데이트합니다.
   */
  async updateCardSetFilter(cardSet: CardSet, filter: CardFilter): Promise<CardSet> {
    return this.cardSetRepository.updateFilter(cardSet, filter);
  }

  /**
   * 카드셋의 정렬 설정을 업데이트합니다.
   */
  async updateCardSetSort(cardSet: CardSet, sort: CardSort): Promise<CardSet> {
    return this.cardSetRepository.updateSort(cardSet, sort);
  }

  /**
   * 카드셋을 삭제합니다.
   */
  async deleteCardSet(cardSet: CardSet): Promise<void> {
    await this.cardSetRepository.delete(cardSet);
  }

  /**
   * 모든 카드셋을 조회합니다.
   */
  async findAllCardSets(): Promise<CardSet[]> {
    return this.cardSetRepository.findAll();
  }

  /**
   * 폴더 타입의 카드셋을 생성합니다.
   */
  async createFolderCardSet(folderPath: string, filter: CardFilter, sort: CardSort): Promise<CardSet> {
    return this.createCardSet('folder', folderPath, filter, sort);
  }

  /**
   * 태그 타입의 카드셋을 생성합니다.
   */
  async createTagCardSet(tag: string, filter: CardFilter, sort: CardSort): Promise<CardSet> {
    return this.createCardSet('tag', tag, filter, sort);
  }

  /**
   * 링크 타입의 카드셋을 생성합니다.
   */
  async createLinkCardSet(link: string, filter: CardFilter, sort: CardSort): Promise<CardSet> {
    return this.createCardSet('link', link, filter, sort);
  }

  /**
   * 검색 필터를 생성합니다.
   */
  createSearchFilter(searchTerm: string): CardFilter {
    return {
      type: 'search',
      criteria: {
        value: searchTerm
      }
    };
  }

  /**
   * 태그 필터를 생성합니다.
   */
  createTagFilter(tag: string): CardFilter {
    return {
      type: 'tag',
      criteria: {
        value: tag
      }
    };
  }

  /**
   * 폴더 필터를 생성합니다.
   */
  createFolderFilter(folderPath: string): CardFilter {
    return {
      type: 'folder',
      criteria: {
        value: folderPath
      }
    };
  }

  /**
   * 날짜 필터를 생성합니다.
   */
  createDateFilter(startDate?: string, endDate?: string): CardFilter {
    return {
      type: 'date',
      criteria: {
        value: 'date',
        options: {
          startDate,
          endDate
        }
      }
    };
  }

  /**
   * 기본 정렬 설정을 생성합니다.
   */
  createDefaultSort(): CardSort {
    return {
      criterion: 'fileName',
      order: 'asc'
    };
  }
} 