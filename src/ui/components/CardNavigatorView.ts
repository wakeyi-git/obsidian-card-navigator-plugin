import { ItemView, WorkspaceLeaf, PaneType, App, TFile } from 'obsidian';
import { CardSet, CardSetType, CardFilter, ICardSetConfig } from '@/domain/models/CardSet';
import { Layout, LayoutType, LayoutDirection, ILayoutConfig } from '@/domain/models/Layout';
import { Preset } from '@/domain/models/Preset';
import { Card, ICardRenderConfig } from '@/domain/models/Card';
import { CardContainer } from '@/ui/components/CardContainer';
import { Toolbar } from '@/ui/toolbar/Toolbar';
import { ContextMenu } from '@/ui/components/ContextMenu';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardSetUpdatedEvent } from '@/domain/events/CardSetEvents';
import { ToolbarSearchEvent, ToolbarSortEvent, ToolbarSettingsEvent, ToolbarCardSetTypeChangeEvent, ToolbarPresetChangeEvent, ToolbarCreateEvent, ToolbarUpdateEvent, ToolbarCardRenderConfigChangeEvent, ToolbarLayoutConfigChangeEvent } from '@/domain/events/ToolbarEvents';
import { ICardSetService } from '@/domain/services/ICardSetService';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { CardRenderer } from '@/ui/components/CardRenderer';
import { Scroller } from '@/ui/components/Scroller';
import { CardInteractionManager } from '@/ui/components/CardInteractionManager';
import { KeyboardNavigator } from '@/ui/components/KeyboardNavigator';
import { ICardService } from '@/domain/services/ICardService';
import { ISearchService } from '@/domain/services/ISearchService';
import { IPresetService } from '@/domain/services/IPresetService';
import { LoggingService } from '@/infrastructure/services/LoggingService';
import CardNavigatorPlugin from '@/main';
import { LayoutUpdatedEvent } from '@/domain/events/LayoutEvents';

/**
 * Card Navigator 뷰 타입
 */
export const CARD_NAVIGATOR_VIEW_TYPE = 'card-navigator-view' as PaneType;

interface CardNavigatorViewProps {
  plugin: CardNavigatorPlugin;
  leaf: WorkspaceLeaf;
  eventDispatcher: DomainEventDispatcher;
  services: {
    card: ICardService;
    cardSet: ICardSetService;
    layout: ILayoutService;
    preset: IPresetService;
    search: ISearchService;
    logging: LoggingService;
  };
  ui: {
    cardRenderer: CardRenderer;
    scroller: Scroller;
    interactionManager: CardInteractionManager;
    keyboardNavigator: KeyboardNavigator;
  };
  app: App;
}

/**
 * Card Navigator 뷰 클래스
 */
export class CardNavigatorView extends ItemView {
  private _cardSet: CardSet | null = null;
  private _layout: Layout | null = null;
  private _preset: Preset | null = null;
  private _cardContainer: CardContainer | null = null;
  private _toolbar: Toolbar | null = null;
  private _contextMenu: ContextMenu | null = null;
  private _eventDispatcher: DomainEventDispatcher;
  private readonly _cardSetService: ICardSetService;
  private readonly _layoutService: ILayoutService;
  private readonly _cardRenderer: CardRenderer;
  private readonly _scroller: Scroller;
  private readonly _interactionManager: CardInteractionManager;
  private readonly _keyboardNavigator: KeyboardNavigator;
  private _container: HTMLElement | null = null;
  private _content: HTMLElement | null = null;
  private _searchInput: HTMLInputElement | null = null;
  private _sortSelect: HTMLSelectElement | null = null;
  private _layoutSelect: HTMLSelectElement | null = null;
  public isInitialized: boolean = false;
  private readonly _presetService: IPresetService;
  private _loggingService: LoggingService;
  private _eventListenersRegistered: boolean = false;
  private _cardSetInitialized: boolean = false;
  private _keydownHandler: (event: KeyboardEvent) => void;

