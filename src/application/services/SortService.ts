import { ICard } from '../../domain/models/Card';
import { ICardSet } from '../../domain/models/CardSet';
import { ISortConfig, SortConfig, SortField, SortOrder } from '../../domain/models/SortConfig';
import { ISortService } from '../../domain/services/ISortService';
import { CardSetError } from '../../domain/errors/CardSetServiceError';
import { CardSetSortedEvent } from '../../domain/events/CardSetEvents';
import { IEventDispatcher } from '@/domain/interfaces/events/IEventDispatcher';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/interfaces/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/interfaces/infrastructure/IAnalyticsService';
import { ISearchResultItem } from '@/domain/services/ISearchService';
import { Container } from '@/infrastructure/di/Container';

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
   * 정렬 설정 적용
   * @param cardSet 카드셋
   * @param config 정렬 설정
   */
  async applySort(cardSet: ICardSet, config: ISortConfig): Promise<ICardSet> {
    const perfMark = 'SortService.applySort';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('정렬 설정 적용 시작', { 
        cardSetId: cardSet.id,
        sortField: config.field,
        sortOrder: config.order
      });

      if (!this.validateSortConfig(config)) {
        this.loggingService.warn('유효하지 않은 정렬 설정', { 
          cardSetId: cardSet.id,
          sortField: config.field,
          sortOrder: config.order
        });
        throw new CardSetError(
          '유효하지 않은 정렬 설정입니다.',
          cardSet.id,
          cardSet.type,
          'sort'
        );
      }

      // 우선순위 정렬 적용
      let sortedCards = Array.from(cardSet.cards) as ICard[];

      // 우선순위 태그 정렬
      if (config.priorityTags && config.priorityTags.length > 0) {
        const tagSortedCardSet = await this.sortByPriorityTags(
          { ...cardSet, cards: sortedCards },
          Array.from(config.priorityTags)
        );
        sortedCards = tagSortedCardSet.cards as ICard[];
      }

      // 우선순위 폴더 정렬
      if (config.priorityFolders && config.priorityFolders.length > 0) {
        const folderSortedCardSet = await this.sortByPriorityFolders(
          { ...cardSet, cards: sortedCards },
          Array.from(config.priorityFolders)
        );
        sortedCards = folderSortedCardSet.cards as ICard[];
      }

      // 일반 정렬 적용
      sortedCards.sort((a, b) => {
        let comparison = 0;

        switch (config.field) {
          case SortField.FILENAME:
            comparison = a.fileName.localeCompare(b.fileName);
            break;

          case SortField.UPDATED_AT:
            comparison = (a.updatedAt?.getTime() ?? 0) - (b.updatedAt?.getTime() ?? 0);
            break;

          case SortField.CREATED_AT:
            comparison = (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
            break;

          case SortField.CUSTOM_FIELD:
            if (config.customField) {
              const aValue = a.properties[config.customField];
              const bValue = b.properties[config.customField];
              comparison = String(aValue).localeCompare(String(bValue));
            }
            break;
        }

        return config.order === SortOrder.ASC ? comparison : -comparison;
      });

      const sortedCardSet: ICardSet = {
        ...cardSet,
        cards: sortedCards,
        config: {
          ...cardSet.config,
          sortConfig: config
        }
      };

      this.eventDispatcher.dispatch(new CardSetSortedEvent(sortedCardSet));

      this.analyticsService.trackEvent('sort_applied', {
        cardSetId: cardSet.id,
        sortField: config.field,
        sortOrder: config.order,
        priorityTagsCount: config.priorityTags?.length ?? 0,
        priorityFoldersCount: config.priorityFolders?.length ?? 0,
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
        cardSet.type,
        'sort',
        error instanceof Error ? error : new Error(String(error))
      );
      this.errorHandler.handleError(error as Error, 'SortService.applySort');
      throw sortError;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 정렬 설정 유효성 검사
   * @param config 정렬 설정
   */
  validateSortConfig(config: ISortConfig): boolean {
    const perfMark = 'SortService.validateSortConfig';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('정렬 설정 유효성 검사', { 
        sortField: config.field,
        sortOrder: config.order
      });
      return config.validate();
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 기본 정렬 설정 반환
   */
  getDefaultSortConfig(): ISortConfig {
    const perfMark = 'SortService.getDefaultSortConfig';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('기본 정렬 설정 조회');
      return new SortConfig(SortField.FILENAME, SortOrder.ASC);
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 우선순위 태그 정렬
   * @param cardSet 카드셋
   * @param priorityTags 우선순위 태그 목록
   */
  async sortByPriorityTags(cardSet: ICardSet, priorityTags: string[]): Promise<ICardSet> {
    const perfMark = 'SortService.sortByPriorityTags';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('우선순위 태그 정렬 시작', { 
        cardSetId: cardSet.id,
        priorityTagsCount: priorityTags.length
      });

      const sortedCards = Array.from(cardSet.cards).sort((a, b) => {
        const aPriority = this.getHighestPriority(a.tags, priorityTags);
        const bPriority = this.getHighestPriority(b.tags, priorityTags);

        // 우선순위가 높은 태그가 있는 카드가 먼저 오도록 정렬
        if (aPriority === -1 && bPriority === -1) return 0;
        if (aPriority === -1) return 1;
        if (bPriority === -1) return -1;
        return aPriority - bPriority;
      });

      this.analyticsService.trackEvent('priority_tags_sort_completed', {
        cardSetId: cardSet.id,
        priorityTagsCount: priorityTags.length,
        cardCount: sortedCards.length
      });

      this.loggingService.info('우선순위 태그 정렬 완료', { 
        cardSetId: cardSet.id,
        cardCount: sortedCards.length
      });

      return {
        ...cardSet,
        cards: sortedCards
      };
    } catch (error) {
      this.loggingService.error('우선순위 태그 정렬 실패', { 
        error,
        cardSetId: cardSet.id,
        priorityTagsCount: priorityTags.length
      });
      const sortError = new CardSetError(
        '우선순위 태그 정렬 중 오류가 발생했습니다.',
        cardSet.id,
        cardSet.type,
        'sort',
        error instanceof Error ? error : new Error(String(error))
      );
      this.errorHandler.handleError(error as Error, 'SortService.sortByPriorityTags');
      throw sortError;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 우선순위 폴더 정렬
   * @param cardSet 카드셋
   * @param priorityFolders 우선순위 폴더 목록
   */
  async sortByPriorityFolders(cardSet: ICardSet, priorityFolders: string[]): Promise<ICardSet> {
    const perfMark = 'SortService.sortByPriorityFolders';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('우선순위 폴더 정렬 시작', { 
        cardSetId: cardSet.id,
        priorityFoldersCount: priorityFolders.length
      });

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

      this.analyticsService.trackEvent('priority_folders_sort_completed', {
        cardSetId: cardSet.id,
        priorityFoldersCount: priorityFolders.length,
        cardCount: sortedCards.length
      });

      this.loggingService.info('우선순위 폴더 정렬 완료', { 
        cardSetId: cardSet.id,
        cardCount: sortedCards.length
      });

      return {
        ...cardSet,
        cards: sortedCards
      };
    } catch (error) {
      this.loggingService.error('우선순위 폴더 정렬 실패', { 
        error,
        cardSetId: cardSet.id,
        priorityFoldersCount: priorityFolders.length
      });
      const sortError = new CardSetError(
        '우선순위 폴더 정렬 중 오류가 발생했습니다.',
        cardSet.id,
        cardSet.type,
        'sort',
        error instanceof Error ? error : new Error(String(error))
      );
      this.errorHandler.handleError(error as Error, 'SortService.sortByPriorityFolders');
      throw sortError;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
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
   * 검색 결과 정렬
   * @param results 검색 결과
   * @param config 정렬 설정
   */
  async sort(results: ISearchResultItem[], config?: ISortConfig): Promise<ISearchResultItem[]> {
    const perfMark = 'SortService.sort';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('검색 결과 정렬 시작', { 
        resultCount: results.length,
        sortField: config?.field,
        sortOrder: config?.order
      });

      if (config && !this.validateSortConfig(config)) {
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

      const sortedResults = [...results];
      if (config) {
        sortedResults.sort((a, b) => {
          const aValue = this.getSortValue(a.card, config.field);
          const bValue = this.getSortValue(b.card, config.field);
          return config.order === SortOrder.ASC ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        });
      } else {
        // 기본적으로 점수 기준 내림차순 정렬
        sortedResults.sort((a, b) => b.score - a.score);
      }

      this.analyticsService.trackEvent('search_results_sorted', {
        resultCount: results.length,
        sortField: config?.field,
        sortOrder: config?.order
      });

      this.loggingService.info('검색 결과 정렬 완료', { 
        resultCount: results.length
      });

      return sortedResults;
    } catch (error) {
      this.loggingService.error('검색 결과 정렬 실패', { 
        error,
        resultCount: results.length
      });
      this.errorHandler.handleError(error as Error, 'SortService.sort');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 정렬 값 가져오기
   * @param card 카드
   * @param field 정렬 필드
   */
  private getSortValue(card: ICard, field: SortField): string {
    switch (field) {
      case SortField.FILENAME:
        return card.fileName;
      case SortField.CREATED_AT:
        return card.createdAt.toISOString();
      case SortField.UPDATED_AT:
        return card.updatedAt.toISOString();
      case SortField.CUSTOM_FIELD:
        return '';
      default:
        return '';
    }
  }
} 