import { ILayoutService } from '@/domain/services/ILayoutService';
import { IDomainEventHandler } from './IDomainEventHandler';
import {
  LayoutEvent,
  LayoutCreatedEvent,
  LayoutUpdatedEvent,
  LayoutDeletedEvent,
  LayoutCardPositionUpdatedEvent,
  LayoutCardPositionAddedEvent,
  LayoutCardPositionRemovedEvent,
  LayoutCardPositionsResetEvent,
  LayoutConfigUpdatedEvent,
  LayoutCalculatedEvent,
  LayoutEventType
} from './LayoutEvents';
import { CardPosition } from '@/domain/models/Card';
import { ICardPosition, Layout } from '@/domain/models/Layout';

/**
 * 레이아웃 이벤트 핸들러
 */
export class LayoutEventHandler implements IDomainEventHandler<LayoutEvent> {
  private layoutService: ILayoutService;
  private isCalculating: boolean = false;
  private readonly DEBOUNCE_TIME = 100; // 100ms 디바운스
  private debounceTimer: NodeJS.Timeout | null = null;
  private currentLayout: string | null = null;
  private lastEventTime: number = 0;
  private readonly EVENT_THROTTLE_TIME = 500; // 500ms 스로틀링
  private eventStack: Set<string> = new Set(); // 이벤트 스택 추가
  private lastProcessedEvent: string | null = null; // 마지막 처리된 이벤트 추적

  constructor(layoutService: ILayoutService) {
    this.layoutService = layoutService;
  }

  /**
   * 이벤트의 고유 식별자를 생성합니다.
   */
  private generateEventId(event: LayoutEvent): string {
    return `${event.type}_${event.layoutId}_${Date.now()}`;
  }

  /**
   * 이벤트 처리 시간을 체크합니다.
   */
  private isEventThrottled(): boolean {
    const now = Date.now();
    if (now - this.lastEventTime < this.EVENT_THROTTLE_TIME) {
      return true;
    }
    this.lastEventTime = now;
    return false;
  }

  /**
   * 이벤트 스택에 이벤트를 추가합니다.
   */
  private addToEventStack(eventId: string): boolean {
    if (this.eventStack.has(eventId)) {
      return false;
    }
    this.eventStack.add(eventId);
    return true;
  }

  /**
   * 이벤트 스택에서 이벤트를 제거합니다.
   */
  private removeFromEventStack(eventId: string): void {
    this.eventStack.delete(eventId);
  }

  /**
   * CardPosition을 ICardPosition으로 변환합니다.
   */
  private convertToICardPosition(position: CardPosition): ICardPosition {
    return {
      cardId: position.cardId,
      x: position.x ?? position.left ?? 0,
      y: position.y ?? position.top ?? 0,
      width: position.width,
      height: position.height
    };
  }

  /**
   * 레이아웃을 가져오거나 에러를 발생시킵니다.
   */
  private async getLayoutOrThrow(layoutId: string): Promise<Layout> {
    const layout = await this.layoutService.getLayout(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }
    return layout;
  }

  /**
   * 레이아웃 계산을 수행합니다.
   */
  private async withLayoutCalculation<T>(action: () => Promise<T>): Promise<T> {
    if (this.isCalculating) {
      return action();
    }

    try {
      this.isCalculating = true;
      return await action();
    } finally {
      this.isCalculating = false;
    }
  }

  /**
   * 이벤트를 처리합니다.
   */
  async handle(event: LayoutEvent): Promise<void> {
    const eventId = this.generateEventId(event);
    
    try {
      // 이벤트 스로틀링 체크
      if (this.isEventThrottled()) {
        console.debug(`[CardNavigator] Event throttled: ${event.type}`);
        return;
      }

      // 이벤트 스택 체크
      if (!this.addToEventStack(eventId)) {
        console.debug(`[CardNavigator] Event already in stack: ${event.type}`);
        return;
      }

      // 동일한 이벤트 타입과 레이아웃 ID를 가진 이벤트가 최근에 처리되었다면 무시
      const eventKey = `${event.type}_${event.layoutId}`;
      if (this.lastProcessedEvent === eventKey) {
        console.debug(`[CardNavigator] Event ignored: same event type and layout ID recently processed`);
        return;
      }

      // 현재 레이아웃 ID 업데이트
      this.currentLayout = event.layoutId;

      switch (event.type) {
        case LayoutEventType.LAYOUT_CREATED:
          await this.handleLayoutCreated(event as LayoutCreatedEvent);
          break;
        case LayoutEventType.LAYOUT_UPDATED:
          await this.handleLayoutUpdated(event as LayoutUpdatedEvent);
          break;
        case LayoutEventType.LAYOUT_DELETED:
          await this.handleLayoutDeleted(event as LayoutDeletedEvent);
          break;
        case LayoutEventType.LAYOUT_CARD_POSITION_UPDATED:
          await this.handleLayoutCardPositionUpdated(event as LayoutCardPositionUpdatedEvent);
          break;
        case LayoutEventType.LAYOUT_CARD_POSITION_ADDED:
          await this.handleLayoutCardPositionAdded(event as LayoutCardPositionAddedEvent);
          break;
        case LayoutEventType.LAYOUT_CARD_POSITION_REMOVED:
          await this.handleLayoutCardPositionRemoved(event as LayoutCardPositionRemovedEvent);
          break;
        case LayoutEventType.LAYOUT_CARD_POSITIONS_RESET:
          await this.handleLayoutCardPositionsReset(event as LayoutCardPositionsResetEvent);
          break;
        case LayoutEventType.LAYOUT_CONFIG_UPDATED:
          await this.handleLayoutConfigUpdated(event as LayoutConfigUpdatedEvent);
          break;
        case LayoutEventType.LAYOUT_CALCULATED:
          await this.handleLayoutCalculated(event as LayoutCalculatedEvent);
          break;
        default:
          console.debug(`[CardNavigator] Unhandled layout event type: ${event.type}`);
      }

      // 처리된 이벤트 기록
      this.lastProcessedEvent = eventKey;
    } catch (error) {
      console.error(`[CardNavigator] Error handling layout event:`, error);
      throw error;
    } finally {
      // 이벤트 스택에서 제거
      this.removeFromEventStack(eventId);
    }
  }

