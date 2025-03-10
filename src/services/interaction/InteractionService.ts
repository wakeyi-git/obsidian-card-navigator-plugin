import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ICard } from '../../domain/card/Card';
import { INavigationService } from '../navigation/NavigationService';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { SelectionMode } from '../../domain/interaction/SelectionState';

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
 * 상호작용 서비스
 * 카드 상호작용 관련 기능을 관리합니다.
 */
export class InteractionService implements IInteractionService {
  private settingsService: ISettingsService;
  private navigationService: INavigationService;
  private eventBus: DomainEventBus;
  private selectedCardIds: Set<string> = new Set();
  private selectionMode: SelectionMode = 'single';
  private dragMode: DragMode = 'none';
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
    
    // 설정에서 초기 선택 모드 가져오기
    const settings = this.settingsService.getSettings();
    this.selectionMode = (settings.selectionMode as SelectionMode) || 'single';
    
    // 설정에서 초기 드래그 모드 가져오기
    this.dragMode = (settings.dragMode as DragMode) || 'none';
    
    // 이벤트 리스너 등록
    this.eventBus.on(EventType.CARDS_CHANGED, this.onCardsChanged.bind(this));
    this.eventBus.on(EventType.SETTINGS_CHANGED, this.onSettingsChanged.bind(this));
  }
  
  /**
   * 선택된 카드 목록 가져오기
   * @returns 선택된 카드 목록
   */
  getSelectedCards(): ICard[] {
    const cards = this.navigationService.getCards();
    return cards.filter(card => this.selectedCardIds.has(card.getId()));
  }
  
  /**
   * 카드 선택 여부 확인
   * @param cardId 카드 ID
   * @returns 선택 여부
   */
  isCardSelected(cardId: string): boolean {
    return this.selectedCardIds.has(cardId);
  }
  
  /**
   * 카드 선택
   * @param cardId 카드 ID
   * @param addToSelection 기존 선택에 추가 여부
   */
  selectCard(cardId: string, addToSelection: boolean = false): void {
    // 단일 선택 모드이고 추가 선택이 아닌 경우 기존 선택 해제
    if (this.selectionMode === 'single' && !addToSelection) {
      this.deselectAll();
    }
    
    // 카드 선택
    this.selectedCardIds.add(cardId);
    
    // 선택 변경 이벤트 발생
    this.eventBus.emit(EventType.CARD_SELECTION_CHANGED, {
      selectedCardIds: Array.from(this.selectedCardIds),
      selectionMode: this.selectionMode
    });
  }
  
  /**
   * 카드 선택 해제
   * @param cardId 카드 ID
   */
  deselectCard(cardId: string): void {
    // 카드 선택 해제
    this.selectedCardIds.delete(cardId);
    
    // 선택 변경 이벤트 발생
    this.eventBus.emit(EventType.CARD_SELECTION_CHANGED, {
      selectedCardIds: Array.from(this.selectedCardIds),
      selectionMode: this.selectionMode
    });
  }
  
  /**
   * 모든 카드 선택
   */
  selectAll(): void {
    // 모든 카드 선택
    const cards = this.navigationService.getCards();
    cards.forEach(card => this.selectedCardIds.add(card.getId()));
    
    // 선택 변경 이벤트 발생
    this.eventBus.emit(EventType.CARD_SELECTION_CHANGED, {
      selectedCardIds: Array.from(this.selectedCardIds),
      selectionMode: this.selectionMode
    });
  }
  
  /**
   * 모든 카드 선택 해제
   */
  deselectAll(): void {
    // 모든 카드 선택 해제
    this.selectedCardIds.clear();
    
    // 선택 변경 이벤트 발생
    this.eventBus.emit(EventType.CARD_SELECTION_CHANGED, {
      selectedCardIds: Array.from(this.selectedCardIds),
      selectionMode: this.selectionMode
    });
  }
  
  /**
   * 선택 모드 가져오기
   * @returns 선택 모드
   */
  getSelectionMode(): SelectionMode {
    return this.selectionMode;
  }
  
  /**
   * 선택 모드 설정
   * @param mode 선택 모드
   */
  async setSelectionMode(mode: SelectionMode): Promise<void> {
    // 선택 모드 변경
    this.selectionMode = mode;
    
    // 다중 선택 모드가 아닌 경우 선택 초기화
    if (this.selectionMode !== 'multiple' && this.selectedCardIds.size > 1) {
      this.deselectAll();
    }
    
    // 설정 업데이트
    await this.settingsService.updateSettings({ selectionMode: mode });
    
    // 선택 모드 변경 이벤트 발생
    this.eventBus.emit(EventType.SELECTION_MODE_CHANGED, {
      mode: this.selectionMode
    });
  }
  
  /**
   * 드래그 모드 가져오기
   * @returns 드래그 모드
   */
  getDragMode(): DragMode {
    return this.dragMode;
  }
  
  /**
   * 드래그 모드 설정
   * @param mode 드래그 모드
   */
  async setDragMode(mode: DragMode): Promise<void> {
    // 드래그 모드 변경
    this.dragMode = mode;
    
    // 설정 업데이트
    await this.settingsService.updateSettings({ dragMode: mode });
  }
  
  /**
   * 드래그 시작
   * @param cardId 드래그 시작 카드 ID
   * @param event 드래그 이벤트
   */
  startDrag(cardId: string, event: any): void {
    // 드래그 모드가 none인 경우 무시
    if (this.dragMode === 'none') {
      return;
    }
    
    // 드래그 시작
    this.isDragging = true;
    this.dragSourceId = cardId;
    
    // 드래그 시작 이벤트 발생
    this.eventBus.emit(EventType.CARD_DRAG_STARTED, {
      cardId: cardId,
      dragMode: this.dragMode
    });
  }
  
  /**
   * 드래그 종료
   * @param targetCardId 드래그 종료 카드 ID
   * @param event 드래그 이벤트
   */
  endDrag(targetCardId: string, event: any): void {
    // 드래그 중이 아니거나 드래그 소스가 없는 경우 무시
    if (!this.isDragging || !this.dragSourceId) {
      return;
    }
    
    // 드래그 종료
    this.isDragging = false;
    
    // 드래그 종료 이벤트 발생
    this.eventBus.emit(EventType.CARD_DRAG_ENDED, {
      sourceCardId: this.dragSourceId,
      targetCardId: targetCardId,
      dragMode: this.dragMode
    });
    
    // 드래그 소스 초기화
    this.dragSourceId = null;
  }
  
  /**
   * 드래그 취소
   */
  cancelDrag(): void {
    // 드래그 중이 아닌 경우 무시
    if (!this.isDragging || !this.dragSourceId) {
      return;
    }
    
    // 드래그 취소
    this.isDragging = false;
    
    // 드래그 취소 이벤트 발생
    this.eventBus.emit(EventType.CARD_DRAG_CANCELLED, {
      sourceCardId: this.dragSourceId,
      dragMode: this.dragMode
    });
    
    // 드래그 소스 초기화
    this.dragSourceId = null;
  }
  
  /**
   * 카드 클릭 처리
   * @param cardId 카드 ID
   * @param event 클릭 이벤트
   */
  handleCardClick(cardId: string, event: any): void {
    // Shift 키를 누른 경우 범위 선택
    if (event.shiftKey && this.selectionMode === 'multiple') {
      const cards = this.navigationService.getCards();
      const currentIndex = cards.findIndex(card => card.getId() === cardId);
      const lastSelectedIndex = cards.findIndex(card => 
        this.selectedCardIds.size > 0 && 
        Array.from(this.selectedCardIds).includes(card.getId())
      );
      
      if (lastSelectedIndex !== -1) {
        // 범위 선택
        const start = Math.min(currentIndex, lastSelectedIndex);
        const end = Math.max(currentIndex, lastSelectedIndex);
        
        for (let i = start; i <= end; i++) {
          this.selectedCardIds.add(cards[i].getId());
        }
        
        // 선택 변경 이벤트 발생
        this.eventBus.emit(EventType.CARD_SELECTION_CHANGED, {
          selectedCardIds: Array.from(this.selectedCardIds),
          selectionMode: this.selectionMode
        });
        
        return;
      }
    }
    
    // Ctrl 키를 누른 경우 다중 선택
    if (event.ctrlKey || event.metaKey) {
      if (this.isCardSelected(cardId)) {
        this.deselectCard(cardId);
      } else {
        this.selectCard(cardId, true);
      }
      return;
    }
    
    // 일반 클릭
    this.selectCard(cardId);
    
    // 카드 클릭 이벤트 발생
    this.eventBus.emit(EventType.CARD_CLICKED, {
      cardId: cardId
    });
  }
  
  /**
   * 카드 더블 클릭 처리
   * @param cardId 카드 ID
   * @param event 더블 클릭 이벤트
   */
  handleCardDoubleClick(cardId: string, event: any): void {
    // 카드 더블 클릭 이벤트 발생
    this.eventBus.emit(EventType.CARD_DOUBLE_CLICKED, {
      cardId: cardId
    });
  }
  
  /**
   * 카드 컨텍스트 메뉴 처리
   * @param cardId 카드 ID
   * @param event 컨텍스트 메뉴 이벤트
   */
  handleCardContextMenu(cardId: string, event: any): void {
    // 카드 컨텍스트 메뉴 이벤트 발생
    this.eventBus.emit(EventType.CARD_CONTEXT_MENU, {
      cardId: cardId,
      event: event
    });
  }
  
  /**
   * 카드 변경 이벤트 처리
   * @param data 이벤트 데이터
   */
  private onCardsChanged(data: any): void {
    // 카드가 변경되면 선택 초기화
    this.deselectAll();
  }
  
  /**
   * 설정 변경 이벤트 처리
   * @param data 이벤트 데이터
   */
  private onSettingsChanged(data: any): void {
    const settings = this.settingsService.getSettings();
    
    // 선택 모드 설정이 변경된 경우
    if (data.changedKeys.includes('selectionMode')) {
      this.selectionMode = (settings.selectionMode as SelectionMode) || 'single';
      
      // 다중 선택 모드가 아닌 경우 선택 초기화
      if (this.selectionMode !== 'multiple' && this.selectedCardIds.size > 1) {
        this.deselectAll();
      }
    }
    
    // 드래그 모드 설정이 변경된 경우
    if (data.changedKeys.includes('dragMode')) {
      this.dragMode = (settings.dragMode as DragMode) || 'none';
    }
  }
} 