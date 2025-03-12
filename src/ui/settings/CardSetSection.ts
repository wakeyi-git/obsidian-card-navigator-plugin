import { Setting } from 'obsidian';
import { BaseSettingSection } from './BaseSettingSection';
import { EventType } from '../../domain/events/EventTypes';
import { CardSetSourceType } from '../../domain/cardset/CardSet';

/**
 * 카드셋 설정 섹션
 * 카드셋 설정을 표시하는 섹션입니다.
 */
export class CardSetSection extends BaseSettingSection {
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
    containerEl.createEl('h3', { text: '카드셋 설정' });
    
    // 기본 카드셋 소스 설정
    this.createSetting(containerEl, '기본 카드셋 소스', '플러그인 로드 시 사용할 기본 카드셋 소스를 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('folder', '폴더')
        .addOption('tag', '태그')
        .addOption('search', '검색')
        .setValue(this.settingsService.getSettings().defaultCardSetSource || 'folder')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ defaultCardSetSource: value as CardSetSourceType });
          this.notifySettingsChanged();
        }));
    
    // 기본 폴더 카드셋 설정
    if (this.settingsService.getSettings().defaultCardSetSource === 'folder') {
      this.createSetting(containerEl, '기본 폴더 카드셋', '기본 폴더 카드셋을 설정합니다.')
        .addText(text => text
          .setValue(this.settingsService.getSettings().defaultFolderCardSet || '')
          .onChange(async (value) => {
            await this.settingsService.updateSettings({ defaultFolderCardSet: value });
            this.notifySettingsChanged();
          }));
    }
    
    // 기본 태그 카드셋 설정
    if (this.settingsService.getSettings().defaultCardSetSource === 'tag') {
      this.createSetting(containerEl, '기본 태그 카드셋', '기본 태그 카드셋을 설정합니다.')
        .addText(text => text
          .setValue(this.settingsService.getSettings().defaultTagCardSet || '')
          .onChange(async (value) => {
            await this.settingsService.updateSettings({ defaultTagCardSet: value });
            this.notifySettingsChanged();
          }));
    }
    
    // 하위 폴더 포함 설정
    this.createSetting(containerEl, '하위 폴더 포함', '폴더 카드셋에 하위 폴더의 파일을 포함할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.settingsService.getSettings().includeSubfolders || false)
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ includeSubfolders: value });
          this.notifySettingsChanged();
        }));
    
    // 카드셋 고정 설정
    this.createSetting(containerEl, '카드셋 고정', '카드셋을 고정할지 여부를 설정합니다. 고정된 카드셋은 다른 파일로 이동해도 유지됩니다.')
      .addToggle(toggle => toggle
        .setValue(this.settingsService.getSettings().isCardSetFixed || false)
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ isCardSetFixed: value });
          this.notifySettingsChanged();
        }));
    
    // 기본 검색 범위 설정
    this.createSetting(containerEl, '기본 검색 범위', '검색 카드셋의 기본 검색 범위를 설정합니다.')
      .addDropdown(dropdown => dropdown
        .addOption('all', '전체 볼트')
        .addOption('current', '현재 폴더')
        .setValue(this.settingsService.getSettings().defaultSearchScope || 'all')
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ defaultSearchScope: value as 'all' | 'current' });
          this.notifySettingsChanged();
        }));
    
    // 태그 대소문자 구분 설정
    this.createSetting(containerEl, '태그 대소문자 구분', '태그 카드셋에서 태그 대소문자를 구분할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.settingsService.getSettings().tagCaseSensitive || false)
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ tagCaseSensitive: value });
          this.notifySettingsChanged();
        }));
    
    // 로드 시 마지막 카드셋 소스 사용 설정
    this.createSetting(containerEl, '로드 시 마지막 카드셋 소스 사용', '플러그인 로드 시 마지막으로 사용한 카드셋 소스를 사용할지 여부를 설정합니다.')
      .addToggle(toggle => toggle
        .setValue(this.settingsService.getSettings().useLastCardSetSourceOnLoad || false)
        .onChange(async (value) => {
          await this.settingsService.updateSettings({ useLastCardSetSourceOnLoad: value });
          this.notifySettingsChanged();
        }));
  }
} 