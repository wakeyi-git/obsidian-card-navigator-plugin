import { ICard } from '../../domain/card/Card';
import { ICardList } from '../../domain/cardlist/CardList';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ICardInteractionHandler } from '../../domain/interaction/CardInteraction';
import { CardView } from './CardView';

/**
 * 카드 리스트 뷰 컴포넌트
 * 여러 카드를 리스트로 표시합니다.
 */
export class CardListView {
  /**
   * 카드 리스트 데이터
   */
  private cardList: ICardList;
  
  /**
   * 이벤트 버스
   */
  private eventBus: DomainEventBus;
  
  /**
   * 카드 상호작용 핸들러
   */
  private interactionHandler: ICardInteractionHandler;
  
  /**
   * 컨테이너 요소
   */
  private container: HTMLElement | null = null;
  
  /**
   * 카드 컨테이너 요소
   */
  private cardsContainer: HTMLElement | null = null;
  
  /**
   * 카드 뷰 맵
   */
  private cardViews: Map<string, CardView> = new Map();
  
  /**
   * 생성자
   * @param cardList 카드 리스트 데이터
   * @param interactionHandler 카드 상호작용 핸들러
   */
  constructor(cardList: ICardList, interactionHandler: ICardInteractionHandler) {
    this.cardList = cardList;
    this.interactionHandler = interactionHandler;
    this.eventBus = DomainEventBus.getInstance();
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 카드 리스트 업데이트 이벤트 리스너
    this.eventBus.on(EventType.CARD_LIST_UPDATED, (data) => {
      if (data.listId === this.cardList.id) {
        this.updateCardList(data.cardList);
      }
    });
    
    // 카드 추가 이벤트 리스너
    this.eventBus.on(EventType.CARD_ADDED, (data) => {
      if (data.listId === this.cardList.id) {
        this.addCard(data.card);
      }
    });
    
    // 카드 제거 이벤트 리스너
    this.eventBus.on(EventType.CARD_REMOVED, (data) => {
      if (data.listId === this.cardList.id) {
        this.removeCard(data.cardId);
      }
    });
    
    // 카드 정렬 이벤트 리스너
    this.eventBus.on(EventType.CARDS_SORTED, (data) => {
      if (data.listId === this.cardList.id) {
        this.sortCards(data.sortType, data.sortDirection);
      }
    });
  }
  
  /**
   * 카드 리스트 업데이트
   * @param cardList 업데이트된 카드 리스트 데이터
   */
  private updateCardList(cardList: ICardList): void {
    this.cardList = cardList;
    
    // 카드 컨테이너가 있는 경우 다시 렌더링
    if (this.cardsContainer) {
      this.renderCards();
    }
  }
  
  /**
   * 카드 추가
   * @param card 추가할 카드 데이터
   */
  private addCard(card: ICard): void {
    // 이미 존재하는 카드인 경우 무시
    if (this.cardViews.has(card.id)) {
      return;
    }
    
    // 카드 컨테이너가 있는 경우 카드 추가
    if (this.cardsContainer) {
      const cardView = new CardView(card, this.interactionHandler);
      cardView.render(this.cardsContainer);
      
      // 카드 뷰 맵에 추가
      this.cardViews.set(card.id, cardView);
    }
  }
  
  /**
   * 카드 제거
   * @param cardId 제거할 카드 ID
   */
  private removeCard(cardId: string): void {
    // 카드 뷰 맵에서 제거
    this.cardViews.delete(cardId);
    
    // 카드 컨테이너가 있는 경우 카드 요소 제거
    if (this.cardsContainer) {
      const cardElement = this.cardsContainer.querySelector(`[data-card-id="${cardId}"]`);
      if (cardElement) {
        cardElement.remove();
      }
    }
  }
  
  /**
   * 카드 정렬
   * @param sortType 정렬 타입
   * @param sortDirection 정렬 방향
   */
  private sortCards(sortType: string, sortDirection: 'asc' | 'desc'): void {
    // 카드 컨테이너가 있는 경우 다시 렌더링
    if (this.cardsContainer) {
      this.renderCards();
    }
  }
  
  /**
   * 컴포넌트 렌더링
   * @param container 컨테이너 요소
   */
  render(container: HTMLElement): void {
    this.container = container;
    
    // 컨테이너 초기화
    container.empty();
    container.addClass('card-navigator-card-list');
    
    // 헤더 생성
    this.createHeader(container);
    
    // 카드 컨테이너 생성
    this.cardsContainer = container.createDiv({ cls: 'card-navigator-cards-container' });
    
    // 카드 렌더링
    this.renderCards();
    
    // 푸터 생성
    this.createFooter(container);
  }
  
