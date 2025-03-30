import { Setting } from 'obsidian';
import { IPluginWithSettings } from '@/ui/settings/SettingsTab';

/**
 * 검색 설정 컴포넌트
 */
export class SearchSettings {
  constructor(
    private readonly containerEl: HTMLElement,
    private readonly plugin: IPluginWithSettings
  ) {}

  /**
   * 검색 설정 표시
   */
  display(): void {
    // 검색 설정
    new Setting(this.containerEl)
      .setName('검색 설정')
      .setHeading();

    // 기본 검색 범위
    new Setting(this.containerEl)
      .setName('기본 검색 범위')
      .setDesc('검색 시 기본적으로 사용할 범위를 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('vault', '볼트 전체')
          .addOption('current', '현재 카드셋')
          .setValue(this.plugin.getSetting('defaultSearchScope'))
          .onChange(value => {
            this.plugin.setSetting('defaultSearchScope', value);
            this.plugin.saveSettings();
          });
      });

    // 실시간 검색
    new Setting(this.containerEl)
      .setName('실시간 검색')
      .setDesc('검색어 입력 시 즉시 결과를 필터링합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('realtimeSearch'))
          .onChange(value => {
            this.plugin.setSetting('realtimeSearch', value);
            this.plugin.saveSettings();
          });
      });

    // 검색 결과 수
    new Setting(this.containerEl)
      .setName('검색 결과 수')
      .setDesc('검색 결과로 표시할 최대 카드 수를 설정합니다.')
      .addSlider(slider => {
        slider
          .setLimits(10, 100, 10)
          .setValue(this.plugin.getSetting('maxSearchResults'))
          .setDynamicTooltip()
          .onChange(value => {
            this.plugin.setSetting('maxSearchResults', value);
            this.plugin.saveSettings();
          });
      });

    // 검색 옵션
    new Setting(this.containerEl)
      .setName('검색 옵션')
      .setHeading();

    // 파일명 검색
    new Setting(this.containerEl)
      .setName('파일명 검색')
      .setDesc('파일명에서도 검색합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('searchInFileName'))
          .onChange(value => {
            this.plugin.setSetting('searchInFileName', value);
            this.plugin.saveSettings();
          });
      });

    // 태그 검색
    new Setting(this.containerEl)
      .setName('태그 검색')
      .setDesc('태그에서도 검색합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('searchInTags'))
          .onChange(value => {
            this.plugin.setSetting('searchInTags', value);
            this.plugin.saveSettings();
          });
      });

    // 링크 검색
    new Setting(this.containerEl)
      .setName('링크 검색')
      .setDesc('링크에서도 검색합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.getSetting('searchInLinks'))
          .onChange(value => {
            this.plugin.setSetting('searchInLinks', value);
            this.plugin.saveSettings();
          });
      });
  }
} 