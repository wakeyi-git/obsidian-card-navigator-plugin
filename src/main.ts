import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { CardNavigatorView, VIEW_TYPE_CARD_NAVIGATOR } from './ui/views/CardNavigatorView';
import { Container } from './infrastructure/di/Container';
import { LoggingService } from './infrastructure/LoggingService';
import { ErrorHandler } from './infrastructure/ErrorHandler';
import { PerformanceMonitor } from './infrastructure/PerformanceMonitor';
import { AnalyticsService } from './infrastructure/AnalyticsService';
import { EventDispatcher } from '@/domain/events/EventDispatcher';
import { CardService } from './application/services/CardService';
import { CardSetService } from './application/services/CardSetService';
import { CardDisplayManager } from './application/manager/CardDisplayManager';
import { CardInteractionService } from './application/services/CardInteractionService';
import { CardNavigatorViewModel } from './ui/viewModels/CardNavigatorViewModel';
import { CardFactory } from './application/factories/CardFactory';
import { LayoutService } from './application/services/LayoutService';
import { SearchService } from './application/services/SearchService';
import { SortService } from './application/services/SortService';
import { FocusManager } from './application/services/FocusManager';
import { ActiveFileWatcher } from './application/services/ActiveFileWatcher';
import { ClipboardService } from './application/services/ClipboardService';
import { FileService } from './application/services/FileService';
import { RenderManager } from './application/manager/RenderManager';
import { PresetManager } from './application/manager/PresetManager';
import { PresetService } from './application/services/PresetService';
import { ToolbarService } from './application/services/ToolbarService';

interface CardNavigatorSettings {
  defaultCardSetType: 'folder' | 'tag' | 'link';
  defaultCardSetCriteria: string;
  includeSubfolders: boolean;
  linkLevel: number;
  cardHeightFixed: boolean;
  cardMinWidth: number;
  cardMinHeight: number;
  priorityTags: string[];
  priorityFolders: string[];
}

const DEFAULT_SETTINGS: CardNavigatorSettings = {
  defaultCardSetType: 'folder',
  defaultCardSetCriteria: '',
  includeSubfolders: true,
  linkLevel: 1,
  cardHeightFixed: false,
  cardMinWidth: 300,
  cardMinHeight: 200,
  priorityTags: [],
  priorityFolders: []
};

export default class CardNavigatorPlugin extends Plugin {
  settings: CardNavigatorSettings;
  private container: Container;

  async onload() {
    await this.loadSettings();

    // DI 컨테이너 초기화
    this.container = Container.getInstance();
    this.initializeContainer();

    // 뷰 등록
    this.registerView(
      VIEW_TYPE_CARD_NAVIGATOR,
      (leaf) => new CardNavigatorView(leaf)
    );

    // 리본 아이콘 추가
    this.addRibbonIcon('layers', '카드 내비게이터', () => {
      this.activateView();
    });

    // 설정 탭 추가
    this.addSettingTab(new CardNavigatorSettingTab(this.app, this));
  }