  /**
   * 헤더 생성
   * @param container 컨테이너 요소
   */
  private createHeader(container: HTMLElement): void {
    const header = container.createDiv({ cls: 'card-navigator-card-list-header' });
    
    // 리스트 제목
    const title = header.createDiv({ cls: 'card-navigator-card-list-title' });
    title.setText(this.cardList.name || '카드 리스트');
    
    // 카드 수
    const count = header.createDiv({ cls: 'card-navigator-card-list-count' });
    count.setText(`${this.cardList.cards.length}개의 카드`);
    
    // 정렬 옵션
    const sortOptions = header.createDiv({ cls: 'card-navigator-card-list-sort' });
    
    // 정렬 라벨
    const sortLabel = sortOptions.createSpan({ cls: 'card-navigator-card-list-sort-label' });
    sortLabel.setText('정렬:');
    
    // 정렬 선택
    const sortSelect = sortOptions.createEl('select', { cls: 'card-navigator-card-list-sort-select' });
    
    // 정렬 옵션 추가
    const sortTypes = [
      { value: 'title', text: '제목' },
      { value: 'path', text: '경로' },
      { value: 'created', text: '생성일' },
      { value: 'modified', text: '수정일' }
    ];
    
    sortTypes.forEach(type => {
      const option = sortSelect.createEl('option', {
        value: type.value,
        text: type.text
      });
      
      // 현재 정렬 타입인 경우 선택
      if (type.value === this.cardList.sortType) {
        option.selected = true;
      }
    });
    
    // 정렬 방향 버튼
    const sortDirection = sortOptions.createDiv({
      cls: `card-navigator-card-list-sort-direction ${this.cardList.sortDirection}`
    });
    
    sortDirection.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-up"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
    
    // 정렬 선택 이벤트
    sortSelect.addEventListener('change', (event) => {
      const select = event.target as HTMLSelectElement;
      this.handleSortChange(select.value, this.cardList.sortDirection);
    });
    
    // 정렬 방향 이벤트
    sortDirection.addEventListener('click', () => {
      const newDirection = this.cardList.sortDirection === 'asc' ? 'desc' : 'asc';
      this.handleSortChange(this.cardList.sortType, newDirection);
    });
  }
  
  /**
   * 카드 렌더링
   */
  private renderCards(): void {
    if (!this.cardsContainer) return;
    
    // 카드 컨테이너 초기화
    this.cardsContainer.empty();
    this.cardViews.clear();
    
    // 카드가 없는 경우 메시지 표시
    if (this.cardList.cards.length === 0) {
      const emptyMessage = this.cardsContainer.createDiv({ cls: 'card-navigator-empty-message' });
      emptyMessage.setText('카드가 없습니다.');
      return;
    }
    
    // 카드 렌더링
    this.cardList.cards.forEach(card => {
      const cardView = new CardView(card, this.interactionHandler);
      cardView.render(this.cardsContainer!);
      
      // 카드 뷰 맵에 추가
      this.cardViews.set(card.id, cardView);
    });
  }
  
  /**
   * 푸터 생성
   * @param container 컨테이너 요소
   */
  private createFooter(container: HTMLElement): void {
    const footer = container.createDiv({ cls: 'card-navigator-card-list-footer' });
    
    // 페이지네이션 (필요한 경우)
    if (this.cardList.totalPages > 1) {
      const pagination = footer.createDiv({ cls: 'card-navigator-pagination' });
      
      // 이전 페이지 버튼
      const prevButton = pagination.createDiv({
        cls: `card-navigator-pagination-prev ${this.cardList.currentPage <= 1 ? 'disabled' : ''}`
      });
      
      prevButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-left"><polyline points="15 18 9 12 15 6"></polyline></svg>';
      
      // 페이지 정보
      const pageInfo = pagination.createDiv({ cls: 'card-navigator-pagination-info' });
      pageInfo.setText(`${this.cardList.currentPage} / ${this.cardList.totalPages}`);
      
      // 다음 페이지 버튼
      const nextButton = pagination.createDiv({
        cls: `card-navigator-pagination-next ${this.cardList.currentPage >= this.cardList.totalPages ? 'disabled' : ''}`
      });
      
      nextButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>';
      
      // 이전 페이지 이벤트
      if (this.cardList.currentPage > 1) {
        prevButton.addEventListener('click', () => {
          this.handlePageChange(this.cardList.currentPage - 1);
        });
      }
      
      // 다음 페이지 이벤트
      if (this.cardList.currentPage < this.cardList.totalPages) {
        nextButton.addEventListener('click', () => {
          this.handlePageChange(this.cardList.currentPage + 1);
        });
      }
    }
    
    // 액션 버튼
    const actions = footer.createDiv({ cls: 'card-navigator-card-list-actions' });
    
    // 새 카드 버튼
    const newCardButton = actions.createDiv({ cls: 'card-navigator-card-list-action card-navigator-new-card' });
    newCardButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
    newCardButton.setText('새 카드');
    
    // 새 카드 버튼 이벤트
    newCardButton.addEventListener('click', () => {
      this.handleNewCard();
    });
  }
  
  /**
   * 정렬 변경 처리
   * @param sortType 정렬 타입
   * @param sortDirection 정렬 방향
   */
  private handleSortChange(sortType: string, sortDirection: 'asc' | 'desc'): void {
    // 이벤트 발생
    this.eventBus.emit(EventType.SORT_REQUESTED, {
      listId: this.cardList.id,
      sortType,
      sortDirection
    });
  }
  
  /**
   * 페이지 변경 처리
   * @param page 페이지 번호
   */
  private handlePageChange(page: number): void {
    // 이벤트 발생
    this.eventBus.emit(EventType.PAGE_CHANGED, {
      listId: this.cardList.id,
      page
    });
  }
  
  /**
   * 새 카드 처리
   */
  private handleNewCard(): void {
    // 이벤트 발생
    this.eventBus.emit(EventType.NEW_CARD_REQUESTED, {
      listId: this.cardList.id
    });
  }
  
  /**
   * 카드 리스트 가져오기
   * @returns 카드 리스트
   */
  getCardList(): ICardList {
    return this.cardList;
  }
} 