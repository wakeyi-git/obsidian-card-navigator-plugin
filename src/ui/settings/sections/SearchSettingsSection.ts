import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { Container } from '@/infrastructure/di/Container';
import type { ISettingsService } from '@/domain/services/application/ISettingsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';

/**
 * 검색 설정 섹션
 */
export class SearchSettingsSection {
  private settingsService: ISettingsService;
  private eventDispatcher: IEventDispatcher;

  constructor(private plugin: CardNavigatorPlugin, eventDispatcher: IEventDispatcher) {
    // 설정 서비스 가져오기
    this.settingsService = Container.getInstance().resolve<ISettingsService>('ISettingsService');
    this.eventDispatcher = eventDispatcher;
  }

  /**
   * 검색 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '검색 설정' });

    const settings = this.settingsService.getSettings();

    // 검색 범위
    new Setting(containerEl)
      .setName('검색 범위')
      .setDesc('검색할 범위를 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption('all', '전체')
          .addOption('current', '현재 카드셋')
          .setValue(settings.search.config.criteria.scope)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              search: {
                ...settings.search,
                config: {
                  ...settings.search.config,
                  criteria: {
                    ...settings.search.config.criteria,
                    scope: value as 'all' | 'current'
                  }
                }
              }
            });
          }));

    // 검색 옵션 섹션
    containerEl.createEl('h4', { text: '검색 옵션' });

    // 대소문자 구분
    new Setting(containerEl)
      .setName('대소문자 구분')
      .setDesc('검색 시 대소문자를 구분합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.search.config.criteria.caseSensitive)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              search: {
                ...settings.search,
                config: {
                  ...settings.search.config,
                  criteria: {
                    ...settings.search.config.criteria,
                    caseSensitive: value
                  }
                }
              }
            });
          }));

    // 정규식 사용
    new Setting(containerEl)
      .setName('정규식 사용')
      .setDesc('검색어를 정규식으로 처리합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.search.config.criteria.useRegex)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              search: {
                ...settings.search,
                config: {
                  ...settings.search.config,
                  criteria: {
                    ...settings.search.config.criteria,
                    useRegex: value
                  }
                }
              }
            });
          }));

    // 전체 단어 일치
    new Setting(containerEl)
      .setName('전체 단어 일치')
      .setDesc('검색어와 정확히 일치하는 단어만 검색합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.search.config.criteria.wholeWord)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              search: {
                ...settings.search,
                config: {
                  ...settings.search.config,
                  criteria: {
                    ...settings.search.config.criteria,
                    wholeWord: value
                  }
                }
              }
            });
          }));

    // 검색 히스토리 섹션
    containerEl.createEl('h4', { text: '검색 히스토리' });

    // 최대 히스토리 수
    new Setting(containerEl)
      .setName('최대 히스토리 수')
      .setDesc('저장할 검색 히스토리의 최대 개수를 설정합니다.')
      .addText(text =>
        text
          .setValue(settings.search.config.maxHistory.toString())
          .onChange(async (value) => {
            const limit = parseInt(value);
            if (!isNaN(limit) && limit > 0) {
              await this.settingsService.saveSettings({
                ...settings,
                search: {
                  ...settings.search,
                  config: {
                    ...settings.search.config,
                    maxHistory: limit
                  }
                }
              });
            }
          }));
  }
} 