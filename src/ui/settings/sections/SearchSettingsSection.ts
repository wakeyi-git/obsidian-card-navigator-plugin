import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';

/**
 * 검색 설정 섹션
 */
export class SearchSettingsSection {
  constructor(private plugin: CardNavigatorPlugin) {}

  /**
   * 검색 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '검색 설정' });

    // 검색 범위
    new Setting(containerEl)
      .setName('검색 범위')
      .setDesc('검색할 범위를 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption('all', '전체')
          .addOption('current', '현재 카드셋')
          .setValue(this.plugin.settings.searchScope)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              searchScope: value as 'all' | 'current'
            };
            await this.plugin.saveSettings();
          }));

    // 검색 옵션 섹션
    containerEl.createEl('h4', { text: '검색 옵션' });

    // 파일명 검색
    new Setting(containerEl)
      .setName('파일명 검색')
      .setDesc('파일명에서도 검색합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.searchFilename)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              searchFilename: value
            };
            await this.plugin.saveSettings();
          }));

    // 내용 검색
    new Setting(containerEl)
      .setName('내용 검색')
      .setDesc('파일 내용에서도 검색합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.searchContent)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              searchContent: value
            };
            await this.plugin.saveSettings();
          }));

    // 태그 검색
    new Setting(containerEl)
      .setName('태그 검색')
      .setDesc('태그에서도 검색합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.searchTags)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              searchTags: value
            };
            await this.plugin.saveSettings();
          }));

    // 검색 옵션 섹션
    containerEl.createEl('h4', { text: '검색 옵션' });

    // 대소문자 구분
    new Setting(containerEl)
      .setName('대소문자 구분')
      .setDesc('검색 시 대소문자를 구분합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.caseSensitive)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              caseSensitive: value
            };
            await this.plugin.saveSettings();
          }));

    // 정규식 사용
    new Setting(containerEl)
      .setName('정규식 사용')
      .setDesc('검색어를 정규식으로 처리합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.useRegex)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              useRegex: value
            };
            await this.plugin.saveSettings();
          }));
  }
} 