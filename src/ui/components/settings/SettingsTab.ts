import { App, PluginSettingTab, Setting } from 'obsidian';
import { CardNavigatorPlugin } from '../../../main';
import { SettingsManager } from '../../../managers/settings/SettingsManager';
import { PresetManager } from '../../../managers/preset/PresetManager';
import { CardNavigatorSettings } from '../../../core/types/settings.types';
import { LayoutType } from '../../../core/types/layout.types';
import { translate as t } from '../../../i18n';
import { LOCALE_NAMES, SUPPORTED_LOCALES } from '../../../core/constants/settings.constants';

/**
 * 카드 네비게이터 설정 탭 클래스
 * Obsidian의 PluginSettingTab을 확장하여 카드 네비게이터 플러그인의 설정 탭을 생성하고 관리합니다.
 */
export class SettingsTab extends PluginSettingTab {
  /**
   * 플러그인 인스턴스
   */
  private plugin: CardNavigatorPlugin;
  
  /**
   * 설정 관리자
   */
  private settingsManager: SettingsManager;
  
  /**
   * 프리셋 관리자
   */
  private presetManager: PresetManager;
  
  /**
   * 현재 설정
   */
  private settings: CardNavigatorSettings;
  
  /**
   * 설정 탭 생성자
   * @param app 앱 인스턴스
   * @param plugin 플러그인 인스턴스
   * @param settingsManager 설정 관리자
   * @param presetManager 프리셋 관리자
   */
  constructor(
    app: App,
    plugin: CardNavigatorPlugin,
    settingsManager: SettingsManager,
    presetManager: PresetManager
  ) {
    super(app, plugin);
    this.plugin = plugin;
    this.settingsManager = settingsManager;
    this.presetManager = presetManager;
    this.settings = settingsManager.getSettings();
  }
  
  /**
   * 설정 탭 표시
   */
  display(): void {
    const { containerEl } = this;
    
    // 컨테이너 초기화
    containerEl.empty();
    
    // 설정 헤더
    containerEl.createEl('h2', { text: t('settings') });
    
    // 프리셋 섹션
    this.addPresetSection(containerEl);
    
    // 일반 설정 섹션
    this.addGeneralSection(containerEl);
    
    // 언어 설정 섹션
    this.addLanguageSection(containerEl);
    
    // 카드 설정 섹션
    this.addCardSection(containerEl);
    
    // 레이아웃 설정 섹션
    this.addLayoutSection(containerEl);
    
    // 고급 설정 섹션
    this.addAdvancedSection(containerEl);
  }
  
  /**
   * 프리셋 섹션 추가
   * @param containerEl 컨테이너 요소
   */
  private addPresetSection(containerEl: HTMLElement): void {
    const presetSection = containerEl.createEl('div', { cls: 'settings-section' });
    
    presetSection.createEl('h3', { text: t('settings_presets') });
    
    // 현재 프리셋 설정
    const activePreset = this.presetManager.getActivePreset();
    
    new Setting(presetSection)
      .setName('현재 프리셋')
      .setDesc('현재 사용 중인 프리셋입니다.')
      .addDropdown(dropdown => {
        // 모든 프리셋 가져오기
        const presets = this.presetManager.getAllPresets();
        
        // 드롭다운 옵션 추가
        dropdown.addOption('', '기본 설정');
        presets.forEach(preset => {
          dropdown.addOption(preset.name, preset.name);
        });
        
        // 현재 프리셋 선택
        dropdown.setValue(activePreset ? activePreset.name : '');
        
        // 변경 이벤트 리스너
        dropdown.onChange(async (value) => {
          if (value) {
            this.presetManager.setActivePreset(value);
          } else {
            this.presetManager.setActivePreset(null);
          }
          
          // 설정 업데이트
          this.settings = this.settingsManager.getSettings();
          
          // 설정 탭 다시 표시
          this.display();
        });
      });
    
    // 프리셋 관리 버튼
    new Setting(presetSection)
      .setName('프리셋 관리')
      .setDesc('프리셋을 생성, 수정, 삭제합니다.')
      .addButton(button => {
        button
          .setButtonText('새 프리셋 저장')
          .onClick(async () => {
            // 프리셋 이름 입력 모달 표시
            const presetName = await this.promptForPresetName();
            if (presetName) {
              // 현재 설정으로 프리셋 생성
              await this.presetManager.createPresetWithSettings(
                presetName,
                this.settingsManager.getSettings()
              );
              
              // 설정 탭 다시 표시
              this.display();
            }
          });
      })
      .addButton(button => {
        button
          .setButtonText('현재 프리셋 업데이트')
          .setDisabled(!activePreset)
          .onClick(async () => {
            if (activePreset) {
              // 현재 설정으로 프리셋 업데이트
              await this.presetManager.updatePreset(
                activePreset.name,
                this.settingsManager.getSettings()
              );
              
              // 설정 탭 다시 표시
              this.display();
            }
          });
      })
      .addButton(button => {
        button
          .setButtonText('현재 프리셋 삭제')
          .setDisabled(!activePreset)
          .onClick(async () => {
            if (activePreset) {
              // 프리셋 삭제 확인 모달 표시
              const confirmed = await this.confirmPresetDeletion(activePreset.name);
              if (confirmed) {
                // 프리셋 삭제
                await this.presetManager.deletePreset(activePreset.name);
                
                // 설정 탭 다시 표시
                this.display();
              }
            }
          });
      });
  }
  
