import { App, Menu, TFile, WorkspaceLeaf } from 'obsidian';
import { Card } from '../../core/models/Card';
import { CardState, CardEventType, CardEventData } from '../../core/types/card.types';
import { SettingsManager } from '../../managers/settings/SettingsManager';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { toggleClass } from '../../utils/helpers/dom.helper';
import { ICardInteractionService, CardInteractionHandlers } from '../../core/interfaces/ICardInteractionService';

/**
 * 카드 상호작용 서비스 클래스
 * 카드와의 상호작용을 담당합니다.
 */
export class CardInteractionService implements ICardInteractionService {
  /**
   * 앱 인스턴스
   */
  private app: App;
  
  /**
   * 설정 관리자
   */
  private settingsManager: SettingsManager;
  
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
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param settingsManager 설정 관리자
   */
  constructor(app: App, settingsManager: SettingsManager) {
    this.app = app;
    this.settingsManager = settingsManager;
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
    handlers?: CardInteractionHandlers
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 상호작용 설정: ${card.id}`);
      
      // 이벤트 핸들러 저장
      if (handlers) {
        this.eventHandlers.set(card.id, handlers);
      }
      
      // 드래그 앤 드롭 설정
      this.setupDragAndDrop(card, cardElement);
      
      // 호버 효과 설정
      this.setupHoverEffects(card, cardElement);
      
      // 키보드 상호작용 설정
      this.setupKeyboardInteractions(card, cardElement);
      
      // 클릭 이벤트 설정
      cardElement.addEventListener('click', (event: MouseEvent) => {
        this.handleCardClick(card, cardElement, event);
      });
      
      // 컨텍스트 메뉴 이벤트 설정
      cardElement.addEventListener('contextmenu', (event: MouseEvent) => {
        this.handleCardContextMenu(card, cardElement, event);
      });
      
      // 더블 클릭 이벤트 설정
      cardElement.addEventListener('dblclick', (event: MouseEvent) => {
        this.handleCardDoubleClick(card, cardElement, event);
      });
    }, 'CARD_INTERACTION_SETUP_ERROR', { cardId: card.id });
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
    }, 'CARD_INTERACTION_REMOVE_ERROR', { cardId: card.id });
  }
  
  /**
   * 카드 클릭 이벤트 처리
   * @param card 카드 객체
   * @param cardElement 카드 요소
   * @param event 클릭 이벤트
   */
  public handleCardClick(
    card: Card,
    cardElement: HTMLElement,
    event: MouseEvent
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 클릭: ${card.id}`);
      
      // 기본 동작 방지
      event.preventDefault();
      event.stopPropagation();
      
