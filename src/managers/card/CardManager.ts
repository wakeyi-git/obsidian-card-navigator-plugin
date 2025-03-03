import { TFile } from 'obsidian';
import { Card } from '../../core/models/Card';
import { CardData, CardEventData, CardEventType, CardStateEnum } from '../../core/types/card.types';
import { ICardPosition } from '../../core/types/layout.types';
import { CardPosition } from '../../core/models/CardPosition';
import { ICardService } from '../../core/interfaces/service/ICardService';
import { ICardManager } from '../../core/interfaces/manager/ICardManager';
import { ICardRenderService } from '../../core/interfaces/service/ICardRenderService';
import { ICardInteractionService } from '../../core/interfaces/service/ICardInteractionService';
import { EventHandler } from '../../core/types/common.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { ErrorCode } from '../../core/constants/error.constants';

/**
 * CardManager 클래스는 개별 카드의 생성, 업데이트, 삭제 및 상태 관리를 담당합니다.
 */
export class CardManager implements ICardManager {
  private _card: Card;
  private _element: HTMLElement | null = null;
  private _state: CardStateEnum = CardStateEnum.NORMAL;
  private position: ICardPosition | null = null;
  private cardService: ICardService;
  private cardRenderService: ICardRenderService;
  private cardInteractionService: ICardInteractionService;
  private eventListeners: Map<string, EventHandler<CardEventData>[]> = new Map();

  /**
   * 카드 ID getter
   */
  get cardId(): string {
    return this._card.id;
  }
  
  /**
   * 카드 객체 getter
   */
  get card(): Card {
    return this._card;
  }
  
  /**
   * 카드 객체 setter
   */
  set card(value: Card) {
    this._card = value;
  }
  
  /**
   * 카드 요소 getter
   */
  get element(): HTMLElement {
    if (!this._element) {
      throw new Error('카드 요소가 초기화되지 않았습니다.');
    }
    return this._element;
  }
  
  /**
   * 카드 상태 getter
   */
  get state(): CardStateEnum {
    return this._state;
  }

  /**
   * CardManager 생성자
   * @param card 관리할 카드 객체
   * @param cardService 카드 서비스 인스턴스
   * @param cardRenderService 카드 렌더링 서비스 인스턴스
   * @param cardInteractionService 카드 상호작용 서비스 인스턴스
   */
  constructor(
    card: Card,
    cardService: ICardService,
    cardRenderService: ICardRenderService,
    cardInteractionService: ICardInteractionService
  ) {
    this._card = card;
    this.cardService = cardService;
    this.cardRenderService = cardRenderService;
    this.cardInteractionService = cardInteractionService;
    
    Log.debug('CardManager', `카드 매니저 생성: ${card.id}`);
  }

  /**
   * 카드 관리자 초기화
   */
  public initialize(): void {
    ErrorHandler.captureErrorSync(() => {
      if (this._element) {
        return;
      }

      // 카드 렌더링 서비스를 사용하여 카드 요소 생성
      this._element = this.cardRenderService.createCardElement(this._card);
      
      // 카드 상호작용 이벤트 설정
      this.setupInteractions();
      
      Log.debug('CardManager', `카드 초기화 완료: ${this._card.id}`);
    }, ErrorCode.CARD_INITIALIZATION_ERROR, { cardId: this._card.id }, true) || this.createErrorElement();
  }

  /**
   * 오류 발생 시 표시할 요소를 생성합니다.
   * @returns 오류 표시 요소
   */
  private createErrorElement(): HTMLElement {
    const errorElement = document.createElement('div');
    errorElement.classList.add('card-error');
    errorElement.textContent = '카드를 로드할 수 없습니다';
    return errorElement;
  }

  /**
   * 카드 상호작용 이벤트를 설정합니다.
   */
  private setupInteractions(): void {
    if (!this._element) return;

    // 카드 상호작용 서비스를 사용하여 이벤트 설정
    this.cardInteractionService.setupCardInteractions(this._card, this._element, {
      onClick: (event: MouseEvent) => this.handleCardClick(event),
      onContextMenu: (event: MouseEvent) => this.handleCardContextMenu(event),
      onDragStart: (event: DragEvent) => this.handleCardDragStart(event),
      onDragEnd: (event: DragEvent) => this.handleCardDragEnd(event),
      onHover: (event: MouseEvent) => this.handleCardHover(event),
      onLeave: (event: MouseEvent) => this.handleCardLeave(event)
    });
  }

