import { ICard, ICardStyle } from '../models/Card';
import { ILayoutConfig } from '../models/Layout';

/**
 * 카드 표시 상태를 나타내는 인터페이스
 */
export interface ICardDisplayState {
  /** 카드 요소 */
  readonly element: HTMLElement | null;
  /** 표시 여부 */
  readonly isVisible: boolean;
  /** Z-인덱스 */
  readonly zIndex: number;
  /** 활성 상태 */
  readonly isActive: boolean;
  /** 포커스 상태 */
  readonly isFocused: boolean;
  /** 선택 상태 */
  readonly isSelected: boolean;
}

/**
 * 상호작용 스타일을 나타내는 인터페이스
 */
export interface IInteractionStyle {
  /** 호버 효과 */
  readonly hoverEffect: string;
  /** 활성 효과 */
  readonly activeEffect: string;
  /** 포커스 효과 */
  readonly focusEffect: string;
  /** 선택 효과 */
  readonly selectedEffect: string;
  /** 전환 지속 시간 */
  readonly transitionDuration: string;
}

/**
 * 카드 표시 관리 담당
 * - 카드 DOM 요소 관리
 * - 카드 이벤트 리스너 관리
 * - 카드 스타일 관리
 * - 카드 상태 관리
 */
export interface ICardDisplayManager {
  /**
   * 표시 매니저를 초기화합니다.
   */
  initialize(): void;

  /**
   * 표시 매니저를 정리합니다.
   */
  cleanup(): void;

  /**
   * 표시 매니저가 초기화되었는지 확인합니다.
   * @returns 초기화 여부
   */
  isInitialized(): boolean;

  /**
   * 카드 DOM 요소를 등록합니다.
   * @param cardId 카드 ID
   * @param element 카드 DOM 요소
   */
  registerCardElement(cardId: string, element: HTMLElement): void;

  /**
   * 카드 DOM 요소를 등록 해제합니다.
   * @param cardId 카드 ID
   */
  unregisterCardElement(cardId: string): void;

  /**
   * 카드 DOM 요소를 가져옵니다.
   * @param cardId 카드 ID
   * @returns 카드 DOM 요소
   */
  getCardElement(cardId: string): HTMLElement | null;

  /**
   * 카드 이벤트 리스너를 추가합니다.
   * @param cardId 카드 ID
   * @param type 이벤트 타입
   * @param listener 이벤트 리스너
   */
  addCardEventListener(cardId: string, type: string, listener: EventListener): void;

  /**
   * 카드 이벤트 리스너를 제거합니다.
   * @param cardId 카드 ID
   * @param type 이벤트 타입
   * @param listener 이벤트 리스너
   */
  removeCardEventListener(cardId: string, type: string, listener: EventListener): void;

  /**
   * 카드 스타일을 적용합니다.
   * @param cardId 카드 ID
   * @param style 카드 스타일
   */
  applyCardStyle(cardId: string, style: ICardStyle): void;

  /**
   * 카드 상호작용 스타일을 적용합니다.
   * @param cardId 카드 ID
   * @param style 상호작용 스타일
   */
  applyInteractionStyle(cardId: string, style: IInteractionStyle): void;

  /**
   * 카드 레이아웃 스타일을 적용합니다.
   * @param cardId 카드 ID
   * @param layout 레이아웃 설정
   */
  applyLayoutStyle(cardId: string, layout: ILayoutConfig): void;

  /**
   * 컨테이너의 크기를 가져옵니다.
   * @returns 컨테이너의 너비와 높이
   */
  getContainerDimensions(): { width: number; height: number };

  /**
   * 카드 스타일을 가져옵니다.
   * @returns 카드 스타일
   */
  getCardStyle(): ICardStyle;

  /**
   * 카드의 표시 상태를 가져옵니다.
   * @param cardId 카드 ID
   * @returns 표시 상태
   */
  getCardState(cardId: string): ICardDisplayState | null;

  /**
   * 카드의 표시 상태를 업데이트합니다.
   * @param cardId 카드 ID
   * @param state 업데이트할 상태
   */
  updateCardState(cardId: string, state: Partial<ICardDisplayState>): void;

  /**
   * 카드 스타일을 업데이트합니다.
   * @param card 카드
   * @param style 스타일
   */
  updateCardStyle(card: ICard, style: 'normal' | 'active' | 'focused'): void;
} 