import { IFocusManager, FocusDirection } from '@/domain/managers/IFocusManager';
import { ICard } from '@/domain/models/Card';
import { ICardService } from '@/domain/services/ICardService';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { IScrollService } from '@/domain/services/IScrollService';
import { LayoutDirection } from '@/domain/utils/layoutUtils';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { FocusChangedEvent } from '@/domain/events/FocusEvents';
import { Container } from '@/infrastructure/di/Container';
import { TFile } from 'obsidian';

/**
 * 포커스 관리자 클래스
 */
export class FocusManager implements IFocusManager {
  private static instance: FocusManager | null = null;
  private container: Container;
  private focusedCard: ICard | null = null;
  private initialized: boolean = false;
  private cardService: ICardService;
  private layoutService: ILayoutService | null = null;
  private scrollService: IScrollService;

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {
    this.container = Container.getInstance();
    this.cardService = this.container.resolve<ICardService>('ICardService');
    this.scrollService = this.container.resolve<IScrollService>('IScrollService');
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(): FocusManager {
    if (!FocusManager.instance) {
      const container = Container.getInstance();
      FocusManager.instance = new FocusManager(
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return FocusManager.instance;
  }

  /**
   * 초기화
   */
  async initialize(): Promise<void> {
    const timer = this.performanceMonitor.startTimer('FocusManager.initialize');
    try {
      if (this.initialized) {
        this.loggingService.warn('이미 초기화됨');
        return;
      }

      this.loggingService.debug('포커스 관리자 초기화 시작');

      // 서비스 초기화
      this.cardService = Container.getInstance().resolve<ICardService>('ICardService');
      this.layoutService = Container.getInstance().resolve<ILayoutService>('ILayoutService');
      this.scrollService = Container.getInstance().resolve<IScrollService>('IScrollService');

      if (!this.cardService || !this.layoutService || !this.scrollService) {
        throw new Error('서비스 초기화 실패');
      }

      await this.cardService.initialize();
      await this.layoutService.initialize();
      await this.scrollService.initialize();

      this.initialized = true;

      this.analyticsService.trackEvent('focus_manager_initialized');

      this.loggingService.info('포커스 관리자 초기화 완료');
    } catch (error) {
      this.loggingService.error('포커스 관리자 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'FocusManager.initialize');
    } finally {
      timer.stop();
    }
  }

  /**
   * 정리
   */
  async cleanup(): Promise<void> {
    const timer = this.performanceMonitor.startTimer('FocusManager.cleanup');
    try {
      if (!this.initialized) {
        this.loggingService.warn('초기화되지 않음');
        return;
      }

      this.loggingService.debug('포커스 관리자 정리 시작');

      // 서비스 정리
      if (this.cardService) {
        await this.cardService.cleanup();
      }
      if (this.layoutService) {
        await this.layoutService.cleanup();
      }
      if (this.scrollService) {
        await this.scrollService.cleanup();
      }

      this.initialized = false;
      this.focusedCard = null;
      this.cardService = undefined as unknown as ICardService;
      this.layoutService = undefined as unknown as ILayoutService;
      this.scrollService = undefined as unknown as IScrollService;

      this.analyticsService.trackEvent('focus_manager_cleaned_up');

      this.loggingService.info('포커스 관리자 정리 완료');
    } catch (error) {
      this.loggingService.error('포커스 관리자 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'FocusManager.cleanup');
    } finally {
      timer.stop();
    }
  }

  /**
   * 초기화 여부 확인
   * @returns 초기화 여부
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 파일로 포커스 설정
   * @param file 파일
   */
  async focusByFile(file: TFile): Promise<void> {
    const timer = this.performanceMonitor.startTimer('FocusManager.focusByFile');
    try {
      if (!this.initialized || !this.cardService) {
        throw new Error('포커스 관리자가 초기화되지 않았습니다.');
      }

      this.loggingService.debug('파일로 포커스 설정 시작', { filePath: file.path });

      const card = await this.cardService.getCardByFile(file);
      if (!card) {
        this.loggingService.warn('파일에 해당하는 카드를 찾을 수 없음', { filePath: file.path });
        return;
      }

      await this.focusCard(card);

      this.analyticsService.trackEvent('focus_by_file', {
        filePath: file.path,
        cardId: card.id
      });

      this.loggingService.info('파일로 포커스 설정 완료', { filePath: file.path });
    } catch (error) {
      this.loggingService.error('파일로 포커스 설정 실패', { error });
      this.errorHandler.handleError(error as Error, 'FocusManager.focusByFile');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드로 포커스 설정
   * @param card 카드
   */
  async focusCard(card: ICard): Promise<void> {
    const timer = this.performanceMonitor.startTimer('FocusManager.focusCard');
    try {
      if (!this.initialized || !this.layoutService || !this.scrollService) {
        throw new Error('포커스 관리자가 초기화되지 않았습니다.');
      }

      this.loggingService.debug('카드로 포커스 설정 시작', { cardId: card.id });

      // 이전 포커스된 카드 스타일 업데이트
      if (this.focusedCard) {
        this.layoutService.updateCardStyle(this.focusedCard, 'normal');
      }

      // 새 카드 포커스 설정
      this.focusedCard = card;
      this.layoutService.updateCardStyle(card, 'focused');

      // 카드 위치 조회
      const position = this.layoutService.getCardPosition(card);
      if (!position) {
        this.loggingService.warn('카드 위치를 찾을 수 없음', { cardId: card.id });
        return;
      }

      // ScrollService를 통해 카드 중앙 정렬
      this.scrollService.centerCard(card);

      // 이벤트 발송
      this.eventDispatcher.dispatch(new FocusChangedEvent(card));

      this.analyticsService.trackEvent('focus_card', {
        cardId: card.id,
        position
      });

      this.loggingService.info('카드로 포커스 설정 완료', { cardId: card.id });
    } catch (error) {
      this.loggingService.error('카드로 포커스 설정 실패', { error });
      this.errorHandler.handleError(error as Error, 'FocusManager.focusCard');
    } finally {
      timer.stop();
    }
  }

  /**
   * 방향으로 포커스 이동
   * @param direction 방향
   */
  async moveFocus(direction: FocusDirection): Promise<void> {
    const timer = this.performanceMonitor.startTimer('FocusManager.moveFocus');
    try {
      if (!this.initialized || !this.focusedCard || !this.layoutService) {
        throw new Error('포커스 관리자가 초기화되지 않았습니다.');
      }

      this.loggingService.debug('포커스 이동 시작', { direction });

      const layoutDirection = this.convertFocusDirectionToLayoutDirection(direction);
      const nextCard = this.layoutService.getNextCard(this.focusedCard, layoutDirection);
      if (nextCard) {
        await this.focusCard(nextCard);
      }

      this.analyticsService.trackEvent('move_focus', {
        direction,
        hasNextCard: !!nextCard
      });

      this.loggingService.info('포커스 이동 완료', { direction });
    } catch (error) {
      this.loggingService.error('포커스 이동 실패', { error });
      this.errorHandler.handleError(error as Error, 'FocusManager.moveFocus');
    } finally {
      timer.stop();
    }
  }

  /**
   * 포커스된 카드 반환
   * @returns 포커스된 카드
   */
  getFocusedCard(): ICard | null {
    return this.focusedCard;
  }

  /**
   * 포커스 방향을 레이아웃 방향으로 변환
   * @param direction 포커스 방향
   * @returns 레이아웃 방향
   */
  private convertFocusDirectionToLayoutDirection(direction: FocusDirection): LayoutDirection {
    switch (direction) {
      case FocusDirection.UP:
      case FocusDirection.DOWN:
        return LayoutDirection.VERTICAL;
      case FocusDirection.LEFT:
      case FocusDirection.RIGHT:
        return LayoutDirection.HORIZONTAL;
      default:
        throw new Error(`지원하지 않는 방향: ${direction}`);
    }
  }
} 