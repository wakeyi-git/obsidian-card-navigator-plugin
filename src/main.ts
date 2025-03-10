import { App, Plugin, WorkspaceLeaf, PluginSettingTab, Setting, TFolder, TFile, Notice, SuggestModal, Modal, MarkdownRenderer, MarkdownView, Menu, MenuItem, TAbstractFile, Workspace } from 'obsidian';
import { CardNavigatorView } from './ui/CardNavigatorView';
import { CardNavigatorSettingTab } from './ui/settings/SettingTab';
import { CardSetSourceType } from './domain/cardset/CardSet';

// 서비스 및 어댑터 임포트
import { ObsidianAdapter } from './services/ObsidianAdapter';
import { SearchService } from './services/SearchService';
import { CardService } from './services/CardService';
import { PresetService } from './services/PresetService';
import { CardInteractionService } from './services/CardInteractionService';

// 도메인 임포트
import { CardManager } from './domain/card/CardManager';
import { CardListManager } from './domain/cardlist/CardListManager';
import { PresetManager } from './domain/preset/PresetManager';
import { SearchSuggestionProvider } from './domain/search/SearchSuggestionProvider';
import { DomainEventBus } from './domain/events/DomainEventBus';

// UI 컴포넌트 임포트
import { SearchView } from './ui/components/SearchView';
import { CardListView } from './ui/components/CardListView';
import { CardView } from './ui/components/CardView';

// 뷰 타입 상수 정의
export const VIEW_TYPE_CARD_NAVIGATOR = 'card-navigator-view-type';

export interface CardNavigatorSettings {
  // 기본 설정
  defaultCardSetSource: CardSetSourceType;
  defaultLayout: 'grid' | 'masonry';
  includeSubfolders: boolean;
  defaultFolderCardSet: string;
  defaultTagCardSet: string;
  isCardSetFixed: boolean;
  defaultSearchScope?: 'all' | 'current';
  tagCaseSensitive?: boolean;
  useLastCardSetSourceOnLoad?: boolean;
  
  // 마지막 상태 저장
  lastCardSetSource?: CardSetSourceType;
  lastFolderCardSet?: string;
  lastFolderCardSetFixed?: boolean;
  lastTagCardSet?: string;
  lastTagCardSetFixed?: boolean;
  
  // 카드 설정
  cardWidth: number;
  cardHeight: number;
  cardHeaderContent?: string[] | string;
  cardBodyContent?: string[] | string;
  cardFooterContent?: string[] | string;
  cardHeaderFrontmatterKey?: string;
  cardBodyFrontmatterKey?: string;
  cardFooterFrontmatterKey?: string;
  renderingCardSetSource?: string;
  titleSource?: 'filename' | 'firstheader';
  includeFrontmatterInContent?: boolean;
  includeFirstHeaderInContent?: boolean;
  limitContentLength?: boolean;
  contentMaxLength?: number;
  
  // 카드 스타일 설정
  normalCardBgColor?: string;
  activeCardBgColor?: string;
  focusedCardBgColor?: string;
  headerBgColor?: string;
  bodyBgColor?: string;
  footerBgColor?: string;
  headerFontSize?: number;
  bodyFontSize?: number;
  footerFontSize?: number;
  
  // 테두리 스타일 설정
  normalCardBorderStyle?: string;
  normalCardBorderColor?: string;
  normalCardBorderWidth?: number;
  normalCardBorderRadius?: number;
  
  activeCardBorderStyle?: string;
  activeCardBorderColor?: string;
  activeCardBorderWidth?: number;
  activeCardBorderRadius?: number;
  
  focusedCardBorderStyle?: string;
  focusedCardBorderColor?: string;
  focusedCardBorderWidth?: number;
  focusedCardBorderRadius?: number;
  
  headerBorderStyle?: string;
  headerBorderColor?: string;
  headerBorderWidth?: number;
  headerBorderRadius?: number;
  
  bodyBorderStyle?: string;
  bodyBorderColor?: string;
  bodyBorderWidth?: number;
  bodyBorderRadius?: number;
  
  footerBorderStyle?: string;
  footerBorderColor?: string;
  footerBorderWidth?: number;
  footerBorderRadius?: number;
  
