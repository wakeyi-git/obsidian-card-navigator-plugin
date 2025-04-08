import { App, TFile } from 'obsidian';
import { ICardSetService } from '@/domain/services/domain/ICardSetService';
import { ICard } from '@/domain/models/Card';
import { ICardSet, ICardSetConfig, CardSetType, LinkType } from '@/domain/models/CardSet';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';
import { CardSetError } from '@/domain/errors/CardSetError';
import { ICardService } from '@/domain/services/domain/ICardService';
import { CardSetCreatedEvent, CardSetUpdatedEvent, CardSetDeletedEvent } from '@/domain/events/CardSetEvents';
import { DEFAULT_CARD_SECTION } from '@/domain/models/Card';
import { CardSetServiceError } from '@/domain/errors/CardSetServiceError';

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
    const timer = this.performanceMonitor.startTimer('CardSetService.initialize');
    try {
      this.loggingService.debug('카드셋 서비스 초기화 시작');
      this.cardSets.clear();
      this.eventSubscribers.clear();
      this.loggingService.info('카드셋 서비스 초기화 완료');
    } catch (error) {
      this.loggingService.error('카드셋 서비스 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.initialize');
      throw new CardSetError('카드셋 서비스 초기화에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 정리
   */
  cleanup(): void {
    const timer = this.performanceMonitor.startTimer('CardSetService.cleanup');
    try {
      this.loggingService.debug('카드셋 서비스 정리 시작');
      this.cardSets.clear();
      this.eventSubscribers.clear();
      this.loggingService.info('카드셋 서비스 정리 완료');
    } catch (error) {
      this.loggingService.error('카드셋 서비스 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.cleanup');
      throw new CardSetError('카드셋 서비스 정리에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드셋 생성
   */
  async createCardSet(type: CardSetType, config: ICardSetConfig): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('CardSetService.createCardSet');
    try {
      this.loggingService.debug('카드셋 생성 시작', { 
        type, 
        config: {
          criteria: {
            type: config.criteria.type,
            folderPath: config.criteria.folderPath,
            tag: config.criteria.tag,
            filePath: config.criteria.filePath,
            linkType: config.criteria.linkType
          },
          filter: {
            includeSubfolders: config.filter.includeSubfolders,
            includeSubtags: config.filter.includeSubtags,
            linkDepth: config.filter.linkDepth
          }
        }
      });

      const cardSet: ICardSet = {
        id: crypto.randomUUID(),
        config,
        cards: [],
        cardCount: 0,
        isActive: true,
        lastUpdated: new Date()
      };

      // 생성된 카드셋을 Map에 저장
      this.cardSets.set(cardSet.id, cardSet);

      this.eventDispatcher.dispatch(new CardSetCreatedEvent(cardSet));
      this.analyticsService.trackEvent('card_set_created', {
        cardSetId: cardSet.id,
        type: config.criteria.type,
        cardCount: cardSet.cardCount,
        criteria: {
          folderPath: config.criteria.folderPath,
          tag: config.criteria.tag,
          filePath: config.criteria.filePath,
          linkType: config.criteria.linkType
        }
      });

      this.loggingService.info('카드셋 생성 완료', { 
        cardSetId: cardSet.id,
        type: config.criteria.type,
        cardCount: cardSet.cardCount,
        criteria: {
          folderPath: config.criteria.folderPath,
          tag: config.criteria.tag,
          filePath: config.criteria.filePath,
          linkType: config.criteria.linkType
        }
      });

      return cardSet;
    } catch (error) {
      this.loggingService.error('카드셋 생성 실패', { 
        error,
        type,
        config: {
          criteria: {
            type: config.criteria.type,
            folderPath: config.criteria.folderPath,
            tag: config.criteria.tag,
            filePath: config.criteria.filePath,
            linkType: config.criteria.linkType
          }
        }
      });
      this.errorHandler.handleError(error as Error, 'CardSetService.createCardSet');
      throw new CardSetError('카드셋 생성에 실패했습니다.');
    } finally {
      timer.stop();
    }
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
        config
      };

      this.eventDispatcher.dispatch(new CardSetUpdatedEvent(updatedCardSet));
      this.analyticsService.trackEvent('card_set_updated', {
        cardSetId: cardSet.id,
        type: config.criteria.type,
        cardCount: cardSet.cardCount
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

      const card = await this.cardService.createCardFromFile(file, DEFAULT_CARD_SECTION);
      if (!card) {
        throw new CardSetError('카드를 생성할 수 없습니다.');
      }

      const updatedCardSet: ICardSet = {
        ...cardSet,
        cards: [...cardSet.cards, card],
        cardCount: cardSet.cardCount + 1
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

      const updatedCards = cardSet.cards.filter(card => card.id !== file.path);
      if (updatedCards.length === cardSet.cards.length) {
        throw new CardSetError('카드를 찾을 수 없습니다.');
      }

      const updatedCardSet: ICardSet = {
        ...cardSet,
        cards: updatedCards,
        cardCount: updatedCards.length
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
   * 카드셋의 카드 필터링
   */
  async filterCards(cardSet: ICardSet, filter: (card: ICard) => boolean): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('CardSetService.filterCards');
    try {
      this.loggingService.debug('카드셋의 카드 필터링 시작', { 
        cardSetId: cardSet.id
      });

      const filteredCards = cardSet.cards.filter(filter);
      const updatedCardSet: ICardSet = {
        ...cardSet,
        cards: filteredCards,
        cardCount: filteredCards.length
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

  /**
   * 카드셋 삭제
   * @param cardSetId 카드셋 ID
   */
  async deleteCardSet(cardSetId: string): Promise<void> {
    const timer = this.performanceMonitor.startTimer('CardSetService.deleteCardSet');
    try {
      this.loggingService.debug('카드셋 삭제 시작', { cardSetId });

      const cardSet = this.cardSets.get(cardSetId);
      if (!cardSet) {
        throw new CardSetError('카드셋을 찾을 수 없습니다.');
      }

      this.cardSets.delete(cardSetId);
      this.eventDispatcher.dispatch(new CardSetDeletedEvent(cardSet));

      this.analyticsService.trackEvent('card_set_deleted', {
        cardSetId,
        cardCount: cardSet.cardCount
      });

      this.loggingService.info('카드셋 삭제 완료', { cardSetId });
    } catch (error) {
      this.loggingService.error('카드셋 삭제 실패', { error, cardSetId });
      this.errorHandler.handleError(error as Error, 'CardSetService.deleteCardSet');
      throw new CardSetServiceError('카드셋 삭제 중 오류가 발생했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 활성 폴더 카드셋 생성
   */
  async createActiveFolderCardSet(activeFile: TFile): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('CardSetService.createActiveFolderCardSet');
    try {
      this.loggingService.debug('활성 폴더 카드셋 생성 시작', { filePath: activeFile.path });

      const folderPath = activeFile.parent?.path || '/';
      const config: ICardSetConfig = {
        criteria: {
          type: CardSetType.FOLDER,
          folderPath
        },
        filter: {
          includeSubfolders: false
        }
      };

      return await this.createCardSet(CardSetType.FOLDER, config);
    } catch (error) {
      this.loggingService.error('활성 폴더 카드셋 생성 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.createActiveFolderCardSet');
      throw new CardSetError('활성 폴더 카드셋 생성에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 지정 폴더 카드셋 생성
   */
  async createSpecifiedFolderCardSet(folderPath: string, includeSubfolders: boolean): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('CardSetService.createSpecifiedFolderCardSet');
    try {
      this.loggingService.debug('지정 폴더 카드셋 생성 시작', { folderPath, includeSubfolders });

      const config: ICardSetConfig = {
        criteria: {
          type: CardSetType.FOLDER,
          folderPath
        },
        filter: {
          includeSubfolders
        }
      };

      return await this.createCardSet(CardSetType.FOLDER, config);
    } catch (error) {
      this.loggingService.error('지정 폴더 카드셋 생성 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.createSpecifiedFolderCardSet');
      throw new CardSetError('지정 폴더 카드셋 생성에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 활성 태그 카드셋 생성
   */
  async createActiveTagCardSet(activeFile: TFile, includeSubtags: boolean, caseSensitive: boolean): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('CardSetService.createActiveTagCardSet');
    try {
      this.loggingService.debug('활성 태그 카드셋 생성 시작', { 
        filePath: activeFile.path,
        includeSubtags,
        caseSensitive
      });

      const config: ICardSetConfig = {
        criteria: {
          type: CardSetType.TAG,
          tag: activeFile.basename
        },
        filter: {
          includeSubtags,
          tagCaseSensitive: caseSensitive
        }
      };

      return await this.createCardSet(CardSetType.TAG, config);
    } catch (error) {
      this.loggingService.error('활성 태그 카드셋 생성 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.createActiveTagCardSet');
      throw new CardSetError('활성 태그 카드셋 생성에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 지정 태그 카드셋 생성
   */
  async createSpecifiedTagCardSet(tag: string, includeSubtags: boolean, caseSensitive: boolean): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('CardSetService.createSpecifiedTagCardSet');
    try {
      this.loggingService.debug('지정 태그 카드셋 생성 시작', { 
        tag,
        includeSubtags,
        caseSensitive
      });

      const config: ICardSetConfig = {
        criteria: {
          type: CardSetType.TAG,
          tag
        },
        filter: {
          includeSubtags,
          tagCaseSensitive: caseSensitive
        }
      };

      return await this.createCardSet(CardSetType.TAG, config);
    } catch (error) {
      this.loggingService.error('지정 태그 카드셋 생성 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.createSpecifiedTagCardSet');
      throw new CardSetError('지정 태그 카드셋 생성에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 링크 카드셋 생성
   */
  async createLinkCardSet(filePath: string, linkType: LinkType, linkDepth: number): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('CardSetService.createLinkCardSet');
    try {
      this.loggingService.debug('링크 카드셋 생성 시작', { 
        filePath,
        linkType,
        linkDepth
      });

      const config: ICardSetConfig = {
        criteria: {
          type: CardSetType.LINK,
          filePath,
          linkType
        },
        filter: {
          linkDepth
        }
      };

      return await this.createCardSet(CardSetType.LINK, config);
    } catch (error) {
      this.loggingService.error('링크 카드셋 생성 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.createLinkCardSet');
      throw new CardSetError('링크 카드셋 생성에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 폴더 경로 목록 조회
   */
  async getFolderPaths(): Promise<string[]> {
    const timer = this.performanceMonitor.startTimer('CardSetService.getFolderPaths');
    try {
      this.loggingService.debug('폴더 경로 목록 조회 시작');

      const folders = this.app.vault.getAllFolders();
      const paths = folders.map(folder => folder.path);

      this.loggingService.debug('폴더 경로 목록 조회 완료', { count: paths.length });
      return paths;
    } catch (error) {
      this.loggingService.error('폴더 경로 목록 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.getFolderPaths');
      throw new CardSetError('폴더 경로 목록 조회에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 태그 목록 조회
   */
  async getTags(): Promise<string[]> {
    const timer = this.performanceMonitor.startTimer('CardSetService.getTags');
    try {
      this.loggingService.debug('태그 목록 조회 시작');

      const files = this.app.vault.getMarkdownFiles();
      const tags = new Set<string>();

      for (const file of files) {
        const metadata = this.app.metadataCache.getFileCache(file);
        if (metadata?.tags) {
          metadata.tags.forEach(tag => {
            // TagCache를 string으로 변환
            const tagString = tag.toString();
            // 태그에서 # 제거
            const cleanTag = tagString.replace(/^#/, '');
            tags.add(cleanTag);
          });
        }
      }

      const tagList = Array.from(tags);
      this.loggingService.debug('태그 목록 조회 완료', { count: tagList.length });
      return tagList;
    } catch (error) {
      this.loggingService.error('태그 목록 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.getTags');
      throw new CardSetError('태그 목록 조회에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드셋 활성화
   */
  async activateCardSet(cardSetId: string): Promise<void> {
    const timer = this.performanceMonitor.startTimer('CardSetService.activateCardSet');
    try {
      this.loggingService.debug('카드셋 활성화 시작', { cardSetId });

      const cardSet = this.cardSets.get(cardSetId);
      if (!cardSet) {
        throw new CardSetError('카드셋을 찾을 수 없습니다.');
      }

      const updatedCardSet: ICardSet = {
        ...cardSet,
        isActive: true,
        lastUpdated: new Date()
      };

      this.cardSets.set(cardSetId, updatedCardSet);
      this.eventDispatcher.dispatch(new CardSetUpdatedEvent(updatedCardSet));

      this.loggingService.info('카드셋 활성화 완료', { cardSetId });
    } catch (error) {
      this.loggingService.error('카드셋 활성화 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.activateCardSet');
      throw new CardSetError('카드셋 활성화에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드셋 비활성화
   */
  async deactivateCardSet(cardSetId: string): Promise<void> {
    const timer = this.performanceMonitor.startTimer('CardSetService.deactivateCardSet');
    try {
      this.loggingService.debug('카드셋 비활성화 시작', { cardSetId });

      const cardSet = this.cardSets.get(cardSetId);
      if (!cardSet) {
        throw new CardSetError('카드셋을 찾을 수 없습니다.');
      }

      const updatedCardSet: ICardSet = {
        ...cardSet,
        isActive: false,
        lastUpdated: new Date()
      };

      this.cardSets.set(cardSetId, updatedCardSet);
      this.eventDispatcher.dispatch(new CardSetUpdatedEvent(updatedCardSet));

      this.loggingService.info('카드셋 비활성화 완료', { cardSetId });
    } catch (error) {
      this.loggingService.error('카드셋 비활성화 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.deactivateCardSet');
      throw new CardSetError('카드셋 비활성화에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 활성 카드셋 조회
   */
  async getActiveCardSet(): Promise<ICardSet | null> {
    const timer = this.performanceMonitor.startTimer('CardSetService.getActiveCardSet');
    try {
      this.loggingService.debug('활성 카드셋 조회 시작');

      for (const cardSet of this.cardSets.values()) {
        if (cardSet.isActive) {
          this.loggingService.debug('활성 카드셋 찾음', { cardSetId: cardSet.id });
          return cardSet;
        }
      }

      this.loggingService.debug('활성 카드셋 없음');
      return null;
    } catch (error) {
      this.loggingService.error('활성 카드셋 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.getActiveCardSet');
      throw new CardSetError('활성 카드셋 조회에 실패했습니다.');
    } finally {
      timer.stop();
    }
  }
} 