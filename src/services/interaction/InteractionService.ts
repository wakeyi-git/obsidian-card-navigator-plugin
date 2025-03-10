import { DomainEventBus } from '../../events/DomainEventBus';
import { ISettingsService } from '../core/SettingsService';
import { ICard } from '../../models/Card';
import { INavigationService } from '../navigation/NavigationService';

/**
 * 선택 모드
 */
export type SelectionMode = 'single' | 'multiple';

/**
 * 드래그 모드
 */
export type DragMode = 'none' | 'move' | 'copy';

/**
 * 상호작용 서비스 인터페이스
 */
export interface IInteractionService {
  /**
   * 선택된 카드 목록 가져오기
   * @returns 선택된 카드 목록
   */
  getSelectedCards(): ICard[];
  
  /**
   * 카드 선택 여부 확인
   * @param cardId 카드 ID
   * @returns 선택 여부
   */
  isCardSelected(cardId: string): boolean;
  
  /**
   * 카드 선택
   * @param cardId 카드 ID
   * @param addToSelection 기존 선택에 추가 여부
   */
  selectCard(cardId: string, addToSelection?: boolean): void;
  
  /**
   * 카드 선택 해제
   * @param cardId 카드 ID
   */
  deselectCard(cardId: string): void;
  
  /**
   * 모든 카드 선택
   */
  selectAll(): void;
  
  /**
   * 모든 카드 선택 해제
   */
  deselectAll(): void;
  
  /**
   * 선택 모드 가져오기
   * @returns 선택 모드
   */
  getSelectionMode(): SelectionMode;
  
  /**
   * 선택 모드 설정
   * @param mode 선택 모드
   */
  setSelectionMode(mode: SelectionMode): Promise<void>;
  
  /**
   * 드래그 모드 가져오기
   * @returns 드래그 모드
   */
  getDragMode(): DragMode;
  
  /**
   * 드래그 모드 설정
   * @param mode 드래그 모드
   */
  setDragMode(mode: DragMode): Promise<void>;
  
  /**
   * 드래그 시작
   * @param cardId 드래그 시작 카드 ID
   * @param event 드래그 이벤트
   */
  startDrag(cardId: string, event: any): void;
  
  /**
   * 드래그 종료
   * @param targetCardId 드래그 종료 카드 ID
   * @param event 드래그 이벤트
   */
  endDrag(targetCardId: string, event: any): void;
  
  /**
   * 드래그 취소
   */
  cancelDrag(): void;
  
  /**
   * 카드 클릭 처리
   * @param cardId 카드 ID
   * @param event 클릭 이벤트
   */
  handleCardClick(cardId: string, event: any): void;
  
  /**
   * 카드 더블 클릭 처리
   * @param cardId 카드 ID
   * @param event 더블 클릭 이벤트
   */
  handleCardDoubleClick(cardId: string, event: any): void;
  
  /**
   * 카드 컨텍스트 메뉴 처리
   * @param cardId 카드 ID
   * @param event 컨텍스트 메뉴 이벤트
   */
  handleCardContextMenu(cardId: string, event: any): void;
}

/**
 * 상호작용 서비스 구현
 */
export class InteractionService implements IInteractionService {
  private settingsService: ISettingsService;
  private navigationService: INavigationService;
  private eventBus: DomainEventBus;
  private selectedCardIds: Set<string> = new Set();
  private selectionMode: SelectionMode;
  private dragMode: DragMode;
  private isDragging: boolean = false;
  private dragSourceId: string | null = null;
  
