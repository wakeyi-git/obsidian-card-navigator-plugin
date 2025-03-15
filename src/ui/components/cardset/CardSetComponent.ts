import { ICard } from '../../../domain/card/Card';
import { ICardSet } from '../../../domain/cardset/CardSet';
import { Component } from '../Component';
import { ICardSetService } from '../../../application/cardset/CardSetService';
import { ILayoutService } from '../../../application/layout/LayoutService';
import { ISortingService } from '../../../application/sorting/SortingService';
import { CardComponent } from '../card/CardComponent';
import { ICardService } from '../../../application/card/CardService';
import { ICardRenderingService } from '../../../application/card/CardRenderingService';
import { IInteractionService } from '../../../application/interaction/InteractionService';
import { ILayoutInfo } from '../../../domain/layout/Layout';
import { ObsidianService } from '../../../infrastructure/obsidian/adapters/ObsidianService';
import { EventType } from '../../../domain/events/EventTypes';
import { isSameCardSetId } from '../../../domain/cardset/CardSetUtils';

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
  private obsidianService: ObsidianService;
  private cardComponents: Map<string, CardComponent> = new Map();
  private selectedCardIds: Set<string> = new Set();
  private focusedCardId: string | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: NodeJS.Timeout | null = null;
  private lastContainerWidth = 0;
  private lastContainerHeight = 0;
  
  // 바인딩된 이벤트 핸들러
  private boundHandleWindowResize: () => void;
  private boundHandleDragOver: (e: DragEvent) => void;
  private boundHandleDrop: (e: DragEvent) => void;
  
  // 이벤트 리스너 등록 상태 추적
  private eventListenersRegistered = false;

  // 렌더링 진행 중 여부를 추적하는 플래그
  private isRenderingInProgress = false;

  /**
   * 생성자
   * @param cardSet 카드셋 데이터
   * @param cardSetService 카드셋 서비스
   * @param layoutService 레이아웃 서비스
   * @param sortingService 정렬 서비스
   * @param cardService 카드 서비스
   * @param cardRenderingService 카드 렌더링 서비스
   * @param interactionService 상호작용 서비스
   * @param obsidianService Obsidian 서비스
   */
  constructor(
    cardSet: ICardSet,
    cardSetService: ICardSetService,
    layoutService: ILayoutService,
    sortingService: ISortingService,
    cardService: ICardService,
    cardRenderingService: ICardRenderingService,
    interactionService: IInteractionService,
    obsidianService: ObsidianService
  ) {
    super();
    this.cardSet = cardSet;
    this.cardSetService = cardSetService;
    this.layoutService = layoutService;
    this.sortingService = sortingService;
    this.cardService = cardService;
    this.cardRenderingService = cardRenderingService;
    this.interactionService = interactionService;
    this.obsidianService = obsidianService;
    
    // 이벤트 핸들러 바인딩
    this.boundHandleWindowResize = this.handleWindowResize.bind(this);
    this.boundHandleDragOver = this.handleDragOver.bind(this);
    this.boundHandleDrop = this.handleDrop.bind(this);
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
  }
  
  /**
   * 카드셋 데이터 설정
   * @param cardSet 카드셋 데이터
   */
  async setCardSet(cardSet: ICardSet): Promise<void> {
    // 카드셋 ID 로깅
    console.log('카드셋 설정 요청:', {
      현재ID: this.cardSet?.id,
      새ID: cardSet.id,
      현재소스: this.cardSet?.source,
      새소스: cardSet.source,
      현재파일수: this.cardSet?.files?.length || 0,
      새파일수: cardSet.files?.length || 0
    });
    
    // 활성 폴더 로깅
    const activeFile = this.obsidianService.getActiveFile();
    console.log('setCardSet 활성 파일 정보:', {
      활성파일: activeFile?.path,
      활성폴더: activeFile?.parent?.path,
      카드셋소스: cardSet.source,
      일치여부: activeFile?.parent?.path === cardSet.source
    });
    
    // 카드셋 ID가 동일한 경우 파일 목록 비교
    const isSameId = this.cardSet && isSameCardSetId(this.cardSet.id, cardSet.id);
    console.log('카드셋 ID 비교 결과:', isSameId);
    
    if (isSameId) {
      // 파일 수가 다른 경우 업데이트 필요
      const oldFileCount = this.cardSet.files?.length || 0;
      const newFileCount = cardSet.files?.length || 0;
      
      if (oldFileCount !== newFileCount) {
        console.log('동일한 카드셋 ID지만 파일 수가 변경됨:', oldFileCount, '->', newFileCount);
      } else if (oldFileCount > 0 && newFileCount > 0) {
        // 파일 수가 같더라도 파일 내용이 변경되었는지 확인
        const oldFilePaths = new Set(this.cardSet.files.map(file => file.path));
        const newFilePaths = new Set(cardSet.files.map(file => file.path));
        
        // 파일 경로 비교
        let filesChanged = false;
        
        // 이전 파일 중 새 파일 목록에 없는 것이 있는지 확인
        for (const oldPath of oldFilePaths) {
          if (!newFilePaths.has(oldPath)) {
            filesChanged = true;
            console.log('파일이 제거됨:', oldPath);
            break;
          }
        }
        
        // 새 파일 중 이전 파일 목록에 없는 것이 있는지 확인
        if (!filesChanged) {
          for (const newPath of newFilePaths) {
            if (!oldFilePaths.has(newPath)) {
              filesChanged = true;
              console.log('파일이 추가됨:', newPath);
              break;
            }
          }
        }
        
        if (filesChanged) {
          console.log('동일한 카드셋 ID지만 파일 내용이 변경됨');
        } else {
          // 파일 수와 내용이 모두 같은 경우 업데이트 생략
          console.log('동일한 카드셋 ID, 업데이트 생략 (파일 변경 없음):', cardSet.id);
          return;
        }
      } else {
        // 파일 수가 같은 경우(둘 다 0인 경우) 업데이트 생략
        console.log('동일한 카드셋 ID, 업데이트 생략 (빈 파일 목록):', cardSet.id);
        return;
      }
    }
    
    console.log('카드셋 변경:', this.cardSet?.id, '->', cardSet.id);
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
    
    // 초기 크기 저장 (ResizeObserver 설정 전에 미리 저장)
    const rect = cardSetElement.getBoundingClientRect();
    this.lastContainerWidth = rect.width || 800; // 기본값 800px
    this.lastContainerHeight = rect.height || 600; // 기본값 600px
    
    // 카드 렌더링
    await this.renderCards(cardSetElement);
    
    // 요소 저장
    this.element = cardSetElement;
    
    // ResizeObserver 설정 (카드 렌더링 후에 설정하여 초기 렌더링 중복 방지)
    setTimeout(() => {
      this.setupResizeObserver(cardSetElement);
    }, 100);
    
    return cardSetElement;
  }
  
  /**
   * ResizeObserver 설정
   * @param element 관찰할 요소
   */
  private setupResizeObserver(element: HTMLElement): void {
    // 이미 ResizeObserver가 있으면 제거
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // ResizeObserver 설정
    this.resizeObserver = new ResizeObserver((entries) => {
      // 디바운스 처리
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      
      this.resizeTimeout = setTimeout(() => {
        for (const entry of entries) {
          if (entry.target === element) {
            // 컨테이너 크기 확인
            const rect = element.getBoundingClientRect();
            const currentWidth = rect.width;
            const currentHeight = rect.height;
            
            // 크기가 변경된 경우에만 렌더링
            if (Math.abs(currentWidth - this.lastContainerWidth) > 10 || 
                Math.abs(currentHeight - this.lastContainerHeight) > 10) {
              
              // 현재 크기 저장
              this.lastContainerWidth = currentWidth;
              this.lastContainerHeight = currentHeight;
              
              console.log('컨테이너 크기 변경 감지:', { 너비: currentWidth, 높이: currentHeight });
              
              // 이미 렌더링이 진행 중이면 중복 렌더링 방지
              if (!this.isRenderingInProgress) {
                this.renderCards(element);
              } else {
                console.log('이미 렌더링이 진행 중이어서 크기 변경에 따른 렌더링 생략');
              }
            }
          }
        }
      }, 800); // 800ms 디바운스 (기존 500ms에서 증가)
    });
    
    // 초기 크기 저장
    const rect = element.getBoundingClientRect();
    if (rect.width > 0) this.lastContainerWidth = rect.width;
    if (rect.height > 0) this.lastContainerHeight = rect.height;
    
    this.resizeObserver.observe(element);
  }
  
  /**
   * 카드 렌더링
   * @param container 카드 컨테이너 요소
   */
  private async renderCards(container: HTMLElement): Promise<void> {
    // 이미 렌더링이 진행 중인 경우 중복 렌더링 방지
    if (this.isRenderingInProgress) {
      console.log('이미 렌더링이 진행 중입니다. 중복 렌더링 방지');
      return;
    }
    
    // 렌더링 시작 표시
    this.isRenderingInProgress = true;
    console.log('카드 렌더링 시작:', new Date().toISOString());
    
    try {
      // 카드셋이 없는 경우 빈 메시지 표시
      if (!this.cardSet || !this.cardSet.files || this.cardSet.files.length === 0) {
        container.innerHTML = ''; // 컨테이너 초기화
        container.createDiv({ cls: 'empty-message', text: '카드가 없습니다.' });
        return;
      }
      
      // 기존 카드 컨테이너 제거 및 새로 생성
      container.innerHTML = ''; // 컨테이너 초기화
      const cardsContainer = container.createDiv({ cls: 'cards-container' });
      
      // 카드 컨테이너가 툴바를 제외한 뷰포트 영역을 가득 채우도록 설정
      cardsContainer.style.height = '100%';
      cardsContainer.style.overflow = 'auto';
      cardsContainer.style.display = 'flex';
      cardsContainer.style.flexDirection = 'column';
      cardsContainer.style.flexGrow = '1';
      
      // 컨테이너 크기 가져오기
      let containerWidth = cardsContainer.clientWidth;
      let containerHeight = cardsContainer.clientHeight;
      
      // 컨테이너 크기가 0인 경우 기본값 사용
      if (containerWidth <= 0) {
        containerWidth = container.clientWidth || 800; // 기본값 800px
        console.log('컨테이너 너비가 0이어서 기본값 사용:', containerWidth);
      }
      
      if (containerHeight <= 0) {
        containerHeight = container.clientHeight || 600; // 기본값 600px
        console.log('컨테이너 높이가 0이어서 기본값 사용:', containerHeight);
      }
      
      // 레이아웃 정보 가져오기
      const layoutInfo = this.memoize('getLayoutInfo', () => {
        return this.layoutService.getLayoutInfo ? 
          this.layoutService.getLayoutInfo() : 
          { layoutType: 'grid', direction: 'vertical' };
      });
      
      // 카드 렌더링 정보 계산
      const renderInfo = this.memoize('calculateRenderInfo', (width, cards, layout) => {
        // 카드 수
        const cardCount = cards.length;
        
        // 레이아웃 타입
        const layoutType = layout.layoutType;
        
        // 디버깅: 카드셋 렌더링 로깅
        if (this.cardService.getSettingsService().getSettings().debugMode) {
          console.log('카드셋 렌더링:', {
            containerWidth: width,
            cardCount,
            layoutType
          });
        }
        
        return {
          cardCount,
          layoutType,
          containerWidth: width
        };
      }, containerWidth, this.cardSet.files, layoutInfo);
      
      // 카드 컴포넌트 맵 초기화 (이미 존재하지 않는 카드 제거)
      const currentCardIds = new Set(this.cardSet.files.map(file => file.path));
      for (const [cardId, component] of this.cardComponents) {
        if (!currentCardIds.has(cardId)) {
          component.remove(); // 컴포넌트 제거
          this.cardComponents.delete(cardId);
        }
      }
      
      // 렌더링된 카드 추적을 위한 세트
      const renderedCards = new Set<string>();
      
      // 카드 렌더링 전 카드 컴포넌트 생성 및 업데이트
      const cardPromises = this.cardSet.files.map(async (file) => {
        try {
          // 이미 렌더링된 카드는 건너뛰기
          if (renderedCards.has(file.path)) {
            console.log('중복 카드 건너뛰기:', file.path);
            return null;
          }
          
          // 카드 생성 또는 가져오기
          const card = await this.obsidianService.getCardFromFile(file);
          
          // 이미 생성된 카드 컴포넌트가 있는지 확인
          let cardComponent = this.cardComponents.get(card.id);
          
          // 없으면 새로 생성
          if (!cardComponent) {
            cardComponent = new CardComponent(
              card,
              this.cardService,
              this.cardRenderingService,
              this.interactionService
            );
            
            this.cardComponents.set(card.id, cardComponent);
          } else {
            // 있으면 카드 데이터 업데이트
            cardComponent.setCard(card);
          }
          
          // 카드 선택 상태 설정
          cardComponent.setSelected(this.selectedCardIds.has(card.id));
          
          // 카드 포커스 상태 설정
          cardComponent.setFocused(this.focusedCardId === card.id);
          
          // 렌더링된 카드 추적
          renderedCards.add(file.path);
          
          return { component: cardComponent, id: card.id };
        } catch (error) {
          console.error('카드 렌더링 오류:', error);
          return null;
        }
      });
      
      // 모든 카드 컴포넌트 준비 완료 후 DOM에 추가
      const cardResults = await Promise.all(cardPromises);
      
      // 유효한 카드 컴포넌트만 필터링
      const validCards = cardResults.filter(result => result !== null);
      
      // 카드 렌더링 및 DOM에 추가
      for (const cardResult of validCards) {
        if (cardResult) {
          const cardElement = await cardResult.component.render();
          cardsContainer.appendChild(cardElement);
        }
      }
      
      console.log('렌더링된 카드 수:', renderedCards.size);
    } finally {
      // 렌더링 완료 표시
      this.isRenderingInProgress = false;
      console.log('카드 렌더링 완료:', new Date().toISOString());
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
    this.element = null;
    
    console.log('카드셋 컴포넌트 제거 완료');
  }
  
  /**
   * 이벤트 리스너 등록
   */
  registerEventListeners(): void {
    // 이미 등록된 경우 중복 등록 방지
    if (this.eventListenersRegistered) return;
    
    // 윈도우 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', this.boundHandleWindowResize);
    
    // 드래그 앤 드롭 이벤트 리스너 등록
    if (this.element) {
      this.element.addEventListener('dragover', this.boundHandleDragOver);
      this.element.addEventListener('drop', this.boundHandleDrop);
    }
    
    // 카드셋 변경 이벤트 리스너 등록
    this.cardSetService.getEventBus().on(EventType.CARDSET_CHANGED, this.handleCardSetChanged.bind(this));
    
    // 카드 변경 이벤트 리스너 등록
    this.cardSetService.getEventBus().on(EventType.CARDS_CHANGED, this.handleCardsChanged.bind(this));
    
    // 이벤트 리스너 등록 상태 업데이트
    this.eventListenersRegistered = true;
  }
  
  /**
   * 이벤트 리스너 제거
   */
  removeEventListeners(): void {
    // 등록되지 않은 경우 무시
    if (!this.eventListenersRegistered) return;
    
    // 윈도우 리사이즈 이벤트 리스너 제거
    window.removeEventListener('resize', this.boundHandleWindowResize);
    
    // 드래그 앤 드롭 이벤트 리스너 제거
    if (this.element) {
      this.element.removeEventListener('dragover', this.boundHandleDragOver);
      this.element.removeEventListener('drop', this.boundHandleDrop);
    }
    
    // 카드셋 변경 이벤트 리스너 제거
    this.cardSetService.getEventBus().off(EventType.CARDSET_CHANGED, this.handleCardSetChanged.bind(this));
    
    // 카드 변경 이벤트 리스너 제거
    this.cardSetService.getEventBus().off(EventType.CARDS_CHANGED, this.handleCardsChanged.bind(this));
    
    // 이벤트 리스너 등록 상태 업데이트
    this.eventListenersRegistered = false;
  }
  
  /**
   * 윈도우 리사이즈 이벤트 핸들러
   */
  private handleWindowResize(): void {
    // 플러그인이 언로드된 경우 무시
    if (!this.element) return;
    
    // 이미 렌더링이 진행 중인 경우 무시
    if (this.isRenderingInProgress) {
      console.log('이미 렌더링이 진행 중이어서 윈도우 리사이즈 이벤트 무시');
      return;
    }
    
    // 리사이즈 타임아웃이 있으면 취소
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    
    this.resizeTimeout = setTimeout(() => {
      const cardSetContainer = this.element?.querySelector('.card-navigator-cardset');
      if (!cardSetContainer) return;
      
      // 컨테이너 크기 확인
      const rect = cardSetContainer.getBoundingClientRect();
      
      // 크기가 변경된 경우에만 업데이트
      if (rect.width !== this.lastContainerWidth || rect.height !== this.lastContainerHeight) {
        this.lastContainerWidth = rect.width;
        this.lastContainerHeight = rect.height;
        
        // 레이아웃 업데이트
        this.update();
      }
    }, 100);
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

  /**
   * 컴포넌트 업데이트
   * 카드셋이 변경되었을 때 호출됩니다.
   */
  async update(): Promise<void> {
    console.log('CardSetComponent.update 호출됨');
    console.log('update 호출 스택:', new Error().stack);
    
    if (!this.element) {
      console.log('요소가 없어 업데이트 생략');
      return;
    }
    
    // 카드셋 ID 확인
    const currentCardSetId = this.cardSet?.id;
    const elementCardSetId = this.element.dataset.id;
    
    console.log('카드셋 ID 비교:', {
      현재ID: currentCardSetId,
      요소ID: elementCardSetId,
      동일여부: currentCardSetId === elementCardSetId
    });
    
    // 카드셋 ID가 변경된 경우 렌더링
    if (currentCardSetId !== elementCardSetId) {
      console.log('카드셋 ID 변경됨:', elementCardSetId, '->', currentCardSetId);
      
      // 카드셋 ID 업데이트
      this.element.dataset.id = currentCardSetId || '';
      
      // 카드 렌더링
      await this.renderCards(this.element);
      return;
    }
    
    // 카드셋 ID가 동일하더라도 파일 목록이 변경되었는지 확인
    const cardSetElement = this.element.querySelector('.cards-container');
    const renderedCardCount = cardSetElement ? cardSetElement.childElementCount : 0;
    const currentCardCount = this.cardSet?.files?.length || 0;
    
    if (renderedCardCount !== currentCardCount) {
      console.log('카드셋 ID는 동일하지만 파일 수가 변경됨:', renderedCardCount, '->', currentCardCount);
      
      // 카드 렌더링
      await this.renderCards(this.element);
    } else {
      console.log('카드셋 ID와 파일 수 변경 없음, 렌더링 생략');
    }
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
   * 컴포넌트 정리
   */
  cleanup(): void {
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
    
    // 컴포넌트 제거
    this.remove();
    
    // 카드 컴포넌트 정리
    this.cardComponents.forEach(cardComponent => {
      cardComponent.cleanup();
    });
    this.cardComponents.clear();
    
    console.log('카드셋 컴포넌트 정리 완료');
  }

  /**
   * 카드셋 변경 이벤트 핸들러
   * @param data 이벤트 데이터
   */
  private async handleCardSetChanged(data: any): Promise<void> {
    console.log('카드셋 변경 이벤트 수신:', data);
    
    // 활성 폴더 로깅
    const activeFile = this.obsidianService.getActiveFile();
    console.log('handleCardSetChanged 활성 파일 정보:', {
      활성파일: activeFile?.path,
      활성폴더: activeFile?.parent?.path,
      이벤트카드셋: data.cardSet,
      일치여부: activeFile?.parent?.path === data.cardSet
    });
    
    // 카드셋 서비스에서 최신 카드셋 가져오기
    const cardSet = await this.cardSetService.getCurrentCardSet();
    console.log('카드셋 서비스에서 가져온 최신 카드셋:', {
      id: cardSet.id,
      source: cardSet.source,
      파일수: cardSet.files?.length || 0,
      활성폴더일치여부: activeFile?.parent?.path === cardSet.source
    });
    
    // 카드셋 소스와 활성 폴더가 일치하지 않는 경우 로그
    if (activeFile?.parent?.path && cardSet.source !== activeFile.parent.path && !data.isFixed) {
      console.log('카드셋 소스와 활성 폴더 불일치 감지:', {
        카드셋소스: cardSet.source,
        활성폴더: activeFile.parent.path,
        이벤트카드셋: data.cardSet
      });
      
      // 카드셋 서비스에 활성 파일 변경 알림
      await this.cardSetService.handleActiveFileChanged(activeFile);
      
      // 다시 최신 카드셋 가져오기
      const updatedCardSet = await this.cardSetService.getCurrentCardSet();
      console.log('활성 폴더 불일치 후 업데이트된 카드셋:', {
        id: updatedCardSet.id,
        source: updatedCardSet.source,
        파일수: updatedCardSet.files?.length || 0
      });
      
      // 업데이트된 카드셋 설정
      await this.setCardSet(updatedCardSet);
      return;
    }
    
    // 카드셋 업데이트
    await this.setCardSet(cardSet);
  }
  
  /**
   * 카드 변경 이벤트 핸들러
   * @param data 이벤트 데이터
   */
  private async handleCardsChanged(data: any): Promise<void> {
    console.log('카드 변경 이벤트 수신:', data);
    
    // 카드셋 서비스에서 최신 카드셋 가져오기
    const cardSet = await this.cardSetService.getCurrentCardSet();
    console.log('카드 변경 이벤트 후 가져온 최신 카드셋:', {
      id: cardSet.id,
      source: cardSet.source,
      파일수: cardSet.files?.length || 0
    });
    
    // 카드셋 업데이트
    await this.setCardSet(cardSet);
  }
} 