  /**
   * 카드 클릭 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleCardClick(event: MouseEvent): void {
    ErrorHandler.captureErrorSync(() => {
      // 카드 클릭 시 상호작용 서비스의 핸들러 호출
      this.cardInteractionService.handleCardClick(this._card, event);
      this.emitEvent(CardEventType.CLICK, { card: this._card, originalEvent: event });
    }, ErrorCode.CARD_CLICK_ERROR, { cardId: this._card.id }, true);
  }

  /**
   * 카드 컨텍스트 메뉴 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleCardContextMenu(event: MouseEvent): void {
    ErrorHandler.captureErrorSync(() => {
      this.emitEvent(CardEventType.CONTEXT_MENU, { card: this._card, originalEvent: event });
    }, ErrorCode.CARD_CONTEXT_MENU_ERROR, { cardId: this._card.id }, true);
  }

  /**
   * 카드 드래그 시작 이벤트 핸들러
   * @param event 드래그 이벤트
   */
  private handleCardDragStart(event: DragEvent): void {
    ErrorHandler.captureErrorSync(() => {
      this.setState(CardStateEnum.DRAGGING);
      this.emitEvent(CardEventType.DRAG_START, { card: this._card, originalEvent: event });
    }, ErrorCode.CARD_DRAG_START_ERROR, { cardId: this._card.id }, true);
  }

  /**
   * 카드 드래그 종료 이벤트 핸들러
   * @param event 드래그 이벤트
   */
  private handleCardDragEnd(event: DragEvent): void {
    ErrorHandler.captureErrorSync(() => {
      this.setState(CardStateEnum.NORMAL);
      this.emitEvent(CardEventType.DRAG_END, { card: this._card, originalEvent: event });
    }, ErrorCode.CARD_DRAG_END_ERROR, { cardId: this._card.id }, true);
  }

