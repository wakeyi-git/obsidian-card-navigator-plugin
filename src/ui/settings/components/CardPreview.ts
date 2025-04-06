import { ICardConfig } from '@/domain/models/CardConfig';
import { ICardStyle } from '@/domain/models/CardStyle';
import { DEFAULT_CARD_STYLE } from '@/domain/models/CardStyle';
import { DEFAULT_CARD_CONFIG } from '@/domain/models/CardConfig';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';

type SectionType = 'card' | 'header' | 'body' | 'footer';
type CardSectionType = keyof ICardStyle;

type CardStyleProperties = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  padding: string;
  margin: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
};

type HeaderStyleProperties = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  padding: string;
  margin: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
};

type BodyStyleProperties = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  padding: string;
  margin: string;
  fontSize?: string;
  color?: string;
};

type FooterStyleProperties = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  padding: string;
  margin: string;
  fontSize?: string;
  color?: string;
};

type DisplayProperties = {
  showFileName?: boolean;
  showFirstHeader?: boolean;
  showContent?: boolean;
  showTags?: boolean;
  showCreatedDate?: boolean;
  showUpdatedDate?: boolean;
};

/**
 * 카드 프리뷰 컴포넌트
 */
export class CardPreview {
  private containerEl: HTMLElement;
  private previewEl: HTMLElement | null = null;
  private selectedSection: keyof ICardStyle | null = null;
  private cardConfig: ICardConfig;
  private cardStyle: ICardStyle;
  private eventDispatcher: IEventDispatcher;

