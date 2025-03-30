import { Setting } from 'obsidian';
import { IPluginWithSettings } from '@/ui/settings/SettingsTab';

/**
 * 레이아웃 설정 컴포넌트
 */
export class LayoutSettings {
  constructor(
    private readonly containerEl: HTMLElement,
    private readonly plugin: IPluginWithSettings
  ) {}

  /**
   * 레이아웃 설정 표시
   */
  display(): void {
    // 레이아웃 설정 섹션
    new Setting(this.containerEl)
      .setName('레이아웃 설정')
      .setHeading();

    // 레이아웃 타입
    new Setting(this.containerEl)
      .setName('레이아웃 타입')
      .setDesc('카드의 배치 방식을 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('grid', '그리드')
          .addOption('masonry', '메이슨리')
          .setValue(this.plugin.getSetting('layout.type'))
          .onChange(value => {
            this.plugin.setSetting('layout.type', value);
            this.plugin.saveSettings();
            this._updateLayoutSettings();
          });
      });

    // 레이아웃 방향 (그리드 레이아웃일 때만 표시)
    new Setting(this.containerEl)
      .setName('레이아웃 방향')
      .setDesc('카드의 배치 방향을 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('horizontal', '가로')
          .addOption('vertical', '세로')
          .setValue(this.plugin.getSetting('layout.direction'))
          .onChange(value => {
            this.plugin.setSetting('layout.direction', value);
            this.plugin.saveSettings();
          });
      });

    // 카드 높이 고정
    new Setting(this.containerEl)
      .setName('카드 높이 고정')
      .setDesc('카드의 높이를 고정하여 그리드 레이아웃을 사용합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('layout.fixedHeight'))
          .onChange(value => {
            this.plugin.setSetting('layout.fixedHeight', value);
            this.plugin.saveSettings();
            this._updateLayoutSettings();
          });
      });

    // 카드 임계 너비
    new Setting(this.containerEl)
      .setName('카드 임계 너비')
      .setDesc('카드의 최소 너비를 설정합니다.')
      .addSlider(slider => {
        slider
          .setLimits(200, 800, 50)
          .setValue(this.plugin.getSetting('layout.minCardWidth'))
          .setDynamicTooltip()
          .onChange(value => {
            this.plugin.setSetting('layout.minCardWidth', value);
            this.plugin.saveSettings();
          });
      });

    // 카드 임계 높이
    new Setting(this.containerEl)
      .setName('카드 임계 높이')
      .setDesc('카드의 최소 높이를 설정합니다.')
      .addSlider(slider => {
        slider
          .setLimits(200, 800, 50)
          .setValue(this.plugin.getSetting('layout.minCardHeight'))
          .setDynamicTooltip()
          .onChange(value => {
            this.plugin.setSetting('layout.minCardHeight', value);
            this.plugin.saveSettings();
          });
      });

    // 카드 간격
    new Setting(this.containerEl)
      .setName('카드 간격')
      .setDesc('카드 사이의 간격을 설정합니다.')
      .addSlider(slider => {
        slider
          .setLimits(0, 50, 5)
          .setValue(this.plugin.getSetting('layout.gap'))
          .setDynamicTooltip()
          .onChange(value => {
            this.plugin.setSetting('layout.gap', value);
            this.plugin.saveSettings();
          });
      });

    // 여백
    new Setting(this.containerEl)
      .setName('여백')
      .setDesc('레이아웃의 여백을 설정합니다.')
      .addSlider(slider => {
        slider
          .setLimits(0, 50, 5)
          .setValue(this.plugin.getSetting('layout.padding'))
          .setDynamicTooltip()
          .onChange(value => {
            this.plugin.setSetting('layout.padding', value);
            this.plugin.saveSettings();
          });
      });

    // 초기 설정 상태 업데이트
    this._updateLayoutSettings();
  }

  /**
   * 레이아웃 설정 상태 업데이트
   */
  private _updateLayoutSettings(): void {
    const type = this.plugin.getSetting('layout.type');
    const fixedHeight = this.plugin.getSetting('layout.fixedHeight');
    const layoutDirectionSetting = this.containerEl.querySelector('.setting-item:has(.dropdown)') as HTMLElement;
    const cardHeightSetting = this.containerEl.querySelector('.setting-item:has(.checkbox)') as HTMLElement;

    if (layoutDirectionSetting) {
      layoutDirectionSetting.style.display = type === 'grid' ? 'flex' : 'none';
    }

    if (cardHeightSetting) {
      cardHeightSetting.style.display = type === 'grid' ? 'flex' : 'none';
    }
  }
} 