import { App, Plugin, WorkspaceLeaf } from 'obsidian';
import { CardNavigatorView } from './ui/CardNavigatorView';
import { CardRepositoryImpl } from './infrastructure/CardRepositoryImpl';
import { ObsidianAdapter } from './infrastructure/ObsidianAdapter';
import { CardFactory } from './domain/card/CardFactory';
import { CardNavigatorService } from './application/CardNavigatorService';
import { CardNavigatorSettingTab } from './ui/settings/SettingTab';
import { CardSetSourceType } from './domain/cardset/CardSet';

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

/**
 * 카드 네비게이터 플러그인 클래스
 */
export default class CardNavigatorPlugin extends Plugin {
  settings: CardNavigatorSettings = DEFAULT_SETTINGS;
  private cardNavigatorService: CardNavigatorService | null = null;

  async onload() {
    console.log('카드 네비게이터 플러그인 로드 중...');
    
    // 설정 로드
    await this.loadSettings();

    // 뷰 등록
    this.registerView(
      VIEW_TYPE_CARD_NAVIGATOR,
      (leaf: WorkspaceLeaf) => new CardNavigatorView(leaf)
    );
    
    // 서비스 초기화 (비동기 처리)
    await this.initializeServices();
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
    
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

    // 플러그인 로드 시 뷰 활성화
    setTimeout(() => {
      this.activateView();
    }, 300);
    
    console.log('카드 네비게이터 플러그인 로드 완료');
  }

  onunload() {
    console.log('Card Navigator plugin unloaded');
    
    // 현재 모드와 카드 세트 정보를 마지막 상태로 저장
    if (this.cardNavigatorService) {
      try {
        const cardSetSourceService = this.cardNavigatorService.getCardSetSourceService();
        const currentCardSetSource = cardSetSourceService.getCurrentSourceType();
        const currentCardSet = cardSetSourceService.getCurrentCardSet();
        const isFixed = cardSetSourceService.isCardSetFixed();
        
        // 마지막 모드 저장
        this.settings.lastCardSetSource = currentCardSetSource;
        
        // 모드에 따라 마지막 카드 세트 저장
        if (currentCardSetSource === 'folder') {
          this.settings.lastFolderCardSet = currentCardSet || undefined;
          this.settings.lastFolderCardSetFixed = isFixed;
        } else if (currentCardSetSource === 'tag') {
          this.settings.lastTagCardSet = currentCardSet || undefined;
          this.settings.lastTagCardSetFixed = isFixed;
        }
        
        // 설정 저장
        this.saveSettings();
        console.log('플러그인 종료 시 마지막 상태 저장 완료');
      } catch (error) {
        console.error('플러그인 종료 시 상태 저장 중 오류 발생:', error);
      }
    }
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

  async saveSettings() {
    try {
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
      
      // 옵시디언 플러그인 표준 방식으로 설정 저장
      await this.saveData(this.settings);
      console.log('설정 저장 성공:', this.settings);
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  }

  /**
   * 카드 네비게이터 뷰 활성화
   */
  async activateView() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
  
    // 오른쪽 사이드바에 뷰 추가 시도
    try {
      const leaf = this.app.workspace.getRightLeaf(false);
      
      // leaf가 null인 경우 새 leaf 생성
      if (!leaf) {
        console.log('오른쪽 사이드바 leaf를 찾을 수 없어 새로 생성합니다.');
        const newLeaf = this.app.workspace.createLeafInParent(
          this.app.workspace.rightSplit, 0
        );
        
        if (newLeaf) {
          await newLeaf.setViewState({
            type: VIEW_TYPE_CARD_NAVIGATOR,
            active: true,
          });
        } else {
          console.error('새 leaf를 생성할 수 없습니다.');
          return;
        }
      } else {
        // 기존 leaf가 있는 경우
        await leaf.setViewState({
          type: VIEW_TYPE_CARD_NAVIGATOR,
          active: true,
        });
      }
      
      // 뷰가 활성화되면 서비스 초기화
      this.app.workspace.revealLeaf(
        this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0]
      );
    } catch (error) {
      console.error('카드 네비게이터 뷰 활성화 중 오류 발생:', error);
      
      // 대체 방법: 새 탭에 뷰 열기
      try {
        await this.app.workspace.getLeaf(true).setViewState({
          type: VIEW_TYPE_CARD_NAVIGATOR,
          active: true,
        });
      } catch (fallbackError) {
        console.error('대체 방법으로 뷰 활성화 시도 중 오류 발생:', fallbackError);
      }
    }
  }
  
