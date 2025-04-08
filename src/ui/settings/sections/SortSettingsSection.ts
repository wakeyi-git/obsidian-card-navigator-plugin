import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { Container } from '@/infrastructure/di/Container';
import type { ISettingsService } from '@/domain/services/application/ISettingsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { SortField, SortDirection, SortType, SortOrder } from '@/domain/models/Sort';

/**
 * 정렬 설정 섹션
 */
export class SortSettingsSection {
  private settingsService: ISettingsService;
  private eventDispatcher: IEventDispatcher;

  constructor(private plugin: CardNavigatorPlugin, eventDispatcher: IEventDispatcher) {
    // 설정 서비스 가져오기
    this.settingsService = Container.getInstance().resolve<ISettingsService>('ISettingsService');
    this.eventDispatcher = eventDispatcher;
  }

  /**
   * 정렬 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '정렬 설정' });

    const settings = this.settingsService.getSettings();

    // 기본 정렬 설정
    containerEl.createEl('h4', { text: '기본 정렬' });

    // 정렬 필드
    new Setting(containerEl)
      .setName('정렬 필드')
      .setDesc('카드 목록의 정렬 기준을 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption('fileName', '파일명')
          .addOption('created', '생성일')
          .addOption('modified', '수정일')
          .addOption('custom', '사용자 정의')
          .setValue(settings.sort.config.field)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              sort: {
                ...settings.sort,
                config: {
                  ...settings.sort.config,
                  field: value as SortField
                }
              }
            });
          }));

    // 정렬 방향
    new Setting(containerEl)
      .setName('정렬 방향')
      .setDesc('카드 목록의 정렬 방향을 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption('asc', '오름차순')
          .addOption('desc', '내림차순')
          .setValue(settings.sort.config.direction)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              sort: {
                ...settings.sort,
                config: {
                  ...settings.sort.config,
                  direction: value as SortDirection
                }
              }
            });
          }));

    // 정렬 타입
    new Setting(containerEl)
      .setName('정렬 타입')
      .setDesc('카드 목록의 정렬 타입을 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption('name', '이름')
          .addOption('date', '날짜')
          .setValue(settings.sort.config.type)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              sort: {
                ...settings.sort,
                config: {
                  ...settings.sort.config,
                  type: value as SortType
                }
              }
            });
          }));

    // 정렬 순서
    new Setting(containerEl)
      .setName('정렬 순서')
      .setDesc('카드 목록의 정렬 순서를 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption('asc', '오름차순')
          .addOption('desc', '내림차순')
          .setValue(settings.sort.config.order)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              sort: {
                ...settings.sort,
                config: {
                  ...settings.sort.config,
                  order: value as SortOrder
                }
              }
            });
          }));

    // 사용자 정의 정렬 필드
    if (settings.sort.config.field === 'custom') {
      new Setting(containerEl)
        .setName('사용자 정의 정렬 필드')
        .setDesc('사용자 정의 정렬 필드를 입력합니다.')
        .addText(text =>
          text
            .setValue(settings.sort.config.customField || '')
            .onChange(async (value) => {
              await this.settingsService.saveSettings({
                ...settings,
                sort: {
                  ...settings.sort,
                  config: {
                    ...settings.sort.config,
                    customField: value
                  }
                }
              });
            }));
    }

    // 우선순위 설정
    containerEl.createEl('h4', { text: '우선순위 설정' });

    // 우선순위 태그
    new Setting(containerEl)
      .setName('우선순위 태그')
      .setDesc('우선순위로 정렬할 태그를 쉼표로 구분하여 입력합니다.')
      .addText(text =>
        text
          .setValue(settings.sort.config.priorityTags.join(', '))
          .onChange(async (value) => {
            const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
            await this.settingsService.saveSettings({
              ...settings,
              sort: {
                ...settings.sort,
                config: {
                  ...settings.sort.config,
                  priorityTags: tags
                }
              }
            });
          }));

    // 우선순위 폴더
    new Setting(containerEl)
      .setName('우선순위 폴더')
      .setDesc('우선순위로 정렬할 폴더를 쉼표로 구분하여 입력합니다.')
      .addText(text =>
        text
          .setValue(settings.sort.config.priorityFolders.join(', '))
          .onChange(async (value) => {
            const folders = value.split(',').map(folder => folder.trim()).filter(folder => folder);
            await this.settingsService.saveSettings({
              ...settings,
              sort: {
                ...settings.sort,
                config: {
                  ...settings.sort.config,
                  priorityFolders: folders
                }
              }
            });
          }));
  }
} 