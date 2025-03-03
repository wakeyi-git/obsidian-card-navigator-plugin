/**
 * 리사이즈 이벤트 타입
 */
export enum ResizeEventType {
  /**
   * 크기 변경 이벤트
   */
  RESIZE = 'resize',
}

/**
 * 리사이즈 이벤트 데이터 인터페이스
 */
export interface ResizeEventData {
  /**
   * 컨테이너 너비
   */
  width: number;
  
  /**
   * 컨테이너 높이
   */
  height: number;
}

/**
 * 리사이즈 이벤트 리스너 타입
 */
export type ResizeEventListener = (data: ResizeEventData) => void;

/**
 * 리사이즈 관리자 생성자 인터페이스
 */
export interface IResizeManagerConstructor {
  /**
   * 리사이즈 관리자 생성
   * @param container 크기 변경을 감지할 컨테이너 요소
   * @param debounceDelay 디바운스 지연 시간 (밀리초)
   */
  new (container: HTMLElement, debounceDelay?: number): IResizeManager;
}

/**
 * 리사이즈 관리자 인터페이스
 * 컨테이너 크기 변경을 감지하고 처리하는 관리자를 정의합니다.
 */
export interface IResizeManager {
  /**
   * 리사이즈 관리자 초기화
   * ResizeObserver 또는 대체 방법을 사용하여 컨테이너 크기 변경을 감지합니다.
   */
  initialize(): void;
  
  /**
   * 리사이즈 콜백 설정
   * 컨테이너 크기가 변경될 때 호출될 콜백 함수를 설정합니다.
   * @param callback 리사이즈 콜백 함수 - 너비와 높이를 매개변수로 받습니다.
   * @deprecated 이벤트 리스너를 사용하는 것이 권장됩니다.
   */
  setResizeCallback(callback: (width: number, height: number) => void): void;
  
  /**
   * 리사이즈 이벤트 리스너 추가
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  addEventListener(eventType: ResizeEventType, listener: ResizeEventListener): void;
  
  /**
   * 리사이즈 이벤트 리스너 제거
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  removeEventListener(eventType: ResizeEventType, listener: ResizeEventListener): void;
  
  /**
   * 현재 컨테이너 크기 가져오기
   * @returns 컨테이너의 현재 너비와 높이
   */
  getCurrentSize(): { width: number; height: number };
  
  /**
   * 리사이즈 관리자 정리
   * 리소스를 해제하고 이벤트 리스너를 제거합니다.
   */
  destroy(): void;
} 