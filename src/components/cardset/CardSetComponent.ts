import { ICard } from '../../domain/card/Card';
import { ICardSet } from '../../domain/cardset/CardSet';
import { Component } from '../Component';
import { ICardSetService } from '../../services/cardset/CardSetService';
import { ILayoutService } from '../../services/layout/LayoutService';
import { ISortingService } from '../../domain/sorting/SortingInterfaces';
import { CardComponent } from '../card/CardComponent';
import { ICardService } from '../../services/card/CardService';
import { ICardRenderingService } from '../../services/card/CardRenderingService';
import { IInteractionService } from '../../services/interaction/InteractionService';

/**
 * 카드셋 컴포넌트 인터페이스
 */
export interface ICardSetComponent {
  /**
   * 카드셋 데이터 설정
   * @param cardSet 카드셋 데이터
   */
  setCardSet(cardSet: ICardSet): void;
  
  /**
   * 카드 선택
   * @param cardIds 선택할 카드 ID 목록
   */
  selectCards(cardIds: string[]): void;
  
  /**
   * 카드 포커스
   * @param cardId 포커스할 카드 ID
   */
  focusCard(cardId: string): void;
}

/**
 * 카드셋 컴포넌트
 * 카드셋을 렌더링하는 컴포넌트입니다.
 */
export class CardSetComponent extends Component implements ICardSetComponent {
  private cardSet: ICardSet;
  private cardSetService: ICardSetService;
  private layoutService: ILayoutService;
  private sortingService: ISortingService;
  private cardService: ICardService;
  private cardRenderingService: ICardRenderingService;
  private interactionService: IInteractionService;
  private cardComponents: Map<string, CardComponent> = new Map();
  private selectedCardIds: Set<string> = new Set();
  private focusedCardId: string | null = null;
  
  /**
   * 생성자
   * @param cardSet 카드셋 데이터
   * @param cardSetService 카드셋 서비스
   * @param layoutService 레이아웃 서비스
   * @param sortingService 정렬 서비스
   * @param cardService 카드 서비스
   * @param cardRenderingService 카드 렌더링 서비스
   * @param interactionService 상호작용 서비스
   */
  constructor(
    cardSet: ICardSet,
    cardSetService: ICardSetService,
    layoutService: ILayoutService,
    sortingService: ISortingService,
    cardService: ICardService,
    cardRenderingService: ICardRenderingService,
    interactionService: IInteractionService
  ) {
    super();
    this.cardSet = cardSet;
    this.cardSetService = cardSetService;
    this.layoutService = layoutService;
    this.sortingService = sortingService;
    this.cardService = cardService;
    this.cardRenderingService = cardRenderingService;
    this.interactionService = interactionService;
  }
  
  /**
   * 카드셋 데이터 설정
   * @param cardSet 카드셋 데이터
   */
  setCardSet(cardSet: ICardSet): void {
    this.cardSet = cardSet;
    this.update();
  }
  
  /**
   * 카드 선택
   * @param cardIds 선택할 카드 ID 목록
   */
  selectCards(cardIds: string[]): void {
    // 이전 선택 상태 초기화
    this.selectedCardIds.forEach(id => {
      const cardComponent = this.cardComponents.get(id);
      if (cardComponent) {
        cardComponent.setSelected(false);
      }
    });
    
    // 새로운 선택 상태 설정
    this.selectedCardIds = new Set(cardIds);
    this.selectedCardIds.forEach(id => {
      const cardComponent = this.cardComponents.get(id);
      if (cardComponent) {
        cardComponent.setSelected(true);
      }
    });
  }
  
  /**
   * 카드 포커스
   * @param cardId 포커스할 카드 ID
   */
  focusCard(cardId: string): void {
    // 이전 포커스 상태 초기화
    if (this.focusedCardId) {
      const cardComponent = this.cardComponents.get(this.focusedCardId);
      if (cardComponent) {
        cardComponent.setFocused(false);
      }
    }
    
    // 새로운 포커스 상태 설정
    this.focusedCardId = cardId;
    const cardComponent = this.cardComponents.get(cardId);
    if (cardComponent) {
      cardComponent.setFocused(true);
    }
  }
  
