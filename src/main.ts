import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, PaneType } from 'obsidian';
import { CardNavigatorSettingsTab, ICardNavigatorSettings } from '@/ui/components/SettingsTab';
import { CardNavigatorView, CARD_NAVIGATOR_VIEW_TYPE } from '@/ui/components/CardNavigatorView';
import { CardService } from '@/domain/services/CardService';
import { CardSetService } from '@/domain/services/CardSetService';
import { LayoutService } from '@/domain/services/LayoutService';
import { PresetService } from '@/domain/services/PresetService';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardRenderer } from '@/ui/components/CardRenderer';
import { Scroller } from '@/ui/components/Scroller';
import { CardInteractionManager } from '@/ui/components/CardInteractionManager';
import { KeyboardNavigator } from '@/ui/components/KeyboardNavigator';
import { CardRepository } from '@/domain/repositories/CardRepository';
import { CardSetRepository } from '@/domain/repositories/CardSetRepository';
import { LayoutRepository } from '@/infrastructure/repositories/LayoutRepository';
import { PresetRepository } from '@/infrastructure/repositories/PresetRepository';
import { CardEventHandler } from '@/domain/events/CardEventHandler';
import { CardSetEventHandler } from '@/domain/events/CardSetEventHandler';
import { LayoutEventHandler } from '@/domain/events/LayoutEventHandler';
import { PresetEventHandler } from '@/domain/events/PresetEventHandler';
import { SearchService } from '@/domain/services/SearchService';

/**
 * 카드 내비게이터 플러그인
 */
export default class CardNavigatorPlugin extends Plugin {
  private settings: ICardNavigatorSettings;
  private cardService: CardService | null = null;
  private cardSetService: CardSetService | null = null;
  private layoutService: LayoutService | null = null;
  private presetService: PresetService | null = null;
  private eventDispatcher: DomainEventDispatcher | null = null;
  private view: CardNavigatorView | null = null;
  private cardRenderer: CardRenderer | null = null;
  private scroller: Scroller | null = null;
  private interactionManager: CardInteractionManager | null = null;
  private keyboardNavigator: KeyboardNavigator | null = null;
  private searchService: SearchService | null = null;
  private cardSetRepository: CardSetRepository | null = null;

  /**
   * 플러그인 활성화
   */
  async onload(): Promise<void> {
    try {
      // 설정 로드
      await this.loadSettings();

      // 서비스 초기화
      this.eventDispatcher = new DomainEventDispatcher();
      
      // 리포지토리 초기화
      const cardRepository = new CardRepository(this.app);
      const layoutRepository = new LayoutRepository(this.app);
      const presetRepository = new PresetRepository(this.app);

      // 서비스 초기화
      this.cardService = new CardService(this.app, cardRepository, this.eventDispatcher);
      this.presetService = new PresetService(this.eventDispatcher);
      this.layoutService = new LayoutService(this.eventDispatcher);
      
      // CardSetRepository 초기화
      this.cardSetRepository = new CardSetRepository(
        this.app,
        cardRepository,
        this.cardService
      );
      
      // CardSetService는 CardService와 PresetService에 의존
      this.cardSetService = new CardSetService(
        this.app,
        this.cardService,
        this.eventDispatcher,
        this.presetService
      );

      // SearchService는 CardService와 CardSetService에 의존
      this.searchService = new SearchService(
        this.app,
        this.cardSetRepository
      );

      // UI 컴포넌트 초기화
      this.cardRenderer = new CardRenderer(this.app, this.eventDispatcher);
      this.scroller = new Scroller();
      this.interactionManager = new CardInteractionManager(this.eventDispatcher);
      this.keyboardNavigator = new KeyboardNavigator();

      // 이벤트 핸들러 등록
      this._registerEventHandlers();

      // 뷰 등록
      this.registerView(CARD_NAVIGATOR_VIEW_TYPE, (leaf) => {
        if (this.eventDispatcher && this.cardSetService && this.layoutService && 
            this.cardRenderer && this.scroller && this.interactionManager && 
            this.keyboardNavigator && this.cardService && this.searchService) {
          this.view = new CardNavigatorView(
            leaf,
            this.eventDispatcher,
            this.cardSetService,
            this.layoutService,
            this.cardRenderer,
            this.scroller,
            this.interactionManager,
            this.keyboardNavigator,
            this.app,
            this.cardService,
            this.searchService
          );
          return this.view;
        }
        throw new Error('Required services or components are not initialized');
      });

      // 명령어 등록
      this.addCommand({
        id: 'open-card-navigator',
        name: 'Open Card Navigator',
        callback: () => {
          this.activateView();
        }
      });

      // 리본 메뉴 아이콘 추가
      this.addRibbonIcon('layers', 'Card Navigator', () => {
        this.activateView();
      });

      console.log('Card Navigator plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Card Navigator plugin:', error);
    }
  }

