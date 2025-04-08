import { ICard } from '@/domain/models/Card';
import { ISearchService } from '@/domain/services/application/ISearchService';
import { ISearchConfig, ISearchResult, ISearchResultItem } from '@/domain/models/Search';
import { SearchServiceError } from '@/domain/errors/SearchServiceError';
import { 
  SearchStartedEvent, 
  SearchCompletedEvent, 
  SearchFailedEvent,
  SearchResultsFilteredEvent,
  SearchIndexUpdatedEvent,
  SearchIndexRemovedEvent
} from '@/domain/events/SearchEvents';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Debouncer } from '@/domain/utils/Debouncer';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { TFile } from 'obsidian';
import { Container } from '@/infrastructure/di/Container';

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
    private readonly analyticsService: IAnalyticsService
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
        container.resolve<IAnalyticsService>('IAnalyticsService')
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
      throw new SearchServiceError('검색 중 오류가 발생했습니다.');
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
      return await this.search(query, config);
    } catch (error) {
      throw new SearchServiceError('실시간 검색 중 오류가 발생했습니다.');
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
      return await this.search(query, config);
    } catch (error) {
      throw new SearchServiceError('파일 검색 중 오류가 발생했습니다.');
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
      const filteredItems = result.items.filter(item => {
        if (config.criteria.query === '') return true;

        const card = item.card;
        if (card.fileName.includes(config.criteria.query)) {
          return true;
        }

        if (card.content.includes(config.criteria.query)) {
          return true;
        }

        if (card.tags.some(tag => tag.includes(config.criteria.query))) {
          return true;
        }

        if (Object.values(card.properties).some(value => 
          value && value.toString().includes(config.criteria.query)
        )) {
          return true;
        }

        return false;
      });

      const filteredResult: ISearchResult = {
        ...result,
        items: filteredItems,
        cardIds: filteredItems.map(item => item.card.id)
      };

      this.eventDispatcher.dispatch(new SearchResultsFilteredEvent(filteredResult, config.criteria));
      return filteredResult;
    } catch (error) {
      throw new SearchServiceError('검색 결과 필터링 중 오류가 발생했습니다.');
    }
  }

  /**
   * 검색 결과 유효성 검사
   * @param result 검색 결과
   * @returns 유효성 여부
   */
  public validateResults(result: ISearchResult): boolean {
    try {
      if (!result || !result.items || !Array.isArray(result.items)) {
        return false;
      }

      for (const item of result.items) {
        if (!this.searchIndex.has(item.card.id)) {
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

      if (card.fileName.includes(query)) {
        highlightedText = highlightedText.replace(
          new RegExp(query, config.criteria.caseSensitive ? 'g' : 'gi'),
          match => `<mark>${match}</mark>`
        );
      }

      if (card.content.includes(query)) {
        highlightedText = highlightedText.replace(
          new RegExp(query, config.criteria.caseSensitive ? 'g' : 'gi'),
          match => `<mark>${match}</mark>`
        );
      }

      if (card.tags.some(tag => tag.includes(query))) {
        highlightedText = highlightedText.replace(
          new RegExp(query, config.criteria.caseSensitive ? 'g' : 'gi'),
          match => `<mark>${match}</mark>`
        );
      }

      if (Object.values(card.properties).some(value => 
        value && value.toString().includes(query)
      )) {
        highlightedText = highlightedText.replace(
          new RegExp(query, config.criteria.caseSensitive ? 'g' : 'gi'),
          match => `<mark>${match}</mark>`
        );
      }

      return highlightedText;
    } catch (error) {
      throw new SearchServiceError('검색 결과 하이라이트 중 오류가 발생했습니다.');
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
      throw new SearchServiceError('검색 인덱스 업데이트 중 오류가 발생했습니다.');
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
      throw new SearchServiceError('검색 인덱스에서 제거 중 오류가 발생했습니다.');
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
      const items: ISearchResultItem[] = [];

      for (const card of this.searchIndex.values()) {
        if (query === '') {
          cardIds.push(card.id);
          items.push({
            card,
            matches: [],
            score: 0
          });
          continue;
        }

        const matches: Array<{ start: number; end: number; text: string }> = [];
        let score = 0;

        if (card.fileName.includes(query)) {
          const start = card.fileName.indexOf(query);
          matches.push({
            start,
            end: start + query.length,
            text: query
          });
          score += 100;
        }

        if (card.content.includes(query)) {
          const start = card.content.indexOf(query);
          matches.push({
            start,
            end: start + query.length,
            text: query
          });
          score += 50;
        }

        if (card.tags.some(tag => tag.includes(query))) {
          card.tags.forEach(tag => {
            if (tag.includes(query)) {
              const start = tag.indexOf(query);
              matches.push({
                start,
                end: start + query.length,
                text: query
              });
              score += 30;
            }
          });
        }

        if (Object.values(card.properties).some(value => 
          value && value.toString().includes(query)
        )) {
          Object.entries(card.properties).forEach(([key, value]) => {
            if (value && value.toString().includes(query)) {
              const start = value.toString().indexOf(query);
              matches.push({
                start,
                end: start + query.length,
                text: query
              });
              score += 20;
            }
          });
        }

        if (matches.length > 0) {
          cardIds.push(card.id);
          items.push({
            card,
            matches,
            score
          });
        }
      }

      const result: ISearchResult = {
        cardIds,
        query,
        config,
        items
      };

      return result;
    } catch (error) {
      throw new SearchServiceError('검색 실행 중 오류가 발생했습니다.');
    }
  }
} 