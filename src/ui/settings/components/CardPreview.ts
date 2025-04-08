import { 
  ICardStyle, 
  ICardCreateConfig, 
  ICardStateStyle,
  ICardDisplayOptions,
  DEFAULT_CARD_CREATE_CONFIG,
  DEFAULT_CARD_STATE_STYLE,
  TitleSource
} from '../../../domain/models/Card';

type SectionType = 'header' | 'body' | 'footer';

/**
 * 카드 프리뷰 컴포넌트
 */
export class CardPreview {
  private previewEl: HTMLElement;
  private config: ICardCreateConfig;

  /**
   * 카드 프리뷰 컴포넌트 생성자
   * @param containerEl - 컨테이너 요소
   * @param config - 카드 생성 설정
   */
  constructor(
    containerEl: HTMLElement,
    config: ICardCreateConfig = DEFAULT_CARD_CREATE_CONFIG
  ) {
    this.config = config;
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
    this.applyStyle(cardEl, this.config.stateStyle.normal);

    // 헤더
    const headerSection = this.config.header;
    if (headerSection.displayOptions.showTitle) {
      const headerEl = cardEl.createDiv({ cls: 'header', attr: { 'data-section': 'header' } });
      this.applyStyle(headerEl, headerSection.style);
      headerEl.addEventListener('click', () => this.handleSectionClick('header'));
      this.renderSectionContent(headerEl, headerSection.displayOptions);
    }

    // 본문
    const bodySection = this.config.body;
    if (bodySection.displayOptions.showContent) {
      const bodyEl = cardEl.createDiv({ cls: 'body', attr: { 'data-section': 'body' } });
      this.applyStyle(bodyEl, bodySection.style);
      bodyEl.addEventListener('click', () => this.handleSectionClick('body'));
      this.renderSectionContent(bodyEl, bodySection.displayOptions);
    }

    // 푸터
    const footerSection = this.config.footer;
    if (footerSection.displayOptions.showTags) {
      const footerEl = cardEl.createDiv({ cls: 'footer', attr: { 'data-section': 'footer' } });
      this.applyStyle(footerEl, footerSection.style);
      footerEl.addEventListener('click', () => this.handleSectionClick('footer'));
      this.renderSectionContent(footerEl, footerSection.displayOptions);
    }
  }

  /**
   * 스타일 적용
   * @param el - HTML 요소
   * @param style - 카드 스타일
   */
  private applyStyle(el: HTMLElement, style: ICardStyle) {
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
  }

  /**
   * 섹션 내용 렌더링
   * @param el - HTML 요소
   * @param displayOptions - 카드 표시 옵션
   */
  private renderSectionContent(el: HTMLElement, displayOptions: ICardDisplayOptions) {
    if (displayOptions.showFileName) {
      el.createDiv({ text: 'File Name', cls: 'file-name' });
    }
    if (displayOptions.showFirstHeader) {
      el.createDiv({ text: 'First Header', cls: 'first-header' });
    }
    if (displayOptions.showContent) {
      el.createDiv({ text: 'Content', cls: 'content' });
    }
    if (displayOptions.showTags) {
      el.createDiv({ text: '#tag1 #tag2', cls: 'tags' });
    }
    if (displayOptions.showCreatedAt) {
      el.createDiv({ text: 'Created: 2024-03-21', cls: 'created-at' });
    }
    if (displayOptions.showUpdatedAt) {
      el.createDiv({ text: 'Updated: 2024-03-21', cls: 'updated-at' });
    }
    if (displayOptions.showProperties) {
      el.createDiv({ text: 'Properties: { key: value }', cls: 'properties' });
    }
  }

  /**
   * 섹션 클릭 이벤트 핸들러
   * @param section - 섹션 타입
   */
  private handleSectionClick(section: SectionType) {
    const event = new CustomEvent('section-click', { 
      detail: { section },
      bubbles: true,
      cancelable: true
    });
    this.previewEl.dispatchEvent(event);
  }

  /**
   * 카드 설정 업데이트
   * @param config - 카드 생성 설정
   */
  updateConfig(config: ICardCreateConfig) {
    this.config = config;
    this.render();
  }

  /**
   * 리소스 정리
   */
  cleanup() {
    this.previewEl.remove();
  }
}