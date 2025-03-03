import { Setting } from 'obsidian';
import { SettingsManager } from '../../../managers/settings/SettingsManager';
import { CardNavigatorSettings } from '../../../core/types/settings.types';

/**
 * 카드 내용 설정 컴포넌트 클래스
 * 카드 내용 관련 설정을 관리하는 컴포넌트입니다.
 */
export class CardContentSettings {
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
   * 카드 내용 설정 컴포넌트 생성자
   * @param containerEl 컨테이너 요소
   * @param settingsManager 설정 관리자
   */
  constructor(containerEl: HTMLElement, settingsManager: SettingsManager) {
    this.containerEl = containerEl;
    this.settingsManager = settingsManager;
    this.settings = settingsManager.getSettings();
  }
  
  /**
   * 카드 내용 설정 컴포넌트 표시
   */
  display(): void {
    const contentSection = this.containerEl.createEl('div', { cls: 'settings-section' });
    
    contentSection.createEl('h3', { text: '카드 내용 설정' });
    
    this.addHeaderSettings(contentSection);
    this.addBodySettings(contentSection);
    this.addFooterSettings(contentSection);
  }
  
  /**
   * 헤더 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addHeaderSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '헤더 설정' });
    
    // 파일명 표시 설정
    new Setting(containerEl)
      .setName('파일명 표시')
      .setDesc('카드 헤더에 파일명을 표시합니다.')
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
    new Setting(containerEl)
      .setName('첫 번째 헤더 표시')
      .setDesc('카드 헤더에 파일의 첫 번째 헤더를 표시합니다.')
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
    
    // 생성 날짜 표시 설정
    new Setting(containerEl)
      .setName('생성 날짜 표시')
      .setDesc('카드 헤더에 파일 생성 날짜를 표시합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.card.showCreatedDate)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              showCreatedDate: value
            });
          });
      });
    
    // 수정 날짜 표시 설정
    new Setting(containerEl)
      .setName('수정 날짜 표시')
      .setDesc('카드 헤더에 파일 수정 날짜를 표시합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.card.showModifiedDate)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              showModifiedDate: value
            });
          });
      });
    
    // 날짜 형식 설정
    new Setting(containerEl)
      .setName('날짜 형식')
      .setDesc('카드에 표시되는 날짜의 형식입니다.')
      .addText(text => {
        text
          .setValue(this.settings.card.dateFormat)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              dateFormat: value
            });
          });
      });
    
    // 헤더 글꼴 크기 설정
    new Setting(containerEl)
      .setName('헤더 글꼴 크기')
      .setDesc('카드 헤더의 글꼴 크기입니다.')
      .addSlider(slider => {
        slider
          .setLimits(10, 24, 1)
          .setValue(this.settings.card.headerFontSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              headerFontSize: value
            });
          });
      });
  }
  
  /**
   * 본문 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addBodySettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '본문 설정' });
    
    // 본문 표시 설정
    new Setting(containerEl)
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
    new Setting(containerEl)
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
    new Setting(containerEl)
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
      })
      .setDisabled(!this.settings.card.bodyLengthLimit);
    
    // 마크다운 렌더링 설정
    new Setting(containerEl)
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
    
    // 이미지 표시 설정
    new Setting(containerEl)
      .setName('이미지 표시')
      .setDesc('카드 본문에 이미지를 표시합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.card.showImages)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              showImages: value
            });
          });
      });
    
    // 이미지 최대 높이 설정
    new Setting(containerEl)
      .setName('이미지 최대 높이')
      .setDesc('카드에 표시되는 이미지의 최대 높이입니다.')
      .addSlider(slider => {
        slider
          .setLimits(50, 300, 50)
          .setValue(this.settings.card.maxImageHeight)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              maxImageHeight: value
            });
          });
      })
      .setDisabled(!this.settings.card.showImages);
    
    // 본문 글꼴 크기 설정
    new Setting(containerEl)
      .setName('본문 글꼴 크기')
      .setDesc('카드 본문의 글꼴 크기입니다.')
      .addSlider(slider => {
        slider
          .setLimits(10, 20, 1)
          .setValue(this.settings.card.bodyFontSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              bodyFontSize: value
            });
          });
      });
  }
  
  /**
   * 푸터 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addFooterSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '푸터 설정' });
    
    // 태그 표시 설정
    new Setting(containerEl)
      .setName('태그 표시')
      .setDesc('카드 푸터에 파일의 태그를 표시합니다.')
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
    
    // 태그 색상 사용 설정
    new Setting(containerEl)
      .setName('태그 색상 사용')
      .setDesc('태그에 색상을 적용합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.card.useTagColors)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              useTagColors: value
            });
          });
      });
    
    // 태그 글꼴 크기 설정
    new Setting(containerEl)
      .setName('태그 글꼴 크기')
      .setDesc('카드 태그의 글꼴 크기입니다.')
      .addSlider(slider => {
        slider
          .setLimits(8, 16, 1)
          .setValue(this.settings.card.tagFontSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('card', {
              ...this.settings.card,
              tagFontSize: value
            });
          });
      });
  }
} 