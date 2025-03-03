import { Layout } from './Layout';

/**
 * 메이슨리 레이아웃 클래스
 * 카드를 메이슨리(벽돌 쌓기) 형태로 배치하는 레이아웃입니다.
 */
export class MasonryLayout extends Layout {
  constructor(
    minCardWidth: number = 250,
    maxCardWidth: number = 350,
    gap: number = 16,
    aspectRatio: number = 0
  ) {
    super('masonry', minCardWidth, maxCardWidth, gap, aspectRatio);
  }
  
  /**
   * 레이아웃 계산
   * 컨테이너 크기와 아이템 수에 따라 메이슨리 레이아웃을 계산합니다.
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
    
    // 카드 너비 계산
    const itemWidth = Math.floor((containerWidth - (columns - 1) * this.gap) / columns);
    
    // 메이슨리 레이아웃은 높이가 가변적이므로 대략적인 행 수만 계산
    const rows = Math.ceil(itemCount / columns);
    
    // 메이슨리 레이아웃은 각 아이템의 높이가 다를 수 있으므로 기본값 제공
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
   * 특정 아이템의 위치를 계산합니다.
   * @param index 아이템 인덱스
   * @param itemWidth 아이템 너비
   * @param itemHeight 아이템 높이
   * @param columnHeights 각 열의 현재 높이
   * @returns 아이템 위치 정보
   */
  calculateItemPosition(
    index: number,
    itemWidth: number,
    itemHeight: number,
    columnHeights: number[]
  ): { column: number; left: number; top: number } {
    // 가장 높이가 낮은 열 찾기
    const minHeightColumn = columnHeights.indexOf(Math.min(...columnHeights));
    
    // 아이템 위치 계산
    const left = minHeightColumn * (itemWidth + this.gap);
    const top = columnHeights[minHeightColumn];
    
    // 해당 열의 높이 업데이트
    columnHeights[minHeightColumn] += itemHeight + this.gap;
    
    return {
      column: minHeightColumn,
      left,
      top,
    };
  }
  
  /**
   * 열 높이 초기화
   * @param columns 열 수
   * @returns 초기화된 열 높이 배열
   */
  initializeColumnHeights(columns: number): number[] {
    return Array(columns).fill(0);
  }
} 