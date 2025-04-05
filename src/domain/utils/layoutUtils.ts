import { ICardPosition } from '../models/Layout';
import { LayoutType, LayoutDirection, ILayoutConfig } from '../models/LayoutConfig';

/**
 * 레이아웃 유틸리티
 */
export class LayoutUtils {
  /**
   * 레이아웃 유형을 결정하는 함수
   */
  public static determineLayoutType(
    cardHeightFixed: boolean,
    containerWidth: number,
    containerHeight: number
  ): LayoutType {
    return cardHeightFixed ? LayoutType.GRID : LayoutType.MASONRY;
  }

  /**
   * 레이아웃 방향을 결정하는 함수
   */
  public static determineLayoutDirection(
    cardHeightFixed: boolean,
    containerWidth: number,
    containerHeight: number
  ): LayoutDirection {
    if (!cardHeightFixed) {
      // 메이슨리 레이아웃은 항상 세로 방향
      return LayoutDirection.VERTICAL;
    }
    
    // 그리드 레이아웃은 컨테이너 비율에 따라 방향 결정
    const aspectRatio = containerWidth / containerHeight;
    return aspectRatio > 1 ? LayoutDirection.HORIZONTAL : LayoutDirection.VERTICAL;
  }

  /**
   * 컨테이너 너비에 따른 열 수 계산
   */
  public static calculateColumnCount(
    containerWidth: number,
    cardMinWidth: number,
    cardGap: number,
    cardPadding: number
  ): number {
    const availableWidth = containerWidth - (2 * cardPadding);
    const columnCount = Math.floor((availableWidth + cardGap) / (cardMinWidth + cardGap));
    return Math.max(1, columnCount);
  }

  /**
   * 컨테이너 높이에 따른 행 수 계산
   */
  public static calculateRowCount(
    containerHeight: number,
    cardMinHeight: number,
    cardGap: number,
    cardPadding: number
  ): number {
    const availableHeight = containerHeight - (2 * cardPadding);
    const rowCount = Math.floor((availableHeight + cardGap) / (cardMinHeight + cardGap));
    return Math.max(1, rowCount);
  }

  /**
   * 카드 너비 계산 (열에 맞게 균등 분배)
   */
  public static calculateCardWidth(
    containerWidth: number,
    columnCount: number,
    cardGap: number,
    cardPadding: number,
    cardMinWidth: number
  ): number {
    const availableWidth = containerWidth - (2 * cardPadding);
    const cardWidth = (availableWidth - ((columnCount - 1) * cardGap)) / columnCount;
    return Math.max(cardMinWidth, cardWidth);
  }

  /**
   * 카드 높이 계산 (행에 맞게 균등 분배)
   */
  public static calculateCardHeight(
    containerHeight: number,
    rowCount: number,
    cardGap: number,
    cardPadding: number,
    cardMinHeight: number
  ): number {
    const availableHeight = containerHeight - (2 * cardPadding);
    const cardHeight = (availableHeight - ((rowCount - 1) * cardGap)) / rowCount;
    return Math.max(cardMinHeight, cardHeight);
  }

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
    const { cardHeightFixed, cardMinWidth, cardMinHeight, cardGap, cardPadding } = config;

    // 사용 가능한 공간 계산
    const availableWidth = viewportWidth - cardPadding * 2;
    const availableHeight = viewportHeight - cardPadding * 2;

    // 뷰포트 비율에 따른 방향 자동 결정
    const isHorizontal = viewportWidth > viewportHeight;
    const effectiveDirection = isHorizontal ? LayoutDirection.HORIZONTAL : LayoutDirection.VERTICAL;

    switch (type) {
      case LayoutType.MASONRY:
        return this.calculateMasonryLayout(
          cardPositions,
          config,
          viewportWidth,
          viewportHeight
        );
      case LayoutType.GRID:
        return this.calculateGridLayout(
          cardPositions,
          config,
          viewportWidth,
          viewportHeight,
          effectiveDirection
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
    config: ILayoutConfig,
    containerWidth: number,
    containerHeight: number,
    direction: LayoutDirection
  ): ICardPosition[] {
    const { cardPadding, cardGap, cardMinWidth, cardMinHeight } = config;
    
    // 열과 행 계산
    const columnCount = this.calculateColumnCount(containerWidth, cardMinWidth, cardGap, cardPadding);
    const rowCount = this.calculateRowCount(containerHeight, cardMinHeight, cardGap, cardPadding);
    
    // 각 카드의 크기 계산
    let cardWidth: number;
    let cardHeight: number;
    
    if (direction === LayoutDirection.HORIZONTAL) {
      // 가로 방향: 카드 높이는 컨테이너에 맞추고, 너비는 cardMinWidth 사용
      cardHeight = (containerHeight - (2 * cardPadding) - ((rowCount - 1) * cardGap)) / rowCount;
      cardWidth = cardMinWidth;
    } else {
      // 세로 방향: 카드 너비는 컨테이너에 맞추고, 높이는 cardMinHeight 사용
      cardWidth = (containerWidth - (2 * cardPadding) - ((columnCount - 1) * cardGap)) / columnCount;
      cardHeight = cardMinHeight;
    }
    
    // 각 카드의 위치 계산
    return cardPositions.map((pos, index) => {
      let columnIndex = 0;
      let rowIndex = 0;
      
      if (direction === LayoutDirection.HORIZONTAL) {
        // 가로 방향: 행 먼저 채우고 열 넘어감
        rowIndex = index % rowCount;
        columnIndex = Math.floor(index / rowCount);
      } else {
        // 세로 방향: 열 먼저 채우고 행 넘어감
        columnIndex = index % columnCount;
        rowIndex = Math.floor(index / columnCount);
      }
      
      const x = cardPadding + (columnIndex * (cardWidth + cardGap));
      const y = cardPadding + (rowIndex * (cardHeight + cardGap));
      
      return {
        ...pos,
        columnIndex,
        rowIndex,
        x,
        y,
        width: cardWidth,
        height: cardHeight
      };
    });
  }

  /**
   * 메이슨리 레이아웃 계산
   */
  private static calculateMasonryLayout(
    cardPositions: ICardPosition[],
    config: ILayoutConfig,
    containerWidth: number,
    containerHeight: number
  ): ICardPosition[] {
    const { cardPadding, cardGap, cardMinWidth, cardMinHeight } = config;
    
    // 열 수 계산
    const columnCount = this.calculateColumnCount(containerWidth, cardMinWidth, cardGap, cardPadding);
    
    // 각 열의 높이 추적
    const columnHeights = new Array(columnCount).fill(cardPadding);
    
    // 카드 너비 계산 (모든 열이 같은 너비)
    const cardWidth = (containerWidth - (2 * cardPadding) - ((columnCount - 1) * cardGap)) / columnCount;
    
    // 각 카드의 위치 계산
    return cardPositions.map((pos, index) => {
      // 현재 가장 낮은 열 찾기
      const columnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      const x = cardPadding + (columnIndex * (cardWidth + cardGap));
      const y = columnHeights[columnIndex];
      
      // 카드 높이는 카드 내용에 따라 다름 (여기서는 예시로 최소 높이 사용)
      const cardHeight = pos.height || config.cardMinHeight;
      
      // 해당 열의 높이 업데이트
      columnHeights[columnIndex] = y + cardHeight + cardGap;
      
      return {
        ...pos,
        columnIndex,
        rowIndex: 0, // 메이슨리는 행 개념이 없음
        x,
        y,
        width: cardWidth,
        height: cardHeight
      };
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