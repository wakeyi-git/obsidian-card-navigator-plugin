/**
 * 레이아웃 타입 정의
 */
export type LayoutType = 'grid' | 'masonry';

/**
 * 레이아웃 방향 정의
 */
export type LayoutDirection = 'horizontal' | 'vertical';

/**
 * 스크롤 방향 정의
 */
export type ScrollDirection = 'horizontal' | 'vertical';

/**
 * 레이아웃 정보 인터페이스
 * 계산된 레이아웃 정보를 정의합니다.
 */
export interface ILayoutInfo {
  /**
   * 열 수
   */
  columns: number;
  
  /**
   * 행 수
   */
  rows: number;
  
  /**
   * 아이템 너비
   */
  itemWidth: number;
  
  /**
   * 아이템 높이
   */
  itemHeight: number;
  
  /**
   * 아이템 높이가 고정되었는지 여부
   * - true: 모든 아이템이 동일한 높이 (그리드 레이아웃)
   * - false: 아이템이 내용에 따라 다양한 높이를 가질 수 있음 (메이슨리 레이아웃)
   */
  fixedHeight: boolean;
  
  /**
   * 레이아웃 방향
   * - horizontal: 가로 방향으로 카드 배치 (뷰포트 너비 > 높이)
   * - vertical: 세로 방향으로 카드 배치 (뷰포트 너비 < 높이)
   */
  direction: LayoutDirection;
  
  /**
   * 스크롤 방향
   * - horizontal: 가로 스크롤
   * - vertical: 세로 스크롤
   */
  scrollDirection: ScrollDirection;
}

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
   * 카드 높이 고정 여부
   * - true: 모든 카드가 동일한 높이 (그리드 레이아웃)
   * - false: 카드가 내용에 따라 다양한 높이를 가질 수 있음 (메이슨리 레이아웃)
   */
  fixedHeight: boolean;
  
  /**
   * 최대 카드 높이 (메이슨리 레이아웃에서 사용)
   * 메이슨리 레이아웃에서 카드의 최대 높이를 제한합니다.
   * null인 경우 제한 없음
   */
  maxCardHeight?: number | null;
  
  /**
   * 레이아웃 방향
   * - horizontal: 가로 방향으로 카드 배치 (뷰포트 너비 > 높이)
   * - vertical: 세로 방향으로 카드 배치 (뷰포트 너비 < 높이)
   */
  direction: LayoutDirection;
  
  /**
   * 스크롤 방향
   * - horizontal: 가로 스크롤
   * - vertical: 세로 스크롤
   */
  scrollDirection: ScrollDirection;
  
  /**
   * 레이아웃 계산
   * 주어진 컨테이너 크기와 아이템 수에 따라 레이아웃을 계산합니다.
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 수
   * @returns 계산된 레이아웃 정보
   */
  calculateLayout(containerWidth: number, containerHeight: number, itemCount: number): ILayoutInfo;
} 