  /**
   * 일반 설정 섹션 추가
   * @param containerEl 컨테이너 요소
   */
  private addGeneralSection(containerEl: HTMLElement): void {
    const generalSection = containerEl.createEl('div', { cls: 'settings-section' });
    
    generalSection.createEl('h3', { text: t('settings_general') });
    
    // 시작 시 카드 네비게이터 열기 설정
    new Setting(generalSection)
      .setName('시작 시 카드 네비게이터 열기')
      .setDesc('Obsidian 시작 시 자동으로 카드 네비게이터를 엽니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.general.openOnStartup)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('general', {
              ...this.settings.general,
              openOnStartup: value
            });
          });
      });
    
    // 기본 카드셋 타입 설정
    new Setting(generalSection)
      .setName('기본 카드셋 타입')
      .setDesc('카드 네비게이터 열 때 기본으로 표시할 카드셋 타입입니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('activeFolder', '활성 폴더')
          .addOption('selectedFolder', '지정 폴더')
          .addOption('vault', '볼트 전체')
          .addOption('searchResults', '검색 결과')
          .setValue(this.settings.general.defaultCardSetType)
          .onChange(async (value: any) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('general', {
              ...this.settings.general,
              defaultCardSetType: value
            });
          });
      });
    
    // 기본 정렬 필드 설정
    new Setting(generalSection)
      .setName('기본 정렬 필드')
      .setDesc('카드 정렬 시 기본으로 사용할 필드입니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('name', '파일명')
          .addOption('created', '생성일')
          .addOption('modified', '수정일')
          .addOption('size', '파일 크기')
          .addOption('path', '경로')
          .setValue(this.settings.general.defaultSortField)
          .onChange(async (value: any) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('general', {
              ...this.settings.general,
              defaultSortField: value
            });
          });
      });
    
    // 기본 정렬 방향 설정
    new Setting(generalSection)
      .setName('기본 정렬 방향')
      .setDesc('카드 정렬 시 기본으로 사용할 방향입니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('asc', '오름차순')
          .addOption('desc', '내림차순')
          .setValue(this.settings.general.defaultSortDirection)
          .onChange(async (value: any) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('general', {
              ...this.settings.general,
              defaultSortDirection: value
            });
          });
      });
  }
  
  /**
   * 언어 설정 섹션 추가
   * @param containerEl 컨테이너 요소
   */
  private addLanguageSection(containerEl: HTMLElement): void {
    const languageSection = containerEl.createEl('div', { cls: 'settings-section' });
    
    languageSection.createEl('h3', { text: t('language_settings') });
    
    // 시스템 언어 사용 설정
    new Setting(languageSection)
      .setName(t('language_use_system'))
      .setDesc(t('language_use_system_desc'))
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.language.useSystemLanguage)
          .onChange(async (value) => {
            // 설정 업데이트
            this.settings.language.useSystemLanguage = value;
            await this.settingsManager.saveSettings();
            
            // 언어 설정 섹션 다시 표시
            containerEl.empty();
            this.display();
          });
      });
    
    // 언어 선택 설정 (시스템 언어 사용이 꺼져 있을 때만 활성화)
    new Setting(languageSection)
      .setName(t('language_select'))
      .setDesc(t('language_select_desc'))
      .setDisabled(this.settings.language.useSystemLanguage)
      .addDropdown(dropdown => {
        // 지원되는 언어 옵션 추가
        SUPPORTED_LOCALES.forEach(locale => {
          dropdown.addOption(locale, LOCALE_NAMES[locale] || locale);
        });
        
        // 현재 언어 선택
        dropdown.setValue(this.settings.language.locale);
        
        // 변경 이벤트 리스너
        dropdown.onChange(async (value) => {
          // 설정 업데이트
          this.settings.language.locale = value;
          await this.settingsManager.saveSettings();
          
          // 언어 설정 섹션 다시 표시
          containerEl.empty();
          this.display();
        });
      });
  }
  
  /**
   * 카드 설정 섹션 추가
   * @param containerEl 컨테이너 요소
   */
  private addCardSection(containerEl: HTMLElement): void {
    const cardSection = containerEl.createEl('div', { cls: 'settings-section' });
    
    cardSection.createEl('h3', { text: t('settings_card_content') });
    
    // 파일명 표시 설정
    new Setting(cardSection)
      .setName('파일명 표시')
      .setDesc('카드에 파일명을 표시합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.card.showFileName)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              showFileName: value
            });
          });
      });
    
    // 첫 번째 헤더 표시 설정
    new Setting(cardSection)
      .setName('첫 번째 헤더 표시')
      .setDesc('카드에 파일의 첫 번째 헤더를 표시합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.card.showFirstHeader)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              showFirstHeader: value
            });
          });
      });
    
    // 본문 표시 설정
    new Setting(cardSection)
      .setName('본문 표시')
      .setDesc('카드에 파일 본문을 표시합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.card.showBody)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              showBody: value
            });
          });
      });
    
    // 본문 길이 제한 설정
    new Setting(cardSection)
      .setName('본문 길이 제한')
      .setDesc('카드에 표시되는 본문 길이를 제한합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.card.bodyLengthLimit)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              bodyLengthLimit: value
            });
          });
      });
    
    // 본문 최대 길이 설정
    new Setting(cardSection)
      .setName('본문 최대 길이')
      .setDesc('카드에 표시되는 본문의 최대 길이입니다.')
      .addSlider(slider => {
        slider
          .setLimits(50, 500, 50)
          .setValue(this.settings.card.bodyLength)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              bodyLength: value
            });
          });
      });
    
    // 태그 표시 설정
    new Setting(cardSection)
      .setName('태그 표시')
      .setDesc('카드에 파일의 태그를 표시합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.card.showTags)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              showTags: value
            });
          });
      });
    
    // 마크다운 렌더링 설정
    new Setting(cardSection)
      .setName('마크다운 렌더링')
      .setDesc('카드 본문을 마크다운으로 렌더링합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.card.renderContentAsHtml)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              renderContentAsHtml: value
            });
          });
      });
  }
  
  /**
   * 레이아웃 설정 섹션 추가
   * @param containerEl 컨테이너 요소
   */
  private addLayoutSection(containerEl: HTMLElement): void {
    const layoutSection = containerEl.createEl('div', { cls: 'settings-section' });
    
    layoutSection.createEl('h3', { text: t('settings_layout') });
    
    // 레이아웃 타입 설정
    new Setting(layoutSection)
      .setName('레이아웃 타입')
      .setDesc('카드 표시 레이아웃 타입입니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('masonry', '메이슨리')
          .addOption('grid', '그리드')
          .addOption('list', '리스트')
          .setValue(this.settings.layout.type)
          .onChange(async (value: LayoutType) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('layout', {
              ...this.settings.layout,
              type: value
            });
          });
      });
    
    // 카드 너비 임계값 설정
    new Setting(layoutSection)
      .setName('카드 너비 임계값')
      .setDesc('카드의 기본 너비 임계값입니다. 컨테이너 너비와 함께 열 수 결정에 사용됩니다.')
      .addSlider(slider => {
        slider
          .setLimits(100, 500, 50)
          .setValue(this.settings.layout.cardThresholdWidth)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('layout', {
              ...this.settings.layout,
              cardThresholdWidth: value
            });
          });
      });
    
    // 카드 높이 정렬 설정
    new Setting(layoutSection)
      .setName('카드 높이 정렬')
      .setDesc('모든 카드의 높이를 동일하게 맞춥니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.layout.alignCardHeight)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('layout', {
              ...this.settings.layout,
              alignCardHeight: value
            });
          });
      });
    
    // 고정 높이 사용 설정
    new Setting(layoutSection)
      .setName('고정 높이 사용')
      .setDesc('카드에 고정 높이를 사용합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.layout.useFixedHeight)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('layout', {
              ...this.settings.layout,
              useFixedHeight: value
            });
          });
      });
    
    // 고정 카드 높이 설정
    new Setting(layoutSection)
      .setName('고정 카드 높이')
      .setDesc('카드의 고정 높이입니다.')
      .addSlider(slider => {
        slider
          .setLimits(100, 500, 50)
          .setValue(this.settings.layout.fixedCardHeight)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('layout', {
              ...this.settings.layout,
              fixedCardHeight: value
            });
          });
      });
    
    // 카드 간 간격 설정
    new Setting(layoutSection)
      .setName('카드 간 간격')
      .setDesc('카드 사이의 간격입니다.')
      .addSlider(slider => {
        slider
          .setLimits(0, 50, 5)
          .setValue(this.settings.layout.cardGap)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('layout', {
              ...this.settings.layout,
              cardGap: value
            });
          });
      });
  }
  
  /**
   * 고급 설정 섹션 추가
   * @param containerEl 컨테이너 요소
   */
  private addAdvancedSection(containerEl: HTMLElement): void {
    const advancedSection = containerEl.createEl('div', { cls: 'settings-section' });
    
    advancedSection.createEl('h3', { text: t('settings_advanced') });
    
    // 설정 초기화 버튼
    new Setting(advancedSection)
      .setName('설정 초기화')
      .setDesc('모든 설정을 기본값으로 초기화합니다.')
      .addButton(button => {
        button
          .setButtonText('초기화')
          .onClick(async () => {
            // 초기화 확인 모달 표시
            const confirmed = await this.confirmSettingsReset();
            if (confirmed) {
              // 설정 초기화
              await this.settingsManager.resetSettings();
              
              // 설정 탭 다시 표시
              this.display();
            }
          });
      });
    
    // 설정 내보내기 버튼
    new Setting(advancedSection)
      .setName('설정 내보내기')
      .setDesc('현재 설정을 JSON 파일로 내보냅니다.')
      .addButton(button => {
        button
          .setButtonText('내보내기')
          .onClick(() => {
            // 설정 내보내기
            this.exportSettings();
          });
      });
    
    // 설정 가져오기 버튼
    new Setting(advancedSection)
      .setName('설정 가져오기')
      .setDesc('JSON 파일에서 설정을 가져옵니다.')
      .addButton(button => {
        button
          .setButtonText('가져오기')
          .onClick(() => {
            // 설정 가져오기
            this.importSettings();
          });
      });
  }
  
  /**
   * 프리셋 이름 입력 프롬프트 표시
   * @returns 입력된 프리셋 이름 또는 null
   */
  private async promptForPresetName(): Promise<string | null> {
    // 실제 구현에서는 모달 사용
    return prompt('새 프리셋 이름을 입력하세요:');
  }
  
  /**
   * 프리셋 삭제 확인 모달 표시
   * @param presetName 삭제할 프리셋 이름
   * @returns 확인 여부
   */
  private async confirmPresetDeletion(presetName: string): Promise<boolean> {
    // 실제 구현에서는 모달 사용
    return confirm(`"${presetName}" 프리셋을 삭제하시겠습니까?`);
  }
  
  /**
   * 설정 초기화 확인 모달 표시
   * @returns 확인 여부
   */
  private async confirmSettingsReset(): Promise<boolean> {
    // 실제 구현에서는 모달 사용
    return confirm('모든 설정을 기본값으로 초기화하시겠습니까?');
  }
  
  /**
   * 설정 내보내기
   */
  private exportSettings(): void {
    // 설정 가져오기
    const settings = this.settingsManager.getSettings();
    
    // JSON 문자열로 변환
    const json = JSON.stringify(settings, null, 2);
    
    // 다운로드 링크 생성
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 다운로드 링크 클릭
    const a = document.createElement('a');
    a.href = url;
    a.download = 'card-navigator-settings.json';
    a.click();
    
    // URL 해제
    URL.revokeObjectURL(url);
  }
  
  /**
   * 설정 가져오기
   */
  private importSettings(): void {
    // 파일 입력 요소 생성
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    // 파일 선택 이벤트 리스너
    input.addEventListener('change', async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // 파일 읽기
          const text = await file.text();
          
          // JSON 파싱
          const settings = JSON.parse(text);
          
          // 설정 업데이트
          await this.settingsManager.updateSettings(settings);
          
          // 설정 탭 다시 표시
          this.display();
        } catch (error) {
          console.error('설정 가져오기 실패:', error);
          alert('설정 가져오기에 실패했습니다. 파일 형식을 확인하세요.');
        }
      }
    });
    
    // 파일 선택 다이얼로그 표시
    input.click();
  }
} 