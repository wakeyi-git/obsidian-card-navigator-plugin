import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { CardPreview } from '../components/CardPreview';
import { 
  ICardStateStyle,
  ICardDisplayOptions,
  ICardSection,
  RenderType,
  IRenderConfig,
  DEFAULT_CARD_DOMAIN_SETTINGS,
  DEFAULT_CARD_SECTION,
  DEFAULT_CARD_STYLE
} from '@/domain/models/Card';
import { ICardDisplayManager } from '@/domain/managers/ICardDisplayManager';
import { Container } from '@/infrastructure/di/Container';
import type { ISettingsService } from '@/domain/services/application/ISettingsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { IPluginSettings } from '@/domain/models/PluginSettings';

type SectionType = 'card' | 'header' | 'body' | 'footer';

/**
 * 카드 설정 섹션
 */
export class CardSettingsSection {
  private cardPreview: CardPreview | null = null;
  private styleSettingsEl: HTMLElement;
  private displaySettingsEl: HTMLElement;
  private containerEl: HTMLElement;
  private contentLengthLimitSlider: Setting | null = null;
  private styleSettingsTitle: HTMLElement;
  private displaySettingsTitle: HTMLElement;
  private cardDisplayManager: ICardDisplayManager;
  private settingsService: ISettingsService;
  private eventDispatcher: IEventDispatcher;
  private selectedSection: SectionType = 'card';

  constructor(private plugin: CardNavigatorPlugin, eventDispatcher: IEventDispatcher) {
    const container = Container.getInstance();
    this.cardDisplayManager = container.resolve<ICardDisplayManager>('ICardDisplayManager');
    this.settingsService = container.resolve<ISettingsService>('ISettingsService');
    this.eventDispatcher = eventDispatcher;
  }

  /**
   * 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    try {
      console.log('카드 설정 섹션 생성 시작');
      
      // 이전 상태 정리
      this.cleanup();
      
      this.containerEl = containerEl;
      
      // 카드 설정 제목
      containerEl.createEl('h3', { text: '카드 설정' });

      // 렌더링 설정
      this.createRenderSettings();

      // 카드 프리뷰 생성
      this.createPreview();

      // 스타일 설정
      this.styleSettingsTitle = containerEl.createEl('h4', { text: '카드 스타일 설정' });
      this.styleSettingsEl = containerEl.createDiv('style-settings');

      // 표시 항목 설정
      this.displaySettingsTitle = containerEl.createEl('h4', { text: '표시 항목 설정' });
      this.displaySettingsEl = containerEl.createDiv('display-settings');

      // 초기 화면에서 카드 영역이 선택되어 있을 때는 표시 항목 설정 타이틀 숨김
      this.displaySettingsTitle.style.display = 'none';

      // 선택된 섹션에 따른 스타일 설정
      this.createStyleSettings();
      this.updateDisplaySettings(this.selectedSection);

      console.log('카드 설정 섹션 생성 완료', {
        cardPreviewCreated: !!this.cardPreview,
        renderConfig: this.getRenderConfig(),
        settings: this.settingsService.getSettings()
      });
    } catch (error) {
      console.error('카드 설정 섹션 생성 중 오류 발생:', error);
      
      if (containerEl) {
        const errorEl = containerEl.createDiv('error-message');
        errorEl.style.color = 'var(--text-error)';
        errorEl.style.padding = '20px';
        errorEl.textContent = '설정을 로드하는 중 오류가 발생했습니다.';
      }
    }
  }

  /**
   * 렌더링 설정 생성
   */
  private createRenderSettings(): void {
    const settings = this.settingsService.getSettings();
    const renderConfig = settings.card.renderConfig;
    
    // 마크다운 렌더링
    new Setting(this.containerEl)
      .setName('HTML 렌더링')
      .setDesc('마크다운을 HTML로 렌더링합니다. 비활성화하면 일반 텍스트로 표시됩니다.')
      .addToggle(toggle =>
        toggle
          .setValue(renderConfig.type === RenderType.MARKDOWN)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...settings.card,
                renderConfig: {
                  ...renderConfig,
                  type: value ? RenderType.MARKDOWN : RenderType.TEXT
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 본문 길이 제한
    new Setting(this.containerEl)
      .setName('본문 길이 제한')
      .setDesc('본문의 길이를 제한합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(renderConfig.contentLengthLimitEnabled)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...settings.card,
                renderConfig: {
                  ...renderConfig,
                  contentLengthLimitEnabled: value
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
            this.updateContentLengthLimitSlider();
          }));

    // 본문 길이 제한 값 설정
    this.contentLengthLimitSlider = new Setting(this.containerEl)
      .setName('본문 길이 제한 값')
      .setDesc('표시할 본문의 최대 길이를 설정합니다.')
      .addSlider(slider => {
        slider
          .setValue(renderConfig.contentLengthLimit)
          .setLimits(50, 1000, 50)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...settings.card,
                renderConfig: {
                  ...renderConfig,
                  contentLengthLimit: value
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          });
      });

    // 초기 상태 설정
    this.updateContentLengthLimitSlider();

    // 구분선
    new Setting(this.containerEl)
      .setName('')
      .setDesc('')
      .setClass('setting-item-separator');
  }

