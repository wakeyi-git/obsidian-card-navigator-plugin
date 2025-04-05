import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { LayoutType, LayoutDirection } from '@/domain/models/LayoutConfig';
import { ServiceContainer } from '@/application/services/SettingsService';
import type { ISettingsService } from '@/application/services/SettingsService';

/**
 * 레이아웃 설정 섹션
 */
export class LayoutSettingsSection {
  private settingsService: ISettingsService;
  private listeners: (() => void)[] = [];

  constructor(private plugin: CardNavigatorPlugin) {
    // 설정 서비스 가져오기
    this.settingsService = ServiceContainer.getInstance().resolve<ISettingsService>('ISettingsService');
    
    // 설정 변경 감지
    this.listeners.push(
      this.settingsService.onSettingsChanged(() => {
        // 설정이 변경되면 필요한 UI 업데이트 수행 가능
      })
    );
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
          .setValue(settings.layout.cardHeightFixed)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('layout.cardHeightFixed', value);
            
            // 레이아웃 타입 자동 설정은 유지합니다.
            await this.settingsService.updateNestedSettings('layout.layoutType', 
              value ? LayoutType.GRID : LayoutType.MASONRY);
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
          .setValue(settings.layout.cardMinWidth)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('layout.cardMinWidth', value);
          }));

    new Setting(containerEl)
      .setName('카드 최소 높이')
      .setDesc('카드의 최소 높이를 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(200, 800, 10)
          .setValue(settings.layout.cardMinHeight)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('layout.cardMinHeight', value);
          }));

    new Setting(containerEl)
      .setName('카드 간격')
      .setDesc('카드 사이의 간격을 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(0, 32, 2)
          .setValue(settings.layout.cardGap)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('layout.cardGap', value);
          }));

    new Setting(containerEl)
      .setName('패딩')
      .setDesc('카드 목록의 패딩을 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(0, 32, 2)
          .setValue(settings.layout.cardPadding)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('layout.cardPadding', value);
          }));
  }

  /**
   * 컴포넌트 정리
   */
  destroy(): void {
    // 이벤트 리스너 정리
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
  }
} 