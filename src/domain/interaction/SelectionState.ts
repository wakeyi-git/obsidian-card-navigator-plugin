import { ICard } from '../card/Card';

/**
 * 선택 모드 타입
 * 카드 선택 방식을 정의합니다.
 */
export type SelectionMode = 'single' | 'multiple' | 'range';

/**
 * 선택 상태 인터페이스
 * 카드 선택 상태를 관리하기 위한 인터페이스입니다.
 */
export interface ISelectionState {
  /**
   * 선택된 카드 목록
   */
  selectedCards: ICard[];
  
  /**
   * 마지막으로 선택된 카드
   */
  lastSelectedCard: ICard | null;
  
  /**
   * 현재 선택 모드
   */
  selectionMode: SelectionMode;
}

/**
 * 선택 상태 변경 이벤트 데이터 인터페이스
 */
export interface SelectionChangedEventData {
  /**
   * 선택된 카드 목록
   */
  selectedCards: ICard[];
  
  /**
   * 선택된 카드 수
   */
  count: number;
  
  /**
   * 마지막으로 선택된 카드
   */
  lastSelectedCard: ICard | null;
  
  /**
   * 현재 선택 모드
   */
  selectionMode: SelectionMode;
} 