      // Shift 키를 누른 상태에서 클릭하면 다중 선택
      if (event.shiftKey) {
        this.toggleCardSelection(card, cardElement);
      } else {
        // 일반 클릭은 단일 선택 및 파일 열기
        this.selectCard(card, cardElement);
        this.openCardFile(card);
      }
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onClick) {
        handlers.onClick(card, event);
      }
      
      // 이벤트 발생
      this.emitCardEvent('card-click', card, event);
    }, 'CARD_CLICK_ERROR', { cardId: card.id });
  }
  
  /**
   * 카드 더블 클릭 이벤트 처리
   * @param card 카드 객체
   * @param cardElement 카드 요소
   * @param event 더블 클릭 이벤트
   */
  public handleCardDoubleClick(
    card: Card,
    cardElement: HTMLElement,
    event: MouseEvent
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 더블 클릭: ${card.id}`);
      
      // 기본 동작 방지
      event.preventDefault();
      event.stopPropagation();
      
      // 파일 편집 모드로 열기
      this.editFile(card.file);
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onDoubleClick) {
        handlers.onDoubleClick(card, event);
      }
      
      // 이벤트 발생
      this.emitCardEvent('card-doubleclick', card, event);
    }, 'CARD_DOUBLE_CLICK_ERROR', { cardId: card.id });
  }
  
  /**
   * 카드 컨텍스트 메뉴 이벤트 처리
   * @param card 카드 객체
   * @param cardElement 카드 요소
   * @param event 컨텍스트 메뉴 이벤트
   */
  public handleCardContextMenu(
    card: Card,
    cardElement: HTMLElement,
    event: MouseEvent
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 컨텍스트 메뉴: ${card.id}`);
      
      // 기본 동작 방지
      event.preventDefault();
      event.stopPropagation();
      
      // 카드가 선택되지 않았으면 선택
      if (!this.isCardSelected(card.id)) {
        this.selectCard(card, cardElement);
      }
      
      // 컨텍스트 메뉴 표시
      this.showCardContextMenu(card, event);
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onContextMenu) {
        handlers.onContextMenu(card, event);
      }
      
      // 이벤트 발생
      this.emitCardEvent('card-contextmenu', card, event);
    }, 'CARD_CONTEXT_MENU_ERROR', { cardId: card.id });
  }
  
  /**
   * 카드 컨텍스트 메뉴 표시
   * @param card 카드 객체
   * @param event 마우스 이벤트
   */
  public showCardContextMenu(card: Card, event: MouseEvent): void {
    return ErrorHandler.captureErrorSync(() => {
      const menu = new Menu();
      
      // 파일 열기
      menu.addItem((item) => {
        item
          .setTitle('파일 열기')
          .setIcon('file-text')
          .onClick(() => this.openCardFile(card));
      });
      
      // 새 탭에서 열기
      menu.addItem((item) => {
        item
          .setTitle('새 탭에서 열기')
          .setIcon('file-plus')
          .onClick(() => this.openCardFile(card, true));
      });
      
      // 파일 편집
      menu.addItem((item) => {
        item
          .setTitle('파일 편집')
          .setIcon('edit')
          .onClick(() => this.editFile(card.file));
      });
      
      menu.addSeparator();
      
      // 링크 복사
      menu.addItem((item) => {
        item
          .setTitle('링크 복사')
          .setIcon('link')
          .onClick(() => this.copyCardLink(card));
      });
      
      menu.addSeparator();
      
      // 선택 항목 삭제
      menu.addItem((item) => {
        item
          .setTitle('선택 항목 삭제')
          .setIcon('trash')
          .onClick(() => this.deleteSelectedCards());
      });
      
      // 메뉴 표시
      menu.showAtPosition({ x: event.clientX, y: event.clientY });
    }, 'SHOW_CARD_CONTEXT_MENU_ERROR', { cardId: card.id });
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
        this.handleCardDragStart(card, cardElement, event);
      });
      
      // 드래그 종료 이벤트
      cardElement.addEventListener('dragend', (event: DragEvent) => {
        this.handleCardDragEnd(card, cardElement, event);
      });
      
      // 드래그 오버 이벤트
      cardElement.addEventListener('dragover', (event: DragEvent) => {
        this.handleCardDragOver(card, cardElement, event);
      });
      
      // 드롭 이벤트
      cardElement.addEventListener('drop', (event: DragEvent) => {
        this.handleCardDrop(card, cardElement, event);
      });
    }, 'SETUP_DRAG_DROP_ERROR', { cardId: card.id });
  }
  
  /**
   * 카드 호버 효과 설정
   * @param card 카드 객체
   * @param cardElement 카드 요소
   */
  public setupHoverEffects(card: Card, cardElement: HTMLElement): void {
    return ErrorHandler.captureErrorSync(() => {
      // 마우스 오버 이벤트
      cardElement.addEventListener('mouseenter', () => {
        this.handleCardHover(card, cardElement);
      });
      
      // 마우스 아웃 이벤트
      cardElement.addEventListener('mouseleave', () => {
        this.handleCardLeave(card, cardElement);
      });
    }, 'SETUP_HOVER_EFFECTS_ERROR', { cardId: card.id });
  }
  
  /**
   * 카드 키보드 상호작용 설정
   * @param card 카드 객체
   * @param cardElement 카드 요소
   */
  public setupKeyboardInteractions(card: Card, cardElement: HTMLElement): void {
    return ErrorHandler.captureErrorSync(() => {
      // 키보드 이벤트
      cardElement.addEventListener('keydown', (event: KeyboardEvent) => {
        this.handleCardKeyDown(card, cardElement, event);
      });
      
      // 포커스 이벤트
      cardElement.addEventListener('focus', () => {
        this.handleCardFocus(card, cardElement);
      });
      
      // 블러 이벤트
      cardElement.addEventListener('blur', () => {
        this.handleCardBlur(card, cardElement);
      });
      
      // 탭 인덱스 설정
      cardElement.setAttribute('tabindex', '0');
    }, 'SETUP_KEYBOARD_INTERACTIONS_ERROR', { cardId: card.id });
  }
  
  /**
   * 카드 드래그 시작 이벤트 처리
   * @param card 카드 객체
   * @param cardElement 카드 요소
   * @param event 드래그 시작 이벤트
   */
  public handleCardDragStart(
    card: Card,
    cardElement: HTMLElement,
    event: DragEvent
  ): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug(`카드 드래그 시작: ${card.id}`);
      
      // 드래그 데이터 설정
      if (event.dataTransfer) {
        event.dataTransfer.setData('text/plain', card.id);
        event.dataTransfer.effectAllowed = 'link';
      }
      
      // 드래그 중인 카드 상태 설정
      this.setCardState(card.id, cardElement, 'dragging');
      this.draggingCardId = card.id;
      
      // 카드가 선택되지 않았으면 선택
      if (!this.isCardSelected(card.id)) {
        this.selectCard(card, cardElement);
      }
      
      // 이벤트 핸들러 호출
      const handlers = this.eventHandlers.get(card.id);
      if (handlers && handlers.onDragStart) {
        handlers.onDragStart(card, event);
      }
      
      // 이벤트 발생
      this.emitCardEvent('card-dragstart', card, event);
    }, 'CARD_DRAG_START_ERROR', { cardId: card.id });
  }
  
  /**
   * 카드 드래그 종료 이벤트 처리
   * @param card 카드 객체
   * @param cardElement 카드 요소
   * @param event 드래그 종료 이벤트
   */
  public handleCardDragEnd(
    card: Card,
    cardElement: HTMLElement,
    event: DragEvent
  ): void {
    try {
      Log.debug(`카드 드래그 종료: ${card.id}`);
      
      // 드래그 중인 카드 상태 초기화
      this.resetCardState(card.id, cardElement);
      this.draggingCardId = null;
      
      // 드롭 대상 카드 상태 초기화
      if (this.dropTargetCardId) {
        const dropTargetElement = document.querySelector(`[data-card-id="${this.dropTargetCardId}"]`);
        if (dropTargetElement instanceof HTMLElement) {
          this.resetCardState(this.dropTargetCardId, dropTargetElement);
        }
        this.dropTargetCardId = null;
      }
    } catch (error) {
      ErrorHandler.handleError(`카드 드래그 종료 처리 중 오류 발생: ${card.id}`, error);
    }
  }
  
  /**
   * 카드 드래그 오버 이벤트 처리
   * @param card 카드 객체
   * @param cardElement 카드 요소
   * @param event 드래그 오버 이벤트
   */
  public handleCardDragOver(
    card: Card,
    cardElement: HTMLElement,
    event: DragEvent
  ): void {
    try {
      // 기본 동작 방지
      event.preventDefault();
      event.stopPropagation();
      
      // 드롭 효과 설정
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'link';
      }
      
      // 드래그 중인 카드와 다른 카드일 경우에만 드롭 대상으로 설정
      if (this.draggingCardId && this.draggingCardId !== card.id) {
        // 이전 드롭 대상 카드 상태 초기화
        if (this.dropTargetCardId && this.dropTargetCardId !== card.id) {
          const prevDropTargetElement = document.querySelector(`[data-card-id="${this.dropTargetCardId}"]`);
          if (prevDropTargetElement instanceof HTMLElement) {
            this.resetCardState(this.dropTargetCardId, prevDropTargetElement);
          }
        }
        
        // 새 드롭 대상 카드 상태 설정
        this.setCardState(card.id, cardElement, 'dropping');
        this.dropTargetCardId = card.id;
      }
    } catch (error) {
      ErrorHandler.handleError(`카드 드래그 오버 처리 중 오류 발생: ${card.id}`, error);
    }
  }
  
  /**
   * 카드 드롭 이벤트 처리
   * @param card 카드 객체
   * @param cardElement 카드 요소
   * @param event 드롭 이벤트
   */
  public handleCardDrop(
    card: Card,
    cardElement: HTMLElement,
    event: DragEvent
  ): void {
    try {
      Log.debug(`카드 드롭: ${card.id}`);
      
      // 기본 동작 방지
      event.preventDefault();
      event.stopPropagation();
      
      // 드래그 데이터 가져오기
      if (event.dataTransfer) {
        const sourceCardId = event.dataTransfer.getData('text/plain');
        
        if (sourceCardId && sourceCardId !== card.id) {
          // 소스 카드와 대상 카드 간 링크 생성
          this.createLinkBetweenCards(sourceCardId, card.id);
        }
      }
      
      // 드롭 대상 카드 상태 초기화
      this.resetCardState(card.id, cardElement);
      this.dropTargetCardId = null;
    } catch (error) {
      ErrorHandler.handleError(`카드 드롭 처리 중 오류 발생: ${card.id}`, error);
    }
  }
  
  /**
   * 카드 키보드 이벤트 처리
   * @param card 카드 객체
   * @param cardElement 카드 요소
   * @param event 키보드 이벤트
   */
  public handleCardKeyDown(
    card: Card,
    cardElement: HTMLElement,
    event: KeyboardEvent
  ): void {
    try {
      // 키 코드에 따라 다른 동작 수행
      switch (event.key) {
        case 'Enter':
          // Enter 키: 파일 열기
          event.preventDefault();
          this.openCardFile(card);
          break;
          
        case ' ':
          // 스페이스 키: 카드 선택 토글
          event.preventDefault();
          this.toggleCardSelection(card, cardElement);
          break;
          
        case 'Delete':
          // Delete 키: 선택된 카드 삭제
          event.preventDefault();
          if (this.isCardSelected(card.id)) {
            this.deleteSelectedCards();
          }
          break;
          
        case 'e':
        case 'E':
          // E 키: 파일 편집
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.editFile(card.file);
          }
          break;
          
        case 'c':
        case 'C':
          // C 키: 링크 복사
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.copyCardLink(card);
          }
          break;
      }
    } catch (error) {
      ErrorHandler.handleError(`카드 키보드 이벤트 처리 중 오류 발생: ${card.id}`, error);
    }
  }
  
  /**
   * 카드 포커스 이벤트 처리
   * @param card 카드 객체
   * @param cardElement 카드 요소
   */
  public handleCardFocus(
    card: Card,
    cardElement: HTMLElement
  ): void {
    try {
      Log.debug(`카드 포커스: ${card.id}`);
      
      // 이전 포커스 카드 상태 초기화
      if (this.focusedCardId && this.focusedCardId !== card.id) {
        const prevFocusedElement = document.querySelector(`[data-card-id="${this.focusedCardId}"]`);
        if (prevFocusedElement instanceof HTMLElement) {
          this.resetCardState(this.focusedCardId, prevFocusedElement);
        }
      }
      
      // 새 포커스 카드 상태 설정
      this.setCardState(card.id, cardElement, 'focused');
      this.focusedCardId = card.id;
    } catch (error) {
      ErrorHandler.handleError(`카드 포커스 처리 중 오류 발생: ${card.id}`, error);
    }
  }
  
  /**
   * 카드 포커스 해제 이벤트 처리
   * @param card 카드 객체
   * @param cardElement 카드 요소
   */
  public handleCardBlur(
    card: Card,
    cardElement: HTMLElement
  ): void {
    try {
      Log.debug(`카드 포커스 해제: ${card.id}`);
      
      // 포커스 카드 상태 초기화
      this.resetCardState(card.id, cardElement);
      
      // 카드가 선택되어 있으면 선택 상태 유지
      if (this.isCardSelected(card.id)) {
        this.setCardState(card.id, cardElement, 'active');
      }
      
      if (this.focusedCardId === card.id) {
        this.focusedCardId = null;
      }
    } catch (error) {
      ErrorHandler.handleError(`카드 포커스 해제 처리 중 오류 발생: ${card.id}`, error);
    }
  }
  
  /**
   * 카드 선택
   * @param card 카드 객체
   * @param cardElement 카드 요소
   */
  public selectCard(card: Card, cardElement: HTMLElement): void {
    try {
      // 이전 선택 카드 모두 선택 해제
      this.clearCardSelection();
      
      // 새 카드 선택
      this.selectedCardIds.add(card.id);
      this.setCardState(card.id, cardElement, 'active');
      
      Log.debug(`카드 선택: ${card.id}`);
    } catch (error) {
      ErrorHandler.handleError(`카드 선택 중 오류 발생: ${card.id}`, error);
    }
  }
  
  /**
   * 카드 선택 토글
   * @param card 카드 객체
   * @param cardElement 카드 요소
   */
  public toggleCardSelection(card: Card, cardElement: HTMLElement): void {
    try {
      if (this.isCardSelected(card.id)) {
        // 이미 선택된 카드면 선택 해제
        this.selectedCardIds.delete(card.id);
        this.resetCardState(card.id, cardElement);
        Log.debug(`카드 선택 해제: ${card.id}`);
      } else {
        // 선택되지 않은 카드면 선택
        this.selectedCardIds.add(card.id);
        this.setCardState(card.id, cardElement, 'active');
        Log.debug(`카드 선택: ${card.id}`);
      }
    } catch (error) {
      ErrorHandler.handleError(`카드 선택 토글 중 오류 발생: ${card.id}`, error);
    }
  }
  
  /**
   * 모든 카드 선택 해제
   */
  public clearCardSelection(): void {
    try {
      // 모든 선택된 카드 요소 찾기
      this.selectedCardIds.forEach(cardId => {
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (cardElement instanceof HTMLElement) {
          this.resetCardState(cardId, cardElement);
        }
      });
      
      // 선택 목록 초기화
      this.selectedCardIds.clear();
      
      Log.debug('모든 카드 선택 해제');
    } catch (error) {
      ErrorHandler.handleError('모든 카드 선택 해제 중 오류 발생', error);
    }
  }
  
  /**
   * 카드 상태 설정
   * @param cardId 카드 ID
   * @param cardElement 카드 요소
   * @param state 카드 상태
   */
  private setCardState(cardId: string, cardElement: HTMLElement, state: CardState): void {
    // 모든 상태 클래스 제거
    cardElement.classList.remove(
      'card-navigator-card-normal',
      'card-navigator-card-active',
      'card-navigator-card-focused',
      'card-navigator-card-dragging',
      'card-navigator-card-dropping'
    );
    
    // 새 상태 클래스 추가
    cardElement.classList.add(`card-navigator-card-${state}`);
  }
  
  /**
   * 카드 상태 초기화
   * @param cardId 카드 ID
   * @param cardElement 카드 요소
   */
  private resetCardState(cardId: string, cardElement: HTMLElement): void {
    // 모든 상태 클래스 제거
    cardElement.classList.remove(
      'card-navigator-card-active',
      'card-navigator-card-focused',
      'card-navigator-card-dragging',
      'card-navigator-card-dropping'
    );
    
    // 기본 상태 클래스 추가
    cardElement.classList.add('card-navigator-card-normal');
  }
  
  /**
   * 카드 선택 여부 확인
   * @param cardId 카드 ID
   * @returns 선택 여부
   */
  public isCardSelected(cardId: string): boolean {
    return this.selectedCardIds.has(cardId);
  }
  
  /**
   * 파일 열기
   * @param file 파일 객체
   */
  private openCardFile(card: Card, newTab: boolean = false): void {
    return ErrorHandler.captureErrorSync(() => {
      if (!card.file) {
        ErrorHandler.handleWarning(`카드 파일이 없습니다: ${card.id}`);
        return;
      }
      
      Log.debug(`카드 파일 열기: ${card.file.path}, 새 탭: ${newTab}`);
      
      const leaf = newTab
        ? this.app.workspace.splitActiveLeaf()
        : this.app.workspace.getUnpinnedLeaf();
        
      leaf.openFile(card.file);
    }, 'OPEN_CARD_FILE_ERROR', { cardId: card.id, newTab: String(newTab) });
  }
  
  /**
   * 파일 편집
   * @param file 파일 객체
   */
  private editFile(file: TFile): void {
    try {
      Log.debug(`파일 편집: ${file.path}`);
      
      // 새 리프에서 파일 편집 모드로 열기
      const leaf = this.app.workspace.getLeaf('split');
      leaf.openFile(file).then(() => {
        // 편집 모드로 전환
        const view = leaf.view;
        if (view && view.getMode && view.setMode) {
          if (view.getMode() !== 'source') {
            view.setMode('source');
          }
        }
      });
    } catch (error) {
      ErrorHandler.handleError(`파일 편집 중 오류 발생: ${file.path}`, error);
    }
  }
  
  /**
   * 선택된 카드 삭제
   */
  private deleteSelectedCards(): void {
    try {
      Log.debug('선택된 카드 삭제');
      
      // 선택된 카드 ID 배열 복사
      const selectedCardIds = Array.from(this.selectedCardIds);
      
      // 각 카드에 대해 파일 삭제 확인 모달 표시
      if (selectedCardIds.length > 0) {
        const confirmMessage = selectedCardIds.length === 1
          ? '선택한 파일을 삭제하시겠습니까?'
          : `선택한 ${selectedCardIds.length}개 파일을 삭제하시겠습니까?`;
        
        if (confirm(confirmMessage)) {
          // 확인 시 파일 삭제
          selectedCardIds.forEach(cardId => {
            const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
            if (cardElement instanceof HTMLElement) {
              const filePath = cardElement.getAttribute('data-file-path');
              if (filePath) {
                const file = this.app.vault.getAbstractFileByPath(filePath);
                if (file instanceof TFile) {
                  this.app.vault.delete(file);
                }
              }
            }
          });
          
          // 선택 초기화
          this.clearCardSelection();
        }
      }
    } catch (error) {
      ErrorHandler.handleError('선택된 카드 삭제 중 오류 발생', error);
    }
  }
  
  /**
   * 카드 링크 복사
   * @param card 카드 객체
   */
  private copyCardLink(card: Card): void {
    try {
      Log.debug(`카드 링크 복사: ${card.id}`);
      
      // 마크다운 링크 생성
      const linkText = `[[${card.file.path}|${card.getTitle()}]]`;
      
      // 클립보드에 복사
      navigator.clipboard.writeText(linkText)
        .then(() => {
          // 성공 메시지 표시
          new Notification('링크가 클립보드에 복사되었습니다.');
        })
        .catch(error => {
          ErrorHandler.handleError('클립보드 복사 중 오류 발생', error);
        });
    } catch (error) {
      ErrorHandler.handleError(`카드 링크 복사 중 오류 발생: ${card.id}`, error);
    }
  }
  
  /**
   * 카드 간 링크 생성
   * @param sourceCardId 소스 카드 ID
   * @param targetCardId 대상 카드 ID
   */
  private createLinkBetweenCards(sourceCardId: string, targetCardId: string): void {
    try {
      Log.debug(`카드 간 링크 생성: ${sourceCardId} -> ${targetCardId}`);
      
      // 소스 카드와 대상 카드 요소 찾기
      const sourceElement = document.querySelector(`[data-card-id="${sourceCardId}"]`);
      const targetElement = document.querySelector(`[data-card-id="${targetCardId}"]`);
      
      if (sourceElement instanceof HTMLElement && targetElement instanceof HTMLElement) {
        // 파일 경로 가져오기
        const sourceFilePath = sourceElement.getAttribute('data-file-path');
        const targetFilePath = targetElement.getAttribute('data-file-path');
        
        if (sourceFilePath && targetFilePath) {
          // 파일 객체 가져오기
          const sourceFile = this.app.vault.getAbstractFileByPath(sourceFilePath);
          const targetFile = this.app.vault.getAbstractFileByPath(targetFilePath);
          
          if (sourceFile instanceof TFile && targetFile instanceof TFile) {
            // 소스 파일 내용 가져오기
            this.app.vault.read(sourceFile).then(content => {
              // 대상 파일 링크 생성
              const targetFileName = targetFile.basename;
              const link = `[[${targetFile.path}|${targetFileName}]]`;
              
              // 링크를 파일 끝에 추가
              const newContent = content + `\n\n${link}`;
              
              // 파일 내용 업데이트
              this.app.vault.modify(sourceFile, newContent).then(() => {
                Log.debug(`링크 추가 완료: ${sourceFile.path} -> ${targetFile.path}`);
              });
            });
          }
        }
      }
    } catch (error) {
      ErrorHandler.handleError(`카드 간 링크 생성 중 오류 발생: ${sourceCardId} -> ${targetCardId}`, error);
    }
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
      
      const state: CardState = this.getCardState(card.id);
      
      const customEvent = new CustomEvent<CardEventData>('card-event', {
        bubbles: true,
        detail: {
          eventType,
          card,
          originalEvent: event,
          state
        }
      });
      
      cardElement.dispatchEvent(customEvent);
    }, 'EMIT_CARD_EVENT_ERROR', { cardId: card.id, eventType });
  }
  
  /**
   * 카드 상태 가져오기
   * @param cardId 카드 ID
   * @returns 카드 상태
   */
  private getCardState(cardId: string): CardState {
    if (this.draggingCardId === cardId) return 'dragging';
    if (this.dropTargetCardId === cardId) return 'dropping';
    if (this.focusedCardId === cardId) return 'focused';
    if (this.isCardSelected(cardId)) return 'selected';
    return 'normal';
  }
} 