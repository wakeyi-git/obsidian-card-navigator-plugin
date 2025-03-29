import { App } from 'obsidian';
import { Card } from '../models/Card';
import { CardSet } from '../models/CardSet';
import { ISearchOptions, ISearchResult } from '../models/Search';
import { CardSetRepository } from '../repositories/CardSetRepository';
import { CardRepository } from '../repositories/CardRepository';
import { CardService } from './CardService';
import { DomainEventDispatcher } from '../events/DomainEventDispatcher';

/**
 * 검색 서비스 인터페이스
 */
export interface ISearchService {
  /**
   * 검색 실행
   */
  search(query: string, options: ISearchOptions): Promise<ISearchResult>;
  
  /**
   * 실시간 검색
   */
  searchRealtime(query: string, options: ISearchOptions): Promise<ISearchResult>;
  
  /**
   * 검색 결과 필터링
   */
  filterResults(cards: Card[], query: string, options: ISearchOptions): Card[];
}

/**
 * 검색 서비스 구현
 */
export class SearchService implements ISearchService {
  private readonly eventDispatcher: DomainEventDispatcher;
  private readonly cardService: CardService;
  private readonly cardRepository: CardRepository;

  constructor(
    private readonly app: App,
    private readonly cardSetRepository: CardSetRepository
  ) {
    this.eventDispatcher = new DomainEventDispatcher();
    this.cardRepository = new CardRepository(app);
    this.cardService = new CardService(app, this.cardRepository, this.eventDispatcher);
  }

  /**
   * 검색 실행
   */
  async search(query: string, options: ISearchOptions): Promise<ISearchResult> {
    const cards = await this._getSearchableCards(options.scope);
    const filteredCards = this.filterResults(cards, query, options);
    
    return {
      cards: filteredCards,
      cardSet: new CardSet(
        'search-result',
        '검색 결과',
        '검색 결과 카드셋',
        {
          type: 'search',
          value: query,
          options,
          sortBy: 'fileName',
          sortOrder: 'asc',
          includeSubfolders: true
        },
        this.app,
        this.cardService,
        undefined,
        undefined,
        filteredCards,
        undefined,
        undefined,
        new Date(),
        new Date()
      ),
      query,
      options
    };
  }

  /**
   * 실시간 검색
   */
  async searchRealtime(query: string, options: ISearchOptions): Promise<ISearchResult> {
    return this.search(query, options);
  }

  /**
   * 검색 결과 필터링
   */
  filterResults(cards: Card[], query: string, options: ISearchOptions): Card[] {
    if (!query) return cards;

    const searchPattern = this._createSearchPattern(query, options);
    
    return cards.filter(card => {
      if (options.fields.title && searchPattern.test(card.fileName)) return true;
      if (options.fields.content && searchPattern.test(card.content)) return true;
      if (options.fields.tags && card.tags.some(tag => searchPattern.test(tag))) return true;
      if (options.fields.path && searchPattern.test(card.filePath)) return true;
      return false;
    });
  }

  /**
   * 검색 가능한 카드 목록 가져오기
   */
  private async _getSearchableCards(scope: 'vault' | 'current'): Promise<Card[]> {
    if (scope === 'vault') {
      const files = this.app.vault.getMarkdownFiles();
      return Promise.all(files.map(file => this.cardService.createCardFromFile(file)));
    } else {
      const currentCardSet = this.cardSetRepository.getCardSet('current');
      return currentCardSet ? currentCardSet.cards : [];
    }
  }

  /**
   * 검색 패턴 생성
   */
  private _createSearchPattern(query: string, options: ISearchOptions): RegExp {
    let pattern = query;
    
    if (!options.useRegex) {
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    if (options.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
    
    return new RegExp(pattern, options.caseSensitive ? '' : 'i');
  }
} 