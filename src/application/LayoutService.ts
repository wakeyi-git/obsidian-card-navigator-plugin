import { ILayout, ILayoutInfo, LayoutType, LayoutDirection, ScrollDirection } from '../domain/layout/index';
import { GridLayout } from '../domain/layout/GridLayout';
import { MasonryLayout } from '../domain/layout/MasonryLayout';
import { CardSetType, CardSetSourceType } from '../domain/cardset/CardSet';

/**
 * 레이아웃 서비스 인터페이스
 * 레이아웃 관련 기능을 제공합니다.
 */
export interface ILayoutService {
  /**
   * 레이아웃 생성
   * @param type 레이아웃 타입
   * @param minCardWidth 최소 카드 너비
   * @param maxCardWidth 최대 카드 너비
   * @param gap 카드 간격
   * @param aspectRatio 카드 비율 (너비:높이)
   * @param fixedHeight 카드 높이 고정 여부
   * @param maxCardHeight 최대 카드 높이 (메이슨리 레이아웃에서 사용)
   * @param direction 레이아웃 방향
   * @param scrollDirection 스크롤 방향
   * @returns 레이아웃 객체
   */
  createLayout(
    type: LayoutType,
    minCardWidth: number,
    maxCardWidth: number,
    gap: number,
    aspectRatio: number,
    fixedHeight: boolean,
    maxCardHeight?: number | null,
    direction?: LayoutDirection,
    scrollDirection?: ScrollDirection
  ): ILayout;
  
  /**
   * 현재 레이아웃 가져오기
   * @returns 현재 레이아웃
   */
  getCurrentLayout(): ILayout;
  
  /**
   * 레이아웃 변경
   * @param layout 새 레이아웃
   */
  changeLayout(layout: ILayout): void;
  
  /**
   * 레이아웃 타입 변경
   * @param type 레이아웃 타입
   */
  changeLayoutType(type: LayoutType): void;
  
  /**
   * 레이아웃 방향 변경
   * @param direction 레이아웃 방향
   */
  changeLayoutDirection(direction: LayoutDirection): void;
  
  /**
   * 스크롤 방향 변경
   * @param scrollDirection 스크롤 방향
   */
  changeScrollDirection(scrollDirection: ScrollDirection): void;
  
  /**
   * 카드 너비 범위 변경
   * @param minWidth 최소 너비
   * @param maxWidth 최대 너비
   */
  changeCardWidthRange(minWidth: number, maxWidth: number): void;
  
  /**
   * 카드 간격 변경
   * @param gap 간격
   */
  changeCardGap(gap: number): void;
  
  /**
   * 카드 비율 변경
   * @param aspectRatio 비율 (너비:높이)
   */
  changeCardAspectRatio(aspectRatio: number): void;
  
  /**
   * 카드 높이 고정 여부 변경
   * @param fixedHeight 고정 여부
   */
  changeCardFixedHeight(fixedHeight: boolean): void;
  
  /**
   * 최대 카드 높이 변경
   * @param maxHeight 최대 높이
   */
  changeMaxCardHeight(maxHeight: number | null): void;
  
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
   * 동적 열 수 계산
   * @param containerWidth 컨테이너 너비
   * @returns 계산된 열 수
   */
  calculateColumnCount(containerWidth: number): number;
  
  /**
   * 카드 세트 변경 이벤트 처리
   * @param cardSetSourceType 변경된 카드 세트 타입
   */
  onCardSetSourceChanged(cardSetSourceType: CardSetSourceType): void;
  
  /**
   * 카드 크기 설정
   * @param width 카드 너비
   * @param height 카드 높이
   */
  setCardSize(width: number, height: number): void;
}

/**
 * 그리드 레이아웃 클래스
 * ILayout 인터페이스를 구현합니다.
 */
class GridLayout implements ILayout {
  type: LayoutType = 'grid';
  minCardWidth: number;
  maxCardWidth: number;
  gap: number;
  aspectRatio: number;
  fixedHeight: boolean = true;
  maxCardHeight?: number | null = null;
  direction: LayoutDirection;
  scrollDirection: ScrollDirection;
  
  constructor(
    minCardWidth: number,
    maxCardWidth: number,
    gap: number,
    aspectRatio: number,
    direction: LayoutDirection = 'vertical',
    scrollDirection: ScrollDirection = 'vertical'
  ) {
    this.minCardWidth = minCardWidth;
    this.maxCardWidth = maxCardWidth;
    this.gap = gap;
    this.aspectRatio = aspectRatio;
    this.direction = direction;
    this.scrollDirection = scrollDirection;
  }
  
