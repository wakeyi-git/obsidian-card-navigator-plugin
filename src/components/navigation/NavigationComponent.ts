import { Component } from '../Component';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { INavigationService, NavigationDirection } from '../../services/navigation/NavigationService';
import { KeyboardNavigationDirection } from '../../domain/navigation';
import './navigation.css';

/**
 * 내비게이션 컴포넌트 인터페이스
 */
export interface INavigationComponent {
  /**
   * 특정 카드로 이동
   * @param cardId 이동할 카드 ID
   * @returns 이동 성공 여부
   */
  navigateToCard(cardId: string): boolean;
  
  /**
   * 특정 방향으로 이동
   * @param direction 이동 방향
   * @returns 이동 성공 여부
   */
  navigateDirection(direction: NavigationDirection): boolean;
  
  /**
   * 활성 카드로 이동
   * @returns 이동 성공 여부
   */
  navigateToActiveCard(): boolean;
  
  /**
   * 첫 번째 카드로 이동
   * @returns 이동 성공 여부
   */
  navigateToFirst(): boolean;
  
  /**
   * 마지막 카드로 이동
   * @returns 이동 성공 여부
   */
  navigateToLast(): boolean;
}

/**
 * 내비게이션 컴포넌트
 * 카드 간 내비게이션 및 포커스 관리를 담당합니다.
 */
export class NavigationComponent extends Component implements INavigationComponent {
  private navigationService: INavigationService;
  private eventBus: DomainEventBus;
  private currentCardId: string | null = null;
  
  /**
   * 생성자
   * @param navigationService 내비게이션 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(navigationService: INavigationService, eventBus: DomainEventBus) {
    super();
    this.navigationService = navigationService;
    this.eventBus = eventBus;
  }
  
  /**
   * 컴포넌트 생성
   * @returns 생성된 HTML 요소
   */
  protected async createComponent(): Promise<HTMLElement> {
    const navigationElement = document.createElement('div');
    navigationElement.className = 'card-navigator-navigation';
    
    // 내비게이션 컨트롤 추가
    const controlsElement = document.createElement('div');
    controlsElement.className = 'navigation-controls';
    
    // 내비게이션 버튼 그리드
    const buttonGrid = document.createElement('div');
    buttonGrid.className = 'navigation-button-grid';
    
    // 첫 번째 행: 위쪽 버튼
    const topRow = document.createElement('div');
    topRow.className = 'navigation-button-row';
    
    const upButton = document.createElement('button');
    upButton.className = 'navigation-button up-button';
    upButton.innerHTML = '↑';
    upButton.title = '위로 이동';
    upButton.addEventListener('click', () => {
      this.navigateDirection('up');
    });
    
    topRow.appendChild(upButton);
    buttonGrid.appendChild(topRow);
    
    // 두 번째 행: 왼쪽, 활성, 오른쪽 버튼
    const middleRow = document.createElement('div');
    middleRow.className = 'navigation-button-row';
    
    const leftButton = document.createElement('button');
    leftButton.className = 'navigation-button left-button';
    leftButton.innerHTML = '←';
    leftButton.title = '왼쪽으로 이동';
    leftButton.addEventListener('click', () => {
      this.navigateDirection('left');
    });
    
    const activeButton = document.createElement('button');
    activeButton.className = 'navigation-button active-button';
    activeButton.innerHTML = '⦿';
    activeButton.title = '활성 카드로 이동';
    activeButton.addEventListener('click', () => {
      this.navigateToActiveCard();
    });
    
    const rightButton = document.createElement('button');
    rightButton.className = 'navigation-button right-button';
    rightButton.innerHTML = '→';
    rightButton.title = '오른쪽으로 이동';
    rightButton.addEventListener('click', () => {
      this.navigateDirection('right');
    });
    
    middleRow.appendChild(leftButton);
    middleRow.appendChild(activeButton);
    middleRow.appendChild(rightButton);
    buttonGrid.appendChild(middleRow);
    
    // 세 번째 행: 아래쪽 버튼
    const bottomRow = document.createElement('div');
    bottomRow.className = 'navigation-button-row';
    
    const downButton = document.createElement('button');
    downButton.className = 'navigation-button down-button';
    downButton.innerHTML = '↓';
    downButton.title = '아래로 이동';
    downButton.addEventListener('click', () => {
      this.navigateDirection('down');
    });
    
    bottomRow.appendChild(downButton);
    buttonGrid.appendChild(bottomRow);
    
    // 첫 번째/마지막 카드 버튼
    const firstLastRow = document.createElement('div');
    firstLastRow.className = 'navigation-button-row';
    
    const firstButton = document.createElement('button');
    firstButton.className = 'navigation-button first-button';
    firstButton.innerHTML = '⏮';
    firstButton.title = '첫 번째 카드로 이동';
    firstButton.addEventListener('click', () => {
      this.navigateToFirst();
    });
    
    const lastButton = document.createElement('button');
    lastButton.className = 'navigation-button last-button';
    lastButton.innerHTML = '⏭';
    lastButton.title = '마지막 카드로 이동';
    lastButton.addEventListener('click', () => {
      this.navigateToLast();
    });
    
    firstLastRow.appendChild(firstButton);
    firstLastRow.appendChild(lastButton);
    buttonGrid.appendChild(firstLastRow);
    
    controlsElement.appendChild(buttonGrid);
    navigationElement.appendChild(controlsElement);
    
    return navigationElement;
  }
  
