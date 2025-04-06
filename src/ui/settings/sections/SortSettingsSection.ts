import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { SortField, SortOrder, SortType, SortDirection, ISortConfig } from '@/domain/models/SortConfig';
import { Container } from '@/infrastructure/di/Container';
import type { ISettingsService } from '@/domain/services/ISettingsService';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';

/**
 * 정렬 설정 섹션
 */
export class SortSettingsSection {
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
   * 정렬 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '정렬 설정' });

    const settings = this.settingsService.getSettings();

    // 기본 정렬 설정
    containerEl.createEl('h4', { text: '기본 정렬' });

    // 정렬 기준
    new Setting(containerEl)
      .setName('정렬 기준')
      .setDesc('카드 목록의 정렬 기준을 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption('fileName', '파일명')
          .addOption('created', '생성일')
          .addOption('modified', '수정일')
          .addOption('custom', '사용자 정의')
          .setValue(settings.sortConfig.field)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('sortConfig.field', value as SortField);
          }));

    // 정렬 순서
    new Setting(containerEl)
      .setName('정렬 순서')
      .setDesc('카드 목록의 정렬 순서를 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption('asc', '오름차순')
          .addOption('desc', '내림차순')
          .setValue(settings.sortConfig.direction)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('sortConfig.direction', value as SortDirection);
          }));

    // 정렬 타입
    new Setting(containerEl)
      .setName('정렬 타입')
      .setDesc('카드 목록의 정렬 타입을 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption('name', '이름')
          .addOption('date', '날짜')
          .setValue(settings.sortConfig.type)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('sortConfig.type', value as SortType);
          }));

    // 정렬 순서
    new Setting(containerEl)
      .setName('정렬 순서')
      .setDesc('카드 목록의 정렬 순서를 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption('asc', '오름차순')
          .addOption('desc', '내림차순')
          .setValue(settings.sortConfig.order)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('sortConfig.order', value as SortOrder);
          }));

    // 사용자 정의 정렬 필드
    if (settings.sortConfig.field === 'custom') {
      new Setting(containerEl)
        .setName('사용자 정의 정렬 필드')
        .setDesc('사용자 정의 정렬 필드를 입력합니다.')
        .addText(text =>
          text
            .setValue(settings.sortConfig.customField || '')
            .onChange(async (value) => {
              await this.settingsService.updateNestedSettings('sortConfig.customField', value);
            }));
    }
  }
  
  /**
   * 컴포넌트 정리
   */
  destroy(): void {
    // 이벤트 리스너 정리
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
  }

  updateSortConfig(oldConfig: ISortConfig, newConfig: ISortConfig): void {
    this.eventDispatcher.dispatch(
      new DomainEvent(DomainEventType.SORT_SETTINGS_SECTION_CHANGED, {
        oldConfig,
        newConfig
      })
    );
  }
} 