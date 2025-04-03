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
 */
export interface ILayoutConfig {
  /** 레이아웃 타입 */
  readonly type: LayoutType;
  /** 카드 높이 고정 여부 */
  readonly fixedHeight: boolean;
  /** 최소 카드 너비 (픽셀) */
  readonly minCardWidth: number;
  /** 최소 카드 높이 (픽셀) */
  readonly minCardHeight: number;
  /** 카드 간격 (픽셀) */
  readonly gap: number;
  /** 패딩 (픽셀) */
  readonly padding: number;
}

/**
 * 기본 레이아웃 설정
 */
export const DEFAULT_LAYOUT_CONFIG: ILayoutConfig = {
  type: LayoutType.MASONRY,
  fixedHeight: false,
  minCardWidth: 300,
  minCardHeight: 200,
  gap: 16,
  padding: 16
}; 