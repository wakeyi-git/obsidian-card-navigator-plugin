import { TFile } from 'obsidian';
import { Card } from '../../core/models/Card';
import { CardManager } from './CardManager';
import { ICardManager } from '../../core/interfaces/ICardManager';
import { ICardContainerManager } from '../../core/interfaces/ICardContainerManager';
import { ICardService } from '../../core/interfaces/ICardService';
import { ICardRenderService } from '../../core/interfaces/ICardRenderService';
import { ICardInteractionService } from '../../core/interfaces/ICardInteractionService';
import { ILayoutManager } from '../../core/interfaces/ILayoutManager';
import { LayoutOptions } from '../../core/types/layout.types';
import { CardContainerEventData, CardContainerEventType } from '../../core/types/card.types';
import { EventHandler } from '../../core/types/common.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';

/**
 * CardContainerManager 클래스는 여러 카드를 관리하는 컨테이너를 담당합니다.
 */
export class CardContainerManager implements ICardContainerManager {
  private container: HTMLElement;
  private cardManagers: Map<string, ICardManager> = new Map();
  private selectedCardIds: Set<string> = new Set();
  private cardService: ICardService;
  private cardRenderService: ICardRenderService;
  private cardInteractionService: ICardInteractionService;
  private layoutManager: ILayoutManager;
  private eventListeners: Map<string, EventHandler<CardContainerEventData>[]> = new Map();
  private layoutOptions: LayoutOptions;

  /**
   * CardContainerManager 생성자
   * @param container 카드 컨테이너 요소
   * @param cardService 카드 서비스 인스턴스
   * @param cardRenderService 카드 렌더링 서비스 인스턴스
   * @param cardInteractionService 카드 상호작용 서비스 인스턴스
   * @param layoutManager 레이아웃 관리자 인스턴스
   * @param initialLayoutOptions 초기 레이아웃 옵션
   */
  constructor(
    container: HTMLElement,
    cardService: ICardService,
    cardRenderService: ICardRenderService,
    cardInteractionService: ICardInteractionService,
    layoutManager: ILayoutManager,
    initialLayoutOptions: LayoutOptions
  ) {
    this.container = container;
    this.cardService = cardService;
    this.cardRenderService = cardRenderService;
    this.cardInteractionService = cardInteractionService;
    this.layoutManager = layoutManager;
    this.layoutOptions = initialLayoutOptions;
    
    Log.debug('CardContainerManager', '카드 컨테이너 매니저 생성');
  }

  /**
   * 컨테이너를 초기화합니다.
   */
  public initialize(): void {
    ErrorHandler.captureErrorSync(() => {
      // 컨테이너 클래스 추가
      this.container.classList.add('card-container');
      
      // 레이아웃 매니저 초기화
      this.layoutManager.initialize(this.container, this.layoutOptions);
      
      // 레이아웃 이벤트 설정
      this.setupLayoutEvents();
      
      Log.debug('CardContainerManager', '카드 컨테이너 초기화 완료');
    }, 'CARD_CONTAINER_INITIALIZATION_ERROR', {}, true);
  }

  /**
   * 레이아웃 이벤트를 설정합니다.
   */
  private setupLayoutEvents(): void {
    // 레이아웃 변경 이벤트 리스너 등록
    this.layoutManager.addEventListener('layout-changed', this.handleLayoutChanged.bind(this));
    this.layoutManager.addEventListener('layout-updated', this.handleLayoutUpdated.bind(this));
  }

  /**
   * 레이아웃 변경 이벤트 핸들러
   * @param event 레이아웃 이벤트 데이터
   */
  private handleLayoutChanged(event: any): void {
    ErrorHandler.captureErrorSync(() => {
      this.emitEvent('layout-changed', { type: 'layout-changed', timestamp: Date.now() });
    }, 'LAYOUT_CHANGED_ERROR', {}, false);
  }

  /**
   * 레이아웃 업데이트 이벤트 핸들러
   * @param event 레이아웃 이벤트 데이터
   */
  private handleLayoutUpdated(event: any): void {
    ErrorHandler.captureErrorSync(() => {
      this.emitEvent('layout-updated', { type: 'layout-updated', timestamp: Date.now() });
    }, 'LAYOUT_UPDATED_ERROR', {}, false);
  }

