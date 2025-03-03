import { Plugin, TFile, TAbstractFile, debounce, Events, addIcon, WorkspaceLeaf, Notice } from 'obsidian';
import { CardNavigatorView } from './ui/views/CardNavigatorView';
import { SettingsTab } from './ui/views/SettingsTab';
import { CardNavigatorSettings } from './core/types/settings.types';
import { DEFAULT_SETTINGS } from './core/constants/settings.constants';
import { SettingsManager } from './managers/settings/SettingsManager';
import { PresetManager } from './managers/preset/PresetManager';
import { CardSetManager } from './managers/cardset/CardSetManager';
import { LayoutManager } from './managers/layout/LayoutManager';
import { SearchService } from './services/search/SearchService';
import { CardService } from './services/card/CardService';
import { ScrollDirection } from './core/types/layout.types';
import { ErrorHandler } from './utils/error/ErrorHandler';
import { Log } from './utils/log/Log';
import { initializeTranslations } from './i18n';
import { testCardSetManager } from './test/cardset-test';
import { FileService } from './services/file/FileService';
import { MetadataService } from './services/file/MetadataService';
import { TagService } from './services/file/TagService';
import { CardRenderService } from './services/card/CardRenderService';
import { CardInteractionService } from './services/card/CardInteractionService';
import { CardSetService } from './services/cardset/CardSetService';
import { CardSetFilterService } from './services/cardset/CardSetFilterService';
import { ICardSetService } from './core/interfaces/service/ICardSetService';

/**
 * 카드 네비게이터 플러그인 클래스
 * Obsidian의 Plugin 클래스를 확장하여 카드 네비게이터 플러그인을 구현합니다.
 */
export class CardNavigatorPlugin extends Plugin {
  /**
   * 플러그인 설정
   */
  public settings: CardNavigatorSettings = DEFAULT_SETTINGS;
  
  /**
   * 설정 관리자
   */
  public settingsManager: SettingsManager;
  
  /**
   * 프리셋 관리자
   */
  public presetManager: PresetManager;
  
  /**
   * 카드셋 관리자
   */
  public cardSetManager: CardSetManager;
  
  /**
   * 레이아웃 관리자
   */
  public layoutManager: LayoutManager;
  
  /**
   * 검색 서비스
   */
  public searchService: SearchService;
  
  /**
   * 카드 서비스
   */
  public cardService: CardService;
  
  /**
   * 카드셋 서비스
   */
  public cardSetService: ICardSetService;
  
  /**
   * 설정 탭
   */
  private settingTab: SettingsTab;
  
  /**
   * 리본 아이콘 요소
   */
  private ribbonIconEl: HTMLElement | null = null;
  
  /**
   * 이벤트 관리자
   */
  public events: Events = new Events();
  
  /**
   * 플러그인 로드 시 실행되는 메서드
   */
  async onload() {
    try {
      Log.info('카드 네비게이터 플러그인 로드 중...');
      
      // 설정 로드
      await this.loadSettings();
      
      // 매니저 및 서비스 초기화
      this.initializeManagers();
      
      // 다국어 지원 초기화
      const locale = this.settings.language.useSystemLanguage 
        ? this.getSystemLocale() 
        : this.settings.language.locale;
      initializeTranslations(locale);
      
      // 플러그인 초기화
      await this.initializePlugin();
      
      // 개발 모드에서만 테스트 코드 실행
      if (process.env.NODE_ENV === 'development') {
        // 플러그인 로드 후 1초 후에 테스트 실행
        setTimeout(() => {
          console.log('카드셋 관리자 테스트 시작');
          testCardSetManager(this.app);
        }, 1000);
      }
      
      Log.info('카드 네비게이터 플러그인 로드 완료');
    } catch (error) {
      ErrorHandler.handleError('플러그인 로드 중 오류 발생', error);
    }
  }
  
  /**
   * 플러그인 언로드 시 실행되는 메서드
   */
  async onunload() {
    try {
      Log.info('카드 네비게이터 플러그인 언로드 중...');
      
      // 이벤트 리스너 제거
      this.unregisterEvents();
      
      // 리본 아이콘 제거
      if (this.ribbonIconEl) {
        this.ribbonIconEl.detach();
      }
      
      Log.info('카드 네비게이터 플러그인 언로드 완료');
    } catch (error) {
      ErrorHandler.handleError('플러그인 언로드 중 오류 발생', error);
    }
  }
  
