import { ICardSet } from '../models/CardSet';
import { ICardRenderConfig } from '../models/CardRenderConfig';
import { ICardStyle } from '../models/CardStyle';

/**
 * 카드 표시 관리자 인터페이스
 * - 카드 표시 관련 UI 이벤트 처리
 * - 카드 선택, 포커스, 스크롤 관리
 * - 카드 표시 상태 관리
 */
export interface ICardDisplayManager {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 카드셋 표시
   * @param cardSet 카드셋
   * @param transactionId 트랜잭션 ID (선택 사항)
   */
  displayCardSet(cardSet: ICardSet, transactionId?: string): void;

  /**
   * 카드 등록
   * @param cardId 카드 ID
   * @param element 카드 요소
   */
  registerCard(cardId: string, element: HTMLElement): void;

  /**
   * 카드 선택
   * @param cardId 카드 ID
   */
  selectCard(cardId: string): void;

  /**
   * 카드 포커스
   * @param cardId 카드 ID
   */
  focusCard(cardId: string): void;

  /**
   * 카드 스크롤
   * @param cardId 카드 ID
   */
  scrollToCard(cardId: string): void;

  /**
   * 카드 스타일 업데이트
   * @param cardId 카드 ID
   * @param style 스타일
   */
  updateCardStyle(cardId: string, style: ICardStyle): void;

  /**
   * 카드 렌더링 설정 업데이트
   * @param config 렌더링 설정
   */
  updateRenderConfig(config: ICardRenderConfig): void;

  /**
   * 카드 표시 상태 업데이트
   * @param cardId 카드 ID
   * @param visible 표시 여부
   */
  updateCardVisibility(cardId: string, visible: boolean): void;

  /**
   * 카드 Z-인덱스 업데이트
   * @param cardId 카드 ID
   * @param zIndex Z-인덱스
   */
  updateCardZIndex(cardId: string, zIndex: number): void;

  /**
   * 활성 카드 ID 반환
   */
  getActiveCardId(): string | null;

  /**
   * 포커스된 카드 ID 반환
   */
  getFocusedCardId(): string | null;

  /**
   * 선택된 카드 ID 목록 반환
   */
  getSelectedCardIds(): string[];

  /**
   * 카드 표시 여부 확인
   * @param cardId 카드 ID
   */
  isCardVisible(cardId: string): boolean;
} 