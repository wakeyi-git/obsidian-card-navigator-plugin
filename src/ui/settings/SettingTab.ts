import { App, PluginSettingTab, Setting } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { ICardNavigatorSettings } from './types/SettingsTypes';

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
    
    // 기본 설정 섹션
    containerEl.createEl('h3', { text: '기본 설정' });
    
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
      
    // 카드 설정 섹션
    containerEl.createEl('h3', { text: '카드 설정' });

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
      
    // 렌더링 방식 설정
    new Setting(containerEl)
      .setName('렌더링 방식')
      .setDesc('카드 내용의 렌더링 방식')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('text', '일반 텍스트')
          .addOption('html', 'HTML (이미지, 코드블록, 콜아웃, 수식 등)')
          .setValue(this.plugin.settings.renderingMode || 'text')
          .onChange(async (value) => {
            this.plugin.settings.renderingMode = value;
            await this.plugin.saveSettings();
          })
      );
      
    // 정렬 설정 섹션
    containerEl.createEl('h3', { text: '정렬 설정' });
    
    // 정렬 기준 설정
    new Setting(containerEl)
      .setName('정렬 기준')
      .setDesc('카드 정렬 기준')
      .addDropdown((dropdown) => {
        dropdown
          .addOption('filename', '파일 이름')
          .addOption('modified', '수정 날짜')
          .addOption('created', '생성 날짜')
          .addOption('custom', '사용자 지정 (프론트매터)')
          .setValue(this.plugin.settings.sortBy || 'filename')
          .onChange(async (value) => {
            this.plugin.settings.sortBy = value;
            await this.plugin.saveSettings();
            // 사용자 지정 정렬 키 설정 표시/숨김
            this.display();
          });
      });
      
    // 사용자 지정 정렬 키 설정 (sortBy가 'custom'일 때만 표시)
    if (this.plugin.settings.sortBy === 'custom') {
      new Setting(containerEl)
        .setName('사용자 지정 정렬 키')
        .setDesc('프론트매터에서 사용할 정렬 키')
        .addText((text) =>
          text
            .setValue(this.plugin.settings.customSortKey || '')
            .onChange(async (value) => {
              this.plugin.settings.customSortKey = value;
              await this.plugin.saveSettings();
            })
        );
    }
    
    // 정렬 순서 설정
    new Setting(containerEl)
      .setName('정렬 순서')
      .setDesc('카드 정렬 순서')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('asc', '오름차순 (A→Z, 과거→현재)')
          .addOption('desc', '내림차순 (Z→A, 현재→과거)')
          .setValue(this.plugin.settings.sortOrder || 'asc')
          .onChange(async (value) => {
            this.plugin.settings.sortOrder = value as 'asc' | 'desc';
            await this.plugin.saveSettings();
          })
      );
      
    // 우선 순위 설정 섹션
    containerEl.createEl('h3', { text: '우선 순위 설정' });

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
      
    // 고급 설정 버튼
    new Setting(containerEl)
      .setName('고급 설정')
      .setDesc('더 많은 설정 옵션을 제공하는 고급 설정 모달을 엽니다.')
      .addButton((button) =>
        button
          .setButtonText('고급 설정 열기')
          .onClick(() => {
            // 고급 설정 모달 열기 (플러그인에서 구현 필요)
            this.plugin.openSettingsModal();
          })
      );
  }
}