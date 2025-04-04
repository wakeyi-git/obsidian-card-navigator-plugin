import { ICardNavigatorView } from './ICardNavigatorView';
import { ICardRenderConfig } from '@/domain/models/CardRenderConfig';
import { ICardStyle } from '@/domain/models/CardStyle';

/**
 * 포커스 이동 방향
 */
export type FocusDirection = 'up' | 'down' | 'left' | 'right';

/**
 * 카드 내비게이터 뷰모델 인터페이스
 */
export interface ICardNavigatorViewModel {
  /**
   * 뷰 설정
   * @param view 뷰 인스턴스
   */
  setView(view: ICardNavigatorView): void;

  /**
   * 초기화
   */
  initialize(): Promise<void>;

  /**
   * 정리
   */
  cleanup(): Promise<void>;

  /**
   * 포커스 이동
   * @param direction 이동 방향
   */
  moveFocus(direction: FocusDirection): void;

  /**
   * 포커스된 카드 열기
   */
  openFocusedCard(): void;

  /**
   * 포커스 해제
   */
  clearFocus(): void;

  /**
   * 카드 선택
   * @param cardId 카드 ID
   */
  selectCard(cardId: string): Promise<void>;

  /**
   * 카드 선택 해제
   * @param cardId 카드 ID
   */
  deselectCard(cardId: string): Promise<void>;

  /**
   * 카드 범위 선택
   * @param cardId 카드 ID
   */
  selectCardsInRange(cardId: string): Promise<void>;

  /**
   * 카드 선택 토글
   * @param cardId 카드 ID
   */
  toggleCardSelection(cardId: string): Promise<void>;

  /**
   * 카드 포커스
   * @param cardId 카드 ID
   */
  focusCard(cardId: string): Promise<void>;

  /**
   * 카드 활성화
   * @param cardId 카드 ID
   */
  activateCard(cardId: string): Promise<void>;

  /**
   * 카드 비활성화
   * @param cardId 카드 ID
   */
  deactivateCard(cardId: string): Promise<void>;

  /**
   * 카드 컨텍스트 메뉴 표시
   * @param cardId 카드 ID
   * @param event 마우스 이벤트
   */
  showCardContextMenu(cardId: string, event: MouseEvent): void;

  /**
   * 카드 드래그 시작
   * @param cardId 카드 ID
   * @param event 드래그 이벤트
   */
  startCardDrag(cardId: string, event: DragEvent): void;

  /**
   * 카드 드래그 오버 처리
   * @param cardId 카드 ID
   * @param event 드래그 이벤트
   */
  handleCardDragOver(cardId: string, event: DragEvent): void;

  /**
   * 카드 드롭 처리
   * @param cardId 카드 ID
   * @param event 드래그 이벤트
   */
  handleCardDrop(cardId: string, event: DragEvent): void;

  /**
   * 카드셋 생성
   * @param type 카드셋 타입
   * @param criteria 기준
   */
  createCardSet(type: string, criteria: string): Promise<void>;

  /**
   * 카드 스크롤
   * @param cardId 카드 ID
   */
  scrollToCard(cardId: string): Promise<void>;

  /**
   * 컨테이너 크기 가져오기
   */
  getContainerDimensions(): { width: number; height: number };

  /**
   * 렌더링 설정 가져오기
   */
  getRenderConfig(): ICardRenderConfig;

  /**
   * 카드 스타일 가져오기
   */
  getCardStyle(): ICardStyle;

  /**
   * 두 카드 간의 링크를 생성합니다.
   * @param sourceCardId 소스 카드 ID
   * @param targetCardId 타겟 카드 ID
   */
  createLinkBetweenCards(sourceCardId: string, targetCardId: string): Promise<void>;
} 