import { ItemView, WorkspaceLeaf, setIcon } from 'obsidian';
import { ICardNavigatorViewModel } from '../interfaces/ICardNavigatorViewModel';
import { Container } from '@/infrastructure/di/Container';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ICard } from '@/domain/models/Card';
import { ICardSet } from '@/domain/models/CardSet';
import { ICardNavigatorView } from '../interfaces/ICardNavigatorView';
import { ICardDisplayManager } from '@/domain/managers/ICardDisplayManager';
import { IRenderManager } from '@/domain/managers/IRenderManager';
import * as Handlebars from 'handlebars';
import cardTemplate from './CardNavigatorCard.html';
import emptyTemplate from './CardNavigatorEmpty.html';
import loadingTemplate from './CardNavigatorLoading.html';
import viewTemplate from './CardNavigatorView.html';
import { ICardNavigatorState } from '../../domain/models/CardNavigatorState';
import { EventBus } from '../../domain/events/EventBus';
import { Throttler } from '@/domain/utils/Throttler';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { DEFAULT_LAYOUT_CONFIG } from '@/domain/models/LayoutConfig';
import { LayoutService } from '@/application/services/LayoutService';

export const VIEW_TYPE_CARD_NAVIGATOR = 'card-navigator-view';

export class CardNavigatorView extends ItemView implements ICardNavigatorView {
  private viewModel: ICardNavigatorViewModel;
  private logger: ILoggingService;
  private errorHandler: IErrorHandler;
  private cardDisplayManager: ICardDisplayManager;
  private renderManager: IRenderManager;
  private cardTemplate: Handlebars.TemplateDelegate;
  private emptyTemplate: Handlebars.TemplateDelegate;
  private loadingTemplate: Handlebars.TemplateDelegate;
  private viewTemplate: Handlebars.TemplateDelegate;
  private container: HTMLElement;
  private toolbar: HTMLElement | null = null;
  private cardGrid: HTMLElement | null = null;
  private loadingIndicator: HTMLElement;
  private errorMessage: HTMLElement;
  private eventBus: EventBus;
  private isInitialized: boolean = false;
  private pendingState: ICardNavigatorState | null = null;
  private initializationPromise: Promise<void> | null = null;
  private updateStateThrottler: Throttler<[ICardNavigatorState], Promise<void>>;
  private readonly UPDATE_THROTTLE_DELAY = 150; // 150ms 쓰로틀링

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    const container = Container.getInstance();
    this.logger = container.resolve<ILoggingService>('ILoggingService');
    this.errorHandler = container.resolve<IErrorHandler>('IErrorHandler');
    this.cardDisplayManager = container.resolve<ICardDisplayManager>('ICardDisplayManager');
    this.renderManager = container.resolve<IRenderManager>('IRenderManager');
    this.viewModel = container.resolve<ICardNavigatorViewModel>('ICardNavigatorViewModel');

    // 템플릿 컴파일
    this.cardTemplate = Handlebars.compile(cardTemplate);
    this.emptyTemplate = Handlebars.compile(emptyTemplate);
    this.loadingTemplate = Handlebars.compile(loadingTemplate);
    this.viewTemplate = Handlebars.compile(viewTemplate);

    // 기본 요소 초기화
    this.container = document.createElement('div');
    this.container.className = 'card-navigator';
    
    // Event Bus 초기화
    this.eventBus = EventBus.getInstance();
    