  /**
   * 매니저 및 서비스 초기화
   */
  private initializeManagers() {
    // 매니저 초기화
    this.settingsManager = new SettingsManager(this);
    this.presetManager = new PresetManager(this.app, this, this.settingsManager);
    this.layoutManager = new LayoutManager(this.app, this.settingsManager);
    this.cardSetManager = new CardSetManager(this.app, this.settingsManager);
    
    // 파일 관련 서비스 초기화
    const fileService = new FileService(this.app);
    const metadataService = new MetadataService(this.app);
    const tagService = new TagService(this.app, metadataService, fileService);
    
    // 카드 관련 서비스 초기화
    const cardRenderService = new CardRenderService(this.app);
    const cardInteractionService = new CardInteractionService(this.app, this.settingsManager, fileService);
    
    // 서비스 초기화 - 기본 서비스부터 초기화
    cardRenderService.initialize();
    cardInteractionService.initialize();
    
    // 검색 서비스 초기화
    this.searchService = new SearchService(
      this.app, 
      this.settingsManager.getSettings().search,
      fileService,
      metadataService
    );
    this.searchService.initialize();
    
    // 카드 서비스 초기화
    this.cardService = new CardService(
      this.app, 
      this.settingsManager,
      fileService,
      metadataService,
      tagService,
      cardRenderService,
      cardInteractionService
    );
    this.cardService.initialize();
    
    // 카드셋 서비스 초기화
    const cardSetService = new CardSetService(
      this.app,
      this.cardService,
      this.cardSetManager
    );
    cardSetService.initialize();
    
    // 카드셋 필터 서비스 초기화 (데코레이터 패턴)
    const cardSetFilterService = new CardSetFilterService(
      this.app,
      cardSetService,
      this.searchService
    );
    cardSetFilterService.initialize();
    
    // 카드셋 서비스 설정 (필터 서비스를 사용)
    this.cardSetService = cardSetFilterService;
    
    // 설정 탭 초기화
    this.settingTab = new SettingsTab(
      this.app,
      this,
      this.settingsManager,
      this.presetManager
    );
    
    // 설정 탭 등록
    this.addSettingTab(this.settingTab);
  }
  
