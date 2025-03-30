import { Plugin, WorkspaceLeaf } from 'obsidian';
import { CardNavigatorSettingsTab, ICardNavigatorSettings } from '@/ui/settings/SettingsTab';
import { CardNavigatorView, CARD_NAVIGATOR_VIEW_TYPE } from '@/ui/components/CardNavigatorView';
import { CardService } from '@/application/services/CardService';
import { CardSetService } from '@/application/services/CardSetService';
import { LayoutService } from '@/application/services/LayoutService';
import { PresetService } from '@/application/services/PresetService';
import { CacheService } from '@/application/services/CacheService';
import { SearchService } from '@/application/services/SearchService';
import { LoggingService } from '@/infrastructure/services/LoggingService';
import { CardRenderer } from '@/ui/components/CardRenderer';
import { Scroller } from '@/ui/components/Scroller';
import { CardInteractionManager } from '@/ui/components/CardInteractionManager';
import { KeyboardNavigator } from '@/ui/components/KeyboardNavigator';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardRepository } from '@/infrastructure/repositories/CardRepository';
import { CardSetRepository } from '@/infrastructure/repositories/CardSetRepository';
import { LayoutRepository } from '@/infrastructure/repositories/LayoutRepository';
import { PresetRepository } from '@/infrastructure/repositories/PresetRepository';
import { LayoutType, LayoutDirection } from '@/domain/models/Layout';

/**
 * 카드 내비게이터 플러그인
 */
export default class CardNavigatorPlugin extends Plugin {
  private settings: ICardNavigatorSettings;
  private services: {
    card: CardService;
    cardSet: CardSetService;
    layout: LayoutService;
    preset: PresetService;
    cache: CacheService;
    search: SearchService;
    logging: LoggingService;
  };
  private repositories: {
    card: CardRepository;
    cardSet: CardSetRepository;
    layout: LayoutRepository;
    preset: PresetRepository;
  };
  private ui: {
    cardRenderer: CardRenderer;
    scroller: Scroller;
    interactionManager: CardInteractionManager;
    keyboardNavigator: KeyboardNavigator;
  };
  private eventDispatcher: DomainEventDispatcher;
  private settingsTab: CardNavigatorSettingsTab;
  private view: CardNavigatorView | null = null;

  /**
   * 플러그인 활성화
   */
  async onload(): Promise<void> {
    try {
      // 로깅 서비스 초기화
      this.services = {} as any;
      this.services.logging = new LoggingService(this.app);
      this.services.logging.info('플러그인 로딩 시작');

      // 설정 로드
      await this.loadSettings();

      // 이벤트 디스패처 초기화
      this.eventDispatcher = new DomainEventDispatcher(this.services.logging);

      // 기본 리포지토리 초기화
      this.repositories = {
        card: new CardRepository(this.app),
        layout: new LayoutRepository(this.app),
        preset: new PresetRepository(this.app),
        cardSet: new CardSetRepository(
          this.app,
          this.services.card,
          this.services.layout,
          this.services.logging
        )
      };

      // 기본 서비스 초기화
      this.services = {
        logging: this.services.logging,
        card: new CardService(this.app, this.repositories.card, this.eventDispatcher),
        layout: new LayoutService(this.app, this.eventDispatcher, this.services.card),
        preset: new PresetService(this.app, this.eventDispatcher, this.services.logging),
        cache: new CacheService(this.app, this.eventDispatcher, this.services.logging),
        cardSet: null as any,
        search: null as any
      };

      // CardSetRepository 초기화
      this.repositories.cardSet = new CardSetRepository(
        this.app,
        this.services.card,
        this.services.layout,
        this.services.logging
      );

      // CardSetService 초기화
      this.services.cardSet = new CardSetService(
        this.repositories.cardSet,
        this.eventDispatcher,
        this.services.logging,
        this.services.layout,
        this.services.card,
        this.app
      );

      // SearchService 초기화
      this.services.search = new SearchService(
        this.app,
        this.services.card,
        this.services.layout,
        this.eventDispatcher,
        this.services.preset,
        this.repositories.cardSet
      );

      // UI 컴포넌트 초기화
      this.ui = {
        cardRenderer: new CardRenderer(
          this.app,
          this.eventDispatcher,
          this.services.card,
          this.services.logging
        ),
        scroller: new Scroller(),
        interactionManager: new CardInteractionManager(
          this.eventDispatcher,
          this.services.card
        ),
        keyboardNavigator: new KeyboardNavigator(this.app)
      };

      // 설정 탭 초기화
      this.settingsTab = new CardNavigatorSettingsTab(this.app, this, this.settings);
      this.addSettingTab(this.settingsTab);

      // 뷰 등록
      this.registerView(CARD_NAVIGATOR_VIEW_TYPE, (leaf: WorkspaceLeaf) => {
        this.view = new CardNavigatorView({
          plugin: this,
          leaf,
          eventDispatcher: this.eventDispatcher,
          services: this.services,
          ui: this.ui,
          app: this.app
        });
        return this.view;
      });

      // 명령어 등록
      this.addCommands();

      // 리본 아이콘 추가
      this.addRibbonIcon('layers', 'Card Navigator', () => {
        this.activateView();
      });

      this.services.logging.info('플러그인 로딩 완료');
    } catch (error) {
      this.services?.logging.error('플러그인 로딩 실패:', error);
      throw error;
    }
  }

