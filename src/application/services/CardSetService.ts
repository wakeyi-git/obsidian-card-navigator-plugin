import { App, TFile } from 'obsidian';
import { ICardSetService } from '../../domain/services/ICardSetService';
import { ICard } from '../../domain/models/Card';
import { ICardSet } from '../../domain/models/CardSet';
import { CardSetType, ICardSetConfig, IFolderCardSetConfig, ITagCardSetConfig, ILinkCardSetConfig } from '../../domain/models/CardSetConfig';
import { ISortConfig, DEFAULT_SORT_CONFIG } from '../../domain/models/SortConfig';
import { DEFAULT_SEARCH_CONFIG } from '../../domain/models/SearchConfig';
import { DEFAULT_FILTER_CONFIG } from '../../domain/models/FilterConfig';
import { IErrorHandler } from '../../domain/infrastructure/IErrorHandler';
import { ILoggingService } from '../../domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '../../domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '../../domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '../../domain/infrastructure/IEventDispatcher';
import { Container } from '../../infrastructure/di/Container';
import { CardSetError } from '../../domain/errors/CardSetError';
import { ICardService } from '../../domain/services/ICardService';
import { CardSetCreatedEvent, CardSetUpdatedEvent, CardSetSortedEvent } from '../../domain/events/CardSetEvents';
import { DEFAULT_CARD_CONFIG } from '../../domain/models/CardConfig';
import { DomainEventType } from '../../domain/events/DomainEventType';

/**
 * 카드셋 서비스 구현체
 */
export class CardSetService implements ICardSetService {
  private static instance: CardSetService;
  private cardSets: Map<string, ICardSet> = new Map();
  private eventSubscribers: Set<(event: any) => void> = new Set();