  /**
   * 플러그인 초기화
   */
  private async initializePlugin() {
    try {
      // 프리셋 초기화
      await this.presetManager.initialize();
      
      // 뷰 타입 등록
      this.registerView(
        CardNavigatorView.VIEW_TYPE,
        (leaf) => new CardNavigatorView(
          leaf,
          this.cardSetManager,
          this.layoutManager,
          this.presetManager,
          this.settingsManager,
          this.searchService,
          this.cardSetService
        )
      );
      
      // 리본 아이콘 추가
      this.addRibbonIcon('cards', '카드 네비게이터 열기', () => {
        this.activateView();
      });
      
      // 이벤트 리스너 등록
      this.registerEvents();
      
      // 명령어 등록
      this.addCommands();
    } catch (error) {
      ErrorHandler.handleError('플러그인 초기화 중 오류 발생', error);
    }
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEvents() {
    // 파일 변경 이벤트 리스너
    this.registerEvent(
      this.app.workspace.on('file-open', this.handleFileOpen.bind(this))
    );
    
    // 파일 생성 이벤트 리스너
    this.registerEvent(
      this.app.vault.on('create', this.handleFileCreate.bind(this))
    );
    
    // 파일 수정 이벤트 리스너
    this.registerEvent(
      this.app.vault.on('modify', this.handleFileModify.bind(this))
    );
    
    // 파일 삭제 이벤트 리스너
    this.registerEvent(
      this.app.vault.on('delete', this.handleFileDelete.bind(this))
    );
    
    // 파일 이름 변경 이벤트 리스너
    this.registerEvent(
      this.app.vault.on('rename', this.handleFileRename.bind(this))
    );
    
    // 레이아웃 변경 이벤트 리스너
    this.registerEvent(
      this.app.workspace.on('layout-change', this.handleLayoutChange.bind(this))
    );
    
    // 설정 변경 이벤트 리스너
    this.events.on('settings-changed', this.handleSettingsChanged.bind(this));
    
    // 프리셋 변경 이벤트 리스너
    this.events.on('preset-changed', this.handlePresetChanged.bind(this));
  }
  
  /**
   * 이벤트 리스너 제거
   */
  private unregisterEvents() {
    this.events.off('settings-changed', this.handleSettingsChanged.bind(this));
    this.events.off('preset-changed', this.handlePresetChanged.bind(this));
  }
  
  /**
   * 파일 열기 이벤트 핸들러
   */
  private async handleFileOpen(file: TFile | null) {
    if (file) {
      const activeView = this.getActiveCardNavigator();
      if (activeView) {
        await this.updateViewForFile(activeView, file);
      }
    }
  }
  
  /**
   * 파일 생성 이벤트 핸들러
   */
  private handleFileCreate(file: TAbstractFile) {
    if (file instanceof TFile && file.extension === 'md') {
      this.refreshAllViews('cardset');
    }
  }
  
  /**
   * 파일 수정 이벤트 핸들러
   */
  private handleFileModify(file: TAbstractFile) {
    if (file instanceof TFile && file.extension === 'md') {
      this.refreshAllViews('card');
    }
  }
  
  /**
   * 파일 삭제 이벤트 핸들러
   */
  private handleFileDelete(file: TAbstractFile) {
    if (file instanceof TFile && file.extension === 'md') {
      this.refreshAllViews('cardset');
    }
  }
  
  /**
   * 파일 이름 변경 이벤트 핸들러
   */
  private handleFileRename(file: TAbstractFile) {
    if (file instanceof TFile && file.extension === 'md') {
      this.refreshAllViews('cardset');
    }
  }
  
  /**
   * 레이아웃 변경 이벤트 핸들러
   */
  private handleLayoutChange() {
    const debounceRefresh = debounce(() => {
      this.refreshAllViews('layout');
    }, 300);
    
    debounceRefresh();
  }
  
  /**
   * 설정 변경 이벤트 핸들러
   */
  private handleSettingsChanged() {
    // 디버그 모드 설정
    Log.setDebugMode(this.settings.debug);
    
    // 언어 설정 적용
    const locale = this.settings.language.useSystemLanguage 
      ? this.getSystemLocale() 
      : this.settings.language.locale;
    initializeTranslations(locale);
    
    // 모든 뷰 새로고침
    this.refreshAllViews('settings');
  }
  
  /**
   * 프리셋 변경 이벤트 핸들러
   */
  private handlePresetChanged() {
    this.refreshAllViews('preset');
    this.saveSettings();
  }
  
  /**
   * 모든 카드 네비게이터 뷰 새로고침
   */
  private refreshAllViews(type: 'cardset' | 'card' | 'layout' | 'settings' | 'preset') {
    const views = this.getCardNavigatorViews();
    
    views.forEach(view => {
      switch (type) {
        case 'cardset':
          view.refreshCardSet();
          break;
        case 'card':
          view.refreshCards();
          break;
        case 'layout':
          view.updateLayout();
          break;
        case 'settings':
        case 'preset':
          view.applySettings();
          break;
      }
    });
  }
  
  /**
   * 파일에 맞게 뷰 업데이트
   */
  private async updateViewForFile(view: CardNavigatorView, file: TFile) {
    // 현재 파일에 맞는 프리셋 선택 및 적용
    await this.selectAndApplyPreset(file);
    
    // 카드셋 업데이트
    view.updateForFile(file);
  }
  
  /**
   * 파일에 맞는 프리셋 선택 및 적용
   */
  private async selectAndApplyPreset(file: TFile) {
    if (this.settings.autoApplyPresets) {
      await this.presetManager.selectAndApplyPresetForFile(file);
    }
  }
  
  /**
   * 카드 네비게이터 뷰 활성화
   */
  async activateView() {
    const leaf = this.app.workspace.getRightLeaf(false);
    
    if (leaf) {
      await leaf.setViewState({
        type: CardNavigatorView.VIEW_TYPE,
        active: true,
      });
      
      this.app.workspace.revealLeaf(leaf);
    }
  }
  
  /**
   * 활성화된 카드 네비게이터 뷰 가져오기
   */
  private getActiveCardNavigator(): CardNavigatorView | null {
    const leaves = this.app.workspace.getLeavesOfType(CardNavigatorView.VIEW_TYPE);
    
    if (leaves.length === 0) {
      return null;
    }
    
    const leaf = leaves[0];
    return leaf.view as CardNavigatorView;
  }
  
  /**
   * 모든 카드 네비게이터 뷰 가져오기
   */
  private getCardNavigatorViews(): CardNavigatorView[] {
    const leaves = this.app.workspace.getLeavesOfType(CardNavigatorView.VIEW_TYPE);
    
    return leaves.map(leaf => leaf.view as CardNavigatorView);
  }
  
  /**
   * 카드 스크롤
   */
  scrollCards(direction: ScrollDirection, count: number) {
    const view = this.getActiveCardNavigator();
    
    if (view) {
      view.scrollCards(direction, count);
    }
  }
  
  /**
   * 명령어 등록
   */
  private addCommands() {
    // 카드 네비게이터 열기 명령어
    this.addCommand({
      id: 'open-card-navigator',
      name: '카드 네비게이터 열기',
      callback: () => {
        this.activateView();
      },
    });
    
    // 현재 파일을 카드로 표시 명령어
    this.addCommand({
      id: 'show-current-file-as-card',
      name: '현재 파일을 카드로 표시',
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        
        if (file && file.extension === 'md') {
          if (!checking) {
            this.activateView().then(() => {
              const view = this.getActiveCardNavigator();
              if (view) {
                view.focusOnFile(file);
              }
            });
          }
          
          return true;
        }
        
        return false;
      },
    });
    
    // 카드 검색 명령어
    this.addCommand({
      id: 'search-cards',
      name: '카드 검색',
      callback: () => {
        const view = this.getActiveCardNavigator();
        
        if (view) {
          view.focusSearch();
        } else {
          this.activateView().then(() => {
            const newView = this.getActiveCardNavigator();
            if (newView) {
              setTimeout(() => {
                newView.focusSearch();
              }, 300);
            }
          });
        }
      },
    });
    
    // 스크롤 명령어 추가
    this.addScrollCommands();
  }
  
