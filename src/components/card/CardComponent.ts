import { ICard } from '../../domain/card/Card';
import { Component } from '../Component';
import { ICardRenderingService } from '../../services/card/CardRenderingService';
import { ICardService } from '../../services/card/CardService';
import { IInteractionService } from '../../services/interaction/InteractionService';
import { EventType, SettingsChangedEventData } from '../../domain/events/EventTypes';

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
  private isSelected = false;
  private isFocused = false;
  
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
    
    // 설정 변경 이벤트 구독
    this.cardService.getEventBus().on(EventType.SETTINGS_CHANGED, this.handleSettingsChanged);
  }
  
  /**
   * 컴포넌트 제거
   */
  onRemove(): void {
    // 이벤트 리스너 제거
    this.removeEventListeners();
    
    // 설정 변경 이벤트 구독 해제
    this.cardService.getEventBus().off(EventType.SETTINGS_CHANGED, this.handleSettingsChanged);
    
    super.onRemove();
  }
  
  /**
   * 설정 변경 이벤트 핸들러
   * @param data 이벤트 데이터
   */
  private handleSettingsChanged = (data: SettingsChangedEventData) => {
    console.log('카드 컴포넌트: 설정 변경됨', data.changedKeys);
    
    // 카드 스타일 관련 설정이 변경된 경우에만 업데이트
    const cardStyleSettings = [
      'cardWidth', 'cardHeight', 'cardGap',
      'normalCardBgColor', 'activeCardBgColor', 'focusedCardBgColor', 'hoverCardBgColor',
      'normalCardBorderStyle', 'normalCardBorderColor', 'normalCardBorderWidth', 'normalCardBorderRadius',
      'activeCardBorderStyle', 'activeCardBorderColor', 'activeCardBorderWidth', 'activeCardBorderRadius',
      'focusedCardBorderStyle', 'focusedCardBorderColor', 'focusedCardBorderWidth', 'focusedCardBorderRadius',
      'hoverCardBorderStyle', 'hoverCardBorderColor', 'hoverCardBorderWidth', 'hoverCardBorderRadius',
      'headerBgColor', 'bodyBgColor', 'footerBgColor',
      'headerFontSize', 'bodyFontSize', 'footerFontSize',
      'headerBorderStyle', 'headerBorderColor', 'headerBorderWidth', 'headerBorderRadius',
      'bodyBorderStyle', 'bodyBorderColor', 'bodyBorderWidth', 'bodyBorderRadius',
      'footerBorderStyle', 'footerBorderColor', 'footerBorderWidth', 'footerBorderRadius',
      'card', 'card-header', 'card-body', 'card-footer', 'card-general'
    ];
    
    if (data.changedKeys.some(key => cardStyleSettings.includes(key))) {
      // 카드 업데이트
      this.update();
    }
  };
  
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
   * 컴포넌트 업데이트
   * 설정 변경 시 호출되어 카드를 업데이트합니다.
   */
  update(): void {
    if (!this.element) return;
    
    // 설정 가져오기
    const settings = this.cardService.getSettings();
    const layoutSettings = settings.layout || {
      cardMinHeight: 100,
      cardMaxHeight: 300
    };
    
    // CSS 변수 업데이트
    // 카드 크기 설정
    this.element.style.setProperty('--card-width', `${settings.cardWidth || 250}px`);
    this.element.style.setProperty('--card-min-height', `${layoutSettings.cardMinHeight}px`);
    this.element.style.setProperty('--card-max-height', `${layoutSettings.cardMaxHeight}px`);
    this.element.style.setProperty('--card-gap', `${settings.cardGap || 10}px`);
    
    // 카드 기본 스타일 설정
    this.element.style.setProperty('--card-bg-color', settings.normalCardBgColor || 'var(--background-primary)');
    this.element.style.setProperty('--card-border-style', settings.normalCardBorderStyle || 'solid');
    this.element.style.setProperty('--card-border-color', settings.normalCardBorderColor || 'var(--background-modifier-border)');
    this.element.style.setProperty('--card-border-width', `${settings.normalCardBorderWidth || 1}px`);
    this.element.style.setProperty('--card-border-radius', `${settings.normalCardBorderRadius || 5}px`);
    
    // 카드 호버 스타일 설정
    this.element.style.setProperty('--card-hover-bg-color', settings.hoverCardBgColor || 'var(--background-primary-alt)');
    this.element.style.setProperty('--card-hover-border-color', settings.hoverCardBorderColor || 'var(--interactive-accent)');
    
    // 카드 활성 스타일 설정
    this.element.style.setProperty('--card-active-bg-color', settings.activeCardBgColor || 'var(--background-primary-alt)');
    this.element.style.setProperty('--card-active-border-color', settings.activeCardBorderColor || 'var(--interactive-accent)');
    this.element.style.setProperty('--card-active-border-style', settings.activeCardBorderStyle || 'solid');
    this.element.style.setProperty('--card-active-border-width', `${settings.activeCardBorderWidth || 2}px`);
    
    // 카드 포커스 스타일 설정
    this.element.style.setProperty('--card-focused-bg-color', settings.focusedCardBgColor || 'var(--background-primary-alt)');
    this.element.style.setProperty('--card-focused-border-color', settings.focusedCardBorderColor || 'var(--interactive-accent)');
    
    // 헤더 스타일 설정
    this.element.style.setProperty('--header-bg-color', settings.headerBgColor || 'var(--background-secondary)');
    this.element.style.setProperty('--header-font-size', `${settings.headerFontSize || 14}px`);
    this.element.style.setProperty('--header-border-style', settings.headerBorderStyle || 'solid');
    this.element.style.setProperty('--header-border-color', settings.headerBorderColor || 'var(--background-modifier-border)');
    this.element.style.setProperty('--header-border-width', `${settings.headerBorderWidth || 0}px`);
    this.element.style.setProperty('--header-border-radius', `${settings.headerBorderRadius || 0}px`);
    
    // 본문 스타일 설정
    this.element.style.setProperty('--body-bg-color', settings.bodyBgColor || 'transparent');
    this.element.style.setProperty('--body-font-size', `${settings.bodyFontSize || 12}px`);
    this.element.style.setProperty('--body-border-style', settings.bodyBorderStyle || 'solid');
    this.element.style.setProperty('--body-border-color', settings.bodyBorderColor || 'var(--background-modifier-border)');
    this.element.style.setProperty('--body-border-width', `${settings.bodyBorderWidth || 0}px`);
    this.element.style.setProperty('--body-border-radius', `${settings.bodyBorderRadius || 0}px`);
    
    // 푸터 스타일 설정
    this.element.style.setProperty('--footer-bg-color', settings.footerBgColor || 'var(--background-secondary-alt)');
    this.element.style.setProperty('--footer-font-size', `${settings.footerFontSize || 11}px`);
    this.element.style.setProperty('--footer-border-style', settings.footerBorderStyle || 'solid');
    this.element.style.setProperty('--footer-border-color', settings.footerBorderColor || 'var(--background-modifier-border)');
    this.element.style.setProperty('--footer-border-width', `${settings.footerBorderWidth || 0}px`);
    this.element.style.setProperty('--footer-border-radius', `${settings.footerBorderRadius || 0}px`);
    
    // 카드 내용 다시 렌더링
    this.element.empty();
    this.cardRenderingService.renderCard(this.card, this.element);
    
    // 카드 상태 업데이트
    this.updateCardState();
    
    console.log('카드 컴포넌트 업데이트 완료');
  }
  
  /**
   * 컴포넌트 생성
   * @returns 생성된 HTML 요소
   */
  protected async createComponent(): Promise<HTMLElement> {
    const cardElement = document.createElement('div');
    cardElement.className = 'card-navigator-card';
    cardElement.dataset.id = this.card.id;
    cardElement.dataset.path = this.card.path;
    
    // 설정 가져오기
    const settings = this.cardService.getSettings();
    const layoutSettings = settings.layout || {
      cardMinHeight: 100,
      cardMaxHeight: 300
    };
    
    // CSS 변수 설정
    // 카드 크기 설정
    cardElement.style.setProperty('--card-width', `${settings.cardWidth || 250}px`);
    cardElement.style.setProperty('--card-min-height', `${layoutSettings.cardMinHeight}px`);
    cardElement.style.setProperty('--card-max-height', `${layoutSettings.cardMaxHeight}px`);
    cardElement.style.setProperty('--card-gap', `${settings.cardGap || 10}px`);
    
    // 카드 기본 스타일 설정
    cardElement.style.setProperty('--card-bg-color', settings.normalCardBgColor || 'var(--background-primary)');
    cardElement.style.setProperty('--card-border-style', settings.normalCardBorderStyle || 'solid');
    cardElement.style.setProperty('--card-border-color', settings.normalCardBorderColor || 'var(--background-modifier-border)');
    cardElement.style.setProperty('--card-border-width', `${settings.normalCardBorderWidth || 1}px`);
    cardElement.style.setProperty('--card-border-radius', `${settings.normalCardBorderRadius || 5}px`);
    
    // 카드 호버 스타일 설정
    cardElement.style.setProperty('--card-hover-bg-color', settings.hoverCardBgColor || 'var(--background-primary-alt)');
    cardElement.style.setProperty('--card-hover-border-color', settings.hoverCardBorderColor || 'var(--interactive-accent)');
    
    // 카드 활성 스타일 설정
    cardElement.style.setProperty('--card-active-bg-color', settings.activeCardBgColor || 'var(--background-primary-alt)');
    cardElement.style.setProperty('--card-active-border-color', settings.activeCardBorderColor || 'var(--interactive-accent)');
    cardElement.style.setProperty('--card-active-border-style', settings.activeCardBorderStyle || 'solid');
    cardElement.style.setProperty('--card-active-border-width', `${settings.activeCardBorderWidth || 2}px`);
    
    // 카드 포커스 스타일 설정
    cardElement.style.setProperty('--card-focused-bg-color', settings.focusedCardBgColor || 'var(--background-primary-alt)');
    cardElement.style.setProperty('--card-focused-border-color', settings.focusedCardBorderColor || 'var(--interactive-accent)');
    
    // 헤더 스타일 설정
    cardElement.style.setProperty('--header-bg-color', settings.headerBgColor || 'var(--background-secondary)');
    cardElement.style.setProperty('--header-font-size', `${settings.headerFontSize || 14}px`);
    cardElement.style.setProperty('--header-border-style', settings.headerBorderStyle || 'solid');
    cardElement.style.setProperty('--header-border-color', settings.headerBorderColor || 'var(--background-modifier-border)');
    cardElement.style.setProperty('--header-border-width', `${settings.headerBorderWidth || 0}px`);
    cardElement.style.setProperty('--header-border-radius', `${settings.headerBorderRadius || 0}px`);
    
    // 본문 스타일 설정
    cardElement.style.setProperty('--body-bg-color', settings.bodyBgColor || 'transparent');
    cardElement.style.setProperty('--body-font-size', `${settings.bodyFontSize || 12}px`);
    cardElement.style.setProperty('--body-border-style', settings.bodyBorderStyle || 'solid');
    cardElement.style.setProperty('--body-border-color', settings.bodyBorderColor || 'var(--background-modifier-border)');
    cardElement.style.setProperty('--body-border-width', `${settings.bodyBorderWidth || 0}px`);
    cardElement.style.setProperty('--body-border-radius', `${settings.bodyBorderRadius || 0}px`);
    
    // 푸터 스타일 설정
    cardElement.style.setProperty('--footer-bg-color', settings.footerBgColor || 'var(--background-secondary-alt)');
    cardElement.style.setProperty('--footer-font-size', `${settings.footerFontSize || 11}px`);
    cardElement.style.setProperty('--footer-border-style', settings.footerBorderStyle || 'solid');
    cardElement.style.setProperty('--footer-border-color', settings.footerBorderColor || 'var(--background-modifier-border)');
    cardElement.style.setProperty('--footer-border-width', `${settings.footerBorderWidth || 0}px`);
    cardElement.style.setProperty('--footer-border-radius', `${settings.footerBorderRadius || 0}px`);
    
    // 카드 상태 클래스 추가
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