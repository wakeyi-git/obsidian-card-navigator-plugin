import { ItemView, WorkspaceLeaf, PaneType, App, Setting, TFile } from 'obsidian';
import { CardSet, CardSetType, CardFilter, ICardSetConfig } from '@/domain/models/CardSet';
import { Layout, LayoutType, LayoutDirection, ILayoutConfig } from '@/domain/models/Layout';
import { Preset } from '@/domain/models/Preset';
import { Card, ICardRenderConfig } from '@/domain/models/Card';
import { CardContainer } from '@/ui/components/CardContainer';
import { Toolbar } from '@/ui/toolbar/Toolbar';
import { ContextMenu } from '@/ui/components/ContextMenu';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardEvent, CardCreatedEvent, CardUpdatedEvent, CardDeletedEvent, CardEventType } from '@/domain/events/CardEvents';
import { CardSetEvent, CardSetCreatedEvent, CardSetUpdatedEvent, CardSetEventType } from '@/domain/events/CardSetEvents';
import { LayoutEvent, LayoutCreatedEvent, LayoutUpdatedEvent, LayoutEventType } from '@/domain/events/LayoutEvents';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { ToolbarEventType, ToolbarSearchEvent, ToolbarSortEvent, ToolbarSettingsEvent, ToolbarCardSetTypeChangeEvent, ToolbarPresetChangeEvent, ToolbarCreateEvent, ToolbarUpdateEvent, ToolbarCardRenderConfigChangeEvent, ToolbarLayoutConfigChangeEvent } from '@/domain/events/ToolbarEvents';
import { ICardSetService } from '@/domain/services/CardSetService';
import { ILayoutService } from '@/domain/services/LayoutService';
import { CardRenderer } from '@/ui/components/CardRenderer';
import { Scroller } from '@/ui/components/Scroller';
import { CardInteractionManager } from '@/ui/components/CardInteractionManager';
import { KeyboardNavigator } from '@/ui/components/KeyboardNavigator';
import { ICardService } from '@/domain/services/CardService';
import { ISearchService } from '@/domain/services/SearchService';
import { CardSetUpdatedEvent as DomainCardSetUpdatedEvent } from '@/domain/events/DomainEvent';
import { ViewInitializedEvent } from '@/domain/events/ViewEvents';

/**
 * Card Navigator 뷰 타입
 */
