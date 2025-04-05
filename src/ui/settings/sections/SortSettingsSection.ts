import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { SortField, SortOrder } from '@/domain/models/SortConfig';
import { ServiceContainer } from '@/application/services/SettingsService';
import type { ISettingsService } from '@/application/services/SettingsService';

/**
 * 정렬 설정 섹션
 */
export class SortSettingsSection {
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
          .addOption(SortField.FILENAME, '파일명')
          .addOption(SortField.UPDATED, '수정일')
          .addOption(SortField.CREATED, '생성일')
          .setValue(settings.sort.sortField)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('sort.sortField', value as SortField);
          }));

    // 정렬 순서
    new Setting(containerEl)
      .setName('정렬 순서')
      .setDesc('카드 목록의 정렬 순서를 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption(SortOrder.ASC, '오름차순')
          .addOption(SortOrder.DESC, '내림차순')
          .setValue(settings.sort.sortOrder)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('sort.sortOrder', value as SortOrder);
          }));

    // 우선순위 설정
    containerEl.createEl('h4', { text: '우선순위 설정' });

    // 우선순위 태그
    new Setting(containerEl)
      .setName('우선순위 태그')
      .setDesc('우선순위 태그를 쉼표로 구분하여 입력합니다. 이 태그가 포함된 노트가 상단에 표시됩니다.')
      .addTextArea(text => {
        text
          .setValue(settings.sort.priorityTags.join(', '))
          .onChange(async (value) => {
            const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
            await this.settingsService.updateNestedSettings('sort.priorityTags', tags);
          });
        return text;
      });

    // 우선순위 폴더
    new Setting(containerEl)
      .setName('우선순위 폴더')
      .setDesc('우선순위 폴더를 쉼표로 구분하여 입력합니다. 이 폴더에 있는 노트가 상단에 표시됩니다.')
      .addTextArea(text => {
        text
          .setValue(settings.sort.priorityFolders.join(', '))
          .onChange(async (value) => {
            const folders = value.split(',').map(folder => folder.trim()).filter(folder => folder);
            await this.settingsService.updateNestedSettings('sort.priorityFolders', folders);
          });
        return text;
      });
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