import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { CardSetType, LinkType } from '@/domain/models/CardSet';

/**
 * 카드셋 설정 섹션
 */
export class CardSetSettingsSection {
  constructor(private plugin: CardNavigatorPlugin) {}

  /**
   * 카드셋 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '카드셋 설정' });

    new Setting(containerEl)
      .setName('기본 카드셋 타입')
      .setDesc('카드 내비게이터를 열 때 사용할 기본 카드셋 타입을 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption(CardSetType.FOLDER, '폴더')
          .addOption(CardSetType.TAG, '태그')
          .addOption(CardSetType.LINK, '링크')
          .setValue(this.plugin.settings.defaultCardSetType)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              defaultCardSetType: value as CardSetType
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('기본 카드셋 기준')
      .setDesc('기본 카드셋의 기준값을 입력합니다.')
      .addText(text =>
        text
          .setValue(this.plugin.settings.defaultCardSetCriteria)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              defaultCardSetCriteria: value
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('하위 폴더 포함')
      .setDesc('폴더 카드셋에서 하위 폴더의 노트도 포함합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.includeSubfolders)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              includeSubfolders: value
            };
            await this.plugin.saveSettings();
          }));

    containerEl.createEl('h4', { text: '링크 설정' });

    new Setting(containerEl)
      .setName('링크 타입')
      .setDesc('링크 카드셋에서 사용할 링크 타입을 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption(LinkType.BACKLINK, '백링크')
          .addOption(LinkType.OUTGOING, '아웃고잉')
          .setValue(this.plugin.settings.linkType)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              linkType: value as LinkType
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('링크 레벨')
      .setDesc('링크 카드셋에서 표시할 링크의 깊이를 설정합니다.')
      .addText(text =>
        text
          .setValue(this.plugin.settings.linkLevel.toString())
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              linkLevel: parseInt(value) || 1
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('백링크 포함')
      .setDesc('링크 카드셋에서 백링크를 포함합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.includeBacklinks)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              includeBacklinks: value
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('아웃고잉 링크 포함')
      .setDesc('링크 카드셋에서 아웃고잉 링크를 포함합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.includeOutgoingLinks)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              includeOutgoingLinks: value
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('포함 패턴')
      .setDesc('링크 카드셋에서 포함할 파일 패턴을 입력합니다. (쉼표로 구분)')
      .addText(text =>
        text
          .setValue(this.plugin.settings.includePatterns?.join(', ') || '')
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              includePatterns: value.split(',').map(p => p.trim()).filter(p => p)
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('제외 패턴')
      .setDesc('링크 카드셋에서 제외할 파일 패턴을 입력합니다. (쉼표로 구분)')
      .addText(text =>
        text
          .setValue(this.plugin.settings.excludePatterns?.join(', ') || '')
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              excludePatterns: value.split(',').map(p => p.trim()).filter(p => p)
            };
            await this.plugin.saveSettings();
          }));
  }
} 