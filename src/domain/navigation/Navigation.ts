import { ICard } from '../card/Card';
import { 
  INavigationService, 
  KeyboardNavigationDirection, 
  ScrollBehavior
} from './NavigationInterfaces';
import { DomainEventBus } from '../events/DomainEventBus';
import { EventType } from '../events/EventTypes';

/**
 * 네비게이션 클래스
 * 카드 네비게이션 기능을 구현합니다.
 */
export class Navigation implements INavigationService {
  /**
   * 카드 목록
   */
  private cards: ICard[] = [];
  
  /**
   * 포커스된 카드 인덱스
   */
  private focusedIndex = -1;
  
  /**
   * 활성 카드
   */
  private activeCard: ICard | null = null;
  
  /**
   * 활성 카드 인덱스
   */
  private activeCardIndex = -1;
  
  /**
   * 스크롤 동작
   */
  private scrollBehavior: ScrollBehavior = 'smooth';
  
  /**
   * 이벤트 버스
   */
  private eventBus: DomainEventBus;
  
  /**
   * 그리드 레이아웃 정보
   */
  private gridInfo: {
    columns: number;
    rows: number;
  } = {
    columns: 1,
    rows: 1
  };
  
  /**
   * 생성자
   * @param eventBus 이벤트 버스
   */
  constructor(eventBus: DomainEventBus) {
    this.eventBus = eventBus;
  }
  
  /**
   * 카드 목록 설정
   * @param cards 카드 목록
   */
  setCards(cards: ICard[]): void {
    this.cards = cards;
    
    // 활성 카드 인덱스 업데이트
    if (this.activeCard) {
      this.activeCardIndex = this.cards.findIndex(card => card.getId() === this.activeCard?.getId());
    }
    
    // 포커스된 카드 인덱스 업데이트
    if (this.focusedIndex >= this.cards.length) {
      this.focusedIndex = this.cards.length > 0 ? 0 : -1;
    }
  }
  
  /**
   * 그리드 정보 설정
   * @param columns 열 수
   * @param rows 행 수
   */
  setGridInfo(columns: number, rows: number): void {
    this.gridInfo = { columns, rows };
  }
  
  /**
   * 키보드 이벤트 처리
   * @param event 키보드 이벤트
   * @returns 이벤트 처리 여부
   */
  async handleKeyEvent(event: KeyboardEvent): Promise<boolean> {
    if (this.cards.length === 0) {
      return false;
    }
    
    switch (event.key) {
      case 'ArrowUp':
        return this.navigate('up');
      case 'ArrowDown':
        return this.navigate('down');
      case 'ArrowLeft':
        return this.navigate('left');
      case 'ArrowRight':
        return this.navigate('right');
      case 'Enter':
        return await this.openFocusedCard();
      case 'e':
      case 'E':
        if (event.ctrlKey || event.metaKey) {
          return await this.editFocusedCard();
        }
        return false;
      default:
        return false;
    }
  }
  
  /**
   * 방향키 이동
   * @param direction 이동 방향
   * @returns 이동 성공 여부
   */
  navigate(direction: KeyboardNavigationDirection): boolean {
    if (this.cards.length === 0) {
      return false;
    }
    
    // 포커스된 카드가 없으면 첫 번째 카드 포커스
    if (this.focusedIndex === -1) {
      return this.focusCard(0);
    }
    
    const { columns, rows } = this.gridInfo;
    let newIndex = this.focusedIndex;
    
    switch (direction) {
      case 'up':
        newIndex = this.focusedIndex - columns;
        break;
      case 'down':
        newIndex = this.focusedIndex + columns;
        break;
      case 'left':
        newIndex = this.focusedIndex - 1;
        break;
      case 'right':
        newIndex = this.focusedIndex + 1;
        break;
    }
    
    // 인덱스 범위 확인
    if (newIndex < 0 || newIndex >= this.cards.length) {
      return false;
    }
    
    // 좌우 이동 시 행 경계 확인
    if (direction === 'left' && this.focusedIndex % columns === 0) {
      return false;
    }
    if (direction === 'right' && (this.focusedIndex + 1) % columns === 0) {
      return false;
    }
    
    return this.focusCard(newIndex);
  }
  
  /**
   * 현재 포커스된 카드 열기
   * @returns 성공 여부
   */
  async openFocusedCard(): Promise<boolean> {
    const focusedCard = this.getFocusedCard();
    if (!focusedCard) {
      return false;
    }
    
    this.emit(EventType.CARD_OPENED, { card: focusedCard });
    return true;
  }
  
  /**
   * 현재 포커스된 카드 편집
   * @returns 성공 여부
   */
  async editFocusedCard(): Promise<boolean> {
    const focusedCard = this.getFocusedCard();
    if (!focusedCard) {
      return false;
    }
    
    // 편집 이벤트 발생
    this.emit(EventType.CARD_OPENED, { card: focusedCard, editMode: true });
    return true;
  }
  
