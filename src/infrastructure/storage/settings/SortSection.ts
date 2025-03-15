import { Setting } from 'obsidian';
import { BaseSettingSection } from './BaseSettingSection';
import { EventType } from '../../../domain/events/EventTypes';
import { DomainEventBus } from '../../../core/events/DomainEventBus';
import { ISettingsService } from '../../../domain/settings/SettingsInterfaces';
import { SortDirection, SortType } from '../../../domain/sorting/SortingInterfaces';

/**
 * 카드 정렬 설정 섹션
 * 카드 정렬 관련 설정을 표시하는 섹션입니다.
 */
export class CardSortSection extends BaseSettingSection {
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

    // 섹션 제목
    containerEl.createEl('h3', { text: '정렬 설정' });
    containerEl.createEl('p', { 
      text: '카드 정렬 관련 설정을 구성합니다. 정렬 타입, 정렬 방향 등을 설정할 수 있습니다.',
      cls: 'setting-item-description'
    });

    // 기본 정렬 타입 설정
    this.createSetting(containerEl, '기본 정렬 타입', '카드 뷰가 로드될 때 사용할 기본 정렬 타입을 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('filename', '파일명')
        .addOption('title', '제목')
        .addOption('created', '생성일')
        .addOption('modified', '수정일')
        .addOption('path', '경로')
        .addOption('random', '랜덤')
        .setValue(this.settingsService.getSettings().defaultSortType || 'filename')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ defaultSortType: value as SortType });
          this.notifySettingsChanged();
        }));
    
    // 기본 정렬 방향 설정
    this.createSetting(containerEl, '기본 정렬 방향', '카드 뷰가 로드될 때 사용할 기본 정렬 방향을 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('asc', '오름차순')
        .addOption('desc', '내림차순')
        .setValue(this.settingsService.getSettings().defaultSortDirection || 'asc')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ defaultSortDirection: value as SortDirection });
          this.notifySettingsChanged();
        }));
    
    // 대소문자 구분 설정 (태그 대소문자 구분 설정 재사용)
    this.createSetting(containerEl, '정렬 대소문자 구분', '정렬 시 대소문자를 구분할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.settingsService.getSettings().tagCaseSensitive || false)
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ tagCaseSensitive: value });
          this.notifySettingsChanged();
        }));
  }
} 