  /**
   * 본문 길이 제한 슬라이더 업데이트
   */
  private updateContentLengthLimitSlider(): void {
    if (this.contentLengthLimitSlider) {
      const settings = this.settingsService.getSettings();
      this.contentLengthLimitSlider.settingEl.style.display = 
        settings.card.renderConfig.contentLengthLimitEnabled ? 'flex' : 'none';
    }
  }

  /**
   * 렌더링 설정 가져오기
   */
  private getRenderConfig(): IRenderConfig {
    const settings = this.settingsService.getSettings();
    return settings.card.renderConfig;
  }

  /**
   * 카드 생성 설정 생성
   */
  private createCardConfig(settings: IPluginSettings): {
    cardStateStyle: ICardStateStyle;
    cardDisplayOptions?: ICardDisplayOptions;
    cardSections: {
      header: ICardSection;
      body: ICardSection;
      footer: ICardSection;
    };
    cardRenderConfig: IRenderConfig;
  } {
    const cardSettings = settings.card || DEFAULT_CARD_DOMAIN_SETTINGS;
    return {
      cardStateStyle: cardSettings.stateStyle,
      cardSections: cardSettings.sections,
      cardRenderConfig: cardSettings.renderConfig
    };
  }

  /**
   * 스타일 설정 생성
   */
  private createStyleSettings(): void {
    const settings = this.settingsService.getSettings();
    const cardSettings = settings.card || DEFAULT_CARD_DOMAIN_SETTINGS;

    if (this.selectedSection === 'card') {
      // 카드 상태별 스타일 설정
      this.createCardStateStyleSettings();
    } else {
      // 섹션별 스타일 설정
      this.createSectionStyleSettings(this.selectedSection);
    }
  }

