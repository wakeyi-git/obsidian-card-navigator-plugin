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
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: NodeJS.Timeout | null = null;
  
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
    const layoutType = this.layoutService.getLayoutType();
    cardSetElement.classList.add(`layout-${layoutType}`);
    
    // 레이아웃 방향 클래스 추가
    const layoutDirection = this.layoutService.getLayoutDirection();
    cardSetElement.classList.add(`direction-${layoutDirection}`);
    
    // 스크롤 방향 클래스 추가
    const scrollDirection = this.layoutService.getScrollDirection();
    cardSetElement.classList.add(`scroll-${scrollDirection}`);
    
    // 카드 렌더링
    this.renderCards(cardSetElement);
    
    // ResizeObserver 설정
    this.setupResizeObserver(cardSetElement);
    
    return cardSetElement;
  }
  
  /**
   * ResizeObserver 설정
   * @param element 관찰할 요소
   */
  private setupResizeObserver(element: HTMLElement): void {
    // 기존 ResizeObserver 정리
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // 새 ResizeObserver 생성
    this.resizeObserver = new ResizeObserver((entries) => {
      // 디바운스 처리
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      
      this.resizeTimeout = setTimeout(() => {
        for (const entry of entries) {
          // 요소 크기가 변경되면 카드 다시 렌더링
          this.renderCards(element);
        }
      }, 100); // 100ms 디바운스
    });
    
    // 요소 관찰 시작
    this.resizeObserver.observe(element);
  }
  
  /**
   * 카드 렌더링
   * @param container 컨테이너 요소
   */
  private renderCards(container: HTMLElement): void {
    // 기존 컨테이너 내용 모두 제거
    container.innerHTML = '';
    
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
    
    // 컨테이너 크기 가져오기
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width || 800;
    const containerHeight = containerRect.height || 600;
    
    // 화면 너비 확인
    const windowWidth = window.innerWidth;
    
    // 패딩 및 여백 고려
    const containerPadding = 20; // 좌우 패딩 합계
    const effectiveWidth = Math.max(250, containerWidth - containerPadding);
    
    // 화면 너비에 따라 열 수 결정
    let forceSingleColumn = false;
    if (windowWidth <= 600 || effectiveWidth < 500) {
      forceSingleColumn = true;
    }
    
    // 레이아웃 계산
    const layoutInfo = this.layoutService.calculateLayout(
      effectiveWidth,
      containerHeight,
      sortedCards.length
    );
    
    // 열 수 조정 (화면이 좁으면 1열로 강제)
    const columns = forceSingleColumn ? 1 : layoutInfo.columns;
    
    // 그리드 레이아웃 스타일 적용
    if (this.layoutService.getLayoutType() === 'grid') {
      // 컨테이너에 패딩 추가
      container.style.padding = '10px';
      container.style.boxSizing = 'border-box';
      
      if (columns === 1) {
        // 1열인 경우 단순 설정
        container.style.gridTemplateColumns = '1fr';
      } else {
        // 여러 열인 경우 균등 분배
        container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
      }
      
      if (layoutInfo.fixedHeight) {
        container.style.gridAutoRows = `${layoutInfo.itemHeight}px`;
      } else {
        container.style.gridAutoRows = 'minmax(120px, auto)';
      }
    }
    
    // 아이템 너비 계산 (동적)
    let itemWidth: number = layoutInfo.itemWidth;
    
    // 디버깅 정보 출력
    console.log('카드셋 렌더링:', {
      containerWidth,
      effectiveWidth,
      columns,
      itemWidth,
      cardCount: sortedCards.length,
      forceSingleColumn,
      layoutColumns: layoutInfo.columns
    });
    
    // 카드 컴포넌트 생성 및 렌더링
    sortedCards.forEach(card => {
      // 카드 컨테이너 생성
      const cardContainer = document.createElement('div');
      cardContainer.className = 'card-container';
      
      // 동적 크기 적용
      if (this.layoutService.getLayoutType() === 'grid') {
        if (columns === 1) {
          // 1열인 경우 너비를 100%로 설정하고 최대 너비 제한
          cardContainer.style.width = '100%';
          cardContainer.style.maxWidth = '100%';
        } else if (layoutInfo.fixedHeight) {
          // 여러 열이고 고정 높이인 경우
          // 너비를 계산된 아이템 너비로 설정 (오버플로우 방지)
          cardContainer.style.width = `${itemWidth}px`;
          cardContainer.style.height = `${layoutInfo.itemHeight}px`;
          
          // 너비가 너무 작으면 최소 너비 보장
          if (itemWidth < 200) {
            cardContainer.style.minWidth = '200px';
          }
        }
      }
      
      // 카드 컨테이너에 패딩 추가
      cardContainer.style.boxSizing = 'border-box';
      
      // 컨테이너에 추가
      container.appendChild(cardContainer);
      
      // 카드 컴포넌트 생성
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
      
      // 윈도우 리사이즈 이벤트 리스너 등록
      window.addEventListener('resize', this.handleWindowResize);
    }
  }
  
  /**
   * 이벤트 리스너 제거
   */
  removeEventListeners(): void {
    if (this.element) {
      this.element.removeEventListener('dragover', this.handleDragOver);
      this.element.removeEventListener('drop', this.handleDrop);
      
      // 윈도우 리사이즈 이벤트 리스너 제거
      window.removeEventListener('resize', this.handleWindowResize);
      
      // ResizeObserver 정리
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      
      // 타임아웃 정리
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = null;
      }
    }
  }
  
  /**
   * 윈도우 리사이즈 이벤트 핸들러
   */
  private handleWindowResize = (): void => {
    // 디바운스 처리
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = setTimeout(() => {
      if (this.element) {
        this.renderCards(this.element);
      }
    }, 100); // 100ms 디바운스
  };
  
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