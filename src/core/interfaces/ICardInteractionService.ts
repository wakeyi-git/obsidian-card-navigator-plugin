import { Card } from '../models/Card';
import { CardEventData, CardEventType } from '../types/card.types';
import { EventHandler } from '../types/common.types';

/**
 * 카드 상호작용 이벤트 핸들러 타입
 */
export interface CardInteractionHandlers {
  onClick?: (event: MouseEvent) => void;
  onContextMenu?: (event: MouseEvent) => void;
  onDragStart?: (event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
  onDragOver?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent) => void;
  onHover?: (event: MouseEvent) => void;
  onLeave?: (event: MouseEvent) => void;
  onDoubleClick?: (event: MouseEvent) => void;
}

/**
 * 카드 상호작용 서비스 인터페이스
 * 카드와의 사용자 상호작용을 처리하는 서비스의 인터페이스를 정의합니다.
 */
export interface ICardInteractionService {
  /**
   * 카드 클릭 처리
   * 카드 클릭 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 마우스 이벤트
   */
  handleCardClick(card: Card, event: MouseEvent): void;
  
  /**
   * 카드 컨텍스트 메뉴 처리
   * 카드 우클릭 이벤트를 처리하고 컨텍스트 메뉴를 표시합니다.
   * @param card 카드 객체
   * @param event 마우스 이벤트
   */
  handleCardContextMenu(card: Card, event: MouseEvent): void;
  
  /**
   * 카드 드래그 시작 처리
   * 카드 드래그 시작 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 드래그 이벤트
   */
  handleCardDragStart(card: Card, event: DragEvent): void;
  
  /**
   * 카드 드래그 종료 처리
   * 카드 드래그 종료 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 드래그 이벤트
   */
  handleCardDragEnd(card: Card, event: DragEvent): void;
  
  /**
   * 카드 호버 처리
   * 카드 마우스 오버 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 마우스 이벤트
   */
  handleCardHover(card: Card, event: MouseEvent): void;
  
  /**
   * 카드 호버 종료 처리
   * 카드 마우스 아웃 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 마우스 이벤트
   */
  handleCardLeave(card: Card, event: MouseEvent): void;
  
  /**
   * 이벤트 리스너 등록
   * 특정 카드 이벤트에 대한 리스너를 등록합니다.
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  addEventListener(eventType: CardEventType, handler: EventHandler<CardEventData>): void;
  
  /**
   * 이벤트 리스너 제거
   * 특정 카드 이벤트에 대한 리스너를 제거합니다.
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  removeEventListener(eventType: CardEventType, handler: EventHandler<CardEventData>): void;
  
  /**
   * 서비스 초기화
   * 상호작용 서비스를 초기화합니다.
   * @param options 초기화 옵션
   */
  initialize(options?: any): void;
  
  /**
   * 서비스 정리
   * 상호작용 서비스가 사용한 리소스를 정리합니다.
   */
  destroy(): void;
} 