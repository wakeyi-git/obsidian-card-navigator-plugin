import { ICard } from './Card';

/**
 * 레이아웃 타입 열거형
 */
export enum LayoutType {
  /** 그리드 레이아웃 - 카드 높이 고정 */
  GRID = 'grid',
  /** 메이슨리 레이아웃 - 카드 높이 자동 */
  MASONRY = 'masonry'
}

/**
 * 레이아웃 방향 열거형
 */
export enum LayoutDirection {
  /** 수직 방향 - 세로 스크롤 */
  VERTICAL = 'vertical',
  /** 수평 방향 - 가로 스크롤 */
  HORIZONTAL = 'horizontal'
}

/**
 * 레이아웃 설정 인터페이스
 */
export interface ILayoutConfig {
  /** 레이아웃 타입 */
  readonly type: LayoutType;
  /** 카드 높이 고정 여부 */
  readonly fixedCardHeight: boolean;
  /** 카드 임계 너비 (픽셀) */
  readonly cardThresholdWidth: number;
  /** 카드 임계 높이 (픽셀) */
  readonly cardThresholdHeight: number;
  /** 카드 간격 (픽셀) */
  readonly cardGap: number;
  /** 여백 (픽셀) */
  readonly padding: number;
}

/**
 * 기본 레이아웃 설정
 */
export const DEFAULT_LAYOUT_CONFIG: ILayoutConfig = {
  type: LayoutType.GRID,
  fixedCardHeight: true,
  cardThresholdWidth: 300,
  cardThresholdHeight: 200,
  cardGap: 16,
  padding: 16
};

/**
 * 레이아웃 인터페이스
 */
export interface ILayout {
  readonly config: ILayoutConfig;

  /**
   * 레이아웃 유효성 검사
   */
  validate(): boolean;

  /**
   * 레이아웃 계산
   * @param cards 카드 목록
   * @param viewportWidth 뷰포트 너비
   * @param viewportHeight 뷰포트 높이
   * @returns 레이아웃 계산 결과
   */
  calculateLayout(
    cards: readonly ICard[],
    viewportWidth: number,
    viewportHeight: number
  ): ILayoutResult;
}

/**
 * 카드 위치 인터페이스
 */
export interface ICardPosition {
  /** 카드 ID */
  readonly cardId: ICard['id'];
  /** 열 인덱스 */
  readonly columnIndex: number;
  /** 행 인덱스 */
  readonly rowIndex: number;
  /** X 좌표 */
  readonly x: number;
  /** Y 좌표 */
  readonly y: number;
  /** 너비 */
  readonly width: number;
  /** 높이 */
  readonly height: number;
}

/**
 * 레이아웃 결과 인터페이스
 */
export interface ILayoutResult {
  /** 레이아웃 타입 */
  readonly type: LayoutType;
  /** 레이아웃 방향 */
  readonly direction: LayoutDirection;
  /** 열 수 */
  readonly columnCount: number;
  /** 행 수 */
  readonly rowCount: number;
  /** 카드 너비 */
  readonly cardWidth: number;
  /** 카드 높이 */
  readonly cardHeight: number;
  /** 카드 위치 목록 */
  readonly cardPositions: readonly ICardPosition[];
  /** 스크롤 방향 */
  readonly scrollDirection: LayoutDirection;
  /** 뷰포트 너비 */
  readonly viewportWidth: number;
  /** 뷰포트 높이 */
  readonly viewportHeight: number;
}

/**
 * 레이아웃 계산 로직:
 * 1. 메이슨리 레이아웃 (type = MASONRY)
 *    - 세로 레이아웃만 적용 (direction = VERTICAL)
 *    - 뷰포트 너비와 카드 임계 너비로 열 수 결정
 *    - 모든 열이 뷰포트 안에 들어오도록 함
 *    - 카드의 높이는 컨텐츠에 따라 자동 결정
 *    - 세로 방향으로 스크롤 (scrollDirection = VERTICAL)
 * 
 * 2. 그리드 레이아웃 (type = GRID)
 *    - 뷰포트 가로 > 세로: 가로 레이아웃 (direction = HORIZONTAL)
 *      - 뷰포트 높이와 카드 임계 높이로 행 수 결정
 *      - 모든 행이 뷰포트 안에 들어오도록 함
 *      - 카드의 너비는 임계 너비로 고정
 *      - 가로 방향으로 스크롤 (scrollDirection = HORIZONTAL)
 *    - 뷰포트 세로 > 가로: 세로 레이아웃 (direction = VERTICAL)
 *      - 뷰포트 너비와 카드 임계 너비로 열 수 결정
 *      - 모든 열이 뷰포트 안에 들어오도록 함
 *      - 카드의 높이는 임계 높이로 고정
 *      - 세로 방향으로 스크롤 (scrollDirection = VERTICAL)
 */ 