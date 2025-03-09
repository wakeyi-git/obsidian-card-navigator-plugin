import { App } from 'obsidian';
import { ICard } from '../domain/card/index';
import { ICardInteraction, IKeyboardNavigation, KeyboardNavigationDirection, IMultiSelection } from '../domain/interaction/index';
import { ICardService } from './CardService';

/**
 * 상호작용 서비스 인터페이스
 * 카드 상호작용 관련 기능을 제공합니다.
 */
export interface IInteractionService extends ICardInteraction, IKeyboardNavigation, IMultiSelection {
  /**
   * 카드 클릭 이벤트 처리
   * @param card 클릭된 카드
   * @param event 마우스 이벤트
   * @returns 처리 여부
   */
  handleCardClick(card: ICard, event: MouseEvent): boolean;
  
  /**
   * 카드 더블 클릭 이벤트 처리
   * @param card 더블 클릭된 카드
   * @param event 마우스 이벤트
   * @returns 처리 여부
   */
  handleCardDoubleClick(card: ICard, event: MouseEvent): boolean;
  
  /**
   * 카드 컨텍스트 메뉴 이벤트 처리
   * @param card 컨텍스트 메뉴가 열린 카드
   * @param event 마우스 이벤트
   * @returns 처리 여부
   */
  handleCardContextMenu(card: ICard, event: MouseEvent): boolean;
  
  /**
   * 카드 드래그 시작 이벤트 처리
   * @param card 드래그 시작된 카드
   * @param event 드래그 이벤트
   * @returns 처리 여부
   */
  handleCardDragStart(card: ICard, event: DragEvent): boolean;
  
  /**
   * 카드 드래그 종료 이벤트 처리
   * @param card 드래그 종료된 카드
   * @param event 드래그 이벤트
   * @returns 처리 여부
   */
  handleCardDragEnd(card: ICard, event: DragEvent): boolean;
  
  /**
   * 카드 드롭 이벤트 처리
   * @param card 드롭된 카드
   * @param event 드래그 이벤트
   * @returns 처리 여부
   */
  handleCardDrop(card: ICard, event: DragEvent): boolean;
  
  /**
   * 포커스된 카드 설정
   * @param card 포커스할 카드
   */
  setFocusedCard(card: ICard | null): void;
  
  /**
   * 활성화된 카드 설정
   * @param card 활성화할 카드
   */
  setActiveCard(card: ICard | null): void;
  
  /**
   * 카드 목록 설정
   * @param cards 카드 목록
   */
  setCards(cards: ICard[]): void;
  
  /**
   * 포커스된 카드 가져오기
   * @returns 포커스된 카드 또는 null
   */
  getFocusedCard(): ICard | null;
  
  /**
   * 활성화된 카드 가져오기
   * @returns 활성화된 카드 또는 null
   */
  getActiveCard(): ICard | null;
}

/**
 * 상호작용 서비스 클래스
 * 카드 상호작용 관련 기능을 제공합니다.
 */
export class InteractionService implements IInteractionService {
  private app: App;
  private cardService: ICardService;
  private cards: ICard[] = [];
  private focusedCard: ICard | null = null;
  private activeCard: ICard | null = null;
  private lastSelectedCard: ICard | null = null;
  
  /**
   * 선택된 카드 목록
   */
  selectedCards: ICard[] = [];
  
  /**
   * 생성자
   * @param app Obsidian App 객체
   * @param cardService 카드 서비스
   */
  constructor(app: App, cardService: ICardService) {
    this.app = app;
    this.cardService = cardService;
  }
  
  /**
   * 카드 목록 설정
   * @param cards 카드 목록
   */
  setCards(cards: ICard[]): void {
    this.cards = cards;
    
    // 포커스된 카드가 목록에 없으면 초기화
    if (this.focusedCard && !this.cards.includes(this.focusedCard)) {
      this.focusedCard = null;
    }
    
    // 활성화된 카드가 목록에 없으면 초기화
    if (this.activeCard && !this.cards.includes(this.activeCard)) {
      this.activeCard = null;
    }
    
    // 선택된 카드 중 목록에 없는 카드 제거
    this.selectedCards = this.selectedCards.filter(card => this.cards.includes(card));
  }
  
