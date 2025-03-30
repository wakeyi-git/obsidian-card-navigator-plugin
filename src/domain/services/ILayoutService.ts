import { Layout, ILayoutConfig } from '@/domain/models/Layout';
import { Card } from '@/domain/models/Card';
import { CardSet } from '@/domain/models/CardSet';

/**
 * 레이아웃 서비스 인터페이스
 */
export interface ILayoutService {
  /**
   * 서비스 초기화
   */
  initialize(): void;

  /**
   * 서비스 정리
   */
  cleanup(): void;

  /**
   * 레이아웃 설정 조회
   */
  getLayoutConfig(): ILayoutConfig;

  /**
   * 레이아웃 설정 업데이트
   */
  updateLayoutConfig(config: ILayoutConfig): void;

  /**
   * 레이아웃 생성
   */
  createLayout(name: string, description: string, config: ILayoutConfig): Promise<Layout>;

  /**
   * 레이아웃 업데이트
   */
  updateLayout(layout: Layout): Promise<void>;

  /**
   * 레이아웃 삭제
   */
  deleteLayout(id: string): Promise<void>;

  /**
   * 레이아웃 조회
   */
  getLayout(id: string): Promise<Layout | undefined>;

  /**
   * 모든 레이아웃 조회
   */
  getAllLayouts(): Promise<Layout[]>;

  /**
   * 뷰포트 크기 업데이트
   */
  updateViewportDimensions(layoutId: string, width: number, height: number): Promise<void>;

  /**
   * 카드 위치 업데이트
   */
  updateCardPosition(card: Card, x: number, y: number): void;

  /**
   * 카드 크기 업데이트
   */
  updateCardSize(card: Card, width: number, height: number): void;

  /**
   * 카드 Z-인덱스 업데이트
   */
  updateCardZIndex(card: Card, zIndex: number): void;

  /**
   * 카드 위치 초기화
   */
  resetCardPositions(layoutId: string): Promise<void>;

  /**
   * 레이아웃 계산
   */
  calculateLayout(cardSet: CardSet, containerWidth: number, containerHeight: number): void;

  /**
   * 카드 위치 업데이트 (일괄)
   */
  updateCardPositions(layoutId: string, positions: { cardId: string; x: number; y: number }[]): Promise<void>;

  /**
   * 카드 위치 추가
   */
  addCardPosition(layoutId: string, cardId: string, x: number, y: number, width: number, height: number): Promise<void>;

  /**
   * 카드 위치 제거
   */
  removeCardPosition(layoutId: string, cardId: string): Promise<void>;
} 