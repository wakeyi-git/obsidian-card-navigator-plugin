import { DomainEventBus } from '../../events/DomainEventBus';
import { ISettingsService } from '../core/SettingsService';
import { ICard } from '../../models/Card';
import { ILayoutService } from '../layout/LayoutService';

/**
 * 내비게이션 방향
 */
export type NavigationDirection = 'up' | 'down' | 'left' | 'right' | 'first' | 'last';

/**
 * 내비게이션 모드
 */
export type NavigationMode = 'grid' | 'linear';

/**
 * 내비게이션 서비스 인터페이스
 */
export interface INavigationService {
  /**
   * 현재 선택된 카드 인덱스 가져오기
   * @returns 현재 선택된 카드 인덱스
   */
  getCurrentIndex(): number;
  
  /**
   * 현재 선택된 카드 가져오기
   * @returns 현재 선택된 카드
   */
  getCurrentCard(): ICard | null;
  
  /**
   * 카드 선택
   * @param index 선택할 카드 인덱스
   */
  selectCard(index: number): void;
  
  /**
   * 카드 선택 (ID로)
   * @param cardId 선택할 카드 ID
   * @returns 선택 성공 여부
   */
  selectCardById(cardId: string): boolean;
  
  /**
   * 다음 카드로 이동
   * @param direction 이동 방향
   * @returns 이동 성공 여부
   */
  navigateToDirection(direction: NavigationDirection): boolean;
  
  /**
   * 특정 인덱스로 이동
   * @param index 이동할 인덱스
   * @returns 이동 성공 여부
   */
  navigateToIndex(index: number): boolean;
  
  /**
   * 특정 카드로 이동
   * @param cardId 이동할 카드 ID
   * @returns 이동 성공 여부
   */
  navigateToCard(cardId: string): boolean;
  
  /**
   * 현재 카드 위치로 스크롤
   */
  scrollToCurrentCard(): void;
  
  /**
   * 특정 인덱스로 스크롤
   * @param index 스크롤할 인덱스
   */
  scrollToIndex(index: number): void;
  
  /**
   * 내비게이션 모드 가져오기
   * @returns 내비게이션 모드
   */
  getNavigationMode(): NavigationMode;
  
  /**
   * 내비게이션 모드 설정
   * @param mode 내비게이션 모드
   */
  setNavigationMode(mode: NavigationMode): Promise<void>;
  
  /**
   * 카드 목록 설정
   * @param cards 카드 목록
   */
  setCards(cards: ICard[]): void;
  
  /**
   * 카드 목록 가져오기
   * @returns 카드 목록
   */
  getCards(): ICard[];
}

/**
 * 내비게이션 서비스 구현
 */
export class NavigationService implements INavigationService {
  private settingsService: ISettingsService;
  private layoutService: ILayoutService;
  private eventBus: DomainEventBus;
  private cards: ICard[] = [];
  private currentIndex: number = -1;
  private navigationMode: NavigationMode;
  