  /**
   * 생성자
   * @param settingsService 설정 서비스
   * @param navigationService 내비게이션 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    settingsService: ISettingsService,
    navigationService: INavigationService,
    eventBus: DomainEventBus
  ) {
    this.settingsService = settingsService;
    this.navigationService = navigationService;
    this.eventBus = eventBus;
    
    // 설정에서 선택 모드와 드래그 모드 로드
    this.selectionMode = this.settingsService.getSetting('selectionMode', 'single');
    this.dragMode = this.settingsService.getSetting('dragMode', 'none');
    
    // 설정 변경 이벤트 구독
    this.eventBus.subscribe('settings:changed', (data: any) => {
      if (data.key === 'selectionMode') {
        this.selectionMode = data.value;
        // 다중 선택 모드가 아닌 경우 선택 초기화
        if (this.selectionMode !== 'multiple' && this.selectedCardIds.size > 1) {
          this.deselectAll();
        }
      } else if (data.key === 'dragMode') {
        this.dragMode = data.value;
      }
    });
    
    // 내비게이션 선택 변경 이벤트 구독
    this.eventBus.subscribe('navigation:selection-changed', (data: any) => {
      if (data.card && this.selectionMode === 'single') {
        this.deselectAll();
        this.selectedCardIds.add(data.card.id);
        this.eventBus.publish('interaction:selection-changed', {
          selectedCardIds: Array.from(this.selectedCardIds)
        });
      }
    });
  }
  
  getSelectedCards(): ICard[] {
    const allCards = this.navigationService.getCards();
    return allCards.filter(card => this.selectedCardIds.has(card.id));
  }
  
  isCardSelected(cardId: string): boolean {
    return this.selectedCardIds.has(cardId);
  }
  
  selectCard(cardId: string, addToSelection: boolean = false): void {
    // 단일 선택 모드이고 추가 선택이 아닌 경우 기존 선택 해제
    if (this.selectionMode === 'single' && !addToSelection) {
      this.deselectAll();
    }
    
    // 카드 선택
    this.selectedCardIds.add(cardId);
    
    // 내비게이션 서비스에 현재 카드 설정
    this.navigationService.selectCardById(cardId);
    
    // 선택 변경 이벤트 발생
    this.eventBus.publish('interaction:selection-changed', {
      selectedCardIds: Array.from(this.selectedCardIds)
    });
  }
  
  deselectCard(cardId: string): void {
    if (this.selectedCardIds.has(cardId)) {
      this.selectedCardIds.delete(cardId);
      
      // 선택 변경 이벤트 발생
      this.eventBus.publish('interaction:selection-changed', {
        selectedCardIds: Array.from(this.selectedCardIds)
      });
    }
  }
  
  selectAll(): void {
    const allCards = this.navigationService.getCards();
    allCards.forEach(card => this.selectedCardIds.add(card.id));
    
    // 선택 변경 이벤트 발생
    this.eventBus.publish('interaction:selection-changed', {
      selectedCardIds: Array.from(this.selectedCardIds)
    });
  }
  
  deselectAll(): void {
    if (this.selectedCardIds.size > 0) {
      this.selectedCardIds.clear();
      
      // 선택 변경 이벤트 발생
      this.eventBus.publish('interaction:selection-changed', {
        selectedCardIds: Array.from(this.selectedCardIds)
      });
    }
  }
  
  getSelectionMode(): SelectionMode {
    return this.selectionMode;
  }
  
  async setSelectionMode(mode: SelectionMode): Promise<void> {
    if (this.selectionMode !== mode) {
      this.selectionMode = mode;
      await this.settingsService.updateSetting('selectionMode', mode);
      
      // 다중 선택 모드가 아닌 경우 선택 초기화
      if (mode !== 'multiple' && this.selectedCardIds.size > 1) {
        // 현재 선택된 카드 하나만 유지
        const currentCard = this.navigationService.getCurrentCard();
        this.deselectAll();
        if (currentCard) {
          this.selectedCardIds.add(currentCard.id);
        }
        
        // 선택 변경 이벤트 발생
        this.eventBus.publish('interaction:selection-changed', {
          selectedCardIds: Array.from(this.selectedCardIds)
        });
      }
    }
  }
  
  getDragMode(): DragMode {
    return this.dragMode;
  }
  
  async setDragMode(mode: DragMode): Promise<void> {
    if (this.dragMode !== mode) {
      this.dragMode = mode;
      await this.settingsService.updateSetting('dragMode', mode);
      
      // 드래그 모드 변경 이벤트 발생
      this.eventBus.publish('interaction:drag-mode-changed', { mode });
    }
  }
  
  startDrag(cardId: string, event: any): void {
    if (this.dragMode === 'none') return;
    
    this.isDragging = true;
    this.dragSourceId = cardId;
    
    // 드래그 중인 카드가 선택되지 않은 경우 선택
    if (!this.isCardSelected(cardId)) {
      this.selectCard(cardId, event.ctrlKey || event.metaKey);
    }
    
    // 드래그 시작 이벤트 발생
    this.eventBus.publish('interaction:drag-start', {
      sourceCardId: cardId,
      selectedCardIds: Array.from(this.selectedCardIds),
      dragMode: this.dragMode
    });
  }
  
  endDrag(targetCardId: string, event: any): void {
    if (!this.isDragging || !this.dragSourceId || this.dragMode === 'none') {
      this.cancelDrag();
      return;
    }
    
    // 드래그 종료 이벤트 발생
    this.eventBus.publish('interaction:drag-end', {
      sourceCardId: this.dragSourceId,
      targetCardId,
      selectedCardIds: Array.from(this.selectedCardIds),
      dragMode: this.dragMode
    });
    
    // 드래그 상태 초기화
    this.isDragging = false;
    this.dragSourceId = null;
  }
  
  cancelDrag(): void {
    if (this.isDragging) {
      // 드래그 취소 이벤트 발생
      this.eventBus.publish('interaction:drag-cancel', {
        sourceCardId: this.dragSourceId,
        selectedCardIds: Array.from(this.selectedCardIds)
      });
      
      // 드래그 상태 초기화
      this.isDragging = false;
      this.dragSourceId = null;
    }
  }
  
  handleCardClick(cardId: string, event: any): void {
    // Ctrl 또는 Command 키를 누른 경우 다중 선택
    if (event.ctrlKey || event.metaKey) {
      if (this.isCardSelected(cardId)) {
        this.deselectCard(cardId);
      } else {
        this.selectCard(cardId, true);
      }
    } 
    // Shift 키를 누른 경우 범위 선택
    else if (event.shiftKey && this.selectionMode === 'multiple') {
      const currentCard = this.navigationService.getCurrentCard();
      if (currentCard) {
        const allCards = this.navigationService.getCards();
        const currentIndex = allCards.findIndex(card => card.id === currentCard.id);
        const targetIndex = allCards.findIndex(card => card.id === cardId);
        
        if (currentIndex !== -1 && targetIndex !== -1) {
          const startIndex = Math.min(currentIndex, targetIndex);
          const endIndex = Math.max(currentIndex, targetIndex);
          
          for (let i = startIndex; i <= endIndex; i++) {
            this.selectedCardIds.add(allCards[i].id);
          }
          
          // 내비게이션 서비스에 현재 카드 설정
          this.navigationService.selectCardById(cardId);
          
          // 선택 변경 이벤트 발생
          this.eventBus.publish('interaction:selection-changed', {
            selectedCardIds: Array.from(this.selectedCardIds)
          });
        }
      }
    } 
    // 일반 클릭
    else {
      this.selectCard(cardId);
    }
    
    // 카드 클릭 이벤트 발생
    this.eventBus.publish('interaction:card-click', {
      cardId,
      selectedCardIds: Array.from(this.selectedCardIds),
      event: {
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey
      }
    });
  }
  
  handleCardDoubleClick(cardId: string, event: any): void {
    // 카드 더블 클릭 이벤트 발생
    this.eventBus.publish('interaction:card-double-click', {
      cardId,
      selectedCardIds: Array.from(this.selectedCardIds),
      event: {
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey
      }
    });
  }
  
  handleCardContextMenu(cardId: string, event: any): void {
    // 선택되지 않은 카드에서 컨텍스트 메뉴를 열면 해당 카드 선택
    if (!this.isCardSelected(cardId)) {
      this.selectCard(cardId);
    }
    
    // 카드 컨텍스트 메뉴 이벤트 발생
    this.eventBus.publish('interaction:card-context-menu', {
      cardId,
      selectedCardIds: Array.from(this.selectedCardIds),
      event: {
        x: event.clientX,
        y: event.clientY
      }
    });
  }
} 