import { LayoutOptions, LayoutType, ICardPosition } from '../types/layout.types';
import { ICardContainerManager } from './ICardContainerManager';

/**
 * 레이아웃 관리자 인터페이스
 * 카드 컨테이너의 레이아웃을 관리합니다.
 */
export interface ILayoutManager {
  /**
   * 레이아웃 옵션
   */
  readonly options: LayoutOptions;
  
  /**
   * 레이아웃 타입
   * 현재 사용 중인 레이아웃 타입입니다.
   * 사용자 설정과 컨테이너 크기에 따라 자동으로 결정됩니다.
   */
  readonly layoutType: LayoutType;
  
  /**
   * 컨테이너 요소
   */
  readonly containerElement: HTMLElement;
  
  /**
   * 레이아웃 초기화
   * @param containerElement 컨테이너 요소
   * @param cardContainer 카드 컨테이너 관리자
   * @param options 레이아웃 옵션
   */
  initialize(containerElement: HTMLElement, cardContainer: ICardContainerManager, options?: Partial<LayoutOptions>): void;
  
  /**
   * 레이아웃 업데이트
   * 카드 위치를 재계산하고 적용합니다.
   */
  updateLayout(): void;
  
  /**
   * 레이아웃 옵션 설정
   * @param options 설정할 레이아웃 옵션
   */
  setOptions(options: Partial<LayoutOptions>): void;
  
  /**
   * 카드 위치 계산
   * @param cardIds 카드 ID 목록
   * @returns 카드 ID별 위치 맵
   */
  calculateCardPositions(cardIds: string[]): Map<string, ICardPosition>;
  
  /**
   * 카드 위치 적용
   * @param cardPositions 카드 ID별 위치 맵
   */
  applyCardPositions(cardPositions: Map<string, ICardPosition>): void;
  
  /**
   * 컨테이너 크기 변경 처리
   * @param width 새 너비
   * @param height 새 높이
   */
  handleResize(width: number, height: number): void;
  
  /**
   * 최적 레이아웃 타입 결정
   * 컨테이너 크기와 설정에 따라 최적의 레이아웃 타입을 결정합니다.
   * @returns 결정된 레이아웃 타입
   */
  determineLayoutType(): LayoutType;
  
  /**
   * 레이아웃 이벤트 리스너 추가
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  addEventListener(eventType: string, listener: EventListener): void;
  
  /**
   * 레이아웃 이벤트 리스너 제거
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  removeEventListener(eventType: string, listener: EventListener): void;
  
  /**
   * 레이아웃 관리자 소멸
   * 모든 리소스와 이벤트 리스너를 정리합니다.
   */
  destroy(): void;
} 