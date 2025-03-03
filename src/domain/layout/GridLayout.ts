import { Layout } from './Layout';

/**
 * 그리드 레이아웃 클래스
 * 카드를 그리드 형태로 배치하는 레이아웃입니다.
 */
export class GridLayout extends Layout {
  constructor(
    minCardWidth: number = 250,
    maxCardWidth: number = 350,
    gap: number = 16,
    aspectRatio: number = 0.75
  ) {
    super('grid', minCardWidth, maxCardWidth, gap, aspectRatio);
  }
  
  /**
   * 레이아웃 계산
   * 컨테이너 크기와 아이템 수에 따라 그리드 레이아웃을 계산합니다.
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 수
   * @returns 레이아웃 계산 결과
   */
  calculateLayout(
    containerWidth: number,
    containerHeight: number,
    itemCount: number
  ): { columns: number; rows: number; itemWidth: number; itemHeight: number } {
    // 열 수 계산
    const columns = this.calculateColumnCount(containerWidth);
    
    // 행 수 계산
    const rows = Math.ceil(itemCount / columns);
    
    // 카드 너비 계산
    const itemWidth = Math.floor((containerWidth - (columns - 1) * this.gap) / columns);
    
    // 카드 높이 계산
    const itemHeight = Math.floor(itemWidth * this.aspectRatio);
    
    return {
      columns,
      rows,
      itemWidth,
      itemHeight,
    };
  }
  
  /**
   * 아이템 위치 계산
   * 특정 인덱스의 아이템 위치를 계산합니다.
   * @param index 아이템 인덱스
   * @param columnCount 열 수
   * @returns 아이템 위치 (행, 열)
   */
  getItemPosition(index: number, columnCount: number): { row: number; column: number } {
    const row = Math.floor(index / columnCount);
    const column = index % columnCount;
    
    return { row, column };
  }
  
  /**
   * 아이템 스타일 계산
   * 특정 인덱스의 아이템 스타일을 계산합니다.
   * @param index 아이템 인덱스
   * @param columnCount 열 수
   * @returns 아이템 스타일 (위치, 크기)
   */
  getItemStyle(index: number, columnCount: number): {
    left: number;
    top: number;
    width: number;
    height: number;
  } {
    const { row, column } = this.getItemPosition(index, columnCount);
    
    return {
      left: column * (this.cardWidth + this.gap),
      top: row * ((this.cardHeight || this.cardWidth * 0.75) + this.gap),
      width: this.cardWidth,
      height: this.cardHeight || this.cardWidth * 0.75
    };
  }
} 