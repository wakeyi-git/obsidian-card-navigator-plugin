import { App, PluginSettingTab, Setting } from 'obsidian';
import { CardNavigatorPlugin } from '../main';
import { LayoutDirectionPreference } from '../domain/settings/SettingsInterfaces';

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
      .setName('카드 높이 고정')
      .setDesc('카드 높이를 고정할지 여부를 설정합니다. 활성화하면 그리드 레이아웃, 비활성화하면 메이슨리 레이아웃이 적용됩니다.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.layout?.fixedCardHeight ?? true)
        .onChange(async (value) => {
          if (!this.plugin.settings.layout) {
            this.plugin.settings.layout = {
              fixedCardHeight: value,
              layoutDirectionPreference: LayoutDirectionPreference.AUTO,
              cardMinWidth: 200,
              cardMaxWidth: 400,
              cardMinHeight: 100,
              cardMaxHeight: 300,
              cardGap: 10,
              cardsetPadding: 10,
              cardSizeFactor: 1.0,
              useLayoutTransition: true
            };
          } else {
            this.plugin.settings.layout.fixedCardHeight = value;
          }
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('레이아웃 방향 선호도')
      .setDesc('레이아웃 방향을 자동으로 결정할지, 항상 세로 또는 가로 방향을 사용할지 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption(LayoutDirectionPreference.AUTO, '자동 (뷰포트 비율에 따라)')
        .addOption(LayoutDirectionPreference.VERTICAL, '항상 세로 레이아웃')
        .addOption(LayoutDirectionPreference.HORIZONTAL, '항상 가로 레이아웃')
        .setValue(this.plugin.settings.layout?.layoutDirectionPreference ?? LayoutDirectionPreference.AUTO)
        .onChange(async (value) => {
          if (!this.plugin.settings.layout) {
            this.plugin.settings.layout = {
              fixedCardHeight: true,
              layoutDirectionPreference: value as LayoutDirectionPreference,
              cardMinWidth: 200,
              cardMaxWidth: 400,
              cardMinHeight: 100,
              cardMaxHeight: 300,
              cardGap: 10,
              cardsetPadding: 10,
              cardSizeFactor: 1.0,
              useLayoutTransition: true
            };
          } else {
            this.plugin.settings.layout.layoutDirectionPreference = value as LayoutDirectionPreference;
          }
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('카드 최소 너비')
      .setDesc('카드의 최소 너비를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(100, 400, 10)
        .setValue(this.plugin.settings.layout?.cardMinWidth ?? 200)
        .setDynamicTooltip()
        .onChange(async (value) => {
          if (!this.plugin.settings.layout) {
            this.plugin.settings.layout = {
              fixedCardHeight: true,
              layoutDirectionPreference: LayoutDirectionPreference.AUTO,
              cardMinWidth: value,
              cardMaxWidth: 400,
              cardMinHeight: 100,
              cardMaxHeight: 300,
              cardGap: 10,
              cardsetPadding: 10,
              cardSizeFactor: 1.0,
              useLayoutTransition: true
            };
          } else {
            this.plugin.settings.layout.cardMinWidth = value;
          }
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('카드 최대 너비')
      .setDesc('카드의 최대 너비를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(200, 800, 10)
        .setValue(this.plugin.settings.layout?.cardMaxWidth ?? 400)
        .setDynamicTooltip()
        .onChange(async (value) => {
          if (!this.plugin.settings.layout) {
            this.plugin.settings.layout = {
              fixedCardHeight: true,
              layoutDirectionPreference: LayoutDirectionPreference.AUTO,
              cardMinWidth: 200,
              cardMaxWidth: value,
              cardMinHeight: 100,
              cardMaxHeight: 300,
              cardGap: 10,
              cardsetPadding: 10,
              cardSizeFactor: 1.0,
              useLayoutTransition: true
            };
          } else {
            this.plugin.settings.layout.cardMaxWidth = value;
          }
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('카드 최소 높이')
      .setDesc('카드의 최소 높이를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(50, 200, 10)
        .setValue(this.plugin.settings.layout?.cardMinHeight ?? 100)
        .setDynamicTooltip()
        .onChange(async (value) => {
          if (!this.plugin.settings.layout) {
            this.plugin.settings.layout = {
              fixedCardHeight: true,
              layoutDirectionPreference: LayoutDirectionPreference.AUTO,
              cardMinWidth: 200,
              cardMaxWidth: 400,
              cardMinHeight: value,
              cardMaxHeight: 300,
              cardGap: 10,
              cardsetPadding: 10,
              cardSizeFactor: 1.0,
              useLayoutTransition: true
            };
          } else {
            this.plugin.settings.layout.cardMinHeight = value;
          }
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('카드 최대 높이')
      .setDesc('카드의 최대 높이를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(100, 500, 10)
        .setValue(this.plugin.settings.layout?.cardMaxHeight ?? 300)
        .setDynamicTooltip()
        .onChange(async (value) => {
          if (!this.plugin.settings.layout) {
            this.plugin.settings.layout = {
              fixedCardHeight: true,
              layoutDirectionPreference: LayoutDirectionPreference.AUTO,
              cardMinWidth: 200,
              cardMaxWidth: 400,
              cardMinHeight: 100,
              cardMaxHeight: value,
              cardGap: 10,
              cardsetPadding: 10,
              cardSizeFactor: 1.0,
              useLayoutTransition: true
            };
          } else {
            this.plugin.settings.layout.cardMaxHeight = value;
          }
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('카드 간 간격')
      .setDesc('카드 사이의 간격을 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 30, 2)
        .setValue(this.plugin.settings.layout?.cardGap ?? 10)
        .setDynamicTooltip()
        .onChange(async (value) => {
          if (!this.plugin.settings.layout) {
            this.plugin.settings.layout = {
              fixedCardHeight: true,
              layoutDirectionPreference: LayoutDirectionPreference.AUTO,
              cardMinWidth: 200,
              cardMaxWidth: 400,
              cardMinHeight: 100,
              cardMaxHeight: 300,
              cardGap: value,
              cardsetPadding: 10,
              cardSizeFactor: 1.0,
              useLayoutTransition: true
            };
          } else {
            this.plugin.settings.layout.cardGap = value;
          }
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('카드셋 패딩')
      .setDesc('카드셋 컨테이너의 패딩을 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 30, 2)
        .setValue(this.plugin.settings.layout?.cardsetPadding ?? 10)
        .setDynamicTooltip()
        .onChange(async (value) => {
          if (!this.plugin.settings.layout) {
            this.plugin.settings.layout = {
              fixedCardHeight: true,
              layoutDirectionPreference: LayoutDirectionPreference.AUTO,
              cardMinWidth: 200,
              cardMaxWidth: 400,
              cardMinHeight: 100,
              cardMaxHeight: 300,
              cardGap: 10,
              cardsetPadding: value,
              cardSizeFactor: 1.0,
              useLayoutTransition: true
            };
          } else {
            this.plugin.settings.layout.cardsetPadding = value;
          }
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('카드 크기 조정 팩터')
      .setDesc('카드 크기를 미세 조정하기 위한 배율 팩터를 설정합니다. (0.8 ~ 1.2)')
      .addSlider(slider => slider
        .setLimits(0.8, 1.2, 0.05)
        .setValue(this.plugin.settings.layout?.cardSizeFactor ?? 1.0)
        .setDynamicTooltip()
        .onChange(async (value) => {
          if (!this.plugin.settings.layout) {
            this.plugin.settings.layout = {
              fixedCardHeight: true,
              layoutDirectionPreference: LayoutDirectionPreference.AUTO,
              cardMinWidth: 200,
              cardMaxWidth: 400,
              cardMinHeight: 100,
              cardMaxHeight: 300,
              cardGap: 10,
              cardsetPadding: 10,
              cardSizeFactor: value,
              useLayoutTransition: true
            };
          } else {
            this.plugin.settings.layout.cardSizeFactor = value;
          }
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('레이아웃 전환 애니메이션')
      .setDesc('레이아웃이 변경될 때 부드러운 전환 애니메이션을 사용할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.layout?.useLayoutTransition ?? true)
        .onChange(async (value) => {
          if (!this.plugin.settings.layout) {
            this.plugin.settings.layout = {
              fixedCardHeight: true,
              layoutDirectionPreference: LayoutDirectionPreference.AUTO,
              cardMinWidth: 200,
              cardMaxWidth: 400,
              cardMinHeight: 100,
              cardMaxHeight: 300,
              cardGap: 10,
              cardsetPadding: 10,
              cardSizeFactor: 1.0,
              useLayoutTransition: value
            };
          } else {
            this.plugin.settings.layout.useLayoutTransition = value;
          }
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