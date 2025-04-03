import { ICardSelectionService } from '../../domain/services/ICardSelectionService';
import { ICard } from '../../domain/models/Card';
import { TFile } from 'obsidian';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/interfaces/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/interfaces/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/interfaces/events/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';

/**
 * 카드 선택 서비스 구현체
 */
export class CardSelectionService implements ICardSelectionService {
  private static instance: CardSelectionService;
  private selectedCards: Set<ICard> = new Set();
  private selectedFiles: Set<TFile> = new Set();
  private lastSelectedCard: ICard | null = null;

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): CardSelectionService {
    if (!CardSelectionService.instance) {
      const container = Container.getInstance();
      CardSelectionService.instance = new CardSelectionService(
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return CardSelectionService.instance;
  }

  /**
   * 서비스 초기화
   */
  initialize(): void {
    this.selectedCards.clear();
    this.selectedFiles.clear();
    this.lastSelectedCard = null;
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    this.selectedCards.clear();
    this.selectedFiles.clear();
    this.lastSelectedCard = null;
  }

  /**
   * 카드 선택
   * @param file 파일
   */
  selectCard(file: TFile): void {
    // 파일에 해당하는 카드 찾기
    const card = this.findCardByFile(file);
    if (card) {
      this.selectedCards.clear();
      this.selectedFiles.clear();
      this.selectedCards.add(card);
      this.selectedFiles.add(file);
      this.lastSelectedCard = card;
    }
  }

  /**
   * 카드 범위 선택
   * @param file 파일
   */
  selectRange(file: TFile): void {
    if (!this.lastSelectedCard) {
      this.selectCard(file);
      return;
    }

    // 범위 선택 로직 구현
    const currentCard = this.findCardByFile(file);
    if (currentCard) {
      // 카드 목록에서 범위 선택
      const cards = Array.from(this.selectedCards);
      const startIndex = cards.indexOf(this.lastSelectedCard);
      const endIndex = cards.indexOf(currentCard);
      
      if (startIndex !== -1 && endIndex !== -1) {
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);
        
        for (let i = start; i <= end; i++) {
          const card = cards[i];
          this.selectedCards.add(card);
          this.selectedFiles.add(card.file);
        }
      }
    }
  }

  /**
   * 카드 선택 토글
   * @param file 파일
   */
  toggleCardSelection(file: TFile): void {
    const card = this.findCardByFile(file);
    if (card) {
      if (this.selectedCards.has(card)) {
        this.selectedCards.delete(card);
        this.selectedFiles.delete(file);
      } else {
        this.selectedCards.add(card);
        this.selectedFiles.add(file);
      }
      this.lastSelectedCard = card;
    }
  }

  /**
   * 모든 카드 선택
   */
  selectAllCards(): void {
    // 모든 카드 선택 로직 구현
    // 카드 목록에서 모든 카드 선택
  }

  /**
   * 선택 해제
   */
  clearSelection(): void {
    this.selectedCards.clear();
    this.selectedFiles.clear();
    this.lastSelectedCard = null;
  }

  /**
   * 선택된 카드 목록 조회
   */
  getSelectedCards(): ICard[] {
    return Array.from(this.selectedCards);
  }

  /**
   * 선택된 파일 목록 조회
   */
  getSelectedFiles(): TFile[] {
    return Array.from(this.selectedFiles);
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
    // UI 업데이트 로직
  }

  /**
   * 파일로 카드 찾기
   * @param file 파일
   * @returns 카드 또는 null
   */
  private findCardByFile(file: TFile): ICard | null {
    // 파일에 해당하는 카드 찾기 로직 구현
    return null;
  }
} 