  /**
   * 스크롤 명령어 등록
   */
  private addScrollCommands() {
    // 위로 스크롤 명령어
    this.addCommand({
      id: 'scroll-cards-up',
      name: '카드 위로 스크롤',
      checkCallback: (checking) => {
        const view = this.getActiveCardNavigator();
        
        if (view) {
          if (!checking) {
            this.scrollCards('vertical', -1);
          }
          
          return true;
        }
        
        return false;
      },
    });
    
    // 아래로 스크롤 명령어
    this.addCommand({
      id: 'scroll-cards-down',
      name: '카드 아래로 스크롤',
      checkCallback: (checking) => {
        const view = this.getActiveCardNavigator();
        
        if (view) {
          if (!checking) {
            this.scrollCards('vertical', 1);
          }
          
          return true;
        }
        
        return false;
      },
    });
    
    // 왼쪽으로 스크롤 명령어
    this.addCommand({
      id: 'scroll-cards-left',
      name: '카드 왼쪽으로 스크롤',
      checkCallback: (checking) => {
        const view = this.getActiveCardNavigator();
        
        if (view) {
          if (!checking) {
            this.scrollCards('horizontal', -1);
          }
          
          return true;
        }
        
        return false;
      },
    });
    
    // 오른쪽으로 스크롤 명령어
    this.addCommand({
      id: 'scroll-cards-right',
      name: '카드 오른쪽으로 스크롤',
      checkCallback: (checking) => {
        const view = this.getActiveCardNavigator();
        
        if (view) {
          if (!checking) {
            this.scrollCards('horizontal', 1);
          }
          
          return true;
        }
        
        return false;
      },
    });
  }
  
  /**
   * 설정 로드
   */
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
  /**
   * 설정 저장
   */
  async saveSettings() {
    await this.saveData(this.settings);
  }
  
  /**
   * 시스템 로케일 가져오기
   * Obsidian의 현재 언어 설정을 가져옵니다.
   * @returns 시스템 로케일 코드 (기본값: 'en')
   */
  private getSystemLocale(): string {
    // @ts-ignore - moment는 Obsidian 내부 API이므로 타입 정의가 없을 수 있음
    const locale = window.moment?.locale?.() || 'en';
    return locale.substring(0, 2); // 언어 코드만 추출 (예: 'ko-KR' -> 'ko')
  }
}

// 플러그인 등록
export default class CardNavigator extends CardNavigatorPlugin {} 