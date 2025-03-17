import { ICard } from '../card/Card';

/**
 * 카드 컨테이너 인터페이스
 */
export interface ICardContainer {
  /**
   * 카드 요소 생성
   */
  createCardElement(): HTMLElement;

  /**
   * 카드 선택
   */
  select(): void;

  /**
   * 카드 선택 해제
   */
  deselect(): void;

  /**
   * 카드 포커스
   */
  focus(): void;

  /**
   * 카드 포커스 해제
   */
  unfocus(): void;

  /**
   * 카드 열기
   */
  open(): void;

  /**
   * 카드 닫기
   */
  close(): void;

  /**
   * 카드 요소 가져오기
   */
  getElement(): HTMLElement;

  /**
   * 카드 데이터 가져오기
   */
  getCard(): ICard;

  /**
   * 카드 선택 상태 확인
   */
  isSelected(): boolean;

  /**
   * 카드 포커스 상태 확인
   */
  isFocused(): boolean;

  /**
   * 카드 열림 상태 확인
   */
  isOpened(): boolean;

  /**
   * 컨테이너 제거
   */
  destroy(): void;
}

/**
 * 카드 컨테이너 클래스
 * 카드의 DOM 요소를 관리하고 이벤트를 처리
 */
export class CardContainer implements ICardContainer {
  private element: HTMLElement;
  private card: ICard;
  private isSelectedState = false;
  private isFocusedState = false;
  private isOpenedState = false;

  constructor(card: ICard) {
    this.card = card;
    this.element = this.createCardElement();
    this.setupEventListeners();
  }

  /**
   * 카드 요소 생성
   */
  createCardElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'card-container';
    element.dataset.cardId = this.card.getId();
    return element;
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    this.element.addEventListener('click', () => this.handleClick());
    this.element.addEventListener('dblclick', () => this.handleDoubleClick());
    this.element.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
  }

  /**
   * 클릭 이벤트 처리
   */
  private handleClick(): void {
    this.element.dispatchEvent(new CustomEvent('card-clicked', {
      detail: { card: this.card }
    }));
  }

  /**
   * 더블 클릭 이벤트 처리
   */
  private handleDoubleClick(): void {
    this.element.dispatchEvent(new CustomEvent('card-double-clicked', {
      detail: { card: this.card }
    }));
  }

  /**
   * 컨텍스트 메뉴 이벤트 처리
   */
  private handleContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.element.dispatchEvent(new CustomEvent('card-context-menu', {
      detail: { card: this.card, event }
    }));
  }

  /**
   * 카드 선택
   */
  select(): void {
    this.isSelectedState = true;
    this.element.classList.add('selected');
  }

  /**
   * 카드 선택 해제
   */
  deselect(): void {
    this.isSelectedState = false;
    this.element.classList.remove('selected');
  }

  /**
   * 카드 포커스
   */
  focus(): void {
    this.isFocusedState = true;
    this.element.classList.add('focused');
  }

  /**
   * 카드 포커스 해제
   */
  unfocus(): void {
    this.isFocusedState = false;
    this.element.classList.remove('focused');
  }

  /**
   * 카드 열기
   */
  open(): void {
    this.isOpenedState = true;
    this.element.classList.add('opened');
  }

  /**
   * 카드 닫기
   */
  close(): void {
    this.isOpenedState = false;
    this.element.classList.remove('opened');
  }

  /**
   * 카드 요소 가져오기
   */
  getElement(): HTMLElement {
    return this.element;
  }

  /**
   * 카드 가져오기
   */
  getCard(): ICard {
    return this.card;
  }

  /**
   * 카드 선택 상태 확인
   */
  isSelected(): boolean {
    return this.isSelectedState;
  }

  /**
   * 카드 포커스 상태 확인
   */
  isFocused(): boolean {
    return this.isFocusedState;
  }

  /**
   * 카드 열림 상태 확인
   */
  isOpened(): boolean {
    return this.isOpenedState;
  }

  /**
   * 컨테이너 제거
   */
  destroy(): void {
    this.element.remove();
  }
} 