  private constructor(
    private readonly app: App,
    private readonly cardService: ICardService,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): CardSetService {
    if (!CardSetService.instance) {
      const container = Container.getInstance();
      CardSetService.instance = new CardSetService(
        container.resolve('App'),
        container.resolve('ICardService'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return CardSetService.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    // 초기화 로직
  }

  /**
   * 정리
   */
  cleanup(): void {
    this.cardSets.clear();
    this.eventSubscribers.clear();
  }

  /**
   * 카드셋 생성
   */
  async createCardSet(type: CardSetType, config: ICardSetConfig): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('CardSetService.createCardSet');
    try {
      this.loggingService.debug('카드셋 생성 시작', { type, config });

      const cardSet: ICardSet = {
        id: crypto.randomUUID(),
        config,
        cards: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.eventDispatcher.dispatch(new CardSetCreatedEvent(cardSet));
      this.analyticsService.trackEvent('card_set_created', {
        cardSetId: cardSet.id,
        type: config.type,
        cardCount: cardSet.cards.length
      });

      this.loggingService.info('카드셋 생성 완료', { 
        cardSetId: cardSet.id,
        cardCount: cardSet.cards.length
      });

      return cardSet;
    } catch (error) {
      this.loggingService.error('카드셋 생성 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.createCardSet');
      throw new CardSetError('카드셋 생성에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 폴더 기반 카드셋 생성
   */
  async createCardSetByFolder(config: IFolderCardSetConfig): Promise<ICardSet> {
    return this.createCardSet(CardSetType.FOLDER, {
      type: CardSetType.FOLDER,
      folder: config,
      filterConfig: DEFAULT_FILTER_CONFIG,
      sortConfig: DEFAULT_SORT_CONFIG,
      searchConfig: DEFAULT_SEARCH_CONFIG
    });
  }

  /**
   * 태그 기반 카드셋 생성
   */
  async createCardSetByTag(config: ITagCardSetConfig): Promise<ICardSet> {
    return this.createCardSet(CardSetType.TAG, {
      type: CardSetType.TAG,
      tag: config,
      filterConfig: DEFAULT_FILTER_CONFIG,
      sortConfig: DEFAULT_SORT_CONFIG,
      searchConfig: DEFAULT_SEARCH_CONFIG
    });
  }

  /**
   * 링크 기반 카드셋 생성
   */
  async createCardSetByLink(config: ILinkCardSetConfig): Promise<ICardSet> {
    return this.createCardSet(CardSetType.LINK, {
      type: CardSetType.LINK,
      link: config,
      filterConfig: DEFAULT_FILTER_CONFIG,
      sortConfig: DEFAULT_SORT_CONFIG,
      searchConfig: DEFAULT_SEARCH_CONFIG
    });
  }

  /**
   * 카드셋 업데이트
   */
  async updateCardSet(cardSet: ICardSet, config: ICardSetConfig): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('CardSetService.updateCardSet');
    try {
      this.loggingService.debug('카드셋 업데이트 시작', { 
        cardSetId: cardSet.id,
        config
      });

      const updatedCardSet: ICardSet = {
        ...cardSet,
        config,
        updatedAt: new Date()
      };

      this.eventDispatcher.dispatch(new CardSetUpdatedEvent(updatedCardSet));
      this.analyticsService.trackEvent('card_set_updated', {
        cardSetId: cardSet.id,
        type: config.type,
        cardCount: cardSet.cards.length
      });

      this.loggingService.info('카드셋 업데이트 완료', { 
        cardSetId: cardSet.id
      });

      return updatedCardSet;
    } catch (error) {
      this.loggingService.error('카드셋 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.updateCardSet');
      throw new CardSetError('카드셋 업데이트에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드셋에 카드 추가
   */
  async addCardToSet(cardSet: ICardSet, file: TFile): Promise<void> {
    const timer = this.performanceMonitor.startTimer('CardSetService.addCardToSet');
    try {
      this.loggingService.debug('카드셋에 카드 추가 시작', { 
        cardSetId: cardSet.id,
        filePath: file.path
      });

      const card = await this.cardService.createCardFromFile(file, DEFAULT_CARD_CONFIG);
      if (!card) {
        throw new CardSetError('카드를 생성할 수 없습니다.');
      }

      const updatedCardSet: ICardSet = {
        ...cardSet,
        cards: [...cardSet.cards, card],
        updatedAt: new Date()
      };

      this.eventDispatcher.dispatch(new CardSetUpdatedEvent(updatedCardSet));
      this.analyticsService.trackEvent('card_added_to_set', {
        cardSetId: updatedCardSet.id,
        filePath: file.path
      });

      this.loggingService.info('카드셋에 카드 추가 완료', { 
        cardSetId: updatedCardSet.id
      });
    } catch (error) {
      this.loggingService.error('카드셋에 카드 추가 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.addCardToSet');
      throw new CardSetError('카드셋에 카드를 추가할 수 없습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드셋에서 카드 제거
   */
  async removeCardFromSet(cardSet: ICardSet, file: TFile): Promise<void> {
    const timer = this.performanceMonitor.startTimer('CardSetService.removeCardFromSet');
    try {
      this.loggingService.debug('카드셋에서 카드 제거 시작', { 
        cardSetId: cardSet.id,
        filePath: file.path
      });

      const updatedCards = cardSet.cards.filter(card => card.file.path !== file.path);
      if (updatedCards.length === cardSet.cards.length) {
        throw new CardSetError('카드를 찾을 수 없습니다.');
      }

      const updatedCardSet: ICardSet = {
        ...cardSet,
        cards: updatedCards,
        updatedAt: new Date()
      };

      this.eventDispatcher.dispatch(new CardSetUpdatedEvent(updatedCardSet));
      this.analyticsService.trackEvent('card_removed_from_set', {
        cardSetId: updatedCardSet.id,
        filePath: file.path
      });

      this.loggingService.info('카드셋에서 카드 제거 완료', { 
        cardSetId: updatedCardSet.id
      });
    } catch (error) {
      this.loggingService.error('카드셋에서 카드 제거 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.removeCardFromSet');
      throw new CardSetError('카드셋에서 카드를 제거할 수 없습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드셋의 카드 정렬
   */
  async sortCards(cardSet: ICardSet, sortConfig: ISortConfig): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('CardSetService.sortCards');
    try {
      this.loggingService.debug('카드셋의 카드 정렬 시작', { 
        cardSetId: cardSet.id,
        sortConfig
      });

      const sortedCards = [...cardSet.cards].sort((a, b) => {
        const aValue = this.getSortValue(a, sortConfig.field);
        const bValue = this.getSortValue(b, sortConfig.field);
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      });

      const updatedCardSet: ICardSet = {
        ...cardSet,
        cards: sortedCards,
        config: {
          ...cardSet.config,
          sortConfig
        },
        updatedAt: new Date()
      };

      this.eventDispatcher.dispatch(new CardSetSortedEvent(updatedCardSet));
      this.analyticsService.trackEvent('cards_sorted', {
        cardSetId: updatedCardSet.id,
        field: sortConfig.field,
        direction: sortConfig.direction
      });

      this.loggingService.info('카드셋의 카드 정렬 완료', { 
        cardSetId: updatedCardSet.id
      });

      return updatedCardSet;
    } catch (error) {
      this.loggingService.error('카드셋의 카드 정렬 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.sortCards');
      throw new CardSetError('카드셋의 카드를 정렬할 수 없습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드셋 유효성 검사
   */
  validateCardSet(cardSet: ICardSet): boolean {
    const timer = this.performanceMonitor.startTimer('CardSetService.validateCardSet');
    try {
      if (!cardSet.id || !cardSet.config || !Array.isArray(cardSet.cards)) {
        return false;
      }

      return cardSet.cards.every(card => this.cardService.validateCard(card));
    } finally {
      timer.stop();
    }
  }

  /**
   * 정렬 값 가져오기
   */
  private getSortValue(card: ICard, field: string): string {
    switch (field) {
      case 'fileName':
        return card.fileName;
      case 'firstHeader':
        return card.firstHeader || '';
      case 'createdAt':
        return card.createdAt.toISOString();
      case 'updatedAt':
        return card.updatedAt.toISOString();
      case 'custom':
        return card.properties[field] || '';
      default:
        return '';
    }
  }

  /**
   * 카드셋의 카드 필터링
   */
  async filterCards(
    cardSet: ICardSet,
    filter: (card: ICard) => boolean
  ): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('CardSetService.filterCards');
    try {
      this.loggingService.debug('카드셋의 카드 필터링 시작', { 
        cardSetId: cardSet.id
      });

      const filteredCards = cardSet.cards.filter(filter);
      const updatedCardSet: ICardSet = {
        ...cardSet,
        cards: filteredCards,
        updatedAt: new Date()
      };

      this.eventDispatcher.dispatch(new CardSetUpdatedEvent(updatedCardSet));
      this.analyticsService.trackEvent('cards_filtered', {
        cardSetId: updatedCardSet.id,
        filteredCount: filteredCards.length
      });

      this.loggingService.info('카드셋의 카드 필터링 완료', { 
        cardSetId: updatedCardSet.id,
        filteredCount: filteredCards.length
      });

      return updatedCardSet;
    } catch (error) {
      this.loggingService.error('카드셋의 카드 필터링 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.filterCards');
      throw new CardSetError('카드셋의 카드를 필터링할 수 없습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * ID로 카드를 가져옵니다.
   * @param cardId 카드 ID
   * @returns 카드 또는 null
   */
  getCardById(cardId: string): ICard | null {
    const timer = this.performanceMonitor.startTimer('CardSetService.getCardById');
    try {
      this.loggingService.debug('ID로 카드 조회 시작', { cardId });

      // 모든 카드셋에서 해당 ID의 카드 찾기
      for (const cardSet of this.cardSets.values()) {
        const card = cardSet.cards.find(c => c.id === cardId);
        if (card) {
          this.loggingService.debug('카드 찾음', { cardId, cardSetId: cardSet.id });
          return card;
        }
      }

      this.loggingService.debug('카드를 찾을 수 없음', { cardId });
      return null;
    } catch (error) {
      this.loggingService.error('ID로 카드 조회 중 오류 발생', { error, cardId });
      return null;
    } finally {
      timer.stop();
    }
  }
} 