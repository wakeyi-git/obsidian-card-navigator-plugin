import { Card } from '../models/Card';
import { CardEventType, CardState } from '../types/card.types';

/**
 * 카드 관리자 인터페이스
 * 개별 카드의 UI 상태와 상호작용을 관리합니다.
 */
export interface ICardManager {
  /**
   * 카드 ID
   */
  readonly cardId: string;
  
  /**
   * 카드 객체
   */
  readonly card: Card;
  
  /**
   * 카드 요소
   */
  readonly element: HTMLElement;
  
  /**
   * 카드 상태
   */
  readonly state: CardState;
  
  /**
   * 카드 관리자 초기화
   */
  initialize(): void;
  
  /**
   * 카드 UI 새로고침
   * 카드 UI를 최신 상태로 업데이트합니다.
   */
  refreshUI(): void;
  
  /**
   * 카드 데이터 업데이트
   * @param card 업데이트할 카드 데이터
   */
  updateCardData(card: Card): void;
  
  /**
   * 카드 위치 설정
   * @param x X 좌표
   * @param y Y 좌표
   * @param width 너비
   * @param height 높이
   */
  setPosition(x: number, y: number, width: number, height: number): void;
  
  /**
   * 카드 상태 설정
   * @param state 설정할 카드 상태
   */
  setState(state: CardState): void;
  
  /**
   * 카드 이벤트 리스너 추가
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  addEventListener(eventType: CardEventType, listener: EventListener): void;
  
  /**
   * 카드 이벤트 리스너 제거
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  removeEventListener(eventType: CardEventType, listener: EventListener): void;
  
  /**
   * 카드 관리자 소멸
   * 모든 리소스와 이벤트 리스너를 정리합니다.
   */
  destroy(): void;
} 