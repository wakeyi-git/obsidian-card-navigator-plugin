import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { CardSetType, ICardSetConfig, LinkType } from '@/domain/models/CardSet';
import { FolderSuggestModal } from '@/ui/modals/FolderSuggestModal';
import { TagSuggestModal } from '@/ui/modals/TagSuggestModal';
import { Container } from '@/infrastructure/di/Container';
import type { ISettingsService } from '@/domain/services/application/ISettingsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';

/**
 * 카드셋 설정 섹션
 */
export class CardSetSettingsSection {
  private settingsService: ISettingsService;
  private eventDispatcher: IEventDispatcher;
  private containerEl: HTMLElement;

  constructor(private plugin: CardNavigatorPlugin, eventDispatcher: IEventDispatcher) {
    const container = Container.getInstance();
    this.settingsService = container.resolve<ISettingsService>('ISettingsService');
    this.eventDispatcher = eventDispatcher;
  }

  /**
   * 카드셋 설정 UI 생성
   */
  create(containerEl: HTMLElement): void {
    this.containerEl = containerEl;
    this.containerEl.empty();
    this.containerEl.createEl('h3', { text: '카드셋 설정' });

    const settings = this.settingsService.getSettings();
    const cardSetConfig = settings.cardSet.config;

    // 카드셋 타입 선택
    new Setting(this.containerEl)
      .setName('카드셋 타입')
      .setDesc('카드를 그룹화할 기준을 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption(CardSetType.FOLDER, '폴더')
          .addOption(CardSetType.TAG, '태그')
          .addOption(CardSetType.LINK, '링크')
          .setValue(cardSetConfig.criteria.type)
          .onChange(async (value: CardSetType) => {
            const newConfig: ICardSetConfig = {
              ...cardSetConfig,
              criteria: {
                ...cardSetConfig.criteria,
                type: value
              }
            };
            await this.settingsService.saveSettings({
              ...settings,
              cardSet: {
                ...settings.cardSet,
                config: newConfig
              }
            });
            // 카드셋 타입이 변경되면 설정 UI를 다시 생성
            this.create(this.containerEl);
          });
      });

