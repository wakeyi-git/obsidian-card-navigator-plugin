import { ICardRenderConfig } from '@/domain/models/CardRenderConfig';
import { ICardStyle } from '@/domain/models/CardStyle';
import { DEFAULT_CARD_STYLE } from '@/domain/models/CardStyle';
import { DEFAULT_CARD_RENDER_CONFIG } from '@/domain/models/CardRenderConfig';

type SectionType = 'card' | 'header' | 'body' | 'footer';

type StyleProperties = {
  backgroundColor: string;
  fontSize: string;
  borderColor: string;
  borderWidth: string;
};

type DisplayProperties = {
  showFileName: boolean;
  showFirstHeader: boolean;
  showContent: boolean;
  showTags: boolean;
  showCreatedDate: boolean;
  showUpdatedDate: boolean;
};

/**
 * 카드 프리뷰 컴포넌트
 */
export class CardPreview {
  private containerEl: HTMLElement;
  private previewEl: HTMLElement;
  private selectedSection: SectionType | null = null;
  private renderConfig: ICardRenderConfig;
  private cardStyle: ICardStyle;
  private eventListeners: Map<string, ((section: SectionType) => void)[]> = new Map();

  constructor(
    containerEl: HTMLElement,
    renderConfig: ICardRenderConfig = DEFAULT_CARD_RENDER_CONFIG,
    cardStyle: ICardStyle = DEFAULT_CARD_STYLE
  ) {
    this.containerEl = containerEl;
    this.renderConfig = renderConfig;
    this.cardStyle = cardStyle;
    this.createPreview();
  }

  /**
   * 프리뷰 생성
   */
  private createPreview(): void {
    // 프리뷰 컨테이너
    this.previewEl = this.containerEl.createDiv('card-preview-container');
    
    // 카드 프리뷰
    const cardEl = this.previewEl.createDiv('card-preview');
    cardEl.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.card-header')) {
        this.selectSection('header');
      } else if (target.closest('.card-body')) {
        this.selectSection('body');
      } else if (target.closest('.card-footer')) {
        this.selectSection('footer');
      } else {
        this.selectSection('card');
      }
    });

    // 헤더
    if (this.renderConfig.showHeader) {
      const headerEl = cardEl.createDiv('card-header');
      this.applyStyle(headerEl, this.cardStyle.header);
      this.renderSectionContent(headerEl, this.renderConfig.headerDisplay);
    }

    // 본문
    if (this.renderConfig.showBody) {
      const bodyEl = cardEl.createDiv('card-body');
      this.applyStyle(bodyEl, this.cardStyle.body);
      this.renderSectionContent(bodyEl, this.renderConfig.bodyDisplay);
    }

    // 푸터
    if (this.renderConfig.showFooter) {
      const footerEl = cardEl.createDiv('card-footer');
      this.applyStyle(footerEl, this.cardStyle.footer);
      this.renderSectionContent(footerEl, this.renderConfig.footerDisplay);
    }

    // 카드 스타일 적용
    this.applyStyle(cardEl, this.cardStyle.card);
  }

  /**
   * 섹션 선택
   */
  selectSection(section: SectionType): void {
    this.selectedSection = section;
    this.updateSelection();
    this.emit('sectionSelected', section);
  }

  /**
   * 선택 상태 업데이트
   */
  private updateSelection(): void {
    const cardEl = this.previewEl.querySelector('.card-preview');
    if (!cardEl) return;

    // 선택 상태 초기화
    cardEl.classList.remove('selected-card');
    cardEl.querySelector('.card-header')?.classList.remove('selected-header');
    cardEl.querySelector('.card-body')?.classList.remove('selected-body');
    cardEl.querySelector('.card-footer')?.classList.remove('selected-footer');

    // 선택된 섹션 표시
    switch (this.selectedSection) {
      case 'card':
        cardEl.classList.add('selected-card');
        break;
      case 'header':
        const headerEl = cardEl.querySelector('.card-header');
        if (headerEl) {
          headerEl.classList.add('selected-header');
          // 다른 섹션의 강조 해제
          cardEl.querySelector('.card-body')?.classList.remove('selected-body');
          cardEl.querySelector('.card-footer')?.classList.remove('selected-footer');
        }
        break;
      case 'body':
        const bodyEl = cardEl.querySelector('.card-body');
        if (bodyEl) {
          bodyEl.classList.add('selected-body');
          // 다른 섹션의 강조 해제
          cardEl.querySelector('.card-header')?.classList.remove('selected-header');
          cardEl.querySelector('.card-footer')?.classList.remove('selected-footer');
        }
        break;
      case 'footer':
        const footerEl = cardEl.querySelector('.card-footer');
        if (footerEl) {
          footerEl.classList.add('selected-footer');
          // 다른 섹션의 강조 해제
          cardEl.querySelector('.card-header')?.classList.remove('selected-header');
          cardEl.querySelector('.card-body')?.classList.remove('selected-body');
        }
        break;
    }
  }

  /**
   * 스타일 적용
   */
  private applyStyle(el: HTMLElement, style: StyleProperties): void {
    Object.entries(style).forEach(([key, value]) => {
      if (typeof value === 'string') {
        (el.style as any)[key] = value;
      }
    });
  }

  /**
   * 섹션 내용 렌더링
   */
  private renderSectionContent(el: HTMLElement, display: DisplayProperties): void {
    const content = [];
    
    if (display.showFileName) {
      content.push('<div class="preview-filename">example.md</div>');
    }
    if (display.showFirstHeader) {
      content.push('<div class="preview-header"># 예시 제목</div>');
    }
    if (display.showContent) {
      content.push('<div class="preview-content">예시 내용입니다.</div>');
    }
    if (display.showTags) {
      content.push('<div class="preview-tags">#태그1 #태그2</div>');
    }
    if (display.showCreatedDate) {
      content.push('<div class="preview-date">생성일: 2024-01-01</div>');
    }
    if (display.showUpdatedDate) {
      content.push('<div class="preview-date">수정일: 2024-01-01</div>');
    }

    el.innerHTML = content.join('');
  }

  /**
   * 렌더링 설정 업데이트
   */
  updateRenderConfig(config: ICardRenderConfig): void {
    this.renderConfig = config;
    this.previewEl.empty();
    this.createPreview();
  }

  /**
   * 스타일 업데이트
   */
  updateStyle(style: ICardStyle): void {
    this.cardStyle = style;
    this.previewEl.empty();
    this.createPreview();
  }

  /**
   * 선택된 섹션 반환
   */
  getSelectedSection(): SectionType | null {
    return this.selectedSection;
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event: string, callback: (section: SectionType) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  /**
   * 이벤트 발생
   */
  private emit(event: string, section: SectionType): void {
    this.eventListeners.get(event)?.forEach(callback => callback(section));
  }
} 