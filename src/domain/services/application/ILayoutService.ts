import { LayoutType, LayoutDirection, ILayoutConfig } from '../../models/Layout';
import { ICardSet } from '../../models/CardSet';
import { ICard } from '../../models/Card';

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
  /** 카드 위치 */
  readonly cardPositions: Map<string, { x: number; y: number }>;
}

/**
 * 레이아웃 서비스 인터페이스
 * - 레이아웃 계산 및 관리
 * - 카드 위치 관리
 * - 레이아웃 설정 관리
 */
export interface ILayoutService {
  /**
   * 레이아웃 서비스를 초기화합니다.
   */
  initialize(): void;

  /**
   * 서비스의 초기화 상태를 확인합니다.
   * @returns 서비스가 초기화되었으면 true, 그렇지 않으면 false
   */
  isInitialized(): boolean;

  /**
   * 레이아웃 서비스를 정리합니다.
   */
  cleanup(): void;

  /**
   * 현재 레이아웃 설정을 가져옵니다.
   * @returns 레이아웃 설정
   */
  getLayoutConfig(): ILayoutConfig;

  /**
   * 레이아웃 설정을 업데이트합니다.
   * @param config 새 레이아웃 설정
   */
  updateLayoutConfig(config: ILayoutConfig): void;

  /**
   * 카드셋에 대한 레이아웃을 계산합니다.
   * @param cardSet 카드셋
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @returns 계산된 레이아웃 정보
   */
  calculateLayout(cardSet: ICardSet, containerWidth: number, containerHeight: number): ILayoutResult;

  /**
   * 뷰포트 크기를 업데이트합니다.
   * @param width 새 너비
   * @param height 새 높이
   */
  updateViewportDimensions(width: number, height: number): void;

  /**
   * 카드의 위치를 업데이트합니다.
   * @param cardId 카드 ID
   * @param x 새 x 좌표
   * @param y 새 y 좌표
   */
  updateCardPosition(cardId: string, x: number, y: number): void;

  /**
   * 모든 카드의 위치를 초기화합니다.
   */
  resetCardPositions(): void;

  /**
   * 기본 레이아웃 설정을 가져옵니다.
   * @returns 기본 레이아웃 설정
   */
  getDefaultLayoutConfig(): ILayoutConfig;

  /**
   * 컨테이너 너비에 따른 열 수를 계산합니다.
   * @param containerWidth 컨테이너 너비
   * @param config 레이아웃 설정
   * @returns 계산된 열 수
   */
  calculateColumnCount(containerWidth: number, config: ILayoutConfig): number;

  /**
   * 컨테이너 높이에 따른 행 수를 계산합니다.
   * @param containerHeight 컨테이너 높이
   * @param config 레이아웃 설정
   * @returns 계산된 행 수
   */
  calculateRowCount(containerHeight: number, config: ILayoutConfig): number;

  /**
   * 다음 카드를 가져옵니다.
   * @param currentCard 현재 카드
   * @param direction 이동 방향
   * @returns 다음 카드
   */
  getNextCard(currentCard: ICard, direction: LayoutDirection): ICard | null;

  /**
   * 카드 위치 조회
   * @param card 카드
   * @returns 카드 위치 또는 null
   */
  getCardPosition(card: ICard): { x: number; y: number } | null;

  /**
   * 카드 스타일을 업데이트합니다.
   * @param card 카드
   * @param style 스타일 타입
   */
  updateCardStyle(card: ICard, style: 'normal' | 'active' | 'focused'): void;
} 