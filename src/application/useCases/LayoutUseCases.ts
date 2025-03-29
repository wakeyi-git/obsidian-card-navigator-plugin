import { Layout, ILayoutConfig, ICardPosition } from '../../domain/models/Layout';
import { ILayoutService } from '../../domain/services/LayoutService';
import { Card } from '../../domain/models/Card';

/**
 * 레이아웃 생성 유스케이스
 */
export class CreateLayoutUseCase {
  constructor(private readonly layoutService: ILayoutService) {}

  /**
   * 레이아웃 생성
   */
  async execute(config: ILayoutConfig): Promise<Layout> {
    return this.layoutService.createLayout('New Layout', 'New layout configuration', config);
  }
}

/**
 * 레이아웃 업데이트 유스케이스
 */
export class UpdateLayoutUseCase {
  constructor(private readonly layoutService: ILayoutService) {}

  /**
   * 레이아웃 업데이트
   */
  async execute(layout: Layout): Promise<Layout> {
    await this.layoutService.updateLayout(layout);
    const updatedLayout = await this.layoutService.getLayout(layout.id);
    if (!updatedLayout) {
      throw new Error(`Layout not found after update: ${layout.id}`);
    }
    return updatedLayout;
  }
}

/**
 * 레이아웃 삭제 유스케이스
 */
export class DeleteLayoutUseCase {
  constructor(private readonly layoutService: ILayoutService) {}

  /**
   * 레이아웃 삭제
   */
  async execute(layoutId: string): Promise<Layout> {
    const layout = await this.layoutService.getLayout(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }
    await this.layoutService.deleteLayout(layoutId);
    return layout;
  }
}

/**
 * 레이아웃 조회 유스케이스
 */
export class GetLayoutUseCase {
  constructor(private readonly layoutService: ILayoutService) {}

  /**
   * 레이아웃 조회
   */
  async execute(layoutId: string): Promise<Layout | null> {
    const layout = await this.layoutService.getLayout(layoutId);
    return layout || null;
  }
}

/**
 * 모든 레이아웃 조회 유스케이스
 */
export class GetAllLayoutsUseCase {
  constructor(private readonly layoutService: ILayoutService) {}

  /**
   * 모든 레이아웃 조회
   */
  async execute(): Promise<Layout[]> {
    return this.layoutService.getAllLayouts();
  }
}

/**
 * 레이아웃의 카드 위치 업데이트 유스케이스
 */
export class UpdateCardPositionUseCase {
  constructor(private readonly layoutService: ILayoutService) {}

  /**
   * 레이아웃의 카드 위치 업데이트
   */
  async execute(
    layoutId: string,
    cardPositions: { cardId: string; x: number; y: number; width: number; height: number }[]
  ): Promise<Layout> {
    await this.layoutService.updateCardPositions(layoutId, cardPositions);
    const updatedLayout = await this.layoutService.getLayout(layoutId);
    if (!updatedLayout) {
      throw new Error(`Layout not found after updating card positions: ${layoutId}`);
    }
    return updatedLayout;
  }
}

/**
 * 레이아웃의 카드 위치 추가 유스케이스
 */
export class AddCardPositionUseCase {
  constructor(private readonly layoutService: ILayoutService) {}

  /**
   * 레이아웃의 카드 위치 추가
   */
  async execute(
    layoutId: string,
    cardId: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<Layout> {
    await this.layoutService.addCardPosition(layoutId, cardId, x, y, width, height);
    const updatedLayout = await this.layoutService.getLayout(layoutId);
    if (!updatedLayout) {
      throw new Error(`Layout not found after adding card position: ${layoutId}`);
    }
    return updatedLayout;
  }
}

/**
 * 레이아웃의 카드 위치 제거 유스케이스
 */
export class RemoveCardPositionUseCase {
  constructor(private readonly layoutService: ILayoutService) {}

  /**
   * 레이아웃의 카드 위치 제거
   */
  async execute(layoutId: string, cardId: string): Promise<Layout> {
    await this.layoutService.removeCardPosition(layoutId, cardId);
    const updatedLayout = await this.layoutService.getLayout(layoutId);
    if (!updatedLayout) {
      throw new Error(`Layout not found after removing card position: ${layoutId}`);
    }
    return updatedLayout;
  }
}

/**
 * 레이아웃의 카드 위치 초기화 유스케이스
 */
export class ResetCardPositionsUseCase {
  constructor(private readonly layoutService: ILayoutService) {}

  /**
   * 레이아웃의 카드 위치 초기화
   */
  async execute(layoutId: string): Promise<Layout> {
    await this.layoutService.resetCardPositions(layoutId);
    const updatedLayout = await this.layoutService.getLayout(layoutId);
    if (!updatedLayout) {
      throw new Error(`Layout not found after resetting card positions: ${layoutId}`);
    }
    return updatedLayout;
  }
}

/**
 * 레이아웃 설정 업데이트 유스케이스
 */
export class UpdateLayoutConfigUseCase {
  constructor(private readonly layoutService: ILayoutService) {}

  /**
   * 레이아웃 설정 업데이트
   */
  async execute(layoutId: string, config: Partial<ILayoutConfig>): Promise<Layout> {
    const layout = await this.layoutService.getLayout(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }
    layout.config = { ...layout.config, ...config };
    await this.layoutService.updateLayout(layout);
    const updatedLayout = await this.layoutService.getLayout(layoutId);
    if (!updatedLayout) {
      throw new Error(`Layout not found after updating config: ${layoutId}`);
    }
    return updatedLayout;
  }
}

/**
 * 레이아웃 계산 유스케이스
 */
export class CalculateLayoutUseCase {
  constructor(private readonly layoutService: ILayoutService) {}

  /**
   * 레이아웃 계산
   */
  async execute(layoutId: string, cards: Card[]): Promise<Layout> {
    const layout = await this.layoutService.getLayout(layoutId);
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`);
    }
    await this.layoutService.calculateLayout(layout, cards);
    const updatedLayout = await this.layoutService.getLayout(layoutId);
    if (!updatedLayout) {
      throw new Error(`Layout not found after calculation: ${layoutId}`);
    }
    return updatedLayout;
  }
} 