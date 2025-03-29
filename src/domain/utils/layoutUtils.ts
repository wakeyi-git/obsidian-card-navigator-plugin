import { LayoutType, LayoutDirection, ICardPosition } from '../models/Layout';

/**
 * 레이아웃 유틸리티
 */
export class LayoutUtils {
  /**
   * 그리드 레이아웃 계산
   */
  static calculateGridLayout(
    cardPositions: ICardPosition[],
    viewportWidth: number,
    viewportHeight: number,
    cardWidth: number,
    cardHeight: number,
    gap: number,
    columns: number
  ): ICardPosition[] {
    const newPositions: ICardPosition[] = [];
    const cols = columns || Math.floor(viewportWidth / (cardWidth + gap));

    cardPositions.forEach((pos, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      newPositions.push({
        ...pos,
        x: col * (cardWidth + gap),
        y: row * (cardHeight + gap),
        width: cardWidth,
        height: cardHeight
      });
    });

    return newPositions;
  }

  /**
   * 메이슨리 레이아웃 계산
   */
  static calculateMasonryLayout(
    cardPositions: ICardPosition[],
    viewportWidth: number,
    cardWidth: number,
    gap: number,
    columns: number
  ): ICardPosition[] {
    const newPositions: ICardPosition[] = [];
    const cols = columns || Math.floor(viewportWidth / (cardWidth + gap));
    const columnHeights = new Array(cols).fill(0);

    cardPositions.forEach((pos, index) => {
      // 가장 짧은 열 찾기
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      const x = shortestColumn * (cardWidth + gap);
      const y = columnHeights[shortestColumn];

      newPositions.push({
        ...pos,
        x,
        y,
        width: cardWidth,
        height: pos.height || 200 // 기본 높이 설정
      });

      // 열 높이 업데이트
      columnHeights[shortestColumn] += (pos.height || 200) + gap;
    });

    return newPositions;
  }

  /**
   * 리스트 레이아웃 계산
   */
  static calculateListLayout(
    cardPositions: ICardPosition[],
    viewportWidth: number,
    viewportHeight: number,
    cardWidth: number,
    cardHeight: number,
    gap: number,
    direction: LayoutDirection
  ): ICardPosition[] {
    const newPositions: ICardPosition[] = [];

    if (direction === LayoutDirection.HORIZONTAL) {
      // 가로 리스트
      cardPositions.forEach((pos, index) => {
        newPositions.push({
          ...pos,
          x: index * (cardWidth + gap),
          y: 0,
          width: cardWidth,
          height: cardHeight
        });
      });
    } else {
      // 세로 리스트
      cardPositions.forEach((pos, index) => {
        newPositions.push({
          ...pos,
          x: 0,
          y: index * (cardHeight + gap),
          width: cardWidth,
          height: cardHeight
        });
      });
    }

    return newPositions;
  }

  /**
   * 자동 레이아웃 계산
   */
  static calculateAutoLayout(
    cardPositions: ICardPosition[],
    viewportWidth: number,
    viewportHeight: number,
    cardWidth: number,
    cardHeight: number,
    gap: number
  ): ICardPosition[] {
    const isHorizontal = viewportWidth > viewportHeight;

    if (isHorizontal) {
      // 가로 레이아웃
      const rows = Math.floor(viewportHeight / (cardHeight + gap));
      const cols = Math.ceil(cardPositions.length / rows);

      return cardPositions.map((pos, index) => ({
        ...pos,
        x: (index % rows) * (cardWidth + gap),
        y: Math.floor(index / rows) * (cardHeight + gap),
        width: cardWidth,
        height: cardHeight
      }));
    } else {
      // 세로 레이아웃
      const cols = Math.floor(viewportWidth / (cardWidth + gap));
      const rows = Math.ceil(cardPositions.length / cols);

      return cardPositions.map((pos, index) => ({
        ...pos,
        x: (index % cols) * (cardWidth + gap),
        y: Math.floor(index / cols) * (cardHeight + gap),
        width: cardWidth,
        height: cardHeight
      }));
    }
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