  /**
   * 현재 포커스된 카드 인덱스 가져오기
   * @returns 포커스된 카드 인덱스 또는 -1
   */
  getFocusedIndex(): number {
    return this.focusedIndex;
  }
  
  /**
   * 특정 카드로 스크롤
   * @param cardIndex 카드 인덱스
   * @param behavior 스크롤 동작
   */
  scrollToCard(cardIndex: number, behavior?: ScrollBehavior): void {
    // 실제 스크롤 동작은 UI 레이어에서 구현
    // 여기서는 이벤트만 발생시킴
    this.emit(EventType.FOCUS_CHANGED, { 
      focusedIndex: cardIndex, 
      scrollBehavior: behavior || this.scrollBehavior 
    });
  }
  
  /**
   * 활성 카드로 스크롤
   * @param behavior 스크롤 동작
   */
  scrollToActiveCard(behavior?: ScrollBehavior): void {
    if (this.activeCardIndex !== -1) {
      this.scrollToCard(this.activeCardIndex, behavior);
    }
  }
  
  /**
   * 포커스된 카드로 스크롤
   * @param behavior 스크롤 동작
   */
  scrollToFocusedCard(behavior?: ScrollBehavior): void {
    if (this.focusedIndex !== -1) {
      this.scrollToCard(this.focusedIndex, behavior);
    }
  }
  
  /**
   * 스크롤 동작 설정
   * @param behavior 스크롤 동작
   */
  setScrollBehavior(behavior: ScrollBehavior): void {
    this.scrollBehavior = behavior;
  }
  
  /**
   * 현재 스크롤 동작 가져오기
   * @returns 스크롤 동작
   */
  getScrollBehavior(): ScrollBehavior {
    return this.scrollBehavior;
  }
  
  /**
   * 카드 포커스
   * @param cardIndex 카드 인덱스
   * @returns 성공 여부
   */
  focusCard(cardIndex: number): boolean {
    if (cardIndex < 0 || cardIndex >= this.cards.length) {
      return false;
    }
    
    this.focusedIndex = cardIndex;
    this.scrollToFocusedCard();
    this.emit(EventType.FOCUS_CHANGED, { focusedIndex: cardIndex });
    return true;
  }
  
  /**
   * 활성 카드 포커스
   * @returns 성공 여부
   */
  focusActiveCard(): boolean {
    if (this.activeCardIndex === -1) {
      return false;
    }
    
    return this.focusCard(this.activeCardIndex);
  }
  
  /**
   * 다음 카드 포커스
   * @returns 성공 여부
   */
  focusNextCard(): boolean {
    if (this.focusedIndex === -1) {
      return this.focusCard(0);
    }
    
    if (this.focusedIndex < this.cards.length - 1) {
      return this.focusCard(this.focusedIndex + 1);
    }
    
    return false;
  }
  
  /**
   * 이전 카드 포커스
   * @returns 성공 여부
   */
  focusPreviousCard(): boolean {
    if (this.focusedIndex === -1) {
      return this.focusCard(0);
    }
    
    if (this.focusedIndex > 0) {
      return this.focusCard(this.focusedIndex - 1);
    }
    
    return false;
  }
  
  /**
   * 포커스된 카드 가져오기
   * @returns 포커스된 카드 또는 null
   */
  getFocusedCard(): ICard | null {
    if (this.focusedIndex === -1 || this.focusedIndex >= this.cards.length) {
      return null;
    }
    
    return this.cards[this.focusedIndex];
  }
  
  /**
   * 포커스된 카드 인덱스 가져오기
   * @returns 포커스된 카드 인덱스 또는 -1
   */
  getFocusedCardIndex(): number {
    return this.focusedIndex;
  }
  
  /**
   * 활성 카드 설정
   * @param card 카드
   */
  setActiveCard(card: ICard): void {
    this.activeCard = card;
    this.activeCardIndex = this.cards.findIndex(c => c.getId() === card.getId());
    this.emit(EventType.ACTIVE_CARD_CHANGED, { card });
  }
  
  /**
   * 활성 카드 가져오기
   * @returns 활성 카드 또는 null
   */
  getActiveCard(): ICard | null {
    return this.activeCard;
  }
  
  /**
   * 활성 카드 인덱스 가져오기
   * @returns 활성 카드 인덱스 또는 -1
   */
  getActiveCardIndex(): number {
    return this.activeCardIndex;
  }
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  on(event: EventType, listener: (...args: any[]) => void): void {
    this.eventBus.on(event, listener);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  off(event: EventType, listener: (...args: any[]) => void): void {
    this.eventBus.off(event, listener);
  }
  
  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param data 이벤트 데이터
   */
  emit(event: EventType, data: any): void {
    this.eventBus.emit(event, data);
  }
} 