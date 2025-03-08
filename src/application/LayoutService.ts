import { ILayout, LayoutType } from '../domain/layout/Layout';
import { GridLayout } from '../domain/layout/GridLayout';
import { MasonryLayout } from '../domain/layout/MasonryLayout';

/**
 * 레이아웃 서비스 인터페이스
 * 레이아웃 관리를 위한 인터페이스입니다.
 */
export interface ILayoutService {
  /**
   * 현재 레이아웃 가져오기
   * @returns 현재 레이아웃
   */
  getCurrentLayout(): ILayout | null;
  
  /**
   * 레이아웃 설정
   * @param layout 설정할 레이아웃
   */
  setLayout(layout: ILayout): void;
  
  /**
   * 레이아웃 계산
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 수
   * @returns 계산된 레이아웃 정보
   */
  calculateLayout(containerWidth: number, containerHeight: number, itemCount: number): any;
  
  /**
   * 열 수 설정
   * @param columnCount 열 수
   */
  setColumnCount(columnCount: number): void;
  
  /**
   * 카드 너비 설정
   * @param cardWidth 카드 너비
   */
  setCardWidth(cardWidth: number): void;
  
  /**
   * 카드 높이 설정
   * @param cardHeight 카드 높이
   */
  setCardHeight(cardHeight: number): void;
  
  /**
   * 간격 설정
   * @param gap 간격
   */
  setGap(gap: number): void;
  
  /**
   * 레이아웃 타입 변경
   * @param type 변경할 레이아웃 타입
   */
  changeLayoutType(type: LayoutType): void;
  
  /**
   * 동적 열 수 계산
   * @param containerWidth 컨테이너 너비
   * @returns 계산된 열 수
   */
  calculateColumnCount(containerWidth: number): number;
}

/**
 * 레이아웃 서비스 클래스
 * 레이아웃 관리를 위한 클래스입니다.
 */
export class LayoutService implements ILayoutService {
  private currentLayout: ILayout | null = null;
  private gridLayout: GridLayout;
  private masonryLayout: MasonryLayout;
  
  constructor(initialLayout?: ILayout) {
    this.gridLayout = new GridLayout();
    this.masonryLayout = new MasonryLayout();
    this.currentLayout = initialLayout || null;
  }
  
  getCurrentLayout(): ILayout | null {
    return this.currentLayout;
  }
  
  setLayout(layout: ILayout): void {
    this.currentLayout = layout;
  }
  
  calculateLayout(containerWidth: number, containerHeight: number, itemCount: number): any {
    if (!this.currentLayout) {
      return null;
    }
    
    return this.currentLayout.calculateLayout(containerWidth, containerHeight, itemCount);
  }
  
  setColumnCount(columnCount: number): void {
    if (this.currentLayout && typeof this.currentLayout === "object") {
      this.currentLayout.columnCount = columnCount;
    } else {
      console.warn(`[LayoutService] currentLayout이 객체가 아닙니다: ${this.currentLayout}`);
    }
  }
  
  setCardWidth(cardWidth: number): void {
    if (this.currentLayout && typeof this.currentLayout === 'object') {
      this.currentLayout.cardWidth = cardWidth;
    } else {
      console.warn(`[LayoutService] currentLayout이 객체가 아닙니다: ${this.currentLayout}`);
    }
  }
  
  setCardHeight(cardHeight: number): void {
    if (this.currentLayout && typeof this.currentLayout === 'object') {
      this.currentLayout.cardHeight = cardHeight;
    } else {
      console.warn(`[LayoutService] currentLayout이 객체가 아닙니다: ${this.currentLayout}`);
    }
  }
  
  setGap(gap: number): void {
    if (this.currentLayout && typeof this.currentLayout === 'object') {
      this.currentLayout.gap = gap;
    } else {
      console.warn(`[LayoutService] currentLayout이 객체가 아닙니다: ${this.currentLayout}`);
    }
  }
  
  /**
   * 레이아웃 타입 변경
   * @param type 변경할 레이아웃 타입
   */
  changeLayoutType(type: LayoutType): void {
    if (!this.currentLayout || this.currentLayout.type !== type) {
      if (type === 'grid') {
        this.currentLayout = this.gridLayout;
      } else if (type === 'masonry') {
        this.currentLayout = this.masonryLayout;
      }
    }
  }
  
  /**
   * 동적 열 수 계산
   * @param containerWidth 컨테이너 너비
   * @returns 계산된 열 수
   */
  calculateColumnCount(containerWidth: number): number {
    if (!this.currentLayout) {
      return 3; // 기본값
    }
    
    return this.currentLayout.calculateColumnCount(containerWidth);
  }
} 