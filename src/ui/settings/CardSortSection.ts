import { Setting } from 'obsidian';
import { BaseSettingSection } from './BaseSettingSection';
import { EventType } from '../../domain/events/EventTypes';

/**
 * 카드 정렬 설정 섹션
 * 카드 정렬 관련 설정을 표시하는 섹션입니다.
 */
export class CardSortSection extends BaseSettingSection {
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
    containerEl.createEl('h3', { text: '카드 정렬 설정' });
    
    // 기본 정렬 기준 설정
    this.createSetting(containerEl, '기본 정렬 기준', '카드 정렬 기준을 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('filename', '파일명')
        .addOption('title', '타이틀')
        .addOption('created', '생성일')
        .addOption('modified', '수정일')
        .addOption('random', '랜덤')
        .addOption('custom', '사용자 정의')
        .setValue(this.settingsService.getSettings().defaultSortBy || 'filename')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ defaultSortBy: value as 'filename' | 'title' | 'created' | 'modified' | 'random' | 'custom' });
          this.notifySettingsChanged();
        }));
    
    // 기본 정렬 방향 설정
    this.createSetting(containerEl, '기본 정렬 방향', '카드 정렬 방향을 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('asc', '오름차순')
        .addOption('desc', '내림차순')
        .setValue(this.settingsService.getSettings().defaultSortDirection || 'asc')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ defaultSortDirection: value as 'asc' | 'desc' });
          this.notifySettingsChanged();
        }));
    
    // 사용자 정의 정렬 키 설정
    if (this.settingsService.getSettings().defaultSortBy === 'custom') {
      this.createSetting(containerEl, '사용자 정의 정렬 키', '프론트매터에서 사용할 정렬 키를 설정합니다.')
        .addText(text => text
          .setValue(this.settingsService.getSettings().customSortFrontmatterKey || '')
          .onChange(async (value) => {
            await this.settingsService.updateSettings({ customSortFrontmatterKey: value });
            this.notifySettingsChanged();
          }));
      
      this.createSetting(containerEl, '사용자 정의 정렬 값 타입', '정렬 값의 타입을 설정합니다.')
        .addDropdown(dropdown => dropdown
          .addOption('string', '문자열')
          .addOption('number', '숫자')
          .addOption('date', '날짜')
          .setValue(this.settingsService.getSettings().customSortValueType || 'string')
          .onChange(async (value) => {
            await this.settingsService.updateSettings({ customSortValueType: value as 'string' | 'number' | 'date' });
            this.notifySettingsChanged();
          }));
    }
  }
} 