  /**
   * 뷰 활성화
   */
  private async activateView(): Promise<void> {
    try {
      const { workspace } = this.app;
      let leaf: WorkspaceLeaf | null = null;
      const leaves = workspace.getLeavesOfType(CARD_NAVIGATOR_VIEW_TYPE);

      if (leaves.length > 0) {
        // 이미 존재하는 리프 사용
        leaf = leaves[0];
      } else {
        // 오른쪽 사이드바에 새 리프 생성
        leaf = workspace.getRightLeaf(false);
        if (!leaf) {
          console.error('Failed to create leaf');
          return;
        }

        await leaf.setViewState({
          type: CARD_NAVIGATOR_VIEW_TYPE,
          active: true,
          state: {
            cardSetType: this.settings.defaultCardSetType,
            includeSubfolders: this.settings.includeSubfolders,
            linkLevel: this.settings.linkLevel,
            sortBy: this.settings.sortBy,
            sortOrder: this.settings.sortOrder,
            layout: {
              fixedHeight: this.settings.layout.fixedHeight,
              minCardWidth: this.settings.layout.minCardWidth,
              minCardHeight: this.settings.layout.minCardHeight
            }
          }
        });
      }

      if (leaf) {
        // 리프 표시
        workspace.revealLeaf(leaf);

        // 뷰 초기화
        const view = leaf.view as CardNavigatorView;
        if (view && !view.isInitialized) {
          await view.initialize();
        }
      }
    } catch (error) {
      console.error('Failed to activate view:', error);
    }
  }

  /**
   * 플러그인 비활성화
   */
  onunload(): void {
    // 이벤트 핸들러 제거
    this._unregisterEventHandlers();

    // 뷰 제거
    this.app.workspace.detachLeavesOfType(CARD_NAVIGATOR_VIEW_TYPE);

    // 서비스 정리
    this.cardService = null;
    this.cardSetService = null;
    this.layoutService = null;
    this.presetService = null;

    // UI 컴포넌트 정리
    this.cardRenderer = null;
    this.scroller = null;
    this.interactionManager = null;
    this.keyboardNavigator = null;

    // 이벤트 디스패처 정리
    this.eventDispatcher = null;
  }

  /**
   * 설정 로드
   */
  private async loadSettings(): Promise<void> {
    const defaultSettings: ICardNavigatorSettings = {
      // 카드셋 설정
      defaultCardSetType: 'folder',
      includeSubfolders: true,
      linkLevel: 1,

      // 카드 설정
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
      cardStyle: {
        card: {
          background: '#ffffff',
          fontSize: '14px',
          borderColor: '#e0e0e0',
          borderWidth: '1px'
        },
        activeCard: {
          background: '#f0f0f0',
          fontSize: '14px',
          borderColor: '#2196f3',
          borderWidth: '2px'
        },
        focusedCard: {
          background: '#e3f2fd',
          fontSize: '14px',
          borderColor: '#1976d2',
          borderWidth: '2px'
        },
        header: {
          background: '#ffffff',
          fontSize: '14px',
          borderColor: '#e0e0e0',
          borderWidth: '1px'
        },
        body: {
          background: '#ffffff',
          fontSize: '14px',
          borderColor: '#e0e0e0',
          borderWidth: '1px'
        },
        footer: {
          background: '#ffffff',
          fontSize: '12px',
          borderColor: '#e0e0e0',
          borderWidth: '1px'
        }
      },

      // 정렬 설정
      sortBy: 'fileName',
      sortOrder: 'asc',
      customSortField: '',

      // 레이아웃 설정
      layout: {
        fixedHeight: false,
        minCardWidth: 300,
        minCardHeight: 200
      },

      // 프리셋 설정
      presets: [],
      folderPresets: new Map(),
      tagPresets: new Map(),
      presetPriority: [],

      // 검색 설정
      defaultSearchScope: 'current',
      realtimeSearch: true,
      maxSearchResults: 50,
      searchInFileName: true,
      searchInTags: true,
      searchInLinks: true
    };

    const savedSettings = await this.loadData();
    this.settings = Object.assign({}, defaultSettings, savedSettings);
  }

