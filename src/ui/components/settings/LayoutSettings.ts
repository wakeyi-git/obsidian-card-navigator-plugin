import { Setting } from 'obsidian';
import { SettingsManager } from '../../../managers/settings/SettingsManager';
import { CardNavigatorSettings } from '../../../core/types/settings.types';
import { LayoutType } from '../../../core/types/layout.types';

/**
 * 레이아웃 설정 컴포넌트 클래스
 * 레이아웃 관련 설정을 관리하는 컴포넌트입니다.
 */
export class LayoutSettings {
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
   * 레이아웃 설정 컴포넌트 생성자
   * @param containerEl 컨테이너 요소
   * @param settingsManager 설정 관리자
   */
  constructor(containerEl: HTMLElement, settingsManager: SettingsManager) {
    this.containerEl = containerEl;
    this.settingsManager = settingsManager;
    this.settings = settingsManager.getSettings();
  }
  
  /**
   * 레이아웃 설정 컴포넌트 표시
   */
  display(): void {
    const layoutSection = this.containerEl.createEl('div', { cls: 'settings-section' });
    
    layoutSection.createEl('h3', { text: '레이아웃 설정' });
    
    this.addLayoutTypeSettings(layoutSection);
    this.addCardSizeSettings(layoutSection);
    this.addCardSpacingSettings(layoutSection);
    this.addScrollSettings(layoutSection);
  }
  
  /**
   * 레이아웃 타입 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addLayoutTypeSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '레이아웃 타입' });
    
    // 레이아웃 타입 설정
    new Setting(containerEl)
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
            
            // 레이아웃 타입에 따라 관련 설정 활성화/비활성화
            this.updateLayoutDependentSettings();
          });
      });
    
    // 자동 레이아웃 방향 설정
    new Setting(containerEl)
      .setName('자동 레이아웃 방향')
      .setDesc('컨테이너 크기에 따라 자동으로 수직/수평 방향을 결정합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.layout.autoDirection)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('layout', {
              ...this.settings.layout,
              autoDirection: value
            });
            
            // 자동 방향 설정에 따라 관련 설정 활성화/비활성화
            this.updateDirectionDependentSettings();
          });
      });
    
    // 레이아웃 방향 설정
    new Setting(containerEl)
      .setName('레이아웃 방향')
      .setDesc('카드 배치 방향입니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('vertical', '수직')
          .addOption('horizontal', '수평')
          .setValue(this.settings.layout.direction)
          .onChange(async (value: any) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('layout', {
              ...this.settings.layout,
              direction: value
            });
          });
      })
      .setDisabled(this.settings.layout.autoDirection);
  }
  
  /**
   * 카드 크기 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addCardSizeSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '카드 크기' });
    
    // 카드 너비 임계값 설정
    new Setting(containerEl)
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
    new Setting(containerEl)
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
            
            // 카드 높이 정렬 설정에 따라 관련 설정 활성화/비활성화
            this.updateHeightDependentSettings();
          });
      });
    
    // 고정 높이 사용 설정
    new Setting(containerEl)
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
            
            // 고정 높이 사용 설정에 따라 관련 설정 활성화/비활성화
            this.updateFixedHeightDependentSettings();
          });
      })
      .setDisabled(!this.settings.layout.alignCardHeight);
    
    // 고정 카드 높이 설정
    new Setting(containerEl)
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
      })
      .setDisabled(!this.settings.layout.alignCardHeight || !this.settings.layout.useFixedHeight);
    
    // 뷰당 카드 수 설정
    new Setting(containerEl)
      .setName('뷰당 카드 수')
      .setDesc('뷰포트에 표시할 카드 수입니다. 고정 높이 대신 사용됩니다.')
      .addSlider(slider => {
        slider
          .setLimits(1, 20, 1)
          .setValue(this.settings.layout.cardsPerView)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('layout', {
              ...this.settings.layout,
              cardsPerView: value
            });
          });
      })
      .setDisabled(!this.settings.layout.alignCardHeight || this.settings.layout.useFixedHeight);
  }
  
  /**
   * 카드 간격 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addCardSpacingSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '카드 간격' });
    
    // 카드 간 간격 설정
    new Setting(containerEl)
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
    
    // 카드 컨테이너 패딩 설정
    new Setting(containerEl)
      .setName('카드 컨테이너 패딩')
      .setDesc('카드 컨테이너의 패딩입니다.')
      .addSlider(slider => {
        slider
          .setLimits(0, 50, 5)
          .setValue(this.settings.layout.containerPadding)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('layout', {
              ...this.settings.layout,
              containerPadding: value
            });
          });
      });
  }
  
  /**
   * 스크롤 설정 추가
   * @param containerEl 컨테이너 요소
   */
  private addScrollSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h4', { text: '스크롤 설정' });
    
