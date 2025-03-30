import { App, TFile } from 'obsidian';
import { Card } from '@/domain/models/Card';
import { CardSet } from '@/domain/models/CardSet';
import { ISearchOptions, ISearchResult } from '@/domain/models/Search';
import { ICardService } from '@/domain/services/ICardService';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { IPresetService } from '@/domain/services/IPresetService';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { ICardSetRepository } from '@/domain/repositories/ICardSetRepository';
import { LoggingService } from '@/infrastructure/services/LoggingService';
import { ISearchService } from '@/domain/services/ISearchService';

/**
 * 검색 서비스 클래스
 */
export class SearchService implements ISearchService {
  private _cardSets: Map<string, CardSet> = new Map();
  private readonly loggingService: LoggingService;

  constructor(
    private readonly app: App,
    private readonly cardService: ICardService,
    private readonly layoutService: ILayoutService,
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly presetService: IPresetService,
    private readonly cardSetRepository: ICardSetRepository
  ) {
    this.loggingService = new LoggingService(app);
  }

  /**
   * 검색 쿼리 유효성 검사
   */
  isValidQuery(query: string): boolean {
    return query.trim().length > 0;
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
   * 실시간 검색
   */
  async searchRealtime(query: string, options: ISearchOptions): Promise<ISearchResult> {
    return this.search(query, options);
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
        this.layoutService,
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
   * 검색 가능한 카드 목록 가져오기
   */
  private async _getSearchableCards(scope: 'vault' | 'current'): Promise<Card[]> {
    if (scope === 'vault') {
      const files = this.app.vault.getMarkdownFiles();
      return Promise.all(files.map(file => this.cardService.createFromFile(file)));
    } else {
      const currentCardSet = await this.cardSetRepository.getCardSet('current');
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

  /**
   * 파일로부터 카드 생성
   */
  private async _createCardFromFile(file: TFile): Promise<Card | null> {
    try {
      this.loggingService.debug('파일로부터 카드 생성 시작:', file.path);

      const card = await this.cardService.createFromFile(file);
      if (!card) {
        this.loggingService.warn('카드를 생성할 수 없음');
        return null;
      }

      this.loggingService.debug('파일로부터 카드 생성 완료');
      return card;
    } catch (error) {
      this.loggingService.error('파일로부터 카드 생성 실패:', error);
      throw error;
    }
  }
} 