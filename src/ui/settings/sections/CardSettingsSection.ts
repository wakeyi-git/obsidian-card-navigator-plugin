import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { CardPreview } from '../components/CardPreview';
import { 
  ICardCreateConfig,
  ICardStateStyle,
  RenderType,
  IRenderConfig,
  TitleSource
} from '@/domain/models/Card';
import { ICardDisplayManager } from '@/domain/managers/ICardDisplayManager';
import { Container } from '@/infrastructure/di/Container';
import type { ISettingsService } from '@/domain/services/application/ISettingsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { IPluginSettings } from '@/domain/models/PluginSettings';

type SectionType = 'header' | 'body' | 'footer';

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
      this.createDisplaySettings();

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
  private createCardConfig(settings: IPluginSettings): ICardCreateConfig {
    return {
      titleSource: settings.card.displayOptions.showFileName ? TitleSource.FILE_NAME : TitleSource.FIRST_HEADER,
      stateStyle: settings.card.stateStyle,
      header: settings.card.sections.header,
      body: settings.card.sections.body,
      footer: settings.card.sections.footer
    };
  }

  /**
   * 스타일 설정 생성
   */
  private createStyleSettings(): void {
    // 카드 상태별 스타일 설정
    this.createCardStateStyleSettings();
  }

  /**
   * 카드 상태별 스타일 설정 생성
   */
  private createCardStateStyleSettings(): void {
    // 일반 카드 스타일
    this.styleSettingsEl.createEl('h5', { text: '일반 카드 스타일' });
    this.createCardStyleSettings('normal', '일반 카드');

    // 활성 카드 스타일
    this.styleSettingsEl.createEl('h5', { text: '활성 카드 스타일' });
    this.createCardStyleSettings('active', '활성 카드');

    // 포커스된 카드 스타일
    this.styleSettingsEl.createEl('h5', { text: '포커스된 카드 스타일' });
    this.createCardStyleSettings('focused', '포커스된 카드');
  }

  /**
   * 카드 스타일 설정 생성
   */
  private createCardStyleSettings(styleKey: keyof ICardStateStyle, label: string): void {
    const settings = this.settingsService.getSettings();
    const style = settings.card.stateStyle[styleKey];

    // 배경색 설정
    new Setting(this.styleSettingsEl)
      .setName('배경색')
      .setDesc('배경색을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(style.backgroundColor)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...settings.card,
                stateStyle: {
                  ...settings.card.stateStyle,
                  [styleKey]: {
                    ...style,
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
      .setDesc('폰트 크기를 설정합니다.')
      .addSlider(slider => {
        const value = parseInt(style.fontSize);
        slider
          .setValue(value)
          .setLimits(8, 24, 1)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...settings.card,
                stateStyle: {
                  ...settings.card.stateStyle,
                  [styleKey]: {
                    ...style,
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
      .setDesc('테두리 색상을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(style.border.color)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...settings.card,
                stateStyle: {
                  ...settings.card.stateStyle,
                  [styleKey]: {
                    ...style,
                    border: {
                      ...style.border,
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
      .setDesc('테두리 두께를 설정합니다.')
      .addSlider(slider => {
        const value = parseInt(style.border.width);
        slider
          .setValue(value)
          .setLimits(0, 4, 1)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...settings.card,
                stateStyle: {
                  ...settings.card.stateStyle,
                  [styleKey]: {
                    ...style,
                    border: {
                      ...style.border,
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
   * 표시 항목 설정 생성
   */
  private createDisplaySettings(): void {
    const settings = this.settingsService.getSettings();
    const displayOptions = settings.card.displayOptions;

    // 파일명 표시
    new Setting(this.displaySettingsEl)
      .setName('파일명 표시')
      .setDesc('파일명을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showFileName)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...settings.card,
                displayOptions: {
                  ...displayOptions,
                  showFileName: value
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 첫 번째 헤더 표시
    new Setting(this.displaySettingsEl)
      .setName('첫 번째 헤더 표시')
      .setDesc('첫 번째 헤더를 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showFirstHeader)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...settings.card,
                displayOptions: {
                  ...displayOptions,
                  showFirstHeader: value
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 본문 표시
    new Setting(this.displaySettingsEl)
      .setName('본문 표시')
      .setDesc('본문을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showContent)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...settings.card,
                displayOptions: {
                  ...displayOptions,
                  showContent: value
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 태그 표시
    new Setting(this.displaySettingsEl)
      .setName('태그 표시')
      .setDesc('태그를 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showTags)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...settings.card,
                displayOptions: {
                  ...displayOptions,
                  showTags: value
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 생성일 표시
    new Setting(this.displaySettingsEl)
      .setName('생성일 표시')
      .setDesc('생성일을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showCreatedAt)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...settings.card,
                displayOptions: {
                  ...displayOptions,
                  showCreatedAt: value
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 수정일 표시
    new Setting(this.displaySettingsEl)
      .setName('수정일 표시')
      .setDesc('수정일을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showUpdatedAt)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...settings.card,
                displayOptions: {
                  ...displayOptions,
                  showUpdatedAt: value
                }
              }
            });
            if (this.cardPreview) {
              const cardConfig = this.createCardConfig(settings);
              this.cardPreview.updateConfig(cardConfig);
            }
          }));

    // 속성값 표시
    new Setting(this.displaySettingsEl)
      .setName('속성값 표시')
      .setDesc('속성값을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayOptions.showProperties)
          .onChange(async (value) => {
            await this.settingsService.saveSettings({
              ...settings,
              card: {
                ...settings.card,
                displayOptions: {
                  ...displayOptions,
                  showProperties: value
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
        this.updateStyleSettings(section);
        this.updateDisplaySettings();
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
    
    // 선택된 섹션에 따른 스타일 설정 생성
    this.createStyleSettings();
  }

  /**
   * 표시 설정 업데이트
   */
  private updateDisplaySettings(): void {
    // 표시 설정 영역 초기화
    this.displaySettingsEl.empty();
    
    // 표시 설정 생성
    this.createDisplaySettings();
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
} 