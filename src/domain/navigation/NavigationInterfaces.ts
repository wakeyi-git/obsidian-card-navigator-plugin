import { ICard } from '../card/Card';
import { EventType } from '../events/EventTypes';

/**
 * 키보드 내비게이션 방향
 */
export type KeyboardNavigationDirection = 'up' | 'down' | 'left' | 'right';

/**
 * 스크롤 동작 타입
 */
export type ScrollBehavior = 'smooth' | 'instant';

/**
 * 내비게이션 모드
 */
export type NavigationMode = 'grid' | 'linear';

/**
 * 포커스 관리자 인터페이스
 * 카드 포커스 관련 기능을 제공합니다.
 */
export interface IFocusManager {
  /**
   * 카드 포커스
   * @param cardIndex 카드 인덱스
   * @returns 성공 여부
   */
  focusCard(cardIndex: number): boolean;
  
  /**
   * 활성 카드 포커스
   * @returns 성공 여부
   */
  focusActiveCard(): boolean;
  
  /**
   * 다음 카드 포커스
   * @returns 성공 여부
   */
  focusNextCard(): boolean;
  
  /**
   * 이전 카드 포커스
   * @returns 성공 여부
   */
  focusPreviousCard(): boolean;
  
  /**
   * 포커스된 카드 가져오기
   * @returns 포커스된 카드 또는 null
   */
  getFocusedCard(): ICard | null;
  
  /**
   * 포커스된 카드 인덱스 가져오기
   * @returns 포커스된 카드 인덱스 또는 -1
   */
  getFocusedCardIndex(): number;
}

/**
 * 키보드 내비게이션 인터페이스
 * 키보드를 이용한 카드 내비게이션을 정의합니다.
 */
export interface IKeyboardNavigation {
  /**
   * 키보드 이벤트 처리
   * @param event 키보드 이벤트
   * @returns 이벤트 처리 여부
   */
  handleKeyEvent(event: KeyboardEvent): Promise<boolean>;
  
  /**
   * 방향키 이동
   * @param direction 이동 방향
   * @returns 이동 성공 여부
   */
  navigate(direction: KeyboardNavigationDirection): boolean;
  
  /**
   * 현재 포커스된 카드 열기
   * @returns 성공 여부
   */
  openFocusedCard(): Promise<boolean>;
  
  /**
   * 현재 포커스된 카드 편집
   * @returns 성공 여부
   */
  editFocusedCard(): Promise<boolean>;
  
  /**
   * 현재 포커스된 카드 인덱스 가져오기
   * @returns 포커스된 카드 인덱스 또는 -1
   */
  getFocusedIndex(): number;
}

/**
 * 스크롤 내비게이션 인터페이스
 * 스크롤을 이용한 카드 내비게이션을 정의합니다.
 */
export interface IScrollNavigation {
  /**
   * 특정 카드로 스크롤
   * @param cardIndex 카드 인덱스
   * @param behavior 스크롤 동작
   */
  scrollToCard(cardIndex: number, behavior?: ScrollBehavior): void;
  
  /**
   * 활성 카드로 스크롤
   * @param behavior 스크롤 동작
   */
  scrollToActiveCard(behavior?: ScrollBehavior): void;
  
  /**
   * 포커스된 카드로 스크롤
   * @param behavior 스크롤 동작
   */
  scrollToFocusedCard(behavior?: ScrollBehavior): void;
  
  /**
   * 스크롤 동작 설정
   * @param behavior 스크롤 동작
   */
  setScrollBehavior(behavior: ScrollBehavior): void;
  
  /**
   * 현재 스크롤 동작 가져오기
   * @returns 스크롤 동작
   */
  getScrollBehavior(): ScrollBehavior;
}

/**
 * 활성 카드 관리 인터페이스
 * 활성 카드 관리를 정의합니다.
 */
export interface IActiveCardManager {
  /**
   * 활성 카드 설정
   * @param card 카드
   */
  setActiveCard(card: ICard): void;
  
  /**
   * 활성 카드 가져오기
   * @returns 활성 카드 또는 null
   */
  getActiveCard(): ICard | null;
  
  /**
   * 활성 카드 인덱스 가져오기
   * @returns 활성 카드 인덱스 또는 -1
   */
  getActiveCardIndex(): number;
}

/**
 * 네비게이션 이벤트 관리 인터페이스
 * 네비게이션 이벤트 관련 기능을 제공합니다.
 */
export interface INavigationEventManager {
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  on(event: EventType, listener: (...args: any[]) => void): void;
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  off(event: EventType, listener: (...args: any[]) => void): void;
  
  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param data 이벤트 데이터
   */
  emit(event: EventType, data: any): void;
}

/**
 * 통합 네비게이션 서비스 인터페이스
 * 모든 네비게이션 관련 인터페이스를 통합합니다.
 */
export interface INavigationService extends 
  IKeyboardNavigation,
  IScrollNavigation,
  IFocusManager,
  IActiveCardManager,
  INavigationEventManager {
} 