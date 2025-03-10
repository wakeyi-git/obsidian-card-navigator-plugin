import { ICard } from '../../domain/card/Card';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ICardInteractionHandler } from '../../domain/interaction/CardInteraction';

/**
 * 카드 뷰 컴포넌트
 * 카드 UI를 담당합니다.
 */
export class CardView {
  /**
   * 카드 데이터
   */
  private card: ICard;
  
  /**
   * 이벤트 버스
   */
  private eventBus: DomainEventBus;
  
  /**
   * 카드 상호작용 핸들러
   */
  private interactionHandler: ICardInteractionHandler;
  
  /**
   * 카드 요소
   */
  private cardElement: HTMLElement | null = null;
  
  /**
   * 생성자
   * @param card 카드 데이터
   * @param interactionHandler 카드 상호작용 핸들러
   */
  constructor(card: ICard, interactionHandler: ICardInteractionHandler) {
    this.card = card;
    this.interactionHandler = interactionHandler;
    this.eventBus = DomainEventBus.getInstance();
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 카드 업데이트 이벤트 리스너
    this.eventBus.on(EventType.CARD_UPDATED, (data) => {
      if (data.cardId === this.card.id) {
        this.updateCard(data.card);
      }
    });
    
    // 카드 선택 이벤트 리스너
    this.eventBus.on(EventType.CARD_SELECTED, (data) => {
      if (data.cardId === this.card.id) {
        this.selectCard();
      } else if (this.cardElement?.hasClass('selected')) {
        this.deselectCard();
      }
    });
  }
  
  /**
   * 카드 업데이트
   * @param card 업데이트된 카드 데이터
   */
  private updateCard(card: ICard): void {
    this.card = card;
    
    // 카드 요소가 있는 경우 다시 렌더링
    if (this.cardElement) {
      this.renderCardContent(this.cardElement);
    }
  }
  
  /**
   * 카드 선택
   */
  private selectCard(): void {
    if (this.cardElement) {
      this.cardElement.addClass('selected');
    }
  }
  
  /**
   * 카드 선택 해제
   */
  private deselectCard(): void {
    if (this.cardElement) {
      this.cardElement.removeClass('selected');
    }
  }
  
  /**
   * 컴포넌트 렌더링
   * @param container 컨테이너 요소
   * @returns 렌더링된 카드 요소
   */
  render(container: HTMLElement): HTMLElement {
    // 카드 요소 생성
    this.cardElement = container.createDiv({
      cls: 'card-navigator-card',
      attr: {
        'data-card-id': this.card.id
      }
    });
    
    // 카드 내용 렌더링
    this.renderCardContent(this.cardElement);
    
    // 이벤트 리스너 추가
    this.addEventListeners(this.cardElement);
    
    return this.cardElement;
  }
  
  /**
   * 카드 내용 렌더링
   * @param cardElement 카드 요소
   */
  private renderCardContent(cardElement: HTMLElement): void {
    // 카드 요소 초기화
    cardElement.empty();
    
    // 카드 헤더 생성
    const header = cardElement.createDiv({ cls: 'card-navigator-card-header' });
    
    // 카드 제목
    const title = header.createDiv({ cls: 'card-navigator-card-title' });
    title.setText(this.card.title || '제목 없음');
    
    // 카드 메타 정보
    if (this.card.path) {
      const meta = header.createDiv({ cls: 'card-navigator-card-meta' });
      meta.setText(this.card.path);
    }
    
    // 카드 태그
    if (this.card.tags && this.card.tags.length > 0) {
      const tagsContainer = cardElement.createDiv({ cls: 'card-navigator-card-tags' });
      
      this.card.tags.forEach(tag => {
        const tagElement = tagsContainer.createSpan({ cls: 'card-navigator-card-tag' });
        tagElement.setText(tag);
        
        // 태그 클릭 이벤트
        tagElement.addEventListener('click', (event) => {
          event.stopPropagation();
          this.interactionHandler.onTagClick(tag, this.card);
        });
      });
    }
    
    // 카드 내용
    if (this.card.content) {
      const content = cardElement.createDiv({ cls: 'card-navigator-card-content' });
      
      // 내용 길이 제한
      const maxLength = 200;
      const displayContent = this.card.content.length > maxLength
        ? this.card.content.substring(0, maxLength) + '...'
        : this.card.content;
      
      content.setText(displayContent);
    }
    
    // 카드 푸터
    const footer = cardElement.createDiv({ cls: 'card-navigator-card-footer' });
    
    // 생성일
    if (this.card.created) {
      const created = footer.createDiv({ cls: 'card-navigator-card-created' });
      created.setText(`생성: ${this.formatDate(this.card.created)}`);
    }
    
    // 수정일
    if (this.card.modified) {
      const modified = footer.createDiv({ cls: 'card-navigator-card-modified' });
      modified.setText(`수정: ${this.formatDate(this.card.modified)}`);
    }
    
    // 카드 액션 버튼
    const actions = footer.createDiv({ cls: 'card-navigator-card-actions' });
    
    // 편집 버튼
    const editButton = actions.createDiv({ cls: 'card-navigator-card-action card-navigator-card-edit' });
    editButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>';
    editButton.setAttribute('title', '편집');
    
    // 편집 버튼 클릭 이벤트
    editButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.interactionHandler.onEditClick(this.card);
    });
    
    // 열기 버튼
    const openButton = actions.createDiv({ cls: 'card-navigator-card-action card-navigator-card-open' });
    openButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-external-link"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
    openButton.setAttribute('title', '열기');
    
    // 열기 버튼 클릭 이벤트
    openButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.interactionHandler.onOpenClick(this.card);
    });
  }
  
  /**
   * 이벤트 리스너 추가
   * @param cardElement 카드 요소
   */
  private addEventListeners(cardElement: HTMLElement): void {
    // 카드 클릭 이벤트
    cardElement.addEventListener('click', () => {
      this.interactionHandler.onCardClick(this.card);
    });
    
    // 카드 더블 클릭 이벤트
    cardElement.addEventListener('dblclick', () => {
      this.interactionHandler.onCardDoubleClick(this.card);
    });
    
    // 카드 컨텍스트 메뉴 이벤트
    cardElement.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      this.interactionHandler.onCardContextMenu(this.card, event);
    });
    
    // 드래그 앤 드롭 이벤트
    cardElement.setAttribute('draggable', 'true');
    
    cardElement.addEventListener('dragstart', (event) => {
      this.interactionHandler.onCardDragStart(this.card, event as DragEvent);
    });
    
    cardElement.addEventListener('dragend', (event) => {
      this.interactionHandler.onCardDragEnd(this.card, event as DragEvent);
    });
  }
  
  /**
   * 날짜 포맷팅
   * @param date 날짜
   * @returns 포맷팅된 날짜 문자열
   */
  private formatDate(date: Date | number): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
} 