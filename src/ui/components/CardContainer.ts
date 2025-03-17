import { ICard } from '../../domain/card/Card';
import { ICardDisplaySettings } from '../../domain/card/Card';
import { ICardStyle } from '../../domain/card/Card';
import { ILayout } from '../../domain/layout/Layout';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType } from '../../core/events/EventTypes';
import { DomainErrorBus } from '../../core/errors/DomainErrorBus';
import { ErrorCode } from '../../core/errors/ErrorTypes';
import { CardComponent } from './Card';

/**
 * 카드 컨테이너 컴포넌트
 * 카드들을 관리하고 레이아웃을 적용하는 컴포넌트입니다.
 */
export class CardContainer {
  private element: HTMLElement;
  private cards: Map<string, CardComponent>;
  private layout: ILayout;
  private displaySettings: ICardDisplaySettings;
  private style: ICardStyle;
  private eventBus: DomainEventBus;
  private errorBus: DomainErrorBus;
  private containerId: string;

  constructor(
    containerId: string,
    layout: ILayout,
    displaySettings: ICardDisplaySettings,
    style: ICardStyle
  ) {
    this.eventBus = DomainEventBus.getInstance();
    this.errorBus = DomainErrorBus.getInstance();
    this.containerId = containerId;
    
    try {
      this.layout = layout;
      this.displaySettings = displaySettings;
      this.style = style;
      this.cards = new Map();
      this.element = this.createContainerElement();
    } catch (error) {
      this.errorBus.publish(ErrorCode.CONTAINER_INITIALIZATION_FAILED, {
        containerId: this.containerId,
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  /**
   * 카드 추가
   */
  addCard(card: ICard): void {
    try {
      const cardComponent = new CardComponent(card, this.displaySettings, this.style);
      this.cards.set(card.getId(), cardComponent);
      this.element.appendChild(cardComponent.getElement());
      this.layout.addCard(card);

      this.eventBus.publish(EventType.CARD_ADDED, {
        layout: this.layout.getId(),
        card: card.getId()
      }, 'CardContainer');
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_ADDITION_FAILED, {
        containerId: this.containerId,
        cardId: card.getId(),
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  /**
   * 카드 제거
   */
  removeCard(cardId: string): void {
    try {
      const cardComponent = this.cards.get(cardId);
      if (cardComponent) {
        this.layout.removeCard(cardId);
        cardComponent.destroy();
        this.cards.delete(cardId);

        this.eventBus.publish(EventType.CARD_REMOVED, {
          layout: this.layout.getId(),
          card: cardId
        }, 'CardContainer');
      }
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_REMOVAL_FAILED, {
        containerId: this.containerId,
        cardId: cardId,
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  /**
   * 카드 업데이트
   */
  updateCard(card: ICard): void {
    try {
      const cardComponent = this.cards.get(card.getId());
      if (cardComponent) {
        cardComponent.update(card);
        this.layout.updateCard(card);

        this.eventBus.publish(EventType.CARD_UPDATED, {
          card: card.getId()
        }, 'CardContainer');
      }
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_UPDATE_FAILED, {
        cardId: card.getId(),
        updates: {},
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  /**
   * 레이아웃 업데이트
   */
  updateLayout(): void {
    try {
      this.layout.updateLayout();
      this.eventBus.publish(EventType.LAYOUT_UPDATED, {
        layout: this.layout.getId()
      }, 'CardContainer');
    } catch (error) {
      this.errorBus.publish(ErrorCode.LAYOUT_UPDATE_FAILED, {
        layout: this.layout.getId(),
        updates: {},
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  /**
   * 리사이즈 핸들러 등록
   */
  registerResizeHandler(): void {
    try {
      const resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      resizeObserver.observe(this.element);
    } catch (error) {
      this.errorBus.publish(ErrorCode.LAYOUT_RESIZE_FAILED, {
        containerId: this.containerId,
        width: this.element.clientWidth,
        height: this.element.clientHeight,
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  /**
   * 리사이즈 핸들러
   */
  private handleResize(): void {
    try {
      const layoutInfo = this.layout.calculateLayout(
        this.element.clientWidth,
        this.element.clientHeight,
        this.cards.size
      );

      // 그리드 레이아웃 설정
      this.element.style.gridTemplateColumns = `repeat(${layoutInfo.columns}, 1fr)`;
      this.element.style.gridTemplateRows = `repeat(${layoutInfo.rows}, 1fr)`;

      // 카드 크기 조정
      this.cards.forEach(cardComponent => {
        const element = cardComponent.getElement();
        element.style.width = `${layoutInfo.itemWidth}px`;
        element.style.height = `${layoutInfo.itemHeight}px`;
      });

      this.eventBus.publish(EventType.LAYOUT_RESIZED, {
        layout: this.layout.getId()
      }, 'CardContainer');
    } catch (error) {
      this.errorBus.publish(ErrorCode.LAYOUT_RESIZE_FAILED, {
        containerId: this.containerId,
        width: this.element.clientWidth,
        height: this.element.clientHeight,
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  /**
   * 컨테이너 초기화
   */
  clear(): void {
    try {
      this.cards.forEach(cardComponent => {
        cardComponent.destroy();
      });
      this.cards.clear();
      this.layout.clearCards();

      this.eventBus.publish(EventType.CONTAINER_CLEARED, {
        containerId: this.containerId
      }, 'CardContainer');
    } catch (error) {
      this.errorBus.publish(ErrorCode.CONTAINER_CLEAR_FAILED, {
        containerId: this.containerId,
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  /**
   * 컨테이너 요소 생성
   */
  private createContainerElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'card-navigator-container';
    element.dataset.containerId = this.containerId;
    return element;
  }

  /**
   * 컨테이너 요소 가져오기
   */
  getElement(): HTMLElement {
    return this.element;
  }

  /**
   * 카드 컴포넌트 가져오기
   */
  getCardComponent(cardId: string): CardComponent | undefined {
    return this.cards.get(cardId);
  }

  /**
   * 카드 컴포넌트 목록 가져오기
   */
  getCardComponents(): CardComponent[] {
    return Array.from(this.cards.values());
  }
} 