import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { CardNavigatorView, VIEW_TYPE_CARD_NAVIGATOR } from './ui/View';
import { CardNavigatorSettingTab } from './ui/SettingTab';
import { CardNavigatorSettings } from './domain/settings/Settings';

export default class CardNavigatorPlugin extends Plugin {
  settings: CardNavigatorSettings;

  constructor(app: App, manifest: any) {
    super(app, manifest);
    this.settings = new CardNavigatorSettings();
  }

  async onload() {
    // 설정 로드
    await this.loadSettings();

    // 뷰 등록
    this.registerView(VIEW_TYPE_CARD_NAVIGATOR, (leaf: WorkspaceLeaf) => {
      return new CardNavigatorView(leaf, this);
    });

    // 설정 탭 추가
    this.addSettingTab(new CardNavigatorSettingTab(this.app, this));

    // 리본 아이콘 추가
    this.addRibbonIcon('layers', '카드 내비게이터', () => {
      this.activateView();
    });

    // 명령어 추가
    this.addCommand({
      id: 'card-navigator-toggle',
      name: '카드 내비게이터 토글',
      callback: () => {
        this.activateView();
      }
    });
  }

  onunload() {
    // 뷰 제거
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
  }

  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, new CardNavigatorSettings(), data);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getRightLeaf(false);
    
    if (leaf) {
      await leaf.setViewState({
        type: VIEW_TYPE_CARD_NAVIGATOR,
        active: true,
      });
      workspace.revealLeaf(leaf);
    }
  }
} 