  /**
   * 레이아웃 계산
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 수
   * @returns 계산된 레이아웃 정보
   */
  calculateLayout(containerWidth: number, containerHeight: number, itemCount: number): ILayoutInfo {
    // 컨테이너 크기에 따라 방향 자동 결정
    const isHorizontal = this.direction === 'horizontal' || 
      (this.direction === 'auto' && containerWidth > containerHeight);
    
    // 열 수 계산
    let columns: number;
    const availableWidth = containerWidth - this.gap; // 간격 고려
    
    // 최소 너비와 최대 너비 사이에서 가능한 최대 열 수 계산
    const maxColumns = Math.floor((availableWidth + this.gap) / (this.minCardWidth + this.gap));
    const minColumns = Math.max(1, Math.floor((availableWidth + this.gap) / (this.maxCardWidth + this.gap)));
    
    // 최적의 열 수 결정
    columns = maxColumns;
    
    // 아이템 너비 계산
    const itemWidth = Math.floor((availableWidth - (columns - 1) * this.gap) / columns);
    
    // 아이템 높이 계산
    const itemHeight = Math.floor(itemWidth / this.aspectRatio);
    
    // 행 수 계산
    const rows = Math.ceil(itemCount / columns);
    
    return {
      columns,
      rows,
      itemWidth,
      itemHeight,
      fixedHeight: true,
      direction: isHorizontal ? 'horizontal' : 'vertical',
      scrollDirection: this.scrollDirection
    };
  }
}

/**
 * 메이슨리 레이아웃 클래스
 * ILayout 인터페이스를 구현합니다.
 */
class MasonryLayout implements ILayout {
  type: LayoutType = 'masonry';
  minCardWidth: number;
  maxCardWidth: number;
  gap: number;
  aspectRatio: number;
  fixedHeight: boolean = false;
  maxCardHeight?: number | null;
  direction: LayoutDirection;
  scrollDirection: ScrollDirection;
  
  constructor(
    minCardWidth: number,
    maxCardWidth: number,
    gap: number,
    aspectRatio: number,
    maxCardHeight?: number | null,
    direction: LayoutDirection = 'vertical',
    scrollDirection: ScrollDirection = 'vertical'
  ) {
    this.minCardWidth = minCardWidth;
    this.maxCardWidth = maxCardWidth;
    this.gap = gap;
    this.aspectRatio = aspectRatio;
    this.maxCardHeight = maxCardHeight;
    this.direction = direction;
    this.scrollDirection = scrollDirection;
  }
  
  /**
   * 레이아웃 계산
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 수
   * @returns 계산된 레이아웃 정보
   */
  calculateLayout(containerWidth: number, containerHeight: number, itemCount: number): ILayoutInfo {
    // 컨테이너 크기에 따라 방향 자동 결정
    const isHorizontal = this.direction === 'horizontal' || 
      (this.direction === 'auto' && containerWidth > containerHeight);
    
    // 열 수 계산
    let columns: number;
    const availableWidth = containerWidth - this.gap; // 간격 고려
    
    // 최소 너비와 최대 너비 사이에서 가능한 최대 열 수 계산
    const maxColumns = Math.floor((availableWidth + this.gap) / (this.minCardWidth + this.gap));
    const minColumns = Math.max(1, Math.floor((availableWidth + this.gap) / (this.maxCardWidth + this.gap)));
    
    // 최적의 열 수 결정
    columns = maxColumns;
    
    // 아이템 너비 계산
    const itemWidth = Math.floor((availableWidth - (columns - 1) * this.gap) / columns);
    
    // 기본 아이템 높이 계산 (비율 기준)
    const baseItemHeight = Math.floor(itemWidth / this.aspectRatio);
    
    // 최대 높이 제한 적용
    const itemHeight = this.maxCardHeight ? Math.min(baseItemHeight, this.maxCardHeight) : baseItemHeight;
    
    // 행 수 계산 (메이슨리는 정확한 행 수를 예측하기 어려움)
    // 대략적인 행 수 계산
    const rows = Math.ceil(itemCount / columns);
    
    return {
      columns,
      rows,
      itemWidth,
      itemHeight,
      fixedHeight: false,
      direction: isHorizontal ? 'horizontal' : 'vertical',
      scrollDirection: this.scrollDirection
    };
  }
}

/**
 * 레이아웃 서비스 클래스
 * 레이아웃 관련 기능을 제공합니다.
 */
export class LayoutService implements ILayoutService {
  private currentLayout: ILayout;
  
  /**
   * 생성자
   * @param initialLayout 초기 레이아웃 (선택 사항)
   */
  constructor(initialLayout?: ILayout) {
    // 기본 레이아웃 설정
    this.currentLayout = initialLayout || new GridLayout(150, 300, 10, 1.5);
  }
  
