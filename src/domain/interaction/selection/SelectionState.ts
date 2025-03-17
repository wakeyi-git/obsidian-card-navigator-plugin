import { ICard } from '../../card/Card';

/**
 * 선택 모드 타입
 */
export type SelectionMode = 'single' | 'multiple' | 'range';

/**
 * 선택 상태 인터페이스
 */
export interface ISelectionState {
  /**
   * 선택된 카드 목록
   */
  selectedCards: ICard[];
  
  /**
   * 마지막으로 선택된 카드
   */
  lastSelectedCard: ICard | null;
  
  /**
   * 현재 선택 모드
   */
  selectionMode: SelectionMode;
}

/**
 * 선택 상태 관리자 인터페이스
 */
export interface ISelectionManager {
  /**
   * 현재 선택 상태 가져오기
   */
  getSelectionState(): ISelectionState;
  
  /**
   * 선택 모드 변경
   * @param mode 새로운 선택 모드
   */
  setSelectionMode(mode: SelectionMode): void;
  
  /**
   * 카드 선택
   * @param card 선택할 카드
   * @param clearPrevious 이전 선택 초기화 여부
   */
  selectCard(card: ICard, clearPrevious?: boolean): void;
  
  /**
   * 카드 선택 해제
   * @param card 선택 해제할 카드
   */
  deselectCard(card: ICard): void;
  
  /**
   * 모든 선택 초기화
   */
  clearSelection(): void;
  
  /**
   * 카드 선택 여부 확인
   * @param card 확인할 카드
   */
  isCardSelected(card: ICard): boolean;
  
  /**
   * 범위 선택
   * @param startCard 시작 카드
   * @param endCard 종료 카드
   */
  selectRange(startCard: ICard, endCard: ICard): void;
}

/**
 * 선택 상태 관리자 구현
 */
export class SelectionManager implements ISelectionManager {
  private state: ISelectionState = {
    selectedCards: [],
    lastSelectedCard: null,
    selectionMode: 'single'
  };

  getSelectionState(): ISelectionState {
    return { ...this.state };
  }

  setSelectionMode(mode: SelectionMode): void {
    if (mode !== this.state.selectionMode) {
      this.state.selectionMode = mode;
      if (mode === 'single' && this.state.selectedCards.length > 1) {
        this.selectCard(this.state.lastSelectedCard!, true);
      }
    }
  }

  selectCard(card: ICard, clearPrevious = true): void {
    if (clearPrevious || this.state.selectionMode === 'single') {
      this.state.selectedCards = [card];
    } else if (!this.isCardSelected(card)) {
      this.state.selectedCards.push(card);
    }
    this.state.lastSelectedCard = card;
  }

  deselectCard(card: ICard): void {
    this.state.selectedCards = this.state.selectedCards.filter(c => c !== card);
    if (this.state.lastSelectedCard === card) {
      this.state.lastSelectedCard = this.state.selectedCards[this.state.selectedCards.length - 1] || null;
    }
  }

  clearSelection(): void {
    this.state.selectedCards = [];
    this.state.lastSelectedCard = null;
  }

  isCardSelected(card: ICard): boolean {
    return this.state.selectedCards.includes(card);
  }

  selectRange(startCard: ICard, endCard: ICard): void {
    if (this.state.selectionMode !== 'range') {
      return;
    }
    
    // 범위 선택 로직 구현
    // 실제 구현에서는 카드 목록에서 startCard와 endCard 사이의 모든 카드를 선택
  }
} 