  // 이벤트 핸들러
  private readonly _toolbarEventHandlers = {
    search: {
      handle: async (event: ToolbarSearchEvent) => {
        await this._handleSearch(event);
      }
    },
    sort: {
      handle: async (event: ToolbarSortEvent) => {
        await this._handleSort(event);
      }
    },
    cardSetTypeChange: {
      handle: async (event: ToolbarCardSetTypeChangeEvent) => {
        await this._handleCardSetTypeChange(event.type as CardSetType);
      }
    },
    presetChange: {
      handle: async (event: ToolbarPresetChangeEvent) => {
        await this._handlePresetChange(event.presetId);
      }
    },
    create: {
      handle: async (event: ToolbarCreateEvent) => {
        await this._handleCreate();
      }
    },
    update: {
      handle: async (event: ToolbarUpdateEvent) => {
        this._handleUpdate();
      }
    },
    cardRenderConfigChange: {
      handle: async (event: ToolbarCardRenderConfigChangeEvent) => {
        await this._handleCardRenderConfigChange(event.config);
      }
    },
    layoutConfigChange: {
      handle: async (event: ToolbarLayoutConfigChangeEvent) => {
        await this._handleLayoutConfigChange(event.config);
      }
    },
    settings: {
      handle: async (event: ToolbarSettingsEvent) => {
        this._handleSettings();
      }
    }
  };

  private readonly _cardSetEventHandlers = {
    cardSetUpdated: {
      handle: async (event: CardSetUpdatedEvent) => {
        if (event.cardSet.id === this._cardSet?.id) {
          this._handleCardSetUpdate(event);
        }
      }
    }
  };

  private readonly _layoutEventHandlers = {
    layoutUpdated: {
      handle: async (event: LayoutUpdatedEvent) => {
        if (event.layout.id === this._layout?.id) {
          await this._handleLayoutUpdate(event);
        }
      }
    }
  };

  constructor(private props: CardNavigatorViewProps) {
    super(props.leaf);
    this._eventDispatcher = props.eventDispatcher;
    this._cardSetService = props.services.cardSet;
    this._layoutService = props.services.layout;
    this._cardRenderer = props.ui.cardRenderer;
    this._scroller = props.ui.scroller;
    this._interactionManager = props.ui.interactionManager;
    this._keyboardNavigator = props.ui.keyboardNavigator;
    this._presetService = props.services.preset;
    this._loggingService = new LoggingService(props.app);
    this._keydownHandler = (event: KeyboardEvent) => {
      this._keyboardNavigator.handleKeyDown(event);
    };
  }

  /**
   * 뷰 타입 반환
   */
  getViewType(): string {
    return CARD_NAVIGATOR_VIEW_TYPE;
  }

  /**
   * 뷰 제목 반환
   */
  getDisplayText(): string {
    return 'Card Navigator';
  }

  /**
   * 뷰 아이콘 반환
   */
  getIcon(): string {
    return 'layers';
  }

  /**
   * 뷰 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this._loggingService.debug('이미 초기화된 뷰');
      return;
    }

    try {
      this._loggingService.startMeasure('뷰 초기화');
      this._loggingService.debug('뷰 초기화 시작');

      // 각 단계별 성능 측정
      const initSteps = [
        { name: '컨테이너', fn: () => this._initializeContainer() },
        { name: '툴바', fn: () => this._initializeToolbar() },
        { name: '카드 컨테이너', fn: () => this._initializeCardContainer() },
        { name: '이벤트 리스너', fn: () => this._initializeEventListeners() }
      ];

      // 순차적으로 초기화 실행
      for (const { name, fn } of initSteps) {
        this._loggingService.startMeasure(`${name} 초기화`);
        await fn();
        this._loggingService.endMeasure(`${name} 초기화`);
      }

      await this._loadInitialCardSet();
      this.isInitialized = true;
      
      this._loggingService.logMemoryUsage();
      this._loggingService.endMeasure('뷰 초기화');
      this._loggingService.info('뷰 초기화 완료');
    } catch (error) {
      this._loggingService.error('뷰 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 컨테이너 초기화
   */
  private async _initializeContainer(): Promise<void> {
    if (!this._container) {
      this._loggingService.startMeasure('컨테이너 생성');
      const viewContent = this.containerEl.querySelector('.view-content');
      if (!viewContent) {
        throw new Error('view-content를 찾을 수 없습니다.');
      }
      this._container = viewContent.createDiv('card-navigator-view');
      this._content = this._container.createDiv('card-navigator-content');
      this._loggingService.endMeasure('컨테이너 생성');
    }
  }