  // 검색 설정
  tagCardSetSourceSearchOptions?: string[];
  folderCardSetSourceSearchOptions?: string[];
  frontmatterSearchKey?: string;
  searchCaseSensitive?: boolean;
  highlightSearchResults?: boolean;
  maxSearchResults?: number;
  
  // 정렬 설정
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  customSortKey?: string;
  tagSortBy?: string;
  folderSortBy?: string;
  
  // 레이아웃 설정
  fixedCardHeight?: boolean;
  cardMinWidth?: number;
  cardMinHeight?: number;
  cardGap?: number;
  gridColumns?: string;
  
  // 우선 순위 설정
  priorityTags: string[];
  priorityFolders: string[];
  
  // 프리셋 설정
  folderPresetMappings?: {folder: string, presetId: string}[];
  tagPresetMappings?: {tag: string, presetId: string}[];
  presetPriorities?: {id: string, type: 'folder' | 'tag', target: string}[];
  presets?: string[];
}

// 기본 설정값도 업데이트
const DEFAULT_SETTINGS: CardNavigatorSettings = {
  defaultCardSetSource: 'folder',
  defaultLayout: 'grid',
  cardWidth: 300,
  cardHeight: 200,
  priorityTags: [],
  priorityFolders: [],
  includeSubfolders: true,
  defaultFolderCardSet: '',
  defaultTagCardSet: '',
  isCardSetFixed: false,
  defaultSearchScope: 'current',
  tagCaseSensitive: false,
  useLastCardSetSourceOnLoad: false,
  
  // 새로 추가된 기본값
  cardHeaderContent: ['filename'],
  cardBodyContent: ['content'],
  cardFooterContent: ['tags'],
  cardHeaderFrontmatterKey: '',
  cardBodyFrontmatterKey: '',
  cardFooterFrontmatterKey: '',
  renderingCardSetSource: 'text',
  titleSource: 'filename',
  includeFrontmatterInContent: false,
  includeFirstHeaderInContent: false,
  normalCardBgColor: '#ffffff',
  activeCardBgColor: '#f0f0f0',
  focusedCardBgColor: '#e0e0e0',
  headerBgColor: '#f5f5f5',
  bodyBgColor: '#ffffff',
  footerBgColor: '#f5f5f5',
  headerFontSize: 16,
  bodyFontSize: 14,
  footerFontSize: 12,
  normalCardBorderStyle: 'solid',
  normalCardBorderColor: '#e0e0e0',
  normalCardBorderWidth: 1,
  normalCardBorderRadius: 4,
  activeCardBorderStyle: 'solid',
  activeCardBorderColor: '#a0a0a0',
  activeCardBorderWidth: 1,
  activeCardBorderRadius: 4,
  focusedCardBorderStyle: 'solid',
  focusedCardBorderColor: '#606060',
  focusedCardBorderWidth: 2,
  focusedCardBorderRadius: 4,
  headerBorderStyle: 'none',
  headerBorderColor: '#e0e0e0',
  headerBorderWidth: 0,
  headerBorderRadius: 0,
  bodyBorderStyle: 'none',
  bodyBorderColor: '#e0e0e0',
  bodyBorderWidth: 0,
  bodyBorderRadius: 0,
  footerBorderStyle: 'none',
  footerBorderColor: '#e0e0e0',
  footerBorderWidth: 0,
  footerBorderRadius: 0,
  searchCaseSensitive: false,
  highlightSearchResults: true,
  maxSearchResults: 100,
  sortBy: 'filename',
  sortOrder: 'asc',
  fixedCardHeight: false,
  cardMinWidth: 200,
  cardMinHeight: 150,
  cardGap: 10,
  gridColumns: 'auto-fill'
};

// Workspace 인터페이스 확장
declare module 'obsidian' {
  interface Workspace {
    on(name: 'card-navigator:settings-changed', callback: (settings: any) => any): EventRef;
    on(name: 'file-open', callback: (file: TFile | null) => any): EventRef;
    off(name: 'card-navigator:settings-changed', callback: (settings: any) => any): void;
    off(name: 'file-open', callback: (file: TFile | null) => any): void;
    trigger(name: 'card-navigator:settings-changed', settings: any): void;
  }
}

/**
 * 카드 네비게이터 플러그인 클래스
 */
export default class CardNavigatorPlugin extends Plugin {
  settings: CardNavigatorSettings = DEFAULT_SETTINGS;
  
