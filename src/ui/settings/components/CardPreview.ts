import { 
  ICardStateStyle, 
  ICardDisplayOptions, 
  ICardSection, 
  IRenderConfig,
  DEFAULT_CARD_STATE_STYLE,
  DEFAULT_CARD_DISPLAY_OPTIONS,
  DEFAULT_RENDER_CONFIG,
  DEFAULT_CARD_SECTION
} from '../../../domain/models/Card';

type SectionType = 'card' | 'header' | 'body' | 'footer';

/**
 * 카드 프리뷰 컴포넌트
 */
export class CardPreview {
  private previewEl: HTMLElement;
  private selectedSection: SectionType | null = null;
  private config: {
    cardStateStyle: ICardStateStyle;
    cardDisplayOptions: ICardDisplayOptions;
    cardSections: {
      header: ICardSection;
      body: ICardSection;
      footer: ICardSection;
    };
    cardRenderConfig: IRenderConfig;
  };

  /**
   * 카드 프리뷰 컴포넌트 생성자
   * @param containerEl - 컨테이너 요소
   * @param config - 카드 설정
   */
  constructor(
    containerEl: HTMLElement,
    config: {
      cardStateStyle?: ICardStateStyle;
      cardDisplayOptions?: ICardDisplayOptions;
      cardSections?: {
        header?: ICardSection;
        body?: ICardSection;
        footer?: ICardSection;
      };
      cardRenderConfig?: IRenderConfig;
    } = {}
  ) {
    this.config = {
      cardStateStyle: config.cardStateStyle || DEFAULT_CARD_STATE_STYLE,
      cardDisplayOptions: config.cardDisplayOptions || DEFAULT_CARD_DISPLAY_OPTIONS,
      cardSections: {
        header: config.cardSections?.header || { ...DEFAULT_CARD_SECTION, type: 'header' },
        body: config.cardSections?.body || { ...DEFAULT_CARD_SECTION, type: 'body' },
        footer: config.cardSections?.footer || { ...DEFAULT_CARD_SECTION, type: 'footer' }
      },
      cardRenderConfig: config.cardRenderConfig || DEFAULT_RENDER_CONFIG
    };
    this.previewEl = containerEl.createDiv({ cls: 'card-preview' });
    this.render();
  }

