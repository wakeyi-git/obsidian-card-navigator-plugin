import { Setting } from 'obsidian';
import { CardContentType } from '../../domain/card/Card';
import { BaseSettingSection } from './BaseSettingSection';
import { EventType } from '../../domain/events/EventTypes';

/**
 * 카드 푸터 설정 섹션
 * 카드 푸터 설정을 표시하는 섹션입니다.
 */
export class CardFooterSection extends BaseSettingSection {
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
    containerEl.createEl('h3', { text: '카드 푸터 설정' });
    
    // 푸터 콘텐츠 타입 설정
    this.createSetting(containerEl, '푸터 콘텐츠', '카드 푸터에 표시할 콘텐츠 타입을 선택합니다.')
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
        
        const currentValue = this.settingsService.getSettings().cardFooterContent as string || 'modified';
        console.log('푸터 콘텐츠 현재 값:', currentValue);
        
        dropdown
          .setValue(currentValue)
          .onChange(async (value) => {
            console.log('푸터 콘텐츠 변경:', value);
            await this.settingsService.updateSettings({ cardFooterContent: value });
            this.notifySettingsChanged('cardFooterContent');
          });
        
        return dropdown;
      });
    
    // 프론트매터 키 설정 (cardFooterContent가 frontmatter인 경우)
    if (this.settingsService.getSettings().cardFooterContent === 'frontmatter') {
      this.createSetting(containerEl, '푸터 프론트매터 키', '푸터에 표시할 프론트매터 키를 입력합니다.')
        .addText(text => text
          .setValue(this.settingsService.getSettings().cardFooterFrontmatterKey || '')
          .onChange(async (value) => {
            await this.settingsService.updateSettings({ cardFooterFrontmatterKey: value });
            this.notifySettingsChanged('cardFooterFrontmatterKey');
          }));
    }
    
    // 푸터 스타일 설정
    this.displayFooterStyle(containerEl);
  }
  
  /**
   * 푸터 스타일 설정 표시
   * @param containerEl 컨테이너 요소
   */
  private displayFooterStyle(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '푸터 스타일' });
    
    // 배경색 설정
    this.createSetting(containerEl, '배경색', '푸터의 배경색을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().footerBgColor || '#f5f5f5')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ footerBgColor: value });
          this.notifySettingsChanged();
        }));
    
    // 폰트 크기 설정
    this.createSetting(containerEl, '폰트 크기', '푸터의 폰트 크기를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(8, 24, 1)
        .setValue(this.settingsService.getSettings().footerFontSize || 10)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ footerFontSize: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 스타일 설정
    this.createSetting(containerEl, '테두리 스타일', '푸터의 테두리 스타일을 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('none', '없음')
        .addOption('solid', '실선')
        .addOption('dashed', '파선')
        .addOption('dotted', '점선')
        .setValue(this.settingsService.getSettings().footerBorderStyle || 'solid')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ footerBorderStyle: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 색상 설정
    this.createSetting(containerEl, '테두리 색상', '푸터의 테두리 색상을 설정합니다.')
      .addColorPicker(color => color
        .setValue(this.settingsService.getSettings().footerBorderColor || '#dddddd')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ footerBorderColor: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 두께 설정
    this.createSetting(containerEl, '테두리 두께', '푸터의 테두리 두께를 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 10, 1)
        .setValue(this.settingsService.getSettings().footerBorderWidth || 1)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ footerBorderWidth: value });
          this.notifySettingsChanged();
        }));
    
    // 테두리 반경 설정
    this.createSetting(containerEl, '테두리 반경', '푸터의 테두리 반경을 설정합니다.')
      .addSlider(slider => slider
        .setLimits(0, 20, 1)
        .setValue(this.settingsService.getSettings().footerBorderRadius || 0)
        .setDynamicTooltip()
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ footerBorderRadius: value });
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