    // 부드러운 스크롤 사용 설정
    new Setting(containerEl)
      .setName('부드러운 스크롤 사용')
      .setDesc('부드러운 스크롤 효과를 사용합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.layout.useSmoothScroll)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('layout', {
              ...this.settings.layout,
              useSmoothScroll: value
            });
          });
      });
    
    // 스크롤 속도 설정
    new Setting(containerEl)
      .setName('스크롤 속도')
      .setDesc('부드러운 스크롤의 속도입니다.')
      .addSlider(slider => {
        slider
          .setLimits(100, 1000, 100)
          .setValue(this.settings.layout.scrollSpeed)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('layout', {
              ...this.settings.layout,
              scrollSpeed: value
            });
          });
      })
      .setDisabled(!this.settings.layout.useSmoothScroll);
    
    // 무한 스크롤 사용 설정
    new Setting(containerEl)
      .setName('무한 스크롤 사용')
      .setDesc('스크롤 시 카드를 점진적으로 로드합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.layout.useInfiniteScroll)
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('layout', {
              ...this.settings.layout,
              useInfiniteScroll: value
            });
          });
      });
    
    // 페이지당 카드 수 설정
    new Setting(containerEl)
      .setName('페이지당 카드 수')
      .setDesc('무한 스크롤 시 한 번에 로드할 카드 수입니다.')
      .addSlider(slider => {
        slider
          .setLimits(10, 100, 10)
          .setValue(this.settings.layout.cardsPerPage)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // 설정 업데이트
            await this.settingsManager.setSetting('layout', {
              ...this.settings.layout,
              cardsPerPage: value
            });
          });
      })
      .setDisabled(!this.settings.layout.useInfiniteScroll);
  }
  
  /**
   * 레이아웃 타입에 따라 관련 설정 활성화/비활성화
   */
  private updateLayoutDependentSettings(): void {
    // 레이아웃 타입에 따라 설정 업데이트
    const layoutType = this.settings.layout.type;
    
    // 메이슨리 레이아웃인 경우 카드 높이 정렬 설정 비활성화
    if (layoutType === 'masonry') {
      this.settingsManager.setSetting('layout', {
        ...this.settings.layout,
        alignCardHeight: false
      });
    }
    
    // 그리드 레이아웃인 경우 카드 높이 정렬 설정 활성화
    if (layoutType === 'grid') {
      this.settingsManager.setSetting('layout', {
        ...this.settings.layout,
        alignCardHeight: true
      });
    }
    
    // 리스트 레이아웃인 경우 카드 높이 정렬 설정 비활성화
    if (layoutType === 'list') {
      this.settingsManager.setSetting('layout', {
        ...this.settings.layout,
        alignCardHeight: false
      });
    }
    
    // 설정 업데이트 후 다시 표시
    this.display();
  }
  
  /**
   * 자동 방향 설정에 따라 관련 설정 활성화/비활성화
   */
  private updateDirectionDependentSettings(): void {
    // 설정 업데이트 후 다시 표시
    this.display();
  }
  
  /**
   * 카드 높이 정렬 설정에 따라 관련 설정 활성화/비활성화
   */
  private updateHeightDependentSettings(): void {
    // 카드 높이 정렬이 비활성화된 경우 고정 높이 사용 설정 비활성화
    if (!this.settings.layout.alignCardHeight) {
      this.settingsManager.setSetting('layout', {
        ...this.settings.layout,
        useFixedHeight: false
      });
    }
    
    // 설정 업데이트 후 다시 표시
    this.display();
  }
  
  /**
   * 고정 높이 사용 설정에 따라 관련 설정 활성화/비활성화
   */
  private updateFixedHeightDependentSettings(): void {
    // 설정 업데이트 후 다시 표시
    this.display();
  }
} 