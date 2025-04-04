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
        this.loadingIndicator.innerHTML = this.loadingTemplate({ message: '카드를 불러오는 중...' });
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
          this.errorMessage.innerHTML = `<p>카드 내비게이터 로드 중 오류가 발생했습니다: ${error.message}</p>`;
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
   * 카드 목록 렌더링
   * @param cards 카드 목록
   */
  private async renderCards(cards: readonly ICard[]): Promise<void> {
    try {
      // 렌더링 시작 시간 기록
      const renderStartTime = performance.now();
      this.logger.debug('카드 렌더링 시작', { cardCount: cards.length });
      
      const gridContainer = this.containerEl.querySelector('.card-navigator-grid');
      if (!gridContainer) {
        throw new Error('카드 그리드 컨테이너를 찾을 수 없습니다.');
      }

      // 기존 카드 제거 전에 현재 표시된 카드 ID 수집
      const existingCardElements = gridContainer.querySelectorAll('.card-navigator-card');
      const existingCardIds = new Set<string>();
      
      existingCardElements.forEach(cardEl => {
        const cardId = cardEl.getAttribute('data-card-id');
        if (cardId) existingCardIds.add(cardId);
      });
      
      // 새로 표시할 카드 ID 집합
      const newCardIds = new Set(cards.map(card => card.id));
      
      // 삭제할 카드 요소 찾기 (현재는 있지만 새로운 집합에는 없는 카드)
      const elementsToRemove: HTMLElement[] = [];
      existingCardElements.forEach(cardEl => {
        const cardId = cardEl.getAttribute('data-card-id');
        if (cardId && !newCardIds.has(cardId)) {
          elementsToRemove.push(cardEl as HTMLElement);
        }
      });
      
      // 불필요한 카드 요소 제거
      elementsToRemove.forEach(el => el.remove());
      
      if (cards.length === 0) {
        this.logger.debug('표시할 카드가 없음');
        gridContainer.innerHTML = '';
        const emptyDiv = gridContainer.createDiv({ cls: 'card-navigator-empty' });
        emptyDiv.createEl('p', { text: '연결된 카드가 없습니다. 다른 노트와 링크를 생성해보세요.' });
        
        // 카드가 없는 경우 로딩 인디케이터 즉시 숨김
        if (this.loadingIndicator) {
          this.loadingIndicator.style.display = 'none';
        }
        return;
      }

      // 카드 렌더링
      this.logger.debug('카드 렌더링 진행', { cardCount: cards.length });
      
      // 카드 렌더링 시 중복 등록 방지를 위한 Set 생성
      const renderedCardIds = new Set<string>();
      
      // 공통 렌더링 설정 미리 가져오기 (매번 호출하지 않도록)
      const renderConfig = this.viewModel.getRenderConfig();
      const cardStyle = this.viewModel.getCardStyle();
      
      // 렌더링된 카드 HTML을 저장하는 맵 (중복 렌더링 방지)
      const renderedCardHtmlMap = new Map<string, string>();
      
      // 새 카드들을 미리 생성하여 한 번에 추가하기 위한 DocumentFragment
      const fragment = document.createDocumentFragment();
      
      // 렌더링 작업 병렬화
      const renderPromises: Promise<void>[] = [];
      
      // 진행 상황 추적을 위한 카운터
      let completedCards = 0;
      
      // 존재하는 카드 ID 집합에 없는 새 카드만 렌더링
      for (const card of cards) {
        try {
          // 이미 렌더링된 카드인지 확인
          if (renderedCardIds.has(card.id)) {
            this.logger.debug(`이미 렌더링된 카드 건너뛰기: ${card.id}`);
            continue;
          }
          
          // 렌더링 카드 목록에 추가
          renderedCardIds.add(card.id);
          
          // 이미 DOM에 존재하는 카드는 건너뜀
          if (existingCardIds.has(card.id)) {
            this.logger.debug(`이미 표시된 카드 건너뛰기: ${card.id}`);
            completedCards++;
            continue;
          }
          
          // 비동기 렌더링 작업을 병렬화
          const renderPromise = (async () => {
            try {
              // 카드 요소 생성
              const cardEl = document.createElement('div');
              cardEl.className = 'card-navigator-card';
              cardEl.setAttribute('data-card-id', card.id);
              
              // 이미 렌더링된 HTML이 있는지 확인
              let renderedCard: string;
              if (renderedCardHtmlMap.has(card.id)) {
                renderedCard = renderedCardHtmlMap.get(card.id) || '';
                this.logger.debug(`캐시된 HTML 사용: ${card.id}`);
              } else {
                // 카드 렌더링 시도
                renderedCard = await this.renderManager.renderCard(
                  card,
                  renderConfig,
                  cardStyle
                );
                // 렌더링 결과 캐싱
                renderedCardHtmlMap.set(card.id, renderedCard);
              }
              
              cardEl.innerHTML = renderedCard;
              
              // 카드 표시 관리자에 카드 등록 (한 번만 등록)
              this.cardDisplayManager.registerCard(card.id, cardEl);
              
              // 카드 요소를 DocumentFragment에 추가
              fragment.appendChild(cardEl);
              
              // 진행 카운터 증가
              completedCards++;
            } catch (error) {
              this.logger.error(`카드 생성 실패: ${card.id}`, error);
            }
          })();
          
          renderPromises.push(renderPromise);
        } catch (error) {
          this.logger.error(`카드 처리 실패: ${card.id}`, error);
        }
      }
      
      // 모든 비동기 렌더링 작업이 완료될 때까지 대기
      await Promise.all(renderPromises);
      
      // 모든 카드 요소를 한 번에 그리드에 추가
      gridContainer.appendChild(fragment);
      
      // 카드 렌더링 완료 시간 측정
      const renderEndTime = performance.now();
      const renderTime = renderEndTime - renderStartTime;
      
      this.logger.debug('카드 렌더링 완료', { 
        cardCount: cards.length, 
        completedCards,
        renderTime: `${renderTime.toFixed(2)}ms` 
      });
      
      // 모든 렌더링이 완료된 후 로딩 인디케이터 숨김
      if (this.loadingIndicator) {
        this.loadingIndicator.style.display = 'none';
      }
    } catch (error) {
      this.logger.error('카드 목록 렌더링 실패', error);
      this.errorHandler.handleError(error, '카드 목록 렌더링 실패');
      
      // 에러 발생 시에도 로딩 인디케이터 숨김
      if (this.loadingIndicator) {
        this.loadingIndicator.style.display = 'none';
      }
    }
  }

  /**
   * 로딩 상태 표시
   * @param isLoading 로딩 중 여부
   */
  public showLoading(isLoading: boolean = true): void {
    try {
      this.logger.debug(`로딩 상태 설정: ${isLoading}`);
      if (!this.loadingIndicator) {
        this.logger.warn('로딩 인디케이터가 초기화되지 않음');
        return;
      }
      
      if (isLoading) {
        // 로딩 상태 표시
        this.loadingIndicator.innerHTML = this.loadingTemplate({ message: '카드를 불러오는 중...' });
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
      this.logger.debug(`에러 메시지 표시: ${message}`);
      
      // 로딩 표시 숨김
      if (this.loadingIndicator) {
        this.loadingIndicator.style.display = 'none';
      }
      
      // 에러 메시지 표시
      if (this.errorMessage) {
        this.errorMessage.innerHTML = this.emptyTemplate({ message });
        this.errorMessage.style.display = 'flex';
      } else {
        const container = this.containerEl.querySelector('.card-navigator-grid');
        if (container) {
          container.innerHTML = this.emptyTemplate({ message });
        }
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
        container.innerHTML = this.emptyTemplate({ message });
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
      // 카드셋 변경 여부 확인 - 불필요한 업데이트 방지
      let isCardSetChanged = false;
      
      // 현재 표시된 카드셋 ID 가져오기
      const currentCardSetId = this.cardGrid?.getAttribute('data-card-set-id');
      const newCardSetId = state.currentCardSet?.id;
      
      // 성능 최적화: 동일한 카드셋 ID + 동일한 카드 수인 경우 중복 업데이트 방지
      const skipUpdate = 
        currentCardSetId === newCardSetId && 
        this.cardGrid && 
        state.currentCardSet && 
        this.cardGrid.querySelectorAll('.card-navigator-card').length === state.currentCardSet.cards.length;
        
      // 카드셋이 변경되었는지 확인
      if (state.currentCardSet && (!currentCardSetId || currentCardSetId !== newCardSetId || !skipUpdate)) {
        isCardSetChanged = true;
        
        // 카드셋이 변경된 경우에만 업데이트
        this.logger.debug('카드셋 변경 감지됨, 업데이트 수행', { 
          previousCardSetId: currentCardSetId,
          newCardSetId: newCardSetId
        });
        
        await this.updateCardSet(state.currentCardSet);
        
        // 카드셋 ID 속성 추가
        if (this.cardGrid && newCardSetId) {
          this.cardGrid.setAttribute('data-card-set-id', newCardSetId);
        }
      } else if (skipUpdate) {
        this.logger.debug('카드셋 변경 없음, 업데이트 건너뜀', {
          cardSetId: currentCardSetId,
          cardCount: state.currentCardSet?.cards.length || 0
        });
      }
      
      // 포커스, 선택, 활성화 상태는 카드셋이 변경되지 않았을 때만 별도로 업데이트
      if (!isCardSetChanged) {
        this.updateFocusedCard(state.focusedCardId);
        this.updateSelectedCards(state.selectedCardIds);
        this.updateActiveCard(state.activeCardId);
      }
      
      // 검색 모드는 항상 업데이트
      this.updateSearchMode(state.isSearchMode, state.searchQuery);
    } catch (error) {
      this.errorHandler.handleError(error, '상태 업데이트 실패');
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
  public async updateCardSet(cardSet: ICardSet): Promise<void> {
    try {
      this.logger.debug('카드셋 업데이트 시작', { 
        cardSetId: cardSet.id, 
        cardSetType: cardSet.type,
        cardCount: cardSet.cards.length,
        criteria: cardSet.criteria
      });
      
      // 로딩 표시 시작 - 이미 활성화되어 있을 수 있으므로 확인
      this.showLoading(true);
      
      // 카드 렌더링 - 이후 렌더링 메서드에서 로딩 인디케이터를 숨김
      await this.renderCards(cardSet.cards);
      
      this.logger.debug('카드셋 업데이트 완료');
    } catch (error) {
      this.logger.error('카드셋 업데이트 실패', error);
      this.errorHandler.handleError(error, '카드셋 업데이트 실패');
      this.showError('카드셋 업데이트 중 오류가 발생했습니다.');
      
      // 에러 상황에서도 로딩 인디케이터 숨김
      this.showLoading(false);
    }
  }

  /**
   * 뷰 정리
   */
  cleanup(): void {
    this.container.remove();
  }
} 