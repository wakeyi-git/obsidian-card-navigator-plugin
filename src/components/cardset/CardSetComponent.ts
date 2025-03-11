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
import { ILayoutInfo } from '../../domain/layout/Layout';

/**
 * 카드셋 컴포넌트 인터페이스
 */
export interface ICardSetComponent {
  /**
   * 카드셋 데이터 설정
   * @param cardSet 카드셋 데이터
   */
  setCardSet(cardSet: ICardSet): Promise<void>;
  
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
  private lastContainerWidth = 0;
  private lastContainerHeight = 0;
  
  // 바인딩된 이벤트 핸들러
  private boundHandleWindowResize: () => void;
  private boundHandleDragOver: (event: DragEvent) => void;
  private boundHandleDrop: (event: DragEvent) => void;

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
    
    // 이벤트 핸들러 바인딩
    this.boundHandleWindowResize = this.handleWindowResize.bind(this);
    this.boundHandleDragOver = this.handleDragOver.bind(this);
    this.boundHandleDrop = this.handleDrop.bind(this);
  }
  
  /**
   * 카드셋 데이터 설정
   * @param cardSet 카드셋 데이터
   */
  async setCardSet(cardSet: ICardSet): Promise<void> {
    this.cardSet = cardSet;
    await this.update();
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
  protected async createComponent(): Promise<HTMLElement> {
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
    await this.renderCards(cardSetElement);
    
    // ResizeObserver 설정
    this.setupResizeObserver(cardSetElement);
    
    return cardSetElement;
  }
  
  /**
   * ResizeObserver 설정
   * @param element 관찰할 요소
   */
  private setupResizeObserver(element: HTMLElement): void {
    // ResizeObserver 설정
    this.resizeObserver = new ResizeObserver((entries) => {
      // 디바운스 처리
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      
      this.resizeTimeout = setTimeout(() => {
        for (const entry of entries) {
          if (entry.target === element) {
            this.renderCards(element);
          }
        }
      }, 500); // 500ms 디바운스 (기존 300ms에서 증가)
    });
    
    this.resizeObserver.observe(element);
  }
  
  /**
   * 카드 렌더링
   * @param container 컨테이너 요소
   */
  private async renderCards(container: HTMLElement): Promise<void> {
    // 컨테이너가 없으면 무시
    if (!container) return;
    
    // 카드셋이 없으면 무시
    if (!this.cardSet) return;
    
    // 카드 목록 가져오기
    const files = this.cardSet.files || [];
    
    // 파일이 없으면 빈 메시지 표시
    if (files.length === 0) {
      container.innerHTML = '<div class="card-navigator-empty-message">카드가 없습니다.</div>';
      return;
    }
    
    // 파일 목록을 카드로 변환
    const cardPromises = files.map(file => this.cardService.getCardByPath(file.path));
    const cardResults = await Promise.all(cardPromises);
    const cards = cardResults.filter(card => card !== null) as ICard[];
    
    // 정렬된 카드 목록 가져오기
    const sortedCards = this.sortingService.sortCards(cards);
    
    // 컨테이너 크기 측정
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width || 800;
    const containerHeight = containerRect.height || 600;
    
    // 컨테이너 크기가 유효하지 않으면 무시
    if (containerWidth <= 0 || containerHeight <= 0) return;
    
    // 레이아웃 타입에 따른 클래스 추가
    container.className = 'card-navigator-cardset';
    
    // 레이아웃 타입 및 방향 클래스 추가
    const layoutType = this.layoutService.getLayoutType();
    container.classList.add(`layout-${layoutType}`);
    
    const layoutDirection = this.layoutService.getLayoutDirection();
    container.classList.add(`direction-${layoutDirection}`);
    
    const scrollDirection = this.layoutService.getScrollDirection();
    container.classList.add(`scroll-${scrollDirection}`);
    
    // 트랜지션 클래스 추가
    if (this.layoutService.useLayoutTransition()) {
      container.classList.add('use-transition');
    }
    
    // 카드셋 ID 설정
    container.dataset.id = this.cardSet.id;
    
    // 레이아웃 계산이 필요한지 확인
    const lastCalc = this.layoutService.getLastCalculation();
    const needsRecalculation = this.isLayoutRecalculationNeeded(
      lastCalc, 
      containerWidth, 
      containerHeight, 
      sortedCards.length
    );
    
    // 레이아웃 정보 가져오기 또는 계산하기
    let layoutInfo: ILayoutInfo;
    
    if (!needsRecalculation && lastCalc) {
      // 레이아웃 계산이 필요 없으면 기존 레이아웃 정보 사용
      layoutInfo = lastCalc;
    } else {
      // 레이아웃 계산
      layoutInfo = this.layoutService.calculateLayout(
        containerWidth,
        containerHeight,
        sortedCards.length
      );
      
      // 디버깅 정보 출력
      console.log('카드셋 렌더링:', {
        containerWidth,
        cardCount: sortedCards.length,
        layoutType: this.layoutService.getLayoutType()
      });
    }
    
    // CSS 변수 적용
    this.layoutService.applyCssVariables(container, layoutInfo);
    
    // 컨테이너 초기화 (기존 카드 제거)
    container.innerHTML = '';
    
    // 카드 컴포넌트 생성 및 렌더링
    for (const card of sortedCards) {
      // 카드 컨테이너 생성
      const cardContainer = document.createElement('div');
      cardContainer.className = 'card-container';
      
      // 카드 ID 확인 (undefined 방지)
      const cardId = card.id || card.path || '';
      
      // 카드 컴포넌트 생성 또는 재사용
      let cardComponent = this.cardComponents.get(cardId);
      
      if (!cardComponent) {
        // 새 카드 컴포넌트 생성
        cardComponent = new CardComponent(
          card,
          this.cardService,
          this.cardRenderingService,
          this.interactionService
        );
        this.cardComponents.set(cardId, cardComponent);
      } else {
        // 기존 컴포넌트 정리 후 재사용
        cardComponent.remove(); // DOM 요소 정리
        cardComponent.setCard(card);
      }
      
      // 카드 컴포넌트 렌더링
      try {
        await cardComponent.render(cardContainer);
        
        // 선택 상태 적용
        if (this.selectedCardIds.has(cardId)) {
          cardComponent.setSelected(true);
        }
        
        // 포커스 상태 적용
        if (this.focusedCardId === cardId) {
          cardComponent.setFocused(true);
        }
        
        // 컨테이너에 추가
        container.appendChild(cardContainer);
      } catch (error) {
        console.error(`카드 렌더링 중 오류 발생 (ID: ${cardId}):`, error);
      }
    }
  }
  
  /**
   * 레이아웃 재계산이 필요한지 확인
   * @param lastCalc 마지막 계산 결과
   * @param containerWidth 현재 컨테이너 너비
   * @param containerHeight 현재 컨테이너 높이
   * @param itemCount 현재 아이템 수
   * @returns 재계산 필요 여부
   */
  private isLayoutRecalculationNeeded(
    lastCalc: ILayoutInfo | null,
    containerWidth: number,
    containerHeight: number,
    itemCount: number
  ): boolean {
    // 마지막 계산 결과가 없으면 계산 필요
    if (!lastCalc) return true;
    
    // 아이템 수가 변경되었으면 계산 필요
    if (lastCalc.itemCount !== itemCount) return true;
    
    // 컨테이너 크기가 크게 변경되었으면 계산 필요
    // 너비/높이가 10% 이상 변경되었거나 절대값으로 30px 이상 변경된 경우
    const widthChange = Math.abs(containerWidth - lastCalc.containerWidth);
    const heightChange = Math.abs(containerHeight - lastCalc.containerHeight);
    const widthChangePercent = widthChange / lastCalc.containerWidth * 100;
    const heightChangePercent = heightChange / lastCalc.containerHeight * 100;
    
    if (widthChange > 30 || heightChange > 30 || 
        widthChangePercent > 10 || heightChangePercent > 10) {
      return true;
    }
    
    // 레이아웃 타입이 변경되었으면 계산 필요
    if (lastCalc.fixedHeight !== (this.layoutService.getLayoutType() === 'grid')) {
      return true;
    }
    
    // 그 외의 경우 재계산 불필요
    return false;
  }
  
  /**
   * 컴포넌트 제거
   * 이벤트 리스너 제거 및 리소스 정리
   */
  remove(): void {
    // 이벤트 리스너 제거
    this.removeEventListeners();
    
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
    
    // 카드 컴포넌트 정리
    this.cardComponents.forEach(cardComponent => {
      cardComponent.remove();
    });
    this.cardComponents.clear();
    
    // 컨테이너 참조 제거
    this.container = null;
    
    console.log('카드셋 컴포넌트 제거 완료');
  }
  
  /**
   * 이벤트 리스너 등록
   */
  registerEventListeners(): void {
    // 이벤트 리스너가 중복 등록되지 않도록 먼저 제거
    this.removeEventListeners();
    
    // 윈도우 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', this.boundHandleWindowResize);
    
    // 드래그 앤 드롭 이벤트 리스너 등록
    if (this.container) {
      this.container.addEventListener('dragover', this.boundHandleDragOver);
      this.container.addEventListener('drop', this.boundHandleDrop);
    }
    
    console.log('카드셋 컴포넌트 이벤트 리스너 등록 완료');
  }
  
  /**
   * 이벤트 리스너 제거
   */
  removeEventListeners(): void {
    // 윈도우 리사이즈 이벤트 리스너 제거
    window.removeEventListener('resize', this.boundHandleWindowResize);
    
    // 드래그 앤 드롭 이벤트 리스너 제거
    if (this.container) {
      this.container.removeEventListener('dragover', this.boundHandleDragOver);
      this.container.removeEventListener('drop', this.boundHandleDrop);
    }
    
    console.log('카드셋 컴포넌트 이벤트 리스너 제거 완료');
  }
  
  /**
   * 윈도우 리사이즈 이벤트 핸들러
   */
  private handleWindowResize(): void {
    // 플러그인이 언로드된 경우 무시
    if (!this.container) return;
    
    const cardSetContainer = this.container.querySelector('.card-navigator-cardset');
    if (!cardSetContainer) return;
    
    // 컨테이너 크기 확인
    const rect = cardSetContainer.getBoundingClientRect();
    const currentWidth = rect.width;
    const currentHeight = rect.height;
    
    // 컨테이너 크기가 유효하지 않으면 무시
    if (currentWidth <= 0 || currentHeight <= 0) return;
    
    // 레이아웃 계산이 필요한지 확인
    const lastCalc = this.layoutService.getLastCalculation();
    const needsRecalculation = this.isLayoutRecalculationNeeded(
      lastCalc, 
      currentWidth, 
      currentHeight, 
      this.cardSet?.files?.length || 0
    );
    
    // 레이아웃 계산이 필요하면 카드 다시 렌더링
    if (needsRecalculation) {
      this.renderCards(cardSetContainer as HTMLElement);
    }
  }
  
  /**
   * 드래그 오버 이벤트 핸들러
   * @param event 드래그 이벤트
   */
  private handleDragOver = (event: DragEvent): void => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  };
  
  /**
   * 드롭 이벤트 핸들러
   * @param event 드래그 이벤트
   */
  private handleDrop = (event: DragEvent): void => {
    event.preventDefault();
    
    if (event.dataTransfer) {
      const cardId = event.dataTransfer.getData('text/plain');
      if (cardId) {
        this.interactionService.handleCardDrop(cardId, event);
      }
    }
  };
} 