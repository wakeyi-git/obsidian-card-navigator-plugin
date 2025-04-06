import { ICard } from '../../domain/models/Card';
import { ISearchService } from '../../domain/services/ISearchService';
import { ISearchResult, SearchScope } from '../../domain/models/SearchResult';
import { ISearchConfig } from '../../domain/models/SearchConfig';
import { SearchServiceError } from '../../domain/errors/SearchServiceError';
import { 
  SearchStartedEvent, 
  SearchCompletedEvent, 
  SearchFailedEvent,
  SearchResultsFilteredEvent,
  SearchResultsSortedEvent,
  SearchIndexUpdatedEvent,
  SearchIndexRemovedEvent
} from '../../domain/events/SearchEvents';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Debouncer } from '../../domain/utils/Debouncer';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { ISortService } from '@/domain/services/ISortService';
import { TFile } from 'obsidian';
import { Container } from '../../infrastructure/di/Container';

/**
 * 검색 서비스 클래스
 */
export class SearchService implements ISearchService {
  private static instance: SearchService;
  private readonly searchIndex: Map<string, ICard>;
  private readonly searchDebouncer: Debouncer<[string, ISearchConfig], Promise<ISearchResult>>;

  private constructor(
    private readonly eventDispatcher: IEventDispatcher,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly sortService: ISortService
  ) {
    this.searchIndex = new Map<string, ICard>();
    this.searchDebouncer = new Debouncer<[string, ISearchConfig], Promise<ISearchResult>>(
      async (query: string, config: ISearchConfig) => this.executeSearch(query, config),
      300
    );
  }

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      const container = Container.getInstance();
      SearchService.instance = new SearchService(
        container.resolve<IEventDispatcher>('IEventDispatcher'),
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService'),
        container.resolve<ISortService>('ISortService')
      );
    }
    return SearchService.instance;
  }

  /**
   * 초기화
   */
  public initialize(): void {
    const timer = this.performanceMonitor.startTimer('SearchService.initialize');
    try {
      this.loggingService.debug('검색 서비스 초기화 시작');
      this.searchIndex.clear();
      this.loggingService.info('검색 서비스 초기화 완료');
    } finally {
      timer.stop();
    }
  }

  /**
   * 정리
   */
  public cleanup(): void {
    const timer = this.performanceMonitor.startTimer('SearchService.cleanup');
    try {
      this.loggingService.debug('검색 서비스 정리 시작');
      this.searchIndex.clear();
      this.searchDebouncer.cancel();
      this.loggingService.info('검색 서비스 정리 완료');
    } finally {
      timer.stop();
    }
  }

  /**
   * 검색 실행
   * @param query 검색어
   * @param config 검색 설정
   * @returns 검색 결과
   */
  public async search(query: string, config: ISearchConfig): Promise<ISearchResult> {
    try {
      this.eventDispatcher.dispatch(new SearchStartedEvent(query, config));
      const result = await this.searchDebouncer.execute(query, config);
      this.eventDispatcher.dispatch(new SearchCompletedEvent(result));
      return result;
    } catch (error) {
      this.eventDispatcher.dispatch(new SearchFailedEvent(error as Error, query, config));
      throw new SearchServiceError(
        '검색 중 오류가 발생했습니다.',
        query,
        config.scope,
        'search',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 실시간 검색
   * @param query 검색어
   * @param config 검색 설정
   * @returns 검색 결과
   */
  public async searchRealtime(query: string, config: ISearchConfig): Promise<ISearchResult> {
    try {
      const results = await this.search(query, {
        ...config,
        realtimeSearch: true
      });
      return results;
    } catch (error) {
      throw new SearchServiceError(
        '실시간 검색 중 오류가 발생했습니다.',
        query,
        config.scope,
        'search',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 파일 검색
   * @param file 검색할 파일
   * @param query 검색어
   * @param config 검색 설정
   * @returns 검색 결과
   */
  public async searchInFile(file: TFile, query: string, config: ISearchConfig): Promise<ISearchResult> {
    try {
      const results = await this.search(query, {
        ...config,
        scope: SearchScope.CURRENT
      });
      return results;
    } catch (error) {
      throw new SearchServiceError(
        '파일 검색 중 오류가 발생했습니다.',
        query,
        SearchScope.CURRENT,
        'search',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 검색 결과 필터링
   * @param result 검색 결과
   * @param config 검색 설정
   * @returns 필터링된 검색 결과
   */
  public async filterResults(result: ISearchResult, config: ISearchConfig): Promise<ISearchResult> {
    try {
      const filteredCardIds = result.cardIds.filter(id => {
        const card = this.searchIndex.get(id);
        if (!card) return false;

        if (config.fields.filename && card.fileName.includes(result.criteria.query)) {
          return true;
        }

        if (config.fields.content && card.content.includes(result.criteria.query)) {
          return true;
        }

        if (config.fields.tags && card.tags.some(tag => tag.includes(result.criteria.query))) {
          return true;
        }

        if (config.fields.frontmatter && Object.values(card.properties).some(value => 
          value && value.toString().includes(result.criteria.query)
        )) {
          return true;
        }

        return false;
      });

      const filteredResult = {
        ...result,
        cardIds: filteredCardIds
      };

      this.eventDispatcher.dispatch(new SearchResultsFilteredEvent(filteredResult, config));
      return filteredResult;
    } catch (error) {
      throw new SearchServiceError(
        '검색 결과 필터링 중 오류가 발생했습니다.',
        result.criteria.query,
        result.criteria.scope,
        'filter',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 검색 결과 정렬
   * @param result 검색 결과
   * @param config 검색 설정
   * @returns 정렬된 검색 결과
   */
  public async sortResults(result: ISearchResult, config: ISearchConfig): Promise<ISearchResult> {
    try {
      const sortedCardIds = [...result.cardIds].sort((a, b) => {
        const cardA = this.searchIndex.get(a);
        const cardB = this.searchIndex.get(b);
        if (!cardA || !cardB) return 0;

        if (config.fields.filename) {
          return cardA.fileName.localeCompare(cardB.fileName);
        }

        return 0;
      });

      const sortedResult = {
        ...result,
        cardIds: sortedCardIds
      };

      this.eventDispatcher.dispatch(new SearchResultsSortedEvent(sortedResult, config));
      return sortedResult;
    } catch (error) {
      throw new SearchServiceError(
        '검색 결과 정렬 중 오류가 발생했습니다.',
        result.criteria.query,
        result.criteria.scope,
        'filter',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 검색 결과 유효성 검사
   * @param result 검색 결과
   * @returns 유효성 여부
   */
  public validateResults(result: ISearchResult): boolean {
    try {
      if (!result || !result.cardIds || !Array.isArray(result.cardIds)) {
        return false;
      }

      for (const cardId of result.cardIds) {
        if (!this.searchIndex.has(cardId)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.errorHandler.handleError(error, 'SearchService.validateResults');
      return false;
    }
  }

  /**
   * 검색 결과 하이라이트
   * @param card 카드
   * @param query 검색어
   * @param config 검색 설정
   * @returns 하이라이트된 텍스트
   */
  public async highlightSearchResults(card: ICard, query: string, config: ISearchConfig): Promise<string> {
    try {
      let highlightedText = card.content;

      if (config.fields.filename && card.fileName.includes(query)) {
        highlightedText = highlightedText.replace(
          new RegExp(query, config.caseSensitive ? 'g' : 'gi'),
          match => `<mark>${match}</mark>`
        );
      }

      if (config.fields.content && card.content.includes(query)) {
        highlightedText = highlightedText.replace(
          new RegExp(query, config.caseSensitive ? 'g' : 'gi'),
          match => `<mark>${match}</mark>`
        );
      }

      if (config.fields.tags && card.tags.some(tag => tag.includes(query))) {
        highlightedText = highlightedText.replace(
          new RegExp(query, config.caseSensitive ? 'g' : 'gi'),
          match => `<mark>${match}</mark>`
        );
      }

      if (config.fields.frontmatter && Object.values(card.properties).some(value => 
        value && value.toString().includes(query)
      )) {
        highlightedText = highlightedText.replace(
          new RegExp(query, config.caseSensitive ? 'g' : 'gi'),
          match => `<mark>${match}</mark>`
        );
      }

      return highlightedText;
    } catch (error) {
      throw new SearchServiceError(
        '검색 결과 하이라이트 중 오류가 발생했습니다.',
        query,
        config.scope,
        'highlight',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 검색 인덱스 업데이트
   * @param card 카드
   */
  public async updateSearchIndex(card: ICard): Promise<void> {
    try {
      this.searchIndex.set(card.id, card);
      this.eventDispatcher.dispatch(new SearchIndexUpdatedEvent(card));
    } catch (error) {
      throw new SearchServiceError(
        '검색 인덱스 업데이트 중 오류가 발생했습니다.',
        '',
        SearchScope.ALL,
        'search',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 검색 인덱스에서 제거
   * @param cardId 카드 ID
   */
  public async removeFromSearchIndex(cardId: string): Promise<void> {
    try {
      this.searchIndex.delete(cardId);
      this.eventDispatcher.dispatch(new SearchIndexRemovedEvent(cardId));
    } catch (error) {
      throw new SearchServiceError(
        '검색 인덱스에서 제거 중 오류가 발생했습니다.',
        '',
        SearchScope.ALL,
        'search',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * 검색 실행
   * @param query 검색어
   * @param config 검색 설정
   * @returns 검색 결과
   */
  private async executeSearch(query: string, config: ISearchConfig): Promise<ISearchResult> {
    try {
      const startTime = Date.now();
      const cardIds: string[] = [];

      for (const [id, card] of this.searchIndex.entries()) {
        if (config.fields.filename && card.fileName.includes(query)) {
          cardIds.push(id);
          continue;
        }

        if (config.fields.content && card.content.includes(query)) {
          cardIds.push(id);
          continue;
        }

        if (config.fields.tags && card.tags.some(tag => tag.includes(query))) {
          cardIds.push(id);
          continue;
        }

        if (config.fields.frontmatter && Object.values(card.properties).some(value => 
          value && value.toString().includes(query)
        )) {
          cardIds.push(id);
          continue;
        }
      }

      const result: ISearchResult = {
        criteria: {
          query,
          scope: config.scope,
          caseSensitive: config.caseSensitive,
          useRegex: config.useRegex,
          fuzzy: false,
          searchFilename: config.fields.filename,
          searchContent: config.fields.content,
          searchTags: config.fields.tags,
          searchProperties: config.fields.frontmatter
        },
        cardIds,
        searchTime: Date.now() - startTime,
        totalCount: cardIds.length,
        filteredCount: cardIds.length
      };

      return result;
    } catch (error) {
      throw new SearchServiceError(
        '검색 실행 중 오류가 발생했습니다.',
        query,
        config.scope,
        'search',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
} 