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
  private currentLayout: ILayout;
  
  constructor(defaultLayoutType: LayoutType = 'grid') {
    // 기본 레이아웃 생성
    this.currentLayout = this.createLayout(defaultLayoutType);
  }
  
  /**
   * 현재 레이아웃 가져오기
   * @returns 현재 레이아웃
   */
  getCurrentLayout(): ILayout | null {
    return this.currentLayout;
  }
  
  /**
   * 레이아웃 설정
   * @param layout 설정할 레이아웃
   */
  setLayout(layout: ILayout): void {
    this.currentLayout = layout;
  }
  
  /**
   * 레이아웃 타입 변경
   * @param type 레이아웃 타입
   */
  changeLayoutType(type: LayoutType): void {
    // 현재 레이아웃과 동일한 타입이면 변경하지 않음
    if (this.currentLayout && this.currentLayout.type === type) {
      return;
    }
    
    // 새 레이아웃 생성
    const newLayout = this.createLayout(type);
    
    // 기존 레이아웃 설정 복사
    if (this.currentLayout) {
      newLayout.setCardWidth(this.currentLayout.cardWidth || 300);
      newLayout.setCardHeight(this.currentLayout.cardHeight || 200);
      newLayout.setGap(this.currentLayout.gap);
    }
    
    // 현재 레이아웃 업데이트
    this.currentLayout = newLayout;
  }
  
  /**
   * 레이아웃 계산
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 수
   * @returns 계산된 레이아웃 정보
   */
  calculateLayout(containerWidth: number, containerHeight: number, itemCount: number): any {
    if (!this.currentLayout) {
      return null;
    }
    
    return this.currentLayout.calculateLayout(containerWidth, containerHeight, itemCount);
  }
  
  /**
   * 열 수 설정
   * @param columnCount 열 수
   */
  setColumnCount(columnCount: number): void {
    if (this.currentLayout) {
      this.currentLayout.setColumnCount(columnCount);
    }
  }
  
  /**
   * 카드 너비 설정
   * @param cardWidth 카드 너비
   */
  setCardWidth(cardWidth: number): void {
    if (this.currentLayout) {
      this.currentLayout.setCardWidth(cardWidth);
    }
  }
  
  /**
   * 카드 높이 설정
   * @param cardHeight 카드 높이
   */
  setCardHeight(cardHeight: number): void {
    if (this.currentLayout) {
      this.currentLayout.setCardHeight(cardHeight);
    }
  }
  
  /**
   * 간격 설정
   * @param gap 간격
   */
  setGap(gap: number): void {
    if (this.currentLayout) {
      this.currentLayout.setGap(gap);
    }
  }
  
  /**
   * 레이아웃 생성
   * @param type 레이아웃 타입
   * @returns 생성된 레이아웃
   */
  private createLayout(type: LayoutType): ILayout {
    switch (type) {
      case 'grid':
        return new GridLayout();
      case 'masonry':
        return new MasonryLayout();
      default:
        return new GridLayout();
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
    
    // 최소 카드 너비와 간격을 고려하여 열 수 계산
    const minCardWidth = this.currentLayout.minCardWidth;
    const gap = this.currentLayout.gap;
    
    // 고정 열 수가 설정된 경우 사용
    if (this.currentLayout.columnCount && this.currentLayout.columnCount > 0) {
      return this.currentLayout.columnCount;
    }
    
    // 동적 열 수 계산
    const maxColumns = Math.floor((containerWidth + gap) / (minCardWidth + gap));
    return Math.max(1, maxColumns);
  }
} 