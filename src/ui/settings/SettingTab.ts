import { App, PluginSettingTab, Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';

/**
 * 카드 네비게이터 설정 탭
 */
export class CardNavigatorSettingTab extends PluginSettingTab {
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