  /**
   * 카드를 컨테이너에 추가합니다.
   * @param card 추가할 카드 객체
   * @returns 생성된 카드 매니저
   */
  public addCard(card: Card): ICardManager {
    return ErrorHandler.captureErrorSync(() => {
      // 이미 존재하는 카드인지 확인
      if (this.cardManagers.has(card.id)) {
        return this.cardManagers.get(card.id) as ICardManager;
      }
      
      // 카드 매니저 생성
      const cardManager = new CardManager(
        card,
        this.cardService,
        this.cardRenderService,
        this.cardInteractionService
      );
      
      // 카드 요소 초기화 및 컨테이너에 추가
      const cardElement = cardManager.initialize();
      this.container.appendChild(cardElement);
      
      // 카드 이벤트 리스너 설정
      this.setupCardEvents(cardManager);
      
      // 카드 매니저 맵에 추가
      this.cardManagers.set(card.id, cardManager);
      
      // 레이아웃 업데이트
      this.updateLayout();
      
      // 이벤트 발생
      this.emitEvent('card-added', { 
        type: 'card-added', 
        timestamp: Date.now(),
        cardId: card.id, 
        card: card,
        cardCount: this.cardManagers.size
      });
      
      Log.debug('CardContainerManager', `카드 추가: ${card.id}`);
      
      return cardManager;
    }, 'CARD_ADD_ERROR', { cardId: card.id }, true) as ICardManager;
  }

  /**
   * 카드 이벤트 리스너를 설정합니다.
   * @param cardManager 카드 매니저
   */
  private setupCardEvents(cardManager: ICardManager): void {
    // 카드 클릭 이벤트
    cardManager.addEventListener('card-click', (event) => {
      this.handleCardClick(cardManager.getCard().id, event);
    });
    
    // 카드 컨텍스트 메뉴 이벤트
    cardManager.addEventListener('card-contextmenu', (event) => {
      this.handleCardContextMenu(cardManager.getCard().id, event);
    });
    
    // 카드 상태 변경 이벤트
    cardManager.addEventListener('card-state-changed', (event) => {
      this.handleCardStateChanged(cardManager.getCard().id, event);
    });
  }

  /**
   * 카드 클릭 이벤트 핸들러
   * @param cardId 카드 ID
   * @param event 이벤트 데이터
   */
  private handleCardClick(cardId: string, event: any): void {
    ErrorHandler.captureErrorSync(() => {
      // Shift 키를 누른 상태에서 클릭하면 다중 선택
      if (event.event && event.event.shiftKey) {
        this.toggleCardSelection(cardId);
      } else {
        // 일반 클릭은 단일 선택
        this.clearSelection();
        this.selectCard(cardId);
      }
      
      this.emitEvent('card-clicked', { 
        type: 'card-clicked', 
        timestamp: Date.now(),
        cardId: cardId, 
        card: event.card
      });
    }, 'CARD_CLICK_HANDLER_ERROR', { cardId }, false);
  }

  /**
   * 카드 컨텍스트 메뉴 이벤트 핸들러
   * @param cardId 카드 ID
   * @param event 이벤트 데이터
   */
  private handleCardContextMenu(cardId: string, event: any): void {
    ErrorHandler.captureErrorSync(() => {
      // 선택되지 않은 카드에서 컨텍스트 메뉴를 열면 해당 카드만 선택
      if (!this.isCardSelected(cardId)) {
        this.clearSelection();
        this.selectCard(cardId);
      }
      
      this.emitEvent('card-context-menu', { 
        type: 'card-context-menu', 
        timestamp: Date.now(),
        cardId: cardId, 
        card: event.card,
        event: event.event
      });
    }, 'CARD_CONTEXT_MENU_HANDLER_ERROR', { cardId }, false);
  }

  /**
   * 카드 상태 변경 이벤트 핸들러
   * @param cardId 카드 ID
   * @param event 이벤트 데이터
   */
  private handleCardStateChanged(cardId: string, event: any): void {
    ErrorHandler.captureErrorSync(() => {
      this.emitEvent('card-state-changed', { 
        type: 'card-state-changed', 
        timestamp: Date.now(),
        cardId: cardId, 
        card: event.card,
        state: event.state
      });
    }, 'CARD_STATE_CHANGED_HANDLER_ERROR', { cardId }, false);
  }

  /**
   * 카드를 컨테이너에서 제거합니다.
   * @param cardId 제거할 카드 ID
   * @returns 제거 성공 여부
   */
  public removeCard(cardId: string): boolean {
    return ErrorHandler.captureErrorSync(() => {
      const cardManager = this.cardManagers.get(cardId);
      
      if (!cardManager) {
        return false;
      }
      
      // 카드 매니저 정리
      cardManager.destroy();
      
      // 맵에서 제거
      this.cardManagers.delete(cardId);
      
      // 선택 목록에서 제거
      this.selectedCardIds.delete(cardId);
      
      // 레이아웃 업데이트
      this.updateLayout();
      
      // 이벤트 발생
      this.emitEvent('card-removed', { 
        type: 'card-removed', 
        timestamp: Date.now(),
        cardId: cardId,
        cardCount: this.cardManagers.size
      });
      
      Log.debug('CardContainerManager', `카드 제거: ${cardId}`);
      
      return true;
    }, 'CARD_REMOVE_ERROR', { cardId }, true) || false;
  }