  /**
   * 카드 클릭 이벤트 처리
   * @param card 클릭된 카드
   * @param event 마우스 이벤트
   * @returns 처리 여부
   */
  handleCardClick(card: ICard, event: MouseEvent): boolean {
    // 포커스 설정
    this.setFocusedCard(card);
    
    // Shift 키를 누른 상태에서 클릭한 경우 범위 선택
    if (event.shiftKey && this.lastSelectedCard) {
      this.selectRange(this.lastSelectedCard, card, this.cards);
      return true;
    }
    
    // Ctrl/Cmd 키를 누른 상태에서 클릭한 경우 다중 선택
    if (event.ctrlKey || event.metaKey) {
      if (this.isSelected(card)) {
        this.deselectCard(card);
      } else {
        this.selectCard(card, true);
      }
      return true;
    }
    
    // 일반 클릭인 경우 단일 선택
    this.selectCard(card, false);
    
    return true;
  }
  
  /**
   * 카드 더블 클릭 이벤트 처리
   * @param card 더블 클릭된 카드
   * @param event 마우스 이벤트
   * @returns 처리 여부
   */
  handleCardDoubleClick(card: ICard, event: MouseEvent): boolean {
    // 카드 열기
    this.openCard(card);
    return true;
  }
  
  /**
   * 카드 컨텍스트 메뉴 이벤트 처리
   * @param card 컨텍스트 메뉴가 열린 카드
   * @param event 마우스 이벤트
   * @returns 처리 여부
   */
  handleCardContextMenu(card: ICard, event: MouseEvent): boolean {
    // 포커스 설정
    this.setFocusedCard(card);
    
    // 선택되지 않은 카드에서 컨텍스트 메뉴를 열면 해당 카드만 선택
    if (!this.isSelected(card)) {
      this.selectCard(card, false);
    }
    
    return true;
  }
  
  /**
   * 카드 드래그 시작 이벤트 처리
   * @param card 드래그 시작된 카드
   * @param event 드래그 이벤트
   * @returns 처리 여부
   */
  handleCardDragStart(card: ICard, event: DragEvent): boolean {
    // 드래그 데이터 설정
    if (event.dataTransfer) {
      // 선택된 카드가 없거나 드래그하는 카드가 선택되지 않은 경우 해당 카드만 선택
      if (this.selectedCards.length === 0 || !this.isSelected(card)) {
        this.selectCard(card, false);
      }
      
      // 선택된 카드 경로 설정
      const paths = this.selectedCards.map(c => c.getPath());
      event.dataTransfer.setData('text/plain', paths.join('\n'));
      
      // 드래그 이미지 설정
      if (this.selectedCards.length > 1) {
        // 다중 선택 드래그 이미지
        const dragImage = document.createElement('div');
        dragImage.textContent = `${this.selectedCards.length} 카드`;
        dragImage.style.padding = '5px';
        dragImage.style.background = 'rgba(0, 0, 0, 0.7)';
        dragImage.style.color = 'white';
        dragImage.style.borderRadius = '3px';
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        
        event.dataTransfer.setDragImage(dragImage, 0, 0);
        
        // 드래그 이미지 요소 제거 (지연)
        setTimeout(() => {
          document.body.removeChild(dragImage);
        }, 0);
      }
    }
    
    return true;
  }
  
  /**
   * 카드 드래그 종료 이벤트 처리
   * @param card 드래그 종료된 카드
   * @param event 드래그 이벤트
   * @returns 처리 여부
   */
  handleCardDragEnd(card: ICard, event: DragEvent): boolean {
    return true;
  }
  
  /**
   * 카드 드롭 이벤트 처리
   * @param card 드롭된 카드
   * @param event 드래그 이벤트
   * @returns 처리 여부
   */
  handleCardDrop(card: ICard, event: DragEvent): boolean {
    return true;
  }
  
  /**
   * 포커스된 카드 설정
   * @param card 포커스할 카드
   */
  setFocusedCard(card: ICard | null): void {
    this.focusedCard = card;
  }
  
  /**
   * 활성화된 카드 설정
   * @param card 활성화할 카드
   */
  setActiveCard(card: ICard | null): void {
    this.activeCard = card;
  }
  
  /**
   * 포커스된 카드 가져오기
   * @returns 포커스된 카드 또는 null
   */
  getFocusedCard(): ICard | null {
    return this.focusedCard;
  }
  
  /**
   * 활성화된 카드 가져오기
   * @returns 활성화된 카드 또는 null
   */
  getActiveCard(): ICard | null {
    return this.activeCard;
  }
  
