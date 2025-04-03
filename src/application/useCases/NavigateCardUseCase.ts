import { IUseCase } from './IUseCase';
import { IFocusManager, FocusDirection } from '../../domain/services/IFocusManager';
import { ICard } from '../../domain/models/Card';
import { TFile } from 'obsidian';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/interfaces/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/interfaces/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';

/**
 * 카드 내비게이션 유스케이스 입력
 */
export interface NavigateCardInput {
  /** 이동 방향 */
  direction: 'up' | 'down' | 'left' | 'right';
  /** 현재 포커스된 카드 */
  currentCard?: ICard;
  /** 활성 파일 */
  activeFile?: TFile;
}

/**
 * 카드 내비게이션 유스케이스
 */
export class NavigateCardUseCase implements IUseCase<NavigateCardInput, ICard | null> {
  private static instance: NavigateCardUseCase;

  private constructor(
    private readonly focusManager: IFocusManager,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {}

  static getInstance(): NavigateCardUseCase {
    if (!NavigateCardUseCase.instance) {
      const container = Container.getInstance();
      NavigateCardUseCase.instance = new NavigateCardUseCase(
        container.resolve('IFocusManager'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService')
      );
    }
    return NavigateCardUseCase.instance;
  }

  /**
   * 카드 내비게이션
   * @param input 입력
   */
  async execute(input: NavigateCardInput): Promise<ICard | null> {
    const perfMark = 'NavigateCardUseCase.execute';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 내비게이션 시작', { input });

      // 1. 방향에 따른 카드 포커스 이동
      const direction = input.direction.toUpperCase() as keyof typeof FocusDirection;
      this.focusManager.moveFocus(FocusDirection[direction]);

      // 2. 활성 파일이 변경된 경우 해당 카드로 포커스
      if (input.activeFile && !input.currentCard) {
        this.focusManager.focusByFile(input.activeFile);
      }

      // 3. 현재 포커스된 카드 반환
      const focusedCard = this.focusManager.getFocusedCard();

      this.analyticsService.trackEvent('card_navigated', {
        direction: input.direction,
        activeFile: input.activeFile?.path
      });

      this.loggingService.info('카드 내비게이션 완료', { input, focusedCard });
      return focusedCard;
    } catch (error) {
      this.loggingService.error('카드 내비게이션 실패', { error, input });
      this.errorHandler.handleError(error as Error, 'NavigateCardUseCase.execute');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
} 