  /**
   * 특정 카드로 이동
   * @param cardId 이동할 카드 ID
   * @returns 이동 성공 여부
   */
  navigateToCard(cardId: string): boolean {
    return this.navigationService.navigateToCard(cardId);
  }
  
  /**
   * 특정 방향으로 이동
   * @param direction 이동 방향
   * @returns 이동 성공 여부
   */
  navigateDirection(direction: NavigationDirection): boolean {
    return this.navigationService.navigateToDirection(direction);
  }
  
  /**
   * 활성 카드로 이동
   * @returns 이동 성공 여부
   */
  navigateToActiveCard(): boolean {
    // 활성 카드 가져오기
    const activeCard = this.eventBus.getState('activeCard');
    if (activeCard && activeCard.getId) {
      return this.navigateToCard(activeCard.getId());
    }
    return false;
  }
  
  /**
   * 첫 번째 카드로 이동
   * @returns 이동 성공 여부
   */
  navigateToFirst(): boolean {
    return this.navigationService.navigateToIndex(0);
  }
  
  /**
   * 마지막 카드로 이동
   * @returns 이동 성공 여부
   */
  navigateToLast(): boolean {
    const cards = this.navigationService.getCards();
    if (cards.length > 0) {
      return this.navigationService.navigateToIndex(cards.length - 1);
    }
    return false;
  }
  
  /**
   * 이벤트 리스너 등록
   */
  registerEventListeners(): void {
    // 카드 선택 이벤트 리스너
    this.eventBus.on(EventType.CARD_SELECTED, this.handleCardSelected.bind(this));
    
    // 활성 카드 변경 이벤트 리스너
    this.eventBus.on(EventType.ACTIVE_CARD_CHANGED, this.handleActiveCardChanged.bind(this));
    
    // 키보드 이벤트 리스너
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  /**
   * 이벤트 리스너 제거
   */
  removeEventListeners(): void {
    // 카드 선택 이벤트 리스너 제거
    this.eventBus.off(EventType.CARD_SELECTED, this.handleCardSelected.bind(this));
    
    // 활성 카드 변경 이벤트 리스너 제거
    this.eventBus.off(EventType.ACTIVE_CARD_CHANGED, this.handleActiveCardChanged.bind(this));
    
    // 키보드 이벤트 리스너 제거
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  /**
   * 카드 선택 이벤트 핸들러
   * @param data 이벤트 데이터
   */
  private handleCardSelected(data: any): void {
    this.currentCardId = data.cardId;
  }
  
  /**
   * 활성 카드 변경 이벤트 핸들러
   * @param data 이벤트 데이터
   */
  private handleActiveCardChanged(data: any): void {
    // 활성 카드 ID 업데이트
    if (data && data.card) {
      this.currentCardId = data.card.id;
      
      // 필요한 경우 활성 카드로 스크롤
      if (this.currentCardId) {
        this.navigationService.scrollToCard(this.currentCardId);
      }
    }
  }
  
  /**
   * 키보드 이벤트 핸들러
   * @param event 키보드 이벤트
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // 키보드 내비게이션 처리
    if (event.ctrlKey && event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateDirection('up');
    } else if (event.ctrlKey && event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateDirection('down');
    } else if (event.ctrlKey && event.key === 'ArrowLeft') {
      event.preventDefault();
      this.navigateDirection('left');
    } else if (event.ctrlKey && event.key === 'ArrowRight') {
      event.preventDefault();
      this.navigateDirection('right');
    } else if (event.ctrlKey && event.key === 'Home') {
      event.preventDefault();
      this.navigateToFirst();
    } else if (event.ctrlKey && event.key === 'End') {
      event.preventDefault();
      this.navigateToLast();
    }
  }
} 