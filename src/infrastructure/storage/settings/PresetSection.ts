import { Notice, Setting } from 'obsidian';
import { BaseSettingSection } from './BaseSettingSection';
import { ISettingsService } from '../../../domain/settings/SettingsInterfaces';
import { DomainEventBus } from '../../../core/events/DomainEventBus';
import { EventType } from '../../../domain/events/EventTypes';
import { ILayoutSettings, LayoutDirectionPreference } from '../../../domain/settings/SettingsInterfaces';

/**
 * 카드 프리셋 설정 섹션
 * 카드 프리셋 관련 설정을 관리합니다.
 */
export class CardPresetSection extends BaseSettingSection {
  private presets: Record<string, any> = {
    'default': {
      cardWidth: 250,
      cardHeight: 150,
      cardHeaderContent: 'filename',
      cardBodyContent: 'content',
      cardFooterContent: 'tags',
      normalCardBorderStyle: 'solid',
      normalCardBorderWidth: 1,
      normalCardBorderRadius: 5,
      headerBorderStyle: 'none',
      bodyBorderStyle: 'none',
      footerBorderStyle: 'none',
      layout: {
        fixedCardHeight: true,
        layoutDirectionPreference: LayoutDirectionPreference.AUTO,
        cardThresholdWidth: 200,
        cardThresholdHeight: 150,
        cardGap: 8,
        cardsetPadding: 10,
        cardSizeFactor: 0.9,
        useLayoutTransition: true
      }
    },
    'compact': {
      cardWidth: 180,
      cardHeight: 100,
      cardHeaderContent: 'filename',
      cardBodyContent: 'none',
      cardFooterContent: 'none',
      normalCardBorderStyle: 'solid',
      normalCardBorderWidth: 1,
      normalCardBorderRadius: 3,
      headerBorderStyle: 'none',
      bodyBorderStyle: 'none',
      footerBorderStyle: 'none',
      layout: {
        fixedCardHeight: true,
        layoutDirectionPreference: LayoutDirectionPreference.AUTO,
        cardThresholdWidth: 150,
        cardThresholdHeight: 100,
        cardGap: 6,
        cardsetPadding: 8,
        cardSizeFactor: 0.8,
        useLayoutTransition: true
      }
    },
    'detailed': {
      cardWidth: 300,
      cardHeight: 200,
      cardHeaderContent: 'filename',
      cardBodyContent: 'content',
      cardFooterContent: 'tags',
      normalCardBorderStyle: 'solid',
      normalCardBorderWidth: 1,
      normalCardBorderRadius: 5,
      headerBorderStyle: 'solid',
      headerBorderWidth: 0,
      headerBorderRadius: 0,
      bodyBorderStyle: 'none',
      footerBorderStyle: 'solid',
      footerBorderWidth: 0,
      footerBorderRadius: 0,
      layout: {
        fixedCardHeight: true,
        layoutDirectionPreference: LayoutDirectionPreference.AUTO,
        cardThresholdWidth: 250,
        cardThresholdHeight: 200,
        cardGap: 12,
        cardsetPadding: 16,
        cardSizeFactor: 1.1,
        useLayoutTransition: true
      }
    },
    'modern': {
      cardWidth: 280,
      cardHeight: 180,
      cardHeaderContent: 'filename',
      cardBodyContent: 'content',
      cardFooterContent: 'tags',
      normalCardBorderStyle: 'none',
      normalCardBorderWidth: 0,
      normalCardBorderRadius: 8,
      headerBorderStyle: 'none',
      headerBorderWidth: 0,
      headerBorderRadius: 0,
      bodyBorderStyle: 'none',
      bodyBorderWidth: 0,
      bodyBorderRadius: 0,
      footerBorderStyle: 'none',
      footerBorderWidth: 0,
      footerBorderRadius: 0,
      normalCardBgColor: 'var(--background-primary)',
      headerBgColor: 'var(--background-primary)',
      bodyBgColor: 'var(--background-primary)',
      footerBgColor: 'var(--background-primary)',
      layout: {
        fixedCardHeight: true,
        layoutDirectionPreference: LayoutDirectionPreference.AUTO,
        cardThresholdWidth: 220,
        cardThresholdHeight: 180,
        cardGap: 16,
        cardsetPadding: 20,
        cardSizeFactor: 1.0,
        useLayoutTransition: true
      }
    }
  };

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
   * 플러그인 인스턴스 가져오기
   */
  private get plugin() {
    return this.settingsService.getPlugin();
  }

