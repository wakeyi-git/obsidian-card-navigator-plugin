import { App, Plugin, WorkspaceLeaf } from 'obsidian';
import { CardNavigatorView } from './ui/CardNavigatorView';
import { CardRepositoryImpl } from './infrastructure/CardRepositoryImpl';
import { ObsidianAdapter } from './infrastructure/ObsidianAdapter';
import { CardFactory } from './domain/card/CardFactory';
import { CardNavigatorService } from './application/CardNavigatorService';
import { CardNavigatorSettingTab } from './ui/settings/SettingTab';
import { ModeType } from './domain/mode/Mode';

export interface CardNavigatorSettings {
  // 기본 설정
  defaultMode: ModeType;
  defaultLayout: 'grid' | 'masonry';
  includeSubfolders: boolean;
  defaultCardSet: string;
  isCardSetFixed: boolean;
  
  // 카드 설정
  cardWidth: number;
  cardHeight: number;
  cardHeaderContent?: string;
  cardBodyContent?: string;
  cardFooterContent?: string;
  renderingMode?: string;
  
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
  
  // 검색 설정
  tagModeSearchOptions?: string[];
  folderModeSearchOptions?: string[];
  frontmatterSearchKey?: string;
  
  // 정렬 설정
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  customSortKey?: string;
  
  // 레이아웃 설정
  fixedCardHeight?: boolean;
  cardMinWidth?: number;
  cardMinHeight?: number;
  
  // 우선 순위 설정
  priorityTags: string[];
  priorityFolders: string[];
  
  // 프리셋 설정
  folderPresetMappings?: {folder: string, presetId: string}[];
  tagPresetMappings?: {tag: string, presetId: string}[];
  presetPriorities?: {id: string, type: 'folder' | 'tag', target: string}[];
}

// 기본 설정값도 업데이트
const DEFAULT_SETTINGS: CardNavigatorSettings = {
  defaultMode: 'folder',
  defaultLayout: 'grid',
  cardWidth: 300,
  cardHeight: 200,
  priorityTags: [],
  priorityFolders: [],
  includeSubfolders: true,
  defaultCardSet: '/',
  isCardSetFixed: false,
  
  // 새로 추가된 기본값
  cardHeaderContent: 'filename',
  cardBodyContent: 'content',
  cardFooterContent: 'tags',
  renderingMode: 'text',
  normalCardBgColor: '#ffffff',
  activeCardBgColor: '#f0f0f0',
  focusedCardBgColor: '#e0e0e0',
  headerBgColor: '#f5f5f5',
  bodyBgColor: '#ffffff',
  footerBgColor: '#f5f5f5',
  headerFontSize: 16,
  bodyFontSize: 14,
  footerFontSize: 12,
  tagModeSearchOptions: ['path', 'date'],
  folderModeSearchOptions: ['tag', 'date'],
  frontmatterSearchKey: '',
  sortBy: 'filename',
  sortOrder: 'asc',
  customSortKey: '',
  fixedCardHeight: true,
  cardMinWidth: 250,
  cardMinHeight: 150,
  folderPresetMappings: [],
  tagPresetMappings: [],
  presetPriorities: []
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
    
    // 서비스 초기화
    this.initializeServices();
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
    
    // 뷰 타입 등록
    this.registerView(
      'card-navigator-view',
      (leaf) => new CardNavigatorView(leaf)
    );
    
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
    await this.activateView();
    
    console.log('카드 네비게이터 플러그인 로드 완료');
  }

  onunload() {
    console.log('Card Navigator plugin unloaded');
  }

  async loadSettings() {
    try {
      // 옵시디언 플러그인 표준 방식으로 설정 로드
      const data = await this.loadData();
      this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
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
    const { workspace } = this.app;
    
    // 이미 열려있는 뷰 확인
    const existingLeaves = workspace.getLeavesOfType('card-navigator-view');
    
    if (existingLeaves.length > 0) {
      // 이미 열려있는 뷰가 있으면 활성화
      workspace.revealLeaf(existingLeaves[0]);
    } else {
      // 새 뷰 생성 - 오른쪽 사이드 패널에 생성
      const leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({
          type: 'card-navigator-view',
          active: true,
        });
        workspace.revealLeaf(leaf);
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
   * 현재 카드 네비게이터 상태 정보를 콘솔에 출력
   */
  showStatus(): void {
    if (!this.cardNavigatorService) {
      console.log('카드 네비게이터 서비스가 초기화되지 않았습니다.');
      return;
    }

    const modeService = this.cardNavigatorService.getModeService();
    const currentMode = modeService.getCurrentModeType();
    const currentCardSet = modeService.getCurrentCardSet() || '/';
    const isCardSetFixed = modeService.isCardSetFixed();
    const includeSubfolders = modeService.getIncludeSubfolders();

    console.log('===== 카드 네비게이터 상태 정보 =====');
    console.log(`현재 모드: ${currentMode === 'folder' ? '폴더 모드' : '태그 모드'}`);
    console.log(`현재 ${currentMode === 'folder' ? '폴더 경로' : '태그'}: ${currentCardSet}`);
    console.log(`카드 세트 고정 여부: ${isCardSetFixed ? '고정됨' : '고정되지 않음'}`);
    console.log(`하위 폴더 포함 여부: ${includeSubfolders ? '포함' : '미포함'}`);
    console.log('===================================');
  }

  private initializeServices() {
    console.log('카드 네비게이터 서비스 초기화 중...');
    
    try {
      // ObsidianAdapter와 CardRepositoryImpl을 생성하여 CardNavigatorService에 전달
      const obsidianAdapter = new ObsidianAdapter(this.app);
      const cardFactory = new CardFactory();
      const cardRepository = new CardRepositoryImpl(obsidianAdapter, cardFactory);
      this.cardNavigatorService = new CardNavigatorService(
        this.app, 
        cardRepository, 
        this.settings.defaultMode
      );
      console.log('카드 네비게이터 서비스 초기화 완료');
    } catch (error) {
      console.error('카드 네비게이터 서비스 초기화 중 오류 발생:', error);
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