  /**
   * 모든 카드를 컨테이너에서 제거합니다.
   */
  public clearCards(): void {
    ErrorHandler.captureErrorSync(() => {
      // 모든 카드 매니저 정리
      this.cardManagers.forEach(cardManager => {
        cardManager.destroy();
      });
      
      // 맵 초기화
      this.cardManagers.clear();
      
      // 선택 목록 초기화
      this.selectedCardIds.clear();
      
      // 이벤트 발생
      this.emitEvent('cards-cleared', { 
        type: 'cards-cleared', 
        timestamp: Date.now(),
        cardCount: 0
      });
      
      Log.debug('CardContainerManager', '모든 카드 제거');
    }, 'CARDS_CLEAR_ERROR', {}, true);
  }

  /**
   * 카드 ID로 카드 매니저를 가져옵니다.
   * @param cardId 카드 ID
   * @returns 카드 매니저 또는 undefined
   */
  public getCard(cardId: string): ICardManager | undefined {
    return this.cardManagers.get(cardId);
  }

  /**
   * 모든 카드 매니저를 배열로 반환합니다.
   * @returns 카드 매니저 배열
   */
  public getAllCards(): ICardManager[] {
    return Array.from(this.cardManagers.values());
  }

  /**
   * 컨테이너의 카드 수를 반환합니다.
   * @returns 카드 수
   */
  public getCardCount(): number {
    return this.cardManagers.size;
  }

  /**
   * 카드 배열을 설정합니다.
   * @param cards 카드 배열
   */
  public setCards(cards: Card[]): void {
    ErrorHandler.captureErrorSync(() => {
      // 기존 카드 제거
      this.clearCards();
      
      // 새 카드 추가
      cards.forEach(card => {
        this.addCard(card);
      });
      
      // 레이아웃 업데이트
      this.updateLayout();
      
      // 이벤트 발생
      this.emitEvent('cards-set', { 
        type: 'cards-set', 
        timestamp: Date.now(),
        cardCount: this.cardManagers.size
      });
      
      Log.debug('CardContainerManager', `카드 설정: ${cards.length}개`);
    }, 'CARDS_SET_ERROR', { cardCount: cards.length.toString() }, true);
  }

  /**
   * 레이아웃을 업데이트합니다.
   */
  public updateLayout(): void {
    ErrorHandler.captureErrorSync(() => {
      // 카드 요소 배열 생성
      const cardElements: HTMLElement[] = [];
      const cardIds: string[] = [];
      
      this.cardManagers.forEach((cardManager, cardId) => {
        const element = cardManager.getElement();
        if (element) {
          cardElements.push(element);
          cardIds.push(cardId);
        }
      });
      
      // 레이아웃 매니저를 사용하여 레이아웃 업데이트
      this.layoutManager.updateLayout(cardElements, cardIds);
      
      Log.debug('CardContainerManager', '레이아웃 업데이트');
    }, 'LAYOUT_UPDATE_ERROR', {}, true);
  }

  /**
   * 레이아웃 옵션을 설정합니다.
   * @param options 레이아웃 옵션
   */
  public setLayoutOptions(options: Partial<LayoutOptions>): void {
    ErrorHandler.captureErrorSync(() => {
      // 레이아웃 옵션 업데이트
      this.layoutOptions = { ...this.layoutOptions, ...options };
      
      // 레이아웃 매니저에 옵션 설정
      this.layoutManager.setOptions(this.layoutOptions);
      
      // 레이아웃 업데이트
      this.updateLayout();
      
      Log.debug('CardContainerManager', '레이아웃 옵션 설정');
    }, 'LAYOUT_OPTIONS_SET_ERROR', {}, true);
  }

  /**
   * 카드를 선택합니다.
   * @param cardId 선택할 카드 ID
   */
  public selectCard(cardId: string): void {
    ErrorHandler.captureErrorSync(() => {
      const cardManager = this.cardManagers.get(cardId);
      
      if (!cardManager) {
        return;
      }
      
      // 선택 상태로 변경
      cardManager.setState('selected');
      
      // 선택 목록에 추가
      this.selectedCardIds.add(cardId);
      
      // 이벤트 발생
      this.emitEvent('card-selected', { 
        type: 'card-selected', 
        timestamp: Date.now(),
        cardId: cardId,
        card: cardManager.getCard()
      });
      
      Log.debug('CardContainerManager', `카드 선택: ${cardId}`);
    }, 'CARD_SELECT_ERROR', { cardId }, false);
  }

