import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { Container } from '@/infrastructure/di/Container';
import type { ISettingsService } from '@/domain/services/ISettingsService';
import { SearchScope } from '@/domain/models/SearchResult';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { ISearchConfig } from '@/domain/models/SearchConfig';

/**
 * 검색 설정 섹션
 */
export class SearchSettingsSection {
  private settingsService: ISettingsService;
  private listeners: (() => void)[] = [];
  private eventDispatcher: IEventDispatcher;

  constructor(private plugin: CardNavigatorPlugin, eventDispatcher: IEventDispatcher) {
    // 설정 서비스 가져오기
    this.settingsService = Container.getInstance().resolve<ISettingsService>('ISettingsService');
    
    // 설정 변경 감지
    this.listeners.push(
      this.settingsService.onSettingsChanged(() => {
        // 설정이 변경되면 필요한 UI 업데이트 수행 가능
      })
    );

    this.eventDispatcher = eventDispatcher;
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
          .addOption(SearchScope.ALL, '전체')
          .addOption(SearchScope.CURRENT, '현재 카드셋')
          .setValue(settings.searchConfig.scope)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('searchConfig.scope', value as SearchScope);
          }));

    // 검색 옵션 섹션
    containerEl.createEl('h4', { text: '검색 옵션' });

    // 파일명 검색
    new Setting(containerEl)
      .setName('파일명 검색')
      .setDesc('파일명에서도 검색합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.searchConfig.fields.filename)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('searchConfig.fields.filename', value);
          }));

    // 내용 검색
    new Setting(containerEl)
      .setName('내용 검색')
      .setDesc('파일 내용에서도 검색합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.searchConfig.fields.content)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('searchConfig.fields.content', value);
          }));

    // 태그 검색
    new Setting(containerEl)
      .setName('태그 검색')
      .setDesc('태그에서도 검색합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.searchConfig.fields.tags)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('searchConfig.fields.tags', value);
          }));

    // 프론트매터 검색
    new Setting(containerEl)
      .setName('프론트매터 검색')
      .setDesc('프론트매터에서도 검색합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.searchConfig.fields.frontmatter)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('searchConfig.fields.frontmatter', value);
          }));

    // 검색 옵션 섹션
    containerEl.createEl('h4', { text: '검색 옵션' });

    // 대소문자 구분
    new Setting(containerEl)
      .setName('대소문자 구분')
      .setDesc('검색 시 대소문자를 구분합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.searchConfig.caseSensitive)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('searchConfig.caseSensitive', value);
          }));

    // 정규식 사용
    new Setting(containerEl)
      .setName('정규식 사용')
      .setDesc('검색어를 정규식으로 처리합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.searchConfig.useRegex)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('searchConfig.useRegex', value);
          }));

    // 실시간 검색
    new Setting(containerEl)
      .setName('실시간 검색')
      .setDesc('검색어 입력 시 즉시 결과를 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.searchConfig.realtimeSearch)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('searchConfig.realtimeSearch', value);
          }));

    // 검색 결과 제한
    new Setting(containerEl)
      .setName('검색 결과 제한')
      .setDesc('검색 결과의 최대 개수를 설정합니다.')
      .addText(text =>
        text
          .setValue(settings.searchConfig.resultLimit.toString())
          .onChange(async (value) => {
            const limit = parseInt(value);
            if (!isNaN(limit) && limit > 0) {
              await this.settingsService.updateNestedSettings('searchConfig.resultLimit', limit);
            }
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

  updateSearchConfig(oldConfig: ISearchConfig, newConfig: ISearchConfig): void {
    this.eventDispatcher.dispatch(
      new DomainEvent(DomainEventType.SEARCH_SETTINGS_SECTION_CHANGED, {
        oldConfig,
        newConfig
      })
    );
  }
} 