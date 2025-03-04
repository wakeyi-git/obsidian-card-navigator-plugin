import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { CardNavigatorView } from './ui/CardNavigatorView';
import { CardRepositoryImpl } from './infrastructure/CardRepositoryImpl';
import { ObsidianAdapter } from './infrastructure/ObsidianAdapter';
import { CardFactory } from './domain/card/CardFactory';
import { CardNavigatorService } from './application/CardNavigatorService';

// 카드 네비게이터 설정 인터페이스
export interface CardNavigatorSettings {
  defaultMode: 'folder' | 'tag';
  defaultLayout: 'grid' | 'masonry';
  cardWidth: number;
  cardHeight: number;
  priorityTags: string[];
  priorityFolders: string[];
  includeSubfolders: boolean;
  defaultCardSet: string;
  isCardSetFixed: boolean;
}

// 기본 설정
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
};

/**
 * 카드 네비게이터 플러그인 클래스
 */
export default class CardNavigatorPlugin extends Plugin {
  settings: CardNavigatorSettings = DEFAULT_SETTINGS;
  private cardNavigatorService: CardNavigatorService | null = null;

  async onload() {
    console.log('카드 네비게이터 플러그인 로드 중...');
    
    // 이미 로드 중인지 확인
    if ((this as any)._loading) {
      console.log('카드 네비게이터 플러그인이 이미 로드 중입니다. 중복 로드 방지');
      return;
    }
    
    (this as any)._loading = true;
    
    try {
      // 설정 로드
      await this.loadSettings();
      
      // 카드 네비게이터 뷰 등록
      this.registerView(
        'card-navigator-view',
        (leaf) => new CardNavigatorView(leaf)
      );
      
      // 리본 아이콘 추가
      this.addRibbonIcon('layout-grid', '카드 네비게이터', () => {
        this.activateView();
      });
      
      // 명령어 등록
      this.addCommand({
        id: 'open-card-navigator',
        name: '카드 네비게이터 열기',
        callback: () => {
          this.activateView();
        }
      });
      
      // 카드 네비게이터 상태 정보 출력 명령어 추가
      this.addCommand({
        id: 'show-card-navigator-status',
        name: '카드 네비게이터 상태 정보 출력',
        callback: () => {
          this.showStatus();
        }
      });
      
      // 설정 탭 추가
      this.addSettingTab(new CardNavigatorSettingTab(this.app, this));
      
      // 워크스페이스에 뷰 타입 등록
      this.app.workspace.onLayoutReady(() => {
        if (this.app.workspace.getLeavesOfType('card-navigator-view').length === 0) {
          this.activateView();
        }
      });
      
      // 폴더 모드 명령어 추가
      this.addCommand({
        id: 'switch-to-folder-mode',
        name: '폴더 모드로 전환',
        callback: () => {
          if (this.cardNavigatorService) {
            this.cardNavigatorService.getModeService().changeMode('folder');
          }
        },
      });
      
      // 태그 모드 명령어 추가
      this.addCommand({
        id: 'switch-to-tag-mode',
        name: '태그 모드로 전환',
        callback: () => {
          if (this.cardNavigatorService) {
            this.cardNavigatorService.getModeService().changeMode('tag');
          }
        },
      });
      
      // 하위 폴더 포함 토글 명령어 추가
      this.addCommand({
        id: 'toggle-include-subfolders',
        name: '하위 폴더 포함 토글',
        callback: () => {
          if (this.cardNavigatorService) {
            const modeService = this.cardNavigatorService.getModeService();
            const currentValue = modeService.getIncludeSubfolders();
            modeService.setIncludeSubfolders(!currentValue);
            
            // 설정 업데이트
            this.settings.includeSubfolders = !currentValue;
            this.saveSettings();
          }
        },
      });
      
      // 카드 세트 고정 토글 명령어 추가
      this.addCommand({
        id: 'toggle-card-set-fixed',
        name: '카드 세트 고정 토글',
        callback: () => {
          if (this.cardNavigatorService) {
            const modeService = this.cardNavigatorService.getModeService();
            const currentValue = modeService.isCardSetFixed();
            const currentCardSet = modeService.getCurrentCardSet();
            
            if (currentCardSet) {
              modeService.selectCardSet(currentCardSet, !currentValue);
              
              // 설정 업데이트
              this.settings.isCardSetFixed = !currentValue;
              this.saveSettings();
            }
          }
        },
      });
      
      console.log('카드 네비게이터 플러그인 로드 완료');
    } catch (error) {
      console.error('카드 네비게이터 플러그인 로드 중 오류 발생:', error);
    } finally {
      (this as any)._loading = false;
    }
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
}

/**
 * 카드 네비게이터 설정 탭
 */
class CardNavigatorSettingTab extends PluginSettingTab {
  plugin: CardNavigatorPlugin;

