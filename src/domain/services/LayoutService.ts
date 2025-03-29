import { Layout, LayoutType, LayoutDirection, ILayoutConfig, ICardPosition } from '../models/Layout';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { LayoutUpdatedEvent } from '@/domain/events/LayoutEvents';
import { Card } from '../models/Card';
import { LayoutUtils } from '../utils/layoutUtils';

/**
 * 레이아웃 서비스 에러 클래스
 */
export class LayoutServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LayoutServiceError';
  }
}

/**
 * 레이아웃 서비스 인터페이스
 */
export interface ILayoutService {
  /**
   * 레이아웃 생성
   */
  createLayout(name: string, description: string, config: ILayoutConfig): Promise<Layout>;

  /**
   * 레이아웃 업데이트
   */
  updateLayout(layout: Layout): Promise<void>;

  /**
   * 레이아웃 삭제
   */
  deleteLayout(id: string): Promise<void>;

  /**
   * 레이아웃 조회
   */
  getLayout(id: string): Promise<Layout | undefined>;

  /**
   * 모든 레이아웃 조회
   */
  getAllLayouts(): Promise<Layout[]>;

  /**
   * 뷰포트 크기 업데이트
   */
  updateViewportDimensions(layoutId: string, width: number, height: number): Promise<void>;

  /**
   * 카드 위치 업데이트
   */
  updateCardPositions(layoutId: string, cardPositions: ICardPosition[]): Promise<void>;

  /**
   * 카드 위치 추가
   */
  addCardPosition(layoutId: string, cardId: string, x: number, y: number, width: number, height: number): Promise<void>;

  /**
   * 카드 위치 제거
   */
  removeCardPosition(layoutId: string, cardId: string): Promise<void>;

  /**
   * 카드 위치 초기화
   */
  resetCardPositions(layoutId: string): Promise<void>;

  /**
   * 레이아웃 계산
   */
  calculateLayout(layout: Layout, cards: Card[]): Promise<void>;
}

/**
 * 레이아웃 서비스 클래스
 */
export class LayoutService implements ILayoutService {
  private readonly _layouts: Map<string, Layout>;

  constructor(
    private readonly eventDispatcher: DomainEventDispatcher
  ) {
    this._layouts = new Map();
  }

  /**
   * 레이아웃 생성
   */
  async createLayout(name: string, description: string, config: ILayoutConfig): Promise<Layout> {
    try {
      const id = crypto.randomUUID();
      const layout = new Layout(id, name, description, config);
      this._layouts.set(id, layout);
      await this.eventDispatcher.dispatch(new LayoutUpdatedEvent(layout));
      return layout;
    } catch (error) {
      throw new LayoutServiceError(`Failed to create layout: ${error.message}`);
    }
  }

  /**
   * 레이아웃 업데이트
   */
  async updateLayout(layout: Layout): Promise<void> {
    try {
      this._layouts.set(layout.id, layout);
      await this.eventDispatcher.dispatch(new LayoutUpdatedEvent(layout));
    } catch (error) {
      throw new LayoutServiceError(`Failed to update layout: ${error.message}`);
    }
  }

  /**
   * 레이아웃 삭제
   */
  async deleteLayout(id: string): Promise<void> {
    try {
      if (!this._layouts.has(id)) {
        throw new LayoutServiceError(`Layout not found: ${id}`);
      }
      this._layouts.delete(id);
    } catch (error) {
      throw new LayoutServiceError(`Failed to delete layout: ${error.message}`);
    }
  }

  /**
   * 레이아웃 조회
   */
  async getLayout(id: string): Promise<Layout | undefined> {
    return this._layouts.get(id);
  }

  /**
   * 모든 레이아웃 조회
   */
  async getAllLayouts(): Promise<Layout[]> {
    return Array.from(this._layouts.values());
  }

  /**
   * 뷰포트 크기 업데이트
   */
  async updateViewportDimensions(layoutId: string, width: number, height: number): Promise<void> {
    try {
      const layout = await this._getLayoutOrThrow(layoutId);
      layout.updateViewport(width, height);
      await this.calculateLayout(layout, []);
    } catch (error) {
      throw new LayoutServiceError(`Failed to update viewport dimensions: ${error.message}`);
    }
  }

  /**
   * 카드 위치 업데이트
   */
  async updateCardPositions(layoutId: string, cardPositions: ICardPosition[]): Promise<void> {
    try {
      const layout = await this._getLayoutOrThrow(layoutId);
      cardPositions.forEach(position => {
        layout.updateCardPosition(position.cardId, {
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height
        });
      });
      await this.eventDispatcher.dispatch(new LayoutUpdatedEvent(layout));
    } catch (error) {
      throw new LayoutServiceError(`Failed to update card positions: ${error.message}`);
    }
  }

  /**
   * 카드 위치 추가
   */
  async addCardPosition(
    layoutId: string,
    cardId: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    try {
      const layout = await this._getLayoutOrThrow(layoutId);
      layout.addCardPosition({
        cardId,
        x,
        y,
        width,
        height
      });
      await this.eventDispatcher.dispatch(new LayoutUpdatedEvent(layout));
    } catch (error) {
      throw new LayoutServiceError(`Failed to add card position: ${error.message}`);
    }
  }

  /**
   * 카드 위치 제거
   */
  async removeCardPosition(layoutId: string, cardId: string): Promise<void> {
    try {
      const layout = await this._getLayoutOrThrow(layoutId);
      layout.removeCardPosition(cardId);
      await this.eventDispatcher.dispatch(new LayoutUpdatedEvent(layout));
    } catch (error) {
      throw new LayoutServiceError(`Failed to remove card position: ${error.message}`);
    }
  }

  /**
   * 카드 위치 초기화
   */
  async resetCardPositions(layoutId: string): Promise<void> {
    try {
      const layout = await this._getLayoutOrThrow(layoutId);
      layout.resetCardPositions();
      await this.calculateLayout(layout, []);
    } catch (error) {
      throw new LayoutServiceError(`Failed to reset card positions: ${error.message}`);
    }
  }

  /**
   * 레이아웃 계산
   */
  async calculateLayout(layout: Layout, cards: Card[]): Promise<void> {
    try {
      const cardPositions = LayoutUtils.calculateLayout(
        cards.map(card => ({
          cardId: card.id,
          x: 0,
          y: 0,
          width: layout.config.cardWidth,
          height: layout.config.cardHeight
        })),
        layout.config
      );

      cardPositions.forEach(position => {
        layout.updateCardPosition(position.cardId, {
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height
        });
      });

      await this.eventDispatcher.dispatch(new LayoutUpdatedEvent(layout));
    } catch (error) {
      throw new LayoutServiceError(`Failed to calculate layout: ${error.message}`);
    }
  }

  /**
   * 레이아웃 조회 또는 에러 발생
   */
  private async _getLayoutOrThrow(layoutId: string): Promise<Layout> {
    const layout = await this.getLayout(layoutId);
    if (!layout) {
      throw new LayoutServiceError(`Layout not found: ${layoutId}`);
    }
    return layout;
  }
} 