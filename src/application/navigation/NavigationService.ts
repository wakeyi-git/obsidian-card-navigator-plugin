import { IEventBus } from '../../core/events/IEventBus';
import { EventType } from '../../core/events/EventTypes';
import { INavigation } from '../../domain/navigation/Navigation';
import { CardContainer } from '../../domain/navigation/CardContainer';
import { ICard } from '../../domain/card/Card';
import { DomainEvent } from '../../core/events/DomainEvent';
import { NavigationMode, ScrollBehavior } from '../../domain/navigation/Navigation';
import { ICardService } from '../card/CardService';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { DomainErrorBus } from '../../core/errors/DomainErrorBus';
import { ErrorCode } from '../../core/errors/ErrorTypes';

/**
 * 네비게이션 서비스 인터페이스
 */
export interface INavigationService {
  /**
   * 네비게이션 모드 설정
   */
  setNavigationMode(mode: NavigationMode): void;

  /**
   * 스크롤 동작 설정
   */
  setScrollBehavior(behavior: ScrollBehavior): void;

  /**
   * 카드 선택
   */
  selectCard(cardId: string): void;

  /**
   * 카드 선택 해제
   */
  deselectCard(cardId: string): void;

  /**
   * 모든 카드 선택 해제
   */
  deselectAllCards(): void;

  /**
   * 카드 포커스
   */
  focusCard(cardId: string): void;

  /**
   * 카드 포커스 해제
   */
  unfocusCard(cardId: string): void;

  /**
   * 카드 열기
   */
  openCard(cardId: string): void;

  /**
   * 카드 닫기
   */
  closeCard(cardId: string): void;

  /**
   * 서비스 정리
   */
  destroy(): void;
}

/**
 * 네비게이션 서비스 구현체
 */
export class NavigationService implements INavigationService {
  private navigation: INavigation;
  private eventBus: DomainEventBus;
  private errorBus: DomainErrorBus;
  private containers: Map<string, CardContainer>;
  private mode: NavigationMode = NavigationMode.KEYBOARD;
  private scrollBehavior: ScrollBehavior = 'auto';

  constructor(
    private readonly cardService: ICardService,
    navigation: INavigation
  ) {
    this.navigation = navigation;
    this.eventBus = DomainEventBus.getInstance();
    this.errorBus = DomainErrorBus.getInstance();
    this.containers = new Map();
    this.setupEventListeners();
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    this.eventBus.subscribe(EventType.CARD_CREATED, this.handleCardCreated.bind(this));
    this.eventBus.subscribe(EventType.CARD_DESTROYED, this.handleCardDestroyed.bind(this));
    this.eventBus.subscribe(EventType.CARD_SELECTED, this.handleCardSelected.bind(this));
    this.eventBus.subscribe(EventType.CARD_DESELECTED, this.handleCardDeselected.bind(this));
    this.eventBus.subscribe(EventType.CARD_FOCUSED, this.handleCardFocused.bind(this));
    this.eventBus.subscribe(EventType.CARD_UNFOCUSED, this.handleCardUnfocused.bind(this));
    this.eventBus.subscribe(EventType.CARD_OPENED, this.handleCardOpened.bind(this));
    this.eventBus.subscribe(EventType.CARD_CLOSED, this.handleCardClosed.bind(this));
  }

  /**
   * 네비게이션 모드 설정
   */
  setNavigationMode(mode: NavigationMode): void {
    const previousMode = this.mode;
    this.mode = mode;
    this.navigation.setNavigationMode(mode);
    this.eventBus.publish(EventType.NAVIGATION_MODE_CHANGED, { 
      mode: mode === NavigationMode.KEYBOARD ? 'normal' : 'vim',
      previousMode: previousMode === NavigationMode.KEYBOARD ? 'normal' : 'vim'
    }, 'NavigationService');
  }

  /**
   * 스크롤 동작 설정
   */
  setScrollBehavior(behavior: ScrollBehavior): void {
    this.scrollBehavior = behavior;
    this.navigation.setScrollBehavior('auto');
    this.eventBus.publish(EventType.SCROLL_BEHAVIOR_CHANGED, { 
      behavior: behavior === 'smooth' ? 'smooth' : 'instant'
    }, 'NavigationService');
  }