  /**
   * 툴바 초기화
   */
  private async _initializeToolbar(): Promise<void> {
    if (!this._toolbar) {
      this._loggingService.startMeasure('툴바 생성');
      await this._createToolbar();
      this._loggingService.endMeasure('툴바 생성');
    }
  }

  /**
   * 카드 컨테이너 초기화
   */
  private async _initializeCardContainer(): Promise<void> {
    if (!this._cardContainer) {
      this._loggingService.startMeasure('카드 컨테이너 생성');
      await this._createContent();
      this._loggingService.endMeasure('카드 컨테이너 생성');
    }

    if (this._cardContainer) {
      this._loggingService.startMeasure('카드 컨테이너 초기화');
      await this._cardContainer.initialize({
        onCardClick: (cardId: string) => this._handleCardClick(this._cardSet?.cards.find(c => c.id === cardId) || null),
        onCardContextMenu: (event: MouseEvent, cardId: string) => this._handleCardContextMenu(event, cardId),
        onCardDragStart: (event: DragEvent, cardId: string) => this._handleCardDragStart(event, cardId),
        onCardDragEnd: (event: DragEvent, cardId: string) => this._handleCardDragEnd(event, cardId),
        onCardDrop: (event: DragEvent, cardId: string) => this._handleCardDrop(event, cardId)
      });
      this._loggingService.endMeasure('카드 컨테이너 초기화');
    }
  }

  /**
   * 이벤트 리스너 초기화
   */
  private async _initializeEventListeners(): Promise<void> {
    if (this._eventListenersRegistered) {
      this._loggingService.debug('이벤트 리스너가 이미 등록됨');
      return;
    }

    this._loggingService.startMeasure('이벤트 리스너 등록');
    this._loggingService.debug('이벤트 리스너 등록 측정 시작');

    // 툴바 이벤트 핸들러 등록
    Object.entries(this._toolbarEventHandlers).forEach(([eventName, handler]) => {
      this._eventDispatcher.registerHandler(eventName, handler);
      this._loggingService.debug(`이벤트 핸들러 등록: ${eventName}`);
    });

    // 카드셋 이벤트 핸들러 등록
    Object.entries(this._cardSetEventHandlers).forEach(([eventName, handler]) => {
      this._eventDispatcher.registerHandler(eventName, handler);
      this._loggingService.debug(`이벤트 핸들러 등록: ${eventName}`);
    });

    // 레이아웃 이벤트 핸들러 등록
    Object.entries(this._layoutEventHandlers).forEach(([eventName, handler]) => {
      this._eventDispatcher.registerHandler(eventName, handler);
      this._loggingService.debug(`이벤트 핸들러 등록: ${eventName}`);
    });

    this._eventListenersRegistered = true;
    this._loggingService.endMeasure('이벤트 리스너 등록');
  }

  /**
   * 뷰 열기
   */
  async onOpen(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private _createCardElement(card: Card): HTMLElement {
    if (!this._content) {
      throw new Error('컨텐츠 컨테이너가 초기화되지 않았습니다.');
    }
    const cardEl = this._content.createDiv('card-navigator-card');
    
    // 카드 헤더
    const headerEl = cardEl.createDiv('card-navigator-card-header');
    headerEl.createEl('h3', { text: card.fileName });

    // 카드 내용
    const contentEl = cardEl.createDiv('card-navigator-card-content');
    contentEl.createEl('p', { text: card.content });

    // 카드 푸터
    const footerEl = cardEl.createDiv('card-navigator-card-footer');
    footerEl.createEl('span', { text: card.tags.join(', ') });

    // 클릭 이벤트
    cardEl.addEventListener('click', () => this._handleCardClick(card));

    return cardEl;
  }

  /**
   * 카드 클릭 처리
   */
  private async _handleCardClick(card: Card | null): Promise<void> {
    if (!card || !this._cardSet) return;

    this._cardSet.activeCardId = card.id;
    const file = this.app.vault.getAbstractFileByPath(card.filePath);
    
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf().openFile(file);
    }
  }

  /**
   * 뷰 정리
   */
  async onClose(): Promise<void> {
    this._loggingService.debug('뷰 정리 시작');
    this._cleanupResources();
    this._loggingService.debug('뷰 정리 완료');
  }

