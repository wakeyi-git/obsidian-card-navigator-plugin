import { ILayoutService } from '../services/LayoutService';
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
  LayoutCalculatedEvent
} from './LayoutEvents';

/**
 * 레이아웃 이벤트 핸들러
 */
export class LayoutEventHandler implements IDomainEventHandler<LayoutEvent> {
  constructor(private readonly layoutService: ILayoutService) {}

  /**
   * 이벤트를 처리합니다.
   */
  async handle(event: LayoutEvent): Promise<void> {
    console.debug(`[CardNavigator] 이벤트 처리 시작: ${event.constructor.name}`);
    
    try {
      switch (event.constructor.name) {
        case 'LayoutCreatedEvent':
          await this.handleLayoutCreated(event as LayoutCreatedEvent);
          break;
        case 'LayoutUpdatedEvent':
          await this.handleLayoutUpdated(event as LayoutUpdatedEvent);
          break;
        case 'LayoutDeletedEvent':
          await this.handleLayoutDeleted(event as LayoutDeletedEvent);
          break;
        case 'LayoutCardPositionUpdatedEvent':
          await this.handleLayoutCardPositionUpdated(event as LayoutCardPositionUpdatedEvent);
          break;
        case 'LayoutCardPositionAddedEvent':
          await this.handleLayoutCardPositionAdded(event as LayoutCardPositionAddedEvent);
          break;
        case 'LayoutCardPositionRemovedEvent':
          await this.handleLayoutCardPositionRemoved(event as LayoutCardPositionRemovedEvent);
          break;
        case 'LayoutCardPositionsResetEvent':
          await this.handleLayoutCardPositionsReset(event as LayoutCardPositionsResetEvent);
          break;
        case 'LayoutConfigUpdatedEvent':
          await this.handleLayoutConfigUpdated(event as LayoutConfigUpdatedEvent);
          break;
        case 'LayoutCalculatedEvent':
          await this.handleLayoutCalculated(event as LayoutCalculatedEvent);
          break;
        default:
          console.warn(`[CardNavigator] 알 수 없는 이벤트 타입: ${event.constructor.name}`);
      }
    } catch (error) {
      console.error(`[CardNavigator] 이벤트 처리 중 오류 발생: ${event.constructor.name}`, error);
      throw error;
    }
  }

  /**
   * 레이아웃 생성 이벤트 처리
   */
  private async handleLayoutCreated(event: LayoutCreatedEvent): Promise<void> {
    const layout = event.layout;
    await this.layoutService.updateLayout(layout);
  }

  /**
   * 레이아웃 업데이트 이벤트 처리
   */
  private async handleLayoutUpdated(event: LayoutUpdatedEvent): Promise<void> {
    const layout = event.layout;
    await this.layoutService.updateLayout(layout);
  }

  /**
   * 레이아웃 삭제 이벤트 처리
   */
  private async handleLayoutDeleted(event: LayoutDeletedEvent): Promise<void> {
    const layoutId = event.layoutId;
    await this.layoutService.deleteLayout(layoutId);
  }

  /**
   * 레이아웃 카드 위치 업데이트 이벤트 처리
   */
  private async handleLayoutCardPositionUpdated(event: LayoutCardPositionUpdatedEvent): Promise<void> {
    const layout = await this.layoutService.getLayout(event.layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${event.layoutId}`);
    }

    const { cardId, ...position } = event.cardPosition;
    layout.updateCardPosition(cardId, position);
    await this.layoutService.updateLayout(layout);
  }

  /**
   * 레이아웃 카드 위치 추가 이벤트 처리
   */
  private async handleLayoutCardPositionAdded(event: LayoutCardPositionAddedEvent): Promise<void> {
    const layout = await this.layoutService.getLayout(event.layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${event.layoutId}`);
    }

    layout.addCardPosition(event.cardPosition);
    await this.layoutService.updateLayout(layout);
  }

  /**
   * 레이아웃 카드 위치 제거 이벤트 처리
   */
  private async handleLayoutCardPositionRemoved(event: LayoutCardPositionRemovedEvent): Promise<void> {
    const layout = await this.layoutService.getLayout(event.layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${event.layoutId}`);
    }

    layout.removeCardPosition(event.cardId);
    await this.layoutService.updateLayout(layout);
  }

  /**
   * 레이아웃 카드 위치 초기화 이벤트 처리
   */
  private async handleLayoutCardPositionsReset(event: LayoutCardPositionsResetEvent): Promise<void> {
    const layout = await this.layoutService.getLayout(event.layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${event.layoutId}`);
    }

    layout.resetCardPositions();
    await this.layoutService.updateLayout(layout);
  }

  /**
   * 레이아웃 설정 업데이트 이벤트 처리
   */
  private async handleLayoutConfigUpdated(event: LayoutConfigUpdatedEvent): Promise<void> {
    const layout = await this.layoutService.getLayout(event.layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${event.layoutId}`);
    }

    await this.layoutService.updateLayout(layout);
  }

  /**
   * 레이아웃 계산 이벤트 처리
   */
  private async handleLayoutCalculated(event: LayoutCalculatedEvent): Promise<void> {
    const layout = await this.layoutService.getLayout(event.layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${event.layoutId}`);
    }

    await this.layoutService.updateLayout(layout);
  }
} 