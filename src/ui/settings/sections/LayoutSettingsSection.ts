import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { LayoutType, LayoutDirection } from '@/domain/models/LayoutConfig';

/**
 * 레이아웃 설정 섹션
 */
export class LayoutSettingsSection {
  constructor(private plugin: CardNavigatorPlugin) {}

  /**
   * 레이아웃 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '레이아웃 설정' });

    new Setting(containerEl)
      .setName('레이아웃 타입')
      .setDesc('카드 목록의 레이아웃 타입을 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption(LayoutType.GRID, '그리드')
          .addOption(LayoutType.MASONRY, '메이슨리')
          .setValue(this.plugin.settings.layoutType)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              layoutType: value as LayoutType
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('레이아웃 방향')
      .setDesc('그리드 레이아웃에서 카드 배치 방향을 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption(LayoutDirection.HORIZONTAL, '가로')
          .addOption(LayoutDirection.VERTICAL, '세로')
          .setValue(this.plugin.settings.layoutDirection)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              layoutDirection: value as LayoutDirection
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('카드 높이 고정')
      .setDesc('그리드 레이아웃에서 카드의 높이를 고정합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.cardHeightFixed)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              cardHeightFixed: value
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('카드 최소 너비')
      .setDesc('카드의 최소 너비를 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(200, 800, 10)
          .setValue(this.plugin.settings.cardMinWidth)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              cardMinWidth: value
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('카드 최소 높이')
      .setDesc('카드의 최소 높이를 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(200, 800, 10)
          .setValue(this.plugin.settings.cardMinHeight)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              cardMinHeight: value
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('카드 간격')
      .setDesc('카드 사이의 간격을 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(0, 32, 2)
          .setValue(this.plugin.settings.cardGap)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              cardGap: value
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('패딩')
      .setDesc('카드 목록의 패딩을 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(0, 32, 2)
          .setValue(this.plugin.settings.cardPadding)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              cardPadding: value
            };
            await this.plugin.saveSettings();
          }));
  }
} 