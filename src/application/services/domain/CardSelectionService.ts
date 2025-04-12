import { ICard } from '@/domain/models/Card';
import { ICardSelectionService } from '@/domain/services/domain/ICardSelectionService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { App, TFile } from 'obsidian';
import { CardSelectedEvent, CardDeselectedEvent, SelectionClearedEvent } from '@/domain/events/CardEvents';
import { ICardManager } from '@/domain/managers/ICardManager';

/**
 * 카드 선택 서비스 구현체
 */
export class CardSelectionService implements ICardSelectionService {
  private static instance: CardSelectionService;
  private selectedCards: Set<string> = new Set();
  private selectedFiles: Set<TFile> = new Set();
  private lastSelectedCard: string | null = null;
  private initialized: boolean = false;

  private constructor(
    private readonly app: App,
    private readonly errorHandler: IErrorHandler,
    private readonly logger: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly cardManager: ICardManager
  ) {}

  static getInstance(): CardSelectionService {
    if (!CardSelectionService.instance) {
      const container = Container.getInstance();
      CardSelectionService.instance = new CardSelectionService(
        container.resolve<App>('App'),
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService'),
        container.resolve<IEventDispatcher>('IEventDispatcher'),
        container.resolve<ICardManager>('ICardManager')
      );
    }
    return CardSelectionService.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    if (this.initialized) {
      this.logger.warn('카드 선택 서비스가 이미 초기화되어 있습니다.');
      return;
    }

    this.logger.debug('카드 선택 서비스 초기화 시작');
    this.selectedCards.clear();
    this.selectedFiles.clear();
    this.lastSelectedCard = null;
    this.initialized = true;
    this.logger.info('카드 선택 서비스 초기화 완료');
  }

  /**
   * 정리
   */
  cleanup(): void {
    this.logger.debug('카드 선택 서비스 정리 시작');
    this.selectedCards.clear();
    this.selectedFiles.clear();
    this.lastSelectedCard = null;
    this.initialized = false;
    this.logger.info('카드 선택 서비스 정리 완료');
  }