  /**
   * 설정 표시
   */
  displayContent(): void {
    const { containerEl } = this;
    const settings = this.settingsService.getSettings();

    // 섹션 제목
    containerEl.createEl('h3', { text: '프리셋 설정' });
    containerEl.createEl('p', { 
      text: '프리셋 관련 설정을 구성합니다. 프리셋을 정의 및 관리하고 프리셋을 선택할 수 있습니다.',
      cls: 'setting-item-description'
    });

    // 프리셋 선택 설정
    new Setting(containerEl)
      .setName('프리셋 선택')
      .setDesc('미리 정의된 카드 프리셋을 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('default', '기본')
          .addOption('compact', '컴팩트')
          .addOption('detailed', '상세')
          .addOption('modern', '모던')
          .addOption('custom', '사용자 정의');
        
        dropdown.setValue(settings.activePreset || 'default');
        
        dropdown.onChange(async (value) => {
          if (value !== 'custom') {
            await this.applyPreset(value);
          }
          
          await this.settingsService.updateSettings({ activePreset: value });
        });
      });

    // 현재 설정을 프리셋으로 저장 버튼
    new Setting(containerEl)
      .setName('현재 설정을 프리셋으로 저장')
      .setDesc('현재 카드 설정을 사용자 정의 프리셋으로 저장합니다.')
      .addButton(button => button
        .setButtonText('저장')
        .onClick(async () => {
          await this.saveCurrentSettingsAsPreset();
          new Notice('현재 설정이 사용자 정의 프리셋으로 저장되었습니다.');
        }));

    // 설정 내보내기 버튼
    new Setting(containerEl)
      .setName('설정 내보내기')
      .setDesc('현재 카드 설정을 JSON 파일로 내보냅니다.')
      .addButton(button => button
        .setButtonText('내보내기')
        .onClick(() => {
          this.exportCurrentSettings();
        }));

