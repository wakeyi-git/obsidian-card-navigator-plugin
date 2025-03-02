import { Setting } from 'obsidian';
import { SettingsManager } from '../../../managers/settings/SettingsManager';
import { CardNavigatorSettings } from '../../../core/types/settings.types';

/**
 * 카드 스타일 설정 컴포넌트 클래스
 * 카드 스타일 관련 설정을 관리하는 컴포넌트입니다.
 */
export class CardStyleSettings {
  /**
   * 설정 관리자
   */
  private settingsManager: SettingsManager;
  
  /**
   * 현재 설정
   */
  private settings: CardNavigatorSettings;
  
  /**
   * 컨테이너 요소
   */
  private containerEl: HTMLElement;
  
  /**
   * 카드 스타일 설정 컴포넌트 생성자
   * @param containerEl 컨테이너 요소
   * @param settingsManager 설정 관리자
   */
  constructor(containerEl: HTMLElement, settingsManager: SettingsManager) {
    this.containerEl = containerEl;
    this.settingsManager = settingsManager;
    this.settings = settingsManager.getSettings();
  }
  
  /**
   * 카드 스타일 설정 컴포넌트 표시
   */
  display(): void {
    const styleSection = this.containerEl.createEl('div', { cls: 'settings-section' });
    
    styleSection.createEl('h3', { text: '카드 스타일 설정' });
    
    this.addCardAppearanceSettings(styleSection);
    this.addCardBorderSettings(styleSection);
    this.addCardColorSettings(styleSection);
  }
  
