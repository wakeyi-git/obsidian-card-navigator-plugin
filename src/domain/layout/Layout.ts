import { ICard } from '../card/Card';

/**
 * 레이아웃 타입 정의
 * 카드를 배치하는 방식을 정의합니다.
 * - grid: 모든 카드가 동일한 크기로 격자 형태로 배치됩니다.
 * - masonry: 카드의 높이가 내용에 따라 다양하게 배치됩니다.
 */
export type LayoutType = 'grid' | 'masonry';

/**
 * 레이아웃 방향 정의
 */
export type LayoutDirection = 'horizontal' | 'vertical' | 'auto';

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
  
  /**
   * 아이템 수
   * 레이아웃에 포함된 총 아이템 수
   */
  itemCount: number;
  
  /**
   * 컨테이너 너비
   * 레이아웃 계산에 사용된 컨테이너 너비
   */
  containerWidth: number;
  
  /**
   * 컨테이너 높이
   * 레이아웃 계산에 사용된 컨테이너 높이
   */
  containerHeight: number;
}

/**
 * 레이아웃 옵션
 */
export interface LayoutOptions {
  /**
   * 레이아웃 타입
   */
  type: 'grid' | 'masonry';

  /**
   * 카드 너비
   */
  cardWidth: number;

  /**
   * 카드 높이
   */
  cardHeight: number;

  /**
   * 카드 간격
   */
  gap: number;

  /**
   * 패딩
   */
  padding: number;

  /**
   * 레이아웃 방향
   */
  direction: 'auto' | 'vertical' | 'horizontal';
}

/**
 * 레이아웃 인터페이스
 * 카드 레이아웃을 정의하는 인터페이스입니다.
 */
export interface ILayout {
  id: string;
  type: LayoutType;
  options: LayoutOptions;
  cards: ICard[];
  direction: LayoutDirection;
  gap: number;
  padding: number;
  transition: string;
  metadata: Record<string, any>;
  created: number;
  updated: number;
  layoutAdapter?: any;
  eventBus?: any;

  /**
   * 레이아웃 초기화
   */
  initialize(): void;

  /**
   * 레이아웃 타입 설정
   */
  setLayoutType(type: LayoutType): void;

  /**
   * 레이아웃 옵션 설정
   */
  setLayoutOptions(options: Partial<LayoutOptions>): void;

  /**
   * 카드 추가
   */
  addCard(card: ICard): void;

  /**
   * 카드 제거
   */
  removeCard(cardId: string): void;

  /**
   * 카드 업데이트
   */
  updateCard(card: ICard): void;

  /**
   * 모든 카드 제거
   */
  clearCards(): void;

  /**
   * 레이아웃 업데이트
   */
  updateLayout(): void;

  /**
   * 레이아웃 ID
   */
  getId(): string;

  /**
   * 레이아웃 타입
   */
  getType(): LayoutType;

  /**
   * 레이아웃 옵션
   */
  getOptions(): LayoutOptions;

  /**
   * 레이아웃의 카드 목록
   */
  getCards(): ICard[];

  /**
   * 레이아웃 계산
   * 주어진 컨테이너 크기와 아이템 수에 따라 레이아웃을 계산합니다.
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 수
   * @returns 계산된 레이아웃 정보
   */
  calculateLayout(containerWidth: number, containerHeight: number, itemCount: number): ILayoutInfo;

  getDirection(): LayoutDirection;
  getGap(): number;
  getPadding(): number;
  getTransition(): string;
  getMetadata(): Record<string, any>;
  getCreated(): number;
  getUpdated(): number;
  setDirection(direction: LayoutDirection): void;
  setGap(gap: number): void;
  setPadding(padding: number): void;
  setTransition(transition: string): void;
  setMetadata(metadata: Record<string, any>): void;
  reset(): void;
} 