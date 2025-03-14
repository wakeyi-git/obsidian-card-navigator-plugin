import { Setting } from 'obsidian';
import { BaseSettingSection } from './BaseSettingSection';
import { EventType } from '../../domain/events/EventTypes';

/**
 * 카드 설정 섹션
 * 카드 기본 설정을 표시하는 섹션입니다.
 */
export class CardSection extends BaseSettingSection {
  /**
   * 생성자
   * @param sectionId 섹션 ID
   */
  constructor(sectionId: string) {
    super(sectionId);
  }
  
  /**
   * 섹션 표시
   * @param containerEl 컨테이너 요소
   */
  display(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '카드 기본 설정' });
    
    // 카드 너비 설정
    this.createSetting(containerEl, '카드 너비', '카드의 너비를 픽셀 단위로 설정합니다.')
      .addSlider(slider => slider
        .setLimits(100, 500, 10)
        .setValue(this.settingsService.getSettings().cardWidth || 250)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ cardWidth: value });
          this.notifySettingsChanged('cardWidth');
        }));
    
    // 카드 높이 설정
    this.createSetting(containerEl, '카드 높이', '카드의 높이를 픽셀 단위로 설정합니다.')
      .addSlider(slider => slider
        .setLimits(100, 500, 10)
        .setValue(this.settingsService.getSettings().cardHeight || 200)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ cardHeight: value });
          this.notifySettingsChanged('cardHeight');
        }));
    
    // 카드 간격 설정
    this.createSetting(containerEl, '카드 간격', '카드 사이의 간격을 픽셀 단위로 설정합니다.')
      .addSlider(slider => slider
        .setLimits(5, 50, 1)
        .setValue(this.settingsService.getSettings().cardGap || 10)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ cardGap: value });
          this.notifySettingsChanged('cardGap');
        }));
    
    // 카드 배경색 설정
    this.createSetting(containerEl, '카드 배경색', '카드의 배경색을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().normalCardBgColor || '#ffffff')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ normalCardBgColor: value });
          this.notifySettingsChanged('normalCardBgColor');
        }));
    
    // 카드 테두리 스타일 설정
    this.createSetting(containerEl, '카드 테두리 스타일', '카드 테두리의 스타일을 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('none', '없음')
        .addOption('solid', '실선')
        .addOption('dashed', '파선')
        .addOption('dotted', '점선')
        .addOption('double', '이중선')
        .setValue(this.settingsService.getSettings().normalCardBorderStyle || 'solid')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ normalCardBorderStyle: value });
          this.notifySettingsChanged('normalCardBorderStyle');
        }));
    
    // 카드 테두리 색상 설정
    this.createSetting(containerEl, '카드 테두리 색상', '카드 테두리의 색상을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().normalCardBorderColor || '#cccccc')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ normalCardBorderColor: value });
          this.notifySettingsChanged('normalCardBorderColor');
        }));
    
    // 카드 테두리 두께 설정
    this.createSetting(containerEl, '카드 테두리 두께', '카드 테두리의 두께를 픽셀 단위로 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 10, 1)
        .setValue(this.settingsService.getSettings().normalCardBorderWidth || 1)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ normalCardBorderWidth: value });
          this.notifySettingsChanged('normalCardBorderWidth');
        }));
    
    // 카드 테두리 둥글기 설정
    this.createSetting(containerEl, '카드 테두리 둥글기', '카드 테두리의 둥글기를 픽셀 단위로 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 20, 1)
        .setValue(this.settingsService.getSettings().normalCardBorderRadius || 5)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ normalCardBorderRadius: value });
          this.notifySettingsChanged('normalCardBorderRadius');
        }));
    
    // 활성 카드 배경색 설정
    this.createSetting(containerEl, '활성 카드 배경색', '활성 상태인 카드의 배경색을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().activeCardBgColor || '#e6f2ff')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ activeCardBgColor: value });
          this.notifySettingsChanged('activeCardBgColor');
        }));
    
    // 활성 카드 테두리 색상 설정
    this.createSetting(containerEl, '활성 카드 테두리 색상', '활성 상태인 카드의 테두리 색상을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().activeCardBorderColor || '#4d94ff')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ activeCardBorderColor: value });
          this.notifySettingsChanged('activeCardBorderColor');
        }));
    
    // 호버 카드 배경색 설정
    this.createSetting(containerEl, '호버 카드 배경색', '마우스를 올렸을 때 카드의 배경색을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().hoverCardBgColor || '#f0f7ff')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ hoverCardBgColor: value });
          this.notifySettingsChanged('hoverCardBgColor');
        }));
    
    // 호버 카드 테두리 색상 설정
    this.createSetting(containerEl, '호버 카드 테두리 색상', '마우스를 올렸을 때 카드의 테두리 색상을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().hoverCardBorderColor || '#80b3ff')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ hoverCardBorderColor: value });
          this.notifySettingsChanged('hoverCardBorderColor');
        }));
  }
}