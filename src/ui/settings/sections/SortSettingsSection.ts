import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { SortField, SortOrder } from '@/domain/models/SortConfig';

/**
 * 정렬 설정 섹션
 */
export class SortSettingsSection {
  constructor(private plugin: CardNavigatorPlugin) {}

  /**
   * 정렬 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '정렬 설정' });

    // 기본 정렬 설정
    containerEl.createEl('h4', { text: '기본 정렬' });

    // 정렬 기준
    new Setting(containerEl)
      .setName('정렬 기준')
      .setDesc('카드 목록의 정렬 기준을 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption(SortField.FILENAME, '파일명')
          .addOption(SortField.UPDATED, '수정일')
          .addOption(SortField.CREATED, '생성일')
          .setValue(this.plugin.settings.sortField)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              sortField: value as SortField
            };
            await this.plugin.saveSettings();
          }));

    // 정렬 순서
    new Setting(containerEl)
      .setName('정렬 순서')
      .setDesc('카드 목록의 정렬 순서를 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption(SortOrder.ASC, '오름차순')
          .addOption(SortOrder.DESC, '내림차순')
          .setValue(this.plugin.settings.sortOrder)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              sortOrder: value as SortOrder
            };
            await this.plugin.saveSettings();
          }));

    // 우선순위 설정
    containerEl.createEl('h4', { text: '우선순위 설정' });

    // 우선순위 태그
    new Setting(containerEl)
      .setName('우선순위 태그')
      .setDesc('우선순위 태그를 쉼표로 구분하여 입력합니다. 이 태그가 포함된 노트가 상단에 표시됩니다.')
      .addTextArea(text => text
        .setValue(this.plugin.settings.priorityTags.join(', '))
        .onChange(async (value) => {
          const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
          this.plugin.settings = {
            ...this.plugin.settings,
            priorityTags: tags
          };
          await this.plugin.saveSettings();
        }));

    // 우선순위 폴더
    new Setting(containerEl)
      .setName('우선순위 폴더')
      .setDesc('우선순위 폴더를 쉼표로 구분하여 입력합니다. 이 폴더에 있는 노트가 상단에 표시됩니다.')
      .addTextArea(text => text
        .setValue(this.plugin.settings.priorityFolders.join(', '))
        .onChange(async (value) => {
          const folders = value.split(',').map(folder => folder.trim()).filter(folder => folder);
          this.plugin.settings = {
            ...this.plugin.settings,
            priorityFolders: folders
          };
          await this.plugin.saveSettings();
        }));
  }
} 