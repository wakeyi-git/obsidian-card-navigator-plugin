import { App, Menu, TFile, WorkspaceLeaf, Notice } from 'obsidian';
import { Card } from '../../core/models/Card';
import { CardStateEnum, CardEventType, CardEventData } from '../../core/types/card.types';
import { SettingsManager } from '../../managers/settings/SettingsManager';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { toggleClass } from '../../utils/helpers/dom.helper';
import { ICardInteractionService, CardInteractionHandlers } from '../../core/interfaces/service/ICardInteractionService';
import { ErrorCode } from '../../core/constants/error.constants';
import { EventHandler } from '../../core/types/common.types';
import { ConfirmModal } from '../../ui/modals/ConfirmModal';
import { IFileService } from '../../core/interfaces/service/IFileService';
import { LAYOUT_CLASS_NAMES } from '../../styles/components/layout.styles';

/**
 * 카드 이벤트 이름 상수
 */
const CARD_EVENT_NAME = 'card-event';

/**
 * 카드 상태 클래스 상수
 */
const CARD_STATE_CLASSES = {
  NORMAL: LAYOUT_CLASS_NAMES.CARD_NORMAL,
  SELECTED: LAYOUT_CLASS_NAMES.CARD_SELECTED,
  FOCUSED: LAYOUT_CLASS_NAMES.CARD_FOCUSED,
  DRAGGING: LAYOUT_CLASS_NAMES.CARD_DRAGGING,
  DROPPING: LAYOUT_CLASS_NAMES.CARD_DROP_TARGET,
  HOVER: LAYOUT_CLASS_NAMES.CARD_HOVER
};

/**
 * 카드 상호작용 서비스 클래스
 * 카드와의 상호작용을 담당합니다.
 */
export class CardInteractionService implements ICardInteractionService {
  /**
   * 선택된 카드 ID 목록
   */
  private selectedCardIds: Set<string> = new Set();
  
  /**
   * 포커스된 카드 ID
   */
  private focusedCardId: string | null = null;
  
  /**
   * 드래그 중인 카드 ID
   */
  private draggingCardId: string | null = null;
  
  /**
   * 드롭 대상 카드 ID
   */
  private dropTargetCardId: string | null = null;
  
  /**
   * 이벤트 핸들러 맵
   */
  private eventHandlers: Map<string, CardInteractionHandlers> = new Map();

  /**
   * 카드 요소 맵
   * 카드 ID를 키로 하여 해당 카드의 HTML 요소를 저장합니다.
   */
  private cardElements: Map<string, HTMLElement> = new Map();
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param settingsManager 설정 관리자
   * @param fileService 파일 서비스
   */
  constructor(
    private readonly app: App, 
    private readonly settingsManager: SettingsManager, 
    private readonly fileService: IFileService
  ) {}
  
  /**
   * 서비스 초기화
   * 상호작용 서비스를 초기화합니다.
   * @param options 초기화 옵션
   */
  public initialize(options?: any): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug('카드 상호작용 서비스 초기화');
      
      // 상태 초기화
      this.selectedCardIds.clear();
      this.focusedCardId = null;
      this.draggingCardId = null;
      this.dropTargetCardId = null;
      
      // 이벤트 핸들러 맵 초기화
      this.eventHandlers.clear();
      
      // 카드 요소 맵 초기화
      this.cardElements.clear();
      