    // 카드셋 타입에 따른 설정 UI 생성
    switch (cardSetConfig.criteria.type) {
      case CardSetType.FOLDER:
        this.createFolderCardSetSettings(cardSetConfig, settings);
        break;
      case CardSetType.TAG:
        this.createTagCardSetSettings(cardSetConfig, settings);
        break;
      case CardSetType.LINK:
        this.createLinkCardSetSettings(cardSetConfig, settings);
        break;
    }
  }

  /**
   * 폴더 카드셋 설정 UI 생성
   */
  private createFolderCardSetSettings(cardSetConfig: ICardSetConfig, settings: any): void {
    // 폴더 모드 선택 (활성/지정)
    new Setting(this.containerEl)
      .setName('폴더 모드')
      .setDesc('활성 폴더 또는 지정 폴더를 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('active', '활성 폴더')
          .addOption('specified', '지정 폴더')
          .setValue(cardSetConfig.criteria.folderMode || 'active')
          .onChange(async (value: 'active' | 'specified') => {
            const newConfig: ICardSetConfig = {
              ...cardSetConfig,
              criteria: {
                ...cardSetConfig.criteria,
                folderMode: value
              }
            };
            await this.settingsService.saveSettings({
              ...settings,
              cardSet: {
                ...settings.cardSet,
                config: newConfig
              }
            });
            // 폴더 모드가 변경되면 설정 UI를 다시 생성
            this.create(this.containerEl);
          });
      });

    // 지정 폴더 선택 (지정 모드일 때만 표시)
    if (cardSetConfig.criteria.folderMode === 'specified') {
      new Setting(this.containerEl)
        .setName('폴더 경로')
        .setDesc('카드셋에 포함할 폴더를 선택합니다.')
        .addButton(button => {
          button
            .setButtonText('폴더 선택')
            .onClick(() => {
              const modal = new FolderSuggestModal(this.plugin.app);
              modal.onChoose = async (folderPath: string) => {
                const newConfig: ICardSetConfig = {
                  ...cardSetConfig,
                  criteria: {
                    ...cardSetConfig.criteria,
                    folderPath
                  }
                };
                await this.settingsService.saveSettings({
                  ...settings,
                  cardSet: {
                    ...settings.cardSet,
                    config: newConfig
                  }
                });
              };
              modal.open();
            });
        });
    }

    // 하위 폴더 포함 옵션
    new Setting(this.containerEl)
      .setName('하위 폴더 포함')
      .setDesc('선택한 폴더의 하위 폴더도 포함합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(cardSetConfig.filter.includeSubfolders ?? false)
          .onChange(async (value) => {
            const newConfig: ICardSetConfig = {
              ...cardSetConfig,
              filter: {
                ...cardSetConfig.filter,
                includeSubfolders: value
              }
            };
            await this.settingsService.saveSettings({
              ...settings,
              cardSet: {
                ...settings.cardSet,
                config: newConfig
              }
            });
          });
      });
  }

  /**
   * 태그 카드셋 설정 UI 생성
   */
  private createTagCardSetSettings(cardSetConfig: ICardSetConfig, settings: any): void {
    // 태그 모드 선택 (활성/지정)
    new Setting(this.containerEl)
      .setName('태그 모드')
      .setDesc('활성 태그 또는 지정 태그를 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('active', '활성 태그')
          .addOption('specified', '지정 태그')
          .setValue(cardSetConfig.criteria.tagMode || 'active')
          .onChange(async (value: 'active' | 'specified') => {
            const newConfig: ICardSetConfig = {
              ...cardSetConfig,
              criteria: {
                ...cardSetConfig.criteria,
                tagMode: value
              }
            };
            await this.settingsService.saveSettings({
              ...settings,
              cardSet: {
                ...settings.cardSet,
                config: newConfig
              }
            });
            // 태그 모드가 변경되면 설정 UI를 다시 생성
            this.create(this.containerEl);
          });
      });

    // 지정 태그 선택 (지정 모드일 때만 표시)
    if (cardSetConfig.criteria.tagMode === 'specified') {
      new Setting(this.containerEl)
        .setName('태그')
        .setDesc('카드셋에 포함할 태그를 선택합니다.')
        .addButton(button => {
          button
            .setButtonText('태그 선택')
            .onClick(() => {
              const modal = new TagSuggestModal(this.plugin.app);
              modal.onChoose = async (tag: string) => {
                const newConfig: ICardSetConfig = {
                  ...cardSetConfig,
                  criteria: {
                    ...cardSetConfig.criteria,
                    tag
                  }
                };
                await this.settingsService.saveSettings({
                  ...settings,
                  cardSet: {
                    ...settings.cardSet,
                    config: newConfig
                  }
                });
              };
              modal.open();
            });
        });
    }

    // 하위 태그 포함 옵션
    new Setting(this.containerEl)
      .setName('하위 태그 포함')
      .setDesc('선택한 태그의 하위 태그도 포함합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(cardSetConfig.filter.includeSubtags ?? false)
          .onChange(async (value) => {
            const newConfig: ICardSetConfig = {
              ...cardSetConfig,
              filter: {
                ...cardSetConfig.filter,
                includeSubtags: value
              }
            };
            await this.settingsService.saveSettings({
              ...settings,
              cardSet: {
                ...settings.cardSet,
                config: newConfig
              }
            });
          });
      });

    // 태그 대소문자 구분 옵션
    new Setting(this.containerEl)
      .setName('태그 대소문자 구분')
      .setDesc('태그의 대소문자를 구분합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(cardSetConfig.filter.tagCaseSensitive ?? false)
          .onChange(async (value) => {
            const newConfig: ICardSetConfig = {
              ...cardSetConfig,
              filter: {
                ...cardSetConfig.filter,
                tagCaseSensitive: value
              }
            };
            await this.settingsService.saveSettings({
              ...settings,
              cardSet: {
                ...settings.cardSet,
                config: newConfig
              }
            });
          });
      });
  }

  /**
   * 링크 카드셋 설정 UI 생성
   */
  private createLinkCardSetSettings(cardSetConfig: ICardSetConfig, settings: any): void {
    // 링크 타입 선택
    new Setting(this.containerEl)
      .setName('링크 타입')
      .setDesc('백링크 또는 아웃고잉 링크를 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption(LinkType.BACKLINK, '백링크')
          .addOption(LinkType.OUTGOING, '아웃고잉 링크')
          .setValue(cardSetConfig.criteria.linkType || LinkType.BACKLINK)
          .onChange(async (value: LinkType) => {
            const newConfig: ICardSetConfig = {
              ...cardSetConfig,
              criteria: {
                ...cardSetConfig.criteria,
                linkType: value
              }
            };
            await this.settingsService.saveSettings({
              ...settings,
              cardSet: {
                ...settings.cardSet,
                config: newConfig
              }
            });
          });
      });

    // 링크 깊이 설정
    new Setting(this.containerEl)
      .setName('링크 깊이')
      .setDesc('링크의 깊이를 설정합니다.')
      .addSlider(slider => {
        slider
          .setLimits(1, 5, 1)
          .setValue(cardSetConfig.filter.linkDepth ?? 1)
          .setDynamicTooltip()
          .onChange(async (value) => {
            const newConfig: ICardSetConfig = {
              ...cardSetConfig,
              filter: {
                ...cardSetConfig.filter,
                linkDepth: value
              }
            };
            await this.settingsService.saveSettings({
              ...settings,
              cardSet: {
                ...settings.cardSet,
                config: newConfig
              }
            });
          });
      });
  }
}