  /**
   * 생성자
   * @param settingsService 설정 서비스
   * @param layoutService 레이아웃 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    settingsService: ISettingsService,
    layoutService: ILayoutService,
    eventBus: DomainEventBus
  ) {
    this.settingsService = settingsService;
    this.layoutService = layoutService;
    this.eventBus = eventBus;
    
    // 설정에서 내비게이션 모드 로드
    this.navigationMode = this.settingsService.getSetting('navigationMode', 'grid');
    
    // 설정 변경 이벤트 구독
    this.eventBus.subscribe('settings:changed', (data: any) => {
      if (data.key === 'navigationMode') {
        this.navigationMode = data.value;
      }
    });
  }
  
  getCurrentIndex(): number {
    return this.currentIndex;
  }
  
  getCurrentCard(): ICard | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.cards.length) {
      return this.cards[this.currentIndex];
    }
    return null;
  }
  
  selectCard(index: number): void {
    if (index >= -1 && index < this.cards.length) {
      const previousIndex = this.currentIndex;
      this.currentIndex = index;
      
      // 선택 변경 이벤트 발생
      this.eventBus.publish('navigation:selection-changed', {
        previousIndex,
        currentIndex: this.currentIndex,
        card: this.getCurrentCard()
      });
    }
  }
  
  selectCardById(cardId: string): boolean {
    const index = this.cards.findIndex(card => card.id === cardId);
    if (index !== -1) {
      this.selectCard(index);
      return true;
    }
    return false;
  }
  
  navigateToDirection(direction: NavigationDirection): boolean {
    if (this.cards.length === 0) return false;
    
    const layoutType = this.layoutService.getLayoutType();
    const layoutDirection = this.layoutService.getLayoutDirection();
    const scrollDirection = this.layoutService.getScrollDirection();
    
    let newIndex = this.currentIndex;
    
    // 첫 번째 또는 마지막 카드로 이동
    if (direction === 'first') {
      newIndex = 0;
    } else if (direction === 'last') {
      newIndex = this.cards.length - 1;
    } else {
      // 그리드 모드에서의 내비게이션
      if (this.navigationMode === 'grid') {
        const containerWidth = document.querySelector('.card-navigator-container')?.clientWidth || 800;
        const cardWidth = this.layoutService.getCardWidth();
        const gap = 10; // 카드 간격
        
        // 한 행에 표시되는 카드 수 계산
        const cardsPerRow = Math.floor((containerWidth + gap) / (cardWidth + gap));
        
        // 현재 행과 열 계산
        const currentRow = Math.floor(this.currentIndex / cardsPerRow);
        const currentCol = this.currentIndex % cardsPerRow;
        
        // 방향에 따른 새 인덱스 계산
        if (direction === 'up') {
          const targetRow = currentRow - 1;
          if (targetRow >= 0) {
            newIndex = targetRow * cardsPerRow + currentCol;
            if (newIndex >= this.cards.length) {
              // 마지막 행의 경우 열 수가 적을 수 있음
              newIndex = this.cards.length - 1;
            }
          }
        } else if (direction === 'down') {
          const targetRow = currentRow + 1;
          const targetIndex = targetRow * cardsPerRow + currentCol;
          if (targetIndex < this.cards.length) {
            newIndex = targetIndex;
          }
        } else if (direction === 'left') {
          if (currentCol > 0) {
            newIndex = this.currentIndex - 1;
          }
        } else if (direction === 'right') {
          if (currentCol < cardsPerRow - 1 && this.currentIndex + 1 < this.cards.length) {
            newIndex = this.currentIndex + 1;
          }
        }
      } 
      // 선형 모드에서의 내비게이션
      else {
        if (direction === 'up' || direction === 'left') {
          newIndex = Math.max(0, this.currentIndex - 1);
        } else if (direction === 'down' || direction === 'right') {
          newIndex = Math.min(this.cards.length - 1, this.currentIndex + 1);
        }
      }
    }
    
    // 인덱스가 변경되었으면 카드 선택
    if (newIndex !== this.currentIndex) {
      this.selectCard(newIndex);
      this.scrollToCurrentCard();
      return true;
    }
    
    return false;
  }
  
  navigateToIndex(index: number): boolean {
    if (index >= 0 && index < this.cards.length) {
      this.selectCard(index);
      this.scrollToCurrentCard();
      return true;
    }
    return false;
  }
  
  navigateToCard(cardId: string): boolean {
    const index = this.cards.findIndex(card => card.id === cardId);
    if (index !== -1) {
      return this.navigateToIndex(index);
    }
    return false;
  }
  
  scrollToCurrentCard(): void {
    if (this.currentIndex >= 0) {
      this.scrollToIndex(this.currentIndex);
    }
  }
  
  scrollToIndex(index: number): void {
    if (index >= 0 && index < this.cards.length) {
      // 카드 요소 찾기
      const cardElement = document.querySelector(`[data-card-id="${this.cards[index].id}"]`);
      if (cardElement) {
        // 스크롤 컨테이너 찾기
        const container = document.querySelector('.card-navigator-container');
        if (container) {
          // 스크롤 위치 계산 및 스크롤
          const cardRect = cardElement.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // 카드가 컨테이너 밖에 있는 경우에만 스크롤
          if (cardRect.top < containerRect.top || cardRect.bottom > containerRect.bottom) {
            cardElement.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            });
          }
        }
      }
    }
  }
  
  getNavigationMode(): NavigationMode {
    return this.navigationMode;
  }
  
  async setNavigationMode(mode: NavigationMode): Promise<void> {
    if (this.navigationMode !== mode) {
      this.navigationMode = mode;
      await this.settingsService.updateSetting('navigationMode', mode);
      
      // 내비게이션 모드 변경 이벤트 발생
      this.eventBus.publish('navigation:mode-changed', { mode });
    }
  }
  
  setCards(cards: ICard[]): void {
    this.cards = [...cards];
    
    // 현재 선택된 카드가 없거나 범위를 벗어난 경우 첫 번째 카드 선택
    if (this.currentIndex === -1 || this.currentIndex >= this.cards.length) {
      if (this.cards.length > 0) {
        this.selectCard(0);
      } else {
        this.selectCard(-1);
      }
    }
  }
  
  getCards(): ICard[] {
    return this.cards;
  }
} 