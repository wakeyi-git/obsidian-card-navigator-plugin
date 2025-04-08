import { ICard } from '../models/Card';
import { TFile } from 'obsidian';

/**
 * 카드 상태 인터페이스
 */
export interface ICardState {
  /** 모든 카드 */
  readonly cards: Map<string, ICard>;
  /** 활성 카드 ID */
  readonly activeCardId: string | null;
  /** 포커스된 카드 ID */
  readonly focusedCardId: string | null;
  /** 선택된 카드 ID 목록 */
  readonly selectedCardIds: Set<string>;
  /** 마지막 업데이트 시간 */
  readonly lastUpdated: number;
}

/**
 * 카드 관리자 인터페이스
 * - 카드 상태 관리
 *   - 활성/포커스/선택 상태 관리
 *   - 카드 목록 관리
 *   - 상태 변경 이벤트 발송
 * - 카드 생명주기 관리
 *   - 카드 등록/해제
 *   - 카드 상태 변경
 *   - 카드 캐시 관리
 */
export interface ICardManager {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 카드 상태 구독
   * @param callback 상태 변경 콜백
   */
  subscribe(callback: (state: ICardState) => void): void;

  /**
   * 카드 상태 구독 해제
   * @param callback 상태 변경 콜백
   */
  unsubscribe(callback: (state: ICardState) => void): void;

  /**
   * 카드를 등록합니다.
   * @param card 카드 객체
   */
  registerCard(card: ICard): void;

  /**
   * 카드를 해제합니다.
   * @param cardId 카드 ID
   */
  unregisterCard(cardId: string): void;

  /**
   * 파일로부터 카드 객체를 가져옵니다.
   * @param file 파일
   * @returns 카드 객체 또는 undefined
   */
  getCardByFile(file: TFile): ICard | undefined;

  /**
   * 카드 ID로부터 카드 객체를 가져옵니다.
   * @param cardId 카드 ID
   * @returns 카드 객체 또는 undefined
   */
  getCardById(cardId: string): ICard | undefined;

  /**
   * 모든 카드 객체를 가져옵니다.
   * @returns 카드 객체 배열
   */
  getAllCards(): ICard[];

  /**
   * 활성 카드를 설정합니다.
   * @param cardId 카드 ID
   */
  setActiveCard(cardId: string | null): void;

  /**
   * 포커스된 카드를 설정합니다.
   * @param cardId 카드 ID
   */
  setFocusedCard(cardId: string | null): void;

  /**
   * 카드를 선택합니다.
   * @param cardId 카드 ID
   * @param selected 선택 여부
   */
  selectCard(cardId: string, selected: boolean): void;

  /**
   * 모든 카드 선택을 해제합니다.
   */
  clearSelection(): void;

  /**
   * 카드 캐시를 갱신합니다.
   */
  refreshCache(): void;

  /**
   * 카드 상태를 가져옵니다.
   * @returns 카드 상태
   */
  getState(): ICardState;

  /**
   * 두 카드 간에 링크를 생성합니다.
   * @param sourceCard 소스 카드
   * @param targetCard 타겟 카드
   */
  createLinkBetweenCards(sourceCard: ICard, targetCard: ICard): void;
} 