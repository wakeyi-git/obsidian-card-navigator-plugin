import { Setting } from 'obsidian';
import { ICardNavigatorSettings } from '@/ui/components/SettingsTab';

export class SortSettings {
  constructor(
    private readonly containerEl: HTMLElement,
    private readonly plugin: any
  ) {}

  display(): void {
    // 정렬 설정 섹션
    new Setting(this.containerEl)
      .setName('정렬 설정')
      .setHeading();

    // 일반 정렬 설정
    new Setting(this.containerEl)
      .setName('일반 정렬')
      .setHeading();

    // 정렬 기준
    new Setting(this.containerEl)
      .setName('정렬 기준')
      .addDropdown(dropdown => {
        dropdown
          .addOption('fileName', '파일명')
          .addOption('firstHeader', '첫 번째 헤더')
          .addOption('createdAt', '생성일')
          .addOption('updatedAt', '수정일')
          .addOption('custom', '사용자 지정')
          .setValue(this.plugin.settings.sortBy)
          .onChange(async (value: 'fileName' | 'firstHeader' | 'createdAt' | 'updatedAt' | 'custom') => {
            this.plugin.settings.sortBy = value;
            if (value === 'custom') {
              this._showCustomSortField();
            } else {
              this._hideCustomSortField();
            }
            this.plugin.saveSettings();
          });
      });

    // 정렬 순서
    new Setting(this.containerEl)
      .setName('정렬 순서')
      .addDropdown(dropdown => {
        dropdown
          .addOption('asc', '오름차순')
          .addOption('desc', '내림차순')
          .setValue(this.plugin.settings.sortOrder)
          .onChange(async (value: 'asc' | 'desc') => {
            this.plugin.settings.sortOrder = value;
            this.plugin.saveSettings();
          });
      });

    // 특별 정렬 설정
    new Setting(this.containerEl)
      .setName('특별 정렬')
      .setHeading();

    // 우선 순위 태그
    new Setting(this.containerEl)
      .setName('우선 순위 태그')
      .setDesc('쉼표로 구분된 태그 목록을 입력하세요. (예: #중요, #프로젝트, #할일)')
      .addTextArea(text => {
        text
          .setValue(this.plugin.settings.priorityTags?.join(', ') || '')
          .onChange(async (value: string) => {
            this.plugin.settings.priorityTags = value
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag.startsWith('#'));
            this.plugin.saveSettings();
          });
      });

    // 우선 순위 폴더
    new Setting(this.containerEl)
      .setName('우선 순위 폴더')
      .setDesc('쉼표로 구분된 폴더 경로를 입력하세요. (예: /프로젝트, /일일노트, /중요)')
      .addTextArea(text => {
        text
          .setValue(this.plugin.settings.priorityFolders?.join(', ') || '')
          .onChange(async (value: string) => {
            this.plugin.settings.priorityFolders = value
              .split(',')
              .map(folder => folder.trim())
              .filter(folder => folder.startsWith('/'));
            this.plugin.saveSettings();
          });
      });

    // 사용자 지정 정렬 필드
    if (this.plugin.settings.sortBy === 'custom') {
      this._showCustomSortField();
    }
  }

  private _showCustomSortField(): void {
    new Setting(this.containerEl)
      .setName('사용자 지정 정렬 필드')
      .setDesc('frontmatter에서 사용할 필드명을 입력하세요.')
      .addText(text => {
        text
          .setValue(this.plugin.settings.customSortField || '')
          .onChange(async (value: string) => {
            this.plugin.settings.customSortField = value || undefined;
            this.plugin.saveSettings();
          });
      });
  }

  private _hideCustomSortField(): void {
    const customSortFieldSetting = this.containerEl.querySelector('.setting-item:has(input[type="text"])');
    if (customSortFieldSetting) {
      customSortFieldSetting.remove();
    }
  }
} 