  /**
   * 레이아웃 생성 이벤트 처리
   */
  private async handleLayoutCreated(event: LayoutCreatedEvent): Promise<void> {
    await this.withLayoutCalculation(async () => {
      await this.layoutService.updateLayout(event.layout);
      await this.debouncedCalculateLayout();
    });
  }

  /**
   * 레이아웃 업데이트 이벤트 처리
   */
  private async handleLayoutUpdated(event: LayoutUpdatedEvent): Promise<void> {
    // 레이아웃 업데이트 이벤트는 무시 (순환 참조 방지)
    if (this.isCalculating) {
      console.debug(`[CardNavigator] Layout update ignored: calculating in progress`);
      return;
    }

    // 현재 레이아웃과 동일한 경우 무시
    if (this.currentLayout === event.layoutId) {
      console.debug(`[CardNavigator] Layout update ignored: same layout ID`);
      return;
    }

    await this.withLayoutCalculation(async () => {
      await this.layoutService.updateLayout(event.layout);
      await this.debouncedCalculateLayout();
    });
  }

  /**
   * 레이아웃 삭제 이벤트 처리
   */
  private async handleLayoutDeleted(event: LayoutDeletedEvent): Promise<void> {
    await this.layoutService.deleteLayout(event.layoutId);
  }

  /**
   * 레이아웃 카드 위치 업데이트 이벤트 처리
   */
  private async handleLayoutCardPositionUpdated(event: LayoutCardPositionUpdatedEvent): Promise<void> {
    await this.withLayoutCalculation(async () => {
      await this.getLayoutOrThrow(event.layoutId);
      const cardPositions: ICardPosition[] = [this.convertToICardPosition(event.cardPosition)];
      await this.layoutService.updateCardPositions(event.layoutId, cardPositions);
      await this.debouncedCalculateLayout();
    });
  }

  /**
   * 레이아웃 카드 위치 추가 이벤트 처리
   */
  private async handleLayoutCardPositionAdded(event: LayoutCardPositionAddedEvent): Promise<void> {
    await this.withLayoutCalculation(async () => {
      await this.getLayoutOrThrow(event.layoutId);
      const cardPositions: ICardPosition[] = [this.convertToICardPosition(event.cardPosition)];
      await this.layoutService.updateCardPositions(event.layoutId, cardPositions);
      await this.debouncedCalculateLayout();
    });
  }

  /**
   * 레이아웃 카드 위치 제거 이벤트 처리
   */
  private async handleLayoutCardPositionRemoved(event: LayoutCardPositionRemovedEvent): Promise<void> {
    await this.withLayoutCalculation(async () => {
      await this.getLayoutOrThrow(event.layoutId);
      await this.layoutService.removeCardPosition(event.layoutId, event.cardId);
      await this.debouncedCalculateLayout();
    });
  }

  /**
   * 레이아웃 카드 위치 초기화 이벤트 처리
   */
  private async handleLayoutCardPositionsReset(event: LayoutCardPositionsResetEvent): Promise<void> {
    await this.withLayoutCalculation(async () => {
      await this.getLayoutOrThrow(event.layoutId);
      await this.layoutService.resetCardPositions(event.layoutId);
      await this.debouncedCalculateLayout();
    });
  }

  /**
   * 레이아웃 설정 업데이트 이벤트 처리
   */
  private async handleLayoutConfigUpdated(event: LayoutConfigUpdatedEvent): Promise<void> {
    await this.withLayoutCalculation(async () => {
      const layout = await this.getLayoutOrThrow(event.layoutId);
      await this.layoutService.updateLayout(layout);
      await this.debouncedCalculateLayout();
    });
  }

  /**
   * 레이아웃 계산 이벤트 처리
   */
  private async handleLayoutCalculated(event: LayoutCalculatedEvent): Promise<void> {
    // 레이아웃 계산 이벤트는 무시 (순환 참조 방지)
    if (this.isCalculating) {
      console.debug(`[CardNavigator] Layout calculation ignored: calculating in progress`);
      return;
    }

    // 현재 레이아웃과 동일한 경우 무시
    if (this.currentLayout === event.layoutId) {
      console.debug(`[CardNavigator] Layout calculation ignored: same layout ID`);
      return;
    }

    const layout = await this.getLayoutOrThrow(event.layoutId);
    await this.layoutService.updateLayout(layout);
  }

  /**
   * 디바운스된 레이아웃 계산을 수행합니다.
   */
  private debouncedCalculateLayout(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(async () => {
        try {
          if (!this.currentLayout) {
            throw new Error('No current layout ID available');
          }
          const layout = await this.getLayoutOrThrow(this.currentLayout);
          
          // cardSet이 없으면 에러 발생
          if (!layout.cardSet) {
            throw new Error('레이아웃에 연결된 카드셋이 없습니다.');
          }

          // 레이아웃 계산 시 이벤트 발생 방지
          this.isCalculating = true;
          await this.layoutService.calculateLayout(
            layout.cardSet,
            layout.config.viewportWidth,
            layout.config.viewportHeight
          );
          this.isCalculating = false;
          resolve();
        } catch (error) {
          reject(error);
        }
      }, this.DEBOUNCE_TIME);
    });
  }
} 