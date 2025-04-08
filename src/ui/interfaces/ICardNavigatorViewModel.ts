import { ICardNavigatorView } from './ICardNavigatorView';
import { ICardStyle, IRenderConfig } from '@/domain/models/Card';
import { ICardSet, CardSetType } from '@/domain/models/CardSet';
import { BehaviorSubject } from 'rxjs';
import { ICardNavigatorState } from '@/domain/models/CardNavigatorState';
import { ICard } from '@/domain/models/Card';
import { ISearchConfig } from '@/domain/models/Search';
import { ISortConfig } from '@/domain/models/Sort';

/**
 * 포커스 이동 방향
 */
export type FocusDirection = 'up' | 'down' | 'left' | 'right';

/**
 * 카드 내비게이터 뷰모델 인터페이스
 */
export interface ICardNavigatorViewModel {
  /**
   * 상태 관리
   */
  readonly state: BehaviorSubject<ICardNavigatorState>;

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
  selectCard(cardId: string): void;

  /**
   * 카드 선택 해제
   * @param cardId 카드 ID
   */
  deselectCard(cardId: string): void;

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
   * 카드 클릭 처리
   * @param cardId 카드 ID
   */
  handleCardClick(cardId: string): Promise<void>;

  /**
   * 카드 더블 클릭 처리
   * @param cardId 카드 ID
   */
  handleCardDoubleClick(cardId: string): Promise<void>;

  /**
   * 카드 드래그 시작
   * @param cardId 카드 ID
   * @param event 드래그 이벤트
   */
  handleCardDragStart(cardId: string, event: DragEvent): void;

  /**
   * 카드 드래그 종료
   * @param cardId 카드 ID
   * @param event 드래그 이벤트
   */
  handleCardDragEnd(cardId: string, event: DragEvent): void;

  /**
   * 카드 드롭
   * @param cardId 카드 ID
   * @param event 드롭 이벤트
   */
  handleCardDrop(cardId: string, event: DragEvent): void;

  /**
   * 카드 드래그 오버
   * @param cardId 카드 ID
   * @param event 드래그 오버 이벤트
   */
  handleCardDragOver(cardId: string, event: DragEvent): void;

  /**
   * 카드 드래그 엔터
   * @param cardId 카드 ID
   * @param event 드래그 엔터 이벤트
   */
  handleCardDragEnter(cardId: string, event: DragEvent): void;

  /**
   * 카드 드래그 리브
   * @param cardId 카드 ID
   * @param event 드래그 리브 이벤트
   */
  handleCardDragLeave(cardId: string, event: DragEvent): void;

  /**
   * 카드 간 링크 생성
   * @param sourceCardId 소스 카드 ID
   * @param targetCardId 타겟 카드 ID
   */
  createLinkBetweenCards(sourceCardId: string, targetCardId: string): Promise<void>;

  /**
   * 렌더링 설정 가져오기
   */
  getRenderConfig(): IRenderConfig;

  /**
   * 카드 스타일 가져오기
   */
  getCardStyle(): ICardStyle;

  /**
   * 현재 카드셋 가져오기
   */
  getCurrentCardSet(): ICardSet | null;

  /**
   * 카드셋 업데이트
   * @param cardSet 카드셋
   */
  updateCardSet(cardSet: ICardSet): void;

  /**
   * 상태 업데이트
   * @param state 상태
   */
  updateState(state: ICardNavigatorState): void;

  /**
   * 카드셋 변경
   * @param cardSetType 카드셋 타입
   */
  changeCardSet(cardSetType: CardSetType): Promise<void>;

  /**
   * 카드 검색
   * @param query 검색어
   * @param config 검색 설정
   */
  search(query: string, config?: ISearchConfig): Promise<void>;

  /**
   * 카드 정렬
   * @param config 정렬 설정
   */
  sort(config: ISortConfig): Promise<void>;

  /**
   * 설정 열기
   */
  openSettings(): void;

  /**
   * 카드 드래그 시작
   * @param cardId 카드 ID
   * @param event 드래그 이벤트
   */
  startCardDrag(cardId: string, event: DragEvent): void;
} 