  /**
   * 카드 외관 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addCardAppearanceSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '카드 외관' });
    
    // 카드 패딩 설정
    new Setting(containerEl)
      .setName('카드 패딩')
      .setDesc('카드 내부의 여백입니다.')
      .addSlider(slider => {
        slider
          .setLimits(5, 30, 5)
          .setValue(this.settings.style.cardPadding)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              cardPadding: value
            });
          });
      });
    
    // 카드 그림자 사용 설정
    new Setting(containerEl)
      .setName('카드 그림자 사용')
      .setDesc('카드에 그림자 효과를 적용합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.style.useShadow)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              useShadow: value
            });
          });
      });
    
    // 카드 그림자 강도 설정
    new Setting(containerEl)
      .setName('카드 그림자 강도')
      .setDesc('카드 그림자의 강도입니다.')
      .addSlider(slider => {
        slider
          .setLimits(1, 10, 1)
          .setValue(this.settings.style.shadowIntensity)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              shadowIntensity: value
            });
          });
      })
      .setDisabled(!this.settings.style.useShadow);
    
    // 카드 호버 효과 사용 설정
    new Setting(containerEl)
      .setName('카드 호버 효과 사용')
      .setDesc('마우스를 올렸을 때 카드에 효과를 적용합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.style.useHoverEffect)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              useHoverEffect: value
            });
          });
      });
    
    // 카드 호버 효과 타입 설정
    new Setting(containerEl)
      .setName('카드 호버 효과 타입')
      .setDesc('마우스를 올렸을 때 적용할 효과 타입입니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('scale', '확대')
          .addOption('elevate', '들어올림')
          .addOption('highlight', '강조')
          .setValue(this.settings.style.hoverEffectType)
          .onChange(async (value: any) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              hoverEffectType: value
            });
          });
      })
      .setDisabled(!this.settings.style.useHoverEffect);
  }
  
  /**
   * 카드 테두리 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addCardBorderSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '카드 테두리' });
    
    // 카드 테두리 사용 설정
    new Setting(containerEl)
      .setName('카드 테두리 사용')
      .setDesc('카드에 테두리를 적용합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.style.useBorder)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              useBorder: value
            });
          });
      });
    
    // 카드 테두리 두께 설정
    new Setting(containerEl)
      .setName('카드 테두리 두께')
      .setDesc('카드 테두리의 두께입니다.')
      .addSlider(slider => {
        slider
          .setLimits(1, 5, 1)
          .setValue(this.settings.style.borderWidth)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              borderWidth: value
            });
          });
      })
      .setDisabled(!this.settings.style.useBorder);
    
    // 카드 테두리 색상 설정
    new Setting(containerEl)
      .setName('카드 테두리 색상')
      .setDesc('카드 테두리의 색상입니다. 비워두면 테마 색상을 사용합니다.')
      .addText(text => {
        text
          .setPlaceholder('예: #cccccc 또는 비워두기')
          .setValue(this.settings.style.borderColor || '')
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              borderColor: value || null
            });
          });
      })
      .setDisabled(!this.settings.style.useBorder);
    
    // 카드 테두리 모서리 둥글기 설정
    new Setting(containerEl)
      .setName('카드 테두리 모서리 둥글기')
      .setDesc('카드 테두리 모서리의 둥글기입니다.')
      .addSlider(slider => {
        slider
          .setLimits(0, 20, 2)
          .setValue(this.settings.style.borderRadius)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              borderRadius: value
            });
          });
      });
  }
  
  /**
   * 카드 색상 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addCardColorSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '카드 색상' });
    
    // 카드 배경색 사용 설정
    new Setting(containerEl)
      .setName('카드 배경색 사용')
      .setDesc('카드에 사용자 정의 배경색을 적용합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.style.useCustomBackgroundColor)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              useCustomBackgroundColor: value
            });
          });
      });
    
    // 카드 배경색 설정
    new Setting(containerEl)
      .setName('카드 배경색')
      .setDesc('카드의 배경색입니다. 비워두면 테마 색상을 사용합니다.')
      .addText(text => {
        text
          .setPlaceholder('예: #f5f5f5 또는 비워두기')
          .setValue(this.settings.style.backgroundColor || '')
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              backgroundColor: value || null
            });
          });
      })
      .setDisabled(!this.settings.style.useCustomBackgroundColor);
    
    // 카드 텍스트 색상 사용 설정
    new Setting(containerEl)
      .setName('카드 텍스트 색상 사용')
      .setDesc('카드에 사용자 정의 텍스트 색상을 적용합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.style.useCustomTextColor)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              useCustomTextColor: value
            });
          });
      });
    
    // 카드 텍스트 색상 설정
    new Setting(containerEl)
      .setName('카드 텍스트 색상')
      .setDesc('카드의 텍스트 색상입니다. 비워두면 테마 색상을 사용합니다.')
      .addText(text => {
        text
          .setPlaceholder('예: #333333 또는 비워두기')
          .setValue(this.settings.style.textColor || '')
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              textColor: value || null
            });
          });
      })
      .setDisabled(!this.settings.style.useCustomTextColor);
    
    // 태그 기반 카드 색상 사용 설정
    new Setting(containerEl)
      .setName('태그 기반 카드 색상 사용')
      .setDesc('태그에 따라 카드 색상을 자동으로 지정합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.style.useTagBasedCardColors)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              useTagBasedCardColors: value
            });
          });
      });
    
    // 태그 색상 매핑 설정
    new Setting(containerEl)
      .setName('태그 색상 매핑')
      .setDesc('태그와 색상의 매핑을 설정합니다. 형식: 태그:색상,태그:색상')
      .addTextArea(textarea => {
        textarea
          .setPlaceholder('예: project:#e6f7ff,urgent:#fff1f0')
          .setValue(this.formatTagColorMapping(this.settings.style.tagColorMapping))
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('style', {
              ...this.settings.style,
              tagColorMapping: this.parseTagColorMapping(value)
            });
          });
        
        // 텍스트 영역 높이 조정
        textarea.inputEl.rows = 4;
      })
      .setDisabled(!this.settings.style.useTagBasedCardColors);
  }
  
  /**
   * 태그 색상 매핑을 문자열로 포맷팅
   * @param mapping 태그 색상 매핑 객체
   * @returns 포맷팅된 문자열
   */
  private formatTagColorMapping(mapping: Record<string, string> | null): string {
    if (!mapping) return '';
    
    return Object.entries(mapping)
      .map(([tag, color]) => `${tag}:${color}`)
      .join(',');
  }
  
  /**
   * 문자열에서 태그 색상 매핑 파싱
   * @param value 포맷팅된 문자열
   * @returns 태그 색상 매핑 객체
   */
  private parseTagColorMapping(value: string): Record<string, string> {
    if (!value) return {};
    
    const mapping: Record<string, string> = {};
    
    value.split(',').forEach(pair => {
      const [tag, color] = pair.split(':');
      if (tag && color) {
        mapping[tag.trim()] = color.trim();
      }
    });
    
    return mapping;
  }
} 