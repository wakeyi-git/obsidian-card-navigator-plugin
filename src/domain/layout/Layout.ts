/**
 * 레이아웃 타입 정의
 */
export type LayoutType = 'grid' | 'masonry';

/**
 * 레이아웃 인터페이스
 * 카드 레이아웃을 정의하는 인터페이스입니다.
 */
export interface ILayout {
  /**
   * 레이아웃 타입
   */
  type: LayoutType;
  
  /**
   * 최소 카드 너비
   */
  minCardWidth: number;
  
  /**
   * 최대 카드 너비
   */
  maxCardWidth: number;
  
  /**
   * 카드 간격
   */
  gap: number;
  
  /**
   * 카드 비율 (너비:높이)
   */
  aspectRatio: number;
  
  /**
   * 열 수
   * @deprecated minCardWidth와 gap을 사용하여 동적으로 계산하세요.
   */
  columnCount?: number;
  
  /**
   * 카드 너비
   * @deprecated minCardWidth와 maxCardWidth를 사용하세요.
   */
  cardWidth?: number;
  
  /**
   * 카드 높이
   * @deprecated aspectRatio를 사용하여 계산하세요.
   */
  cardHeight?: number;
  
  /**
   * 최소 카드 너비 설정
   * @param width 최소 카드 너비
   */
  setMinCardWidth(width: number): void;
  
  /**
   * 최대 카드 너비 설정
   * @param width 최대 카드 너비
   */
  setMaxCardWidth(width: number): void;
  
  /**
   * 카드 간격 설정
   * @param gap 카드 간격
   */
  setGap(gap: number): void;
  
  /**
   * 카드 비율 설정
   * @param ratio 카드 비율
   */
  setAspectRatio(ratio: number): void;
  
  /**
   * 동적 열 수 계산
   * @param containerWidth 컨테이너 너비
   * @returns 계산된 열 수
   */
  calculateColumnCount(containerWidth: number): number;
  
  /**
   * 레이아웃 계산
   * 컨테이너 크기와 아이템 수에 따라 레이아웃을 계산합니다.
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 수
   * @returns 레이아웃 계산 결과
   */
  calculateLayout(
    containerWidth: number,
    containerHeight: number,
    itemCount: number
  ): { columns: number; rows: number; itemWidth: number; itemHeight: number };
}

/**
 * 레이아웃 추상 클래스
 * 레이아웃 인터페이스를 구현하는 추상 클래스입니다.
 */
export abstract class Layout implements ILayout {
  type: LayoutType;
  minCardWidth: number;
  maxCardWidth: number;
  gap: number;
  aspectRatio: number;
  
  // 하위 호환성을 위한 속성
  get columnCount(): number {
    return this.calculateColumnCount(1000); // 기본값
  }
  
  set columnCount(value: number) {
    // 무시
  }
  
  get cardWidth(): number {
    return this.minCardWidth;
  }
  
  set cardWidth(value: number) {
    this.minCardWidth = value;
  }
  
  get cardHeight(): number {
    return this.minCardWidth * this.aspectRatio;
  }
  
  set cardHeight(value: number) {
    if (value > 0 && this.minCardWidth > 0) {
      this.aspectRatio = value / this.minCardWidth;
    }
  }
  
  constructor(
    type: LayoutType,
    minCardWidth: number = 250,
    maxCardWidth: number = 350,
    gap: number = 16,
    aspectRatio: number = 0.75
  ) {
    this.type = type;
    this.minCardWidth = minCardWidth;
    this.maxCardWidth = maxCardWidth;
    this.gap = gap;
    this.aspectRatio = aspectRatio;
  }
  
  setMinCardWidth(width: number): void {
    this.minCardWidth = width;
  }
  
  setMaxCardWidth(width: number): void {
    this.maxCardWidth = width;
  }
  
  setGap(gap: number): void {
    this.gap = gap;
  }
  
  setAspectRatio(ratio: number): void {
    this.aspectRatio = ratio;
  }
  
  calculateColumnCount(containerWidth: number): number {
    // 기본 구현: 컨테이너 너비와 최소 카드 너비, 간격을 고려하여 열 수 계산
    const availableWidth = containerWidth - this.gap; // 첫 번째 간격 제외
    const cardWidthWithGap = this.minCardWidth + this.gap;
    const columns = Math.max(1, Math.floor(availableWidth / cardWidthWithGap));
    return columns;
  }
  
  abstract calculateLayout(
    containerWidth: number,
    containerHeight: number,
    itemCount: number
  ): { columns: number; rows: number; itemWidth: number; itemHeight: number };
} 