import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { CardRenderType } from '@/domain/models/CardRenderConfig';
import { NoteTitleDisplayType } from '@/domain/models/Card';
import { DEFAULT_CARD_STYLE } from '@/domain/models/CardStyle';

/**
 * 카드 설정 섹션
 */
export class CardSettingsSection {
  constructor(private plugin: CardNavigatorPlugin) {}

  /**
   * 카드 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '카드 설정' });

    // 노트 타이틀 표시 방식
    new Setting(containerEl)
      .setName('노트 타이틀 표시 방식')
      .setDesc('노트의 타이틀을 어떤 방식으로 표시할지 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption(NoteTitleDisplayType.FILENAME, '파일명')
          .addOption(NoteTitleDisplayType.FIRST_HEADER, '첫 번째 헤더')
          .setValue(this.plugin.settings.cardTitleDisplayType)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              cardTitleDisplayType: value as NoteTitleDisplayType
            };
            await this.plugin.saveSettings();
          }));

    // 렌더링 설정
    containerEl.createEl('h4', { text: '렌더링 설정' });

    new Setting(containerEl)
      .setName('렌더링 방식')
      .setDesc('카드의 렌더링 방식을 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption(CardRenderType.TEXT, '일반 텍스트')
          .addOption(CardRenderType.HTML, 'HTML')
          .setValue(this.plugin.settings.cardRenderType)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              cardRenderType: value as CardRenderType
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('마크다운 렌더링')
      .setDesc('마크다운을 HTML로 렌더링합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.renderMarkdown)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              renderMarkdown: value
            };
            await this.plugin.saveSettings();
          }));

    // 스타일 설정
    containerEl.createEl('h4', { text: '스타일 설정' });

    // 일반 카드 스타일
    new Setting(containerEl)
      .setName('일반 카드 배경색')
      .setDesc('일반 카드의 배경색을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(DEFAULT_CARD_STYLE.card.backgroundColor)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              cardStyle: {
                ...this.plugin.settings.cardStyle,
                card: {
                  ...this.plugin.settings.cardStyle.card,
                  backgroundColor: value
                }
              }
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('일반 카드 폰트 크기')
      .setDesc('일반 카드의 폰트 크기를 설정합니다.')
      .addText(text =>
        text
          .setValue(DEFAULT_CARD_STYLE.card.fontSize)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              cardStyle: {
                ...this.plugin.settings.cardStyle,
                card: {
                  ...this.plugin.settings.cardStyle.card,
                  fontSize: value
                }
              }
            };
            await this.plugin.saveSettings();
          }));

    // 활성 카드 스타일
    new Setting(containerEl)
      .setName('활성 카드 배경색')
      .setDesc('활성 카드의 배경색을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(DEFAULT_CARD_STYLE.activeCard.backgroundColor)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              cardStyle: {
                ...this.plugin.settings.cardStyle,
                activeCard: {
                  ...this.plugin.settings.cardStyle.activeCard,
                  backgroundColor: value
                }
              }
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('활성 카드 테두리 색상')
      .setDesc('활성 카드의 테두리 색상을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(DEFAULT_CARD_STYLE.activeCard.borderColor)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              cardStyle: {
                ...this.plugin.settings.cardStyle,
                activeCard: {
                  ...this.plugin.settings.cardStyle.activeCard,
                  borderColor: value
                }
              }
            };
            await this.plugin.saveSettings();
          }));

    // 포커스된 카드 스타일
    new Setting(containerEl)
      .setName('포커스된 카드 배경색')
      .setDesc('포커스된 카드의 배경색을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(DEFAULT_CARD_STYLE.focusedCard.backgroundColor)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              cardStyle: {
                ...this.plugin.settings.cardStyle,
                focusedCard: {
                  ...this.plugin.settings.cardStyle.focusedCard,
                  backgroundColor: value
                }
              }
            };
            await this.plugin.saveSettings();
          }));

    new Setting(containerEl)
      .setName('포커스된 카드 테두리 색상')
      .setDesc('포커스된 카드의 테두리 색상을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(DEFAULT_CARD_STYLE.focusedCard.borderColor)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              cardStyle: {
                ...this.plugin.settings.cardStyle,
                focusedCard: {
                  ...this.plugin.settings.cardStyle.focusedCard,
                  borderColor: value
                }
              }
            };
            await this.plugin.saveSettings();
          }));
  }
} 