  // 서비스 인스턴스
  private obsidianAdapter: ObsidianAdapter;
  private searchService: SearchService;
  private cardService: CardService;
  private presetService: PresetService;
  private cardInteractionService: CardInteractionService;
  
  // 도메인 인스턴스
  private cardManager: CardManager;
  private cardListManager: CardListManager;
  private presetManager: PresetManager;
  private searchSuggestionProvider: SearchSuggestionProvider;
  private eventBus: DomainEventBus;
  
  // UI 컴포넌트 인스턴스
  private searchView: SearchView;
  private cardListView: CardListView;

  async onload() {
    console.log('카드 네비게이터 플러그인 로드 중...');
    
    // 설정 로드
    await this.loadSettings();

    // 뷰 등록
    this.registerView(
      VIEW_TYPE_CARD_NAVIGATOR,
      (leaf: WorkspaceLeaf) => new CardNavigatorView(leaf, this)
    );
    
    // 서비스 초기화 (비동기 처리)
    await this.initializeServices();
    
    // 리본 아이콘 추가
    this.addRibbonIcon('layout-grid', '카드 네비게이터 열기', () => {
      this.activateView();
    });
    
    // 명령어 추가
    this.addCommand({
      id: 'open-card-navigator',
      name: '카드 네비게이터 열기',
      callback: () => {
        this.activateView();
      }
    });
    
    // 상태 표시 명령어 추가
    this.addCommand({
      id: 'show-card-navigator-status',
      name: '카드 네비게이터 상태 표시',
      callback: () => {
        this.showStatus();
      }
    });
    
    // 설정 탭 추가
    this.addSettingTab(new CardNavigatorSettingTab(this.app, this));
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
    
    console.log('카드 네비게이터 플러그인 로드 완료');
  }

  async onunload() {
    console.log('카드 네비게이터 플러그인 언로드 중...');
    
    // 뷰 분리
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
    
    // 이벤트 어댑터 언로드
    if (this.obsidianAdapter) {
      this.obsidianAdapter.unregisterEvents();
    }
    
    console.log('카드 네비게이터 플러그인 언로드 완료');
  }

  async loadSettings() {
    try {
      // 옵시디언 플러그인 표준 방식으로 설정 로드
      const data = await this.loadData();
      this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
      
      // 카드 내용 설정이 배열이 아닌 경우 배열로 변환
      if (this.settings.cardHeaderContent && !Array.isArray(this.settings.cardHeaderContent)) {
        this.settings.cardHeaderContent = [this.settings.cardHeaderContent];
      }
      
      if (this.settings.cardBodyContent && !Array.isArray(this.settings.cardBodyContent)) {
        this.settings.cardBodyContent = [this.settings.cardBodyContent];
      }
      
      if (this.settings.cardFooterContent && !Array.isArray(this.settings.cardFooterContent)) {
        this.settings.cardFooterContent = [this.settings.cardFooterContent];
      }
      
      console.log('설정 로드 성공:', this.settings);
    } catch (error) {
      console.error('설정 로드 실패:', error);
      this.settings = Object.assign({}, DEFAULT_SETTINGS);
      console.log('설정 로드 오류로 기본 설정을 사용합니다.');
    }
    
    return this.settings;
  }