  /**
   * 컴포넌트 생성
   * @returns 생성된 HTML 요소
   */
  protected createComponent(): HTMLElement {
    const cardSetElement = document.createElement('div');
    cardSetElement.className = 'card-navigator-cardset';
    cardSetElement.dataset.id = this.cardSet.id;
    
    // 레이아웃 클래스 추가
    const layoutType = this.layoutService.getCurrentLayout();
    cardSetElement.classList.add(`layout-${layoutType}`);
    
    // 카드 렌더링
    this.renderCards(cardSetElement);
    
    return cardSetElement;
  }
  
  /**
   * 카드 렌더링
   * @param container 컨테이너 요소
   */
  private renderCards(container: HTMLElement): void {
    // 기존 카드 컴포넌트 정리
    this.cardComponents.forEach(component => {
      component.remove();
    });
    this.cardComponents.clear();
    
    // 카드셋이 비어있거나 파일이 없는 경우
    if (!this.cardSet || !this.cardSet.files || this.cardSet.files.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'card-navigator-empty-message';
      emptyMessage.textContent = '표시할 카드가 없습니다.';
      container.appendChild(emptyMessage);
      console.log('카드셋이 비어있습니다:', this.cardSet);
      return;
    }
    
    // 정렬된 카드 목록 가져오기
    const cards = this.cardSet.files.map(file => 
      this.cardService.getCardByPath(file.path)
    ).filter(card => card !== null) as ICard[];
    
    if (cards.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'card-navigator-empty-message';
      emptyMessage.textContent = '표시할 카드가 없습니다.';
      container.appendChild(emptyMessage);
      console.log('카드 목록이 비어있습니다:', this.cardSet);
      return;
    }
    
    const sortedCards = this.sortingService.sortCards(cards);
    console.log('정렬된 카드 목록:', sortedCards);
    
    // 카드 컴포넌트 생성 및 렌더링
    sortedCards.forEach(card => {
      const cardComponent = new CardComponent(
        card,
        this.cardService,
        this.cardRenderingService,
        this.interactionService
      );
      
      // 선택 및 포커스 상태 설정
      const cardId = card.id || card.path || '';
      if (this.selectedCardIds.has(cardId)) {
        cardComponent.setSelected(true);
      }
      
      if (this.focusedCardId === cardId) {
        cardComponent.setFocused(true);
      }
      
      // 카드 렌더링
      const cardContainer = document.createElement('div');
      cardContainer.className = 'card-container';
      container.appendChild(cardContainer);
      cardComponent.render(cardContainer);
      
      // 카드 컴포넌트 저장
      this.cardComponents.set(cardId, cardComponent);
    });
  }
  
  /**
   * 이벤트 리스너 등록
   */
  registerEventListeners(): void {
    if (this.element) {
      this.element.addEventListener('dragover', this.handleDragOver);
      this.element.addEventListener('drop', this.handleDrop);
    }
  }
  
  /**
   * 이벤트 리스너 제거
   */
  removeEventListeners(): void {
    if (this.element) {
      this.element.removeEventListener('dragover', this.handleDragOver);
      this.element.removeEventListener('drop', this.handleDrop);
    }
  }
  
  /**
   * 드래그 오버 이벤트 핸들러
   * @param event 드래그 이벤트
   */
  private handleDragOver = (event: DragEvent): void => {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  };
  
  /**
   * 드롭 이벤트 핸들러
   * @param event 드래그 이벤트
   */
  private handleDrop = (event: DragEvent): void => {
    event.preventDefault();
    
    const cardId = event.dataTransfer!.getData('text/plain');
    if (cardId) {
      this.interactionService.handleCardDrop(cardId, event);
    }
  };
} 