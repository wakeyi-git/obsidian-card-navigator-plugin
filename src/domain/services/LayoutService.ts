import { Layout, LayoutType, LayoutDirection, ILayoutConfig, ICardPosition } from '../models/Layout';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { LayoutUpdatedEvent } from '@/domain/events/LayoutEvents';
import { Card } from '../models/Card';

/**
 * 레이아웃 서비스 인터페이스
 */
export interface ILayoutService {
  /**
   * 레이아웃 생성
   */
  createLayout(config: ILayoutConfig): Promise<Layout>;

  /**
   * 레이아웃 업데이트
   */
  updateLayout(layout: Layout): Promise<void>;

  /**
   * 레이아웃 삭제
   */
  deleteLayout(layoutId: string): Promise<void>;

  /**
   * 레이아웃 조회
   */
  getLayout(layoutId: string): Promise<Layout | undefined>;

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
  calculateLayout(layoutId: string, cards: Card[]): Promise<ICardPosition[]>;
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
  async createLayout(config: ILayoutConfig): Promise<Layout> {
    const layout = new Layout(crypto.randomUUID(), config);
    this._layouts.set(layout.id, layout);
    return layout;
  }

  /**
   * 레이아웃 업데이트
   */
  async updateLayout(layout: Layout): Promise<void> {
    const existingLayout = this._layouts.get(layout.id);
    if (!existingLayout) {
      throw new Error(`Layout not found: ${layout.id}`);
    }

    this._layouts.set(layout.id, layout);
    this.eventDispatcher.dispatch(new LayoutUpdatedEvent(layout));
  }

  /**
   * 레이아웃 삭제
   */
  async deleteLayout(layoutId: string): Promise<void> {
    const layout = this._layouts.get(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }

    this._layouts.delete(layoutId);
  }

  /**
   * 레이아웃 조회
   */
  async getLayout(layoutId: string): Promise<Layout | undefined> {
    return this._layouts.get(layoutId);
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
    const layout = this._layouts.get(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }

    layout.updateViewport(width, height);
    await this.calculateLayout(layoutId, []);
  }

  /**
   * 카드 위치 업데이트
   */
  async updateCardPositions(
    layoutId: string,
    cardPositions: ICardPosition[]
  ): Promise<void> {
    const layout = this._layouts.get(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }

    cardPositions.forEach(position => {
      layout.updateCardPosition(position.cardId, {
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height
      });
    });
    
    this.eventDispatcher.dispatch(new LayoutUpdatedEvent(layout));
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
    const layout = this._layouts.get(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }

    layout.addCardPosition({
      cardId,
      x,
      y,
      width,
      height
    });
    this.eventDispatcher.dispatch(new LayoutUpdatedEvent(layout));
  }

  /**
   * 카드 위치 제거
   */
  async removeCardPosition(layoutId: string, cardId: string): Promise<void> {
    const layout = this._layouts.get(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }

    layout.removeCardPosition(cardId);
    this.eventDispatcher.dispatch(new LayoutUpdatedEvent(layout));
  }

  /**
   * 카드 위치 초기화
   */
  async resetCardPositions(layoutId: string): Promise<void> {
    const layout = this._layouts.get(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }

    layout.resetCardPositions();
    await this.calculateLayout(layoutId, []);
  }

  /**
   * 레이아웃 계산
   */
  async calculateLayout(layoutId: string, cards: Card[]): Promise<ICardPosition[]> {
    const layout = this._layouts.get(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }

    layout.calculateLayout(cards);
    this.eventDispatcher.dispatch(new LayoutUpdatedEvent(layout));
    return layout.cardPositions;
  }
} 