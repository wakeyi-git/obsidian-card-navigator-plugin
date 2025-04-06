import { ICard } from '../../domain/models/Card';
import { ICardSelectionService } from '@/domain/services/ICardSelectionService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { TFile } from 'obsidian';
import { App } from 'obsidian';
import { CardSelectedEvent, CardDeselectedEvent, SelectionClearedEvent } from '@/domain/events/CardEvents';
import { ICardManager } from '@/domain/services/ICardManager';

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
      
      // TODO: 범위 선택 로직 구현
      
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
      
      // TODO: 모든 카드 선택 로직 구현
      
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
      
      // TODO: 선택 UI 업데이트 로직 구현
      
      this.logger.info('선택 UI 업데이트 완료');
    } catch (error) {
      this.logger.error('선택 UI 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardSelectionService.updateSelectionUI');
    } finally {
      timer.stop();
    }
  }
} 