  /**
   * 카드 열기
   * @param card 열 카드
   * @param newLeaf 새 탭에서 열지 여부
   * @returns 성공 여부
   */
  openCard(card: ICard, newLeaf: boolean = false): boolean {
    try {
      this.cardService.openCard(card, newLeaf);
      return true;
    } catch (error) {
      console.error('카드 열기 오류:', error);
      return false;
    }
  }
  
  /**
   * 카드 편집
   * @param card 편집할 카드
   * @returns 성공 여부
   */
  editCard(card: ICard): boolean {
    try {
      this.cardService.editCard(card);
      return true;
    } catch (error) {
      console.error('카드 편집 오류:', error);
      return false;
    }
  }
  
  /**
   * 키보드 이벤트 처리
   * @param event 키보드 이벤트
   * @returns 이벤트 처리 여부
   */
  async handleKeyEvent(event: KeyboardEvent): Promise<boolean> {
    // 포커스된 카드가 없으면 처리하지 않음
    if (!this.focusedCard) {
      return false;
    }
    
    // 방향키 처리
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      const direction = event.key.replace('Arrow', '').toLowerCase() as KeyboardNavigationDirection;
      return this.navigate(direction);
    }
    
    // Enter 키 처리 (카드 열기)
    if (event.key === 'Enter' && !event.shiftKey) {
      return await this.openFocusedCard();
    }
    
    // Shift+Enter 키 처리 (카드 편집)
    if (event.key === 'Enter' && event.shiftKey) {
      return await this.editFocusedCard();
    }
    
    // Escape 키 처리 (선택 해제)
    if (event.key === 'Escape') {
      this.deselectAll();
      return true;
    }
    