  /**
   * 카드 프리뷰 렌더링
   */
  private render() {
    this.previewEl.empty();

    // 카드 프리뷰
    const cardEl = this.previewEl.createDiv({ cls: 'card', attr: { 'data-section': 'card' } });
    this.applyStyle(cardEl, this.selectedSection === 'card' ? this.config.cardStateStyle.focused : this.config.cardStateStyle.normal);
    cardEl.addEventListener('click', () => this.handleSectionClick('card'));

    // 헤더
    const headerSection = this.config.cardSections.header;
    const headerEl = cardEl.createDiv({ cls: 'header', attr: { 'data-section': 'header' } });
    this.applyStyle(headerEl, this.selectedSection === 'header' ? this.config.cardStateStyle.focused : this.config.cardStateStyle.normal);
    headerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleSectionClick('header');
    });
    this.renderSectionContent(headerEl, headerSection.displayOptions);

    // 본문
    const bodySection = this.config.cardSections.body;
    const bodyEl = cardEl.createDiv({ cls: 'body', attr: { 'data-section': 'body' } });
    this.applyStyle(bodyEl, this.selectedSection === 'body' ? this.config.cardStateStyle.focused : this.config.cardStateStyle.normal);
    bodyEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleSectionClick('body');
    });
    this.renderSectionContent(bodyEl, bodySection.displayOptions);

    // 푸터
    const footerSection = this.config.cardSections.footer;
    const footerEl = cardEl.createDiv({ cls: 'footer', attr: { 'data-section': 'footer' } });
    this.applyStyle(footerEl, this.selectedSection === 'footer' ? this.config.cardStateStyle.focused : this.config.cardStateStyle.normal);
    footerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleSectionClick('footer');
    });
    this.renderSectionContent(footerEl, footerSection.displayOptions);
  }

  /**
   * 스타일 적용
   * @param el - HTML 요소
   * @param style - 카드 스타일
   */
  private applyStyle(el: HTMLElement, style: ICardStateStyle['normal']) {
    // CSS 클래스 적용
    el.classList.add(...style.classes);

    // 인라인 스타일 적용
    el.style.backgroundColor = style.backgroundColor;
    el.style.fontSize = style.fontSize;
    el.style.color = style.color;
    el.style.padding = style.padding;
    el.style.boxShadow = style.boxShadow;
    el.style.lineHeight = style.lineHeight;
    el.style.fontFamily = style.fontFamily;

    // 테두리 스타일 적용
    el.style.borderWidth = style.border.width;
    el.style.borderColor = style.border.color;
    el.style.borderStyle = style.border.style;
    el.style.borderRadius = style.border.radius;

    // CSS 변수 대신 직접 스타일 값 적용
    el.style.setProperty('--background-primary', style.backgroundColor);
    el.style.setProperty('--font-size-normal', style.fontSize);
    el.style.setProperty('--text-normal', style.color);
    el.style.setProperty('--background-modifier-border', style.border.color);
    el.style.setProperty('--line-height-normal', style.lineHeight);
    el.style.setProperty('--font-family', style.fontFamily);
  }

  /**
   * 섹션 내용 렌더링
   * @param el - HTML 요소
   * @param displayOptions - 카드 표시 옵션
   */
  private renderSectionContent(el: HTMLElement, displayOptions: ICardDisplayOptions) {
    // 기존 내용 제거
    el.empty();

    // 표시 옵션에 따라 내용 렌더링
    const contentMap = {
      showTitle: { text: 'Title', cls: 'title' },
      showFileName: { text: 'File Name', cls: 'file-name' },
      showFirstHeader: { text: 'First Header', cls: 'first-header' },
      showContent: { text: 'Content', cls: 'content' },
      showTags: { text: '#tag1 #tag2', cls: 'tags' },
      showCreatedAt: { text: 'Created: 2024-03-21', cls: 'created-at' },
      showUpdatedAt: { text: 'Updated: 2024-03-21', cls: 'updated-at' },
      showProperties: { text: 'Properties: { key: value }', cls: 'properties' }
    };

    Object.entries(contentMap).forEach(([key, value]) => {
      if (displayOptions[key as keyof ICardDisplayOptions]) {
        const div = el.createDiv({ text: value.text, cls: value.cls });
        // 태그는 푸터에만 표시
        if (key === 'showTags' && !el.classList.contains('footer')) {
          div.style.display = 'none';
        }
      }
    });
  }

  /**
   * 섹션 클릭 이벤트 핸들러
   * @param section - 섹션 타입
   */
  private handleSectionClick(section: SectionType) {
    this.selectedSection = section;
    this.render();
    
    const event = new CustomEvent('section-click', { 
      detail: { section },
      bubbles: true,
      cancelable: true
    });
    this.previewEl.dispatchEvent(event);
  }

  /**
   * 카드 설정 업데이트
   * @param config - 카드 설정
   */
  updateConfig(config: {
    cardStateStyle?: ICardStateStyle;
    cardDisplayOptions?: ICardDisplayOptions;
    cardSections?: {
      header?: ICardSection;
      body?: ICardSection;
      footer?: ICardSection;
    };
    cardRenderConfig?: IRenderConfig;
  }) {
    this.config = {
      cardStateStyle: config.cardStateStyle || this.config.cardStateStyle,
      cardDisplayOptions: config.cardDisplayOptions || this.config.cardDisplayOptions,
      cardSections: {
        header: config.cardSections?.header || this.config.cardSections.header,
        body: config.cardSections?.body || this.config.cardSections.body,
        footer: config.cardSections?.footer || this.config.cardSections.footer
      },
      cardRenderConfig: config.cardRenderConfig || this.config.cardRenderConfig
    };
    this.render();
  }

  /**
   * 리소스 정리
   */
  cleanup() {
    this.previewEl.remove();
  }

  /**
   * 카드 프리뷰 생성
   */
  private createCardPreview(): void {
    const cardEl = this.previewEl.createDiv('card-preview');
    cardEl.style.border = '1px solid var(--background-modifier-border)';
    cardEl.style.borderRadius = '8px';
    cardEl.style.padding = '16px';
    cardEl.style.margin = '16px 0';
    cardEl.style.backgroundColor = 'var(--background-primary)';
    cardEl.style.cursor = 'pointer';
    cardEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const event = new CustomEvent('section-click', {
        detail: { section: 'card' }
      });
      this.previewEl.dispatchEvent(event);
    });

    // 헤더
    const headerEl = cardEl.createDiv('card-preview-header');
    headerEl.style.padding = '8px';
    headerEl.style.borderBottom = '1px solid var(--background-modifier-border)';
    headerEl.style.cursor = 'pointer';
    headerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const event = new CustomEvent('section-click', {
        detail: { section: 'header' }
      });
      this.previewEl.dispatchEvent(event);
    });

    // 바디
    const bodyEl = cardEl.createDiv('card-preview-body');
    bodyEl.style.padding = '8px';
    bodyEl.style.cursor = 'pointer';
    bodyEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const event = new CustomEvent('section-click', {
        detail: { section: 'body' }
      });
      this.previewEl.dispatchEvent(event);
    });

    // 푸터
    const footerEl = cardEl.createDiv('card-preview-footer');
    footerEl.style.padding = '8px';
    footerEl.style.borderTop = '1px solid var(--background-modifier-border)';
    footerEl.style.cursor = 'pointer';
    footerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const event = new CustomEvent('section-click', {
        detail: { section: 'footer' }
      });
      this.previewEl.dispatchEvent(event);
    });

    this.updatePreview();
  }

  /**
   * 카드 프리뷰 업데이트
   */
  public updatePreview(): void {
    if (this.previewEl) {
      this.previewEl.empty();
      this.createCardPreview();
    }
  }
}