  /**
   * 카드 선택을 토글합니다.
   * @param cardId 토글할 카드 ID
   */
  public toggleCardSelection(cardId: string): void {
    ErrorHandler.captureErrorSync(() => {
      if (this.isCardSelected(cardId)) {
        this.deselectCard(cardId);
      } else {
        this.selectCard(cardId);
      }
    }, 'CARD_TOGGLE_SELECTION_ERROR', { cardId }, false);
  }

  /**
   * 카드 선택을 해제합니다.
   * @param cardId 선택 해제할 카드 ID
   */
  public deselectCard(cardId: string): void {
    ErrorHandler.captureErrorSync(() => {
      const cardManager = this.cardManagers.get(cardId);
      
      if (!cardManager) {
        return;
      }
      
      // 일반 상태로 변경
      cardManager.setState('normal');
      
      // 선택 목록에서 제거
      this.selectedCardIds.delete(cardId);
      
      // 이벤트 발생
      this.emitEvent('card-deselected', { 
        type: 'card-deselected', 
        timestamp: Date.now(),
        cardId: cardId,
        card: cardManager.getCard()
      });
      
      Log.debug('CardContainerManager', `카드 선택 해제: ${cardId}`);
    }, 'CARD_DESELECT_ERROR', { cardId }, false);
  }

  /**
   * 모든 카드 선택을 해제합니다.
   */
  public clearSelection(): void {
    ErrorHandler.captureErrorSync(() => {
      // 선택된 모든 카드 순회
      this.selectedCardIds.forEach(cardId => {
        const cardManager = this.cardManagers.get(cardId);
        if (cardManager) {
          cardManager.setState('normal');
        }
      });
      
      // 선택 목록 초기화
      this.selectedCardIds.clear();
      
      // 이벤트 발생
      this.emitEvent('selection-cleared', { 
        type: 'selection-cleared', 
        timestamp: Date.now()
      });
      
      Log.debug('CardContainerManager', '모든 카드 선택 해제');
    }, 'SELECTION_CLEAR_ERROR', {}, false);
  }

  /**
   * 선택된 카드 ID 배열을 반환합니다.
   * @returns 선택된 카드 ID 배열
   */
  public getSelectedCardIds(): string[] {
    return Array.from(this.selectedCardIds);
  }

  /**
   * 카드가 선택되었는지 확인합니다.
   * @param cardId 확인할 카드 ID
   * @returns 선택 여부
   */
  public isCardSelected(cardId: string): boolean {
    return this.selectedCardIds.has(cardId);
  }

  /**
   * 이벤트를 발생시킵니다.
   * @param eventType 이벤트 타입
   * @param data 이벤트 데이터
   */
  private emitEvent(eventType: CardContainerEventType, data: Partial<CardContainerEventData>): void {
    const listeners = this.eventListeners.get(eventType) || [];
    
    const eventData: CardContainerEventData = {
      type: eventType,
      timestamp: Date.now(),
      ...data
    };
    
    listeners.forEach(listener => {
      try {
        listener(eventData);
      } catch (error) {
        ErrorHandler.handleError(`이벤트 리스너 실행 중 오류 발생 (${eventType})`, error, false);
      }
    });
    
    // 커스텀 이벤트 발생
    const customEvent = new CustomEvent(eventType, { detail: eventData, bubbles: true });
    this.container.dispatchEvent(customEvent);
  }

  /**
   * 이벤트 리스너를 추가합니다.
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  public addEventListener(eventType: CardContainerEventType, handler: EventHandler<CardContainerEventData>): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(handler);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * 이벤트 리스너를 제거합니다.
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  public removeEventListener(eventType: CardContainerEventType, handler: EventHandler<CardContainerEventData>): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(handler);
    
    if (index !== -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(eventType, listeners);
    }
  }

  /**
   * 컨테이너 매니저를 정리합니다.
   */
  public destroy(): void {
    ErrorHandler.captureErrorSync(() => {
      // 모든 카드 제거
      this.clearCards();
      
      // 레이아웃 매니저 정리
      this.layoutManager.destroy();
      
      // 이벤트 리스너 맵 정리
      this.eventListeners.clear();
      
      Log.debug('CardContainerManager', '카드 컨테이너 매니저 정리 완료');
    }, 'CARD_CONTAINER_DESTROY_ERROR', {}, true);
  }
} 