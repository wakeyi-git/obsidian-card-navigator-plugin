/**
 * 레이아웃 설정 인터페이스
 */
export interface ILayoutConfig {
  /**
   * 카드 높이 고정 여부
   */
  fixedCardHeight: boolean;

  /**
   * 카드 임계 너비
   */
  cardThresholdWidth: number;

  /**
   * 카드 임계 높이
   */
  cardThresholdHeight: number;

  /**
   * 카드 간격
   */
  cardGap: number;

  /**
   * 패딩
   */
  padding: number;
}

/**
 * 기본 레이아웃 설정
 */
export const DEFAULT_LAYOUT_CONFIG: ILayoutConfig = {
  fixedCardHeight: false,
  cardThresholdWidth: 300,
  cardThresholdHeight: 200,
  cardGap: 16,
  padding: 16
} as const; 