    // 설정 가져오기 버튼
    new Setting(containerEl)
      .setName('설정 가져오기')
      .setDesc('JSON 파일에서 카드 설정을 가져옵니다.')
      .addButton(button => button
        .setButtonText('가져오기')
        .onClick(() => {
          this.importSettings();
        }));
  }

  /**
   * 프리셋 적용
   * @param presetName 프리셋 이름
   */
  private async applyPreset(presetName: string): Promise<void> {
    if (presetName === 'custom' && this.settingsService.getSettings().customPreset) {
      // 사용자 정의 프리셋 적용
      const customPreset = this.settingsService.getSettings().customPreset;
      if (customPreset) {
        for (const [key, value] of Object.entries(customPreset)) {
          await this.applyPresetSetting(key, value);
        }
      }
    } else if (this.presets[presetName]) {
      // 미리 정의된 프리셋 적용
      const preset = this.presets[presetName];
      for (const [key, value] of Object.entries(preset)) {
        await this.applyPresetSetting(key, value);
      }
    }

    // 프리셋 적용 이벤트 발생
    this.eventBus.emit(EventType.SETTINGS_PRESET_APPLIED, {
      presetName,
      settings: this.settingsService.getSettings()
    });
  }

  /**
   * 프리셋 설정 적용
   * @param key 설정 키
   * @param value 설정 값
   */
  private async applyPresetSetting(key: string, value: any): Promise<void> {
    if (key === 'layout' && typeof value === 'object') {
      // layout 객체는 기존 설정과 병합
      await this.settingsService.updateSettings({ 
        layout: { 
          ...this.settingsService.getSettings().layout, 
          ...value 
        } 
      });
    } else {
      // 그 외 설정은 직접 업데이트
      await this.settingsService.updateSettings({ [key]: value });
    }
  }

  /**
   * 현재 설정을 프리셋으로 저장
   */
  private async saveCurrentSettingsAsPreset(): Promise<void> {
    const settings = this.settingsService.getSettings();
    
    // 현재 설정에서 프리셋으로 저장할 설정 추출
    const presetSettings: any = {
      cardWidth: settings.cardWidth,
      cardHeight: settings.cardHeight,
      cardHeaderContent: settings.cardHeaderContent,
      cardBodyContent: settings.cardBodyContent,
      cardFooterContent: settings.cardFooterContent,
      normalCardBorderStyle: settings.normalCardBorderStyle,
      normalCardBorderWidth: settings.normalCardBorderWidth,
      normalCardBorderRadius: settings.normalCardBorderRadius,
      headerBorderStyle: settings.headerBorderStyle,
      headerBorderWidth: settings.headerBorderWidth,
      headerBorderRadius: settings.headerBorderRadius,
      bodyBorderStyle: settings.bodyBorderStyle,
      bodyBorderWidth: settings.bodyBorderWidth,
      bodyBorderRadius: settings.bodyBorderRadius,
      footerBorderStyle: settings.footerBorderStyle,
      footerBorderWidth: settings.footerBorderWidth,
      footerBorderRadius: settings.footerBorderRadius,
      normalCardBgColor: settings.normalCardBgColor,
      headerBgColor: settings.headerBgColor,
      bodyBgColor: settings.bodyBgColor,
      footerBgColor: settings.footerBgColor,
      layout: {
        fixedCardHeight: settings.layout?.fixedCardHeight || false,
        layoutDirectionPreference: settings.layout?.layoutDirectionPreference || 'auto',
        cardThresholdWidth: settings.layout?.cardThresholdWidth || 200,
        cardThresholdHeight: settings.layout?.cardThresholdHeight || 150,
        cardGap: settings.layout?.cardGap || 10,
        cardsetPadding: settings.layout?.cardsetPadding || 10,
        cardSizeFactor: settings.layout?.cardSizeFactor || 1.0,
        useLayoutTransition: settings.layout?.useLayoutTransition !== false
      }
    };

    // 사용자 정의 프리셋으로 저장
    await this.settingsService.updateSettings({ activePreset: 'custom' });
    await this.settingsService.updateSettings({ customPreset: presetSettings });
  }

  /**
   * 현재 설정 내보내기
   */
  private exportCurrentSettings(): void {
    const settings = this.settingsService.getSettings();
    
    // 내보낼 설정 데이터 생성
    const exportData = {
      cardWidth: settings.cardWidth,
      cardHeight: settings.cardHeight,
      cardHeaderContent: settings.cardHeaderContent,
      cardBodyContent: settings.cardBodyContent,
      cardFooterContent: settings.cardFooterContent,
      normalCardBorderStyle: settings.normalCardBorderStyle,
      normalCardBorderWidth: settings.normalCardBorderWidth,
      normalCardBorderRadius: settings.normalCardBorderRadius,
      headerBorderStyle: settings.headerBorderStyle,
      headerBorderWidth: settings.headerBorderWidth,
      headerBorderRadius: settings.headerBorderRadius,
      bodyBorderStyle: settings.bodyBorderStyle,
      bodyBorderWidth: settings.bodyBorderWidth,
      bodyBorderRadius: settings.bodyBorderRadius,
      footerBorderStyle: settings.footerBorderStyle,
      footerBorderWidth: settings.footerBorderWidth,
      footerBorderRadius: settings.footerBorderRadius,
      normalCardBgColor: settings.normalCardBgColor,
      headerBgColor: settings.headerBgColor,
      bodyBgColor: settings.bodyBgColor,
      footerBgColor: settings.footerBgColor,
      layout: {
        fixedCardHeight: settings.layout?.fixedCardHeight || false,
        layoutDirectionPreference: settings.layout?.layoutDirectionPreference || 'auto',
        cardThresholdWidth: settings.layout?.cardThresholdWidth || 200,
        cardThresholdHeight: settings.layout?.cardThresholdHeight || 150,
        cardGap: settings.layout?.cardGap || 10,
        cardsetPadding: settings.layout?.cardsetPadding || 10,
        cardSizeFactor: settings.layout?.cardSizeFactor || 1.0,
        useLayoutTransition: settings.layout?.useLayoutTransition !== false
      }
    };

    // JSON 문자열로 변환
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // 다운로드 링크 생성
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'card-navigator-settings.json';
    
    // 다운로드 링크 클릭
    document.body.appendChild(a);
    a.click();
    
    // 리소스 정리
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * 설정 가져오기
   */
  private importSettings(): void {
    // 파일 입력 요소 생성
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    
    // 파일 선택 이벤트 처리
    fileInput.addEventListener('change', async (event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      
      if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const result = e.target?.result;
            if (typeof result === 'string') {
              // JSON 파싱
              const importedSettings = JSON.parse(result);
              
              // 설정 적용
              for (const [key, value] of Object.entries(importedSettings)) {
                await this.applyPresetSetting(key, value);
              }
              
              // 사용자 정의 프리셋으로 저장
              await this.settingsService.updateSettings({ activePreset: 'custom' });
              await this.settingsService.updateSettings({ customPreset: importedSettings });
              
              new Notice('설정을 성공적으로 가져왔습니다.');
            }
          } catch (error) {
            console.error('설정 가져오기 오류:', error);
            new Notice('설정 가져오기 중 오류가 발생했습니다.');
          }
        };
        
        reader.readAsText(file);
      }
    });
    
    // 파일 선택 다이얼로그 표시
    fileInput.click();
  }
} 