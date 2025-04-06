import { ICardSet } from '../models/CardSet';
import { IRenderManager } from './IRenderManager';
import { ILayoutService } from '../services/ILayoutService';
import { ICardSelectionService } from '../services/ICardSelectionService';
import { ICardInteractionService } from '../services/ICardInteractionService';
import { IEventDispatcher } from '../infrastructure/IEventDispatcher';
import { ICard } from '../models/Card';
import { ICardStyle } from '../models/CardStyle';
import { ICardConfig } from '../models/CardConfig';

/**
 * UI 표시 관리 담당
 * - 카드 표시 관련 UI 이벤트 처리
 * - 카드 선택, 포커스, 스크롤 관리
 * - 카드 표시 상태 관리
 * - 카드 스타일 관리
 * - 카드 이벤트 처리
 */
export interface ICardDisplayManager {
  /**
   * 디스플레이 매니저를 초기화합니다.
   */
  initialize(): void;

  /**
   * 디스플레이 매니저를 정리합니다.
   */
  cleanup(): void;
  
  /**
   * 렌더링 매니저를 설정합니다.
   * @param renderManager 렌더링 매니저
   */
  setRenderManager(renderManager: IRenderManager): void;

  /**
   * 레이아웃 서비스를 설정합니다.
   * @param layoutService 레이아웃 서비스
   */
  setLayoutService(layoutService: ILayoutService): void;

  /**
   * 카드 선택 서비스를 설정합니다.
   * @param selectionService 카드 선택 서비스
   */
  setSelectionService(selectionService: ICardSelectionService): void;

  /**
   * 카드 상호작용 서비스를 설정합니다.
   * @param interactionService 카드 상호작용 서비스
   */
  setInteractionService(interactionService: ICardInteractionService): void;

  /**
   * 이벤트 디스패처를 설정합니다.
   * @param eventDispatcher 이벤트 디스패처
   */
  setEventDispatcher(eventDispatcher: IEventDispatcher): void;
  
  /**
   * 카드 셋을 표시합니다.
   * @param cardSet 카드 셋
   * @param transactionId 트랜잭션 ID
   */
  displayCardSet(cardSet: ICardSet, transactionId?: string): void;

  /**
   * 카드를 등록합니다.
   * @param cardId 카드 ID
   * @param element 카드 요소
   */
  registerCard(cardId: string, element: HTMLElement): void;

  /**
   * 카드를 선택합니다.
   * @param cardId 카드 ID
   */
  selectCard(cardId: string): void;

  /**
   * 카드에 포커스를 설정합니다.
   * @param cardId 카드 ID
   */
  focusCard(cardId: string): void;

  /**
   * 카드로 스크롤합니다.
   * @param cardId 카드 ID
   */
  scrollToCard(cardId: string): void;

  /**
   * 카드의 가시성을 업데이트합니다.
   * @param cardId 카드 ID
   * @param visible 가시성
   */
  updateCardVisibility(cardId: string, visible: boolean): void;

  /**
   * 카드의 Z-인덱스를 업데이트합니다.
   * @param cardId 카드 ID
   * @param zIndex Z-인덱스
   */
  updateCardZIndex(cardId: string, zIndex: number): void;
  
  /**
   * 활성 카드 ID를 반환합니다.
   * @returns 활성 카드 ID
   */
  getActiveCardId(): string | undefined | null;

  /**
   * 포커스된 카드 ID를 반환합니다.
   * @returns 포커스된 카드 ID
   */
  getFocusedCardId(): string | undefined | null;

  /**
   * 선택된 카드 ID 목록을 반환합니다.
   * @returns 선택된 카드 ID 목록
   */
  getSelectedCardIds(): string[];

  /**
   * 카드의 가시성을 확인합니다.
   * @param cardId 카드 ID
   * @returns 가시성 여부
   */
  isCardVisible(cardId: string): boolean;

  /**
   * 카드 스타일 업데이트
   * @param cardId 카드 ID
   * @param style 카드 스타일
   */
  updateCardStyle(cardId: string, style: ICardStyle): void;

  /**
   * 렌더링 설정 업데이트
   * @param config 카드 설정
   */
  updateRenderConfig(config: ICardConfig): void;
} 