  /**
   * 뷰 활성화
   */
  private async activateView(): Promise<void> {
    try {
      this.services.logging.debug('뷰 활성화 시작');
      const { workspace } = this.app;
      
      let leaf = workspace.getLeavesOfType(CARD_NAVIGATOR_VIEW_TYPE)[0];
      
      if (!leaf) {
        const rightLeaf = workspace.getRightLeaf(false);
        if (!rightLeaf) {
          throw new Error('우측 리프를 생성할 수 없습니다.');
        }
        leaf = rightLeaf;
        await leaf.setViewState({
          type: CARD_NAVIGATOR_VIEW_TYPE,
          active: true
        });
      }

      workspace.revealLeaf(leaf);
      
      if (this.view) {
        this.view.focusContainer();
      }

      this.services.logging.info('뷰 활성화 완료');
    } catch (error) {
      this.services.logging.error('뷰 활성화 실패:', error);
      throw error;
    }
  }

  /**
   * 플러그인 비활성화
   */
  onunload(): void {
    this.services.logging.info('플러그인 언로드 시작');
    this.app.workspace.detachLeavesOfType(CARD_NAVIGATOR_VIEW_TYPE);
    this.services.logging.info('플러그인 언로드 완료');
  }

  /**
   * 설정 로드
   */
  private async loadSettings(): Promise<void> {
    const defaultSettings: ICardNavigatorSettings = {
      defaultCardSetType: 'folder',
      includeSubfolders: true,
      linkLevel: 1,
      defaultSearchScope: 'current',
      realtimeSearch: true,
      maxSearchResults: 50,
      searchInFileName: true,
      searchInTags: true,
      searchInLinks: true,
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
          showFileName: false,
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
          background: 'var(--background-secondary)',
          fontSize: '14px',
          borderColor: 'var(--background-modifier-border)',
          borderWidth: '1px'
        },
        activeCard: {
          background: 'var(--background-modifier-hover)',
          fontSize: '14px',
          borderColor: 'var(--interactive-accent)',
          borderWidth: '2px'
        },
        focusedCard: {
          background: 'var(--background-modifier-hover)',
          fontSize: '14px',
          borderColor: 'var(--interactive-accent)',
          borderWidth: '2px'
        },
        header: {
          background: 'var(--background-secondary)',
          fontSize: '14px',
          borderColor: 'var(--background-modifier-border)',
          borderWidth: '1px'
        },
        body: {
          background: 'var(--background-primary)',
          fontSize: '14px',
          borderColor: 'var(--background-modifier-border)',
          borderWidth: '1px'
        },
        footer: {
          background: 'var(--background-secondary)',
          fontSize: '12px',
          borderColor: 'var(--background-modifier-border)',
          borderWidth: '1px'
        }
      },
      sortBy: 'fileName',
      sortOrder: 'asc',
      layout: {
        type: LayoutType.GRID,
        direction: LayoutDirection.VERTICAL,
        fixedHeight: false,
        minCardWidth: 300,
        minCardHeight: 200,
        gap: 16,
        padding: 16
      },
      presets: [],
      folderPresets: new Map(),
      tagPresets: new Map(),
      presetPriority: [],
      keyboardNavigationEnabled: true,
      scrollBehavior: 'smooth',
      autoFocusActiveCard: true
    };
    
    this.settings = Object.assign({}, defaultSettings, await this.loadData());
  }

  private addCommands() {
    this.addCommand({
      id: 'open-card-navigator',
      name: 'Open Card Navigator',
      callback: () => this.activateView()
    });

    this.addCommand({
      id: 'focus-card-navigator',
      name: 'Focus Card Navigator',
      callback: () => {
        const view = this.app.workspace.getLeavesOfType(CARD_NAVIGATOR_VIEW_TYPE)[0]?.view as CardNavigatorView;
        if (view) view.focusContainer();
      }
    });
  }

  /**
   * 설정 가져오기
   */
  getSettings(): ICardNavigatorSettings {
    return this.settings;
  }

  /**
   * 설정 저장
   */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  /**
   * 설정 업데이트
   */
  setSettings(settings: ICardNavigatorSettings): void {
    this.settings = settings;
  }

  /**
   * 특정 설정값 업데이트
   */
  setSetting(key: string, value: any): void {
    const parts = key.split('.');
    let current: any = this.settings;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
  }

  /**
   * 프리셋 서비스 가져오기
   */
  getPresetService(): PresetService {
    return this.services.preset;
  }

  private async initializeServices(): Promise<void> {
    try {
      this.services.logging.info('서비스 초기화 시작');

      // 1. 이벤트 디스패처
      this.eventDispatcher = new DomainEventDispatcher(this.services.logging);
      this.services.logging.debug('이벤트 디스패처 초기화 완료');

      // 2. 기본 리포지토리
      this.repositories = {
        card: new CardRepository(this.app),
        layout: new LayoutRepository(this.app),
        preset: new PresetRepository(this.app),
        cardSet: new CardSetRepository(
          this.app,
          this.services.card,
          this.services.layout,
          this.services.logging
        )
      };
      this.services.logging.debug('기본 리포지토리 초기화 완료');

      // 3. 기본 서비스
      this.services = {
        logging: new LoggingService(this.app),
        card: new CardService(this.app, this.repositories.card, this.eventDispatcher),
        layout: new LayoutService(this.app, this.eventDispatcher, this.services.card),
        preset: new PresetService(this.app, this.eventDispatcher, this.services.logging),
        cache: new CacheService(this.app, this.eventDispatcher, this.services.logging),
        cardSet: new CardSetService(
          this.repositories.cardSet,
          this.eventDispatcher,
          this.services.logging,
          this.services.layout,
          this.services.card,
          this.app
        ),
        search: new SearchService(
          this.app,
          this.services.card,
          this.services.layout,
          this.eventDispatcher,
          this.services.preset,
          this.repositories.cardSet
        )
      };
      this.services.logging.debug('기본 서비스 초기화 완료');

      // 4. UI 컴포넌트
      this.ui = {
        cardRenderer: new CardRenderer(
          this.app,
          this.eventDispatcher,
          this.services.card,
          this.services.logging
        ),
        scroller: new Scroller(),
        interactionManager: new CardInteractionManager(
          this.eventDispatcher,
          this.services.card
        ),
        keyboardNavigator: new KeyboardNavigator(this.app)
      };
      this.services.logging.debug('UI 컴포넌트 초기화 완료');

      this.services.logging.info('서비스 초기화 완료');
    } catch (error) {
      this.services.logging.error('서비스 초기화 중 오류 발생:', error);
      throw error;
    }
  }
}