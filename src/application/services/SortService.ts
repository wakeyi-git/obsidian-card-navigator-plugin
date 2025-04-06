import { ICard } from '../../domain/models/Card';
import { ICardSet } from '../../domain/models/CardSet';
import { ISortConfig, SortConfig, SortType, SortOrder, SortField } from '../../domain/models/SortConfig';
import { ISortService } from '../../domain/services/ISortService';
import { CardSetError } from '../../domain/errors/CardSetServiceError';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { ISearchResult } from '@/domain/models/SearchResult';
import { Container } from '@/infrastructure/di/Container';
import {
  CardSetSortStartedEvent,
  CardSetSortCompletedEvent,
  CardSetSortFailedEvent,
  SearchResultSortStartedEvent,
  SearchResultSortCompletedEvent,
  SearchResultSortFailedEvent,
  PriorityTagsSortStartedEvent,
  PriorityTagsSortCompletedEvent,
  PriorityTagsSortFailedEvent,
  PriorityFoldersSortStartedEvent,
  PriorityFoldersSortCompletedEvent,
  PriorityFoldersSortFailedEvent
} from '../../domain/events/SortEvents';

/**
 * 정렬 서비스 구현체
 */
export class SortService implements ISortService {
  private static instance: SortService;

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): SortService {
    if (!SortService.instance) {
      const container = Container.getInstance();
      SortService.instance = new SortService(
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return SortService.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    this.loggingService.debug('정렬 서비스 초기화');
  }

  /**
   * 정리
   */
  cleanup(): void {
    this.loggingService.debug('정렬 서비스 정리');
  }

  /**
   * 카드셋 정렬
   * @param cardSet 정렬할 카드셋
   * @param config 정렬 설정
   * @returns 정렬된 카드셋
   */
  async sortCardSet(cardSet: ICardSet, config: ISortConfig): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('SortService.sortCardSet');
    try {
      this.loggingService.debug('정렬 설정 적용 시작', { 
        cardSetId: cardSet.id,
        sortField: config.field,
        sortOrder: config.order
      });

      this.eventDispatcher.dispatch(new CardSetSortStartedEvent(cardSet, config));

      if (!this.validateSortConfig(config)) {
        this.loggingService.warn('유효하지 않은 정렬 설정', { 
          cardSetId: cardSet.id,
          sortField: config.field,
          sortOrder: config.order
        });
        throw new CardSetError(
          '유효하지 않은 정렬 설정입니다.',
          cardSet.id,
          cardSet.config.type,
          'sort'
        );
      }

      // 우선순위 정렬 적용
      let sortedCards = Array.from(cardSet.cards) as ICard[];

      // 우선순위 태그 정렬
      const priorityTags = cardSet.config.filterConfig.priorityTags;
      if (priorityTags && priorityTags.length > 0) {
        const tagSortedCardSet = await this.sortByPriorityTags(
          { ...cardSet, cards: sortedCards },
          Array.from(priorityTags)
        );
        sortedCards = tagSortedCardSet.cards as ICard[];
      }

      // 우선순위 폴더 정렬
      const priorityFolders = cardSet.config.filterConfig.priorityFolders;
      if (priorityFolders && priorityFolders.length > 0) {
        const folderSortedCardSet = await this.sortByPriorityFolders(
          { ...cardSet, cards: sortedCards },
          Array.from(priorityFolders)
        );
        sortedCards = folderSortedCardSet.cards as ICard[];
      }

      // 일반 정렬 적용
      sortedCards.sort((a, b) => {
        let comparison = 0;

        switch (config.field) {
          case 'fileName':
            comparison = a.fileName.localeCompare(b.fileName);
            break;

          case 'modified':
            comparison = this.sortByUpdatedAt(sortedCards, config.order).indexOf(a) - this.sortByUpdatedAt(sortedCards, config.order).indexOf(b);
            break;

          case 'created':
            comparison = this.sortByCreatedAt(sortedCards, config.order).indexOf(a) - this.sortByCreatedAt(sortedCards, config.order).indexOf(b);
            break;
        }

        return comparison;
      });

      const sortedCardSet: ICardSet = {
        ...cardSet,
        cards: sortedCards,
        config: {
          ...cardSet.config,
          sortConfig: config
        }
      };

      this.eventDispatcher.dispatch(new CardSetSortCompletedEvent(sortedCardSet, config));

      this.analyticsService.trackEvent('sort_applied', {
        cardSetId: cardSet.id,
        sortField: config.field,
        sortOrder: config.order,
        priorityTagsCount: priorityTags?.length ?? 0,
        priorityFoldersCount: priorityFolders?.length ?? 0,
        cardCount: sortedCards.length
      });

      this.loggingService.info('정렬 설정 적용 완료', { 
        cardSetId: cardSet.id,
        cardCount: sortedCards.length
      });

      return sortedCardSet;
    } catch (error) {
      this.loggingService.error('정렬 설정 적용 실패', { 
        error,
        cardSetId: cardSet.id,
        sortField: config.field,
        sortOrder: config.order
      });
      const sortError = new CardSetError(
        '정렬 중 오류가 발생했습니다.',
        cardSet.id,
        cardSet.config.type,
        'sort',
        error instanceof Error ? error : new Error(String(error))
      );
      this.errorHandler.handleError(error as Error, 'SortService.sortCardSet');
      this.eventDispatcher.dispatch(new CardSetSortFailedEvent(cardSet, config, sortError));
      throw sortError;
    } finally {
      timer.stop();
    }
  }

  /**
   * 검색 결과 정렬
   * @param result 정렬할 검색 결과
   * @param config 정렬 설정
   * @returns 정렬된 검색 결과
   */
  async sortSearchResult(result: ISearchResult, config: ISortConfig): Promise<ISearchResult> {
    const timer = this.performanceMonitor.startTimer('SortService.sortSearchResult');
    try {
      this.loggingService.debug('검색 결과 정렬 시작', { 
        resultCount: result.cardIds.length,
        sortField: config.field,
        sortOrder: config.order
      });

      this.eventDispatcher.dispatch(new SearchResultSortStartedEvent(result, config));

      if (!this.validateSortConfig(config)) {
        this.loggingService.warn('유효하지 않은 정렬 설정', { 
          sortField: config.field,
          sortOrder: config.order
        });
        throw new CardSetError(
          '유효하지 않은 정렬 설정입니다.',
          'search',
          'folder',
          'sort'
        );
      }

      const sortedCardIds = [...result.cardIds];
      if (config) {
        sortedCardIds.sort((a, b) => {
          return config.order === SortOrder.ASC ? a.localeCompare(b) : b.localeCompare(a);
        });
      }

      const sortedResult = {
        ...result,
        cardIds: sortedCardIds
      };

      this.eventDispatcher.dispatch(new SearchResultSortCompletedEvent(sortedResult, config));

      this.analyticsService.trackEvent('search_results_sorted', {
        resultCount: result.cardIds.length,
        sortField: config.field,
        sortOrder: config.order
      });

      this.loggingService.info('검색 결과 정렬 완료', { 
        resultCount: result.cardIds.length
      });

      return sortedResult;
    } catch (error) {
      this.loggingService.error('검색 결과 정렬 실패', { 
        error,
        resultCount: result.cardIds.length
      });
      this.errorHandler.handleError(error as Error, 'SortService.sortSearchResult');
      this.eventDispatcher.dispatch(new SearchResultSortFailedEvent(result, config, error as Error));
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 정렬 설정 유효성 검사
   * @param config 검사할 정렬 설정
   * @returns 유효성 여부
   */
  validateSortConfig(config: ISortConfig): boolean {
    const timer = this.performanceMonitor.startTimer('SortService.validateSortConfig');
    try {
      this.loggingService.debug('정렬 설정 유효성 검사', { 
        sortField: config.field,
        sortOrder: config.order
      });

      if (!config.field || !['fileName', 'created', 'modified', 'custom'].includes(config.field)) {
        return false;
      }

      if (!config.direction || !['asc', 'desc'].includes(config.direction)) {
        return false;
      }

      if (config.field === 'custom' && !config.customField) {
        return false;
      }

      return true;
    } finally {
      timer.stop();
    }
  }

  /**
   * 기본 정렬 설정 반환
   * @returns 기본 정렬 설정
   */
  getDefaultSortConfig(): ISortConfig {
    const timer = this.performanceMonitor.startTimer('SortService.getDefaultSortConfig');
    try {
      this.loggingService.debug('기본 정렬 설정 조회');
      return new SortConfig(SortType.NAME, SortOrder.ASC, 'fileName', 'asc');
    } finally {
      timer.stop();
    }
  }

  /**
   * 우선순위 태그 정렬
   * @param cardSet 정렬할 카드셋
   * @param priorityTags 우선순위 태그 목록
   * @returns 정렬된 카드셋
   */
  async sortByPriorityTags(cardSet: ICardSet, priorityTags: string[]): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('SortService.sortByPriorityTags');
    try {
      this.loggingService.debug('우선순위 태그 정렬 시작', { 
        cardSetId: cardSet.id,
        priorityTagsCount: priorityTags.length
      });

      this.eventDispatcher.dispatch(new PriorityTagsSortStartedEvent(cardSet, priorityTags));

      const sortedCards = Array.from(cardSet.cards).sort((a, b) => {
        const aPriority = this.getHighestPriority(Array.from(a.tags), priorityTags);
        const bPriority = this.getHighestPriority(Array.from(b.tags), priorityTags);

        // 우선순위가 높은 태그가 있는 카드가 먼저 오도록 정렬
        if (aPriority === -1 && bPriority === -1) return 0;
        if (aPriority === -1) return 1;
        if (bPriority === -1) return -1;
        return aPriority - bPriority;
      });

      const sortedCardSet = {
        ...cardSet,
        cards: sortedCards
      };

      this.eventDispatcher.dispatch(new PriorityTagsSortCompletedEvent(sortedCardSet, priorityTags));

      this.analyticsService.trackEvent('priority_tags_sort_completed', {
        cardSetId: cardSet.id,
        priorityTagsCount: priorityTags.length,
        cardCount: sortedCards.length
      });

      this.loggingService.info('우선순위 태그 정렬 완료', { 
        cardSetId: cardSet.id,
        cardCount: sortedCards.length
      });

      return sortedCardSet;
    } catch (error) {
      this.loggingService.error('우선순위 태그 정렬 실패', { 
        error,
        cardSetId: cardSet.id,
        priorityTagsCount: priorityTags.length
      });
      const sortError = new CardSetError(
        '우선순위 태그 정렬 중 오류가 발생했습니다.',
        cardSet.id,
        cardSet.config.type,
        'sort',
        error instanceof Error ? error : new Error(String(error))
      );
      this.errorHandler.handleError(error as Error, 'SortService.sortByPriorityTags');
      this.eventDispatcher.dispatch(new PriorityTagsSortFailedEvent(cardSet, priorityTags, sortError));
      throw sortError;
    } finally {
      timer.stop();
    }
  }

  /**
   * 우선순위 폴더 정렬
   * @param cardSet 정렬할 카드셋
   * @param priorityFolders 우선순위 폴더 목록
   * @returns 정렬된 카드셋
   */
  async sortByPriorityFolders(cardSet: ICardSet, priorityFolders: string[]): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('SortService.sortByPriorityFolders');
    try {
      this.loggingService.debug('우선순위 폴더 정렬 시작', { 
        cardSetId: cardSet.id,
        priorityFoldersCount: priorityFolders.length
      });

      this.eventDispatcher.dispatch(new PriorityFoldersSortStartedEvent(cardSet, priorityFolders));

      const sortedCards = Array.from(cardSet.cards).sort((a, b) => {
        const aPriority = this.getHighestPriority(
          [a.id.split('/').slice(0, -1).join('/')],
          priorityFolders
        );
        const bPriority = this.getHighestPriority(
          [b.id.split('/').slice(0, -1).join('/')],
          priorityFolders
        );

        // 우선순위가 높은 폴더에 있는 카드가 먼저 오도록 정렬
        if (aPriority === -1 && bPriority === -1) return 0;
        if (aPriority === -1) return 1;
        if (bPriority === -1) return -1;
        return aPriority - bPriority;
      });

      const sortedCardSet = {
        ...cardSet,
        cards: sortedCards
      };

      this.eventDispatcher.dispatch(new PriorityFoldersSortCompletedEvent(sortedCardSet, priorityFolders));

      this.analyticsService.trackEvent('priority_folders_sort_completed', {
        cardSetId: cardSet.id,
        priorityFoldersCount: priorityFolders.length,
        cardCount: sortedCards.length
      });

      this.loggingService.info('우선순위 폴더 정렬 완료', { 
        cardSetId: cardSet.id,
        cardCount: sortedCards.length
      });

      return sortedCardSet;
    } catch (error) {
      this.loggingService.error('우선순위 폴더 정렬 실패', { 
        error,
        cardSetId: cardSet.id,
        priorityFoldersCount: priorityFolders.length
      });
      const sortError = new CardSetError(
        '우선순위 폴더 정렬 중 오류가 발생했습니다.',
        cardSet.id,
        cardSet.config.type,
        'sort',
        error instanceof Error ? error : new Error(String(error))
      );
      this.errorHandler.handleError(error as Error, 'SortService.sortByPriorityFolders');
      this.eventDispatcher.dispatch(new PriorityFoldersSortFailedEvent(cardSet, priorityFolders, sortError));
      throw sortError;
    } finally {
      timer.stop();
    }
  }

  /**
   * 가장 높은 우선순위 반환
   * @param items 우선순위를 확인할 항목 목록
   * @param priorityItems 우선순위 항목 목록
   */
  private getHighestPriority(items: string[], priorityItems: string[]): number {
    let highestPriority = -1;

    for (const item of items) {
      const priority = priorityItems.indexOf(item);
      if (priority !== -1 && (highestPriority === -1 || priority < highestPriority)) {
        highestPriority = priority;
      }
    }

    return highestPriority;
  }

  /**
   * 정렬 값 가져오기
   * @param card 카드
   * @param sortField 정렬 필드
   */
  private getSortValue(card: ICard, sortField: SortField): string {
    switch (sortField) {
      case 'fileName':
        return card.fileName;
      case 'modified':
        return card.updatedAt.toISOString();
      case 'created':
        return card.createdAt.toISOString();
      default:
        return '';
    }
  }

  private sortByUpdatedAt(cards: ICard[], sortOrder: SortOrder): ICard[] {
    return [...cards].sort((a, b) => {
      const dateA = a.updatedAt.getTime();
      const dateB = b.updatedAt.getTime();
      return sortOrder === SortOrder.ASC ? dateA - dateB : dateB - dateA;
    });
  }

  private sortByCreatedAt(cards: ICard[], sortOrder: SortOrder): ICard[] {
    return [...cards].sort((a, b) => {
      const dateA = a.createdAt.getTime();
      const dateB = b.createdAt.getTime();
      return sortOrder === SortOrder.ASC ? dateA - dateB : dateB - dateA;
    });
  }
} 