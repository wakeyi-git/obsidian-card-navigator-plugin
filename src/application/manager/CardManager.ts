import { ICardManager, ICardState } from '@/domain/managers/ICardManager';
import { ICard } from '@/domain/models/Card';
import { TFile } from 'obsidian';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { CardRegisteredEvent, CardUnregisteredEvent } from '@/domain/events/CardEvents';
import { App } from 'obsidian';

/**
 * 카드 관리자 구현체
 */
export class CardManager implements ICardManager {
  private static instance: CardManager;
  private cards: Map<string, ICard> = new Map();
  private activeCardId: string | null = null;
  private focusedCardId: string | null = null;
  private selectedCardIds: Set<string> = new Set();
  private stateSubscribers: Set<(state: ICardState) => void> = new Set();
  private initialized: boolean = false;

  private constructor(
    private readonly app: App,
    private readonly errorHandler: IErrorHandler,
    private readonly logger: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): CardManager {
    if (!CardManager.instance) {
      const container = Container.getInstance();
      CardManager.instance = new CardManager(
        container.resolve<App>('App'),
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService'),
        container.resolve<IEventDispatcher>('IEventDispatcher')
      );
    }
    return CardManager.instance;
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.logger.debug('카드 관리자 초기화 완료');
  }

  cleanup(): void {
    const timer = this.performanceMonitor.startTimer('CardManager.cleanup');
    try {
      this.cards.clear();
      this.activeCardId = null;
      this.focusedCardId = null;
      this.selectedCardIds.clear();
      this.stateSubscribers.clear();
      this.initialized = false;

      this.logger.debug('카드 관리자 정리 완료');
    } catch (error) {
      this.logger.error('카드 관리자 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardManager.cleanup');
    } finally {
      timer.stop();
    }
  }

  subscribe(callback: (state: ICardState) => void): void {
    this.stateSubscribers.add(callback);
  }

  unsubscribe(callback: (state: ICardState) => void): void {
    this.stateSubscribers.delete(callback);
  }

  private notifyStateChange(): void {
    const state = this.getState();
    this.stateSubscribers.forEach(callback => callback(state));
  }

  registerCard(card: ICard): void {
    const timer = this.performanceMonitor.startTimer('CardManager.registerCard');
    try {
      this.logger.debug('카드 등록 시작', { cardId: card.id });
      
      this.cards.set(card.id, card);
      
      // 이벤트 발송
      this.eventDispatcher.dispatch(new CardRegisteredEvent(card));
      
      this.logger.info('카드 등록 완료', { cardId: card.id });
    } catch (error) {
      this.logger.error('카드 등록 실패', { error, cardId: card.id });
      this.errorHandler.handleError(error as Error, 'CardManager.registerCard');
    } finally {
      timer.stop();
    }
  }

  unregisterCard(cardId: string): void {
    const timer = this.performanceMonitor.startTimer('CardManager.unregisterCard');
    try {
      this.logger.debug('카드 등록 해제 시작', { cardId });
      
      const card = this.cards.get(cardId);
      if (card) {
        this.cards.delete(cardId);
        
        // 이벤트 발송
        this.eventDispatcher.dispatch(new CardUnregisteredEvent(card));
      }
      
      this.logger.info('카드 등록 해제 완료', { cardId });
    } catch (error) {
      this.logger.error('카드 등록 해제 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardManager.unregisterCard');
    } finally {
      timer.stop();
    }
  }

