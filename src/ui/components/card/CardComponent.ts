import { ICard } from '../../../domain/card/Card';
import { Component } from '../Component';
import { ICardRenderingService } from '../../../application/card/CardRenderingService';
import { ICardService } from '../../../application/card/CardService';
import { IInteractionService } from '../../../application/interaction/InteractionService';
import { EventType, SettingsChangedEventData } from '../../../domain/events/EventTypes';
import { DomainEventBus } from '../../../core/events/DomainEventBus';
import { ILayoutService } from '../../../application/layout/LayoutService';

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
  private eventBus: DomainEventBus;
  private isSelected = false;
  private isFocused = false;
  private isHovered = false;
  private isActive = false;
  private isDragging = false;
  
  // 카드 요소 참조
  protected headerEl: HTMLElement | null = null;
  protected bodyEl: HTMLElement | null = null;
  protected footerEl: HTMLElement | null = null;
  
  // 레이아웃 서비스 참조
  protected layoutService: ILayoutService;
  
  /**
   * 생성자
   * @param card 카드
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
    this.eventBus = cardService.getEventBus();
    this.layoutService = cardService.getLayoutService();
  }
  
  /**
   * 컴포넌트 제거
   * 이벤트 리스너 제거 및 리소스 정리
   */
  remove(): void {
    // 이벤트 리스너 제거
    if (this.element) {
      this.element.removeEventListener('click', this.handleClick);
      this.element.removeEventListener('dblclick', this.handleDoubleClick);
      this.element.removeEventListener('mouseover', this.handleMouseOver);
      this.element.removeEventListener('mouseout', this.handleMouseOut);
      this.element.removeEventListener('contextmenu', this.handleContextMenu);
      this.element.removeEventListener('dragstart', this.handleDragStart);
      this.element.removeEventListener('dragend', this.handleDragEnd);
      this.element.removeEventListener('dragover', this.handleDragOver);
      this.element.removeEventListener('drop', this.handleDrop);
    }
    
    // 요소 참조 제거
    this.headerEl = null;
    this.bodyEl = null;
    this.footerEl = null;
    
    // 기본 제거 로직 실행
    super.remove();
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
      'hoverCardBorderColor',
      'headerBgColor', 'bodyBgColor', 'footerBgColor',
      'headerFontSize', 'bodyFontSize', 'footerFontSize',
      'headerBorderStyle', 'headerBorderColor', 'headerBorderWidth', 'headerBorderRadius',
      'bodyBorderStyle', 'bodyBorderColor', 'bodyBorderWidth', 'bodyBorderRadius',
      'footerBorderStyle', 'footerBorderColor', 'footerBorderWidth', 'footerBorderRadius',
      'card', 'card-header', 'card-body', 'card-footer', 'card-general'
    ];
    
    // 카드 콘텐츠 타입 관련 설정
    const cardContentSettings = [
      'cardHeaderContent', 'cardBodyContent', 'cardFooterContent',
      'cardHeaderFrontmatterKey', 'cardBodyFrontmatterKey', 'cardFooterFrontmatterKey'
    ];
    
    // 스타일 또는 콘텐츠 타입 설정이 변경된 경우 즉시 업데이트
    if (data.changedKeys.some(key => cardStyleSettings.includes(key) || cardContentSettings.includes(key))) {
      // 설정 변경 시 카드 displaySettings 업데이트
      const settings = this.cardService.getSettingsService().getSettings();
      if (this.card.displaySettings) {
        // 콘텐츠 타입 설정이 변경된 경우 카드 displaySettings 업데이트
        if (data.changedKeys.some(key => cardContentSettings.includes(key))) {
          this.card.displaySettings.headerContent = settings.cardHeaderContent;
          this.card.displaySettings.bodyContent = settings.cardBodyContent;
          this.card.displaySettings.footerContent = settings.cardFooterContent;
          console.log('카드 콘텐츠 설정 업데이트됨:', this.card.displaySettings);
        }
      }
      
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
   * 이벤트 리스너 등록
   */
  registerEventListeners(): void {
    if (!this.element) return;
    
    // 클릭 이벤트 리스너
    this.element.addEventListener('click', this.handleClick);
    
    // 더블 클릭 이벤트 리스너
    this.element.addEventListener('dblclick', this.handleDoubleClick);
    
    // 마우스 오버 이벤트 리스너
    this.element.addEventListener('mouseover', this.handleMouseOver);
    
    // 마우스 아웃 이벤트 리스너
    this.element.addEventListener('mouseout', this.handleMouseOut);
    
    // 컨텍스트 메뉴 이벤트 리스너
    this.element.addEventListener('contextmenu', this.handleContextMenu);
    
    // 드래그 시작 이벤트 리스너
    this.element.addEventListener('dragstart', this.handleDragStart);
    
    // 드래그 종료 이벤트 리스너
    this.element.addEventListener('dragend', this.handleDragEnd);
    
    // 드래그 오버 이벤트 리스너
    this.element.addEventListener('dragover', this.handleDragOver);
    
    // 드롭 이벤트 리스너
    this.element.addEventListener('drop', this.handleDrop);
  }
  
  /**
   * 컴포넌트 업데이트
   * 설정 변경 시 호출되어 카드를 업데이트합니다.
   */
  async update(): Promise<void> {
    if (!this.element) return;
    
    // 설정 가져오기
    const settings = this.cardService.getSettingsService().getSettings();
    const layoutSettings = settings.layout || {
      cardThresholdHeight: 150
    };
    
    // 디버깅: 카드 업데이트 시 displaySettings 값 확인
    try {
      const cardId = this.card.getId ? this.card.getId() : (this.card.id || this.card.path || '알 수 없음');
      console.log('카드 업데이트 - 카드 ID:', cardId);
      
      // 현재 카드 displaySettings와 설정 값 비교
      const currentHeaderContent = this.card.displaySettings?.headerContent;
      const currentBodyContent = this.card.displaySettings?.bodyContent;
      const currentFooterContent = this.card.displaySettings?.footerContent;
      
      // 설정에서 'none'이 아닌 값만 사용
      const settingsHeaderContent = settings.cardHeaderContent === 'none' ? undefined : settings.cardHeaderContent;
      const settingsBodyContent = settings.cardBodyContent === 'none' ? undefined : settings.cardBodyContent;
      const settingsFooterContent = settings.cardFooterContent === 'none' ? undefined : settings.cardFooterContent;
      
      // 다중 콘텐츠 설정에서 'none'이 아닌 값만 필터링
      const headerContentMultiple = settings.cardHeaderContentMultiple?.filter(item => item !== 'none') || [];
      const bodyContentMultiple = settings.cardBodyContentMultiple?.filter(item => item !== 'none') || [];
      const footerContentMultiple = settings.cardFooterContentMultiple?.filter(item => item !== 'none') || [];
      
      // 콘텐츠 타입이 변경된 경우에만 업데이트
      const contentChanged = 
        currentHeaderContent !== settingsHeaderContent ||
        currentBodyContent !== settingsBodyContent ||
        currentFooterContent !== settingsFooterContent;
      
      if (contentChanged) {
        console.log('카드 콘텐츠 타입 변경됨, 업데이트 필요');
        console.log('현재 설정 값:', {
          headerContent: settingsHeaderContent,
          bodyContent: settingsBodyContent,
          footerContent: settingsFooterContent,
          headerContentMultiple,
          bodyContentMultiple,
          footerContentMultiple
        });
        console.log('카드 displaySettings:', this.card.displaySettings);
        
        // 카드 displaySettings 업데이트
        if (this.card.displaySettings) {
          // 다중 콘텐츠가 있고 'none'이 아닌 경우 첫 번째 값 사용, 없으면 undefined
          this.card.displaySettings.headerContent = headerContentMultiple.length > 0 ? 
            headerContentMultiple[0] : settingsHeaderContent;
          
          this.card.displaySettings.bodyContent = bodyContentMultiple.length > 0 ? 
            bodyContentMultiple[0] : settingsBodyContent;
          
          this.card.displaySettings.footerContent = footerContentMultiple.length > 0 ? 
            footerContentMultiple[0] : settingsFooterContent;
          
          console.log('카드 displaySettings 업데이트 완료:', this.card.displaySettings);
        }
      } else {
        console.log('카드 콘텐츠 타입 변경 없음, 스타일만 업데이트');
      }
    } catch (error) {
      console.error('카드 ID 가져오기 오류:', error);
    }
    
    // CSS 변수 업데이트
    // 카드 크기 설정
    this.element.style.setProperty('--card-width', `${settings.cardWidth || 250}px`);
    
    // 카드 높이 설정
    const cardThresholdHeight = layoutSettings.cardThresholdHeight || 150;
    
    // 카드 본문 최소 높이 계산
    const headerHeight = this.headerEl ? this.headerEl.offsetHeight : 0;
    const footerHeight = this.footerEl ? this.footerEl.offsetHeight : 0;
    const headerFooterHeight = headerHeight + footerHeight;
    
    // 본문 최소 높이 설정 (카드 최소 높이에서 헤더와 푸터 높이를 뺀 값)
    if (this.bodyEl) {
      this.bodyEl.style.minHeight = `calc(${cardThresholdHeight}px - ${headerFooterHeight}px)`;
      
      // 메이슨리 레이아웃에서는 본문 높이가 콘텐츠에 따라 자동 조정됨
      if (this.layoutService.getLayoutType() === 'masonry') {
        this.bodyEl.style.height = 'auto';
      }
    }
    
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
    
    // 기존 내용 제거
    this.element.innerHTML = '';
    
    // 카드 렌더링 서비스를 사용하여 카드 다시 렌더링
    this.cardRenderingService.renderCard(this.card, this.element);
    
    // 카드 상태 클래스 추가
    if (this.isSelected) {
      this.element.classList.add('selected');
    } else {
      this.element.classList.remove('selected');
    }
    
    if (this.isFocused) {
      this.element.classList.add('focused');
    } else {
      this.element.classList.remove('focused');
    }
    
    // 이벤트 리스너 다시 등록
    this.registerEventListeners();
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
    
    // 요소 참조 저장
    this.element = cardElement;
    
    // 설정 가져오기
    const settings = this.cardService.getSettingsService().getSettings();
    const layoutSettings = settings.layout || {
      cardThresholdHeight: 150
    };
    
    // 카드 헤더 생성
    this.headerEl = document.createElement('div');
    this.headerEl.className = 'card-header';
    cardElement.appendChild(this.headerEl);
    
    // 카드 본문 생성
    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'card-body';
    cardElement.appendChild(this.bodyEl);
    
    // 카드 푸터 생성
    this.footerEl = document.createElement('div');
    this.footerEl.className = 'card-footer';
    cardElement.appendChild(this.footerEl);
    
    // 카드 렌더링
    this.cardRenderingService.renderHeader(this.card, this.headerEl);
    this.cardRenderingService.renderBody(this.card, this.bodyEl);
    this.cardRenderingService.renderFooter(this.card, this.footerEl);
    
    // CSS 변수 설정
    // 카드 크기 설정
    cardElement.style.setProperty('--card-width', `${settings.cardWidth || 250}px`);
    
    // 카드 높이 설정
    const cardThresholdHeight = layoutSettings.cardThresholdHeight || 150;
    
    // 카드 본문 최소 높이 계산
    const headerHeight = this.headerEl ? this.headerEl.offsetHeight : 0;
    const footerHeight = this.footerEl ? this.footerEl.offsetHeight : 0;
    const headerFooterHeight = headerHeight + footerHeight;
    
    // 본문 최소 높이 설정 (카드 최소 높이에서 헤더와 푸터 높이를 뺀 값)
    this.bodyEl.style.minHeight = `calc(${cardThresholdHeight}px - ${headerFooterHeight}px)`;
    
    // 메이슨리 레이아웃에서는 본문 높이가 콘텐츠에 따라 자동 조정됨
    if (this.layoutService.getLayoutType() === 'masonry') {
      this.bodyEl.style.height = 'auto';
    }
    
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
    cardElement.style.setProperty('--card-active-border-width', `${settings.activeCardBorderWidth || 2}px`);
    cardElement.style.setProperty('--card-active-border-radius', `${settings.activeCardBorderRadius || 5}px`);
    
    // 카드 포커스 스타일 설정
    cardElement.style.setProperty('--card-focus-bg-color', settings.focusedCardBgColor || 'var(--background-primary-alt)');
    cardElement.style.setProperty('--card-focus-border-color', settings.focusedCardBorderColor || 'var(--interactive-accent)');
    cardElement.style.setProperty('--card-focus-border-width', `${settings.focusedCardBorderWidth || 3}px`);
    cardElement.style.setProperty('--card-focus-border-radius', `${settings.focusedCardBorderRadius || 5}px`);
    
    // 헤더 스타일 설정
    this.headerEl.style.backgroundColor = settings.headerBgColor || '';
    this.headerEl.style.fontSize = `${settings.headerFontSize || 16}px`;
    this.headerEl.style.borderBottomStyle = settings.headerBorderStyle || 'none';
    this.headerEl.style.borderBottomColor = settings.headerBorderColor || '';
    this.headerEl.style.borderBottomWidth = `${settings.headerBorderWidth || 0}px`;
    this.headerEl.style.borderRadius = `${settings.headerBorderRadius || 0}px ${settings.headerBorderRadius || 0}px 0 0`;
    
    // 본문 스타일 설정
    this.bodyEl.style.backgroundColor = settings.bodyBgColor || '';
    this.bodyEl.style.fontSize = `${settings.bodyFontSize || 14}px`;
    this.bodyEl.style.borderTopStyle = settings.bodyBorderStyle || 'none';
    this.bodyEl.style.borderTopColor = settings.bodyBorderColor || '';
    this.bodyEl.style.borderTopWidth = `${settings.bodyBorderWidth || 0}px`;
    this.bodyEl.style.borderBottomStyle = settings.bodyBorderStyle || 'none';
    this.bodyEl.style.borderBottomColor = settings.bodyBorderColor || '';
    this.bodyEl.style.borderBottomWidth = `${settings.bodyBorderWidth || 0}px`;
    this.bodyEl.style.borderRadius = `0 0 ${settings.bodyBorderRadius || 0}px ${settings.bodyBorderRadius || 0}px`;
    
    // 푸터 스타일 설정
    this.footerEl.style.backgroundColor = settings.footerBgColor || '';
    this.footerEl.style.fontSize = `${settings.footerFontSize || 12}px`;
    this.footerEl.style.borderTopStyle = settings.footerBorderStyle || 'none';
    this.footerEl.style.borderTopColor = settings.footerBorderColor || '';
    this.footerEl.style.borderTopWidth = `${settings.footerBorderWidth || 0}px`;
    this.footerEl.style.borderRadius = `0 0 ${settings.footerBorderRadius || 0}px ${settings.footerBorderRadius || 0}px`;
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
    
    return cardElement;
  }
  
  /**
   * 컴포넌트 렌더링
   * @param container 컨테이너 요소 (선택 사항)
   * @returns 생성된 컴포넌트 요소
   */
  async render(container?: HTMLElement): Promise<HTMLElement> {
    // 기본 렌더링 로직 실행
    return super.render(container);
  }
  
  /**
   * 클릭 이벤트 핸들러
   * @param event 클릭 이벤트
   */
  private handleClick = (event: MouseEvent): void => {
    // 이벤트 버블링 방지
    event.stopPropagation();
    
    // 카드 ID 가져오기
    const cardId = this.card.id || this.card.path || '';
    
    // 카드 선택 이벤트 발생
    this.interactionService.handleCardClick(cardId, event);
  };
  
  /**
   * 더블 클릭 이벤트 핸들러
   * @param event 더블 클릭 이벤트
   */
  private handleDoubleClick = (event: MouseEvent): void => {
    // 이벤트 버블링 방지
    event.stopPropagation();
    
    // 카드 ID 가져오기
    const cardId = this.card.id || this.card.path || '';
    
    // 카드 더블 클릭 이벤트 발생
    this.interactionService.handleCardDoubleClick(cardId, event);
  };
  
  /**
   * 마우스 오버 이벤트 핸들러
   * @param event 마우스 오버 이벤트
   */
  private handleMouseOver = (event: MouseEvent): void => {
    // 카드 ID 가져오기
    const cardId = this.card.id || this.card.path || '';
    
    // 카드 마우스 오버 이벤트 발생
    this.interactionService.handleCardMouseEnter(cardId, event);
  };
  
  /**
   * 마우스 아웃 이벤트 핸들러
   * @param event 마우스 아웃 이벤트
   */
  private handleMouseOut = (event: MouseEvent): void => {
    // 카드 ID 가져오기
    const cardId = this.card.id || this.card.path || '';
    
    // 카드 마우스 아웃 이벤트 발생
    this.interactionService.handleCardMouseLeave(cardId, event);
  };
  
  /**
   * 컨텍스트 메뉴 이벤트 핸들러
   * @param event 컨텍스트 메뉴 이벤트
   */
  private handleContextMenu = (event: MouseEvent): void => {
    // 이벤트 버블링 방지
    event.stopPropagation();
    event.preventDefault();
    
    // 카드 ID 가져오기
    const cardId = this.card.id || this.card.path || '';
    
    // 카드 컨텍스트 메뉴 이벤트 발생
    this.interactionService.handleCardContextMenu(cardId, event);
  };
  
  /**
   * 드래그 시작 이벤트 핸들러
   * @param event 드래그 시작 이벤트
   */
  private handleDragStart = (event: DragEvent): void => {
    // 카드 ID 가져오기
    const cardId = this.card.id || this.card.path || '';
    
    // 드래그 시작 이벤트 발생
    this.interactionService.handleCardDragStart(cardId, event);
  };
  
  /**
   * 드래그 종료 이벤트 핸들러
   * @param event 드래그 종료 이벤트
   */
  private handleDragEnd = (event: DragEvent): void => {
    // 카드 ID 가져오기
    const cardId = this.card.id || this.card.path || '';
    
    // 드래그 종료 이벤트 발생
    this.interactionService.handleCardDragEnd(cardId, event);
  };
  
  /**
   * 드래그 오버 이벤트 핸들러
   * @param event 드래그 오버 이벤트
   */
  private handleDragOver = (event: DragEvent): void => {
    // 이벤트 기본 동작 방지
    event.preventDefault();
    
    // 카드 ID 가져오기
    const cardId = this.card.id || this.card.path || '';
    
    // 드래그 오버 이벤트 발생 - 현재 InteractionService에 구현되어 있지 않으므로 주석 처리
    // this.interactionService.handleCardDragOver(cardId, event);
  };
  
  /**
   * 드롭 이벤트 핸들러
   * @param event 드롭 이벤트
   */
  private handleDrop = (event: DragEvent): void => {
    // 이벤트 기본 동작 방지
    event.preventDefault();
    
    // 카드 ID 가져오기
    const cardId = this.card.id || this.card.path || '';
    
    // 드롭 이벤트 발생
    this.interactionService.handleCardDrop(cardId, event);
  };
} 