  /**
   * 카드 선택
   */
  selectCard(cardId: string): void {
    this.cardService.selectCard(cardId);
    this.navigation.selectCard(cardId);
    this.eventBus.publish(EventType.CARD_SELECTED, { card: cardId }, 'NavigationService');
  }

  /**
   * 카드 선택 해제
   */
  deselectCard(cardId: string): void {
    this.cardService.deselectCard(cardId);
    this.navigation.deselectCard(cardId);
    this.eventBus.publish(EventType.CARD_DESELECTED, { card: cardId }, 'NavigationService');
  }

  /**
   * 모든 카드 선택 해제
   */
  deselectAllCards(): void {
    this.cardService.deselectAllCards();
    this.navigation.deselectAllCards();
    this.eventBus.publish(EventType.CARDS_DESELECTED, {}, 'NavigationService');
  }

  /**
   * 카드 포커스
   */
  focusCard(cardId: string): void {
    this.cardService.focusCard(cardId);
    this.navigation.focusCard(cardId);
    this.eventBus.publish(EventType.CARD_FOCUSED, { card: cardId }, 'NavigationService');
  }

  /**
   * 카드 포커스 해제
   */
  unfocusCard(cardId: string): void {
    this.cardService.unfocusCard(cardId);
    this.navigation.unfocusCard(cardId);
    this.eventBus.publish(EventType.CARD_UNFOCUSED, { card: cardId }, 'NavigationService');
  }

  /**
   * 카드 열기
   */
  openCard(cardId: string): void {
    this.cardService.openCard(cardId);
    this.navigation.openCard(cardId);
    this.eventBus.publish(EventType.CARD_OPENED, { card: cardId }, 'NavigationService');
  }

  /**
   * 카드 닫기
   */
  closeCard(cardId: string): void {
    this.cardService.closeCard(cardId);
    this.navigation.closeCard(cardId);
    this.eventBus.publish(EventType.CARD_CLOSED, { card: cardId }, 'NavigationService');
  }

  /**
   * 서비스 정리
   */
  destroy(): void {
    this.containers.forEach(container => container.destroy());
    this.containers.clear();
    this.eventBus.publish(EventType.CARD_SERVICE_DESTROYED, {}, 'NavigationService');
  }

  /**
   * 카드 생성 이벤트 처리
   */
  private handleCardCreated(event: DomainEvent<EventType.CARD_CREATED>): void {
    const card = this.cardService.getCard(event.payload.card);
    if (card) {
      const container = new CardContainer(card);
      this.containers.set(card.getId(), container);
    }
  }

  /**
   * 카드 제거 이벤트 처리
   */
  private handleCardDestroyed(event: DomainEvent<EventType.CARD_DESTROYED>): void {
    const container = this.containers.get(event.payload.cardId);
    if (container) {
      container.destroy();
      this.containers.delete(event.payload.cardId);
    }
  }

  /**
   * 카드 선택 이벤트 처리
   */
  private handleCardSelected(event: DomainEvent<EventType.CARD_SELECTED>): void {
    const container = this.containers.get(event.payload.card);
    if (container) {
      container.select();
    }
  }

  /**
   * 카드 선택 해제 이벤트 처리
   */
  private handleCardDeselected(event: DomainEvent<EventType.CARD_DESELECTED>): void {
    const container = this.containers.get(event.payload.card);
    if (container) {
      container.deselect();
    }
  }

  /**
   * 카드 포커스 이벤트 처리
   */
  private handleCardFocused(event: DomainEvent<EventType.CARD_FOCUSED>): void {
    const container = this.containers.get(event.payload.card);
    if (container) {
      container.focus();
    }
  }

  /**
   * 카드 포커스 해제 이벤트 처리
   */
  private handleCardUnfocused(event: DomainEvent<EventType.CARD_UNFOCUSED>): void {
    const container = this.containers.get(event.payload.card);
    if (container) {
      container.unfocus();
    }
  }

  /**
   * 카드 열기 이벤트 처리
   */
  private handleCardOpened(event: DomainEvent<EventType.CARD_OPENED>): void {
    const container = this.containers.get(event.payload.card);
    if (container) {
      container.open();
    }
  }

  /**
   * 카드 닫기 이벤트 처리
   */
  private handleCardClosed(event: DomainEvent<EventType.CARD_CLOSED>): void {
    const container = this.containers.get(event.payload.card);
    if (container) {
      container.close();
    }
  }
} 