      // 추가 초기화 로직이 필요한 경우 여기에 구현
      
    }, ErrorCode.SERVICE_INITIALIZATION_ERROR, { service: 'CardInteractionService' });
  }
  
  /**
   * 서비스 정리
   * 이벤트 리스너 등을 정리합니다.
   */
  public destroy(): void {
    return ErrorHandler.captureErrorSync(() => {
      // 이벤트 리스너 정리
      this.eventHandlers.clear();
      this.cardElements.clear();
      this.selectedCardIds.clear();
      this.focusedCardId = null;
      this.draggingCardId = null;
      this.dropTargetCardId = null;
      
      Log.debug('카드 상호작용 서비스 정리 완료');
    }, ErrorCode.CARD_INTERACTION_ERROR);
  }
  
  /**
   * 카드 상호작용 설정
   * @param card 카드 객체
   * @param cardElement 카드 요소
   * @param handlers 이벤트 핸들러
   */
  public setupCardInteractions(
    card: Card,
    cardElement: HTMLElement,
    handlers?: Partial<CardInteractionHandlers>
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 상호작용 설정: ${card.id}`);
      
      // 카드 요소 저장
      this.cardElements.set(card.id, cardElement);
      
      // 이벤트 핸들러 저장
      if (handlers) {
        this.eventHandlers.set(card.id, handlers as CardInteractionHandlers);
      }
      
      // 드래그 앤 드롭 설정
      this.setupDragAndDrop(card, cardElement);
      
      // 호버 효과 설정
      this.setupHoverEffects(card, cardElement);
      
      // 키보드 상호작용 설정
      this.setupKeyboardInteractions(card, cardElement);
      
      // 클릭 이벤트 설정
      cardElement.addEventListener('click', (event: MouseEvent) => {
        this.handleCardClick(card, event);
      });
      
      // 컨텍스트 메뉴 이벤트 설정
      cardElement.addEventListener('contextmenu', (event: MouseEvent) => {
        this.handleCardContextMenu(card, event);
      });
      
      // 더블 클릭 이벤트 설정
      cardElement.addEventListener('dblclick', (event: MouseEvent) => {
        this.handleCardDoubleClick(card, event);
      });
    }, ErrorCode.CARD_INTERACTION_SETUP_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 상호작용 제거
   * @param card 카드 객체
   * @param cardElement 카드 요소
   */
  public removeCardInteractions(
    card: Card,
    cardElement: HTMLElement
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 상호작용 제거: ${card.id}`);
      
      // 이벤트 리스너 제거 (클론 생성 후 교체)
      const newElement = cardElement.cloneNode(true) as HTMLElement;
      if (cardElement.parentNode) {
        cardElement.parentNode.replaceChild(newElement, cardElement);
      }
      
      // 이벤트 핸들러 제거
      this.eventHandlers.delete(card.id);
      
      // 카드 요소 제거
      this.cardElements.delete(card.id);
      
      // 선택된 카드에서 제거
      this.selectedCardIds.delete(card.id);
      
      // 포커스된 카드에서 제거
      if (this.focusedCardId === card.id) {
        this.focusedCardId = null;
      }
      
      // 드래그 중인 카드에서 제거
      if (this.draggingCardId === card.id) {
        this.draggingCardId = null;
      }
      
      // 드롭 대상 카드에서 제거
      if (this.dropTargetCardId === card.id) {
        this.dropTargetCardId = null;
      }
    }, ErrorCode.CARD_INTERACTION_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 클릭 처리
   * 카드 클릭 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 마우스 이벤트
   */
  public handleCardClick(card: Card, event: MouseEvent): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 클릭: ${card.id}`);
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onClick) {
        handlers.onClick(event, card);
        return;
      }
      
      // 전역 핸들러 호출
      const globalHandlers = this.eventHandlers.get('global');
      if (globalHandlers && globalHandlers.onClick) {
        globalHandlers.onClick(event, card);
        return;
      }
      
      // 기본 동작: 파일 열기
      if (card.file) {
        // 파일 열기
        const file = this.fileService.getFile(card.file.path);
        if (!file) {
          Log.warn(`파일을 찾을 수 없습니다: ${card.file.path}`);
          return;
        }
        
        // 파일 열기
        this.openCardFile(card);
      }
      
      // 이벤트 발생
      this.emitCardEvent(CardEventType.CLICK, card, event);
    }, ErrorCode.CARD_CLICK_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 더블 클릭 처리
   * 카드 더블 클릭 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 마우스 이벤트
   */
  public handleCardDoubleClick(
    card: Card,
    event: MouseEvent
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 더블 클릭: ${card.id}`);
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onDoubleClick) {
        handlers.onDoubleClick(event, card);
      }
      
      // 전역 핸들러 호출
      const globalHandlers = this.eventHandlers.get('global');
      if (globalHandlers && globalHandlers.onDoubleClick) {
        globalHandlers.onDoubleClick(event, card);
      }
      
      // 이벤트 발생
      this.emitCardEvent(CardEventType.DOUBLE_CLICK, card, event);
      
      // 기본 동작: 파일 편집 모드로 열기
      this.editFile(card);
    }, ErrorCode.CARD_DOUBLE_CLICK_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 컨텍스트 메뉴 처리
   * 카드 우클릭 이벤트를 처리하고 컨텍스트 메뉴를 표시합니다.
   * @param card 카드 객체
   * @param event 마우스 이벤트
   */
  public handleCardContextMenu(
    card: Card,
    event: MouseEvent
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 컨텍스트 메뉴: ${card.id}`);
      
      // 기본 동작 방지
      event.preventDefault();
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onContextMenu) {
        handlers.onContextMenu(event, card);
      }
      
      // 전역 핸들러 호출
      const globalHandlers = this.eventHandlers.get('global');
      if (globalHandlers && globalHandlers.onContextMenu) {
        globalHandlers.onContextMenu(event, card);
      }
      
      // 이벤트 발생
      this.emitCardEvent(CardEventType.CONTEXT_MENU, card, event);
      
      // 컨텍스트 메뉴 표시
      this.showContextMenu(card, event);
    }, ErrorCode.CARD_CONTEXT_MENU_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 컨텍스트 메뉴 표시
   * @param card 카드 객체
   * @param event 마우스 이벤트
   */
  private showContextMenu(card: Card, event: MouseEvent): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 컨텍스트 메뉴 표시: ${card.id}`);
      
      // 메뉴 생성
      const menu = new Menu();
      
      // 파일 열기 옵션
      menu.addItem((item) => {
        item.setTitle('파일 열기')
          .setIcon('file')
          .onClick(() => this.openCardFile(card));
      });
      
      // 새 탭에서 열기 옵션
      menu.addItem((item) => {
        item.setTitle('새 탭에서 열기')
          .setIcon('file-plus')
          .onClick(() => this.openCardFile(card, true));
      });
      
      // 편집 모드로 열기 옵션
      menu.addItem((item) => {
        item.setTitle('편집 모드로 열기')
          .setIcon('edit')
          .onClick(() => this.editFile(card));
      });
      
      // 링크 복사 옵션
      menu.addItem((item) => {
        item.setTitle('링크 복사')
          .setIcon('link')
          .onClick(() => this.copyCardLink(card));
      });
      
      // 구분선
      menu.addSeparator();
      
      // 삭제 옵션
      menu.addItem((item) => {
        item.setTitle('삭제')
          .setIcon('trash')
          .onClick(() => this.deleteSelectedCards());
      });
      
      // 메뉴 표시
      menu.showAtMouseEvent(event);
    }, ErrorCode.CARD_CONTEXT_MENU_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 드래그 앤 드롭 설정
   * @param card 카드 객체
   * @param cardElement 카드 요소
   */
  public setupDragAndDrop(card: Card, cardElement: HTMLElement): void {
    return ErrorHandler.captureErrorSync(() => {
      // 드래그 가능 설정
      cardElement.setAttribute('draggable', 'true');
      
      // 드래그 시작 이벤트
      cardElement.addEventListener('dragstart', (event: DragEvent) => {
        this.handleCardDragStart(card, event);
      });
      
      // 드래그 종료 이벤트
      cardElement.addEventListener('dragend', (event: DragEvent) => {
        this.handleCardDragEnd(card, event);
      });
      
      // 드래그 오버 이벤트
      cardElement.addEventListener('dragover', (event: DragEvent) => {
        this.handleCardDragOver(card, event);
      });
      
      // 드롭 이벤트
      cardElement.addEventListener('drop', (event: DragEvent) => {
        this.handleCardDrop(card, event);
      });
    }, ErrorCode.CARD_DRAG_START_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 호버 효과 설정
   * @param card 카드 객체
   * @param cardElement 카드 요소
   */
  public setupHoverEffects(card: Card, cardElement: HTMLElement): void {
    return ErrorHandler.captureErrorSync(() => {
      // 마우스 오버 이벤트
      cardElement.addEventListener('mouseenter', (event: MouseEvent) => {
        this.handleCardHover(card, event);
      });
      
      // 마우스 아웃 이벤트
      cardElement.addEventListener('mouseleave', (event: MouseEvent) => {
        this.handleCardLeave(card, event);
      });
    }, ErrorCode.SETUP_HOVER_EFFECTS_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 호버 처리
   * 카드 마우스 오버 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 마우스 이벤트
   */
  public handleCardHover(
    card: Card,
    event: MouseEvent
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 호버: ${card.id}`);
      
      // 드래그 중인 경우 무시
      if (this.draggingCardId) {
        return;
      }
      
      // 카드 상태 설정
      this.setCardState(card, CardStateEnum.HOVER);
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onHover) {
        handlers.onHover(event, card);
      }
      
      // 전역 핸들러 호출
      const globalHandlers = this.eventHandlers.get('global');
      if (globalHandlers && globalHandlers.onHover) {
        globalHandlers.onHover(event, card);
      }
      
      // 이벤트 발생
      this.emitCardEvent(CardEventType.HOVER, card, event);
    }, ErrorCode.CARD_HOVER_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 호버 종료 처리
   * 카드 마우스 아웃 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 마우스 이벤트
   */
  public handleCardLeave(
    card: Card,
    event: MouseEvent
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 호버 종료: ${card.id}`);
      
      // 드래그 중인 경우 무시
      if (this.draggingCardId) {
        return;
      }
      
      // 카드 상태 초기화
      this.resetCardState(card);
      
      // 선택된 상태 복원
      if (this.isCardSelected(card.id)) {
        this.setCardState(card, CardStateEnum.SELECTED);
      }
      
      // 포커스 상태 복원
      if (this.focusedCardId === card.id) {
        this.setCardState(card, CardStateEnum.FOCUSED);
      }
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onLeave) {
        handlers.onLeave(event, card);
      }
      
      // 전역 핸들러 호출
      const globalHandlers = this.eventHandlers.get('global');
      if (globalHandlers && globalHandlers.onLeave) {
        globalHandlers.onLeave(event, card);
      }
      
      // 이벤트 발생
      this.emitCardEvent(CardEventType.LEAVE, card, event);
    }, ErrorCode.CARD_LEAVE_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드의 키보드 상호작용 설정
   * @param card 카드 객체
   * @param cardElement 카드 요소
   */
  public setupKeyboardInteractions(card: Card, cardElement: HTMLElement): void {
    return ErrorHandler.captureErrorSync(() => {
      // 키보드 이벤트
      cardElement.addEventListener('keydown', (event: KeyboardEvent) => {
        this.handleCardKeyDown(card, event);
      });
      
      // 포커스 이벤트
      cardElement.addEventListener('focus', () => {
        this.handleCardFocus(card);
      });
      
      // 블러 이벤트
      cardElement.addEventListener('blur', () => {
        this.handleCardBlur(card);
      });
      
      // 탭 인덱스 설정
      cardElement.setAttribute('tabindex', '0');
    }, ErrorCode.SETUP_KEYBOARD_INTERACTIONS_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 키보드 이벤트 처리
   * @param card 카드 객체
   * @param event 키보드 이벤트
   */
  public handleCardKeyDown(card: Card, event: KeyboardEvent): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 키 다운: ${card.id}, 키: ${event.key}`);
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onKeyDown) {
        handlers.onKeyDown(event, card);
      }
      
      // 전역 핸들러 호출
      const globalHandlers = this.eventHandlers.get('global');
      if (globalHandlers && globalHandlers.onKeyDown) {
        globalHandlers.onKeyDown(event, card);
      }
      
      // 이벤트 발생
      this.emitCardEvent(CardEventType.KEY_DOWN, card, event);
      
      // 기본 키보드 단축키 처리
      switch (event.key) {
        case 'Enter':
          // Enter 키: 파일 열기
          this.openCardFile(card);
          break;
        case 'Delete':
          // Delete 키: 선택된 카드 삭제
          if (this.isCardSelected(card.id)) {
            this.deleteSelectedCards();
          }
          break;
        case 'e':
        case 'E':
          // E 키: 편집 모드로 열기
          if (!event.ctrlKey && !event.metaKey) {
            this.editFile(card);
          }
          break;
        case 'c':
        case 'C':
          // C 키: 링크 복사
          if (!event.ctrlKey && !event.metaKey) {
            this.copyCardLink(card);
          }
          break;
      }
    }, ErrorCode.CARD_KEY_DOWN_ERROR, { cardId: card.id, key: event.key });
  }
  
  /**
   * 카드 포커스 처리
   * 카드 포커스 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 포커스 이벤트 (선택 사항)
   */
  public handleCardFocus(card: Card, event?: FocusEvent): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 포커스: ${card.id}`);
      
      // 카드 요소 가져오기
      const cardElement = this.cardElements.get(card.id);
      if (!cardElement) {
        return;
      }
      
      // 포커스 상태 설정
      this.setCardState(card, CardStateEnum.FOCUSED);
      
      // 이전에 포커스된 카드가 있으면 상태 초기화
      if (this.focusedCardId && this.focusedCardId !== card.id) {
        const prevFocusedCard = new Card({ 
          id: this.focusedCardId,
          path: '',
          filename: '',
          tags: [],
          creationDate: Date.now(),
          modificationDate: Date.now(),
          content: '',
          fileSize: 0
        });
        this.resetCardState(prevFocusedCard);
      }
      
      // 현재 카드 포커스 설정
      this.focusedCardId = card.id;
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onFocus) {
        handlers.onFocus(card);
      }
      
      // 이벤트 발생
      if (event) {
        this.emitCardEvent(CardEventType.FOCUS, card, event);
      } else {
        // 이벤트가 없는 경우 가상 이벤트 생성
        const fakeEvent = new FocusEvent('focus', { bubbles: true });
        this.emitCardEvent(CardEventType.FOCUS, card, fakeEvent);
      }
    }, ErrorCode.CARD_FOCUS_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 블러 처리
   * 카드 블러 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 블러 이벤트 (선택 사항)
   */
  public handleCardBlur(card: Card, event?: FocusEvent): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 블러: ${card.id}`);
      
      // 카드 요소 가져오기
      const cardElement = this.cardElements.get(card.id);
      if (!cardElement) {
        return;
      }
      
      // 포커스된 카드가 현재 카드인 경우에만 처리
      if (this.focusedCardId === card.id) {
        // 포커스 상태 초기화
        this.resetCardState(card);
        
        // 포커스된 카드 ID 초기화
        this.focusedCardId = null;
        
        // 이벤트 핸들러 호출
        const handlers = this.eventHandlers.get(card.id);
        if (handlers && handlers.onBlur) {
          handlers.onBlur(card);
        }
        
        // 이벤트 발생
        if (event) {
          this.emitCardEvent(CardEventType.BLUR, card, event);
        } else {
          // 이벤트가 없는 경우 가상 이벤트 생성
          const fakeEvent = new FocusEvent('blur', { bubbles: true });
          this.emitCardEvent(CardEventType.BLUR, card, fakeEvent);
        }
      }
    }, ErrorCode.CARD_BLUR_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 선택
   * @param card 카드 객체
   */
  public selectCard(card: Card): void {
    return ErrorHandler.captureErrorSync(() => {
      // 이미 선택된 카드면 무시
      if (this.selectedCardIds.has(card.id)) {
        return;
      }
      
      // 카드 선택 상태 설정
      this.setCardState(card, CardStateEnum.SELECTED);
      
      // 선택된 카드 ID 추가
      this.selectedCardIds.add(card.id);
      
      Log.debug(`카드 선택: ${card.id}`);
    }, ErrorCode.CARD_SELECTION_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 선택 토글
   * @param card 카드 객체
   */
  private toggleCardSelection(card: Card): void {
    return ErrorHandler.captureErrorSync(() => {
      if (this.selectedCardIds.has(card.id)) {
        // 이미 선택된 카드면 선택 해제
        this.selectedCardIds.delete(card.id);
        this.resetCardState(card);
        Log.debug(`카드 선택 해제: ${card.id}`);
      } else {
        // 선택되지 않은 카드면 선택
        this.selectedCardIds.add(card.id);
        this.setCardState(card, CardStateEnum.SELECTED);
        Log.debug(`카드 선택: ${card.id}`);
      }
    }, ErrorCode.CARD_SELECTION_ERROR, { cardId: card.id });
  }
  
  /**
   * 모든 카드 선택 해제
   */
  public clearCardSelection(): void {
    return ErrorHandler.captureErrorSync(() => {
      // 선택된 모든 카드 ID에 대해 상태 초기화
      this.selectedCardIds.forEach(cardId => {
        const card = this.getCardModelById(cardId);
        if (card) {
          this.resetCardState(card);
        }
      });
      
      // 선택된 카드 ID 집합 초기화
      this.selectedCardIds.clear();
    }, ErrorCode.CARD_SELECTION_ERROR);
  }
  
  /**
   * 카드 상태 설정
   * @param card 카드 객체
   * @param state 카드 상태
   */
  private setCardState(card: Card, state: CardStateEnum): void {
    return ErrorHandler.captureErrorSync(() => {
      // 카드 요소 가져오기
      const cardElement = this.cardElements.get(card.id);
      if (!cardElement) {
        return;
      }
      
      // 기존 상태 초기화
      this.resetCardState(card);
      
      // 새 상태 클래스 추가
      cardElement.classList.remove(CARD_STATE_CLASSES.NORMAL);
      
      // 상태에 따른 클래스 추가
      switch (state) {
        case CardStateEnum.SELECTED:
          cardElement.classList.add(CARD_STATE_CLASSES.SELECTED);
          break;
        case CardStateEnum.FOCUSED:
          cardElement.classList.add(CARD_STATE_CLASSES.FOCUSED);
          break;
        case CardStateEnum.DRAGGING:
          cardElement.classList.add(CARD_STATE_CLASSES.DRAGGING);
          break;
        case CardStateEnum.DROPPING:
          cardElement.classList.add(CARD_STATE_CLASSES.DROPPING);
          break;
        case CardStateEnum.HOVER:
          cardElement.classList.add(CARD_STATE_CLASSES.HOVER);
          break;
        default:
          cardElement.classList.add(CARD_STATE_CLASSES.NORMAL);
          break;
      }
    }, ErrorCode.CARD_STATE_UPDATE_ERROR, { cardId: card.id, state: state.toString() });
  }
  
  /**
   * 카드 상태 초기화
   * @param card 카드 객체
   * @param stateToReset 초기화할 특정 상태 (선택 사항)
   */
  private resetCardState(card: Card, stateToReset?: CardStateEnum): void {
    return ErrorHandler.captureErrorSync(() => {
      // 카드 요소 가져오기
      const cardElement = this.cardElements.get(card.id);
      if (!cardElement) {
        return;
      }
      
      // 모든 상태 클래스 제거
      cardElement.classList.remove(
        CARD_STATE_CLASSES.SELECTED,
        CARD_STATE_CLASSES.FOCUSED,
        CARD_STATE_CLASSES.DRAGGING,
        CARD_STATE_CLASSES.DROPPING,
        CARD_STATE_CLASSES.HOVER
      );
      
      // 기본 상태 클래스 추가
      cardElement.classList.add(CARD_STATE_CLASSES.NORMAL);
    }, ErrorCode.CARD_STATE_RESET_ERROR, { 
      cardId: card.id, 
      stateToReset: stateToReset ? stateToReset.toString() : '' 
    });
  }
  
  /**
   * 카드 선택 여부 확인
   * @param cardId 카드 ID
   * @returns 선택 여부
   */
  public isCardSelected(cardId: string): boolean {
    const result = ErrorHandler.captureErrorSync(() => {
      return this.selectedCardIds.has(cardId);
    }, ErrorCode.CARD_INTERACTION_ERROR, { cardId });
    
    return result === undefined ? false : result;
  }
  
  /**
   * 카드 파일을 엽니다
   * @param card 카드 객체
   * @param newTab 새 탭에서 열기 여부
   */
  public openCardFile(card: Card, newTab: boolean = false): void {
    return ErrorHandler.captureErrorSync(() => {
      if (!card.file) {
        Log.error('카드에 연결된 파일이 없습니다.');
        return;
      }
      
      // 파일 열기
      const file = card.file;
      
      // 새 탭 또는 현재 탭에서 열기
      const leaf = newTab 
        ? this.app.workspace.getLeaf('tab') 
        : this.app.workspace.getLeaf();
      
      leaf.openFile(file).then(() => {
        Log.debug(`파일이 열렸습니다: ${card.file?.path}`);
      });
    }, ErrorCode.CARD_INTERACTION_ERROR, { 
      cardId: card.id, 
      filePath: card.file?.path || '', 
      newTab: newTab ? 'true' : 'false' 
    });
  }
  
  /**
   * 카드 파일을 편집 모드로 엽니다
   * @param card 카드 객체
   */
  public editFile(card: Card): void {
    return ErrorHandler.captureErrorSync(() => {
      if (!card.file) {
        Log.error('카드에 연결된 파일이 없습니다.');
        return;
      }
      
      // 파일 열기
      const file = card.file;
      const leaf = this.app.workspace.getLeaf();
      
      leaf.openFile(file).then(() => {
        // 현재 뷰 가져오기
        const view = leaf.view;
        
        // 소스 모드로 전환 (마크다운 편집기)
        if (view && 'getMode' in view) {
          const currentMode = (view as any).getMode();
          if (currentMode !== 'source') {
            (view as any).setMode('source');
          }
        }
        
        Log.debug(`파일이 편집 모드로 열렸습니다: ${card.file?.path}`);
      });
    }, ErrorCode.CARD_INTERACTION_ERROR, { cardId: card.id, filePath: card.file?.path || '' });
  }
  
  /**
   * 선택된 카드 삭제
   */
  public async deleteSelectedCards(): Promise<void> {
    try {
      const selectedCards = Array.from(this.selectedCardIds)
        .map(id => this.getCardModelById(id))
        .filter(card => card !== null) as Card[];
      
      if (selectedCards.length === 0) {
        return;
      }
      
      const confirmModal = new ConfirmModal(
        this.app,
        '카드 삭제',
        `선택한 ${selectedCards.length}개의 카드를 삭제하시겠습니까?`,
        '삭제',
        '취소'
      );
      
      const confirmed = await confirmModal.open();
      
      if (confirmed) {
        const deleteCards = () => {
          selectedCards.forEach(card => {
            if (card.file) {
              try {
                this.deleteCard(card);
              } catch (error) {
                ErrorHandler.handleError(
                  `카드 삭제 중 오류가 발생했습니다: ${card.getTitle()}`,
                  error
                );
              }
            }
          });
          
          // 선택 상태 초기화
          this.clearCardSelection();
        };
        
        deleteCards();
      }
    } catch (error) {
      ErrorHandler.handleError('선택된 카드 삭제 중 오류가 발생했습니다.', error);
    }
  }
  
  /**
   * 카드 링크 복사
   * @param card 카드 객체
   */
  public copyCardLink(card: Card): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 링크 복사: ${card.id}`);
      
      // 카드 파일 확인
      if (!card.file) {
        Log.warn(`카드 파일 정보가 없습니다: ${card.id}`);
        return;
      }
      
      // 링크 생성
      const linkText = `[[${card.file.path}]]`;
      
      // 클립보드에 복사
      navigator.clipboard.writeText(linkText).then(() => {
        Log.debug(`링크가 클립보드에 복사되었습니다: ${linkText}`);
        new Notice('링크가 클립보드에 복사되었습니다.');
      }).catch(error => {
        Log.error('클립보드 복사 실패', error);
        new Notice('링크 복사에 실패했습니다.');
      });
    }, ErrorCode.CARD_CLICK_ERROR, { cardId: card.id, filePath: card.file?.path || '' });
  }
  
  /**
   * 카드 간 링크 생성
   * @param sourceCard 소스 카드 객체
   * @param targetCard 대상 카드 객체
   */
  public createLinkBetweenCards(sourceCard: Card, targetCard: Card): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 간 링크 생성: ${sourceCard.id} -> ${targetCard.id}`);
      
      // 소스 카드와 대상 카드의 파일 확인
      if (!sourceCard.file || !targetCard.file) {
        Log.warn('카드 파일 정보가 없습니다.');
        return;
      }
      
      // 소스 파일에 대상 파일 링크 추가
      const app = this.app;
      const sourceFilePath = sourceCard.file.path;
      const targetFilePath = targetCard.file.path;
      
      // 파일 내용 가져오기
      const sourceFile = app.vault.getAbstractFileByPath(sourceFilePath);
      if (!(sourceFile instanceof TFile)) {
        Log.warn(`소스 파일을 찾을 수 없습니다: ${sourceFilePath}`);
        return;
      }
      
      // 파일 내용 읽기
      app.vault.read(sourceFile).then((content) => {
        // 링크 생성
        const linkText = `[[${targetFilePath}]]`;
        
        // 파일 끝에 링크 추가
        const newContent = content + '\n' + linkText;
        
        // 파일 저장
        app.vault.modify(sourceFile, newContent).then(() => {
          Log.debug(`링크가 추가되었습니다: ${sourceFilePath} -> ${targetFilePath}`);
          
          // 성공 알림 표시
          new Notice(`링크가 추가되었습니다: ${sourceFile.basename} -> ${targetFilePath}`);
        });
      });
    }, ErrorCode.CARD_DROP_ERROR, { sourceCardId: sourceCard.id, targetCardId: targetCard.id });
  }
  
  /**
   * 카드 이벤트 발생
   * @param eventType 이벤트 타입
   * @param card 카드 객체
   * @param event 원본 이벤트
   */
  private emitCardEvent(
    eventType: CardEventType,
    card: Card,
    event: Event
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
      if (!cardElement) return;
      
      // CardEventData 인터페이스에 맞게 이벤트 데이터 생성
      const customEvent = new CustomEvent<CardEventData>(CARD_EVENT_NAME, {
        bubbles: true,
        detail: {
          type: eventType,
          card,
          originalEvent: event,
          timestamp: Date.now()
        }
      });
      
      // 이벤트 발생 및 로깅
      cardElement.dispatchEvent(customEvent);
      Log.debug(`카드 이벤트 발생: ${eventType}, 카드 ID: ${card.id}`);
    }, ErrorCode.CARD_INTERACTION_ERROR, { cardId: card.id, eventType });
  }
  
  /**
   * 카드 상태 가져오기
   * @param cardId 카드 ID
   * @returns 카드 상태
   */
  private getCardState(cardId: string): CardStateEnum {
    const result = ErrorHandler.captureErrorSync(() => {
      if (this.draggingCardId === cardId) return CardStateEnum.DRAGGING;
      if (this.dropTargetCardId === cardId) return CardStateEnum.DROPPING;
      if (this.focusedCardId === cardId) return CardStateEnum.FOCUSED;
      if (this.isCardSelected(cardId)) return CardStateEnum.SELECTED;
      return CardStateEnum.NORMAL;
    }, ErrorCode.CARD_INTERACTION_ERROR, { cardId });
    
    return result === undefined ? CardStateEnum.NORMAL : result;
  }
  
  /**
   * 카드 ID로 카드 요소 가져오기
   * @param cardId 카드 ID
   * @returns 카드 요소 또는 null
   */
  public getCardById(cardId: string): HTMLElement | null {
    return ErrorHandler.captureErrorSync(() => {
      return this.cardElements.get(cardId) || null;
    }, ErrorCode.CARD_INTERACTION_ERROR, { cardId }) || null;
  }
  
  /**
   * 카드 ID로 카드 객체 가져오기
   * @param cardId 카드 ID
   * @returns 카드 객체 또는 null
   */
  private getCardModelById(cardId: string): Card | null {
    return ErrorHandler.captureErrorSync(() => {
      // 임시 카드 객체 생성 (실제 구현에서는 카드 서비스나 캐시에서 가져와야 함)
      return new Card({
        id: cardId,
        path: '',
        filename: cardId, // 임시로 ID를 파일명으로 사용
        tags: [],
        creationDate: Date.now(),
        modificationDate: Date.now(),
        content: '',
        fileSize: 0,
        firstHeader: cardId // 임시로 ID를 첫 번째 헤더로 사용
      });
    }, ErrorCode.CARD_INTERACTION_ERROR, { cardId }) || null;
  }
  
  /**
   * 카드 드래그 시작 처리
   * 카드 드래그 시작 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 드래그 이벤트
   */
  public handleCardDragStart(
    card: Card,
    event: DragEvent
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 드래그 시작: ${card.id}`);
      
      // 드래그 데이터 설정
      if (event.dataTransfer) {
        event.dataTransfer.setData('text/plain', card.id);
        event.dataTransfer.effectAllowed = 'link';
        
        // 드래그 이미지 설정 (선택 사항)
        const cardElement = this.cardElements.get(card.id);
        if (cardElement) {
          // 작은 미리보기 이미지 생성
          const dragImage = cardElement.cloneNode(true) as HTMLElement;
          dragImage.style.width = '200px';
          dragImage.style.height = 'auto';
          dragImage.style.opacity = '0.7';
          document.body.appendChild(dragImage);
          
          // 드래그 이미지 설정 및 오프셋 조정
          event.dataTransfer.setDragImage(dragImage, 100, 20);
          
          // 이미지 요소 정리 (비동기적으로)
          setTimeout(() => {
            document.body.removeChild(dragImage);
          }, 0);
        }
      }
      
      // 드래그 중인 카드 ID 설정
      this.draggingCardId = card.id;
      
      // 카드 상태 설정
      this.setCardState(card, CardStateEnum.DRAGGING);
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onDragStart) {
        handlers.onDragStart(event, card);
      }
      
      // 전역 핸들러 호출
      const globalHandlers = this.eventHandlers.get('global');
      if (globalHandlers && globalHandlers.onDragStart) {
        globalHandlers.onDragStart(event, card);
      }
      
      // 이벤트 발생
      this.emitCardEvent(CardEventType.DRAG_START, card, event);
    }, ErrorCode.CARD_DRAG_START_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 드래그 종료 처리
   * 카드 드래그 종료 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 드래그 이벤트
   */
  public handleCardDragEnd(
    card: Card,
    event: DragEvent
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 드래그 종료: ${card.id}`);
      
      // 드래그 중인 카드가 현재 카드가 아닌 경우 무시
      if (this.draggingCardId !== card.id) {
        return;
      }
      
      // 드래그 중인 카드 ID 초기화
      this.draggingCardId = null;
      
      // 카드 상태 초기화
      this.resetCardState(card);
      
      // 선택된 상태 복원
      if (this.isCardSelected(card.id)) {
        this.setCardState(card, CardStateEnum.SELECTED);
      }
      
      // 포커스 상태 복원
      if (this.focusedCardId === card.id) {
        this.setCardState(card, CardStateEnum.FOCUSED);
      }
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onDragEnd) {
        handlers.onDragEnd(event, card);
      }
      
      // 전역 핸들러 호출
      const globalHandlers = this.eventHandlers.get('global');
      if (globalHandlers && globalHandlers.onDragEnd) {
        globalHandlers.onDragEnd(event, card);
      }
      
      // 이벤트 발생
      this.emitCardEvent(CardEventType.DRAG_END, card, event);
      
      // 드롭 대상 카드 ID 초기화
      if (this.dropTargetCardId) {
        // 드롭 대상 카드 상태 초기화
        const dropTargetCard = new Card({ 
          id: this.dropTargetCardId,
          path: '',
          filename: '',
          tags: [],
          creationDate: Date.now(),
          modificationDate: Date.now(),
          content: '',
          fileSize: 0
        });
        this.resetCardState(dropTargetCard);
        
        // 드롭 대상 카드 ID 초기화
        this.dropTargetCardId = null;
      }
    }, ErrorCode.CARD_DRAG_END_ERROR, { cardId: card.id });
  }
  
  /**
   * 카드 드래그 오버 처리
   * 카드 위로 드래그 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 드래그 이벤트
   */
  public handleCardDragOver(
    card: Card,
    event: DragEvent
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      // 드래그 중이 아니거나 자기 자신 위로 드래그하는 경우 무시
      if (!this.draggingCardId || this.draggingCardId === card.id) {
        return;
      }
      
      // 기본 동작 방지 (드롭 허용)
      event.preventDefault();
      
      // 드롭 효과 설정
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'link';
      }
      
      // 이전 드롭 대상 카드 상태 초기화
      if (this.dropTargetCardId && this.dropTargetCardId !== card.id) {
        const prevDropTargetCard = new Card({ 
          id: this.dropTargetCardId,
          path: '',
          filename: '',
          tags: [],
          creationDate: Date.now(),
          modificationDate: Date.now(),
          content: '',
          fileSize: 0
        });
        this.resetCardState(prevDropTargetCard);
      }
      
      // 현재 카드를 드롭 대상으로 설정
      this.dropTargetCardId = card.id;
      
      // 드롭 대상 상태 설정
      this.setCardState(card, CardStateEnum.DROPPING);
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onDragOver) {
        handlers.onDragOver(event, card);
      }
      
      // 전역 핸들러 호출
      const globalHandlers = this.eventHandlers.get('global');
      if (globalHandlers && globalHandlers.onDragOver) {
        globalHandlers.onDragOver(event, card);
      }
      
      // 이벤트 발생
      this.emitCardEvent(CardEventType.DRAG_OVER, card, event);
    }, ErrorCode.CARD_DRAG_OVER_ERROR, { cardId: card.id, draggingCardId: this.draggingCardId || '' });
  }
  
  /**
   * 카드 드롭 처리
   * 카드에 드롭 이벤트를 처리합니다.
   * @param card 카드 객체
   * @param event 드래그 이벤트
   */
  public handleCardDrop(
    card: Card,
    event: DragEvent
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 드롭: ${card.id}`);
      
      // 기본 동작 방지
      event.preventDefault();
      
      // 드래그 중인 카드 ID 가져오기
      if (!event.dataTransfer) {
        return;
      }
      
      const sourceCardId = event.dataTransfer.getData('text/plain');
      if (!sourceCardId || sourceCardId === card.id) {
        return;
      }
      
      // 드롭 대상 카드 상태 초기화
      this.resetCardState(card);
      this.dropTargetCardId = null;
      
      // 소스 카드 객체 생성
      const sourceCard = new Card({ 
        id: sourceCardId,
        path: '',
        filename: '',
        tags: [],
        creationDate: Date.now(),
        modificationDate: Date.now(),
        content: '',
        fileSize: 0
      });
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onDrop) {
        handlers.onDrop(event, card);
      }
      
      // 전역 핸들러 호출
      const globalHandlers = this.eventHandlers.get('global');
      if (globalHandlers && globalHandlers.onDrop) {
        globalHandlers.onDrop(event, card);
      }
      
      // 이벤트 발생
      this.emitCardEvent(CardEventType.DROP, card, event);
      
      // 기본 동작: 카드 간 링크 생성
      this.createLinkBetweenCards(sourceCard, card);
    }, ErrorCode.CARD_DROP_ERROR, { cardId: card.id });
  }
  
  /**
   * 이벤트 리스너 등록
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  public addEventListener(eventType: CardEventType, handler: EventHandler<CardEventData>): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 이벤트 리스너 등록: ${eventType}`);
      
      // 이벤트 리스너 등록 로직
      document.addEventListener(CARD_EVENT_NAME, ((event: CustomEvent<CardEventData>) => {
        if (event.detail.type === eventType) {
          handler(event.detail);
        }
      }) as EventListener);
    }, ErrorCode.CARD_INTERACTION_ERROR, { eventType });
  }
  
  /**
   * 이벤트 리스너 제거
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  public removeEventListener(eventType: CardEventType, handler: EventHandler<CardEventData>): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 이벤트 리스너 제거: ${eventType}`);
      
      // 이벤트 리스너 제거 로직
      document.removeEventListener(CARD_EVENT_NAME, ((event: CustomEvent<CardEventData>) => {
        if (event.detail.type === eventType) {
          handler(event.detail);
        }
      }) as EventListener);
    }, ErrorCode.CARD_INTERACTION_ERROR, { eventType });
  }
  
  /**
   * 이벤트 핸들러 등록
   * 모든 카드 이벤트에 대한 핸들러를 등록합니다.
   * @param handlers 이벤트 핸들러 객체
   */
  public registerHandlers(handlers: Partial<CardInteractionHandlers>): void {
    ErrorHandler.captureErrorSync(() => {
      // 전역 이벤트 핸들러 등록
      if (handlers) {
        // 기존 핸들러와 병합
        this.eventHandlers.set('global', {
          ...this.eventHandlers.get('global'),
          ...handlers
        });
      }
      
      Log.debug('전역 이벤트 핸들러가 등록되었습니다.');
    }, ErrorCode.CARD_INTERACTION_ERROR);
  }

  /**
   * 카드 삭제
   * @param card 카드 객체
   * @returns 삭제 성공 여부
   */
  public async deleteCard(card: Card): Promise<boolean> {
    const result = await ErrorHandler.captureError(async () => {
      // 삭제 확인 모달 표시
      const confirmModal = new ConfirmModal(
        this.app,
        '카드 삭제',
        `"${card.getTitle()}" 카드를 삭제하시겠습니까?`,
        '삭제',
        '취소'
      );
      
      const confirmed = await confirmModal.open();
      
      if (confirmed) {
        if (card.file) {
          try {
            await this.fileService.deleteFile(card.file);
            return true;
          } catch (error) {
            Log.error(`카드 파일 삭제 실패: ${card.file.path}`, error);
            return false;
          }
        }
      }
      
      return false;
    }, ErrorCode.CARD_DELETION_ERROR, { cardId: card.id, action: 'delete' });
    
    // undefined인 경우 false 반환
    return result === true;
  }
}