  /**
   * 카드 선택
   */
  selectCard(file: TFile): void {
    const timer = this.performanceMonitor.startTimer('CardSelectionService.selectCard');
    try {
      this.logger.debug('카드 선택 시작', { filePath: file.path });
      
      // 기존 선택 해제
      this.clearSelection();
      
      // 새 카드 선택
      this.selectedCards.add(file.path);
      this.selectedFiles.add(file);
      this.lastSelectedCard = file.path;
      
      // 카드 객체 가져오기
      const card = this.cardManager.getCardByFile(file);
      if (card) {
        // 이벤트 발송
        this.eventDispatcher.dispatch(new CardSelectedEvent(card));
      }
      
      this.logger.info('카드 선택 완료', { filePath: file.path });
    } catch (error) {
      this.logger.error('카드 선택 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'CardSelectionService.selectCard');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 범위 선택
   */
  selectRange(file: TFile): void {
    const timer = this.performanceMonitor.startTimer('CardSelectionService.selectRange');
    try {
      this.logger.debug('카드 범위 선택 시작', { filePath: file.path });
      
      if (!this.lastSelectedCard) {
        this.selectCard(file);
        return;
      }
      
      // 모든 카드 목록 가져오기
      const allCards = this.cardManager.getAllCards();
      const cardIds = allCards.map(card => card.id);
      
      // 마지막으로 선택된 카드와 현재 선택한 카드의 인덱스 찾기
      const lastIndex = cardIds.indexOf(this.lastSelectedCard);
      const currentIndex = cardIds.indexOf(file.path);
      
      if (lastIndex === -1 || currentIndex === -1) {
        this.logger.warn('카드 인덱스를 찾을 수 없습니다.', { lastIndex, currentIndex });
        return;
      }
      
      // 범위 내의 모든 카드 선택
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      
      for (let i = start; i <= end; i++) {
        const cardId = cardIds[i];
        const card = allCards.find(c => c.id === cardId);
        if (card && card.file) {
          this.selectedCards.add(cardId);
          this.selectedFiles.add(card.file);
          this.eventDispatcher.dispatch(new CardSelectedEvent(card));
        }
      }
      
      this.lastSelectedCard = file.path;
      
      this.logger.info('카드 범위 선택 완료', { filePath: file.path });
    } catch (error) {
      this.logger.error('카드 범위 선택 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'CardSelectionService.selectRange');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 선택 토글
   */
  toggleCardSelection(file: TFile): void {
    const timer = this.performanceMonitor.startTimer('CardSelectionService.toggleCardSelection');
    try {
      this.logger.debug('카드 선택 토글 시작', { filePath: file.path });
      
      // 카드 객체 가져오기
      const card = this.cardManager.getCardByFile(file);
      if (!card) {
        this.logger.warn('카드 객체를 찾을 수 없습니다.', { filePath: file.path });
        return;
      }

      if (this.selectedCards.has(file.path)) {
        this.selectedCards.delete(file.path);
        this.selectedFiles.delete(file);
        this.eventDispatcher.dispatch(new CardDeselectedEvent(card));
      } else {
        this.selectedCards.add(file.path);
        this.selectedFiles.add(file);
        this.lastSelectedCard = file.path;
        this.eventDispatcher.dispatch(new CardSelectedEvent(card));
      }
      
      this.logger.info('카드 선택 토글 완료', { filePath: file.path });
    } catch (error) {
      this.logger.error('카드 선택 토글 실패', { error, filePath: file.path });
      this.errorHandler.handleError(error as Error, 'CardSelectionService.toggleCardSelection');
    } finally {
      timer.stop();
    }
  }

  /**
   * 모든 카드 선택
   */
  selectAllCards(): void {
    const timer = this.performanceMonitor.startTimer('CardSelectionService.selectAllCards');
    try {
      this.logger.debug('모든 카드 선택 시작');
      
      // 모든 카드 목록 가져오기
      const allCards = this.cardManager.getAllCards();
      
      // 기존 선택 해제
      this.clearSelection();
      
      // 모든 카드 선택
      for (const card of allCards) {
        if (card.file) {
          this.selectedCards.add(card.id);
          this.selectedFiles.add(card.file);
          this.eventDispatcher.dispatch(new CardSelectedEvent(card));
        }
      }
      
      this.lastSelectedCard = allCards[0]?.id || null;
      
      this.logger.info('모든 카드 선택 완료');
    } catch (error) {
      this.logger.error('모든 카드 선택 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSelectionService.selectAllCards');
    } finally {
      timer.stop();
    }
  }

  /**
   * 선택 해제
   */
  clearSelection(): void {
    const timer = this.performanceMonitor.startTimer('CardSelectionService.clearSelection');
    try {
      this.logger.debug('선택 해제 시작');
      
      const selectedCards = this.getSelectedCards();
      this.selectedCards.clear();
      this.selectedFiles.clear();
      this.lastSelectedCard = null;
      
      // 이벤트 발송
      this.eventDispatcher.dispatch(new SelectionClearedEvent(selectedCards));
      
      this.logger.info('선택 해제 완료');
    } catch (error) {
      this.logger.error('선택 해제 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSelectionService.clearSelection');
    } finally {
      timer.stop();
    }
  }

  /**
   * 선택된 카드 목록 조회
   */
  getSelectedCards(): ICard[] {
    const timer = this.performanceMonitor.startTimer('CardSelectionService.getSelectedCards');
    try {
      this.logger.debug('선택된 카드 목록 조회 시작');
      
      const selectedCards: ICard[] = [];
      for (const file of this.selectedFiles) {
        const card = this.cardManager.getCardByFile(file);
        if (card) {
          selectedCards.push(card);
        }
      }
      
      this.logger.info('선택된 카드 목록 조회 완료');
      return selectedCards;
    } catch (error) {
      this.logger.error('선택된 카드 목록 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSelectionService.getSelectedCards');
      return [];
    } finally {
      timer.stop();
    }
  }

  /**
   * 선택된 파일 목록 조회
   */
  getSelectedFiles(): TFile[] {
    const timer = this.performanceMonitor.startTimer('CardSelectionService.getSelectedFiles');
    try {
      this.logger.debug('선택된 파일 목록 조회 시작');
      
      const selectedFiles: TFile[] = [];
      for (const filePath of this.selectedCards) {
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (file instanceof TFile) {
          selectedFiles.push(file);
        }
      }
      
      this.logger.info('선택된 파일 목록 조회 완료');
      return selectedFiles;
    } catch (error) {
      this.logger.error('선택된 파일 목록 조회 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSelectionService.getSelectedFiles');
      return [];
    } finally {
      timer.stop();
    }
  }

  /**
   * 선택된 카드 수 조회
   */
  getSelectedCount(): number {
    return this.selectedCards.size;
  }

  /**
   * 선택 UI 업데이트
   */
  updateSelectionUI(): void {
    const timer = this.performanceMonitor.startTimer('CardSelectionService.updateSelectionUI');
    try {
      this.logger.debug('선택 UI 업데이트 시작');
      
      // 모든 카드 요소 가져오기
      const cardElements = document.querySelectorAll('.card-navigator-card');
      
      // 각 카드 요소의 선택 상태 업데이트
      cardElements.forEach((element) => {
        const cardId = element.getAttribute('data-card-id');
        if (cardId) {
          if (this.selectedCards.has(cardId)) {
            element.classList.add('selected');
          } else {
            element.classList.remove('selected');
          }
        }
      });
      
      // 선택된 카드 수 표시 업데이트
      const selectionCountElement = document.querySelector('.card-navigator-selection-count');
      if (selectionCountElement) {
        selectionCountElement.textContent = `${this.getSelectedCount()}개 선택됨`;
      }
      
      this.logger.info('선택 UI 업데이트 완료');
    } catch (error) {
      this.logger.error('선택 UI 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSelectionService.updateSelectionUI');
    } finally {
      timer.stop();
    }
  }
} 