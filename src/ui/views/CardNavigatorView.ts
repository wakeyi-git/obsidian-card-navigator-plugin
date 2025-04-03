import { ItemView, WorkspaceLeaf, setIcon } from 'obsidian';
import { ICardNavigatorViewModel } from '../viewModels/ICardNavigatorViewModel';
import { Container } from '@/infrastructure/di/Container';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { ICard } from '@/domain/models/Card';
import { ICardSet } from '@/domain/models/CardSet';
import { ICardNavigatorView } from './ICardNavigatorView';
import * as Handlebars from 'handlebars';
import cardTemplate from './CardNavigatorCard.html';
import emptyTemplate from './CardNavigatorEmpty.html';
import loadingTemplate from './CardNavigatorLoading.html';
import viewTemplate from './CardNavigatorView.html';

export const VIEW_TYPE_CARD_NAVIGATOR = 'card-navigator-view';

export class CardNavigatorView extends ItemView implements ICardNavigatorView {
  private viewModel: ICardNavigatorViewModel;
  private logger: ILoggingService;
  private errorHandler: IErrorHandler;
  private cardTemplate: Handlebars.TemplateDelegate;
  private emptyTemplate: Handlebars.TemplateDelegate;
  private loadingTemplate: Handlebars.TemplateDelegate;
  private viewTemplate: Handlebars.TemplateDelegate;