  /**
   * 레이아웃 생성
   * @param type 레이아웃 타입
   * @param minCardWidth 최소 카드 너비
   * @param maxCardWidth 최대 카드 너비
   * @param gap 카드 간격
   * @param aspectRatio 카드 비율 (너비:높이)
   * @param fixedHeight 카드 높이 고정 여부
   * @param maxCardHeight 최대 카드 높이 (메이슨리 레이아웃에서 사용)
   * @param direction 레이아웃 방향
   * @param scrollDirection 스크롤 방향
   * @returns 레이아웃 객체
   */
  createLayout(
    type: LayoutType,
    minCardWidth: number,
    maxCardWidth: number,
    gap: number,
    aspectRatio: number,
    fixedHeight: boolean,
    maxCardHeight?: number | null,
    direction: LayoutDirection = 'vertical',
    scrollDirection: ScrollDirection = 'vertical'
  ): ILayout {
    if (type === 'grid' || fixedHeight) {
      return new GridLayout(minCardWidth, maxCardWidth, gap, aspectRatio, direction, scrollDirection);
    } else {
      return new MasonryLayout(minCardWidth, maxCardWidth, gap, aspectRatio, maxCardHeight, direction, scrollDirection);
    }
  }
  
  /**
   * 현재 레이아웃 가져오기
   * @returns 현재 레이아웃
   */
  getCurrentLayout(): ILayout {
    return this.currentLayout;
  }
  
  /**
   * 레이아웃 변경
   * @param layout 새 레이아웃
   */
  changeLayout(layout: ILayout): void {
    this.currentLayout = layout;
  }
  
  /**
   * 레이아웃 타입 변경
   * @param type 레이아웃 타입
   */
  changeLayoutType(type: LayoutType): void {
    // 현재 레이아웃 설정 유지하면서 타입만 변경
    const { minCardWidth, maxCardWidth, gap, aspectRatio, direction, scrollDirection } = this.currentLayout;
    
    if (type === 'grid') {
      this.currentLayout = new GridLayout(minCardWidth, maxCardWidth, gap, aspectRatio, direction, scrollDirection);
    } else {
      const maxCardHeight = this.currentLayout.maxCardHeight;
      this.currentLayout = new MasonryLayout(minCardWidth, maxCardWidth, gap, aspectRatio, maxCardHeight, direction, scrollDirection);
    }
  }
  
  /**
   * 레이아웃 방향 변경
   * @param direction 레이아웃 방향
   */
  changeLayoutDirection(direction: LayoutDirection): void {
    this.currentLayout.direction = direction;
  }
  
  /**
   * 스크롤 방향 변경
   * @param scrollDirection 스크롤 방향
   */
  changeScrollDirection(scrollDirection: ScrollDirection): void {
    this.currentLayout.scrollDirection = scrollDirection;
  }
  
  /**
   * 카드 너비 범위 변경
   * @param minWidth 최소 너비
   * @param maxWidth 최대 너비
   */
  changeCardWidthRange(minWidth: number, maxWidth: number): void {
    this.currentLayout.minCardWidth = minWidth;
    this.currentLayout.maxCardWidth = maxWidth;
  }
  
  /**
   * 카드 간격 변경
   * @param gap 간격
   */
  changeCardGap(gap: number): void {
    this.currentLayout.gap = gap;
  }
  
  /**
   * 카드 비율 변경
   * @param aspectRatio 비율 (너비:높이)
   */
  changeCardAspectRatio(aspectRatio: number): void {
    this.currentLayout.aspectRatio = aspectRatio;
  }
  
  /**
   * 카드 높이 고정 여부 변경
   * @param fixedHeight 고정 여부
   */
  changeCardFixedHeight(fixedHeight: boolean): void {
    // 고정 높이 변경 시 레이아웃 타입도 함께 변경
    if (fixedHeight !== this.currentLayout.fixedHeight) {
      const type = fixedHeight ? 'grid' : 'masonry';
      this.changeLayoutType(type);
    }
  }
  
  /**
   * 최대 카드 높이 변경
   * @param maxHeight 최대 높이
   */
  changeMaxCardHeight(maxHeight: number | null): void {
    if (this.currentLayout.type === 'masonry') {
      this.currentLayout.maxCardHeight = maxHeight;
    }
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
  
  /**
   * 카드 세트 변경 이벤트 처리
   * @param cardSetSourceType 변경된 카드 세트 타입
   */
  onCardSetSourceChanged(cardSetSourceType: CardSetSourceType): void {
    console.log(`[LayoutService] 카드 세트 변경 감지: ${cardSetSourceType}`);
    
    // 카드 세트에 따라 적절한 레이아웃 적용
    // 현재는 카드 세트에 따른 특별한 레이아웃 변경이 없으므로 로깅만 수행
  }
  
  /**
   * 카드 크기 설정
   * @param width 카드 너비
   * @param height 카드 높이
   */
  setCardSize(width: number, height: number): void {
    this.setCardWidth(width);
    this.setCardHeight(height);
  }
} 