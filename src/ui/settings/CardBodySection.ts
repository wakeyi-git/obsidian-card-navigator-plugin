import { Setting } from 'obsidian';
import { CardContentType } from '../../domain/card/Card';
import { BaseSettingSection } from './BaseSettingSection';
import { EventType } from '../../domain/events/EventTypes';

/**
 * 카드 바디 설정 섹션
 * 카드 바디 설정을 표시하는 섹션입니다.
 */
export class CardBodySection extends BaseSettingSection {
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
    containerEl.createEl('h3', { text: '카드 바디 설정' });
    
    // 바디 콘텐츠 타입 설정
    this.createSetting(containerEl, '바디 콘텐츠', '카드 바디에 표시할 콘텐츠 타입을 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('filename', '파일명')
          .addOption('title', '제목')
          .addOption('firstheader', '첫 번째 헤더')
          .addOption('content', '본문')
          .addOption('tags', '태그')
          .addOption('path', '경로')
          .addOption('created', '생성일')
          .addOption('modified', '수정일')
          .addOption('frontmatter', '프론트매터');
        
        // 프론트매터 키 옵션 추가
        const frontmatterKeys = this.getFrontmatterKeys();
        frontmatterKeys.forEach(key => {
          dropdown.addOption(key, `프론트매터: ${key}`);
        });
        
        dropdown
          .setValue(this.settingsService.getSettings().cardBodyContent as string || 'content')
          .onChange(async (value) => {
            await this.settingsService.updateSettings({ cardBodyContent: value as CardContentType });
            this.notifySettingsChanged();
          });
        
        return dropdown;
      });
    
    // 프론트매터 키 설정 (cardBodyContent가 frontmatter인 경우)
    if (this.settingsService.getSettings().cardBodyContent === 'frontmatter') {
      this.createSetting(containerEl, '바디 프론트매터 키', '바디에 표시할 프론트매터 키를 입력합니다.')
        .addText(text => text
          .setValue(this.settingsService.getSettings().cardBodyFrontmatterKey || '')
          .onChange(async (value) => {
            await this.settingsService.updateSettings({ cardBodyFrontmatterKey: value });
            this.notifySettingsChanged();
          }));
    }
    
    // 바디 스타일 설정
    this.displayBodyStyle(containerEl);
  }
  
  /**
   * 바디 스타일 설정 표시
   * @param containerEl 컨테이너 요소
   */
  private displayBodyStyle(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '바디 스타일' });
    
    // 배경색 설정
    this.createSetting(containerEl, '배경색', '바디의 배경색을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().bodyBgColor || '#ffffff')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ bodyBgColor: value });
          this.notifySettingsChanged();
        }));
    
    // 폰트 크기 설정
    this.createSetting(containerEl, '폰트 크기', '바디의 폰트 크기를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(8, 24, 1)
        .setValue(this.settingsService.getSettings().bodyFontSize || 12)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ bodyFontSize: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 스타일 설정
    this.createSetting(containerEl, '테두리 스타일', '바디의 테두리 스타일을 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('none', '없음')
        .addOption('solid', '실선')
        .addOption('dashed', '파선')
        .addOption('dotted', '점선')
        .setValue(this.settingsService.getSettings().bodyBorderStyle || 'none')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ bodyBorderStyle: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 색상 설정
    this.createSetting(containerEl, '테두리 색상', '바디의 테두리 색상을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().bodyBorderColor || '#dddddd')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ bodyBorderColor: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 두께 설정
    this.createSetting(containerEl, '테두리 두께', '바디의 테두리 두께를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 10, 1)
        .setValue(this.settingsService.getSettings().bodyBorderWidth || 0)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ bodyBorderWidth: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 반경 설정
    this.createSetting(containerEl, '테두리 반경', '바디의 테두리 반경을 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 20, 1)
        .setValue(this.settingsService.getSettings().bodyBorderRadius || 0)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ bodyBorderRadius: value });
          this.notifySettingsChanged();
        }));
  }
  
  /**
   * 프론트매터 키 목록 가져오기
   * @returns 프론트매터 키 목록
   */
  private getFrontmatterKeys(): string[] {
    // 실제 구현에서는 현재 열린 파일이나 워크스페이스의 파일들에서 프론트매터 키를 수집해야 합니다.
    // 여기서는 예시로 몇 가지 일반적인 키를 반환합니다.
    return ['title', 'author', 'date', 'tags', 'category', 'status', 'priority'];
  }
} 