  /**
   * 카드셋 설정
   */
  async setCardSet(cardSet: CardSet | null): Promise<void> {
    this._cardSet = cardSet;
    if (this._cardContainer) {
      await this._cardContainer.setCardSet(cardSet?.id || '');
    }
    if (this._toolbar) {
      await this._toolbar.updateCardSet(cardSet);
    }
  }

  /**
   * 레이아웃 설정
   */
  async setLayout(layout: Layout | null): Promise<void> {
    this._layout = layout;
    if (this._cardContainer) {
      await this._cardContainer.setLayout(layout?.id || '');
    }
  }

  /**
   * 프리셋 설정
   */
  async setPreset(preset: Preset | null): Promise<void> {
    this._preset = preset;
    if (this._toolbar) {
      await this._toolbar.updatePreset(preset);
    }
  }

  /**
   * 설정 핸들러
   */
  private _handleSettings(): void {
    this._loggingService.debug('설정 UI 열기');
    // 설정 탭 열기
    (this.props.app as any).setting.open();
    (this.props.app as any).setting.openTab('card-navigator');
  }

  /**
   * 카드셋 타입 변경 핸들러
   */
  private async _handleCardSetTypeChange(type: CardSetType): Promise<void> {
    if (this._cardSet) {
      await this._cardSetService.updateCardSetType(this._cardSet.id, type);
    }
  }

  /**
   * 프리셋 변경 핸들러
   */
  private async _handlePresetChange(presetId: string): Promise<void> {
    const preset = await this._presetService.getPreset(presetId);
    if (preset) {
      await this.setPreset(preset);
    }
  }

  /**
   * 생성 핸들러
   */
  private async _handleCreate(): Promise<void> {
    const cardSet = await this._cardSetService.createCardSet(
      '새 카드셋',
      '새로 생성된 카드셋입니다.',
      {
        type: 'folder',
        value: '',
        includeSubfolders: false,
        sortBy: 'fileName',
        sortOrder: 'asc'
      },
      this._createDefaultLayoutConfig(),
      this._createDefaultCardRenderConfig()
    );
    await this.setCardSet(cardSet);
  }

  /**
   * 업데이트 핸들러
   */
  private _handleUpdate(): void {
    if (!this._cardSet) {
      return;
    }

    // 카드셋 업데이트
    this._cardSetService.updateCardSet(this._cardSet);
  }

  /**
   * 뷰 상태 저장
   */
  public getState(): any {
    return {
      cardSetType: this._cardSet?.config.type || 'folder',
      includeSubfolders: this._cardSet?.config.includeSubfolders ?? true,
      sortBy: this._cardSet?.config.sortBy || 'fileName',
      sortOrder: this._cardSet?.config.sortOrder || 'asc',
      layout: {
        type: this._cardSet?.layoutConfig.type || 'grid',
        cardWidth: this._cardSet?.layoutConfig.cardWidth || 300,
        cardHeight: this._cardSet?.layoutConfig.cardHeight || 200
      }
    };
  }

  /**
   * 뷰 상태 복원
   */
  public async setState(state: unknown, result: any): Promise<void> {
    if (state && typeof state === 'object') {
      const typedState = state as {
        cardSetType?: string;
        includeSubfolders?: boolean;
        sortBy?: string;
        sortOrder?: string;
        layout?: {
          type?: string;
          cardWidth?: number;
          cardHeight?: number;
        };
      };

      if (this._cardSet) {
        if (typedState.cardSetType) {
          this._cardSet.config.type = typedState.cardSetType as CardSetType;
        }
        if (typedState.includeSubfolders !== undefined) {
          this._cardSet.config.includeSubfolders = typedState.includeSubfolders;
        }
        if (typedState.sortBy) {
          this._cardSet.config.sortBy = typedState.sortBy as ICardSetConfig['sortBy'];
        }
        if (typedState.sortOrder) {
          this._cardSet.config.sortOrder = typedState.sortOrder as 'asc' | 'desc';
        }
        
        if (typedState.layout) {
          if (typedState.layout.type) {
            this._cardSet.layoutConfig.type = typedState.layout.type as Layout['config']['type'];
          }
          if (typedState.layout.cardWidth) {
            this._cardSet.layoutConfig.cardWidth = typedState.layout.cardWidth;
          }
          if (typedState.layout.cardHeight) {
            this._cardSet.layoutConfig.cardHeight = typedState.layout.cardHeight;
          }
        }

        await this._cardSetService.updateCardSet(this._cardSet);
      }
    }
  }