  constructor(
    containerEl: HTMLElement,
    cardConfig: ICardConfig = DEFAULT_CARD_CONFIG,
    cardStyle: ICardStyle = DEFAULT_CARD_STYLE
  ) {
    this.containerEl = containerEl;
    this.cardConfig = cardConfig;
    this.cardStyle = cardStyle;
    this.eventDispatcher = Container.getInstance().resolve<IEventDispatcher>('IEventDispatcher');
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
      this.previewEl = this.containerEl.createDiv({ cls: 'card-preview' });
      
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
      const cardEl = this.previewEl.createDiv({ cls: 'card', attr: { 'data-section': 'card' } });
      this.applyStyle(cardEl, this.cardStyle.card);
      cardEl.addEventListener('click', () => this.handleSectionClick('card'));

      // 헤더
      if (this.cardConfig.header?.display ?? true) {
        const headerEl = cardEl.createDiv({ cls: 'header', attr: { 'data-section': 'header' } });
        this.applyStyle(headerEl, this.cardStyle.header);
        headerEl.addEventListener('click', () => this.handleSectionClick('header'));
        headerEl.style.padding = '10px';
        headerEl.style.borderBottom = '1px solid var(--background-modifier-border)';
        this.renderSectionContent(headerEl, {
          showFileName: this.cardConfig.header?.fileName ?? true,
          showFirstHeader: this.cardConfig.header?.firstHeader ?? true,
          showContent: this.cardConfig.header?.content ?? false,
          showTags: this.cardConfig.header?.tags ?? true,
          showCreatedDate: this.cardConfig.header?.date ?? true,
          showUpdatedDate: this.cardConfig.header?.date ?? true
        });
      }

      // 본문
      if (this.cardConfig.body?.display ?? true) {
        const bodyEl = cardEl.createDiv({ cls: 'body', attr: { 'data-section': 'body' } });
        this.applyStyle(bodyEl, this.cardStyle.body);
        bodyEl.addEventListener('click', () => this.handleSectionClick('body'));
        bodyEl.style.padding = '10px';
        this.renderSectionContent(bodyEl, {
          showFileName: this.cardConfig.body?.fileName ?? false,
          showFirstHeader: this.cardConfig.body?.firstHeader ?? false,
          showContent: this.cardConfig.body?.content ?? true,
          showTags: this.cardConfig.body?.tags ?? false,
          showCreatedDate: this.cardConfig.body?.date ?? false,
          showUpdatedDate: this.cardConfig.body?.date ?? false
        });
      }

      // 푸터
      if (this.cardConfig.footer?.display ?? true) {
        const footerEl = cardEl.createDiv({ cls: 'footer', attr: { 'data-section': 'footer' } });
        this.applyStyle(footerEl, this.cardStyle.footer);
        footerEl.addEventListener('click', () => this.handleSectionClick('footer'));
        footerEl.style.padding = '10px';
        footerEl.style.borderTop = '1px solid var(--background-modifier-border)';
        this.renderSectionContent(footerEl, {
          showFileName: this.cardConfig.footer?.fileName ?? false,
          showFirstHeader: this.cardConfig.footer?.firstHeader ?? false,
          showContent: this.cardConfig.footer?.content ?? false,
          showTags: this.cardConfig.footer?.tags ?? true,
          showCreatedDate: this.cardConfig.footer?.date ?? true,
          showUpdatedDate: this.cardConfig.footer?.date ?? true
        });
      }

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
          header: this.cardConfig.header?.display ?? true,
          body: this.cardConfig.body?.display ?? true,
          footer: this.cardConfig.footer?.display ?? true
        }
      });

      // 프리뷰 생성 이벤트 발송
      const event = new DomainEvent(
        DomainEventType.CARD_PREVIEW_CREATED,
        {
          cardConfig: this.cardConfig,
          cardStyle: this.cardStyle
        }
      );
      this.eventDispatcher.dispatch(event);
    } catch (error) {
      console.error('카드 프리뷰 생성 중 오류 발생', error);
    }
  }

  /**
   * 섹션 선택
   * @param section 섹션
   */
  public selectSection(section: keyof ICardStyle): void {
    if (!this.previewEl) return;

    const cardEl = this.previewEl.querySelector('.card');
    if (!cardEl) return;

    // 선택 상태 초기화
    cardEl.classList.remove('selected-card');
    cardEl.querySelector('.header')?.classList.remove('selected-header');
    cardEl.querySelector('.body')?.classList.remove('selected-body');
    cardEl.querySelector('.footer')?.classList.remove('selected-footer');

    // 선택된 섹션 표시
    switch (section) {
      case 'card':
        cardEl.classList.add('selected-card');
        break;
      case 'header':
        const headerEl = cardEl.querySelector('.header');
        if (headerEl) {
          headerEl.classList.add('selected-header');
          // 다른 섹션의 강조 해제
          cardEl.querySelector('.body')?.classList.remove('selected-body');
          cardEl.querySelector('.footer')?.classList.remove('selected-footer');
        }
        break;
      case 'body':
        const bodyEl = cardEl.querySelector('.body');
        if (bodyEl) {
          bodyEl.classList.add('selected-body');
          // 다른 섹션의 강조 해제
          cardEl.querySelector('.header')?.classList.remove('selected-header');
          cardEl.querySelector('.footer')?.classList.remove('selected-footer');
        }
        break;
      case 'footer':
        const footerEl = cardEl.querySelector('.footer');
        if (footerEl) {
          footerEl.classList.add('selected-footer');
          // 다른 섹션의 강조 해제
          cardEl.querySelector('.header')?.classList.remove('selected-header');
          cardEl.querySelector('.body')?.classList.remove('selected-body');
        }
        break;
    }

    // 섹션 선택 이벤트 발송
    const event = new DomainEvent(
      DomainEventType.CARD_SECTION_SELECTED,
      { section }
    );
    this.eventDispatcher.dispatch(event);
  }

  /**
   * 스타일 적용
   */
  private applyStyle(el: HTMLElement, style: CardStyleProperties | HeaderStyleProperties | BodyStyleProperties | FooterStyleProperties): void {
    Object.entries(style).forEach(([key, value]) => {
      if (typeof value === 'string') {
        (el.style as any)[key] = value;
      }
    });
  }

  /**
   * 섹션 내용 렌더링
   * @param el 섹션 요소
   * @param config 섹션 설정
   */
  private renderSectionContent(el: HTMLElement, config: DisplayProperties): void {
    // 기존 내용 제거
    el.empty();
    
    // 파일명 표시
    if (config.showFileName) {
      const fileNameEl = el.createDiv({ cls: 'file-name' });
      fileNameEl.textContent = 'File Name';
    }
    
    // 첫 번째 헤더 표시
    if (config.showFirstHeader) {
      const firstHeaderEl = el.createDiv({ cls: 'first-header' });
      firstHeaderEl.textContent = 'First Header';
    }
    
    // 내용 표시
    if (config.showContent) {
      const contentEl = el.createDiv({ cls: 'content' });
      contentEl.textContent = 'Content';
    }
    
    // 태그 표시
    if (config.showTags) {
      const tagsEl = el.createDiv({ cls: 'tags' });
      tagsEl.textContent = '#tag1 #tag2';
    }
    
    // 생성일 표시
    if (config.showCreatedDate) {
      const createdDateEl = el.createDiv({ cls: 'created-date' });
      createdDateEl.textContent = '2024-03-21';
    }
  }

  /**
   * 렌더링 설정 업데이트
   */
  updateRenderConfig(config: ICardConfig): void {
    this.cardConfig = config;
    if (this.previewEl) {
      this.previewEl.empty();
      this.createPreview();
    }

    // 렌더링 설정 업데이트 이벤트 발송
    const event = new DomainEvent(
      DomainEventType.CARD_RENDER_CONFIG_UPDATED,
      { config }
    );
    this.eventDispatcher.dispatch(event);
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

    // 스타일 업데이트 이벤트 발송
    const event = new DomainEvent(
      DomainEventType.CARD_STYLE_UPDATED,
      { style }
    );
    this.eventDispatcher.dispatch(event);
  }

  /**
   * 선택된 섹션 반환
   */
  getSelectedSection(): CardSectionType | null {
    return this.selectedSection;
  }

  /**
   * 정리 메서드 - 이벤트 리스너 제거 및 메모리 해제
   */
  cleanup(): void {
    try {
      console.log('카드 프리뷰 정리 시작');
      
      // 요소 정리
      if (this.previewEl) {
        this.previewEl.remove();
        this.previewEl = null;
      }
      
      console.log('카드 프리뷰 정리 완료');

      // 정리 완료 이벤트 발송
      const event = new DomainEvent(
        DomainEventType.CARD_PREVIEW_CLEANED,
        {}
      );
      this.eventDispatcher.dispatch(event);
    } catch (error) {
      console.error('카드 프리뷰 정리 중 오류 발생:', error);
    }
  }

  /**
   * 섹션 클릭 이벤트 핸들러
   * @param section 섹션
   */
  private handleSectionClick(section: SectionType): void {
    // 이전에 선택된 섹션의 스타일 초기화
    if (this.selectedSection) {
      const prevEl = this.previewEl?.querySelector(`[data-section="${this.selectedSection}"]`);
      if (prevEl) {
        prevEl.removeClass('selected');
      }
    }

    // 새로 선택된 섹션의 스타일 적용
    const el = this.previewEl?.querySelector(`[data-section="${section}"]`);
    if (el) {
      el.addClass('selected');
    }

    // 선택된 섹션 업데이트
    this.selectedSection = section;

    // 섹션 선택 이벤트 발송
    const event = new DomainEvent(
      DomainEventType.CARD_SECTION_SELECTED,
      { section }
    );
    this.eventDispatcher.dispatch(event);
  }
} 