  /**
   * 카드 상태별 스타일 설정 생성
   */
  private createCardStateStyleSettings(): void {
    const settings = this.settingsService.getSettings();
    const cardSettings = settings.card || DEFAULT_CARD_DOMAIN_SETTINGS;
    const stateStyle = cardSettings.stateStyle;

    // 일반 상태 스타일
    new Setting(this.styleSettingsEl)
      .setName('일반 상태 스타일')
      .setHeading();

    // 배경색 설정
    new Setting(this.styleSettingsEl)
      .setName('배경색')
      .setDesc('일반 상태의 배경색을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(stateStyle.normal.backgroundColor)
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                stateStyle: {
                  ...stateStyle,
                  normal: {
                    ...stateStyle.normal,
                    backgroundColor: value
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 폰트 크기 설정
    new Setting(this.styleSettingsEl)
      .setName('폰트 크기')
      .setDesc('일반 상태의 폰트 크기를 설정합니다.')
      .addSlider(slider => {
        const value = parseInt(stateStyle.normal.fontSize);
        slider
          .setValue(value)
          .setLimits(8, 24, 1)
          .setDynamicTooltip()
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                stateStyle: {
                  ...stateStyle,
                  normal: {
                    ...stateStyle.normal,
                    fontSize: `${value}px`
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          });
      });

    // 테두리 색상 설정
    new Setting(this.styleSettingsEl)
      .setName('테두리 색상')
      .setDesc('일반 상태의 테두리 색상을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(stateStyle.normal.border.color)
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                stateStyle: {
                  ...stateStyle,
                  normal: {
                    ...stateStyle.normal,
                    border: {
                      ...stateStyle.normal.border,
                      color: value
                    }
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 테두리 두께 설정
    new Setting(this.styleSettingsEl)
      .setName('테두리 두께')
      .setDesc('일반 상태의 테두리 두께를 설정합니다.')
      .addSlider(slider => {
        const value = parseInt(stateStyle.normal.border.width);
        slider
          .setValue(value)
          .setLimits(0, 4, 1)
          .setDynamicTooltip()
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                stateStyle: {
                  ...stateStyle,
                  normal: {
                    ...stateStyle.normal,
                    border: {
                      ...stateStyle.normal.border,
                      width: `${value}px`
                    }
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          });
      });

    // 활성 상태 스타일
    new Setting(this.styleSettingsEl)
      .setName('활성 상태 스타일')
      .setHeading();

    // 배경색 설정
    new Setting(this.styleSettingsEl)
      .setName('배경색')
      .setDesc('활성 상태의 배경색을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(stateStyle.active.backgroundColor)
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                stateStyle: {
                  ...stateStyle,
                  active: {
                    ...stateStyle.active,
                    backgroundColor: value
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 폰트 크기 설정
    new Setting(this.styleSettingsEl)
      .setName('폰트 크기')
      .setDesc('활성 상태의 폰트 크기를 설정합니다.')
      .addSlider(slider => {
        const value = parseInt(stateStyle.active.fontSize);
        slider
          .setValue(value)
          .setLimits(8, 24, 1)
          .setDynamicTooltip()
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                stateStyle: {
                  ...stateStyle,
                  active: {
                    ...stateStyle.active,
                    fontSize: `${value}px`
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          });
      });

    // 테두리 색상 설정
    new Setting(this.styleSettingsEl)
      .setName('테두리 색상')
      .setDesc('활성 상태의 테두리 색상을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(stateStyle.active.border.color)
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                stateStyle: {
                  ...stateStyle,
                  active: {
                    ...stateStyle.active,
                    border: {
                      ...stateStyle.active.border,
                      color: value
                    }
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 테두리 두께 설정
    new Setting(this.styleSettingsEl)
      .setName('테두리 두께')
      .setDesc('활성 상태의 테두리 두께를 설정합니다.')
      .addSlider(slider => {
        const value = parseInt(stateStyle.active.border.width);
        slider
          .setValue(value)
          .setLimits(0, 4, 1)
          .setDynamicTooltip()
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                stateStyle: {
                  ...stateStyle,
                  active: {
                    ...stateStyle.active,
                    border: {
                      ...stateStyle.active.border,
                      width: `${value}px`
                    }
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          });
      });

    // 포커스 상태 스타일
    new Setting(this.styleSettingsEl)
      .setName('포커스 상태 스타일')
      .setHeading();

    // 배경색 설정
    new Setting(this.styleSettingsEl)
      .setName('배경색')
      .setDesc('포커스 상태의 배경색을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(stateStyle.focused.backgroundColor)
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                stateStyle: {
                  ...stateStyle,
                  focused: {
                    ...stateStyle.focused,
                    backgroundColor: value
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 폰트 크기 설정
    new Setting(this.styleSettingsEl)
      .setName('폰트 크기')
      .setDesc('포커스 상태의 폰트 크기를 설정합니다.')
      .addSlider(slider => {
        const value = parseInt(stateStyle.focused.fontSize);
        slider
          .setValue(value)
          .setLimits(8, 24, 1)
          .setDynamicTooltip()
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                stateStyle: {
                  ...stateStyle,
                  focused: {
                    ...stateStyle.focused,
                    fontSize: `${value}px`
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          });
      });

    // 테두리 색상 설정
    new Setting(this.styleSettingsEl)
      .setName('테두리 색상')
      .setDesc('포커스 상태의 테두리 색상을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(stateStyle.focused.border.color)
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                stateStyle: {
                  ...stateStyle,
                  focused: {
                    ...stateStyle.focused,
                    border: {
                      ...stateStyle.focused.border,
                      color: value
                    }
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 테두리 두께 설정
    new Setting(this.styleSettingsEl)
      .setName('테두리 두께')
      .setDesc('포커스 상태의 테두리 두께를 설정합니다.')
      .addSlider(slider => {
        const value = parseInt(stateStyle.focused.border.width);
        slider
          .setValue(value)
          .setLimits(0, 4, 1)
          .setDynamicTooltip()
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                stateStyle: {
                  ...stateStyle,
                  focused: {
                    ...stateStyle.focused,
                    border: {
                      ...stateStyle.focused.border,
                      width: `${value}px`
                    }
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          });
      });
  }

  /**
   * 섹션별 스타일 설정 생성
   */
  private createSectionStyleSettings(section: 'header' | 'body' | 'footer'): void {
    const settings = this.settingsService.getSettings();
    const cardSettings = settings.card || DEFAULT_CARD_DOMAIN_SETTINGS;
    const sectionSettings = cardSettings.sections[section];
    const style = sectionSettings.style || DEFAULT_CARD_STYLE;

    // 배경색 설정
    new Setting(this.styleSettingsEl)
      .setName('배경색')
      .setDesc('배경색을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(style.backgroundColor)
          .onChange(async value => {
            const newStyle = {
              ...style,
              backgroundColor: value
            };
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                sections: {
                  ...cardSettings.sections,
                  [section]: {
                    ...sectionSettings,
                    style: newStyle
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 폰트 크기 설정
    new Setting(this.styleSettingsEl)
      .setName('폰트 크기')
      .setDesc('폰트 크기를 설정합니다.')
      .addSlider(slider => {
        const value = parseInt(style.fontSize);
        slider
          .setValue(value)
          .setLimits(8, 24, 1)
          .setDynamicTooltip()
          .onChange(async value => {
            const newStyle = {
              ...style,
              fontSize: `${value}px`
            };
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                sections: {
                  ...cardSettings.sections,
                  [section]: {
                    ...sectionSettings,
                    style: newStyle
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          });
      });

    // 테두리 색상 설정
    new Setting(this.styleSettingsEl)
      .setName('테두리 색상')
      .setDesc('테두리 색상을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(style.border.color)
          .onChange(async value => {
            const newStyle = {
              ...style,
              border: {
                ...style.border,
                color: value
              }
            };
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                sections: {
                  ...cardSettings.sections,
                  [section]: {
                    ...sectionSettings,
                    style: newStyle
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 테두리 두께 설정
    new Setting(this.styleSettingsEl)
      .setName('테두리 두께')
      .setDesc('테두리 두께를 설정합니다.')
      .addSlider(slider => {
        const value = parseInt(style.border.width);
        slider
          .setValue(value)
          .setLimits(0, 4, 1)
          .setDynamicTooltip()
          .onChange(async value => {
            const newStyle = {
              ...style,
              border: {
                ...style.border,
                width: `${value}px`
              }
            };
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                sections: {
                  ...cardSettings.sections,
                  [section]: {
                    ...sectionSettings,
                    style: newStyle
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          });
      });
  }

  /**
   * 카드 프리뷰 생성
   */
  private createPreview(): void {
    const previewContainer = this.containerEl.createDiv('card-preview-container');
    previewContainer.style.margin = '20px 0';
    previewContainer.style.padding = '20px';
    previewContainer.style.backgroundColor = 'var(--background-secondary)';
    previewContainer.style.borderRadius = '8px';
    previewContainer.style.minHeight = '200px';
    previewContainer.style.display = 'flex';
    previewContainer.style.justifyContent = 'center';
    previewContainer.style.alignItems = 'center';
    previewContainer.style.position = 'relative';

    try {
      const settings = this.settingsService.getSettings();
      const cardConfig = this.createCardConfig(settings);
      
      // 새로운 카드 프리뷰 생성
      this.cardPreview = new CardPreview(previewContainer, cardConfig);
      
      // 섹션 클릭 이벤트 핸들러 등록
      previewContainer.addEventListener('section-click', ((event: CustomEvent) => {
        const { section } = event.detail;
        this.selectedSection = section as SectionType;
        this.updateStyleSettings(section as SectionType);
        this.updateDisplaySettings(section as SectionType);
      }) as EventListener);
      
      console.log('카드 프리뷰 생성 성공');
    } catch (error) {
      console.error('카드 프리뷰 생성 실패:', error);
      
      const errorEl = previewContainer.createDiv('card-preview-error');
      errorEl.style.color = 'var(--text-error)';
      errorEl.style.padding = '20px';
      errorEl.style.textAlign = 'center';
      errorEl.textContent = '카드 프리뷰를 생성할 수 없습니다. 설정을 확인해 주세요.';
    }
  }

  /**
   * 스타일 설정 업데이트
   */
  private updateStyleSettings(section: SectionType): void {
    // 스타일 설정 영역 초기화
    this.styleSettingsEl.empty();
    
    // 스타일 설정 제목 업데이트
    if (section === 'card') {
      this.styleSettingsTitle.textContent = '카드 스타일 설정';
    } else {
      this.styleSettingsTitle.textContent = `${this.getSectionName(section)} 스타일 설정`;
    }
    
    // 선택된 섹션에 따른 스타일 설정 생성
    if (section === 'card') {
      // 카드 상태별 스타일 설정
      this.createCardStateStyleSettings();
    } else {
      // 섹션별 스타일 설정
      this.createSectionStyleSettings(section as 'header' | 'body' | 'footer');
    }
  }

  /**
   * 표시 항목 설정 업데이트
   */
  private updateDisplaySettings(section: SectionType): void {
    // 표시 항목 설정 영역 초기화
    this.displaySettingsEl.empty();
    
    // 표시 항목 설정 제목 업데이트
    if (section === 'card') {
      this.displaySettingsTitle.style.display = 'none';
    } else {
      this.displaySettingsTitle.style.display = 'block';
      this.displaySettingsTitle.textContent = `${this.getSectionName(section)} 표시 항목 설정`;
    }
    
    // 선택된 섹션에 따른 표시 항목 설정 생성
    if (section !== 'card') {
      this.createDisplaySettings(section as 'header' | 'body' | 'footer');
    }
  }

  /**
   * 섹션 이름 가져오기
   */
  private getSectionName(section: SectionType): string {
    switch (section) {
      case 'header':
        return '헤더';
      case 'body':
        return '바디';
      case 'footer':
        return '풋터';
      default:
        return '카드';
    }
  }

  /**
   * 표시 항목 설정 생성
   */
  private createDisplaySettings(section: 'header' | 'body' | 'footer'): void {
    const settings = this.settingsService.getSettings();
    const cardSettings = settings.card || DEFAULT_CARD_DOMAIN_SETTINGS;
    const sectionSettings = cardSettings.sections[section];
    const displayOptions = sectionSettings.displayOptions;

    // 파일명 표시 설정
    new Setting(this.displaySettingsEl)
      .setName('제목')
      .setDesc('제목을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showTitle)
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                sections: {
                  ...cardSettings.sections,
                  [section]: {
                    ...sectionSettings,
                    displayOptions: {
                      ...displayOptions,
                      showTitle: value
                    }
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 파일명 표시 설정
    new Setting(this.displaySettingsEl)
      .setName('파일명')
      .setDesc('파일명을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showFileName)
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                sections: {
                  ...cardSettings.sections,
                  [section]: {
                    ...sectionSettings,
                    displayOptions: {
                      ...displayOptions,
                      showFileName: value
                    }
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 퍼스트헤더 표시 설정
    new Setting(this.displaySettingsEl)
      .setName('퍼스트헤더')
      .setDesc('퍼스트헤더를 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showFirstHeader)
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                sections: {
                  ...cardSettings.sections,
                  [section]: {
                    ...sectionSettings,
                    displayOptions: {
                      ...displayOptions,
                      showFirstHeader: value
                    }
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 본문 표시 설정
    new Setting(this.displaySettingsEl)
      .setName('본문')
      .setDesc('본문을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showContent)
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                sections: {
                  ...cardSettings.sections,
                  [section]: {
                    ...sectionSettings,
                    displayOptions: {
                      ...displayOptions,
                      showContent: value
                    }
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 태그 표시 설정
    new Setting(this.displaySettingsEl)
      .setName('태그')
      .setDesc('태그를 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showTags)
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                sections: {
                  ...cardSettings.sections,
                  [section]: {
                    ...sectionSettings,
                    displayOptions: {
                      ...displayOptions,
                      showTags: value
                    }
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 생성일 표시 설정
    new Setting(this.displaySettingsEl)
      .setName('생성일')
      .setDesc('생성일을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showCreatedAt)
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                sections: {
                  ...cardSettings.sections,
                  [section]: {
                    ...sectionSettings,
                    displayOptions: {
                      ...displayOptions,
                      showCreatedAt: value
                    }
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 수정일 표시 설정
    new Setting(this.displaySettingsEl)
      .setName('수정일')
      .setDesc('수정일을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showUpdatedAt)
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                sections: {
                  ...cardSettings.sections,
                  [section]: {
                    ...sectionSettings,
                    displayOptions: {
                      ...displayOptions,
                      showUpdatedAt: value
                    }
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 속성값 표시 설정
    new Setting(this.displaySettingsEl)
      .setName('속성값')
      .setDesc('속성값을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showProperties)
          .onChange(async value => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...cardSettings,
                sections: {
                  ...cardSettings.sections,
                  [section]: {
                    ...sectionSettings,
                    displayOptions: {
                      ...displayOptions,
                      showProperties: value
                    }
                  }
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));
  }

  /**
   * 설정 저장
   */
  private async saveSettings(): Promise<void> {
    const settings = this.settingsService.getSettings();
    await this.settingsService.saveSettings(settings);
  }

  /**
   * 설정 변경 이벤트 핸들러
   */
  private async onSettingChange(): Promise<void> {
    await this.saveSettings();
    if (this.selectedSection !== 'card') {
      this.updateDisplaySettings(this.selectedSection);
    }
  }

  /**
   * 설정 섹션 정리
   */
  cleanup(): void {
    try {
      console.log('카드 설정 섹션 정리 시작');
      
      if (this.cardPreview) {
        this.cardPreview.cleanup();
        this.cardPreview = null;
      }
      
      if (this.containerEl) {
        this.styleSettingsEl?.empty();
        this.displaySettingsEl?.empty();
      }
      
      console.log('카드 설정 섹션 정리 완료');
    } catch (error) {
      console.error('카드 설정 섹션 정리 중 오류 발생', error);
    }
  }

  /**
   * 설정 UI 생성
   */
  public createSettingsUI(): void {
    const settings = this.settingsService.getSettings();
    this.createCardConfig(settings);
    if (this.selectedSection !== 'card') {
      this.updateDisplaySettings(this.selectedSection);
    }
  }
} 