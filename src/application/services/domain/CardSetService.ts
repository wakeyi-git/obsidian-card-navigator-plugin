import { App, TFile, TFolder } from 'obsidian';
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
import { CardSetUpdatedEvent, CardSetDeletedEvent } from '@/domain/events/CardSetEvents';
import { DEFAULT_CARD_SECTION } from '@/domain/models/Card';
import { CardSetServiceError } from '@/domain/errors/CardSetServiceError';
import { ISearchConfig } from '@/domain/models/Search';
import { ICardSetFactory } from '@/domain/factories/ICardSetFactory';
import { ICardService } from '@/domain/services/domain/ICardService';

/**
 * 카드셋 서비스 구현체
 */
export class CardSetService implements ICardSetService {
  private static instance: CardSetService;
  private cardSets: Map<string, ICardSet> = new Map();
  private eventSubscribers: Set<(event: any) => void> = new Set();

  private constructor(
    private readonly app: App,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly cardSetFactory: ICardSetFactory,
    private readonly cardService: ICardService
  ) {}

  static getInstance(): CardSetService {
    if (!CardSetService.instance) {
      const container = Container.getInstance();
      CardSetService.instance = new CardSetService(
        container.resolve('App'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher'),
        container.resolve('ICardSetFactory'),
        container.resolve('ICardService')
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
      this.loggingService.debug('카드셋 생성 시작', { type, config });

      const cardSet = this.cardSetFactory.create(type, config);
      const files = await this.getFilesByCardSet(cardSet);

      for (const file of files) {
        try {
          await this.addCardToSet(cardSet, file);
        } catch (error) {
          this.loggingService.error('카드셋에 카드 추가 실패', { error });
          this.errorHandler.handleError(error as Error, 'CardSetService.addCardToSet');
          throw new CardSetError('카드셋에 카드를 추가할 수 없습니다.');
        }
      }

      this.analyticsService.trackEvent('card_set_created', {
        cardSetId: cardSet.id,
        type: cardSet.type,
        cardCount: cardSet.cards.length,
        criteria: cardSet.criteria
      });

      this.loggingService.info('카드셋 생성 완료', {
        cardSetId: cardSet.id,
        type: cardSet.type,
        cardCount: cardSet.cards.length,
        criteria: cardSet.criteria
      });

      return cardSet;
    } catch (error) {
      this.loggingService.error('카드셋 생성 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.createCardSet');
      throw new CardSetError('카드셋을 생성할 수 없습니다.');
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

  /**
   * 카드셋에 해당하는 파일들을 가져옵니다.
   * @param cardSet 카드셋
   * @returns 파일 배열
   */
  async getFilesByCardSet(cardSet: ICardSet): Promise<TFile[]> {
    const timer = this.performanceMonitor.startTimer('CardSetService.getFilesByCardSet');
    try {
      this.loggingService.debug('카드셋 파일 조회 시작', { 
        cardSetId: cardSet.id,
        criteria: cardSet.config.criteria,
        filter: cardSet.config.filter
      });

      const files: TFile[] = [];
      const { criteria, filter } = cardSet.config;

      switch (criteria.type) {
        case CardSetType.FOLDER: {
          const folderPath = criteria.folderPath || '';
          const includeSubfolders = filter.includeSubfolders || false;
          this.loggingService.debug('폴더 카드셋 파일 조회', { 
            folderPath,
            includeSubfolders
          });
          try {
            const folderFiles = this.getFolderFiles(folderPath, includeSubfolders);
            this.loggingService.debug('폴더 파일 조회 결과', { 
              folderPath,
              fileCount: folderFiles.length
            });
            files.push(...folderFiles);
          } catch (error) {
            this.loggingService.error('폴더 파일 조회 실패', { 
              error,
              folderPath
            });
          }
          break;
        }
        case CardSetType.TAG: {
          const tag = criteria.tag || '';
          const includeSubtags = filter.includeSubtags || false;
          this.loggingService.debug('태그 카드셋 파일 조회', { 
            tag,
            includeSubtags
          });
          try {
            const taggedFiles = this.getTaggedFiles([tag]);
            this.loggingService.debug('태그 파일 조회 결과', { 
              tag,
              fileCount: taggedFiles.length
            });
            files.push(...taggedFiles);
          } catch (error) {
            this.loggingService.error('태그 파일 조회 실패', { 
              error,
              tag
            });
          }
          break;
        }
        case CardSetType.LINK: {
          const filePath = criteria.filePath || '';
          const linkType = criteria.linkType;
          const linkDepth = filter.linkDepth || 1;
          this.loggingService.debug('링크 카드셋 파일 조회', { 
            filePath,
            linkType,
            linkDepth
          });
          try {
            const file = this.app.vault.getAbstractFileByPath(filePath);
            if (file instanceof TFile) {
              const linkedFiles = this.getLinkedFiles(file, linkDepth);
              this.loggingService.debug('링크 파일 조회 결과', { 
                filePath,
                fileCount: linkedFiles.length
              });
              files.push(...linkedFiles);
            }
          } catch (error) {
            this.loggingService.error('링크 파일 조회 실패', { 
              error,
              filePath
            });
          }
          break;
        }
        default:
          throw new CardSetError('지원하지 않는 카드셋 타입입니다.');
      }

      this.loggingService.info('카드셋 파일 조회 완료', { 
        cardSetId: cardSet.id,
        fileCount: files.length
      });

      return files;
    } catch (error) {
      this.loggingService.error('카드셋 파일 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSetService.getFilesByCardSet');
      throw new CardSetError('카드셋 파일을 조회할 수 없습니다.');
    } finally {
      timer.stop();
    }
  }

  /**
   * 파일을 검색합니다.
   * @param files 검색할 파일 목록
   * @param config 검색 설정
   * @returns 검색된 파일 목록
   */
  private async searchFiles(files: TFile[], config: ISearchConfig): Promise<TFile[]> {
    const searchResults: TFile[] = [];
    const timer = this.performanceMonitor.startTimer('searchFiles');

    try {
      for (const file of files) {
        const content = await this.app.vault.cachedRead(file);
        const fileContent = config.criteria.caseSensitive ? content : content.toLowerCase();
        const searchQuery = config.criteria.caseSensitive ? config.criteria.query : config.criteria.query.toLowerCase();

        const cache = this.app.metadataCache.getFileCache(file);
        const fileName = config.criteria.caseSensitive ? file.basename : file.basename.toLowerCase();
        const frontmatter = cache?.frontmatter ? 
          (config.criteria.caseSensitive ? JSON.stringify(cache.frontmatter) : JSON.stringify(cache.frontmatter).toLowerCase()) 
          : '';
        const tags = cache?.tags?.map(t => 
          config.criteria.caseSensitive ? t.tag : t.tag.toLowerCase()
        ).join(' ') || '';

        let matches = false;

        if (config.criteria.useRegex) {
          try {
            const regex = new RegExp(searchQuery, config.criteria.caseSensitive ? 'g' : 'gi');
            matches = regex.test(fileContent) || 
                     regex.test(fileName) || 
                     regex.test(frontmatter) || 
                     regex.test(tags);
          } catch (error) {
            this.loggingService.error('정규식 검색 중 오류 발생:', error);
            continue;
          }
        } else if (config.criteria.wholeWord) {
          const searchWords = searchQuery.split(/\s+/);
          const contentWords = fileContent.split(/\s+/);
          const fileNameWords = fileName.split(/\s+/);
          const frontmatterWords = frontmatter.split(/\s+/);
          const tagWords = tags.split(/\s+/);

          matches = searchWords.every((word: string) => 
            contentWords.includes(word) || 
            fileNameWords.includes(word) || 
            frontmatterWords.includes(word) || 
            tagWords.includes(word)
          );
        } else {
          matches = fileContent.includes(searchQuery) ||
                   fileName.includes(searchQuery) ||
                   frontmatter.includes(searchQuery) ||
                   tags.includes(searchQuery);
        }

        if (matches) {
          searchResults.push(file);
        }
      }
    } catch (error) {
      this.loggingService.error('파일 검색 중 오류 발생:', error);
    } finally {
      timer.stop();
    }

    return searchResults;
  }

  /**
   * 폴더에서 파일을 가져옵니다.
   * @param folderPath 폴더 경로
   * @param includeSubfolders 하위 폴더 포함 여부
   * @returns 파일 목록
   */
  private getFolderFiles(folderPath: string, includeSubfolders: boolean): TFile[] {
    this.loggingService.debug('폴더 파일 조회 시작', { 
      folderPath,
      includeSubfolders
    });

    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!(folder instanceof TFolder)) {
      this.loggingService.error('폴더를 찾을 수 없음', { 
        folderPath,
        folderType: folder?.constructor.name
      });
      throw new CardSetServiceError(`폴더를 찾을 수 없습니다: ${folderPath}`);
    }

    const files: TFile[] = [];
    const collectFiles = (folder: TFolder) => {
      for (const child of folder.children) {
        if (child instanceof TFile) {
          files.push(child);
        } else if (includeSubfolders && child instanceof TFolder) {
          collectFiles(child);
        }
      }
    };

    collectFiles(folder);
    this.loggingService.debug('폴더 파일 조회 완료', { 
      folderPath,
      fileCount: files.length
    });
    return files;
  }

  /**
   * 태그가 있는 파일을 가져옵니다.
   * @param tags 태그 목록
   * @returns 파일 목록
   */
  private getTaggedFiles(tags: string[]): TFile[] {
    const files: TFile[] = [];
    const lowerTags = tags.map(tag => tag.toLowerCase());

    this.app.vault.getFiles().forEach(file => {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache?.tags) {
        const fileTags = cache.tags.map(t => t.tag.toLowerCase());
        if (lowerTags.some(tag => fileTags.includes(tag))) {
          files.push(file);
        }
      }
    });

    return files;
  }

  /**
   * 링크된 파일을 가져옵니다.
   * @param file 파일
   * @param level 링크 레벨
   * @returns 파일 목록
   */
  private getLinkedFiles(file: TFile, level: number): TFile[] {
    if (level <= 0) return [];

    const timer = this.performanceMonitor.startTimer('getLinkedFiles');
    try {
      const files = new Set<TFile>();
      const cache = this.app.metadataCache.getFileCache(file);

      // 백링크 처리
      const backlinks = (this.app.metadataCache as any).getBacklinks(file);
      if (backlinks) {
        for (const [path, _] of Object.entries(backlinks)) {
          const linkedFile = this.app.vault.getAbstractFileByPath(path);
          if (linkedFile instanceof TFile) {
            files.add(linkedFile);
            if (level > 1) {
              const nextLevelFiles = this.getLinkedFiles(linkedFile, level - 1);
              nextLevelFiles.forEach(f => files.add(f));
            }
          }
        }
      }

      // 아웃고잉 링크 처리
      if (cache?.links) {
        for (const link of cache.links) {
          const linkedFile = this.app.metadataCache.getFirstLinkpathDest(link.link, file.path);
          if (linkedFile instanceof TFile) {
            files.add(linkedFile);
            if (level > 1) {
              const nextLevelFiles = this.getLinkedFiles(linkedFile, level - 1);
              nextLevelFiles.forEach(f => files.add(f));
            }
          }
        }
      }

      return Array.from(files);
    } finally {
      timer.stop();
    }
  }
} 