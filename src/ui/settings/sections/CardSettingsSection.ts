import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { CardPreview } from '../components/CardPreview';
import { IStyleProperties } from '@/domain/models/CardStyle';
import { IRenderConfig, ICardSectionConfig, RenderType } from '@/domain/models/CardConfig';
import { ICardDisplayManager } from '@/domain/managers/ICardDisplayManager';
import { IRenderManager } from '@/domain/managers/IRenderManager';
import { Container } from '@/infrastructure/di/Container';
import type { ISettingsService } from '@/domain/services/ISettingsService';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { IPluginSettings } from '@/domain/models/DefaultValues';
import { ICardStyle } from '@/domain/models/CardStyle';
import { IDomainEvent } from '@/domain/events/DomainEvent';

type SectionType = 'header' | 'body' | 'footer';
type StyleSectionType = 'card' | 'activeCard' | 'focusedCard' | SectionType;

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
  private renderManager: IRenderManager;
  private settingsService: ISettingsService;
  private listeners: (() => void)[] = [];
  private eventDispatcher: IEventDispatcher;

  constructor(private plugin: CardNavigatorPlugin, eventDispatcher: IEventDispatcher) {
    const container = Container.getInstance();
    this.cardDisplayManager = container.resolve<ICardDisplayManager>('ICardDisplayManager');
    this.renderManager = container.resolve<IRenderManager>('IRenderManager');
    
    // 설정 서비스 가져오기
    this.settingsService = container.resolve<ISettingsService>('ISettingsService');
    this.eventDispatcher = eventDispatcher;
    
    // 설정 변경 감지
    this.listeners.push(
      this.settingsService.onSettingsChanged(({ oldSettings, newSettings }) => {
        // 설정이 변경되면 필요한 UI 업데이트 수행 가능
        if (this.cardPreview) {
          this.cardPreview.updateRenderConfig(newSettings.cardConfig);
          this.cardPreview.updateStyle(newSettings.cardStyle);
        }
      })
    );
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

      // 카드 프리뷰 컨테이너 강조
      this.createPreview();

      // 스타일 설정
      this.styleSettingsTitle = containerEl.createEl('h4', { text: '카드 스타일 설정' });
      this.styleSettingsEl = containerEl.createDiv('style-settings');

      // 표시 항목 설정
      this.displaySettingsTitle = containerEl.createEl('h4', { text: '표시 항목 설정' });
      this.displaySettingsEl = containerEl.createDiv('display-settings');

      // 초기 선택 설정
      this.cardPreview?.selectSection('card');
      
      // 초기 화면에서 카드 영역이 선택되어 있을 때는 표시 항목 설정 타이틀 숨김
      this.displaySettingsTitle.style.display = 'none';

      // 선택된 섹션에 따른 스타일 설정
      this.createStyleSettings();
      this.createDisplaySettings();

      // 콘솔에 상태 로깅
      console.log('카드 설정 섹션 생성 완료', {
        cardPreviewCreated: !!this.cardPreview,
        renderConfig: this.getRenderConfig(),
        cardStyle: this.settingsService.getSettings().cardStyle,
        containerSize: {
          width: this.containerEl.offsetWidth,
          height: this.containerEl.offsetHeight
        }
      });
    } catch (error) {
      console.error('카드 설정 섹션 생성 중 오류 발생:', error);
      
      // 기본 에러 메시지 표시
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
    const card = settings.cardConfig;
    
    // 마크다운 렌더링
    new Setting(this.containerEl)
      .setName('HTML 렌더링')
      .setDesc('마크다운을 HTML로 렌더링합니다. 비활성화하면 일반 텍스트로 표시됩니다.')
      .addToggle(toggle =>
        toggle
          .setValue(card.renderType === 'html')
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('cardConfig.renderType', value ? 'html' : 'text');
            this.cardPreview?.updateRenderConfig(settings.cardConfig);
          }));

    // 본문 길이 제한
    new Setting(this.containerEl)
      .setName('본문 길이 제한')
      .setDesc('본문의 길이를 제한합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(card.body.content !== undefined)
          .onChange(async (value) => {
            await this.settingsService.updateNestedSettings('cardConfig.body.content', value);
            this.cardPreview?.updateRenderConfig(settings.cardConfig);
            this.updateContentLengthLimitSlider();
          }));

    // 본문 길이 제한 값 설정
    this.contentLengthLimitSlider = new Setting(this.containerEl)
      .setName('본문 길이 제한 값')
      .setDesc('표시할 본문의 최대 길이를 설정합니다.')
      .addSlider(slider => {
        const value = 500; // 기본값
        slider
          .setValue(value)
          .setLimits(50, 1000, 50)
          .setDynamicTooltip()
          .onChange(async (value) => {
            // TODO: 본문 길이 제한 값 설정 구현
            this.cardPreview?.updateRenderConfig(settings.cardConfig);
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
        settings.cardConfig.body.content !== undefined ? 'flex' : 'none';
    }
  }

  /**
   * 렌더링 설정 가져오기
   */
  private getRenderConfig(): IRenderConfig {
    const settings = this.settingsService.getSettings();
    const card = settings.cardConfig;
    
    return {
      type: RenderType.HTML,
      showImages: true,
      highlightCode: true,
      supportCallouts: true,
      supportMath: true,
      contentLengthLimitEnabled: card.body.content !== undefined,
      contentLengthLimit: 500 // 기본값
    };
  }

  /**
   * 스타일 설정 생성
   */
  private createStyleSettings(): void {
    const section = this.cardPreview?.getSelectedSection();
    if (!section) return;

    // 카드 영역 선택 시 상태별 스타일 설정
    if (section === 'card') {
      this.createCardStateStyleSettings();
      return;
    }

    // 섹션별 스타일 설정
    this.createSectionStyleSettings(section as SectionType);
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
      .setName('배경색')
      .setDesc('배경색을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(this.getStyleValue(styleKey, 'backgroundColor'))
          .onChange(async (value) => {
            await this.updateStyle(styleKey, 'backgroundColor', value);
          }));

    // 폰트 크기 설정
    new Setting(this.styleSettingsEl)
      .setName('폰트 크기')
      .setDesc('폰트 크기를 설정합니다.')
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
      .setName('테두리 색상')
      .setDesc('테두리 색상을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(this.getStyleValue(styleKey, 'borderColor'))
          .onChange(async (value) => {
            await this.updateStyle(styleKey, 'borderColor', value);
          }));

    // 테두리 두께 설정
    new Setting(this.styleSettingsEl)
      .setName('테두리 두께')
      .setDesc('테두리 두께를 설정합니다.')
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
      .setName('배경색')
      .setDesc('배경색을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(this.getStyleValue(section, 'backgroundColor'))
          .onChange(async (value) => {
            await this.updateStyle(section, 'backgroundColor', value);
          }));

    // 폰트 크기 설정
    new Setting(this.styleSettingsEl)
      .setName('폰트 크기')
      .setDesc('폰트 크기를 설정합니다.')
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
      .setName('테두리 색상')
      .setDesc('테두리 색상을 설정합니다.')
      .addColorPicker(color =>
        color
          .setValue(this.getStyleValue(section, 'borderColor'))
          .onChange(async (value) => {
            await this.updateStyle(section, 'borderColor', value);
          }));

    // 테두리 두께 설정
    new Setting(this.styleSettingsEl)
      .setName('테두리 두께')
      .setDesc('테두리 두께를 설정합니다.')
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
  private getStyleValue(styleKey: StyleSectionType, property: keyof IStyleProperties): string {
    const settings = this.settingsService.getSettings();
    const style = settings.cardStyle;
    
    switch (styleKey) {
      case 'card':
        return style.card[property] || '';
      case 'activeCard':
        return style.activeCard[property] || '';
      case 'focusedCard':
        return style.focusedCard[property] || '';
      case 'header':
        return style.header[property] || '';
      case 'body':
        return style.body[property] || '';
      case 'footer':
        return style.footer[property] || '';
      default:
        return '';
    }
  }

  /**
   * 표시 항목 설정 생성
   */
  private createDisplaySettings(): void {
    const section = this.cardPreview?.getSelectedSection();
    if (!section || section === 'card') return;

    const displayConfig = this.getDisplayConfig(section as SectionType);

    // 파일명 표시
    new Setting(this.displaySettingsEl)
      .setName('파일명 표시')
      .setDesc('파일명을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayConfig.fileName)
          .onChange(async (value) => {
            await this.updateDisplayConfig(section as SectionType, 'fileName', value);
          }));

    // 첫 번째 헤더 표시
    new Setting(this.displaySettingsEl)
      .setName('첫 번째 헤더 표시')
      .setDesc('첫 번째 헤더를 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayConfig.firstHeader)
          .onChange(async (value) => {
            await this.updateDisplayConfig(section as SectionType, 'firstHeader', value);
          }));

    // 본문 표시
    new Setting(this.displaySettingsEl)
      .setName('본문 표시')
      .setDesc('본문을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayConfig.content !== undefined)
          .onChange(async (value) => {
            await this.updateDisplayConfig(section as SectionType, 'content', value);
          }));

    // 태그 표시
    new Setting(this.displaySettingsEl)
      .setName('태그 표시')
      .setDesc('태그를 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayConfig.tags)
          .onChange(async (value) => {
            await this.updateDisplayConfig(section as SectionType, 'tags', value);
          }));

    // 생성일 표시
    new Setting(this.displaySettingsEl)
      .setName('생성일 표시')
      .setDesc('생성일을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayConfig.date)
          .onChange(async (value) => {
            await this.updateDisplayConfig(section as SectionType, 'date', value);
          }));

    // 수정일 표시
    new Setting(this.displaySettingsEl)
      .setName('수정일 표시')
      .setDesc('수정일을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayConfig.date)
          .onChange(async (value) => {
            await this.updateDisplayConfig(section as SectionType, 'date', value);
          }));

    // 속성값 표시
    new Setting(this.displaySettingsEl)
      .setName('속성값 표시')
      .setDesc('속성값을 표시합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(displayConfig.properties)
          .onChange(async (value) => {
            await this.updateDisplayConfig(section as SectionType, 'properties', value);
          }));
  }

  /**
   * 표시 설정 가져오기
   */
  private getDisplayConfig(section: SectionType): ICardSectionConfig {
    const settings = this.settingsService.getSettings();
    const card = settings.cardConfig;
    
    switch (section) {
      case 'header':
        return card.header;
      case 'body':
        return card.body;
      case 'footer':
        return card.footer;
      default:
        return {} as ICardSectionConfig;
    }
  }

  /**
   * 스타일 업데이트
   */
  private async updateStyle(styleKey: StyleSectionType, property: keyof IStyleProperties, value: string): Promise<void> {
    const settings = this.settingsService.getSettings();
    const style = settings.cardStyle;
    
    switch (styleKey) {
      case 'card':
        await this.settingsService.updateCardStyle('card', property, value);
        break;
      case 'activeCard':
        await this.settingsService.updateCardStyle('activeCard', property, value);
        break;
      case 'focusedCard':
        await this.settingsService.updateCardStyle('focusedCard', property, value);
        break;
      case 'header':
        await this.settingsService.updateCardStyle('header', property, value);
        break;
      case 'body':
        await this.settingsService.updateCardStyle('body', property, value);
        break;
      case 'footer':
        await this.settingsService.updateCardStyle('footer', property, value);
        break;
    }
    
    if (this.cardPreview) {
      this.cardPreview.updateStyle(style);
    }
  }

  /**
   * 표시 설정 업데이트
   */
  private async updateDisplayConfig(
    section: SectionType,
    property: keyof ICardSectionConfig,
    value: boolean
  ): Promise<void> {
    const settings = this.settingsService.getSettings();
    const card = settings.cardConfig;
    
    await this.settingsService.updateCardSectionDisplay(section, property, value);
    
    if (this.cardPreview) {
      this.cardPreview.updateRenderConfig(card);
    }
  }

  /**
   * 스타일 설정 업데이트
   */
  private updateStyleSettings(section: StyleSectionType): void {
    const settings = this.settingsService.getSettings();
    const style = settings.cardStyle;
    
    // 스타일 설정 영역 초기화
    this.styleSettingsEl.empty();
    
    // 선택된 섹션에 따른 스타일 설정 생성
    if (section === 'card' || section === 'activeCard' || section === 'focusedCard') {
      this.createCardStateStyleSettings();
    } else {
      this.createSectionStyleSettings(section as SectionType);
    }
  }

  /**
   * 표시 설정 업데이트
   */
  private updateDisplaySettings(section: SectionType): void {
    const settings = this.settingsService.getSettings();
    const card = settings.cardConfig;
    
    // 표시 설정 영역 초기화
    this.displaySettingsEl.empty();
    
    // 선택된 섹션에 따른 표시 설정 생성
    this.createDisplaySettings();
  }

  /**
   * 섹션 이름 가져오기
   */
  private getSectionName(section: StyleSectionType): string {
    switch (section) {
      case 'card':
        return '카드';
      case 'header':
        return '헤더';
      case 'body':
        return '본문';
      case 'footer':
        return '푸터';
      default:
        return '';
    }
  }

  /**
   * 설정 섹션 정리
   */
  cleanup(): void {
    try {
      console.log('카드 설정 섹션 정리 시작');
      
      // 카드 프리뷰 정리
      if (this.cardPreview) {
        // 이벤트 리스너 제거는 CardPreview 클래스에 구현 필요
        // 여기서는 참조만 제거
        this.cardPreview = null;
      }
      
      // 설정 요소 정리
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
   * 컴포넌트 정리
   */
  destroy(): void {
    // 이벤트 리스너 정리
    this.listeners.forEach(cleanup => cleanup());
    this.listeners = [];
    
    // 기존 정리 메서드 호출
    this.cleanup();
  }

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
      // 새로운 카드 프리뷰 생성
      this.cardPreview = new CardPreview(
        previewContainer,
        settings.cardConfig,
        settings.cardStyle
      );
      
      // 이벤트 핸들러 등록
      const handler = {
        handle: (event: IDomainEvent<typeof DomainEventType.CARD_SECTION_SELECTED>) => {
          const { section } = event.data;
          this.updateStyleSettings(section as StyleSectionType);
          this.updateDisplaySettings(section as SectionType);
        }
      };
      this.eventDispatcher.registerHandler(DomainEventType.CARD_SECTION_SELECTED, handler);
      this.listeners.push(() => {
        this.eventDispatcher.unregisterHandler(DomainEventType.CARD_SECTION_SELECTED, handler);
      });
      
      console.log('카드 프리뷰 생성 성공');
    } catch (error) {
      console.error('카드 프리뷰 생성 실패:', error);
      // 오류 발생 시 안내 텍스트 표시
      const errorEl = previewContainer.createDiv('card-preview-error');
      errorEl.style.color = 'var(--text-error)';
      errorEl.style.padding = '20px';
      errorEl.style.textAlign = 'center';
      errorEl.textContent = '카드 프리뷰를 생성할 수 없습니다. 설정을 확인해 주세요.';
      
      // 이후 코드 실행 중단
      return;
    }
  }
} 