import { Setting } from 'obsidian';
import { SettingSection } from './SettingSection';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { LayoutDirectionPreference } from '../../domain/settings/SettingsInterfaces';

/**
 * 카드 레이아웃 설정 섹션
 * 카드 레이아웃 관련 설정을 관리합니다.
 */
export class CardLayoutSection extends SettingSection {
  /**
   * 생성자
   * @param containerEl 컨테이너 요소
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    containerEl: HTMLElement,
    settingsService: ISettingsService,
    eventBus: DomainEventBus
  ) {
    super(containerEl, settingsService, eventBus);
  }

  /**
   * 설정 표시
   */
  displayContent(): void {
    const { containerEl } = this;
    const settings = this.settingsService.getSettings();

    containerEl.createEl('h3', { text: '레이아웃 설정' });
    containerEl.createEl('p', { 
      text: '레이아웃 관련 설정을 구성합니다. 카드 크기, 간격, 방향 등을 설정할 수 있습니다.',
      cls: 'setting-item-description'
    });
    
    // 고정 카드 높이 설정
    new Setting(containerEl)
      .setName('고정 카드 높이')
      .setDesc('카드 높이를 고정합니다.')
      .addToggle(toggle => toggle
        .setValue(settings.layout?.fixedCardHeight || false)
        .onChange(async (value: boolean) => {
          const currentLayout = settings.layout || {
            fixedCardHeight: false,
            layoutDirectionPreference: LayoutDirectionPreference.AUTO,
            cardMinWidth: 200,
            cardMaxWidth: 400,
            cardMinHeight: 150,
            cardMaxHeight: 600,
            cardGap: 10,
            cardsetPadding: 10,
            cardSizeFactor: 1.0,
            useLayoutTransition: true
          };
          
          await this.settingsService.updateSettings({
            layout: {
              ...currentLayout,
              fixedCardHeight: value
            }
          });
        })
      );
    
    // 레이아웃 방향 설정
    new Setting(containerEl)
      .setName('레이아웃 방향')
      .setDesc('카드 레이아웃 방향을 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('horizontal', '가로')
        .addOption('vertical', '세로')
        .addOption('auto', '자동')
        .setValue(settings.layout?.layoutDirectionPreference || 'auto')
        .onChange(async (value: string) => {
          const currentLayout = settings.layout || {
            fixedCardHeight: false,
            layoutDirectionPreference: LayoutDirectionPreference.AUTO,
            cardMinWidth: 200,
            cardMaxWidth: 400,
            cardMinHeight: 150,
            cardMaxHeight: 600,
            cardGap: 10,
            cardsetPadding: 10,
            cardSizeFactor: 1.0,
            useLayoutTransition: true
          };
          
          await this.settingsService.updateSettings({
            layout: {
              ...currentLayout,
              layoutDirectionPreference: value as LayoutDirectionPreference
            }
          });
        })
      );
    
    // 카드 최소 너비 설정
    new Setting(containerEl)
      .setName('카드 최소 너비')
      .setDesc('카드의 최소 너비를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(100, 500, 10)
        .setValue(settings.layout?.cardMinWidth || 200)
        .setDynamicTooltip()
        .onChange(async (value: number) => {
          const currentLayout = settings.layout || {
            fixedCardHeight: false,
            layoutDirectionPreference: LayoutDirectionPreference.AUTO,
            cardMinWidth: 200,
            cardMaxWidth: 400,
            cardMinHeight: 150,
            cardMaxHeight: 600,
            cardGap: 10,
            cardsetPadding: 10,
            cardSizeFactor: 1.0,
            useLayoutTransition: true
          };
          
          await this.settingsService.updateSettings({
            layout: {
              ...currentLayout,
              cardMinWidth: value
            }
          });
        })
      );
    
    // 카드 최대 너비 설정
    new Setting(containerEl)
      .setName('카드 최대 너비')
      .setDesc('카드의 최대 너비를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(200, 800, 10)
        .setValue(settings.layout?.cardMaxWidth || 400)
        .setDynamicTooltip()
        .onChange(async (value: number) => {
          const currentLayout = settings.layout || {
            fixedCardHeight: false,
            layoutDirectionPreference: LayoutDirectionPreference.AUTO,
            cardMinWidth: 200,
            cardMaxWidth: 400,
            cardMinHeight: 150,
            cardMaxHeight: 600,
            cardGap: 10,
            cardsetPadding: 10,
            cardSizeFactor: 1.0,
            useLayoutTransition: true
          };
          
          await this.settingsService.updateSettings({
            layout: {
              ...currentLayout,
              cardMaxWidth: value
            }
          });
        })
      );
    
    // 카드 최소 높이 설정
    new Setting(containerEl)
      .setName('카드 최소 높이')
      .setDesc('카드의 최소 높이를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(100, 500, 10)
        .setValue(settings.layout?.cardMinHeight || 150)
        .setDynamicTooltip()
        .onChange(async (value: number) => {
          const currentLayout = settings.layout || {
            fixedCardHeight: false,
            layoutDirectionPreference: LayoutDirectionPreference.AUTO,
            cardMinWidth: 200,
            cardMaxWidth: 400,
            cardMinHeight: 150,
            cardMaxHeight: 600,
            cardGap: 10,
            cardsetPadding: 10,
            cardSizeFactor: 1.0,
            useLayoutTransition: true
          };
          
          await this.settingsService.updateSettings({
            layout: {
              ...currentLayout,
              cardMinHeight: value
            }
          });
        })
      );
    
    // 카드 최대 높이 설정
    new Setting(containerEl)
      .setName('카드 최대 높이')
      .setDesc('카드의 최대 높이를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(200, 800, 10)
        .setValue(settings.layout?.cardMaxHeight || 600)
        .setDynamicTooltip()
        .onChange(async (value: number) => {
          const currentLayout = settings.layout || {
            fixedCardHeight: false,
            layoutDirectionPreference: LayoutDirectionPreference.AUTO,
            cardMinWidth: 200,
            cardMaxWidth: 400,
            cardMinHeight: 150,
            cardMaxHeight: 600,
            cardGap: 10,
            cardsetPadding: 10,
            cardSizeFactor: 1.0,
            useLayoutTransition: true
          };
          
          await this.settingsService.updateSettings({
            layout: {
              ...currentLayout,
              cardMaxHeight: value
            }
          });
        })
      );
    
    // 카드 간격 설정
    new Setting(containerEl)
      .setName('카드 간격')
      .setDesc('카드 사이의 간격을 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 50, 2)
        .setValue(settings.layout?.cardGap || 10)
        .setDynamicTooltip()
        .onChange(async (value: number) => {
          const currentLayout = settings.layout || {
            fixedCardHeight: false,
            layoutDirectionPreference: LayoutDirectionPreference.AUTO,
            cardMinWidth: 200,
            cardMaxWidth: 400,
            cardMinHeight: 150,
            cardMaxHeight: 600,
            cardGap: 10,
            cardsetPadding: 10,
            cardSizeFactor: 1.0,
            useLayoutTransition: true
          };
          
          await this.settingsService.updateSettings({
            layout: {
              ...currentLayout,
              cardGap: value
            }
          });
        })
      );
    
    // 카드셋 패딩 설정
    new Setting(containerEl)
      .setName('카드셋 패딩')
      .setDesc('카드셋의 패딩을 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 50, 2)
        .setValue(settings.layout?.cardsetPadding || 10)
        .setDynamicTooltip()
        .onChange(async (value: number) => {
          const currentLayout = settings.layout || {
            fixedCardHeight: false,
            layoutDirectionPreference: LayoutDirectionPreference.AUTO,
            cardMinWidth: 200,
            cardMaxWidth: 400,
            cardMinHeight: 150,
            cardMaxHeight: 600,
            cardGap: 10,
            cardsetPadding: 10,
            cardSizeFactor: 1.0,
            useLayoutTransition: true
          };
          
          await this.settingsService.updateSettings({
            layout: {
              ...currentLayout,
              cardsetPadding: value
            }
          });
        })
      );
    
    // 카드 크기 비율 설정
    new Setting(containerEl)
      .setName('카드 크기 비율')
      .setDesc('카드 크기 비율을 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0.5, 2, 0.1)
        .setValue(settings.layout?.cardSizeFactor || 1)
        .setDynamicTooltip()
        .onChange(async (value: number) => {
          const currentLayout = settings.layout || {
            fixedCardHeight: false,
            layoutDirectionPreference: LayoutDirectionPreference.AUTO,
            cardMinWidth: 200,
            cardMaxWidth: 400,
            cardMinHeight: 150,
            cardMaxHeight: 600,
            cardGap: 10,
            cardsetPadding: 10,
            cardSizeFactor: 1.0,
            useLayoutTransition: true
          };
          
          await this.settingsService.updateSettings({
            layout: {
              ...currentLayout,
              cardSizeFactor: value
            }
          });
        })
      );
    
    // 레이아웃 전환 효과 설정
    new Setting(containerEl)
      .setName('레이아웃 전환 효과')
      .setDesc('레이아웃 변경 시 전환 효과를 사용합니다.')
      .addToggle(toggle => toggle
        .setValue(settings.layout?.useLayoutTransition !== false)
        .onChange(async (value: boolean) => {
          const currentLayout = settings.layout || {
            fixedCardHeight: false,
            layoutDirectionPreference: LayoutDirectionPreference.AUTO,
            cardMinWidth: 200,
            cardMaxWidth: 400,
            cardMinHeight: 150,
            cardMaxHeight: 600,
            cardGap: 10,
            cardsetPadding: 10,
            cardSizeFactor: 1.0,
            useLayoutTransition: true
          };
          
          await this.settingsService.updateSettings({
            layout: {
              ...currentLayout,
              useLayoutTransition: value
            }
          });
        })
      );
  }
} 