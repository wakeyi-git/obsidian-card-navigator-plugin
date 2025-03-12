import { Setting } from 'obsidian';
import { CardRenderingMode } from '../../domain/card/Card';
import { BaseSettingSection } from './BaseSettingSection';
import { EventType } from '../../domain/events/EventTypes';

/**
 * 카드 일반 설정 섹션
 * 카드 일반 설정을 표시하는 섹션입니다.
 */
export class CardGeneralSection extends BaseSettingSection {
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
    containerEl.createEl('h3', { text: '카드 일반 설정' });
    
    // 타이틀 소스 설정
    this.createSetting(containerEl, '타이틀 소스', '카드 타이틀로 사용할 소스를 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('filename', '파일명')
        .addOption('firstheader', '첫 번째 헤더')
        .setValue(this.settingsService.getSettings().titleSource || 'filename')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ titleSource: value as 'filename' | 'firstheader' });
          this.notifySettingsChanged();
        }));
    
    // 렌더링 모드 설정
    this.createSetting(containerEl, '렌더링 모드', '카드 내용 렌더링 방식을 선택합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('text', '일반 텍스트')
        .addOption('html', '마크다운 렌더링')
        .setValue(this.settingsService.getSettings().cardRenderingMode || 'text')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ cardRenderingMode: value as CardRenderingMode });
          this.notifySettingsChanged();
        }));
    
    // 프론트매터 포함 여부 설정
    this.createSetting(containerEl, '프론트매터 포함', '본문에 프론트매터를 포함할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.settingsService.getSettings().includeFrontmatterInContent || false)
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ includeFrontmatterInContent: value });
          this.notifySettingsChanged();
        }));
    
    // 첫 번째 헤더 포함 여부 설정
    this.createSetting(containerEl, '첫 번째 헤더 포함', '본문에 첫 번째 헤더를 포함할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.settingsService.getSettings().includeFirstHeaderInContent || false)
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ includeFirstHeaderInContent: value });
          this.notifySettingsChanged();
        }));
    
    // 내용 길이 제한 설정
    this.createSetting(containerEl, '내용 길이 제한', '카드 내용의 길이를 제한할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.settingsService.getSettings().limitContentLength || false)
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ limitContentLength: value });
          this.notifySettingsChanged();
        }));
    
    // 내용 최대 길이 설정
    if (this.settingsService.getSettings().limitContentLength) {
      this.createSetting(containerEl, '내용 최대 길이', '카드 내용의 최대 길이를 설정합니다.')
        .addSlider(slider => slider
          .setLimits(50, 500, 10)
          .setValue(this.settingsService.getSettings().contentMaxLength || 200)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.updateSettings({ contentMaxLength: value });
            this.notifySettingsChanged();
          }));
    }
    
    this.displayNormalCardStyle(containerEl);
    this.displayActiveCardStyle(containerEl);
    this.displayFocusedCardStyle(containerEl);
  }
  
  /**
   * 일반 카드 스타일 설정 표시
   * @param containerEl 컨테이너 요소
   */
  private displayNormalCardStyle(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '일반 카드 스타일' });
    
    // 배경색 설정
    this.createSetting(containerEl, '배경색', '일반 카드의 배경색을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().normalCardBgColor || '#ffffff')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ normalCardBgColor: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 스타일 설정
    this.createSetting(containerEl, '테두리 스타일', '일반 카드의 테두리 스타일을 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('none', '없음')
        .addOption('solid', '실선')
        .addOption('dashed', '파선')
        .addOption('dotted', '점선')
        .setValue(this.settingsService.getSettings().normalCardBorderStyle || 'solid')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ normalCardBorderStyle: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 색상 설정
    this.createSetting(containerEl, '테두리 색상', '일반 카드의 테두리 색상을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().normalCardBorderColor || '#cccccc')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ normalCardBorderColor: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 두께 설정
    this.createSetting(containerEl, '테두리 두께', '일반 카드의 테두리 두께를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 10, 1)
        .setValue(this.settingsService.getSettings().normalCardBorderWidth || 1)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ normalCardBorderWidth: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 반경 설정
    this.createSetting(containerEl, '테두리 반경', '일반 카드의 테두리 반경을 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 20, 1)
        .setValue(this.settingsService.getSettings().normalCardBorderRadius || 5)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ normalCardBorderRadius: value });
          this.notifySettingsChanged();
        }));
  }
  
  /**
   * 활성 카드 스타일 설정 표시
   * @param containerEl 컨테이너 요소
   */
  private displayActiveCardStyle(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '활성 카드 스타일' });
    
    // 배경색 설정
    this.createSetting(containerEl, '배경색', '활성 카드의 배경색을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().activeCardBgColor || '#f0f0f0')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ activeCardBgColor: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 스타일 설정
    this.createSetting(containerEl, '테두리 스타일', '활성 카드의 테두리 스타일을 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('none', '없음')
        .addOption('solid', '실선')
        .addOption('dashed', '파선')
        .addOption('dotted', '점선')
        .setValue(this.settingsService.getSettings().activeCardBorderStyle || 'solid')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ activeCardBorderStyle: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 색상 설정
    this.createSetting(containerEl, '테두리 색상', '활성 카드의 테두리 색상을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().activeCardBorderColor || '#aaaaaa')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ activeCardBorderColor: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 두께 설정
    this.createSetting(containerEl, '테두리 두께', '활성 카드의 테두리 두께를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 10, 1)
        .setValue(this.settingsService.getSettings().activeCardBorderWidth || 2)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ activeCardBorderWidth: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 반경 설정
    this.createSetting(containerEl, '테두리 반경', '활성 카드의 테두리 반경을 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 20, 1)
        .setValue(this.settingsService.getSettings().activeCardBorderRadius || 5)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ activeCardBorderRadius: value });
          this.notifySettingsChanged();
        }));
  }
  
  /**
   * 포커스 카드 스타일 설정 표시
   * @param containerEl 컨테이너 요소
   */
  private displayFocusedCardStyle(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '포커스 카드 스타일' });
    
    // 배경색 설정
    this.createSetting(containerEl, '배경색', '포커스 카드의 배경색을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().focusedCardBgColor || '#e0e0e0')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ focusedCardBgColor: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 스타일 설정
    this.createSetting(containerEl, '테두리 스타일', '포커스 카드의 테두리 스타일을 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('none', '없음')
        .addOption('solid', '실선')
        .addOption('dashed', '파선')
        .addOption('dotted', '점선')
        .setValue(this.settingsService.getSettings().focusedCardBorderStyle || 'solid')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ focusedCardBorderStyle: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 색상 설정
    this.createSetting(containerEl, '테두리 색상', '포커스 카드의 테두리 색상을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().focusedCardBorderColor || '#888888')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ focusedCardBorderColor: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 두께 설정
    this.createSetting(containerEl, '테두리 두께', '포커스 카드의 테두리 두께를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 10, 1)
        .setValue(this.settingsService.getSettings().focusedCardBorderWidth || 3)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ focusedCardBorderWidth: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 반경 설정
    this.createSetting(containerEl, '테두리 반경', '포커스 카드의 테두리 반경을 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 20, 1)
        .setValue(this.settingsService.getSettings().focusedCardBorderRadius || 5)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ focusedCardBorderRadius: value });
          this.notifySettingsChanged();
        }));
  }
} 