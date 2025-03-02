import { Card } from '../models/Card';
import { ICardManager } from './ICardManager';
import { CardContainerEventData, CardContainerEventType } from '../types/card.types';
import { EventHandler } from '../types/common.types';

/**
 * 카드 컨테이너 관리자 인터페이스
 * 여러 카드를 포함하는 컨테이너를 관리하기 위한 메서드를 정의합니다.
 */
export interface ICardContainerManager {
  /**
   * 컨테이너를 초기화합니다.
   */
  initialize(): void;
  
  /**
   * 카드를 추가합니다.
   * @param card 추가할 카드
   * @returns 생성된 카드 관리자
   */
  addCard(card: Card): ICardManager;
  
  /**
   * 카드를 제거합니다.
   * @param cardId 제거할 카드 ID
   * @returns 제거 성공 여부
   */
  removeCard(cardId: string): boolean;
  
  /**
   * 모든 카드를 제거합니다.
   */
  clearCards(): void;
  
  /**
   * 카드를 가져옵니다.
   * @param cardId 가져올 카드 ID
   * @returns 카드 관리자 또는 undefined
   */
  getCard(cardId: string): ICardManager | undefined;
  
  /**
   * 모든 카드 관리자를 가져옵니다.
   * @returns 카드 관리자 배열
   */
  getAllCards(): ICardManager[];
  
  /**
   * 카드 수를 가져옵니다.
   * @returns 카드 수
   */
  getCardCount(): number;
  
  /**
   * 카드 배열을 설정합니다.
   * @param cards 설정할 카드 배열
   */
  setCards(cards: Card[]): void;
  
  /**
   * 레이아웃 업데이트 요청
   * 레이아웃 관리자에게 레이아웃 업데이트를 요청합니다.
   */
  requestLayoutUpdate(): void;
  
  /**
   * 카드를 선택합니다.
   * @param cardId 선택할 카드 ID
   */
  selectCard(cardId: string): void;
  
  /**
   * 카드 선택을 토글합니다.
   * @param cardId 토글할 카드 ID
   */
  toggleCardSelection(cardId: string): void;
  
  /**
   * 카드 선택을 해제합니다.
   * @param cardId 해제할 카드 ID
   */
  deselectCard(cardId: string): void;
  
  /**
   * 모든 카드 선택을 해제합니다.
   */
  clearSelection(): void;
  
  /**
   * 선택된 카드 ID 배열을 가져옵니다.
   * @returns 선택된 카드 ID 배열
   */
  getSelectedCardIds(): string[];
  
  /**
   * 카드가 선택되었는지 확인합니다.
   * @param cardId 확인할 카드 ID
   * @returns 선택 여부
   */
  isCardSelected(cardId: string): boolean;
  
  /**
   * 이벤트 리스너를 추가합니다.
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  addEventListener(eventType: CardContainerEventType, handler: EventHandler<CardContainerEventData>): void;
  
  /**
   * 이벤트 리스너를 제거합니다.
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  removeEventListener(eventType: CardContainerEventType, handler: EventHandler<CardContainerEventData>): void;
  
  /**
   * 컨테이너 관리자를 정리합니다.
   * 이벤트 리스너 등을 정리합니다.
   */
  destroy(): void;
} 