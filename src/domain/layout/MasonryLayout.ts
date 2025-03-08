import { ILayout, LayoutType } from './Layout';

/**
 * 메이슨리 레이아웃 클래스
 * 카드를 메이슨리(벽돌 쌓기) 형태로 배치하는 레이아웃입니다.
 */
export class MasonryLayout implements ILayout {
  /**
   * 레이아웃 타입
   */
  type: LayoutType = 'masonry';
  
  /**
   * 최소 카드 너비
   */
  minCardWidth = 250;
  
  /**
   * 최대 카드 너비
   */
  maxCardWidth = 350;
  
  /**
   * 카드 간격
   */
  gap = 16;
  
  /**
   * 카드 비율 (너비:높이)
   */
  aspectRatio = 0;
  
  /**
   * 열 수
   */
  columnCount = 3;
  
  /**
   * 카드 너비
   */
  cardWidth = 300;
  
  /**
   * 카드 높이
   */
  cardHeight = 0;
  
  /**
   * 생성자
   */
  constructor() {
    // 기본값으로 초기화
  }
  
  /**
   * 레이아웃 계산
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 수
   * @returns 계산된 레이아웃 정보
   */
  calculateLayout(containerWidth: number, containerHeight: number, itemCount: number): any {
    // 컨테이너 너비에 따라 열 수 계산
    const columns = this.calculateColumnCount(containerWidth);
    
    // 아이템 너비 계산 (컨테이너 너비 - 간격) / 열 수
    const itemWidth = Math.floor((containerWidth - (columns - 1) * this.gap) / columns);
    
    // 메이슨리 레이아웃에서는 아이템 높이가 다양하므로 기본값만 제공
    const itemHeight = this.cardHeight || Math.floor(itemWidth * 1.2);
    
    return {
      columns,
      itemWidth,
      itemHeight,
      gap: this.gap
    };
  }
  
  /**
   * 카드 너비 설정
   * @param width 카드 너비
   */
  setCardWidth(width: number): void {
    this.cardWidth = width;
    this.minCardWidth = Math.max(width - 50, 150);
    this.maxCardWidth = width + 50;
  }
  
  /**
   * 카드 높이 설정
   * @param height 카드 높이
   */
  setCardHeight(height: number): void {
    this.cardHeight = height;
  }
  
  /**
   * 열 수 설정
   * @param count 열 수
   */
  setColumnCount(count: number): void {
    this.columnCount = count;
  }
  
  /**
   * 간격 설정
   * @param gap 간격
   */
  setGap(gap: number): void {
    this.gap = gap;
  }
  
  /**
   * 동적 열 수 계산
   * @param containerWidth 컨테이너 너비
   * @returns 계산된 열 수
   */
  private calculateColumnCount(containerWidth: number): number {
    // 고정 열 수가 설정된 경우 사용
    if (this.columnCount > 0) {
      return this.columnCount;
    }
    
    // 최소 카드 너비와 간격을 고려하여 열 수 계산
    const maxColumns = Math.floor((containerWidth + this.gap) / (this.minCardWidth + this.gap));
    return Math.max(1, maxColumns);
  }
} 