  /**
   * 카드 호버 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleCardHover(event: MouseEvent): void {
    ErrorHandler.captureErrorSync(() => {
      if (this._state !== CardStateEnum.SELECTED && this._state !== CardStateEnum.DRAGGING) {
        this.setState(CardStateEnum.HOVER);
      }
      this.emitEvent(CardEventType.HOVER, { card: this._card, originalEvent: event });
    }, ErrorCode.CARD_HOVER_ERROR, { cardId: this._card.id }, false);
  }

  /**
   * 카드 마우스 떠남 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleCardLeave(event: MouseEvent): void {
    ErrorHandler.captureErrorSync(() => {
      if (this._state === CardStateEnum.HOVER) {
        this.setState(CardStateEnum.NORMAL);
      }
      this.emitEvent(CardEventType.LEAVE, { card: this._card, originalEvent: event });
    }, ErrorCode.CARD_LEAVE_ERROR, { cardId: this._card.id }, false);
  }

  /**
   * 이벤트를 발생시킵니다.
   * @param eventType 이벤트 타입
   * @param data 이벤트 데이터
   */
  private emitEvent(eventType: CardEventType, data: Partial<CardEventData>): void {
    const listeners = this.eventListeners.get(eventType) || [];
    
    const eventData: CardEventData = {
      type: eventType,
      timestamp: Date.now(),
      card: this._card,
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
    if (this._element) {
      const customEvent = new CustomEvent(eventType, { detail: eventData, bubbles: true });
      this._element.dispatchEvent(customEvent);
    }
  }

  /**
   * 카드 객체를 반환합니다.
   * @returns 카드 객체
   */
  public getCard(): Card {
    return this._card;
  }

  /**
   * 카드 위치를 반환합니다.
   * @returns 카드 위치
   */
  public getPosition(): ICardPosition | null {
    return this.position;
  }

  /**
   * 카드를 새로고침합니다.
   */
  public refresh(): void {
    ErrorHandler.captureErrorSync(() => {
      if (!this._element) return;
      
      // 카드 렌더링 서비스를 사용하여 카드 요소 업데이트
      this.cardRenderService.updateCardElement(this.element, this.card);
    }, ErrorCode.CARD_REFRESH_ERROR, { cardId: this.card.id }, true);
  }

  /**
   * 카드 데이터를 업데이트합니다.
   * @param card 업데이트할 카드 데이터
   */
  public updateCardData(card: Card): void {
    ErrorHandler.captureErrorSync(() => {
      this._card = card;
      this.refresh();
      this.emitEvent(CardEventType.CONTENT_UPDATE, { card: this._card });
    }, ErrorCode.CARD_UPDATE_ERROR, { cardId: this._card.id }, true);
  }

  /**
   * 카드 상태를 설정합니다.
   * @param state 설정할 카드 상태
   * @throws 유효하지 않은 카드 상태인 경우
   */
  public setState(state: CardStateEnum): void {
    try {
      // 상태 유효성 검사
      this.validateCardState(state);
      
      // 이전 상태와 동일하면 무시
      if (this.state === state) {
        return;
      }
      
      const previousState = this.state;
      
      // 상태에 따른 CSS 클래스 제거
      if (this.element) {
        this.element.classList.remove(`card-state-${previousState}`);
      }
      
      // 새 상태 설정
      this._state = state;
      
      // 상태에 따른 CSS 클래스 추가
      if (this.element) {
        this.element.classList.add(`card-state-${this.state}`);
      }
      
      // 상태 변경 이벤트 발생
      this.emitEvent(CardEventType.SELECTION_CHANGE, {
        card: this.card,
        data: { state: this.state }
      });
      
      Log.debug('CardManager', `카드 상태 변경: ${this.card.id}, ${previousState} -> ${this.state}`);
    } catch (error: unknown) {
      ErrorHandler.handleError(
        'CardManager.setState',
        `카드 상태 설정 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        false
      );
      throw error;
    }
  }
  
  /**
   * 카드 상태 유효성 검사
   * @param state 검사할 카드 상태
   * @throws 유효하지 않은 카드 상태인 경우
   */
  private validateCardState(state: CardStateEnum): void {
    const validStates = Object.values(CardStateEnum);
    
    if (!validStates.includes(state)) {
      throw ErrorHandler.createError(
        ErrorCode.INVALID_CARD_STATE,
        { state }
      );
    }
  }

  /**
   * 카드 위치를 설정합니다.
   * @param position 설정할 카드 위치
   */
  private setPositionObject(position: ICardPosition): void {
    this.position = position;
    
    if (this.element) {
      // 카드 요소에 위치 적용
      this.element.style.position = 'absolute';
      this.element.style.top = `${position.y}px`;
      this.element.style.left = `${position.x}px`;
      this.element.style.width = `${position.width}px`;
      
      if (position.height) {
        this.element.style.height = `${position.height}px`;
      }
    }
  }

  /**
   * 카드 위치를 설정합니다.
   * @param x X 좌표
   * @param y Y 좌표
   * @param width 너비
   * @param height 높이
   */
  public setPosition(x: number, y: number, width: number, height: number): void {
    const position: ICardPosition = {
      cardId: this.cardId,
      x,
      y,
      width,
      height,
      row: 0,
      column: 0
    };
    
    this.setPositionObject(position);
  }

  /**
   * 카드 이벤트 리스너를 추가합니다.
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  public addEventListener(eventType: CardEventType, listener: EventListener): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(listener as unknown as EventHandler<CardEventData>);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * 카드 이벤트 리스너를 제거합니다.
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  public removeEventListener(eventType: CardEventType, listener: EventListener): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener as unknown as EventHandler<CardEventData>);
    
    if (index !== -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(eventType, listeners);
    }
  }

  /**
   * 카드 관리자를 정리합니다.
   * 이벤트 리스너 등을 정리합니다.
   */
  public destroy(): void {
    ErrorHandler.captureErrorSync(() => {
      // 이벤트 리스너 정리
      if (this._element) {
        this.cardInteractionService.removeCardInteractions(this._card, this._element);
        
        // 요소 제거
        if (this._element.parentNode) {
          this._element.parentNode.removeChild(this._element);
        }
        
        this._element = null;
      }
      
      // 이벤트 리스너 맵 정리
      this.eventListeners.clear();
      
      Log.debug('CardManager', `카드 매니저 정리 완료: ${this.card.id}`);
    }, ErrorCode.CARD_DESTROY_ERROR, { cardId: this.card.id }, true);
  }

  /**
   * 카드 UI 새로고침
   * 카드 UI를 최신 상태로 업데이트합니다.
   */
  public refreshUI(): void {
    this.refresh();
  }
} 