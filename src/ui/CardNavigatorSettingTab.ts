import { App, PluginSettingTab, Setting } from 'obsidian';
import { CardNavigatorPlugin } from '../main';

/**
 * 카드 네비게이터 설정 탭
 * 플러그인 설정 UI를 제공합니다.
 */
export class CardNavigatorSettingTab extends PluginSettingTab {
  plugin: CardNavigatorPlugin;

  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param plugin 플러그인 인스턴스
   */
  constructor(app: App, plugin: CardNavigatorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * 설정 UI 표시
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: '카드 네비게이터 설정' });

    // 카드셋 설정
    containerEl.createEl('h3', { text: '카드셋 설정' });
    
    new Setting(containerEl)
      .setName('기본 카드셋 소스')
      .setDesc('카드셋을 생성할 기본 소스 타입을 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('folder', '폴더')
        .addOption('tag', '태그')
        .setValue(this.plugin.settings.defaultCardSetSource)
        .onChange(async (value) => {
          this.plugin.settings.defaultCardSetSource = value as 'folder' | 'tag';
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('하위 폴더 포함')
      .setDesc('폴더 모드에서 하위 폴더의 노트를 포함할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeSubfolders)
        .onChange(async (value) => {
          this.plugin.settings.includeSubfolders = value;
          await this.plugin.saveSettings();
        }));
    
    // 카드 설정
    containerEl.createEl('h3', { text: '카드 설정' });
    
    new Setting(containerEl)
      .setName('카드 너비')
      .setDesc('카드의 기본 너비를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(100, 500, 10)
        .setValue(this.plugin.settings.cardWidth)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.cardWidth = value;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('카드 높이')
      .setDesc('카드의 기본 높이를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(50, 300, 10)
        .setValue(this.plugin.settings.cardHeight)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.cardHeight = value;
          await this.plugin.saveSettings();
        }));
    
    // 레이아웃 설정
    containerEl.createEl('h3', { text: '레이아웃 설정' });
    
    new Setting(containerEl)
      .setName('레이아웃 모드')
      .setDesc('카드 레이아웃 모드를 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('grid', '그리드 (고정 높이)')
        .addOption('masonry', '메이슨리 (가변 높이)')
        .setValue(this.plugin.settings.defaultLayout || 'grid')
        .onChange(async (value) => {
          this.plugin.settings.defaultLayout = value as 'grid' | 'masonry';
          await this.plugin.saveSettings();
        }));
    
    // 정렬 설정
    containerEl.createEl('h3', { text: '정렬 설정' });
    
    new Setting(containerEl)
      .setName('기본 정렬 기준')
      .setDesc('카드를 정렬할 기본 기준을 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('filename', '파일명')
        .addOption('created', '생성일')
        .addOption('modified', '수정일')
        .addOption('custom', '사용자 지정')
        .setValue(this.plugin.settings.defaultSortType || 'filename')
        .onChange(async (value) => {
          this.plugin.settings.defaultSortType = value;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('정렬 방향')
      .setDesc('카드 정렬 방향을 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('asc', '오름차순')
        .addOption('desc', '내림차순')
        .setValue(this.plugin.settings.defaultSortDirection || 'asc')
        .onChange(async (value) => {
          this.plugin.settings.defaultSortDirection = value as 'asc' | 'desc';
          await this.plugin.saveSettings();
        }));
    
    // 우선 순위 설정
    containerEl.createEl('h3', { text: '우선 순위 설정' });
    
    new Setting(containerEl)
      .setName('우선 순위 태그')
      .setDesc('우선적으로 표시할 태그를 쉼표로 구분하여 입력합니다.')
      .addText(text => text
        .setPlaceholder('tag1, tag2, tag3')
        .setValue((this.plugin.settings.priorityTags || []).join(', '))
        .onChange(async (value) => {
          this.plugin.settings.priorityTags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('우선 순위 폴더')
      .setDesc('우선적으로 표시할 폴더를 쉼표로 구분하여 입력합니다.')
      .addText(text => text
        .setPlaceholder('folder1, folder2, folder3')
        .setValue((this.plugin.settings.priorityFolders || []).join(', '))
        .onChange(async (value) => {
          this.plugin.settings.priorityFolders = value.split(',').map(folder => folder.trim()).filter(folder => folder);
          await this.plugin.saveSettings();
        }));
  }
} 