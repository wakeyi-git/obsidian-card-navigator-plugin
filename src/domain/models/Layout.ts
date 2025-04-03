import { ICard } from './Card';
import { ILayoutConfig, LayoutType, LayoutDirection } from './LayoutConfig';

/**
 * 레이아웃 인터페이스
 * - 카드 배치를 계산하는 불변 객체
 */
export interface ILayout {
  readonly config: ILayoutConfig;

  /**
   * 레이아웃 유효성 검사
   */
  validate(): boolean;

  /**
   * 레이아웃 계산
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
  readonly cardId: string;
  readonly columnIndex: number;
  readonly rowIndex: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * 레이아웃 결과 인터페이스
 */
export interface ILayoutResult {
  readonly cardPositions: readonly ICardPosition[];
  readonly columnCount: number;
  readonly rowCount: number;
}

/**
 * 레이아웃 계산 로직:
 * 1. 메이슨리 레이아웃 (fixedHeight = false)
 *    - 세로 레이아웃만 적용
 *    - 뷰포트 너비와 카드 임계 너비로 열 수 결정
 *    - 카드 높이는 컨텐츠에 따라 자동 결정
 *    - 세로 스크롤
 * 
 * 2. 그리드 레이아웃 (fixedHeight = true)
 *    - 뷰포트 가로 > 세로: 가로 레이아웃
 *      - 뷰포트 높이와 카드 임계 높이로 행 수 결정
 *      - 카드 너비는 임계 너비로 고정
 *      - 가로 스크롤
 *    - 뷰포트 세로 > 가로: 세로 레이아웃
 *      - 뷰포트 너비와 카드 임계 너비로 열 수 결정
 *      - 카드 높이는 임계 높이로 고정
 *      - 세로 스크롤
 */ 