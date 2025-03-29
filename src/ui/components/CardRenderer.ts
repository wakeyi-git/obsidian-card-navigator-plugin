import { App } from 'obsidian';
import { Card } from '@/domain/models/Card';
import { ICardStyle } from '@/domain/models/Card';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardEventType, CardStyleChangedEvent } from '@/domain/events/CardEvents';
import { MarkdownRenderer } from '@/domain/utils/markdownRenderer';

/**
 * 카드 렌더러 클래스
 * 카드 모델을 HTML 요소로 렌더링하는 클래스
 */
export class CardRenderer {
  private readonly markdownRenderer: MarkdownRenderer;

  constructor(
    private readonly app: App,
    private readonly eventDispatcher: DomainEventDispatcher
  ) {
    this.markdownRenderer = new MarkdownRenderer(app);
  }

  /**
   * 카드 렌더링
   * @param card 렌더링할 카드
   * @param styles 적용할 스타일
   * @returns 렌더링된 HTML 요소
   */
  async render(card: Card, styles: ICardStyle): Promise<HTMLElement> {
    const element = await this.createCardElement(card);
    this.applyStyles(element, styles);
    return element;
  }

  /**
   * 카드 요소 생성
   */
  private async createCardElement(card: Card): Promise<HTMLElement> {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    
    if (card.isActive) cardEl.classList.add('active');
    if (card.isFocused) cardEl.classList.add('focused');
    
    // 헤더
    const headerEl = document.createElement('div');
    headerEl.className = 'card-header';
    headerEl.innerHTML = this.renderHeader(card);
    cardEl.appendChild(headerEl);
    
    // 본문
    const bodyEl = document.createElement('div');
    bodyEl.className = 'card-body';
    bodyEl.innerHTML = await this.renderBody(card);
    cardEl.appendChild(bodyEl);
    
    // 푸터
    const footerEl = document.createElement('div');
    footerEl.className = 'card-footer';
    footerEl.innerHTML = this.renderFooter(card);
    cardEl.appendChild(footerEl);
    
    return cardEl;
  }

  /**
   * 헤더 렌더링
   */
  private renderHeader(card: Card): string {
    const parts: string[] = [];
    
    if (card.renderConfig.header.showFileName) {
      parts.push(`<div class="file-name">${card.fileName}</div>`);
    }
    
    if (card.renderConfig.header.showFirstHeader && card.firstHeader) {
      parts.push(`<div class="first-header">${card.firstHeader}</div>`);
    }
    
    if (card.renderConfig.header.showTags && card.tags.length > 0) {
      parts.push(`<div class="tags">${this.renderTags(card.tags)}</div>`);
    }
    
    if (card.renderConfig.header.showCreatedDate) {
      parts.push(`<div class="created-date">Created: ${this.formatDate(new Date(card.createdAt))}</div>`);
    }
    
    if (card.renderConfig.header.showUpdatedDate) {
      parts.push(`<div class="updated-date">Updated: ${this.formatDate(new Date(card.updatedAt))}</div>`);
    }
    
    if (card.renderConfig.header.showProperties.length > 0) {
      const selectedProperties = Object.entries(card.frontmatter)
        .filter(([key]) => card.renderConfig.header.showProperties.includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      parts.push(`<div class="properties">${this.renderProperties(selectedProperties)}</div>`);
    }
    
    return parts.join('');
  }

  /**
   * 본문 렌더링
   */
  private async renderBody(card: Card): Promise<string> {
    const parts: string[] = [];
    
    if (card.renderConfig.body.showContent) {
      let content = card.content;
      
      // 내용 길이 제한
      if (card.renderConfig.body.contentLength) {
        content = content.slice(0, card.renderConfig.body.contentLength) + '...';
      }
      
      // 마크다운 렌더링
      if (card.renderConfig.body.renderMarkdown) {
        content = await this.markdownRenderer.render(content, {
          showImages: true,
          highlightCode: true,
          supportCallouts: true,
          supportMath: true
        });
      }
      
      parts.push(`<div class="content">${content}</div>`);
    }
    
    return parts.join('');
  }

  /**
   * 푸터 렌더링
   */
  private renderFooter(card: Card): string {
    const parts: string[] = [];
    
    if (card.renderConfig.footer.showFileName) {
      parts.push(`<div class="file-name">${card.fileName}</div>`);
    }
    
    if (card.renderConfig.footer.showFirstHeader && card.firstHeader) {
      parts.push(`<div class="first-header">${card.firstHeader}</div>`);
    }
    
    if (card.renderConfig.footer.showTags && card.tags.length > 0) {
      parts.push(`<div class="tags">${this.renderTags(card.tags)}</div>`);
    }
    
    if (card.renderConfig.footer.showCreatedDate) {
      parts.push(`<div class="created-date">Created: ${this.formatDate(new Date(card.createdAt))}</div>`);
    }
    
    if (card.renderConfig.footer.showUpdatedDate) {
      parts.push(`<div class="updated-date">Updated: ${this.formatDate(new Date(card.updatedAt))}</div>`);
    }
    
    if (card.renderConfig.footer.showProperties.length > 0) {
      const selectedProperties = Object.entries(card.frontmatter)
        .filter(([key]) => card.renderConfig.footer.showProperties.includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      parts.push(`<div class="properties">${this.renderProperties(selectedProperties)}</div>`);
    }
    
    return parts.join('');
  }

  /**
   * 스타일 적용
   */
  private applyStyles(element: HTMLElement, styles: ICardStyle): void {
    // 카드 스타일 적용
    this.applyCardStyle(element, styles.card);
    
    // 활성/포커스 스타일 적용
    if (element.classList.contains('active')) {
      this.applyCardStyle(element, styles.activeCard);
    }
    if (element.classList.contains('focused')) {
      this.applyCardStyle(element, styles.focusedCard);
    }
    
    // 컴포넌트 스타일 적용
    const header = element.querySelector('.card-header');
    if (header) this.applyComponentStyle(header as HTMLElement, styles.header);
    
    const body = element.querySelector('.card-body');
    if (body) this.applyComponentStyle(body as HTMLElement, styles.body);
    
    const footer = element.querySelector('.card-footer');
    if (footer) this.applyComponentStyle(footer as HTMLElement, styles.footer);
  }

  /**
   * 카드 스타일 적용
   */
  private applyCardStyle(element: HTMLElement, style: ICardStyle['card']): void {
    element.style.background = style.background;
    element.style.fontSize = style.fontSize;
    element.style.borderColor = style.borderColor;
    element.style.borderWidth = style.borderWidth;
  }

  /**
   * 컴포넌트 스타일 적용
   */
  private applyComponentStyle(element: HTMLElement, style: ICardStyle['header']): void {
    element.style.background = style.background;
    element.style.fontSize = style.fontSize;
    element.style.borderColor = style.borderColor;
    element.style.borderWidth = style.borderWidth;
  }

  /**
   * 태그 렌더링
   */
  private renderTags(tags: string[]): string {
    return tags.map(tag => `<span class="tag">${tag}</span>`).join('');
  }

  /**
   * 속성 렌더링
   */
  private renderProperties(properties: Record<string, any>): string {
    return Object.entries(properties)
      .map(([key, value]) => `<div class="property"><span class="key">${key}:</span> <span class="value">${value}</span></div>`)
      .join('');
  }

  /**
   * 날짜 포맷팅
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString();
  }
} 