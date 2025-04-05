import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { ServiceContainer } from '@/application/services/SettingsService';
import type { ISettingsService } from '@/application/services/SettingsService';

/**
 * 검색 설정 섹션
 */
export class SearchSettingsSection {
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
   * 검색 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '검색 설정' });

    const settings = this.settingsService.getSettings();

    // 검색 범위
    new Setting(containerEl)
      .setName('검색 범위')
      .setDesc('검색할 범위를 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption('all', '전체')
          .addOption('current', '현재 카드셋')
          .setValue(settings.search.searchScope)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('search.searchScope', value as 'all' | 'current');
          }));

    // 검색 옵션 섹션
    containerEl.createEl('h4', { text: '검색 옵션' });

    // 파일명 검색
    new Setting(containerEl)
      .setName('파일명 검색')
      .setDesc('파일명에서도 검색합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.search.searchFilename)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('search.searchFilename', value);
          }));

    // 내용 검색
    new Setting(containerEl)
      .setName('내용 검색')
      .setDesc('파일 내용에서도 검색합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.search.searchContent)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('search.searchContent', value);
          }));

    // 태그 검색
    new Setting(containerEl)
      .setName('태그 검색')
      .setDesc('태그에서도 검색합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.search.searchTags)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('search.searchTags', value);
          }));

    // 검색 옵션 섹션
    containerEl.createEl('h4', { text: '검색 옵션' });

    // 대소문자 구분
    new Setting(containerEl)
      .setName('대소문자 구분')
      .setDesc('검색 시 대소문자를 구분합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.search.caseSensitive)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('search.caseSensitive', value);
          }));

    // 정규식 사용
    new Setting(containerEl)
      .setName('정규식 사용')
      .setDesc('검색어를 정규식으로 처리합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.search.useRegex)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('search.useRegex', value);
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
} 