  constructor(app: App, plugin: CardNavigatorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: '카드 네비게이터 설정' });

    // 기본 모드 설정
    new Setting(containerEl)
      .setName('기본 모드')
      .setDesc('카드 네비게이터를 열 때 사용할 기본 모드')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('folder', '폴더 모드')
          .addOption('tag', '태그 모드')
          .setValue(this.plugin.settings.defaultMode)
          .onChange(async (value) => {
            this.plugin.settings.defaultMode = value as 'folder' | 'tag';
            await this.plugin.saveSettings();
          })
      );

    // 기본 레이아웃 설정
    new Setting(containerEl)
      .setName('기본 레이아웃')
      .setDesc('카드 네비게이터를 열 때 사용할 기본 레이아웃')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('grid', '그리드 레이아웃')
          .addOption('masonry', '메이슨리 레이아웃')
          .setValue(this.plugin.settings.defaultLayout)
          .onChange(async (value) => {
            this.plugin.settings.defaultLayout = value as 'grid' | 'masonry';
            await this.plugin.saveSettings();
          })
      );

    // 카드 너비 설정
    new Setting(containerEl)
      .setName('카드 너비')
      .setDesc('카드의 기본 너비 (픽셀)')
      .addSlider((slider) =>
        slider
          .setLimits(200, 500, 10)
          .setValue(this.plugin.settings.cardWidth)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.cardWidth = value;
            await this.plugin.saveSettings();
          })
      );

    // 카드 높이 설정
    new Setting(containerEl)
      .setName('카드 높이')
      .setDesc('카드의 기본 높이 (픽셀)')
      .addSlider((slider) =>
        slider
          .setLimits(150, 400, 10)
          .setValue(this.plugin.settings.cardHeight)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.cardHeight = value;
            await this.plugin.saveSettings();
          })
      );

    // 우선 태그 설정
    new Setting(containerEl)
      .setName('우선 태그')
      .setDesc('태그 목록에서 우선적으로 표시할 태그 (쉼표로 구분)')
      .addText((text) =>
        text
          .setValue(this.plugin.settings.priorityTags.join(', '))
          .onChange(async (value) => {
            this.plugin.settings.priorityTags = value
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0);
            await this.plugin.saveSettings();
          })
      );

    // 우선 폴더 설정
    new Setting(containerEl)
      .setName('우선 폴더')
      .setDesc('폴더 목록에서 우선적으로 표시할 폴더 (쉼표로 구분)')
      .addText((text) =>
        text
          .setValue(this.plugin.settings.priorityFolders.join(', '))
          .onChange(async (value) => {
            this.plugin.settings.priorityFolders = value
              .split(',')
              .map((folder) => folder.trim())
              .filter((folder) => folder.length > 0);
            await this.plugin.saveSettings();
          })
      );

    // 하위 폴더 포함 여부 설정
    new Setting(containerEl)
      .setName('하위 폴더 포함')
      .setDesc('카드 네비게이터에서 하위 폴더를 포함할지 여부')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.includeSubfolders)
          .onChange(async (value) => {
            this.plugin.settings.includeSubfolders = value;
            await this.plugin.saveSettings();
          })
      );

    // 기본 카드 세트 설정
    new Setting(containerEl)
      .setName('기본 카드 세트')
      .setDesc('카드 네비게이터에서 사용할 기본 카드 세트')
      .addText((text) =>
        text
          .setValue(this.plugin.settings.defaultCardSet)
          .onChange(async (value) => {
            this.plugin.settings.defaultCardSet = value;
            await this.plugin.saveSettings();
          })
      );

    // 카드 세트 고정 여부 설정
    new Setting(containerEl)
      .setName('카드 세트 고정')
      .setDesc('카드 세트를 고정할지 여부')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.isCardSetFixed)
          .onChange(async (value) => {
            this.plugin.settings.isCardSetFixed = value;
            await this.plugin.saveSettings();
          })
      );
  }
} 