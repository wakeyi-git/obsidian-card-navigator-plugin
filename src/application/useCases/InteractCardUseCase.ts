import { IUseCase } from './IUseCase';
import { ICard } from '../../domain/models/Card';
import { IClipboardService } from '../../domain/services/IClipboardService';
import { IFileService } from '../../domain/services/IFileService';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';

/**
 * 카드 상호작용 유즈케이스의 입력 데이터
 */
export interface InteractCardInput {
  /**
   * 상호작용할 카드
   */
  card: ICard;

  /**
   * 상호작용 타입
   */
  type: 'click' | 'contextMenu' | 'dragDrop' | 'doubleClick';

  /**
   * 상호작용 옵션
   */
  options?: {
    /**
     * 컨텍스트 메뉴 액션
     */
    contextMenuAction?: 'copyLink' | 'copyContent';

    /**
     * 드래그 앤 드롭 대상
     */
    dragDropTarget?: {
      /**
       * 대상 타입
       */
      type: 'editor' | 'card';

      /**
       * 대상 카드
       */
      card?: ICard;
    };
  };
}

/**
 * 카드 상호작용 유즈케이스
 */
export class InteractCardUseCase implements IUseCase<InteractCardInput, void> {
  private static instance: InteractCardUseCase;

  private constructor(
    private readonly clipboardService: IClipboardService,
    private readonly fileService: IFileService,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  public static getInstance(): InteractCardUseCase {
    if (!InteractCardUseCase.instance) {
      const container = Container.getInstance();
      InteractCardUseCase.instance = new InteractCardUseCase(
        container.resolve<IClipboardService>('IClipboardService'),
        container.resolve<IFileService>('IFileService'),
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService'),
        container.resolve<IEventDispatcher>('IEventDispatcher')
      );
    }
    return InteractCardUseCase.instance;
  }

  async execute(input: InteractCardInput): Promise<void> {
    const startTime = performance.now();
    const timer = this.performanceMonitor.startTimer('interactCard');
    this.loggingService.info('카드 상호작용 시작', { type: input.type });

    try {
      switch (input.type) {
        case 'click':
          // 1. 카드 클릭 - 파일 열기
          await this.fileService.openFile(input.card.file);
          const clickEvent = new DomainEvent(
            DomainEventType.CARD_CLICKED,
            { card: input.card }
          );
          this.eventDispatcher.dispatch(clickEvent);
          break;

        case 'contextMenu':
          // 2. 컨텍스트 메뉴
          if (input.options?.contextMenuAction) {
            await this.handleContextMenuAction(
              input.card,
              input.options.contextMenuAction
            );
            const contextMenuEvent = new DomainEvent(
              DomainEventType.CARD_CONTEXT_MENU,
              { card: input.card }
            );
            this.eventDispatcher.dispatch(contextMenuEvent);
          }
          break;

        case 'dragDrop':
          // 3. 드래그 앤 드롭
          if (input.options?.dragDropTarget) {
            await this.handleDragDrop(
              input.card,
              input.options.dragDropTarget
            );
            const dragStartEvent = new DomainEvent(
              DomainEventType.CARD_DRAG_START,
              { card: input.card }
            );
            this.eventDispatcher.dispatch(dragStartEvent);
            
            if (input.options.dragDropTarget.card) {
              const dropEvent = new DomainEvent(
                DomainEventType.CARD_DROP,
                { card: input.options.dragDropTarget.card }
              );
              this.eventDispatcher.dispatch(dropEvent);
            }
          }
          break;

        case 'doubleClick':
          // 4. 더블 클릭 - 인라인 편집
          await this.fileService.openFileForEditing(input.card.file);
          const doubleClickEvent = new DomainEvent(
            DomainEventType.CARD_DOUBLE_CLICKED,
            { card: input.card }
          );
          this.eventDispatcher.dispatch(doubleClickEvent);
          break;
      }

      const duration = performance.now() - startTime;
      this.analyticsService.trackEvent('card_interacted', {
        type: input.type,
        duration
      });

      this.loggingService.info('카드 상호작용 완료', { type: input.type });
    } catch (error) {
      this.errorHandler.handleError(error, '카드 상호작용 중 오류 발생');
      throw error;
    } finally {
      timer.stop();
    }
  }

  private async handleContextMenuAction(
    card: ICard,
    action: 'copyLink' | 'copyContent'
  ): Promise<void> {
    switch (action) {
      case 'copyLink':
        await this.clipboardService.copyLink(card.file);
        break;
      case 'copyContent':
        await this.clipboardService.copyContent(card.file);
        break;
    }
  }

  private async handleDragDrop(
    card: ICard,
    target: { type: 'editor' | 'card'; card?: ICard }
  ): Promise<void> {
    if (target.type === 'editor') {
      await this.fileService.insertLinkToEditor(card.file);
    } else if (target.type === 'card' && target.card) {
      await this.fileService.insertLinkToFile(card.file, target.card.file);
    }
  }
} 