  onunload() {
    this.container.clear();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private initializeContainer() {
    // App 인스턴스 등록
    this.container.register('App', () => this.app, true);

    // 인프라스트럭처 서비스 등록
    this.container.register('ILoggingService', () => LoggingService.getInstance(), true);
    this.container.register('IErrorHandler', () => ErrorHandler.getInstance(), true);
    this.container.register('IPerformanceMonitor', () => PerformanceMonitor.getInstance(), true);
    this.container.register('IAnalyticsService', () => AnalyticsService.getInstance(), true);
    this.container.register('IEventDispatcher', () => EventDispatcher.getInstance(), true);

    // 애플리케이션 서비스 등록
    this.container.register('ICardService', () => CardService.getInstance(), true);
    this.container.register('ICardSetService', () => CardSetService.getInstance(), true);
    this.container.register('ICardDisplayManager', () => CardDisplayManager.getInstance(), true);
    this.container.register('ICardInteractionService', () => CardInteractionService.getInstance(), true);
    this.container.register('ICardFactory', () => CardFactory.getInstance(), true);
    this.container.register('ILayoutService', () => LayoutService.getInstance(), true);
    this.container.register('ISearchService', () => SearchService.getInstance(), true);
    this.container.register('ISortService', () => SortService.getInstance(), true);
    this.container.register('IFocusManager', () => FocusManager.getInstance(), true);
    this.container.register('IActiveFileWatcher', () => ActiveFileWatcher.getInstance(), true);
    this.container.register('IClipboardService', () => ClipboardService.getInstance(), true);
    this.container.register('IFileService', () => FileService.getInstance(), true);
    this.container.register('IRenderManager', () => RenderManager.getInstance(), true);
    this.container.register('IPresetManager', () => PresetManager.getInstance(), true);
    this.container.register('IPresetService', () => PresetService.getInstance(), true);
    this.container.register('IToolbarService', () => ToolbarService.getInstance(), true);

    // 뷰모델 등록
    this.container.register('ICardNavigatorViewModel', () => CardNavigatorViewModel.getInstance(), true);
  }

  private async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getRightLeaf(false);
    if (!leaf) {
      leaf = workspace.getLeaf('split', 'vertical');
    }
    await leaf.setViewState({
      type: VIEW_TYPE_CARD_NAVIGATOR,
      active: true,
    });
  }
}

class CardNavigatorSettingTab extends PluginSettingTab {
  plugin: CardNavigatorPlugin;

  constructor(app: App, plugin: CardNavigatorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: '카드 내비게이터 설정' });

    new Setting(containerEl)
      .setName('기본 카드셋 타입')
      .setDesc('카드 내비게이터를 열 때 사용할 기본 카드셋 타입을 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption('folder', '폴더')
          .addOption('tag', '태그')
          .addOption('link', '링크')
          .setValue(this.plugin.settings.defaultCardSetType)
          .onChange(async (value) => {
            this.plugin.settings.defaultCardSetType = value as 'folder' | 'tag' | 'link';
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('기본 카드셋 기준')
      .setDesc('기본 카드셋의 기준값을 입력합니다.')
      .addText(text =>
        text
          .setValue(this.plugin.settings.defaultCardSetCriteria)
          .onChange(async (value) => {
            this.plugin.settings.defaultCardSetCriteria = value;
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('하위 폴더 포함')
      .setDesc('폴더 카드셋에서 하위 폴더의 노트도 포함합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.includeSubfolders)
          .onChange(async (value) => {
            this.plugin.settings.includeSubfolders = value;
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('링크 레벨')
      .setDesc('링크 카드셋에서 표시할 링크의 깊이를 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(1, 5, 1)
          .setValue(this.plugin.settings.linkLevel)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.linkLevel = value;
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('카드 높이 고정')
      .setDesc('카드의 높이를 고정하여 그리드 레이아웃을 사용합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.cardHeightFixed)
          .onChange(async (value) => {
            this.plugin.settings.cardHeightFixed = value;
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('카드 최소 너비')
      .setDesc('카드의 최소 너비를 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(200, 800, 50)
          .setValue(this.plugin.settings.cardMinWidth)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.cardMinWidth = value;
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('카드 최소 높이')
      .setDesc('카드의 최소 높이를 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(100, 600, 50)
          .setValue(this.plugin.settings.cardMinHeight)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.cardMinHeight = value;
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('우선 순위 태그')
      .setDesc('우선 순위로 표시할 태그를 쉼표로 구분하여 입력합니다.')
      .addText(text =>
        text
          .setValue(this.plugin.settings.priorityTags.join(', '))
          .onChange(async (value) => {
            this.plugin.settings.priorityTags = value.split(',').map(tag => tag.trim());
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('우선 순위 폴더')
      .setDesc('우선 순위로 표시할 폴더를 쉼표로 구분하여 입력합니다.')
      .addText(text =>
        text
          .setValue(this.plugin.settings.priorityFolders.join(', '))
          .onChange(async (value) => {
            this.plugin.settings.priorityFolders = value.split(',').map(folder => folder.trim());
            await this.plugin.saveSettings();
          }));
  }
} 