  /**
   * 기본 레이아웃 설정 생성
   */
  private _createDefaultLayoutConfig(): ILayoutConfig {
    return {
      type: LayoutType.GRID,
      direction: LayoutDirection.VERTICAL,
      fixedHeight: true,
      minCardWidth: 200,
      minCardHeight: 150,
      cardWidth: 200,
      cardHeight: 150,
      gap: 16,
      padding: 16,
      viewportWidth: 800,
      viewportHeight: 600
    };
  }

  /**
   * 키보드 내비게이션 활성화/비활성화
   */
  public setKeyboardNavigationEnabled(enabled: boolean): void {
    this._loggingService.debug('키보드 내비게이션 설정:', enabled);
    if (this._keyboardNavigator) {
      this._keyboardNavigator.setEnabled(enabled);
    }
  }

  /**
   * 활성 파일의 카드로 포커스
   */
  public async focusActiveFileCard(): Promise<void> {
    this._loggingService.debug('활성 파일의 카드로 포커스 시작');

    try {
      const activeFile = this.props.app.workspace.getActiveFile();
      if (!activeFile || !this._cardContainer) {
        this._loggingService.warn('활성 파일이 없거나 카드 컨테이너가 초기화되지 않음');
        return;
      }

      const card = await this.props.services.card.getCardByPath(activeFile.path);
      if (!card) {
        this._loggingService.warn('활성 파일에 대한 카드를 찾을 수 없음');
        return;
      }

      await this._cardContainer.setActiveCard(card);
      this._cardContainer.focus();
      this._loggingService.debug('활성 파일의 카드로 포커스 완료');
    } catch (error) {
      this._loggingService.error('활성 파일의 카드로 포커스 실패:', error);
      throw error;
    }
  }

  /**
   * 컨테이너에 포커스
   */
  public focusContainer(): void {
    this._loggingService.debug('컨테이너 포커스');
    this.containerEl.focus();
    if (this._cardContainer) {
      this._cardContainer.focus();
    }
  }

  /**
   * 키보드 내비게이션 상태 반환
   */
  public isKeyboardNavigationEnabled(): boolean {
    return this._keyboardNavigator.isEnabled;
  }

  private async _handleCardRenderConfigChange(config: ICardRenderConfig): Promise<void> {
    if (!this._cardSet) return;
    this._cardSet.cardRenderConfig = config;
    await this._cardSetService.updateCardSet(this._cardSet);
    this._renderCards();
  }

  private async _handleLayoutConfigChange(config: ILayoutConfig): Promise<void> {
    if (!this._cardSet) return;
    this._cardSet.layoutConfig = config;
    await this._cardSetService.updateCardSet(this._cardSet);
    this._renderCards();
  }

  /**
   * 초기 카드셋 로드
   */
  private async _loadInitialCardSet(): Promise<void> {
    if (this._cardSetInitialized) {
      this._loggingService.debug('초기 카드셋이 이미 로드됨');
      return;
    }

    this._loggingService.debug('초기 카드셋 로드 시작');
    const activeFile = this.app.workspace.getActiveFile();
    
    if (!activeFile) {
      this._loggingService.debug('활성 파일이 없음');
      return;
    }

    this._loggingService.debug(`활성 파일: ${activeFile.path}`);
    
    try {
      const cardSet = await this._createInitialCardSet(activeFile);
      await this.setCardSet(cardSet);
      this._cardSetInitialized = true;
    } catch (error) {
      this._loggingService.error('초기 카드셋 로드 실패:', error);
    }

    this._loggingService.debug('초기 카드셋 로드 완료');
  }

  private _createDefaultCardRenderConfig(): ICardRenderConfig {
    return {
      header: {
        showFileName: true,
        showFirstHeader: true,
        showTags: true,
        showCreatedDate: false,
        showUpdatedDate: false,
        showProperties: [],
        renderMarkdown: true
      },
      body: {
        showFileName: false,
        showFirstHeader: false,
        showContent: true,
        showTags: false,
        showCreatedDate: false,
        showUpdatedDate: false,
        showProperties: [],
        contentLength: 200,
        renderMarkdown: true
      },
      footer: {
        showFileName: true,
        showFirstHeader: false,
        showTags: false,
        showCreatedDate: false,
        showUpdatedDate: false,
        showProperties: [],
        renderMarkdown: true
      },
      renderAsHtml: true
    };
  }

