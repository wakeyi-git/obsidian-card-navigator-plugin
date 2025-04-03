import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { CardRenderType } from '@/domain/models/CardRenderConfig';
import { NoteTitleDisplayType } from '@/domain/models/Card';
import { DEFAULT_CARD_STYLE } from '@/domain/models/CardStyle';
import { CardPreview } from '../components/CardPreview';
import { ICardStyle, IStyleProperties } from '@/domain/models/CardStyle';
import { ICardRenderConfig, ISectionDisplayConfig } from '@/domain/models/CardRenderConfig';

type SectionType = 'card' | 'header' | 'body' | 'footer';

/**
 * 카드 설정 섹션
 */
export class CardSettingsSection {
  private cardPreview: CardPreview;
  private styleSettingsEl: HTMLElement;
  private displaySettingsEl: HTMLElement;
  private containerEl: HTMLElement;

  constructor(private plugin: CardNavigatorPlugin) {}

  /**
   * 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    this.containerEl = containerEl;
    
    // 카드 설정 제목
    containerEl.createEl('h3', { text: '카드 설정' });

    // 노트 타이틀 표시 방식
    // new Setting(containerEl)
    //   .setName('노트 타이틀 표시 방식')
    //   .setDesc('노트의 타이틀을 어떤 방식으로 표시할지 선택합니다.')
    //   .addDropdown(dropdown =>
    //     dropdown
    //       .addOption(NoteTitleDisplayType.FILENAME, '파일명')
    //       .addOption(NoteTitleDisplayType.FIRST_HEADER, '첫 번째 헤더')
    //       .setValue(this.plugin.settings.cardTitleDisplayType)
    //       .onChange(async (value) => {
    //         this.plugin.settings = {
    //           ...this.plugin.settings,
    //           cardTitleDisplayType: value as NoteTitleDisplayType
    //         };
    //         await this.plugin.saveSettings();
    //       }));

    // 렌더링 설정
    this.createRenderSettings();

    // 카드 프리뷰
    const previewContainer = containerEl.createDiv();
    this.cardPreview = new CardPreview(
      previewContainer,
      this.plugin.settings.cardRenderConfig,
      this.plugin.settings.cardStyle
    );

    // 스타일 설정
    containerEl.createEl('h4', { text: '스타일 설정' });
    this.styleSettingsEl = containerEl.createDiv('style-settings');

    // 표시 항목 설정
    const displaySettingsTitle = containerEl.createEl('h4', { text: '표시 항목 설정' });
    this.displaySettingsEl = containerEl.createDiv('display-settings');

    // 초기 선택 설정
    this.cardPreview.selectSection('card');
    // 초기 화면에서 카드 영역이 선택되어 있을 때는 표시 항목 설정 타이틀 숨김
    displaySettingsTitle.style.display = 'none';

    // 선택된 섹션에 따른 스타일 설정
    this.createStyleSettings();
    this.createDisplaySettings();

    // 섹션 선택 이벤트 처리
    this.cardPreview.on('sectionSelected', (section: SectionType) => {
      this.updateStyleSettings(section);
      this.updateDisplaySettings(section);
      // 카드 영역이 선택되었을 때는 표시 항목 설정 타이틀 숨김
      displaySettingsTitle.style.display = section === 'card' ? 'none' : 'block';
    });
  }

  /**
   * 렌더링 설정 생성
   */
  private createRenderSettings(): void {
    // 렌더링 설정 섹션
    // new Setting(this.containerEl)
    //   .setName('렌더링 설정')
    //   .setHeading();

    // 마크다운 렌더링
    new Setting(this.containerEl)
      .setName('HTML 렌더링')
      .setDesc('마크다운을 HTML로 렌더링합니다. 비활성화하면 일반 텍스트로 표시됩니다.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.cardRenderConfig.renderMarkdown)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              cardRenderConfig: {
                ...this.plugin.settings.cardRenderConfig,
                type: value ? CardRenderType.HTML : CardRenderType.TEXT,
                renderMarkdown: value
              }
            };
            await this.plugin.saveSettings();
            this.cardPreview.updateRenderConfig(this.plugin.settings.cardRenderConfig);
          }));

    // 구분선
    new Setting(this.containerEl)
      .setName('')
      .setDesc('')
      .setClass('setting-item-separator');
  }

  /**
   * 스타일 설정 생성
   */
  private createStyleSettings(): void {
    const section = this.cardPreview.getSelectedSection();
    if (!section) return;

    // 카드 영역 선택 시 상태별 스타일 설정
    if (section === 'card') {
      this.createCardStateStyleSettings();
      return;
    }

    // 섹션별 스타일 설정
    this.createSectionStyleSettings(section);
  }

  /**
   * 카드 상태별 스타일 설정 생성
   */
  private createCardStateStyleSettings(): void {
    // 일반 카드 스타일
    this.styleSettingsEl.createEl('h5', { text: '일반 카드 스타일' });
    this.createCardStyleSettings('card', '일반 카드');

    // 활성 카드 스타일
    this.styleSettingsEl.createEl('h5', { text: '활성 카드 스타일' });
    this.createCardStyleSettings('activeCard', '활성 카드');

    // 포커스된 카드 스타일
    this.styleSettingsEl.createEl('h5', { text: '포커스된 카드 스타일' });
    this.createCardStyleSettings('focusedCard', '포커스된 카드');
  }

  /**
   * 카드 스타일 설정 생성
   */
  private createCardStyleSettings(styleKey: 'card' | 'activeCard' | 'focusedCard' | 'header' | 'body' | 'footer', label: string): void {
    // 배경색 설정
    new Setting(this.styleSettingsEl)
      .setName(`${label} 배경색`)
      .setDesc(`${label}의 배경색을 설정합니다.`)
      .addColorPicker(color =>
        color
          .setValue(this.getStyleValue(styleKey, 'backgroundColor'))
          .onChange(async (value) => {
            await this.updateStyle(styleKey, 'backgroundColor', value);
          }));

    // 폰트 크기 설정
    new Setting(this.styleSettingsEl)
      .setName(`${label} 폰트 크기`)
      .setDesc(`${label}의 폰트 크기를 설정합니다.`)
      .addSlider(slider => {
        const value = parseInt(this.getStyleValue(styleKey, 'fontSize'));
        slider
          .setValue(value)
          .setLimits(8, 24, 1)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.updateStyle(styleKey, 'fontSize', `${value}px`);
          });
      });

    // 테두리 색상 설정
    new Setting(this.styleSettingsEl)
      .setName(`${label} 테두리 색상`)
      .setDesc(`${label}의 테두리 색상을 설정합니다.`)
      .addColorPicker(color =>
        color
          .setValue(this.getStyleValue(styleKey, 'borderColor'))
          .onChange(async (value) => {
            await this.updateStyle(styleKey, 'borderColor', value);
          }));

    // 테두리 두께 설정
    new Setting(this.styleSettingsEl)
      .setName(`${label} 테두리 두께`)
      .setDesc(`${label}의 테두리 두께를 설정합니다.`)
      .addSlider(slider => {
        const value = parseInt(this.getStyleValue(styleKey, 'borderWidth'));
        slider
          .setValue(value)
          .setLimits(0, 4, 1)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.updateStyle(styleKey, 'borderWidth', `${value}px`);
          });
      });
  }

  /**
   * 섹션 스타일 설정 생성
   */
  private createSectionStyleSettings(section: SectionType): void {
    // 배경색 설정
    new Setting(this.styleSettingsEl)
      .setName(`${section} 배경색`)
      .setDesc(`${section}의 배경색을 설정합니다.`)
      .addColorPicker(color =>
        color
          .setValue(this.getStyleValue(section, 'backgroundColor'))
          .onChange(async (value) => {
            await this.updateStyle(section, 'backgroundColor', value);
          }));

    // 폰트 크기 설정
    new Setting(this.styleSettingsEl)
      .setName(`${section} 폰트 크기`)
      .setDesc(`${section}의 폰트 크기를 설정합니다.`)
      .addSlider(slider => {
        const value = parseInt(this.getStyleValue(section, 'fontSize'));
        slider
          .setValue(value)
          .setLimits(8, 24, 1)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.updateStyle(section, 'fontSize', `${value}px`);
          });
      });

    // 테두리 색상 설정
    new Setting(this.styleSettingsEl)
      .setName(`${section} 테두리 색상`)
      .setDesc(`${section}의 테두리 색상을 설정합니다.`)
      .addColorPicker(color =>
        color
          .setValue(this.getStyleValue(section, 'borderColor'))
          .onChange(async (value) => {
            await this.updateStyle(section, 'borderColor', value);
          }));

    // 테두리 두께 설정
    new Setting(this.styleSettingsEl)
      .setName(`${section} 테두리 두께`)
      .setDesc(`${section}의 테두리 두께를 설정합니다.`)
      .addSlider(slider => {
        const value = parseInt(this.getStyleValue(section, 'borderWidth'));
        slider
          .setValue(value)
          .setLimits(0, 4, 1)
          .setDynamicTooltip()
          .onChange(async (value) => {
            await this.updateStyle(section, 'borderWidth', `${value}px`);
          });
      });
  }

  /**
   * 스타일 값 가져오기
   */
  private getStyleValue(styleKey: 'card' | 'activeCard' | 'focusedCard' | 'header' | 'body' | 'footer', property: keyof IStyleProperties): string {
    const style = this.plugin.settings.cardStyle;
    return style[styleKey][property];
  }

  /**
   * 표시 항목 설정 생성
   */
  private createDisplaySettings(): void {
    const section = this.cardPreview.getSelectedSection();
    if (!section || section === 'card') return;

    const displayConfig = this.getDisplayConfig(section);

    // 파일명 표시
    new Setting(this.displaySettingsEl)
      .setName('파일명 표시')
      .setDesc('파일명을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayConfig.showFileName)
          .onChange(async (value) => {
            await this.updateDisplayConfig(section, 'showFileName', value);
          }));

    // 첫 번째 헤더 표시
    new Setting(this.displaySettingsEl)
      .setName('첫 번째 헤더 표시')
      .setDesc('첫 번째 헤더를 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayConfig.showFirstHeader)
          .onChange(async (value) => {
            await this.updateDisplayConfig(section, 'showFirstHeader', value);
          }));

    // 본문 표시
    new Setting(this.displaySettingsEl)
      .setName('본문 표시')
      .setDesc('본문을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayConfig.showContent)
          .onChange(async (value) => {
            await this.updateDisplayConfig(section, 'showContent', value);
          }));

    // 태그 표시
    new Setting(this.displaySettingsEl)
      .setName('태그 표시')
      .setDesc('태그를 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayConfig.showTags)
          .onChange(async (value) => {
            await this.updateDisplayConfig(section, 'showTags', value);
          }));

    // 생성일 표시
    new Setting(this.displaySettingsEl)
      .setName('생성일 표시')
      .setDesc('생성일을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayConfig.showCreatedDate)
          .onChange(async (value) => {
            await this.updateDisplayConfig(section, 'showCreatedDate', value);
          }));

    // 수정일 표시
    new Setting(this.displaySettingsEl)
      .setName('수정일 표시')
      .setDesc('수정일을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayConfig.showUpdatedDate)
          .onChange(async (value) => {
            await this.updateDisplayConfig(section, 'showUpdatedDate', value);
          }));

    // 속성값 표시
    new Setting(this.displaySettingsEl)
      .setName('속성값 표시')
      .setDesc('속성값을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayConfig.showProperties.length > 0)
          .onChange(async (value) => {
            await this.updateDisplayConfig(section, 'showProperties', value ? ['status', 'priority'] : []);
          }));
  }

  /**
   * 표시 설정 가져오기
   */
  private getDisplayConfig(section: SectionType): ISectionDisplayConfig {
    const config = this.plugin.settings.cardRenderConfig;
    const displayKey = `${section}Display` as keyof ICardRenderConfig;
    return config[displayKey] as ISectionDisplayConfig;
  }

  /**
   * 스타일 업데이트
   */
  private async updateStyle(styleKey: 'card' | 'activeCard' | 'focusedCard' | 'header' | 'body' | 'footer', property: keyof IStyleProperties, value: string): Promise<void> {
    this.plugin.settings = {
      ...this.plugin.settings,
      cardStyle: {
        ...this.plugin.settings.cardStyle,
        [styleKey]: {
          ...this.plugin.settings.cardStyle[styleKey],
          [property]: value
        }
      }
    };
    await this.plugin.saveSettings();
    this.cardPreview.updateStyle(this.plugin.settings.cardStyle);
  }

  /**
   * 표시 설정 업데이트
   */
  private async updateDisplayConfig(
    section: SectionType,
    property: keyof ISectionDisplayConfig,
    value: boolean | string[]
  ): Promise<void> {
    const displayKey = `${section}Display` as keyof ICardRenderConfig;
    const config = this.plugin.settings.cardRenderConfig;
    const sectionConfig = config[displayKey] as ISectionDisplayConfig;

    if (!sectionConfig) return;

    this.plugin.settings = {
      ...this.plugin.settings,
      cardRenderConfig: {
        ...config,
        [displayKey]: {
          ...sectionConfig,
          [property]: value
        }
      }
    };
    await this.plugin.saveSettings();
    this.cardPreview.updateRenderConfig(this.plugin.settings.cardRenderConfig);
  }

  /**
   * 스타일 설정 업데이트
   */
  private updateStyleSettings(section: SectionType): void {
    this.styleSettingsEl.empty();
    this.createStyleSettings();
  }

  /**
   * 표시 설정 업데이트
   */
  private updateDisplaySettings(section: SectionType): void {
    this.displaySettingsEl.empty();
    this.createDisplaySettings();
  }
} 