  /**
   * 설정 저장
   */
  saveSettings(): void {
    this.saveData(this.settings);
  }

  /**
   * 이벤트 핸들러 등록
   */
  private _registerEventHandlers(): void {
    if (!this.eventDispatcher || !this.cardService || !this.cardSetService || 
        !this.layoutService || !this.presetService) {
      return;
    }

    // 카드 이벤트 핸들러
    const cardEventHandler = new CardEventHandler(this.cardService);
    this.eventDispatcher.register('card.created', cardEventHandler);
    this.eventDispatcher.register('card.updated', cardEventHandler);
    this.eventDispatcher.register('card.deleted', cardEventHandler);
    this.eventDispatcher.register('card.styleChanged', cardEventHandler);
    this.eventDispatcher.register('card.positionChanged', cardEventHandler);

    // 카드셋 이벤트 핸들러
    const cardSetEventHandler = new CardSetEventHandler(this.cardSetService);
    this.eventDispatcher.register('cardSet.created', cardSetEventHandler);
    this.eventDispatcher.register('cardSet.updated', cardSetEventHandler);
    this.eventDispatcher.register('cardSet.deleted', cardSetEventHandler);

    // 레이아웃 이벤트 핸들러
    const layoutEventHandler = new LayoutEventHandler(this.layoutService);
    this.eventDispatcher.register('layout.created', layoutEventHandler);
    this.eventDispatcher.register('layout.updated', layoutEventHandler);
    this.eventDispatcher.register('layout.deleted', layoutEventHandler);
    this.eventDispatcher.register('layout.cardPositionUpdated', layoutEventHandler);
    this.eventDispatcher.register('layout.cardPositionAdded', layoutEventHandler);
    this.eventDispatcher.register('layout.cardPositionRemoved', layoutEventHandler);
    this.eventDispatcher.register('layout.cardPositionsReset', layoutEventHandler);
    this.eventDispatcher.register('layout.configUpdated', layoutEventHandler);
    this.eventDispatcher.register('layout.calculated', layoutEventHandler);

    // 프리셋 이벤트 핸들러
    const presetEventHandler = new PresetEventHandler(this.presetService);
    this.eventDispatcher.register('preset.created', presetEventHandler);
    this.eventDispatcher.register('preset.updated', presetEventHandler);
    this.eventDispatcher.register('preset.deleted', presetEventHandler);
    this.eventDispatcher.register('preset.mappingCreated', presetEventHandler);
    this.eventDispatcher.register('preset.mappingUpdated', presetEventHandler);
    this.eventDispatcher.register('preset.mappingDeleted', presetEventHandler);
    this.eventDispatcher.register('preset.mappingPriorityUpdated', presetEventHandler);
    this.eventDispatcher.register('preset.imported', presetEventHandler);
    this.eventDispatcher.register('preset.exported', presetEventHandler);
  }

  /**
   * 이벤트 핸들러 제거
   */
  private _unregisterEventHandlers(): void {
    if (!this.eventDispatcher) {
      return;
    }

    // 모든 이벤트 핸들러 제거
    this.eventDispatcher = new DomainEventDispatcher();
  }

  /**
   * 설정값 가져오기
   */
  public getSetting<T>(path: string): T {
    const parts = path.split('.');
    let value: any = this.settings;
    
    for (const part of parts) {
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * 설정값 설정하기
   */
  public setSetting<T>(path: string, value: T): void {
    const parts = path.split('.');
    let current: any = this.settings;
    
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
    this.saveSettings();
  }
}

class CardNavigatorSettingTab extends PluginSettingTab {
  private plugin: CardNavigatorPlugin;

  constructor(app: App, plugin: CardNavigatorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Card Navigator Settings' });

    new Setting(containerEl)
      .setName('Default Layout')
      .setDesc('Choose the default layout for the Card Navigator')
      .addDropdown(dropdown => {
        dropdown
          .addOption('grid', 'Grid')
          .addOption('list', 'List')
          .addOption('masonry', 'Masonry')
          .setValue('grid')
          .onChange(async (value) => {
            // TODO: 레이아웃 설정 저장
          });
      });
  }
}
