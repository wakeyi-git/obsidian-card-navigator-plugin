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
  private previewEl: HTMLElement | null = null;
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
    try {
      console.log('카드 프리뷰 생성 시작', { containerEl: this.containerEl });
      
      // 기존 프리뷰가 있다면 제거
      if (this.previewEl) {
        this.previewEl.remove();
      }

      // 프리뷰 컨테이너 요소가 존재하는지 확인
      if (!this.containerEl) {
        console.error('프리뷰 컨테이너 요소가 없습니다');
        return;
      }

      // 프리뷰 컨테이너
      this.previewEl = this.containerEl.createDiv('card-preview-wrapper');
      
      // 스타일 명시적 설정 (가시성 확보)
      this.previewEl.style.display = 'flex';
      this.previewEl.style.justifyContent = 'center';
      this.previewEl.style.alignItems = 'center';
      this.previewEl.style.padding = '20px';
      this.previewEl.style.backgroundColor = 'var(--background-secondary)';
      this.previewEl.style.borderRadius = '8px';
      this.previewEl.style.margin = '20px 0';
      this.previewEl.style.minHeight = '200px';
      this.previewEl.style.width = '100%';
      this.previewEl.style.boxSizing = 'border-box';
      this.previewEl.style.position = 'relative';
      
      // 카드 프리뷰
      const cardEl = this.previewEl.createDiv('card-preview');
      cardEl.style.width = '300px';
      cardEl.style.maxWidth = '100%';
      cardEl.style.minHeight = '150px';
      cardEl.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      cardEl.style.borderRadius = '8px';
      cardEl.style.overflow = 'hidden';
      cardEl.style.backgroundColor = 'var(--background-primary)';
      cardEl.style.position = 'relative';
      cardEl.style.border = '1px solid var(--background-modifier-border)';
      
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
        headerEl.style.padding = '10px';
        headerEl.style.borderBottom = '1px solid var(--background-modifier-border)';
        this.renderSectionContent(headerEl, this.renderConfig.headerDisplay);
      }

      // 본문
      if (this.renderConfig.showBody) {
        const bodyEl = cardEl.createDiv('card-body');
        this.applyStyle(bodyEl, this.cardStyle.body);
        bodyEl.style.padding = '10px';
        this.renderSectionContent(bodyEl, this.renderConfig.bodyDisplay);
      }

      // 푸터
      if (this.renderConfig.showFooter) {
        const footerEl = cardEl.createDiv('card-footer');
        this.applyStyle(footerEl, this.cardStyle.footer);
        footerEl.style.padding = '10px';
        footerEl.style.borderTop = '1px solid var(--background-modifier-border)';
        this.renderSectionContent(footerEl, this.renderConfig.footerDisplay);
      }

      // 카드 스타일 적용
      this.applyStyle(cardEl, this.cardStyle.card);
      
      // 안내 텍스트 추가
      const infoText = this.previewEl.createDiv('card-preview-info');
      infoText.style.position = 'absolute';
      infoText.style.bottom = '5px';
      infoText.style.right = '10px';
      infoText.style.fontSize = '11px';
      infoText.style.color = 'var(--text-muted)';
      infoText.textContent = '클릭하여 섹션 선택';
      
      console.log('카드 프리뷰 생성 완료', {
        previewEl: this.previewEl,
        dimensions: {
          containerWidth: this.containerEl.offsetWidth,
          previewWidth: this.previewEl.offsetWidth,
          cardWidth: cardEl.offsetWidth
        },
        config: {
          showHeader: this.renderConfig.showHeader,
          showBody: this.renderConfig.showBody,
          showFooter: this.renderConfig.showFooter
        }
      });
    } catch (error) {
      console.error('카드 프리뷰 생성 중 오류 발생', error);
    }
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
    if (!this.previewEl) return;
    
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
    if (this.previewEl) {
      this.previewEl.empty();
      this.createPreview();
    }
  }

  /**
   * 스타일 업데이트
   */
  updateStyle(style: ICardStyle): void {
    this.cardStyle = style;
    if (this.previewEl) {
      this.previewEl.empty();
      this.createPreview();
    }
  }

  /**
   * 선택된 섹션 반환
   */
  getSelectedSection(): SectionType | null {
    return this.selectedSection;
  }

  /**
   * 정리 메서드 - 이벤트 리스너 제거 및 메모리 해제
   */
  cleanup(): void {
    try {
      console.log('카드 프리뷰 정리 시작');
      
      // 이벤트 리스너 제거
      this.eventListeners.clear();
      
      // 요소 정리
      if (this.previewEl) {
        this.previewEl.remove();
        this.previewEl = null;
      }
      
      console.log('카드 프리뷰 정리 완료');
    } catch (error) {
      console.error('카드 프리뷰 정리 중 오류 발생:', error);
    }
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