import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { LayoutType } from '@/domain/utils/layoutUtils';
import { Container } from '@/infrastructure/di/Container';
import type { ISettingsService } from '@/domain/services/ISettingsService';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { ILayoutConfig } from '@/domain/models/LayoutConfig';

/**
 * 레이아웃 설정 섹션
 */
export class LayoutSettingsSection {
  private settingsService: ISettingsService;
  private listeners: (() => void)[] = [];
  private eventDispatcher: IEventDispatcher;

  constructor(private plugin: CardNavigatorPlugin, eventDispatcher: IEventDispatcher) {
    // 설정 서비스 가져오기
    this.settingsService = Container.getInstance().resolve<ISettingsService>('ISettingsService');
    this.eventDispatcher = eventDispatcher;
    
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
          .setValue(settings.layoutConfig.fixedCardHeight)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('layoutConfig.fixedCardHeight', value);
            
            // 레이아웃 타입 자동 설정은 유지합니다.
            await this.settingsService.updateNestedSettings('layoutConfig.layoutType', 
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
          .setValue(settings.layoutConfig.cardThresholdWidth)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('layoutConfig.cardThresholdWidth', value);
          }));

    new Setting(containerEl)
      .setName('카드 최소 높이')
      .setDesc('카드의 최소 높이를 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(200, 800, 10)
          .setValue(settings.layoutConfig.cardThresholdHeight)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('layoutConfig.cardThresholdHeight', value);
          }));

    new Setting(containerEl)
      .setName('카드 간격')
      .setDesc('카드 사이의 간격을 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(0, 32, 2)
          .setValue(settings.layoutConfig.cardGap)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('layoutConfig.cardGap', value);
          }));

    new Setting(containerEl)
      .setName('패딩')
      .setDesc('카드 목록의 패딩을 설정합니다.')
      .addSlider(slider =>
        slider
          .setLimits(0, 32, 2)
          .setValue(settings.layoutConfig.padding)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('layoutConfig.padding', value);
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

  updateLayoutConfig(oldConfig: ILayoutConfig, newConfig: ILayoutConfig): void {
    this.eventDispatcher.dispatch(
      new DomainEvent(DomainEventType.LAYOUT_SETTINGS_SECTION_CHANGED, {
        oldConfig,
        newConfig
      })
    );
  }
} 