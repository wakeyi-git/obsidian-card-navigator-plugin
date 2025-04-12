import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { LayoutType } from '@/domain/models/Layout';
import { Container } from '@/infrastructure/di/Container';
import type { ISettingsService } from '@/domain/services/application/ISettingsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';

/**
 * 레이아웃 설정 섹션
 */
export class LayoutSettingsSection {
  private settingsService: ISettingsService;
  private eventDispatcher: IEventDispatcher;

  constructor(private plugin: CardNavigatorPlugin, eventDispatcher: IEventDispatcher) {
    // 설정 서비스 가져오기
    this.settingsService = Container.getInstance().resolve<ISettingsService>('ISettingsService');
    this.eventDispatcher = eventDispatcher;
  }

  /**
   * 레이아웃 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '레이아웃 설정' });

    const settings = this.settingsService.getSettings();

    new Setting(containerEl)
      .setName('카드 높이 고정')
      .setDesc('활성화하면 그리드 레이아웃이 적용되고, 비활성화하면 메이슨리 레이아웃이 적용됩니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.layout.config.fixedCardHeight)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              layout: {
                ...settings.layout,
                config: {
                  ...settings.layout.config,
                  fixedCardHeight: value,
                  type: value ? LayoutType.GRID : LayoutType.MASONRY
                }
              }
            });
          }));

    // 레이아웃 타입과 방향 정보 표시
    const infoDiv = containerEl.createDiv('layout-info');
    infoDiv.createEl('p', { 
      text: '레이아웃 타입 및 방향은 카드 높이 고정 여부와 뷰포트 크기에 따라 자동으로 설정됩니다.',
      cls: 'setting-item-description' 
    });

    new Setting(containerEl)
      .setName('카드 최소 너비')
      .setDesc('카드의 최소 너비를 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(200, 800, 10)
          .setValue(settings.layout.config.cardThresholdWidth)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              layout: {
                ...settings.layout,
                config: {
                  ...settings.layout.config,
                  cardThresholdWidth: value
                }
              }
            });
          }));

    new Setting(containerEl)
      .setName('카드 최소 높이')
      .setDesc('카드의 최소 높이를 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(200, 800, 10)
          .setValue(settings.layout.config.cardThresholdHeight)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              layout: {
                ...settings.layout,
                config: {
                  ...settings.layout.config,
                  cardThresholdHeight: value
                }
              }
            });
          }));

    new Setting(containerEl)
      .setName('카드 간격')
      .setDesc('카드 사이의 간격을 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(0, 32, 2)
          .setValue(settings.layout.config.cardGap)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              layout: {
                ...settings.layout,
                config: {
                  ...settings.layout.config,
                  cardGap: value
                }
              }
            });
          }));

    new Setting(containerEl)
      .setName('패딩')
      .setDesc('카드 목록의 패딩을 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(0, 32, 2)
          .setValue(settings.layout.config.padding)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              layout: {
                ...settings.layout,
                config: {
                  ...settings.layout.config,
                  padding: value
                }
              }
            });
          }));
  }
} 