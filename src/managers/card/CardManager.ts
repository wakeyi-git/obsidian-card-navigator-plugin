import { TFile } from 'obsidian';
import { Card } from '../../core/models/Card';
import { CardData, CardEventData, CardEventType, CardState, CardStateEnum } from '../../core/types/card.types';
import { ICardPosition } from '../../core/types/layout.types';
import { CardPosition } from '../../core/models/CardPosition';
import { ICardService } from '../../core/interfaces/ICardService';
import { ICardManager } from '../../core/interfaces/ICardManager';
import { ICardRenderService } from '../../core/interfaces/ICardRenderService';
import { ICardInteractionService } from '../../core/interfaces/ICardInteractionService';
import { EventHandler } from '../../core/types/common.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { ErrorCode } from '../../core/constants/error.constants';

/**
 * CardManager 클래스는 개별 카드의 생성, 업데이트, 삭제 및 상태 관리를 담당합니다.
 */
export class CardManager implements ICardManager {
  private card: Card;
  private element: HTMLElement | null = null;
  private state: CardStateEnum = CardStateEnum.NORMAL;
  private position: ICardPosition | null = null;
  private cardService: ICardService;
  private cardRenderService: ICardRenderService;
  private cardInteractionService: ICardInteractionService;
  private eventListeners: Map<string, EventHandler<CardEventData>[]> = new Map();

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
    this.card = card;
    this.cardService = cardService;
    this.cardRenderService = cardRenderService;
    this.cardInteractionService = cardInteractionService;
    
