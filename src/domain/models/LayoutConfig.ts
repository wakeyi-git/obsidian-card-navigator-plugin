/**
 * 레이아웃 타입
 */
export enum LayoutType {
  GRID = 'grid',
  MASONRY = 'masonry'
}

/**
 * 레이아웃 방향
 */
export enum LayoutDirection {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical'
}

/**
 * 레이아웃 설정 인터페이스
 * - 새로운 설정 구조와 일치하도록 수정됨
 */
export interface ILayoutConfig {
  /** 카드 높이 고정 여부 */
  readonly cardHeightFixed: boolean;
  /** 최소 카드 너비 (픽셀) */
  readonly cardMinWidth: number;
  /** 최소 카드 높이 (픽셀) */
  readonly cardMinHeight: number;
  /** 카드 간격 (픽셀) */
  readonly cardGap: number;
  /** 패딩 (픽셀) */
  readonly cardPadding: number;
  
  /**
   * 레이아웃 설정 유효성 검사
   */
  validate(): boolean;
  
  /**
   * 레이아웃 설정 미리보기
   */
  preview(): {
    cardHeightFixed: boolean;
    cardMinWidth: number;
    cardMinHeight: number; 
    cardGap: number;
    cardPadding: number;
  };
}

/**
 * 기본 레이아웃 설정
 */
export const DEFAULT_LAYOUT_CONFIG: ILayoutConfig = {
  cardHeightFixed: false,
  cardMinWidth: 300,
  cardMinHeight: 200,
  cardGap: 16,
  cardPadding: 16,
  
  validate(): boolean {
    return this.cardMinWidth > 0 && this.cardMinHeight > 0 && this.cardGap >= 0 && this.cardPadding >= 0;
  },
  
  preview(): {
    cardHeightFixed: boolean;
    cardMinWidth: number;
    cardMinHeight: number;
    cardGap: number;
    cardPadding: number;
  } {
    return {
      cardHeightFixed: this.cardHeightFixed,
      cardMinWidth: this.cardMinWidth,
      cardMinHeight: this.cardMinHeight,
      cardGap: this.cardGap,
      cardPadding: this.cardPadding
    };
  }
}; 