    // Ctrl+A 키 처리 (전체 선택)
    if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
      this.selectAll(this.cards);
      event.preventDefault();
      return true;
    }
    
    return false;
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
    
    // 포커스된 카드가 없는 경우 첫 번째 카드 포커스
    if (!this.focusedCard) {
      this.setFocusedCard(this.cards[0]);
      this.selectCard(this.cards[0], false);
      return true;
    }
    
    // 현재 포커스된 카드의 인덱스 찾기
    const currentIndex = this.cards.indexOf(this.focusedCard);
    if (currentIndex === -1) {
      return false;
    }
    
    let nextIndex = currentIndex;
    
    // 방향에 따른 다음 인덱스 계산
    switch (direction) {
      case 'up':
        nextIndex = Math.max(0, currentIndex - 1);
        break;
      case 'down':
        nextIndex = Math.min(this.cards.length - 1, currentIndex + 1);
        break;
      case 'left':
        nextIndex = Math.max(0, currentIndex - 1);
        break;
      case 'right':
        nextIndex = Math.min(this.cards.length - 1, currentIndex + 1);
        break;
    }
    
    // 인덱스가 변경되지 않은 경우 (이미 끝에 도달한 경우)
    if (nextIndex === currentIndex) {
      return false;
    }
    
    // 다음 카드 포커스
    const nextCard = this.cards[nextIndex];
    this.setFocusedCard(nextCard);
    
    return true;
  }
  
  /**
   * 현재 포커스된 카드 열기
   * @returns 성공 여부
   */
  async openFocusedCard(): Promise<boolean> {
    const focusedCard = this.getFocusedCard();
    if (focusedCard) {
      try {
        await this.cardService.openCard(focusedCard);
        return true;
      } catch (error) {
        console.error('포커스된 카드 열기 오류:', error);
        return false;
      }
    }
    return false;
  }
  
  /**
   * 현재 포커스된 카드 편집
   * @returns 성공 여부
   */
  async editFocusedCard(): Promise<boolean> {
    const focusedCard = this.getFocusedCard();
    if (focusedCard) {
      try {
        await this.cardService.editCard(focusedCard);
        return true;
      } catch (error) {
        console.error('포커스된 카드 편집 오류:', error);
        return false;
      }
    }
    return false;
  }
  
  /**
   * 현재 포커스된 카드 인덱스 가져오기
   * @returns 포커스된 카드 인덱스 또는 -1
   */
  getFocusedIndex(): number {
    if (!this.focusedCard) {
      return -1;
    }
    
    return this.cards.indexOf(this.focusedCard);
  }
  
  /**
   * 카드 선택
   * @param card 선택할 카드
   * @param addToSelection 기존 선택에 추가할지 여부 (true: 추가, false: 대체)
   */
  selectCard(card: ICard, addToSelection: boolean = false): void {
    if (!addToSelection) {
      // 기존 선택 해제
      this.selectedCards = [];
    }
    
    // 이미 선택된 카드인지 확인
    if (!this.selectedCards.includes(card)) {
      this.selectedCards.push(card);
    }
    
    // 마지막 선택 카드 업데이트
    this.lastSelectedCard = card;
  }
  
  /**
   * 카드 선택 해제
   * @param card 선택 해제할 카드
   */
  deselectCard(card: ICard): void {
    this.selectedCards = this.selectedCards.filter(c => c !== card);
    
    // 마지막 선택 카드가 해제된 카드인 경우 업데이트
    if (this.lastSelectedCard === card) {
      this.lastSelectedCard = this.selectedCards.length > 0 ? this.selectedCards[this.selectedCards.length - 1] : null;
    }
  }
  
  /**
   * 모든 카드 선택
   * @param cards 선택할 카드 목록
   */
  selectAll(cards: ICard[]): void {
    this.selectedCards = [...cards];
    this.lastSelectedCard = this.selectedCards.length > 0 ? this.selectedCards[this.selectedCards.length - 1] : null;
  }
  
  /**
   * 모든 카드 선택 해제
   */
  deselectAll(): void {
    this.selectedCards = [];
    this.lastSelectedCard = null;
  }
  
  /**
   * 범위 선택
   * @param startCard 시작 카드
   * @param endCard 끝 카드
   * @param cards 전체 카드 목록
   */
  selectRange(startCard: ICard, endCard: ICard, cards: ICard[]): void {
    const startIndex = cards.indexOf(startCard);
    const endIndex = cards.indexOf(endCard);
    
    if (startIndex === -1 || endIndex === -1) {
      return;
    }
    
    // 범위 계산
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    
    // 범위 내 카드 선택
    const rangeCards = cards.slice(start, end + 1);
    
    // 기존 선택 유지하면서 범위 추가
    this.selectedCards = [...this.selectedCards];
    
    // 중복 제거하면서 범위 카드 추가
    for (const card of rangeCards) {
      if (!this.selectedCards.includes(card)) {
        this.selectedCards.push(card);
      }
    }
    
    // 마지막 선택 카드 업데이트
    this.lastSelectedCard = endCard;
  }
  
  /**
   * 카드 선택 여부 확인
   * @param card 확인할 카드
   * @returns 선택 여부
   */
  isSelected(card: ICard): boolean {
    return this.selectedCards.includes(card);
  }
  
  /**
   * 선택된 카드 수 가져오기
   * @returns 선택된 카드 수
   */
  getSelectionCount(): number {
    return this.selectedCards.length;
  }
  
  /**
   * 선택된 카드 목록 가져오기
   * @returns 선택된 카드 목록
   */
  getSelectedCards(): ICard[] {
    return [...this.selectedCards];
  }
  
  /**
   * 선택된 카드에 대한 일괄 작업 수행
   * @param action 수행할 작업 함수
   */
  async performBatchAction(action: (cards: ICard[]) => Promise<void>): Promise<void> {
    if (this.selectedCards.length === 0) {
      return;
    }
    
    await action(this.selectedCards);
  }
  
  /**
   * 카드 클릭 이벤트 처리
   * @param card 클릭된 카드
   */
  onClick(card: ICard): void {
    this.handleCardClick(card, new MouseEvent('click'));
  }
  
  /**
   * 카드 더블 클릭 이벤트 처리
   * @param card 더블 클릭된 카드
   */
  onDoubleClick(card: ICard): void {
    this.handleCardDoubleClick(card, new MouseEvent('dblclick'));
  }
  
  /**
   * 카드 우클릭 이벤트 처리
   * @param card 우클릭된 카드
   * @param event 마우스 이벤트
   */
  onRightClick(card: ICard, event: MouseEvent): void {
    this.handleCardContextMenu(card, event);
  }
  
  /**
   * 카드 드래그 시작 이벤트 처리
   * @param card 드래그 시작된 카드
   * @param event 드래그 이벤트
   */
  onDragStart(card: ICard, event: DragEvent): void {
    this.handleCardDragStart(card, event);
  }
  
  /**
   * 카드 드래그 종료 이벤트 처리
   * @param card 드래그 종료된 카드
   * @param event 드래그 이벤트
   */
  onDragEnd(card: ICard, event: DragEvent): void {
    this.handleCardDragEnd(card, event);
  }
  
  /**
   * 카드 드롭 이벤트 처리
   * @param card 드롭된 카드
   * @param event 드래그 이벤트
   */
  onDrop(card: ICard, event: DragEvent): void {
    this.handleCardDrop(card, event);
  }
} 