  private _handleCardContextMenu(event: MouseEvent, cardId: string): void {
    event.preventDefault();
    // 컨텍스트 메뉴 구현
  }

  private _handleCardDragStart(event: DragEvent, cardId: string): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('text/plain', cardId);
  }

  private _handleCardDragEnd(event: DragEvent, cardId: string): void {
    // 드래그 종료 처리
  }

  private _handleCardDrop(event: DragEvent, cardId: string): void {
    event.preventDefault();
    if (!event.dataTransfer) return;
    
    const sourceCardId = event.dataTransfer.getData('text/plain');
    if (sourceCardId && sourceCardId !== cardId) {
      // 카드 간 링크 생성 로직 구현
    }
  }

  /**
   * 카드 컨테이너에 포커스
   */
  public focus(): void {
    this._cardContainer?.focus();
  }

  /**
   * 레이아웃 업데이트 핸들러
   */
  private async _handleLayoutUpdate(event: LayoutUpdatedEvent): Promise<void> {
    if (!this._cardSet) return;
    this._cardSet.layoutConfig = event.layout.config;
    await this._cardSetService.updateCardSet(this._cardSet);
    this._renderCards();
  }

  private async _createAndSaveDefaultLayout(): Promise<Layout> {
    const layoutConfig = this._createDefaultLayoutConfig();
    const layout = new Layout(
      crypto.randomUUID(),
      '기본 레이아웃',
      '기본 그리드 레이아웃입니다.',
      layoutConfig,
      undefined,
      []
    );
    await this._layoutService.updateLayout(layout);
    return layout;
  }

  private async _createInitialCardSet(activeFile: TFile): Promise<CardSet> {
    const layoutConfig = this._createDefaultLayoutConfig();
    const cardRenderConfig = this._createDefaultCardRenderConfig();

    return this._cardSetService.createCardSet(
      '활성 폴더',
      '현재 활성화된 폴더의 노트들을 표시합니다.',
      {
        type: 'folder',
        value: activeFile.parent?.path || '',
        includeSubfolders: true,
        sortBy: 'fileName',
        sortOrder: 'asc'
      },
      layoutConfig,
      cardRenderConfig
    );
  }

  private _cleanupResources(): void {
    this._loggingService.debug('리소스 정리 시작');
    
    // 이벤트 리스너 해제
    if (this._eventListenersRegistered) {
      this._unregisterEventListeners();
      this._eventListenersRegistered = false;
    }

    // 카드셋 초기화
    this._cardSetInitialized = false;
    
    // 기타 리소스 정리
    if (this._cardContainer) {
      this._cardContainer.destroy();
      this._cardContainer = null;
    }

    if (this._toolbar) {
      this._toolbar.destroy();
      this._toolbar = null;
    }

    if (this._contextMenu) {
      this._contextMenu.destroy();
      this._contextMenu = null;
    }

    this._loggingService.debug('리소스 정리 완료');
  }

  /**
   * 이벤트 리스너 해제
   */
  private _unregisterEventListeners(): void {
    if (!this._eventListenersRegistered) {
      this._loggingService.debug('이벤트 리스너가 이미 해제됨');
      return;
    }

    this._loggingService.debug('이벤트 리스너 해제 시작');

    // 툴바 이벤트 핸들러 해제
    Object.entries(this._toolbarEventHandlers).forEach(([eventName, handler]) => {
      this._eventDispatcher.unregisterHandler(eventName, handler);
      this._loggingService.debug(`이벤트 핸들러 해제: ${eventName}`);
    });

    // 카드셋 이벤트 핸들러 해제
    Object.entries(this._cardSetEventHandlers).forEach(([eventName, handler]) => {
      this._eventDispatcher.unregisterHandler(eventName, handler);
      this._loggingService.debug(`이벤트 핸들러 해제: ${eventName}`);
    });

    // 레이아웃 이벤트 핸들러 해제
    Object.entries(this._layoutEventHandlers).forEach(([eventName, handler]) => {
      this._eventDispatcher.unregisterHandler(eventName, handler);
      this._loggingService.debug(`이벤트 핸들러 해제: ${eventName}`);
    });

    // DOM 이벤트 리스너 해제
    this._container?.removeEventListener('keydown', this._keydownHandler);

    this._eventListenersRegistered = false;
    this._loggingService.debug('이벤트 리스너 해제 완료');
  }

  private async _handleSearch(event: ToolbarSearchEvent): Promise<void> {
    if (!this._cardSet) return;

    const searchQuery = event.query.toLowerCase();
    const filter: CardFilter = {
      type: 'search',
      criteria: {
        value: searchQuery
      }
    };

    await this._cardSetService.filterCards(this._cardSet.id, filter);
  }

  private async _handleSort(event: ToolbarSortEvent): Promise<void> {
    if (!this._cardSet) return;

    this._cardSet.config.sortBy = event.criterion as ICardSetConfig['sortBy'];
    this._cardSet.config.sortOrder = event.order;
    this._cardSet.sortCards();
    this._renderCards();
  }

  private _handleCardSetUpdate(event: CardSetUpdatedEvent): void {
    if (event.cardSet.id === this._cardSet?.id) {
      this._renderCards();
    }
  }

  private _renderCards(): void {
    if (!this._cardSet || !this._cardContainer) return;
    this._cardContainer.setCardSet(this._cardSet.id);
  }

  private _createToolbar(): void {
    this._loggingService.debug('툴바 생성 시작');
    if (!this._content) {
      throw new Error('컨텐츠 컨테이너가 초기화되지 않았습니다.');
    }
    
    // 툴바 컨테이너 생성
    const toolbarContainer = this._content.createDiv('card-navigator-toolbar');
    
    // 툴바 초기화
    this._toolbar = new Toolbar(
      this.props.app,
      toolbarContainer,
      {
        cardSetType: 'folder',
        searchQuery: '',
        sortBy: 'fileName',
        sortOrder: 'asc',
        cardRenderConfig: this._createDefaultCardRenderConfig(),
        layoutConfig: this._createDefaultLayoutConfig(),
        selectedPreset: null
      },
      this._eventDispatcher,
      this.props.services.search,
      this._presetService
    );
    
    this._loggingService.debug('툴바 생성 완료');
  }

  private _createContent(): void {
    this._loggingService.debug('카드 컨테이너 생성 시작');
    if (!this._content) {
      throw new Error('컨텐츠 컨테이너가 초기화되지 않았습니다.');
    }

    // 카드 컨테이너를 생성하고 컨텐츠에 추가
    const cardContainerEl = this._content.createDiv('card-container');
    const cardListEl = cardContainerEl.createDiv('card-list');
    
    this._cardContainer = new CardContainer({
      app: this.app,
      cardService: this.props.services.card,
      cardSetService: this._cardSetService,
      layoutService: this._layoutService,
      eventDispatcher: this._eventDispatcher,
      loggingService: this._loggingService,
      cardRenderer: this._cardRenderer,
      scroller: this._scroller,
      interactionManager: this._interactionManager,
      keyboardNavigator: this._keyboardNavigator,
      element: cardListEl
    });
    
    this._keyboardNavigator.setCardContainer(this._cardContainer);
    this._loggingService.debug('카드 컨테이너 생성 완료');
  }

  /**
   * 카드 업데이트
   */
  async updateCard(file: TFile): Promise<void> {
    if (!this._cardContainer) {
      this._loggingService.warn('카드 컨테이너가 초기화되지 않음');
      return;
    }

    try {
      const cardElement = await this._cardRenderer.renderCardFromFile(file);
      if (!cardElement) {
        this._loggingService.warn('카드 요소를 렌더링할 수 없음');
        return;
      }

      const cardId = cardElement.dataset.cardId;
      if (!cardId) {
        this._loggingService.warn('카드 ID를 찾을 수 없음');
        return;
      }

      const card = await this.props.services.card.getCardById(cardId);
      if (!card) {
        this._loggingService.warn('카드를 찾을 수 없음');
        return;
      }

      await this._cardContainer.updateCard(file);
      this._loggingService.debug('카드 업데이트 완료');
    } catch (error) {
      this._loggingService.error('카드 업데이트 실패:', error);
      throw error;
    }
  }
}