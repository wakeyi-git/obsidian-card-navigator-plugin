import { ILayoutConfig } from '../models/LayoutConfig';
import { ICardSet } from '../models/CardSet';
import { ILayoutResult } from '../models/Layout';

/**
 * 레이아웃 서비스 인터페이스
 */
export interface ILayoutService {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 초기화 여부 확인
   * @returns 초기화 여부
   */
  isInitialized(): boolean;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 레이아웃 설정 가져오기
   */
  getLayoutConfig(): ILayoutConfig;

  /**
   * 레이아웃 설정 업데이트
   * @param config 새 레이아웃 설정
   */
  updateLayoutConfig(config: ILayoutConfig): void;

  /**
   * 레이아웃 계산
   * @param cardSet 카드셋
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @returns 레이아웃 결과
   */
  calculateLayout(cardSet: ICardSet, containerWidth: number, containerHeight: number): ILayoutResult;

  /**
   * 뷰포트 크기 업데이트
   * @param width 너비
   * @param height 높이
   */
  updateViewportDimensions(width: number, height: number): void;

  /**
   * 카드 위치 업데이트
   * @param cardId 카드 ID
   * @param x x 좌표
   * @param y y 좌표
   */
  updateCardPosition(cardId: string, x: number, y: number): void;

  /**
   * 카드 위치 초기화
   */
  resetCardPositions(): void;

  /**
   * 기본 레이아웃 설정 가져오기
   */
  getDefaultLayoutConfig(): ILayoutConfig;

  /**
   * 레이아웃 타입 결정 
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param config 레이아웃 설정
   * @returns 레이아웃 타입
   */
  determineLayoutType(containerWidth: number, containerHeight: number, config: ILayoutConfig): string;

  /**
   * 레이아웃 방향 결정
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param config 레이아웃 설정
   * @returns 레이아웃 방향
   */
  determineLayoutDirection(containerWidth: number, containerHeight: number, config: ILayoutConfig): string;

  /**
   * 열 수 계산
   * @param containerWidth 컨테이너 너비
   * @param config 레이아웃 설정
   * @returns 열 수
   */
  calculateColumnCount(containerWidth: number, config: ILayoutConfig): number;

  /**
   * 행 수 계산
   * @param containerHeight 컨테이너 높이
   * @param config 레이아웃 설정
   * @returns 행 수
   */
  calculateRowCount(containerHeight: number, config: ILayoutConfig): number;
} 