import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ICard } from '../../domain/card/Card';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { ILayoutService } from '../layout/LayoutService';
import { KeyboardNavigationDirection } from '../../domain/navigation';

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
   * 특정 카드 ID로 스크롤
   * @param cardId 스크롤할 카드 ID
   * @returns 스크롤 성공 여부
   */
  scrollToCard(cardId: string): boolean;
  
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
 * 내비게이션 서비스
 * 카드 내비게이션 관련 기능을 관리합니다.
 */
export class NavigationService implements INavigationService {
  private settingsService: ISettingsService;
  private layoutService: ILayoutService;
  private eventBus: DomainEventBus;
  private cards: ICard[] = [];
  private currentIndex = -1;
  private navigationMode: NavigationMode = 'grid';
  
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
    
    // 설정에서 초기 내비게이션 모드 가져오기
    const settings = this.settingsService.getSettings();
    this.navigationMode = (settings.navigationMode as NavigationMode) || 'grid';
    
    // 이벤트 리스너 등록
    this.eventBus.on(EventType.CARDS_CHANGED, this.onCardsChanged.bind(this));
    this.eventBus.on(EventType.SETTINGS_CHANGED, this.onSettingsChanged.bind(this));
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
    if (index >= 0 && index < this.cards.length) {
      this.currentIndex = index;
      
      // 카드 선택 이벤트 발생
      this.eventBus.emit(EventType.CARD_SELECTED, {
        card: this.cards[index],
        cardId: this.cards[index].getId()
      });
    }
  }
  
  selectCardById(cardId: string): boolean {
    const index = this.cards.findIndex(card => card.getId() === cardId);
    if (index !== -1) {
      this.selectCard(index);
      return true;
    }
    return false;
  }
  
  navigateToDirection(direction: NavigationDirection): boolean {
    if (this.cards.length === 0) {
      return false;
    }
    
    // 현재 인덱스가 유효하지 않은 경우 첫 번째 카드 선택
    if (this.currentIndex < 0 || this.currentIndex >= this.cards.length) {
      this.selectCard(0);
      return true;
    }
    
    // 레이아웃 정보 가져오기
    const layoutType = this.layoutService.getLayoutType();
    const layoutDirection = this.layoutService.getLayoutDirection();
    const containerWidth = document.querySelector('.card-navigator-container')?.clientWidth || 800;
    const containerHeight = document.querySelector('.card-navigator-container')?.clientHeight || 600;
    const layoutInfo = this.layoutService.calculateLayout(containerWidth, containerHeight, this.cards.length);
    
    // 현재 위치 계산
    const currentRow = Math.floor(this.currentIndex / layoutInfo.columns);
    const currentCol = this.currentIndex % layoutInfo.columns;
    
    let nextIndex = -1;
    
    // 방향에 따라 다음 인덱스 계산
    switch (direction) {
      case 'up':
        if (this.navigationMode === 'grid') {
          // 그리드 모드에서는 위쪽 행으로 이동
          if (currentRow > 0) {
            nextIndex = (currentRow - 1) * layoutInfo.columns + currentCol;
            if (nextIndex >= this.cards.length) {
              nextIndex = this.cards.length - 1;
            }
          }
        } else {
          // 선형 모드에서는 이전 카드로 이동
          if (this.currentIndex > 0) {
            nextIndex = this.currentIndex - 1;
          }
        }
        break;
        
      case 'down':
        if (this.navigationMode === 'grid') {
          // 그리드 모드에서는 아래쪽 행으로 이동
          if (currentRow < layoutInfo.rows - 1) {
            nextIndex = (currentRow + 1) * layoutInfo.columns + currentCol;
            if (nextIndex >= this.cards.length) {
              nextIndex = this.cards.length - 1;
            }
          }
        } else {
          // 선형 모드에서는 다음 카드로 이동
          if (this.currentIndex < this.cards.length - 1) {
            nextIndex = this.currentIndex + 1;
          }
        }
        break;
        
      case 'left':
        if (this.navigationMode === 'grid') {
          // 그리드 모드에서는 왼쪽 열로 이동
          if (currentCol > 0) {
            nextIndex = currentRow * layoutInfo.columns + (currentCol - 1);
          }
        } else {
          // 선형 모드에서는 이전 카드로 이동
          if (this.currentIndex > 0) {
            nextIndex = this.currentIndex - 1;
          }
        }
        break;
        
      case 'right':
        if (this.navigationMode === 'grid') {
          // 그리드 모드에서는 오른쪽 열로 이동
          if (currentCol < layoutInfo.columns - 1 && this.currentIndex < this.cards.length - 1) {
            nextIndex = currentRow * layoutInfo.columns + (currentCol + 1);
            if (nextIndex >= this.cards.length) {
              nextIndex = this.cards.length - 1;
            }
          }
        } else {
          // 선형 모드에서는 다음 카드로 이동
          if (this.currentIndex < this.cards.length - 1) {
            nextIndex = this.currentIndex + 1;
          }
        }
        break;
        
      case 'first':
        // 첫 번째 카드로 이동
        nextIndex = 0;
        break;
        
      case 'last':
        // 마지막 카드로 이동
        nextIndex = this.cards.length - 1;
        break;
    }
    
    // 다음 인덱스가 유효한 경우 선택
    if (nextIndex >= 0 && nextIndex < this.cards.length) {
      this.selectCard(nextIndex);
      this.scrollToIndex(nextIndex);
      return true;
    }
    
    return false;
  }
  
  navigateToIndex(index: number): boolean {
    if (index >= 0 && index < this.cards.length) {
      this.selectCard(index);
      this.scrollToIndex(index);
      return true;
    }
    return false;
  }
  
  navigateToCard(cardId: string): boolean {
    const index = this.cards.findIndex(card => card.getId() === cardId);
    if (index !== -1) {
      return this.navigateToIndex(index);
    }
    return false;
  }
  
  /**
   * 특정 카드 ID로 스크롤
   * @param cardId 스크롤할 카드 ID
   * @returns 스크롤 성공 여부
   */
  scrollToCard(cardId: string): boolean {
    const index = this.cards.findIndex(card => card.getId() === cardId);
    if (index !== -1) {
      this.scrollToIndex(index);
      return true;
    }
    return false;
  }
  
  scrollToCurrentCard(): void {
    if (this.currentIndex >= 0) {
      this.scrollToIndex(this.currentIndex);
    }
  }
  
  scrollToIndex(index: number): void {
    if (index < 0 || index >= this.cards.length) {
      return;
    }
    
    // 스크롤 이벤트 발생
    this.eventBus.emit(EventType.SCROLL_TO_CARD, {
      index: index,
      behavior: 'smooth'
    });
  }
  
  getNavigationMode(): NavigationMode {
    return this.navigationMode;
  }
  
  /**
   * 내비게이션 모드 설정
   * @param mode 내비게이션 모드
   */
  async setNavigationMode(mode: NavigationMode): Promise<void> {
    // 내비게이션 모드 변경
    this.navigationMode = mode;
    
    // 설정 업데이트
    await this.settingsService.updateSettings({ navigationMode: mode });
    
    // 내비게이션 모드 변경 이벤트 발생
    this.eventBus.emit(EventType.NAVIGATION_MODE_CHANGED, {
      navigationMode: this.navigationMode
    });
  }
  
  setCards(cards: ICard[]): void {
    this.cards = cards;
    
    // 현재 선택된 카드가 없거나 유효하지 않은 경우 첫 번째 카드 선택
    if (this.currentIndex < 0 || this.currentIndex >= this.cards.length) {
      if (this.cards.length > 0) {
        this.currentIndex = 0;
      } else {
        this.currentIndex = -1;
      }
    }
  }
  
  getCards(): ICard[] {
    return this.cards;
  }
  
  /**
   * 카드 변경 이벤트 처리
   * @param data 이벤트 데이터
   */
  private onCardsChanged(data: any): void {
    // 카드 목록 설정
    this.setCards(data.cards);
  }
  
  /**
   * 설정 변경 이벤트 처리
   * @param data 이벤트 데이터
   */
  private onSettingsChanged(data: any): void {
    const settings = this.settingsService.getSettings();
    
    // 내비게이션 모드 설정이 변경된 경우
    if (data.changedKeys.includes('navigationMode')) {
      this.navigationMode = (settings.navigationMode as NavigationMode) || 'grid';
    }
  }
} 