export const CARD_NAVIGATOR_VIEW_TYPE = 'card-navigator-view' as PaneType;

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
  private _container: HTMLElement;
  private _content: HTMLElement;
  private _searchInput: HTMLInputElement | null = null;
  private _sortSelect: HTMLSelectElement | null = null;
  private _layoutSelect: HTMLSelectElement | null = null;
  public isInitialized: boolean = false;

  constructor(
    leaf: WorkspaceLeaf,
    eventDispatcher: DomainEventDispatcher,
    cardSetService: ICardSetService,
    layoutService: ILayoutService,
    cardRenderer: CardRenderer,
    scroller: Scroller,
    interactionManager: CardInteractionManager,
    keyboardNavigator: KeyboardNavigator,
    public readonly app: App,
    private readonly cardService: ICardService,
    private readonly searchService: ISearchService
  ) {
    super(leaf);
    this._eventDispatcher = eventDispatcher;
    this._cardSetService = cardSetService;
    this._layoutService = layoutService;
    this._cardRenderer = cardRenderer;
    this._scroller = scroller;
    this._interactionManager = interactionManager;
    this._keyboardNavigator = keyboardNavigator;
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
  public async initialize(): Promise<void> {
    try {
      // 기본 카드셋 생성
      const defaultCardSet = this._cardSetService.createCardSet(
        'Default',
        'Default card set',
        {
          type: 'folder',
          value: '',
          includeSubfolders: true,
          linkConfig: {
            type: 'outgoing',
            depth: 2
          },
          sortBy: 'fileName',
          sortOrder: 'asc'
        }
      );

      // 기본 레이아웃 생성
      const defaultLayout = await this._layoutService.createLayout(
        'Default',
        'Default layout',
        this._createDefaultLayoutConfig()
      );

      // 카드셋 설정
      await this._cardSetService.setActiveCard(defaultCardSet.id, defaultCardSet.cards[0]?.id);

      // 카드셋 설정
      this.setCardSet(defaultCardSet);

      // 레이아웃 설정
      this.setLayout(defaultLayout);

      // 레이아웃 계산
      await this._layoutService.calculateLayout(defaultLayout, defaultCardSet.cards);

      // 초기화 완료
      this.isInitialized = true;

      // 이벤트 발생
      this._eventDispatcher.dispatch(new ViewInitializedEvent());
    } catch (error) {
      console.error('Failed to initialize view:', error);
      throw error;
    }
  }

  /**
   * 뷰 초기화
   */
  async onOpen(): Promise<void> {
    this._container = this.containerEl.children[1] as HTMLElement;
    this._container.empty();
    this._container.createEl('h4', { text: 'Card Navigator' });

    this._createToolbar();
    this._createContent();
    this._setupEventListeners();
  }

  private _createToolbar(): void {
    const toolbarContainer = this._container.createDiv('card-navigator-toolbar');
    this._toolbar = new Toolbar(
      this.app,
      toolbarContainer,
      {
        cardSetType: 'folder',
        searchQuery: '',
        sortBy: 'fileName',
        sortOrder: 'asc',
        cardRenderConfig: {
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
        },
        layoutConfig: {
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
        },
        selectedPreset: null
      },
      this._eventDispatcher,
      this.searchService
    );
  }

  private _createContent(): void {
    this._content = this._container.createDiv('card-navigator-content');
  }

  /**
   * 이벤트 리스너 설정
   */
  private _setupEventListeners(): void {
    // 키보드 이벤트
    this._container.addEventListener('keydown', (event: KeyboardEvent) => {
      this._keyboardNavigator.handleKeyDown(event);
    });

    // 카드 클릭 이벤트
    this._interactionManager.onCardClick = (card: Card) => {
      this._handleCardClick(card);
    };

    // 카드 열기 이벤트
    this._keyboardNavigator.onCardOpen = (card: Card) => {
      this._handleCardClick(card);
    };

    // 카드셋 업데이트 이벤트
    this._eventDispatcher.register(CardSetEventType.CARD_SET_UPDATED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof CardSetUpdatedEvent) {
          this._handleCardSetUpdate(event);
        }
      }
    });

    // 툴바 이벤트
    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_SEARCH, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarSearchEvent) {
          await this._handleSearch(event);
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_SORT, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarSortEvent) {
          await this._handleSort(event);
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_CARD_SET_TYPE_CHANGE, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarCardSetTypeChangeEvent) {
          await this._handleCardSetTypeChange(event.type as CardSetType);
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_PRESET_CHANGE, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarPresetChangeEvent) {
          await this._handlePresetChange(event.presetId);
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_CREATE, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarCreateEvent) {
          await this._handleCreate();
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_UPDATE, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarUpdateEvent) {
          await this._handleUpdate();
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_CARD_RENDER_CONFIG_CHANGE, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarCardRenderConfigChangeEvent) {
          await this._handleCardRenderConfigChange(event.config);
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_LAYOUT_CONFIG_CHANGE, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarLayoutConfigChangeEvent) {
          await this._handleLayoutConfigChange(event.config);
        }
      }
    });
  }

  private async _handleSearch(event: ToolbarSearchEvent): Promise<void> {
    const query = event.query;
    if (!this._cardSet) return;

    // 현재 카드셋의 모든 카드 ID를 가져옵니다
    const cardIds = this._cardSet.cards.map(card => card.id);
    
    // 각 카드의 상세 정보를 가져옵니다
    const cards = await Promise.all(
      cardIds.map(id => this.cardService.getCard(id))
    );

    // 검색어로 필터링합니다
    const filteredCards = cards.filter((card: Card) => 
      card.fileName.toLowerCase().includes(query.toLowerCase()) ||
      card.content.toLowerCase().includes(query.toLowerCase())
    );

    // 필터링된 카드 ID로 카드셋을 필터링합니다
    this._cardSet.filterCards((card: Card) => 
      filteredCards.some((c: Card) => c.id === card.id)
    );
    
    this._renderCards();
  }

  private async _handleSort(event: ToolbarSortEvent): Promise<void> {
    if (!this._cardSet) return;

    this._cardSet.config.sortBy = event.criterion as ICardSetConfig['sortBy'];
    this._cardSet.config.sortOrder = event.order;
    this._cardSet.sortCards();
    this._renderCards();
  }

  private async _handleLayoutChange(event: Event): Promise<void> {
    const layout = (event.target as HTMLSelectElement).value as Layout['config']['type'];
    if (!this._cardSet) return;

    this._cardSet.layoutConfig.type = layout;
    this._renderCards();
  }

  private _handleCardSetUpdate(event: CardSetUpdatedEvent): void {
    if (event.cardSet.id === this._cardSet?.id) {
      this._renderCards();
    }
  }

  private _renderCards(): void {
    if (!this._cardSet) return;

    this._content.empty();
    const cards = this._cardSet.cards;

    cards.forEach(card => {
      const cardEl = this._createCardElement(card);
      this._content.appendChild(cardEl);
    });
  }

  private _createCardElement(card: Card): HTMLElement {
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
  private async _handleCardClick(card: Card): Promise<void> {
    if (!this._cardSet) return;

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
    // 이벤트 리스너 해제
    this._unregisterEventListeners();

    // 컴포넌트 정리
    this._cardContainer?.cleanup();
    this._toolbar?.cleanup();
    this._contextMenu?.cleanup();
  }

  /**
   * 카드셋 설정
   */
  setCardSet(cardSet: CardSet | null): void {
    this._cardSet = cardSet;
    this._cardContainer?.setCardSet(cardSet?.id || '');
    this._toolbar?.updateCardSet(cardSet);
  }

  /**
   * 레이아웃 설정
   */
  setLayout(layout: Layout | null): void {
    this._layout = layout;
    this._cardContainer?.setLayout(layout?.id || '');
  }

  /**
   * 프리셋 설정
   */
  setPreset(preset: Preset | null): void {
    this._preset = preset;
    this._toolbar?.updatePreset(preset);
  }

  /**
   * 이벤트 리스너 등록
   */
  private _registerEventListeners(): void {
    // 카드셋 이벤트
    this._eventDispatcher.register(CardSetEventType.CARD_SET_CREATED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof CardSetCreatedEvent) {
          this.setCardSet(event.cardSet);
        }
      }
    });

    this._eventDispatcher.register(CardSetEventType.CARD_SET_UPDATED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof CardSetUpdatedEvent) {
          this.setCardSet(event.cardSet);
        }
      }
    });

    // 레이아웃 이벤트
    this._eventDispatcher.register(LayoutEventType.LAYOUT_CREATED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof LayoutCreatedEvent) {
          this.setLayout(event.layout);
        }
      }
    });

    this._eventDispatcher.register(LayoutEventType.LAYOUT_UPDATED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof LayoutUpdatedEvent) {
          this.setLayout(event.layout);
        }
      }
    });

    // 카드 이벤트
    this._eventDispatcher.register(CardEventType.CARD_CREATED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof CardCreatedEvent) {
          await this._cardContainer?.setCardSet(this._cardSet?.id || '');
        }
      }
    });

    this._eventDispatcher.register(CardEventType.CARD_UPDATED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof CardUpdatedEvent) {
          await this._cardContainer?.setCardSet(this._cardSet?.id || '');
        }
      }
    });

    this._eventDispatcher.register(CardEventType.CARD_DELETED, {
      handle: async (event: DomainEvent) => {
        if (event instanceof CardDeletedEvent) {
          await this._cardContainer?.setCardSet(this._cardSet?.id || '');
        }
      }
    });

    // 툴바 이벤트
    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_SEARCH, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarSearchEvent) {
          await this._handleSearch(event);
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_SORT, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarSortEvent) {
          await this._handleSort(event);
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_SETTINGS, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarSettingsEvent) {
          this._handleSettings();
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_CARD_SET_TYPE_CHANGE, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarCardSetTypeChangeEvent) {
          await this._handleCardSetTypeChange(event.type as CardSetType);
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_PRESET_CHANGE, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarPresetChangeEvent) {
          await this._handlePresetChange(event.presetId);
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_CREATE, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarCreateEvent) {
          await this._handleCreate();
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_UPDATE, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarUpdateEvent) {
          await this._handleUpdate();
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_CARD_RENDER_CONFIG_CHANGE, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarCardRenderConfigChangeEvent) {
          await this._handleCardRenderConfigChange(event.config);
        }
      }
    });

    this._eventDispatcher.register(ToolbarEventType.TOOLBAR_LAYOUT_CONFIG_CHANGE, {
      handle: async (event: DomainEvent) => {
        if (event instanceof ToolbarLayoutConfigChangeEvent) {
          await this._handleLayoutConfigChange(event.config);
        }
      }
    });
  }

  /**
   * 이벤트 리스너 해제
   */
  private _unregisterEventListeners(): void {
    // TODO: 이벤트 리스너 해제 로직 구현
  }

  /**
   * 설정 핸들러
   */
  private _handleSettings(): void {
    // 설정 탭 열기
    (this.app as any).setting.open();
    (this.app as any).setting.openTab('card-navigator');
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
  private _handlePresetChange(presetId: string): void {
    if (!this._cardSet) {
      return;
    }

    // 프리셋 적용
    this._cardSetService.applyPreset(this._cardSet.id, presetId);
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
      }
    );
    this.setCardSet(cardSet);
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
   * 특정 카드로 스크롤
   * @param filePath 카드의 파일 경로
   */
  public async scrollToCard(filePath: string): Promise<void> {
    const card = await this.cardService.getCardByPath(filePath);
    if (card) {
      await this._scroller.scrollToCard(card.id);
      this._interactionManager.focusCard(card);
    }
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
    this._keyboardNavigator.setEnabled(enabled);
  }

  /**
   * 활성 파일의 카드로 포커스
   */
  public focusActiveFileCard(): void {
    this._keyboardNavigator.focusActiveFileCard();
  }

  /**
   * 컨테이너에 포커스
   */
  public focusContainer(): void {
    this._container.focus();
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
}