  getCardByFile(file: TFile): ICard | undefined {
    const timer = this.performanceMonitor.startTimer('CardManager.getCardByFile');
    try {
      this.logger.debug('카드 객체 조회 시작', { filePath: file.path });
      
      const card = this.cards.get(file.path);
      
      this.logger.info('카드 객체 조회 완료', { filePath: file.path });
      return card;
    } catch (error) {
      this.logger.error('카드 객체 조회 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'CardManager.getCardByFile');
      return undefined;
    } finally {
      timer.stop();
    }
  }

  getCardById(cardId: string): ICard | undefined {
    const timer = this.performanceMonitor.startTimer('CardManager.getCardById');
    try {
      this.logger.debug('카드 객체 조회 시작', { cardId });
      
      const card = this.cards.get(cardId);
      
      this.logger.info('카드 객체 조회 완료', { cardId });
      return card;
    } catch (error) {
      this.logger.error('카드 객체 조회 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardManager.getCardById');
      return undefined;
    } finally {
      timer.stop();
    }
  }

  getAllCards(): ICard[] {
    const timer = this.performanceMonitor.startTimer('CardManager.getAllCards');
    try {
      this.logger.debug('모든 카드 객체 조회 시작');
      
      const cards = Array.from(this.cards.values());
      
      this.logger.info('모든 카드 객체 조회 완료');
      return cards;
    } catch (error) {
      this.logger.error('모든 카드 객체 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardManager.getAllCards');
      return [];
    } finally {
      timer.stop();
    }
  }

  setActiveCard(cardId: string | null): void {
    this.activeCardId = cardId;
    this.notifyStateChange();
  }

  setFocusedCard(cardId: string | null): void {
    this.focusedCardId = cardId;
    this.notifyStateChange();
  }

  selectCard(cardId: string, selected: boolean): void {
    if (selected) {
      this.selectedCardIds.add(cardId);
    } else {
      this.selectedCardIds.delete(cardId);
    }
    this.notifyStateChange();
  }

  clearSelection(): void {
    this.selectedCardIds.clear();
    this.notifyStateChange();
  }

  refreshCache(): void {
    const timer = this.performanceMonitor.startTimer('CardManager.refreshCache');
    try {
      this.logger.debug('카드 캐시 갱신 시작');
      
      // 등록된 모든 카드의 상태를 갱신
      this.cards.forEach(card => {
        const file = card.file;
        if (file) {
          // 파일 내용 갱신
          this.app.vault.read(file).then((content: string) => {
            // 새로운 카드 객체 생성
            const updatedCard: ICard = {
              ...card,
              filePath: file.path,
              title: file.basename,
              fileName: file.name,
              firstHeader: (() => {
                const firstHeaderMatch = content.match(/^#\s+(.+)$/m);
                return firstHeaderMatch ? firstHeaderMatch[1] : card.firstHeader;
              })(),
              content: content,
              tags: (() => {
                const tagMatches = content.match(/#[^\s#]+/g);
                return tagMatches ? [...new Set(tagMatches)] : card.tags;
              })(),
              properties: card.properties,
              createdAt: new Date(file.stat.ctime),
              updatedAt: new Date(file.stat.mtime)
            };
            
            // 카드 업데이트
            this.cards.set(card.id, updatedCard);
          }).catch((error: Error) => {
            this.logger.error('파일 내용 읽기 실패', { error, filePath: file.path });
          });
        }
      });
      
      this.logger.info('카드 캐시 갱신 완료');
    } catch (error) {
      this.logger.error('카드 캐시 갱신 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardManager.refreshCache');
    } finally {
      timer.stop();
    }
  }

  getState(): ICardState {
    return {
      cards: this.cards,
      activeCardId: this.activeCardId,
      focusedCardId: this.focusedCardId,
      selectedCardIds: this.selectedCardIds,
      lastUpdated: Date.now()
    };
  }

  /**
   * 카드 간 링크를 생성합니다.
   * @param sourceCard 소스 카드
   * @param targetCard 타겟 카드
   */
  createLinkBetweenCards(sourceCard: ICard, targetCard: ICard): void {
    const timer = this.performanceMonitor.startTimer('createLinkBetweenCards');
    try {
      this.logger.debug('카드 간 링크 생성 시작', { sourceCardId: sourceCard.id, targetCardId: targetCard.id });
      
      if (!sourceCard.file || !targetCard.file) {
        throw new Error('소스 또는 타겟 카드의 파일이 없습니다.');
      }
      
      // 소스 카드 파일 읽기
      this.app.vault.read(sourceCard.file).then((content: string) => {
        // 링크 형식 생성
        const linkText = `[[${targetCard.file!.basename}]]`;
        
        // 파일 내용에 링크 추가
        const newContent = content + '\n' + linkText;
        
        // 파일 내용 업데이트
        this.app.vault.modify(sourceCard.file!, newContent).then(() => {
          this.logger.info('카드 간 링크 생성 완료', { sourceCardId: sourceCard.id, targetCardId: targetCard.id });
          this.analyticsService.trackEvent('card:link:created', {
            sourceCardId: sourceCard.id,
            targetCardId: targetCard.id
          });
        }).catch((error: Error) => {
          this.logger.error('파일 내용 업데이트 실패', { error, filePath: sourceCard.file!.path });
        });
      }).catch((error: Error) => {
        this.logger.error('파일 내용 읽기 실패', { error, filePath: sourceCard.file!.path });
      });
    } catch (error) {
      this.logger.error('카드 간 링크 생성 실패', { error, sourceCardId: sourceCard.id, targetCardId: targetCard.id });
      this.errorHandler.handleError(error as Error, 'CardManager.createLinkBetweenCards');
    } finally {
      timer.stop();
    }
  }
} 