  /**
   * 카드 네비게이터 서비스 가져오기
   * @returns 카드 네비게이터 서비스
   */
  getCardNavigatorService(): CardNavigatorService | null {
    return this.cardNavigatorService;
  }

  /**
   * 카드 네비게이터 서비스 가져오기 (별칭)
   * @returns 카드 네비게이터 서비스
   */
  getService(): CardNavigatorService | null {
    return this.getCardNavigatorService();
  }

  /**
   * 현재 카드 네비게이터 상태 정보를 콘솔에 출력
   */
  showStatus(): void {
    if (!this.cardNavigatorService) {
      console.log('카드 네비게이터 서비스가 초기화되지 않았습니다.');
      return;
    }

    const cardSetSourceService = this.cardNavigatorService.getCardSetSourceService();
    const currentCardSetSource = cardSetSourceService.getCurrentSourceType();
    const currentCardSet = cardSetSourceService.getCurrentCardSet() || '/';
    const isCardSetFixed = cardSetSourceService.isCardSetFixed();
    const includeSubfolders = cardSetSourceService.getIncludeSubfolders();

    console.log('===== 카드 네비게이터 상태 정보 =====');
    console.log(`현재 모드: ${currentCardSetSource === 'folder' ? '폴더 모드' : '태그 모드'}`);
    console.log(`현재 ${currentCardSetSource === 'folder' ? '폴더 경로' : '태그'}: ${currentCardSet}`);
    console.log(`카드 세트 고정 여부: ${isCardSetFixed ? '고정됨' : '고정되지 않음'}`);
    console.log(`하위 폴더 포함 여부: ${includeSubfolders ? '포함' : '미포함'}`);
    console.log('===================================');
  }

  private async initializeServices() {
    try {
      // 어댑터 생성
      const obsidianAdapter = new ObsidianAdapter(this.app);
      
      // 카드 팩토리 생성
      const cardFactory = new CardFactory(obsidianAdapter);
      
      // 카드 저장소 생성
      const cardRepository = new CardRepositoryImpl(obsidianAdapter, cardFactory);
      
      // 카드 네비게이터 서비스 생성
      this.cardNavigatorService = new CardNavigatorService(
        this.app,
        cardRepository,
        this
      );
      
      // 서비스 초기화 (비동기 처리)
      await this.cardNavigatorService.initialize();
      console.log('카드 네비게이터 서비스 초기화 완료');
    } catch (error) {
      console.error('카드 네비게이터 서비스 초기화 실패:', error);
    }
  }

  private registerEventListeners() {
    // 파일 변경 이벤트 리스너
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (this.cardNavigatorService) {
          this.cardNavigatorService.refreshCards();
        }
      })
    );
    
    // 파일 생성 이벤트 리스너
    this.registerEvent(
      this.app.vault.on('create', (file) => {
        if (this.cardNavigatorService) {
          this.cardNavigatorService.refreshCards();
        }
      })
    );
    
    // 파일 삭제 이벤트 리스너
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (this.cardNavigatorService) {
          this.cardNavigatorService.refreshCards();
        }
      })
    );
    
    // 파일 이름 변경 이벤트 리스너
    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        if (this.cardNavigatorService) {
          this.cardNavigatorService.refreshCards();
        }
      })
    );
    
    // 활성 파일 변경 이벤트 리스너 추가
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', async (leaf) => {
        if (!this.cardNavigatorService) return;
        
        const file = this.app.workspace.getActiveFile();
        if (!file) return;
        
        // CardSetSourceService의 handleActiveFileChange 메서드 호출
        const cardSetSourceService = this.cardNavigatorService.getCardSetSourceService();
        const cardSetChanged = await cardSetSourceService.handleActiveFileChange(file);
        
        // 카드 세트가 변경된 경우 카드 새로고침
        if (cardSetChanged) {
          console.log(`[CardNavigatorPlugin] 활성 파일 변경으로 카드 세트 변경됨: ${file.path}`);
          await this.cardNavigatorService.refreshCards();
        }
      })
    );
    
    console.log('카드 네비게이터 이벤트 리스너 등록 완료');
  }

  // 설정 모달을 여는 메서드 추가
  openSettingsModal(): void {
    // React 컴포넌트를 렌더링하는 코드
    console.log('고급 설정 모달 열기');
    
    // 임시 구현: 기본 설정 탭 열기
    // 타입 단언 사용
    (this.app as any).setting.open();
    (this.app as any).setting.openTabById(this.manifest.id);
  }
}