    // 상태 업데이트 쓰로틀러 초기화
    this.updateStateThrottler = new Throttler(
      (state: ICardNavigatorState) => this.processStateUpdate(state),
      this.UPDATE_THROTTLE_DELAY
    );
  }

  getViewType(): string {
    return VIEW_TYPE_CARD_NAVIGATOR;
  }

  getDisplayText(): string {
    return '카드 내비게이터';
  }

  getIcon(): string {
    return 'layers';
  }

  async onOpen(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        this.logger.debug('CardNavigatorView 열기 시작');
        
        // 뷰 컨테이너 초기화
        const container = this.containerEl.children[1];
        this.logger.debug('뷰 컨테이너 DOM 요소:', container);
        container.empty();
        container.addClass('card-navigator-container');
        
        // 툴바 초기화
        this.toolbar = container.createDiv('card-navigator-toolbar');
        this.logger.debug('툴바 생성됨');
        
        // 카드 그리드 초기화
        this.cardGrid = container.createDiv('card-navigator-grid');
        this.logger.debug('카드 그리드 생성됨');
        
        // 로딩 인디케이터를 DOM 트리에서 확실히 분리
        this.loadingIndicator = container.createDiv('card-navigator-loading-overlay');
        
        // 로딩 인디케이터 초기화 - innerHTML 대신 DOM API 사용
        this.loadingIndicator.empty();
        const loadingContainer = this.loadingIndicator.createDiv({
          cls: 'card-navigator-loading'
        });
        
        const spinnerDiv = loadingContainer.createDiv({
          cls: 'card-navigator-loading-spinner'
        });
        
        // SVG 로딩 아이콘 생성
        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgEl.setAttribute('width', '48');
        svgEl.setAttribute('height', '48');
        svgEl.setAttribute('viewBox', '0 0 24 24');
        svgEl.setAttribute('fill', 'none');
        svgEl.setAttribute('stroke', 'currentColor');
        svgEl.setAttribute('stroke-width', '2');
        svgEl.setAttribute('stroke-linecap', 'round');
        svgEl.setAttribute('stroke-linejoin', 'round');
        
        // SVG 라인 요소들 추가
        const createLine = (x1: string, y1: string, x2: string, y2: string) => {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x1);
          line.setAttribute('y1', y1);
          line.setAttribute('x2', x2);
          line.setAttribute('y2', y2);
          svgEl.appendChild(line);
        };
        
        createLine('12', '2', '12', '6');
        createLine('12', '18', '12', '22');
        createLine('4.93', '4.93', '7.76', '7.76');
        createLine('16.24', '16.24', '19.07', '19.07');
        createLine('2', '12', '6', '12');
        createLine('18', '12', '22', '12');
        createLine('4.93', '19.07', '7.76', '16.24');
        createLine('16.24', '7.76', '19.07', '4.93');
        
        spinnerDiv.appendChild(svgEl);
        
        const messageDiv = loadingContainer.createDiv({
          cls: 'card-navigator-loading-message',
          text: '카드를 불러오는 중...'
        });
        
        this.loadingIndicator.style.display = 'flex';
        // 로딩 인디케이터가 카드 그리드 위에 표시되도록 스타일 조정
        this.loadingIndicator.style.position = 'absolute';
        this.loadingIndicator.style.top = '0';
        this.loadingIndicator.style.left = '0';
        this.loadingIndicator.style.width = '100%';
        this.loadingIndicator.style.height = '100%';
        this.loadingIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        this.loadingIndicator.style.zIndex = '10';
        this.loadingIndicator.style.justifyContent = 'center';
        this.loadingIndicator.style.alignItems = 'center';
        this.logger.debug('로딩 인디케이터 표시 시작');
        
        // 에러 메시지 컨테이너 초기화
        this.errorMessage = container.createDiv('card-navigator-error');
        this.errorMessage.style.display = 'none';
        
        // 이벤트 리스너 등록
        this.registerEventListeners();
        this.logger.debug('이벤트 리스너 등록 완료');

        // 창 크기 변경 이벤트 등록
        this.registerDomEvent(window, 'resize', this.onResize.bind(this));
        this.logger.debug('창 크기 변경 이벤트 등록 완료');
        
        // 뷰모델 설정
        this.logger.debug('뷰모델에 뷰 설정 시작');
        this.viewModel.setView(this);
        this.logger.debug('뷰모델에 뷰 설정 완료');
        
        // 초기화 완료 표시
        this.isInitialized = true;
        this.logger.debug('CardNavigatorView 초기화 완료');
        
        // 보류 중인 상태 업데이트 처리
        if (this.pendingState) {
          this.logger.debug('보류 중인 상태 업데이트 적용');
          await this.updateState(this.pendingState);
          this.pendingState = null;
        }
        
        this.logger.debug('CardNavigatorView 열기 완료');
      } catch (error) {
        this.logger.error('CardNavigatorView 열기 실패', error);
        this.errorHandler.handleError(error, 'CardNavigatorView 열기 실패');
        
        // 에러 표시
        if (this.errorMessage) {
          this.errorMessage.empty();
          const errorContainer = this.errorMessage.createDiv();
          errorContainer.createEl('p', { 
            text: `카드 내비게이터 로드 중 오류가 발생했습니다: ${error.message}` 
          });
          this.errorMessage.style.display = 'flex';
        }
        
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  async onClose(): Promise<void> {
    try {
      this.logger.debug('카드 내비게이터 뷰 닫기 시작');

      // 이벤트 리스너 해제
      this.unregisterEventListeners();

      // 뷰모델 정리
      await this.viewModel.cleanup();

      this.logger.debug('카드 내비게이터 뷰 닫기 완료');
    } catch (error) {
      this.errorHandler.handleError(error, '카드 내비게이터 뷰 닫기 실패');
      throw error;
    }
  }

  private registerEventListeners(): void {
    // 키보드 이벤트
    this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
      this.handleKeyDown(evt);
    });

    // 마우스 이벤트
    this.registerDomEvent(this.containerEl, 'click', (evt: MouseEvent) => {
      this.handleCardClick(evt);
    });

    this.registerDomEvent(this.containerEl, 'dblclick', (evt: MouseEvent) => {
      this.handleCardDoubleClick(evt);
    });

    this.registerDomEvent(this.containerEl, 'contextmenu', (evt: MouseEvent) => {
      this.handleCardContextMenu(evt);
    });

    // 드래그 앤 드롭 이벤트
    this.registerDomEvent(this.containerEl, 'dragstart', (evt: DragEvent) => {
      this.handleDragStart(evt);
    });

    this.registerDomEvent(this.containerEl, 'dragover', (evt: DragEvent) => {
      this.handleDragOver(evt);
    });

    this.registerDomEvent(this.containerEl, 'drop', (evt: DragEvent) => {
      this.handleDrop(evt);
    });

    this.registerDomEvent(this.containerEl, 'dragend', (evt: DragEvent) => {
      this.handleDragEnd(evt);
    });
  }

  private unregisterEventListeners(): void {
    // 이벤트 리스너 해제는 Obsidian의 registerDomEvent가 자동으로 처리
  }

  private handleKeyDown(evt: KeyboardEvent): void {
    try {
      switch (evt.key) {
        case 'ArrowUp':
          this.viewModel.moveFocus('up');
          break;
        case 'ArrowDown':
          this.viewModel.moveFocus('down');
          break;
        case 'ArrowLeft':
          this.viewModel.moveFocus('left');
          break;
        case 'ArrowRight':
          this.viewModel.moveFocus('right');
          break;
        case 'Enter':
          this.viewModel.openFocusedCard();
          break;
        case 'Escape':
          this.viewModel.clearFocus();
          break;
      }
    } catch (error) {
      this.errorHandler.handleError(error, '키보드 이벤트 처리 실패');
    }
  }

  private handleCardClick(event: MouseEvent): void {
    try {
      const target = event.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        if (cardId) {
          // 시각적 피드백을 위한 클래스 추가
          if (event.shiftKey) {
            // 범위 선택 시 시각적 피드백
            this.viewModel.selectCardsInRange(cardId);
            cardElement.classList.add('range-selected');
          } else if (event.ctrlKey) {
            // 다중 선택 시 시각적 피드백
            this.viewModel.toggleCardSelection(cardId);
            cardElement.classList.toggle('selected');
          } else {
            // 단일 선택 시 시각적 피드백
            this.viewModel.selectCard(cardId);
            cardElement.classList.add('selected');
          }
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '카드 클릭 이벤트 처리 실패');
      // 사용자에게 에러 메시지 표시
      this.showError('카드 선택 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }

  private handleCardDoubleClick(event: MouseEvent): void {
    try {
      const target = event.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        if (cardId) {
          this.viewModel.activateCard(cardId);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '카드 더블클릭 이벤트 처리 실패');
    }
  }

  private handleCardContextMenu(event: MouseEvent): void {
    try {
      event.preventDefault();
      const target = event.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        if (cardId) {
          this.viewModel.showCardContextMenu(cardId, event);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '컨텍스트 메뉴 이벤트 처리 실패');
    }
  }

  private handleDragStart(event: DragEvent): void {
    try {
      const target = event.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        if (cardId) {
          // 드래그 데이터 설정
          event.dataTransfer?.setData('text/plain', cardId);
          event.dataTransfer?.setData('application/json', JSON.stringify({
            type: 'card',
            id: cardId
          }));
          
          // 드래그 중인 카드에 시각적 피드백 추가
          cardElement.classList.add('dragging');
          
          // 드래그 이미지 설정
          const dragImage = cardElement.cloneNode(true) as HTMLElement;
          dragImage.style.width = '200px';
          dragImage.style.opacity = '0.8';
          event.dataTransfer?.setDragImage(dragImage, 100, 50);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '드래그 시작 이벤트 처리 실패');
    }
  }

  private handleDragOver(event: DragEvent): void {
    try {
      event.preventDefault();
      const target = event.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        // 드롭 가능 영역 표시
        cardElement.classList.add('drop-target');
      }
    } catch (error) {
      this.errorHandler.handleError(error, '드래그 오버 이벤트 처리 실패');
    }
  }

  private handleDrop(event: DragEvent): void {
    try {
      event.preventDefault();
      const target = event.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const targetCardId = cardElement.getAttribute('data-card-id');
        const draggedCardId = event.dataTransfer?.getData('text/plain');
        
        if (targetCardId && draggedCardId) {
          // 카드 간 링크 생성
          this.viewModel.createLinkBetweenCards(draggedCardId, targetCardId);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '드롭 이벤트 처리 실패');
    }
  }

  private handleDragEnd(event: DragEvent): void {
    try {
      // 드래그 관련 클래스 제거
      const cards = this.containerEl.querySelectorAll('.card-navigator-card');
      cards.forEach(card => {
        card.classList.remove('dragging', 'drop-target');
      });
    } catch (error) {
      this.errorHandler.handleError(error, '드래그 종료 이벤트 처리 실패');
    }
  }

  private createToolbarButton(container: HTMLElement, action: string, title: string): void {
    const button = container.createEl('div', { 
      cls: 'card-navigator-toolbar-button clickable-icon',
      attr: { 
        'data-action': action,
        'aria-label': title
      }
    });

    // Obsidian 내장 아이콘 사용
    switch (action) {
      case 'folder':
        setIcon(button, 'folder');
        break;
      case 'tag':
        setIcon(button, 'tags');
        break;
      case 'link':
        setIcon(button, 'link');
        break;
      case 'sort':
        setIcon(button, 'arrow-up-narrow-wide');
        break;
      case 'settings':
        setIcon(button, 'settings');
        break;
    }
  }

  /**
   * 로딩 상태 표시
   * @param isLoading 로딩 중 여부
   */
  public showLoading(isLoading: boolean = true): void {
    try {
      if (!this.loadingIndicator) {
        return;
      }
      
      if (isLoading) {
        // 로딩 상태 표시
        this.loadingIndicator.empty();
        
        const loadingContainer = this.loadingIndicator.createDiv({
          cls: 'card-navigator-loading'
        });
        
        const spinnerDiv = loadingContainer.createDiv({
          cls: 'card-navigator-loading-spinner'
        });
        
        // SVG 로딩 아이콘 생성
        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgEl.setAttribute('width', '48');
        svgEl.setAttribute('height', '48');
        svgEl.setAttribute('viewBox', '0 0 24 24');
        svgEl.setAttribute('fill', 'none');
        svgEl.setAttribute('stroke', 'currentColor');
        svgEl.setAttribute('stroke-width', '2');
        svgEl.setAttribute('stroke-linecap', 'round');
        svgEl.setAttribute('stroke-linejoin', 'round');
        
        // SVG 라인 요소들 추가
        const createLine = (x1: string, y1: string, x2: string, y2: string) => {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x1);
          line.setAttribute('y1', y1);
          line.setAttribute('x2', x2);
          line.setAttribute('y2', y2);
          svgEl.appendChild(line);
        };
        
        createLine('12', '2', '12', '6');
        createLine('12', '18', '12', '22');
        createLine('4.93', '4.93', '7.76', '7.76');
        createLine('16.24', '16.24', '19.07', '19.07');
        createLine('2', '12', '6', '12');
        createLine('18', '12', '22', '12');
        createLine('4.93', '19.07', '7.76', '16.24');
        createLine('16.24', '7.76', '19.07', '4.93');
        
        spinnerDiv.appendChild(svgEl);
        
        const messageDiv = loadingContainer.createDiv({
          cls: 'card-navigator-loading-message',
          text: '카드를 불러오는 중...'
        });
        
        this.loadingIndicator.style.display = 'flex';
        
        // DOM에 로딩 인디케이터가 카드 그리드 안에 포함되지 않도록 부모 컨테이너로 이동
        const container = this.containerEl.children[1];
        if (container && this.loadingIndicator.parentElement !== container) {
          container.appendChild(this.loadingIndicator);
        }
      } else {
        // 로딩 상태 숨김
        this.loadingIndicator.style.display = 'none';
      }
    } catch (error) {
      this.logger.error('로딩 상태 표시 중 오류 발생', error);
    }
  }

  public showError(message: string): void {
    try {
      // 로딩 표시 숨김
      if (this.loadingIndicator) {
        this.loadingIndicator.style.display = 'none';
      }
      
      // 카드 그리드 비우기 - 에러 메시지 표시 시 카드 목록을 표시하지 않음
      const gridContainer = this.containerEl.querySelector('.card-navigator-grid');
      if (gridContainer) {
        // innerHTML 대신 empty() 사용
        (gridContainer as HTMLElement).empty();
        
        // 카드셋 ID 속성 제거 - 이전 카드셋 참조 제거
        gridContainer.removeAttribute('data-card-set-id');
      }
      
      // 에러 메시지 표시
      if (this.errorMessage) {
        // innerHTML 대신 DOM API 사용
        this.errorMessage.empty();
        
        const errorContainer = this.errorMessage.createDiv({
          cls: 'card-navigator-error-container'
        });
        
        errorContainer.createEl('p', {
          text: message
        });
        
        this.errorMessage.style.display = 'flex';
      }
    } catch (error) {
      this.logger.error('에러 메시지 표시 중 오류 발생', error);
    }
  }

  /**
   * 일반 메시지 표시
   * @param message 표시할 메시지
   */
  public showMessage(message: string): void {
    try {
      this.logger.debug(`메시지 표시: ${message}`);
      
      // 로딩 표시 숨김
      if (this.loadingIndicator) {
        this.loadingIndicator.style.display = 'none';
      }
      
      // 메시지 표시
      const container = this.containerEl.querySelector('.card-navigator-grid');
      if (container) {
        // innerHTML 대신 DOM API 사용
        (container as HTMLElement).empty();
        
        const messageContainer = (container as HTMLElement).createDiv({
          cls: 'card-navigator-message'
        });
        
        messageContainer.createEl('p', {
          text: message
        });
      }
    } catch (error) {
      this.logger.error('메시지 표시 중 오류 발생', error);
    }
  }

  /**
   * 상태 업데이트
   * @param state 새로운 상태
   */
  async updateState(state: ICardNavigatorState): Promise<void> {
    if (!this.isInitialized) {
      this.logger.debug('뷰가 아직 초기화되지 않음, 상태 업데이트 보류');
      this.pendingState = state;
      return;
    }

    try {
      // 쓰로틀링 적용된 상태 업데이트
      await this.updateStateThrottler.throttle(state);
    } catch (error) {
      this.errorHandler.handleError(error, '상태 업데이트 실패');
    }
  }
  
  /**
   * 실제 상태 업데이트 처리 (쓰로틀링 적용 후)
   * @param state 새로운 상태
   */
  private async processStateUpdate(state: ICardNavigatorState): Promise<void> {
    try {
      // 카드셋 업데이트 관련 변수
      let isCardSetChanged = false;
      const currentCardSetId = this.cardGrid?.getAttribute('data-card-set-id');
      const newCardSetId = state.currentCardSet?.id;
      
      // 상태 업데이트 로직은 한 방향으로만 흐르도록 수정
      // 1. 카드셋 변경 확인
      if (state.currentCardSet) {
        // 카드셋 ID가 변경되었거나 이전에 설정되지 않은 경우
        if (!currentCardSetId || currentCardSetId !== newCardSetId) {
          isCardSetChanged = true;
          this.logger.debug('카드셋 변경 감지됨, 업데이트 필요', { 
            previousCardSetId: currentCardSetId,
            newCardSetId: newCardSetId
          });
        } 
        // 카드셋 ID는 같지만 카드 수가 변경된 경우
        else if (this.cardGrid && 
                 this.cardGrid.querySelectorAll('.card-navigator-card').length !== state.currentCardSet.cards.length) {
          isCardSetChanged = true;
          this.logger.debug('카드셋 내용 변경 감지됨, 업데이트 필요', {
            cardSetId: currentCardSetId,
            previousCardCount: this.cardGrid.querySelectorAll('.card-navigator-card').length,
            newCardCount: state.currentCardSet.cards.length
          });
        }
        // 카드셋 ID와 카드 수가 모두 동일한 경우는 업데이트하지 않음
        else {
          this.logger.debug('카드셋 변경 없음, 카드셋 업데이트 건너뜀', {
            cardSetId: currentCardSetId,
            cardCount: state.currentCardSet.cards.length
          });
        }
        
        // 카드셋이 변경된 경우 업데이트
        if (isCardSetChanged && state.currentCardSet) {
          // 기존 카드 요소 제거 - 중복 카드 방지
          if (this.cardGrid) {
            this.cardGrid.empty();
          }
          
          // 카드셋 업데이트 수행
          await this.updateCardSet(state.currentCardSet);
          
          // 카드셋 ID 속성 추가
          if (this.cardGrid && newCardSetId) {
            this.cardGrid.setAttribute('data-card-set-id', newCardSetId);
          }
        }
      }
      
      // 2. 검색 모드 설정은 항상 업데이트 (검색 UI 상태에 영향)
      this.updateSearchMode(state.isSearchMode, state.searchQuery);
      
      // 3. 카드 상태 업데이트 (포커스, 선택, 활성 상태)
      // 카드셋이 변경된 경우에도 카드 상태는 업데이트해야 함
      this.updateFocusedCard(state.focusedCardId);
      this.updateSelectedCards(state.selectedCardIds);
      this.updateActiveCard(state.activeCardId);
      
    } catch (error) {
      this.errorHandler.handleError(error, '상태 업데이트 처리 실패');
      throw error;
    }
  }

  /**
   * 포커스된 카드 업데이트
   * @param cardId 포커스된 카드 ID
   */
  updateFocusedCard(cardId: string | null): void {
    if (!this.cardGrid) {
      this.logger.warn('카드 그리드가 초기화되지 않음');
      return;
    }
    
    const cards = this.cardGrid.querySelectorAll('.card-navigator-card');
    cards.forEach(card => {
      const currentCardId = card.getAttribute('data-card-id');
      if (currentCardId === cardId) {
        card.classList.add('focused');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        card.classList.remove('focused');
      }
    });
  }

  /**
   * 선택된 카드 업데이트
   * @param cardIds 선택된 카드 ID 목록
   */
  updateSelectedCards(cardIds: Set<string>): void {
    if (!this.cardGrid) {
      this.logger.warn('카드 그리드가 초기화되지 않음');
      return;
    }
    
    const cards = this.cardGrid.querySelectorAll('.card-navigator-card');
    cards.forEach(card => {
      const currentCardId = card.getAttribute('data-card-id');
      if (currentCardId && cardIds.has(currentCardId)) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  }

  /**
   * 활성화된 카드 업데이트
   * @param cardId 활성화된 카드 ID
   */
  updateActiveCard(cardId: string | null): void {
    if (!this.cardGrid) {
      this.logger.warn('카드 그리드가 초기화되지 않음');
      return;
    }
    
    const cards = this.cardGrid.querySelectorAll('.card-navigator-card');
    cards.forEach(card => {
      const currentCardId = card.getAttribute('data-card-id');
      if (currentCardId === cardId) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  /**
   * 검색 모드 업데이트
   * @param isSearchMode 검색 모드 여부
   * @param query 검색어
   */
  updateSearchMode(isSearchMode: boolean, query: string): void {
    if (!this.toolbar) {
      this.logger.warn('툴바가 초기화되지 않음');
      return;
    }
    
    if (isSearchMode) {
      this.toolbar.classList.add('search-mode');
    } else {
      this.toolbar.classList.remove('search-mode');
    }
  }

  /**
   * 카드셋 업데이트
   * @param cardSet 카드셋
   */
  async updateCardSet(cardSet: ICardSet): Promise<void> {
    try {
      // 로딩 상태 표시
      this.showLoading(true);
      
      // 카드 그리드 비우기 - 중복 요소 방지
      if (this.cardGrid) {
        this.cardGrid.empty();
        
        // 레이아웃 타입에 따른 클래스 적용
        try {
          // 레이아웃 서비스 가져오기
          const layoutService = Container.getInstance().resolveOptional<ILayoutService>('ILayoutService') || LayoutService.getInstance();
          
          // 레이아웃 서비스에 뷰포트 크기 업데이트
          layoutService.updateViewportDimensions(this.cardGrid.clientWidth, this.cardGrid.clientHeight);
          
          // 기존 레이아웃 클래스 제거
          this.cardGrid.classList.remove('grid-layout', 'masonry-layout', 'horizontal', 'vertical');
          
          // 뷰포트 크기 계산
          const containerWidth = this.cardGrid.clientWidth;
          const containerHeight = this.cardGrid.clientHeight;
          
          // 가로/세로 레이아웃 결정
          const aspectRatio = containerWidth / containerHeight;
          const isHorizontal = aspectRatio > 1;
          
          // 레이아웃 설정 가져오기
          const layoutConfig = layoutService.getLayoutConfig();
          
          // 열 수와 행 수 계산
          const columnCount = Math.max(1, Math.floor(
            (containerWidth - (2 * layoutConfig.cardPadding) + layoutConfig.cardGap) / 
            (layoutConfig.cardMinWidth + layoutConfig.cardGap)
          ));
          
          const rowCount = Math.max(1, Math.floor(
            (containerHeight - (2 * layoutConfig.cardPadding) + layoutConfig.cardGap) / 
            (layoutConfig.cardMinHeight + layoutConfig.cardGap)
          ));
          
          // 카드 크기 계산 함수
          const calculateCardWidth = (containerWidth: number, columnCount: number, gap: number, padding: number) => {
            const availableWidth = containerWidth - (2 * padding);
            const cardWidth = (availableWidth - ((columnCount - 1) * gap)) / columnCount;
            return Math.max(layoutConfig.cardMinWidth, cardWidth);
          };
          
          const calculateCardHeight = (containerHeight: number, rowCount: number, gap: number, padding: number) => {
            const availableHeight = containerHeight - (2 * padding);
            const cardHeight = (availableHeight - ((rowCount - 1) * gap)) / rowCount;
            return Math.max(layoutConfig.cardMinHeight, cardHeight);
          };
          
          // 새 레이아웃 클래스 추가
          if (layoutConfig.cardHeightFixed) {
            // 그리드 레이아웃 (카드 높이 고정)
            this.cardGrid.classList.add('grid-layout');
            
            if (isHorizontal) {
              // 가로 레이아웃
              this.cardGrid.classList.add('horizontal');
              
              // CSS 변수 설정
              this.cardGrid.style.setProperty('--grid-rows', `${rowCount}`);
              
              // 카드 높이 계산 (가로 모드에서는 높이가 균등 분배됨)
              const cardHeight = calculateCardHeight(
                containerHeight, 
                rowCount, 
                layoutConfig.cardGap, 
                layoutConfig.cardPadding
              );
              this.cardGrid.style.setProperty('--card-height', `${cardHeight}px`);
            } else {
              // 세로 레이아웃
              this.cardGrid.classList.add('vertical');
              
              // CSS 변수 설정
              this.cardGrid.style.setProperty('--grid-columns', `${columnCount}`);
              
              // 카드 너비 계산 (세로 모드에서는 너비가 균등 분배됨)
              const cardWidth = calculateCardWidth(
                containerWidth, 
                columnCount, 
                layoutConfig.cardGap, 
                layoutConfig.cardPadding
              );
              this.cardGrid.style.setProperty('--card-width', `${cardWidth}px`);
            }
          } else {
            // 메이슨리 레이아웃 (카드 높이 가변)
            this.cardGrid.classList.add('masonry-layout');
            
            // CSS 변수 설정
            this.cardGrid.style.setProperty('--grid-columns', `${columnCount}`);
            
            // 카드 너비 계산
            const cardWidth = calculateCardWidth(
              containerWidth, 
              columnCount, 
              layoutConfig.cardGap, 
              layoutConfig.cardPadding
            );
            this.cardGrid.style.setProperty('--card-width', `${cardWidth}px`);
          }
          
          // 공통 CSS 변수 설정
          this.cardGrid.style.setProperty('--card-min-width', `${layoutConfig.cardMinWidth}px`);
          this.cardGrid.style.setProperty('--card-min-height', `${layoutConfig.cardMinHeight}px`);
          this.cardGrid.style.setProperty('--card-gap', `${layoutConfig.cardGap}px`);
          this.cardGrid.style.setProperty('--card-padding', `${layoutConfig.cardPadding}px`);
        } catch (error) {
          this.logger.error('레이아웃 클래스 적용 실패', { error });
          // 에러 발생 시 기본 레이아웃 적용
          this.cardGrid.classList.add('masonry-layout');
          this.cardGrid.style.setProperty('--card-min-width', '300px');
          this.cardGrid.style.setProperty('--card-min-height', '200px');
          this.cardGrid.style.setProperty('--card-gap', '16px');
          this.cardGrid.style.setProperty('--card-padding', '16px');
          this.cardGrid.style.setProperty('--grid-columns', '2');
        }
        
        // 카드셋 ID 속성 추가
        this.cardGrid.setAttribute('data-card-set-id', cardSet.id);
      }
      
      // CardDisplayManager를 통해 카드셋 표시 (중복 renderCards 호출 제거)
      this.cardDisplayManager.displayCardSet(cardSet, `update_${Date.now()}`);
      
      // 카드가 없는 경우 빈 메시지 표시
      if (cardSet.cards.length === 0 && this.cardGrid) {
        const emptyDiv = this.cardGrid.createDiv({ cls: 'card-navigator-empty' });
        emptyDiv.createEl('p', { text: '연결된 카드가 없습니다. 다른 노트와 링크를 생성해보세요.' });
      }
      
      // 로딩 상태 해제 (일정 시간 후에 해제하여 CardDisplayManager가 카드를 렌더링할 시간 확보)
      setTimeout(() => {
        this.showLoading(false);
        
        // 카드가 정상적으로 로드되었으므로 에러 메시지 숨김
        if (this.errorMessage) {
          this.errorMessage.style.display = 'none';
        }
      }, 100);
    } catch (error) {
      this.logger.error('카드셋 업데이트 실패', error);
      this.errorHandler.handleError(error, '카드셋 업데이트 실패');
      // 에러 상황에서도 로딩 인디케이터 숨김
      this.showLoading(false);
      // 에러 메시지 표시
      this.showError('카드셋 업데이트 중 오류가 발생했습니다.');
    }
  }

  /**
   * 뷰 정리
   */
  cleanup(): void {
    this.container.remove();
  }

  /**
   * 뷰포트 크기 변경 이벤트 처리
   */
  onResize(): void {
    if (!this.cardGrid) {
      return;
    }
    
    try {
      // 레이아웃 서비스 가져오기
      const layoutService = Container.getInstance().resolveOptional<ILayoutService>('ILayoutService') || LayoutService.getInstance();
      
      // 뷰포트 크기 계산
      const containerWidth = this.cardGrid.clientWidth;
      const containerHeight = this.cardGrid.clientHeight;
      
      // 레이아웃 서비스에 뷰포트 크기 업데이트
      layoutService.updateViewportDimensions(containerWidth, containerHeight);
      
      // 가로/세로 레이아웃 결정
      const aspectRatio = containerWidth / containerHeight;
      const isHorizontal = aspectRatio > 1;
      
      // 레이아웃 설정 가져오기
      const layoutConfig = layoutService.getLayoutConfig();
      
      // 열 수와 행 수 계산
      const columnCount = Math.max(1, Math.floor(
        (containerWidth - (2 * layoutConfig.cardPadding) + layoutConfig.cardGap) / 
        (layoutConfig.cardMinWidth + layoutConfig.cardGap)
      ));
      
      const rowCount = Math.max(1, Math.floor(
        (containerHeight - (2 * layoutConfig.cardPadding) + layoutConfig.cardGap) / 
        (layoutConfig.cardMinHeight + layoutConfig.cardGap)
      ));
      
      // 카드 크기 계산 함수
      const calculateCardWidth = (containerWidth: number, columnCount: number, gap: number, padding: number) => {
        const availableWidth = containerWidth - (2 * padding);
        const cardWidth = (availableWidth - ((columnCount - 1) * gap)) / columnCount;
        return Math.max(layoutConfig.cardMinWidth, cardWidth);
      };
      
      const calculateCardHeight = (containerHeight: number, rowCount: number, gap: number, padding: number) => {
        const availableHeight = containerHeight - (2 * padding);
        const cardHeight = (availableHeight - ((rowCount - 1) * gap)) / rowCount;
        return Math.max(layoutConfig.cardMinHeight, cardHeight);
      };
      
      // 기존 레이아웃 클래스 제거
      this.cardGrid.classList.remove('horizontal', 'vertical');
      
      if (layoutConfig.cardHeightFixed) {
        // 그리드 레이아웃인 경우
        if (isHorizontal) {
          // 가로 레이아웃
          this.cardGrid.classList.add('horizontal');
          
          // CSS 변수 설정
          this.cardGrid.style.setProperty('--grid-rows', `${rowCount}`);
          
          // 카드 높이 계산
          const cardHeight = calculateCardHeight(
            containerHeight, 
            rowCount, 
            layoutConfig.cardGap, 
            layoutConfig.cardPadding
          );
          this.cardGrid.style.setProperty('--card-height', `${cardHeight}px`);
        } else {
          // 세로 레이아웃
          this.cardGrid.classList.add('vertical');
          
          // CSS 변수 설정
          this.cardGrid.style.setProperty('--grid-columns', `${columnCount}`);
          
          // 카드 너비 계산
          const cardWidth = calculateCardWidth(
            containerWidth, 
            columnCount, 
            layoutConfig.cardGap, 
            layoutConfig.cardPadding
          );
          this.cardGrid.style.setProperty('--card-width', `${cardWidth}px`);
        }
      } else {
        // 메이슨리 레이아웃인 경우
        // CSS 변수 설정
        this.cardGrid.style.setProperty('--grid-columns', `${columnCount}`);
        
        // 카드 너비 계산
        const cardWidth = calculateCardWidth(
          containerWidth, 
          columnCount, 
          layoutConfig.cardGap, 
          layoutConfig.cardPadding
        );
        this.cardGrid.style.setProperty('--card-width', `${cardWidth}px`);
      }
      
      // 현재 카드셋이 있는 경우 레이아웃 재계산
      if (this.viewModel && this.viewModel.getCurrentCardSet()) {
        const cardSet = this.viewModel.getCurrentCardSet();
        
        // 레이아웃 재계산
        if (cardSet) {
          layoutService.calculateLayout(
            cardSet,
            containerWidth,
            containerHeight
          );
        }
      }
    } catch (error) {
      this.logger.error('뷰포트 크기 변경 처리 실패', { error });
      // 에러 발생 시 기본 레이아웃 유지
    }
  }
} 