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
  createLayout(name: string, description: string, config: ILayoutConfig): Layout;

  /**
   * 레이아웃 업데이트
   */
  updateLayout(layout: Layout): void;

  /**
   * 레이아웃 삭제
   */
  deleteLayout(id: string): void;

  /**
   * 레이아웃 조회
   */
  getLayout(id: string): Layout | undefined;

  /**
   * 모든 레이아웃 조회
   */
  getAllLayouts(): Layout[];

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
  calculateLayout(layout: Layout, cards: Card[]): void;
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
  createLayout(name: string, description: string, config: ILayoutConfig): Layout {
    const id = crypto.randomUUID();
    const layout = new Layout(id, name, description, config);
    this._layouts.set(id, layout);
    return layout;
  }

  /**
   * 레이아웃 업데이트
   */
  updateLayout(layout: Layout): void {
    this._layouts.set(layout.id, layout);
    this.eventDispatcher.dispatch(new LayoutUpdatedEvent(layout));
  }

  /**
   * 레이아웃 삭제
   */
  deleteLayout(id: string): void {
    this._layouts.delete(id);
  }

  /**
   * 레이아웃 조회
   */
  getLayout(id: string): Layout | undefined {
    return this._layouts.get(id);
  }

  /**
   * 모든 레이아웃 조회
   */
  getAllLayouts(): Layout[] {
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
    await this.calculateLayout(layout, []);
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
    await this.calculateLayout(layout, []);
  }

  /**
   * 레이아웃 계산
   */
  calculateLayout(layout: Layout, cards: Card[]): void {
    const { type, direction, fixedHeight, minCardWidth, minCardHeight, gap, padding, viewportWidth, viewportHeight } = layout.config;

    if (type === 'masonry') {
      // 메이슨리 레이아웃 계산
      const availableWidth = viewportWidth - (padding * 2);
      const columns = Math.floor(availableWidth / (minCardWidth + gap));
      layout.config.columns = Math.max(1, columns);
    } else {
      // 그리드 레이아웃 계산
      if (direction === 'horizontal') {
        // 가로 레이아웃
        const availableHeight = viewportHeight - (padding * 2);
        const rows = Math.floor(availableHeight / (minCardHeight + gap));
        layout.config.rows = Math.max(1, rows);
        layout.config.columns = Math.ceil(cards.length / layout.config.rows);
      } else {
        // 세로 레이아웃
        const availableWidth = viewportWidth - (padding * 2);
        const columns = Math.floor(availableWidth / (minCardWidth + gap));
        layout.config.columns = Math.max(1, columns);
        layout.config.rows = Math.ceil(cards.length / layout.config.columns);
      }
    }
  }
} 