  /**
   * 설정 저장
   */
  async saveSettings() {
    try {
      // 설정 저장 전 현재 설정 복사
      const currentSettings = JSON.stringify(this.settings);
      
      // 배열 타입 확인 및 변환
      if (this.settings.priorityTags && !Array.isArray(this.settings.priorityTags)) {
        this.settings.priorityTags = [this.settings.priorityTags];
      }
      
      if (this.settings.priorityFolders && !Array.isArray(this.settings.priorityFolders)) {
        this.settings.priorityFolders = [this.settings.priorityFolders];
      }
      
      if (this.settings.cardBodyContent && !Array.isArray(this.settings.cardBodyContent)) {
        this.settings.cardBodyContent = [this.settings.cardBodyContent];
      }
      
      if (this.settings.cardFooterContent && !Array.isArray(this.settings.cardFooterContent)) {
        this.settings.cardFooterContent = [this.settings.cardFooterContent];
      }
      
      // 변환 후 설정이 변경되었는지 확인
      const newSettings = JSON.stringify(this.settings);
      
      // 설정이 변경되었거나 강제 저장 플래그가 설정된 경우에만 저장
      if (currentSettings !== newSettings) {
        await this.saveData(this.settings);
        console.log('설정 저장 성공:', this.settings);
        
        // 설정 변경 이벤트 발생
        this.app.workspace.trigger('card-navigator:settings-changed', this.settings);
      } else {
        console.log('설정 변경 없음, 저장 건너뜀');
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  }

  /**
   * 카드 네비게이터 뷰 활성화
   */
  async activateView() {
    // 이미 열려있는 뷰 확인
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
    
    if (leaves.length > 0) {
      // 이미 열려있는 뷰가 있으면 활성화
      this.app.workspace.revealLeaf(leaves[0]);
      return;
    }
    
    // 새 뷰 생성
    const leaf = this.app.workspace.getRightLeaf(false);
    await leaf.setViewState({
      type: VIEW_TYPE_CARD_NAVIGATOR,
      active: true
    });
    
    // 뷰 활성화
    this.app.workspace.revealLeaf(leaf);
  }

  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners() {
    // 파일 변경 이벤트 리스너
    this.registerEvent(
      this.app.vault.on('create', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          this.cardService.syncCards();
        }
      })
    );
    
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          this.cardService.syncCards();
        }
      })
    );
    
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          this.cardService.syncCards();
        }
      })
    );
    
    this.registerEvent(
      this.app.vault.on('rename', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          this.cardService.syncCards();
        }
      })
    );
    
    // 설정 변경 이벤트 리스너
    this.registerEvent(
      this.app.workspace.on('card-navigator:settings-changed', (settings) => {
        this.settings = settings;
        this.saveSettings();
      })
    );
  }

  /**
   * 현재 카드 네비게이터 상태 정보를 콘솔에 출력
   */
  showStatus(): void {
    console.log('===== 카드 네비게이터 상태 정보 =====');
    console.log(`카드 매니저에 등록된 카드 수: ${this.cardManager.getAllCards().length}`);
    console.log(`카드 리스트 매니저에 등록된 리스트 수: ${this.cardListManager.getAllCardLists().length}`);
    console.log(`프리셋 매니저에 등록된 프리셋 수: ${this.presetManager.getAllPresets().length}`);
    console.log('===================================');
  }

  /**
   * 서비스 초기화
   * 플러그인에서 사용하는 서비스를 초기화합니다.
   */
  private async initializeServices() {
    try {
      console.log('서비스 초기화 중...');
      
      // 이벤트 버스 초기화
      this.eventBus = DomainEventBus.getInstance();
      
      // 도메인 객체 초기화
      this.cardManager = new CardManager();
      this.cardListManager = new CardListManager(this.cardManager);
      this.presetManager = new PresetManager();
      
      // Obsidian 어댑터 초기화
      this.obsidianAdapter = new ObsidianAdapter(this.app);
      
      // 검색 제안 제공자 초기화
      this.searchSuggestionProvider = new SearchSuggestionProvider(this.obsidianAdapter);
      
      // 서비스 초기화
      this.searchService = new SearchService(this.searchSuggestionProvider, this.obsidianAdapter);
      this.cardService = new CardService(this.cardManager, this.cardListManager, this.obsidianAdapter);
      this.presetService = new PresetService(this.presetManager, this.eventBus);
      this.cardInteractionService = new CardInteractionService(this.cardService, this.searchService);
      
      // 초기 카드 동기화
      await this.cardService.syncCards();
      
      console.log('서비스 초기화 완료');
    } catch (error) {
      console.error('서비스 초기화 중 오류 발생:', error);
      new Notice('카드 네비게이터 플러그인 초기화 중 오류가 발생했습니다.');
    }
  }

  /**
   * 서비스 인스턴스 가져오기
   */
  getSearchService(): SearchService {
    return this.searchService;
  }
  
  getCardService(): CardService {
    return this.cardService;
  }
  
  getPresetService(): PresetService {
    return this.presetService;
  }
  
  getCardInteractionService(): CardInteractionService {
    return this.cardInteractionService;
  }
  
  getObsidianAdapter(): ObsidianAdapter {
    return this.obsidianAdapter;
  }
}