import { ICardContainerManager } from './ICardContainerManager';
import { ICardPosition, LayoutOptions, LayoutType } from '../../types/layout.types';

/**
 * 레이아웃 관리자 인터페이스
 * 
 * 카드 컨테이너의 레이아웃을 관리하는 인터페이스입니다.
 * 레이아웃 초기화, 업데이트, 카드 위치 계산 등의 기능을 제공합니다.
 */
export interface ILayoutManager {
  /**
   * 레이아웃 옵션
   */
  readonly options: LayoutOptions;
  
  /**
   * 레이아웃 타입
   */
  readonly layoutType: LayoutType;
  
  /**
   * 컨테이너 요소
   */
  readonly containerElement: HTMLElement | null;
  
  /**
   * 레이아웃 초기화
   * @param containerElement 컨테이너 요소
   * @param cardContainer 카드 컨테이너 관리자
   * @param options 레이아웃 옵션
   */
  initialize(
    containerElement: HTMLElement, 
    cardContainer: ICardContainerManager, 
    options?: Partial<LayoutOptions>
  ): void;
  
  /**
   * 레이아웃 업데이트
   * 카드 위치를 다시 계산하고 적용합니다.
   */
  updateLayout(): void;
  
  /**
   * 레이아웃 옵션 설정
   * @param options 레이아웃 옵션
   */
  setOptions(options: Partial<LayoutOptions>): void;
  
  /**
   * 카드 위치 계산
   * @param cardIds 카드 ID 배열
   * @returns 카드 ID를 키로 하고 위치 정보를 값으로 하는 맵
   */
  calculateCardPositions(cardIds: string[]): Map<string, ICardPosition>;
  
  /**
   * 카드 위치 적용
   * @param positions 카드 위치 맵
   * @param animate 애니메이션 적용 여부
   */
  applyCardPositions(positions: Map<string, ICardPosition>, animate?: boolean): void;
  
  /**
   * 컨테이너 크기 변경 처리
   * 컨테이너 크기가 변경되었을 때 레이아웃을 업데이트합니다.
   */
  handleContainerResize(): void;
  
  /**
   * 레이아웃 타입 결정
   * 컨테이너 크기와 옵션에 따라 적절한 레이아웃 타입을 결정합니다.
   * @returns 레이아웃 타입
   */
  determineLayoutType(): LayoutType;
  
  /**
   * 레이아웃 타입 설정
   * @param type 레이아웃 타입
   */
  setLayoutType(type: LayoutType): void;
  
  /**
   * 레이아웃 클래스 적용
   * 레이아웃 타입에 따라 컨테이너에 적절한 CSS 클래스를 적용합니다.
   */
  applyLayoutClasses(): void;
  
  /**
   * 이벤트 리스너 등록
   * 레이아웃 관련 이벤트 리스너를 등록합니다.
   */
  registerEventListeners(): void;
  
  /**
   * 이벤트 리스너 제거
   * 레이아웃 관련 이벤트 리스너를 제거합니다.
   */
  removeEventListeners(): void;
  
  /**
   * 이벤트 리스너 추가
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  addEventListener(eventType: string, listener: EventListener): void;
  
  /**
   * 이벤트 리스너 제거
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  removeEventListener(eventType: string, listener: EventListener): void;
  
  /**
   * 소멸
   * 레이아웃 관리자를 정리합니다.
   */
  destroy(): void;
} 