  constructor(leaf: WorkspaceLeaf) {
    try {
      super(leaf);
      console.debug('CardNavigatorView 생성자 시작');
      
      // 의존성 주입
      const container = Container.getInstance();
      
      // 기본 서비스 주입
      console.debug('ILoggingService 서비스 해결 시도');
      this.logger = container.resolve<ILoggingService>('ILoggingService');
      console.debug('ILoggingService 서비스 해결 완료');

      console.debug('IErrorHandler 서비스 해결 시도');
      this.errorHandler = container.resolve<IErrorHandler>('IErrorHandler');
      console.debug('IErrorHandler 서비스 해결 완료');
      
      // 템플릿 컴파일
      console.debug('템플릿 컴파일 시작');
      this.cardTemplate = Handlebars.compile(cardTemplate);
      this.emptyTemplate = Handlebars.compile(emptyTemplate);
      this.loadingTemplate = Handlebars.compile(loadingTemplate);
      this.viewTemplate = Handlebars.compile(viewTemplate);
      console.debug('템플릿 컴파일 완료');
      
      // 뷰모델 주입 (마지막에 수행)
      console.debug('ICardNavigatorViewModel 서비스 해결 시도');
      this.viewModel = container.resolve<ICardNavigatorViewModel>('ICardNavigatorViewModel');
      console.debug('ICardNavigatorViewModel 서비스 해결 완료');

      console.debug('뷰 설정 시작');
      this.viewModel.setView(this);
      console.debug('뷰 설정 완료');

      console.debug('CardNavigatorView 생성자 완료');
    } catch (error) {
      console.error('CardNavigatorView 생성자 실패:', error);
      throw error;
    }
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
    try {
      this.logger.debug('카드 내비게이터 뷰 열기 시작');

      // 1. 이벤트 리스너 등록 (먼저 수행)
      this.registerEventListeners();

      // 2. 컨테이너 초기화
      this.containerEl.empty();

      // 3. 뷰 구조 생성
      const container = this.containerEl.createDiv({ cls: 'card-navigator-container' });
      
      // // 헤더 생성
      // const header = container.createDiv({ cls: 'card-navigator-header' });
      // header.createEl('h2', { text: '카드 내비게이터', cls: 'card-navigator-title' });

      // 툴바 생성
      const toolbar = container.createDiv({ cls: 'card-navigator-toolbar' });
      
      // 툴바 왼쪽 버튼들
      const toolbarLeft = toolbar.createDiv({ cls: 'card-navigator-toolbar-left' });
      this.createToolbarButton(toolbarLeft, 'folder', '폴더');
      this.createToolbarButton(toolbarLeft, 'tag', '태그');
      this.createToolbarButton(toolbarLeft, 'link', '링크');

      // 툴바 중앙 검색창
      const toolbarCenter = toolbar.createDiv({ cls: 'card-navigator-toolbar-center' });
      toolbarCenter.createEl('input', { 
        type: 'text', 
        cls: 'card-navigator-search',
        attr: { placeholder: '검색...' }
      });

      // 툴바 오른쪽 버튼들
      const toolbarRight = toolbar.createDiv({ cls: 'card-navigator-toolbar-right' });
      this.createToolbarButton(toolbarRight, 'sort', '정렬');
      this.createToolbarButton(toolbarRight, 'settings', '설정');

      // 그리드 컨테이너 생성
      container.createDiv({ cls: 'card-navigator-grid' });

      // 4. 로딩 상태 표시
      this.showLoading();

      // 5. 뷰모델 초기화 (마지막에 수행)
      await this.viewModel.initialize();

      this.logger.debug('카드 내비게이터 뷰 열기 완료');
    } catch (error) {
      this.errorHandler.handleError(error, '카드 내비게이터 뷰 열기 실패');
      // 에러 발생 시 사용자에게 알림
      this.showError('뷰를 열 수 없습니다. 오류가 발생했습니다.');
      throw error;
    }
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
      this.handleClick(evt);
    });

    this.registerDomEvent(this.containerEl, 'contextmenu', (evt: MouseEvent) => {
      this.handleContextMenu(evt);
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

  private handleClick(evt: MouseEvent): void {
    try {
      const target = evt.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        if (cardId) {
          this.viewModel.selectCard(cardId);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '클릭 이벤트 처리 실패');
    }
  }

  private handleContextMenu(evt: MouseEvent): void {
    try {
      const target = evt.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        if (cardId) {
          this.viewModel.showCardContextMenu(cardId, evt);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '컨텍스트 메뉴 이벤트 처리 실패');
    }
  }

  private handleDragStart(evt: DragEvent): void {
    try {
      const target = evt.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        if (cardId) {
          this.viewModel.startCardDrag(cardId, evt);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '드래그 시작 이벤트 처리 실패');
    }
  }

  private handleDragOver(evt: DragEvent): void {
    try {
      evt.preventDefault();
      const target = evt.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        if (cardId) {
          this.viewModel.handleCardDragOver(cardId, evt);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '드래그 오버 이벤트 처리 실패');
    }
  }

  private handleDrop(evt: DragEvent): void {
    try {
      evt.preventDefault();
      const target = evt.target as HTMLElement;
      const cardElement = target.closest('.card-navigator-card');
      
      if (cardElement) {
        const cardId = cardElement.getAttribute('data-card-id');
        if (cardId) {
          this.viewModel.handleCardDrop(cardId, evt);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, '드롭 이벤트 처리 실패');
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
  private renderCards(cards: readonly ICard[]): void {
    try {
      const gridContainer = this.containerEl.querySelector('.card-navigator-grid');
      if (!gridContainer) {
        throw new Error('카드 그리드 컨테이너를 찾을 수 없습니다.');
      }

      // 기존 카드 제거
      gridContainer.empty();

      if (cards.length === 0) {
        const emptyDiv = gridContainer.createDiv({ cls: 'card-navigator-empty' });
        emptyDiv.createEl('p', { text: '표시할 카드가 없습니다.' });
        return;
      }

      // 카드 생성
      cards.forEach(card => {
        const cardEl = gridContainer.createDiv({ 
          cls: 'card-navigator-card',
          attr: { 'data-card-id': card.id }
        });

        // 카드 헤더
        const header = cardEl.createDiv({ cls: 'card-navigator-card-header' });
        header.createEl('h3', { text: card.fileName });

        // 카드 본문
        const body = cardEl.createDiv({ cls: 'card-navigator-card-body' });
        if (card.firstHeader) {
          body.createEl('h4', { text: card.firstHeader });
        }
        body.createEl('p', { text: card.content });

        // 카드 태그
        if (card.tags.length > 0) {
          const tags = cardEl.createDiv({ cls: 'card-navigator-card-tags' });
          card.tags.forEach(tag => {
            tags.createEl('span', { text: tag, cls: 'card-navigator-card-tag' });
          });
        }

        // 카드 날짜
        const footer = cardEl.createDiv({ cls: 'card-navigator-card-footer' });
        footer.createEl('span', { text: card.updatedAt.toLocaleDateString() });
      });
    } catch (error) {
      this.errorHandler.handleError(error, '카드 목록 렌더링 실패');
    }
  }

  /**
   * 로딩 상태 렌더링
   */
  private renderLoading(): void {
    const container = this.containerEl.querySelector('.card-navigator-grid');
    if (container) {
      container.innerHTML = this.loadingTemplate({ message: '카드를 불러오는 중...' });
    }
  }

  /**
   * 카드셋 업데이트
   * @param cardSet 카드셋
   */
  public updateCardSet(cardSet: ICardSet): void {
    this.renderCards(cardSet.cards);
  }

  /**
   * 로딩 상태 표시
   */
  public showLoading(): void {
    this.renderLoading();
  }

  public showError(message: string): void {
    const container = this.containerEl.querySelector('.card-navigator-grid');
    if (container) {
      container.innerHTML = this.emptyTemplate({ message });
    }
  }
} 