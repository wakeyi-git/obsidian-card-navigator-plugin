import { ICard } from '../../domain/card/Card';
import { Component } from '../Component';
import { ICardRenderingService } from '../../services/card/CardRenderingService';
import { ICardService } from '../../services/card/CardService';
import { IInteractionService } from '../../services/interaction/InteractionService';

/**
 * 카드 컴포넌트 인터페이스
 */
export interface ICardComponent {
  /**
   * 카드 데이터 설정
   * @param card 카드 데이터
   */
  setCard(card: ICard): void;
  
  /**
   * 카드 선택 상태 설정
   * @param selected 선택 여부
   */
  setSelected(selected: boolean): void;
  
  /**
   * 카드 포커스 상태 설정
   * @param focused 포커스 여부
   */
  setFocused(focused: boolean): void;
}

/**
 * 카드 컴포넌트
 * 카드를 렌더링하는 컴포넌트입니다.
 */
export class CardComponent extends Component implements ICardComponent {
  private card: ICard;
  private cardService: ICardService;
  private cardRenderingService: ICardRenderingService;
  private interactionService: IInteractionService;
  private isSelected: boolean = false;
  private isFocused: boolean = false;
  
  /**
   * 생성자
   * @param card 카드 데이터
   * @param cardService 카드 서비스
   * @param cardRenderingService 카드 렌더링 서비스
   * @param interactionService 상호작용 서비스
   */
  constructor(
    card: ICard,
    cardService: ICardService,
    cardRenderingService: ICardRenderingService,
    interactionService: IInteractionService
  ) {
    super();
    this.card = card;
    this.cardService = cardService;
    this.cardRenderingService = cardRenderingService;
    this.interactionService = interactionService;
  }
  
  /**
   * 카드 데이터 설정
   * @param card 카드 데이터
   */
  setCard(card: ICard): void {
    this.card = card;
    this.update();
  }
  
  /**
   * 카드 선택 상태 설정
   * @param selected 선택 여부
   */
  setSelected(selected: boolean): void {
    if (this.isSelected !== selected) {
      this.isSelected = selected;
      this.updateCardState();
    }
  }
  
  /**
   * 카드 포커스 상태 설정
   * @param focused 포커스 여부
   */
  setFocused(focused: boolean): void {
    if (this.isFocused !== focused) {
      this.isFocused = focused;
      this.updateCardState();
    }
  }
  
  /**
   * 카드 상태 업데이트
   */
  private updateCardState(): void {
    if (this.element) {
      this.element.classList.toggle('selected', this.isSelected);
      this.element.classList.toggle('focused', this.isFocused);
      
      if (this.isFocused) {
        this.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }
  
  /**
   * 컴포넌트 생성
   * @returns 생성된 HTML 요소
   */
  protected createComponent(): HTMLElement {
    const cardElement = document.createElement('div');
    cardElement.className = 'card-navigator-card';
    cardElement.dataset.id = this.card.id;
    cardElement.dataset.path = this.card.path;
    
    if (this.isSelected) {
      cardElement.classList.add('selected');
    }
    
    if (this.isFocused) {
      cardElement.classList.add('focused');
    }
    
    // 카드 내용 렌더링
    this.cardRenderingService.renderCard(this.card, cardElement);
    
    return cardElement;
  }
  
  /**
   * 이벤트 리스너 등록
   */
  registerEventListeners(): void {
    if (this.element) {
      this.element.addEventListener('click', this.handleClick);
      this.element.addEventListener('dblclick', this.handleDoubleClick);
      this.element.addEventListener('contextmenu', this.handleContextMenu);
      this.element.addEventListener('mouseenter', this.handleMouseEnter);
      this.element.addEventListener('mouseleave', this.handleMouseLeave);
      this.element.addEventListener('dragstart', this.handleDragStart);
      this.element.addEventListener('dragend', this.handleDragEnd);
    }
  }
  
  /**
   * 이벤트 리스너 제거
   */
  removeEventListeners(): void {
    if (this.element) {
      this.element.removeEventListener('click', this.handleClick);
      this.element.removeEventListener('dblclick', this.handleDoubleClick);
      this.element.removeEventListener('contextmenu', this.handleContextMenu);
      this.element.removeEventListener('mouseenter', this.handleMouseEnter);
      this.element.removeEventListener('mouseleave', this.handleMouseLeave);
      this.element.removeEventListener('dragstart', this.handleDragStart);
      this.element.removeEventListener('dragend', this.handleDragEnd);
    }
  }
  
  /**
   * 클릭 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleClick = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    
    const cardId = this.card.id || this.card.path || '';
    this.interactionService.handleCardClick(cardId, event);
  };
  
  /**
   * 더블 클릭 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleDoubleClick = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    
    const cardId = this.card.id || this.card.path || '';
    this.interactionService.handleCardDoubleClick(cardId, event);
  };
  
  /**
   * 컨텍스트 메뉴 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    
    const cardId = this.card.id || this.card.path || '';
    this.interactionService.handleCardContextMenu(cardId, event);
  };
  
  /**
   * 마우스 진입 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleMouseEnter = (event: MouseEvent): void => {
    const cardId = this.card.id || this.card.path || '';
    this.interactionService.handleCardMouseEnter(cardId, event);
  };
  
  /**
   * 마우스 이탈 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleMouseLeave = (event: MouseEvent): void => {
    const cardId = this.card.id || this.card.path || '';
    this.interactionService.handleCardMouseLeave(cardId, event);
  };
  
  /**
   * 드래그 시작 이벤트 핸들러
   * @param event 드래그 이벤트
   */
  private handleDragStart = (event: DragEvent): void => {
    const cardId = this.card.id || this.card.path || '';
    this.interactionService.handleCardDragStart(cardId, event);
  };
  
  /**
   * 드래그 종료 이벤트 핸들러
   * @param event 드래그 이벤트
   */
  private handleDragEnd = (event: DragEvent): void => {
    const cardId = this.card.id || this.card.path || '';
    this.interactionService.handleCardDragEnd(cardId, event);
  };
} 