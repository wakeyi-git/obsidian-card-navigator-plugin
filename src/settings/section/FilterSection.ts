import { Setting } from 'obsidian';
import { BaseSettingSection } from './BaseSettingSection';
import { EventType } from '../../domain/events/EventTypes';

/**
 * 카드 필터 설정 섹션
 * 카드 필터링 관련 설정을 표시하는 섹션입니다.
 */
export class CardFilterSection extends BaseSettingSection {
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

    // 섹션 제목
    containerEl.createEl('h3', { text: '필터 설정' });
    containerEl.createEl('p', { 
      text: '필터 관련 설정을 구성합니다. 필터 활성화, 필터 타입, 필터 연산자 등을 설정할 수 있습니다.',
      cls: 'setting-item-description'
    });

    // 기본 필터 활성화 설정
    this.createSetting(containerEl, '기본 필터 활성화', '카드 뷰가 로드될 때 기본 필터를 활성화할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.settingsService.getSettings().defaultFilterEnabled || false)
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ defaultFilterEnabled: value });
          this.notifySettingsChanged();
        }));
    
    // 기본 필터 타입 설정
    this.createSetting(containerEl, '기본 필터 타입', '기본 필터 타입을 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('tag', '태그')
        .addOption('text', '텍스트')
        .addOption('frontmatter', '프론트매터')
        .setValue(this.settingsService.getSettings().defaultFilterType || 'tag')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ defaultFilterType: value as 'tag' | 'text' | 'frontmatter' });
          this.notifySettingsChanged();
        }));
    
    // 기본 태그 필터 설정
    if (this.settingsService.getSettings().defaultFilterType === 'tag') {
      this.createSetting(containerEl, '기본 태그 필터', '기본 태그 필터를 설정합니다.')
        .addText(text => text
          .setValue(this.settingsService.getSettings().defaultTagFilter || '')
          .onChange(async (value) => {
            await this.settingsService.updateSettings({ defaultTagFilter: value });
            this.notifySettingsChanged();
          }));
    }
    
    // 기본 텍스트 필터 설정
    if (this.settingsService.getSettings().defaultFilterType === 'text') {
      this.createSetting(containerEl, '기본 텍스트 필터', '기본 텍스트 필터를 설정합니다.')
        .addText(text => text
          .setValue(this.settingsService.getSettings().defaultTextFilter || '')
          .onChange(async (value) => {
            await this.settingsService.updateSettings({ defaultTextFilter: value });
            this.notifySettingsChanged();
          }));
    }
    
    // 기본 프론트매터 필터 키 설정
    if (this.settingsService.getSettings().defaultFilterType === 'frontmatter') {
      this.createSetting(containerEl, '기본 프론트매터 필터 키', '기본 프론트매터 필터 키를 설정합니다.')
        .addText(text => text
          .setValue(this.settingsService.getSettings().defaultFrontmatterFilterKey || '')
          .onChange(async (value) => {
            await this.settingsService.updateSettings({ defaultFrontmatterFilterKey: value });
            this.notifySettingsChanged();
          }));
      
      this.createSetting(containerEl, '기본 프론트매터 필터 값', '기본 프론트매터 필터 값을 설정합니다.')
        .addText(text => text
          .setValue(this.settingsService.getSettings().defaultFrontmatterFilterValue || '')
          .onChange(async (value) => {
            await this.settingsService.updateSettings({ defaultFrontmatterFilterValue: value });
            this.notifySettingsChanged();
          }));
    }
    
    // 기본 필터 연산자 설정
    this.createSetting(containerEl, '기본 필터 연산자', '여러 필터 조건을 결합할 때 사용할 연산자를 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('AND', 'AND (모든 조건 만족)')
        .addOption('OR', 'OR (하나 이상의 조건 만족)')
        .setValue(this.settingsService.getSettings().defaultFilterOperator || 'AND')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ defaultFilterOperator: value as 'AND' | 'OR' });
          this.notifySettingsChanged();
        }));
    
    // 필터 대소문자 구분 설정
    this.createSetting(containerEl, '필터 대소문자 구분', '필터링 시 대소문자를 구분할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.settingsService.getSettings().filterCaseSensitive || false)
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ filterCaseSensitive: value });
          this.notifySettingsChanged();
        }));
  }
} 