    Log.debug('CardManager', `카드 매니저 생성: ${card.id}`);
  }

  /**
   * 카드 요소를 생성하고 초기화합니다.
   * @returns 생성된 카드 HTML 요소
   */
  public initialize(): HTMLElement {
    return ErrorHandler.captureErrorSync(() => {
      if (this.element) {
        return this.element;
      }

      // 카드 렌더링 서비스를 사용하여 카드 요소 생성
      this.element = this.cardRenderService.renderCard(this.card);
      
      // 카드 상호작용 이벤트 설정
      this.setupInteractions();
      
      Log.debug('CardManager', `카드 초기화 완료: ${this.card.id}`);
      return this.element;
    }, 'CARD_INITIALIZATION_ERROR', { cardId: this.card.id }, true) || this.createErrorElement();
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
    if (!this.element) return;

    // 카드 상호작용 서비스를 사용하여 이벤트 설정
    this.cardInteractionService.setupCardInteractions(this.element, this.card, {
      onClick: this.handleCardClick.bind(this),
      onContextMenu: this.handleCardContextMenu.bind(this),
      onDragStart: this.handleCardDragStart.bind(this),
      onDragEnd: this.handleCardDragEnd.bind(this),
      onHover: this.handleCardHover.bind(this),
      onLeave: this.handleCardLeave.bind(this)
    });
  }

  /**
   * 카드 클릭 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleCardClick(event: MouseEvent): void {
    ErrorHandler.captureErrorSync(() => {
      // 카드 클릭 시 파일 열기
      this.cardService.openCardFile(this.card);
      this.emitEvent('card-click', { card: this.card, event });
    }, 'CARD_CLICK_ERROR', { cardId: this.card.id }, true);
  }

  /**
   * 카드 컨텍스트 메뉴 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleCardContextMenu(event: MouseEvent): void {
    ErrorHandler.captureErrorSync(() => {
      this.emitEvent('card-contextmenu', { card: this.card, event });
    }, 'CARD_CONTEXT_MENU_ERROR', { cardId: this.card.id }, true);
  }

  /**
   * 카드 드래그 시작 이벤트 핸들러
   * @param event 드래그 이벤트
   */
  private handleCardDragStart(event: DragEvent): void {
    ErrorHandler.captureErrorSync(() => {
      this.setState('dragging');
      this.emitEvent('card-dragstart', { card: this.card, event });
    }, 'CARD_DRAG_START_ERROR', { cardId: this.card.id }, true);
  }

  /**
   * 카드 드래그 종료 이벤트 핸들러
   * @param event 드래그 이벤트
   */
  private handleCardDragEnd(event: DragEvent): void {
    ErrorHandler.captureErrorSync(() => {
      this.setState('normal');
      this.emitEvent('card-dragend', { card: this.card, event });
    }, 'CARD_DRAG_END_ERROR', { cardId: this.card.id }, true);
  }

  /**
   * 카드 호버 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleCardHover(event: MouseEvent): void {
    ErrorHandler.captureErrorSync(() => {
      if (this.state !== 'selected' && this.state !== 'dragging') {
        this.setState('hover');
      }
      this.emitEvent('card-hover', { card: this.card, event });
    }, 'CARD_HOVER_ERROR', { cardId: this.card.id }, false);
  }

  /**
   * 카드 마우스 떠남 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleCardLeave(event: MouseEvent): void {
    ErrorHandler.captureErrorSync(() => {
      if (this.state === 'hover') {
        this.setState('normal');
      }
      this.emitEvent('card-leave', { card: this.card, event });
    }, 'CARD_LEAVE_ERROR', { cardId: this.card.id }, false);
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
      card: this.card,
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
    if (this.element) {
      const customEvent = new CustomEvent(eventType, { detail: eventData, bubbles: true });
      this.element.dispatchEvent(customEvent);
    }
  }

  /**
   * 카드 객체를 반환합니다.
   * @returns 카드 객체
   */
  public getCard(): Card {
    return this.card;
  }

  /**
   * 카드 HTML 요소를 반환합니다.
   * @returns 카드 HTML 요소
   */
  public getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * 카드 상태를 반환합니다.
   * @returns 카드 상태
   */
  public getState(): CardStateEnum {
    return this.state;
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
      if (!this.element) return;
      
      // 카드 렌더링 서비스를 사용하여 카드 요소 업데이트
      this.cardRenderService.updateCardElement(this.element, this.card);
    }, 'CARD_REFRESH_ERROR', { cardId: this.card.id }, true);
  }

  /**
   * 카드 데이터를 업데이트합니다.
   * @param data 업데이트할 카드 데이터
   */
  public updateCardData(data: Partial<CardData>): void {
    ErrorHandler.captureErrorSync(() => {
      this.card = this.card.update(data);
      this.refresh();
      this.emitEvent('card-updated', { card: this.card });
    }, 'CARD_UPDATE_ERROR', { cardId: this.card.id }, true);
  }

  /**
   * 카드 상태를 설정합니다.
   * @param state 설정할 카드 상태
   * @throws 유효하지 않은 카드 상태인 경우
   */
  public setState(state: CardState): void {
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
      this.state = state as CardStateEnum;
      
      // 상태에 따른 CSS 클래스 추가
      if (this.element) {
        this.element.classList.add(`card-state-${this.state}`);
      }
      
      // 상태 변경 이벤트 발생
      this.dispatchEvent('card-state-changed', {
        type: 'card-state-changed',
        card: this.card,
        state: this.state
      });
      
      Log.debug('CardManager', `카드 상태 변경: ${this.card.id}, ${previousState} -> ${this.state}`);
    } catch (error) {
      ErrorHandler.handleError(
        'CardManager.setState',
        `카드 상태 설정 중 오류 발생: ${error.message}`,
        error
      );
      throw error;
    }
  }
  
  /**
   * 카드 상태 유효성 검사
   * @param state 검사할 카드 상태
   * @throws 유효하지 않은 카드 상태인 경우
   */
  private validateCardState(state: CardState): void {
    const validStates = Object.values(CardStateEnum);
    
    if (!validStates.includes(state as CardStateEnum)) {
      throw ErrorHandler.createError(
        ErrorCode.INVALID_CARD_STATE,
        `유효하지 않은 카드 상태: ${state}`
      );
    }
  }

  /**
   * 카드 위치를 설정합니다.
   * @param position 설정할 카드 위치
   */
  public setPosition(position: ICardPosition): void {
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
   * 카드 이벤트 리스너를 추가합니다.
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  public addEventListener(eventType: CardEventType, handler: EventHandler<CardEventData>): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(handler);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * 카드 이벤트 리스너를 제거합니다.
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  public removeEventListener(eventType: CardEventType, handler: EventHandler<CardEventData>): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(handler);
    
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
      if (this.element) {
        this.cardInteractionService.removeCardInteractions(this.element);
        
        // 요소 제거
        if (this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
      }
      
      // 이벤트 리스너 맵 정리
      this.eventListeners.clear();
      
      Log.debug('CardManager', `카드 매니저 정리 완료: ${this.card.id}`);
    }, 'CARD_DESTROY_ERROR', { cardId: this.card.id }, true);
  }
} 