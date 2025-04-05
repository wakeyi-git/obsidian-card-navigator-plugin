import { ICard } from '../../domain/models/Card';
import { ICardSet, CardSetType, ICardSetConfig, DEFAULT_CARD_SET_CONFIG } from '../../domain/models/CardSet';
import { ISearchFilter, SearchFilter } from '../../domain/models/SearchFilter';
import { ISearchService, ISearchResultItem } from '../../domain/services/ISearchService';
import { ISearchResult } from '../../domain/models/SearchResult';
import { SearchServiceError } from '../../domain/errors/SearchServiceError';
import { SearchStartedEvent, SearchCompletedEvent, SearchFailedEvent } from '../../domain/events/SearchEvents';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Debouncer } from '../../domain/utils/Debouncer';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { ISortService } from '@/domain/services/ISortService';
import { Container } from '@/infrastructure/di/Container';

/**
 * 검색 서비스 구현체
 */
export class SearchService implements ISearchService {
  private static instance: SearchService;

  private searchIndex: Map<string, ICard> = new Map();
  private searchDebouncer: Debouncer<[ISearchFilter], Promise<ISearchResultItem[]>>;

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly sortService: ISortService,
    private readonly eventDispatcher: IEventDispatcher
  ) {
    this.searchDebouncer = new Debouncer(
      (filter: ISearchFilter) => this.search(filter),
      300
    );
  }

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      const container = Container.getInstance();
      SearchService.instance = new SearchService(
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('ISortService'),
        container.resolve('IEventDispatcher')
      );
    }
    return SearchService.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    const perfMark = 'SearchService.initialize';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('검색 서비스 초기화 시작');
      this.searchIndex.clear();
      this.loggingService.info('검색 서비스 초기화 완료');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 정리
   */
  cleanup(): void {
    const perfMark = 'SearchService.cleanup';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('검색 서비스 정리 시작');
      this.searchIndex.clear();
      this.searchDebouncer.cancel();
      this.loggingService.info('검색 서비스 정리 완료');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 검색 실행
   * @param filter 검색 필터
   * @returns 검색 결과
   */
  public async search(filter: ISearchFilter): Promise<ISearchResultItem[]> {
    try {
      this.eventDispatcher.dispatch(new SearchStartedEvent(filter.query));

      const startTime = new Date();
      const results = await this.searchDebouncer.execute(filter);
      const sortedResults = await this.sortService.sort(results, filter.sortConfig);
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const cardSet = this.convertSearchResultsToCardSet(sortedResults, filter, CardSetType.FOLDER, { searchFilter: filter });
      
      const searchResult: ISearchResult = {
        query: filter.query,
        results: cardSet,
        startTime,
        endTime,
        duration,
        resultCount: sortedResults.length
      };

      this.eventDispatcher.dispatch(new SearchCompletedEvent(searchResult));

      return sortedResults;
    } catch (error) {
      this.eventDispatcher.dispatch(new SearchFailedEvent(error));
      throw new SearchServiceError('검색 중 오류가 발생했습니다.', error);
    }
  }

  /**
   * 검색 결과를 카드셋으로 변환
   * @param searchResults 검색 결과
   * @param searchFilter 검색 필터
   * @param type 카드셋 타입
   * @param config 카드셋 설정
   * @returns 카드셋
   */
  private convertSearchResultsToCardSet(
    searchResults: ISearchResultItem[],
    searchFilter: ISearchFilter,
    type: CardSetType = CardSetType.FOLDER,
    config: Partial<ICardSetConfig> = { searchFilter }
  ): ICardSet {
    return {
      id: `search-${Date.now()}`,
      type,
      criteria: searchFilter.query || '',
      config: {
        ...DEFAULT_CARD_SET_CONFIG,
        ...config
      },
      options: {
        includeSubfolders: false,
        sortConfig: undefined
      },
      cards: searchResults.map(r => r.card),
      validate: () => true,
      preview: function() {
        return {
          id: this.id,
          type: this.type,
          criteria: this.criteria,
          cardCount: this.cards.length
        };
      }
    };
  }

  /**
   * 검색 필터 적용
   * @param cardSet 카드셋
   * @param filter 검색 필터
   * @returns 필터링된 카드셋
   */
  async applyFilter(cardSet: ICardSet, filter: ISearchFilter): Promise<ICardSet> {
    const perfMark = 'SearchService.applyFilter';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('검색 필터 적용 시작', { 
        cardSetId: cardSet.id,
        query: filter.query,
        searchScope: filter.searchScope
      });

      if (!filter.validate()) {
        this.loggingService.warn('유효하지 않은 검색 필터', { 
          query: filter.query,
          searchScope: filter.searchScope
        });
        throw new SearchServiceError(
          '유효하지 않은 검색 필터입니다.',
          filter.query,
          filter.searchScope,
          'filter'
        );
      }

      const searchResults = await this.search(filter);
      const filteredCardSet = this.convertSearchResultsToCardSet(
        searchResults, 
        filter, 
        cardSet.type, 
        {
          ...cardSet.config,
          searchFilter: filter
        }
      );

      this.analyticsService.trackEvent('filter_applied', {
        cardSetId: cardSet.id,
        query: filter.query,
        searchScope: filter.searchScope,
        resultCount: searchResults.length
      });

      this.loggingService.info('검색 필터 적용 완료', { 
        cardSetId: cardSet.id,
        resultCount: searchResults.length
      });

      return filteredCardSet;
    } catch (error) {
      this.loggingService.error('검색 필터 적용 실패', { 
        error,
        cardSetId: cardSet.id,
        query: filter.query,
        searchScope: filter.searchScope
      });
      const filterError = new SearchServiceError(
        '필터 적용 중 오류가 발생했습니다.',
        filter.query,
        filter.searchScope,
        'filter',
        error instanceof Error ? error : new Error(String(error))
      );
      this.errorHandler.handleError(error as Error, 'SearchService.applyFilter');
      throw filterError;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 검색 필터 유효성 검사
   * @param filter 검색 필터
   */
  validateFilter(filter: ISearchFilter): boolean {
    const perfMark = 'SearchService.validateFilter';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('검색 필터 유효성 검사', { 
        query: filter.query,
        searchScope: filter.searchScope
      });
      return filter.validate();
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 기본 검색 필터 반환
   */
  getDefaultFilter(): ISearchFilter {
    const perfMark = 'SearchService.getDefaultFilter';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('기본 검색 필터 조회');
      return new SearchFilter(
        '', // query
        'all', // searchScope
        true, // searchFilename
        true, // searchContent
        true, // searchTags
        false, // caseSensitive
        false // useRegex
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 검색 결과 하이라이팅
   * @param card 카드
   * @param filter 검색 필터
   */
  async highlightSearchResults(card: ICard, filter: ISearchFilter): Promise<string> {
    const perfMark = 'SearchService.highlightSearchResults';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('검색 결과 하이라이팅 시작', { 
        cardId: card.id,
        query: filter.query
      });

      if (!filter.validate()) {
        this.loggingService.warn('유효하지 않은 검색 필터', { 
          query: filter.query,
          searchScope: filter.searchScope
        });
        throw new SearchServiceError(
          '유효하지 않은 검색 필터입니다.',
          filter.query,
          filter.searchScope,
          'highlight'
        );
      }

      const searchRegex = new RegExp(
        filter.useRegex ? filter.query : filter.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        filter.caseSensitive ? 'g' : 'gi'
      );
      let highlightedContent = card.content;

      if (highlightedContent) {
        highlightedContent = highlightedContent.replace(
          searchRegex,
          match => `<mark>${match}</mark>`
        );
      }

      this.analyticsService.trackEvent('search_results_highlighted', {
        cardId: card.id,
        query: filter.query,
        contentLengthLimit: card.renderConfig.contentLengthLimitEnabled ? card.renderConfig.contentLengthLimit : undefined
      });

      this.loggingService.info('검색 결과 하이라이팅 완료', { 
        cardId: card.id,
        contentLengthLimit: card.renderConfig.contentLengthLimitEnabled ? card.renderConfig.contentLengthLimit : undefined
      });

      return highlightedContent;
    } catch (error) {
      this.loggingService.error('검색 결과 하이라이팅 실패', { 
        error,
        cardId: card.id,
        query: filter.query
      });
      const highlightError = new SearchServiceError(
        '하이라이팅 중 오류가 발생했습니다.',
        filter.query,
        filter.searchScope,
        'highlight',
        error instanceof Error ? error : new Error(String(error))
      );
      this.errorHandler.handleError(error as Error, 'SearchService.highlightSearchResults');
      throw highlightError;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 검색 인덱스 업데이트
   * @param card 카드
   */
  async updateSearchIndex(card: ICard): Promise<void> {
    const perfMark = 'SearchService.updateSearchIndex';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('검색 인덱스 업데이트 시작', { cardId: card.id });
      this.searchIndex.set(card.id, card);

      this.analyticsService.trackEvent('search_index_updated', {
        cardId: card.id,
        hasFirstHeader: !!card.firstHeader,
        tagCount: card.tags.length,
        contentLengthLimit: card.renderConfig.contentLengthLimitEnabled ? card.renderConfig.contentLengthLimit : undefined
      });

      this.loggingService.info('검색 인덱스 업데이트 완료', { cardId: card.id });
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 검색 인덱스 삭제
   * @param cardId 카드 ID
   */
  async removeFromSearchIndex(cardId: string): Promise<void> {
    const perfMark = 'SearchService.removeFromSearchIndex';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('검색 인덱스 삭제 시작', { cardId });
      this.searchIndex.delete(cardId);

      this.analyticsService.trackEvent('search_index_removed', {
        cardId
      });

      this.loggingService.info('검색 인덱스 삭제 완료', { cardId });
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
} 