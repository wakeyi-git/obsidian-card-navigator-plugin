import { ICardPosition } from '../models/Layout';
import { LayoutType, LayoutDirection, ILayoutConfig } from '../models/LayoutConfig';

/**
 * 레이아웃 유틸리티
 */
export class LayoutUtils {
  /**
   * 레이아웃 계산
   */
  static calculateLayout(
    cardPositions: ICardPosition[],
    config: ILayoutConfig,
    viewportWidth: number,
    viewportHeight: number,
    type: LayoutType = LayoutType.GRID,
    direction: LayoutDirection = LayoutDirection.VERTICAL
  ): ICardPosition[] {
    const { fixedHeight, minCardWidth, minCardHeight, gap, padding } = config;

    // 사용 가능한 공간 계산
    const availableWidth = viewportWidth - padding * 2;
    const availableHeight = viewportHeight - padding * 2;

    // 뷰포트 비율에 따른 방향 자동 결정
    const isHorizontal = viewportWidth > viewportHeight;
    const effectiveDirection = isHorizontal ? LayoutDirection.HORIZONTAL : LayoutDirection.VERTICAL;

    switch (type) {
      case LayoutType.MASONRY:
        return this.calculateMasonryLayout(
          cardPositions,
          availableWidth,
          minCardWidth,
          gap,
          padding
        );
      case LayoutType.GRID:
        return this.calculateGridLayout(
          cardPositions,
          availableWidth,
          availableHeight,
          minCardWidth,
          minCardHeight,
          gap,
          padding,
          effectiveDirection,
          fixedHeight
        );
      default:
        throw new Error(`Unknown layout type: ${type}`);
    }
  }

  /**
   * 그리드 레이아웃 계산
   */
  private static calculateGridLayout(
    cardPositions: ICardPosition[],
    availableWidth: number,
    availableHeight: number,
    minCardWidth: number,
    minCardHeight: number,
    gap: number,
    padding: number,
    direction: LayoutDirection,
    fixedHeight: boolean
  ): ICardPosition[] {
    let columns: number;
    let rows: number;

    if (direction === LayoutDirection.HORIZONTAL) {
      // 가로 레이아웃
      rows = Math.floor(availableHeight / (minCardHeight + gap));
      rows = Math.max(1, rows);
      columns = Math.ceil(cardPositions.length / rows);
    } else {
      // 세로 레이아웃
      columns = Math.floor(availableWidth / (minCardWidth + gap));
      columns = Math.max(1, columns);
      rows = Math.ceil(cardPositions.length / columns);
    }

    const cardWidth = (availableWidth - gap * (columns - 1)) / columns;
    const cardHeight = fixedHeight ? minCardHeight : (availableHeight - gap * (rows - 1)) / rows;

    return cardPositions.map((pos, index) => {
      if (direction === LayoutDirection.HORIZONTAL) {
        const row = Math.floor(index / columns);
        const col = index % columns;
        return {
          ...pos,
          x: padding + col * (cardWidth + gap),
          y: padding + row * (cardHeight + gap),
          width: cardWidth,
          height: cardHeight
        };
      } else {
        const col = Math.floor(index / rows);
        const row = index % rows;
        return {
          ...pos,
          x: padding + col * (cardWidth + gap),
          y: padding + row * (cardHeight + gap),
          width: cardWidth,
          height: cardHeight
        };
      }
    });
  }

  /**
   * 메이슨리 레이아웃 계산
   */
  private static calculateMasonryLayout(
    cardPositions: ICardPosition[],
    availableWidth: number,
    minCardWidth: number,
    gap: number,
    padding: number
  ): ICardPosition[] {
    const columns = Math.floor(availableWidth / (minCardWidth + gap));
    const columnCount = Math.max(1, columns);
    const cardWidth = (availableWidth - gap * (columnCount - 1)) / columnCount;
    const columnHeights = new Array(columnCount).fill(0);

    return cardPositions.map(pos => {
      // 가장 짧은 열 찾기
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      const x = padding + shortestColumn * (cardWidth + gap);
      const y = padding + columnHeights[shortestColumn];

      // 카드 높이는 컨텐츠에 따라 자동 계산 (CSS에서 처리)
      const newPosition = {
        ...pos,
        x,
        y,
        width: cardWidth,
        height: pos.height // CSS에서 계산된 높이 사용
      };

      // 열 높이 업데이트
      columnHeights[shortestColumn] += pos.height + gap;

      return newPosition;
    });
  }

  /**
   * 카드 위치가 뷰포트 내에 있는지 확인
   */
  static isInViewport(
    position: ICardPosition,
    viewportWidth: number,
    viewportHeight: number
  ): boolean {
    return (
      position.x >= 0 &&
      position.y >= 0 &&
      position.x + position.width <= viewportWidth &&
      position.y + position.height <= viewportHeight
    );
  }

  /**
   * 카드 위치가 다른 카드와 겹치는지 확인
   */
  static isOverlapping(position1: ICardPosition, position2: ICardPosition): boolean {
    return !(
      position1.x + position1.width <= position2.x ||
      position2.x + position2.width <= position1.x ||
      position1.y + position1.height <= position2.y ||
      position2.y + position2.height <= position1.y
    );
  }

  /**
   * 카드 위치 조정
   */
  static adjustPosition(
    position: ICardPosition,
    viewportWidth: number,
    viewportHeight: number
  ): ICardPosition {
    return {
      ...position,
      x: Math.max(0, Math.min(position.x, viewportWidth - position.width)),
      y: Math.max(0, Math.min(position.y, viewportHeight - position.height))
    };
  }
} 