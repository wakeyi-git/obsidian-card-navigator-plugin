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
   * 레이아웃 계산
   * 주어진 컨테이너 크기와 아이템 수에 따라 레이아웃을 계산합니다.
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 수
   * @returns 계산된 레이아웃 정보
   */
  calculateLayout(containerWidth: number, containerHeight: number, itemCount: number): any;
  
  /**
   * 카드 너비 설정
   * @param width 카드 너비
   */
  setCardWidth(width: number): void;
  
  /**
   * 카드 높이 설정
   * @param height 카드 높이
   */
  setCardHeight(height: number): void;
  
  /**
   * 열 수 설정
   * @param count 열 수
   */
  setColumnCount(count: number): void;
  
  /**
   * 간격 설정
   * @param gap 간격
   */
  setGap(gap: number): void;
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
  private _columnCount = 0;
  private _cardWidth = 0;
  private _cardHeight = 0;
  
  get columnCount(): number {
    return this._columnCount;
  }
  
  set columnCount(value: number) {
    this._columnCount = value;
  }
  
  get cardWidth(): number {
    return this._cardWidth || this.minCardWidth;
  }
  
  set cardWidth(value: number) {
    this._cardWidth = value;
  }
  
  get cardHeight(): number {
    return this._cardHeight || this.cardWidth / this.aspectRatio;
  }
  
  set cardHeight(value: number) {
    this._cardHeight = value;
  }
  
  constructor(
    type: LayoutType,
    minCardWidth = 250,
    maxCardWidth = 350,
    gap = 16,
    aspectRatio = 0.75
  ) {
    this.type = type;
    this.minCardWidth = minCardWidth;
    this.maxCardWidth = maxCardWidth;
    this.gap = gap;
    this.aspectRatio = aspectRatio;
  }
  
  /**
   * 카드 너비 설정
   * @param width 카드 너비
   */
  setCardWidth(width: number): void {
    this.cardWidth = width;
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
  
  // 기존 메서드들
  setMinCardWidth(width: number): void {
    this.minCardWidth = width;
  }
  
  setMaxCardWidth(width: number): void {
    this.maxCardWidth = width;
  }
  
  setAspectRatio(ratio: number): void {
    this.aspectRatio = ratio;
  }
  
  calculateColumnCount(containerWidth: number): number {
    // 고정 열 수가 설정된 경우 사용
    if (this.columnCount > 0) {
      return this.columnCount;
    }
    
    // 최소 카드 너비와 간격을 고려하여 열 수 계산
    const maxColumns = Math.floor((containerWidth + this.gap) / (this.minCardWidth + this.gap));
    return Math.max(1, maxColumns);
  }
  
  abstract calculateLayout(
    containerWidth: number,
    containerHeight: number,
    itemCount: number
  ): { columns: number; rows: number; itemWidth: number; itemHeight: number };
} 