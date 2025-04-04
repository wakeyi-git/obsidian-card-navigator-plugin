import { ICardRenderConfig, ISectionDisplayConfig } from '../models/CardRenderConfig';
import { MarkdownRenderer } from './markdownRenderer';
import { App } from 'obsidian';

/**
 * 렌더링 유틸리티
 */
export class RenderUtils {
  private static markdownRenderer: MarkdownRenderer;

  /**
   * 마크다운 렌더러 초기화
   */
  static initialize(app: App): void {
    this.markdownRenderer = new MarkdownRenderer(app);
  }

  /**
   * 마크다운 텍스트를 HTML로 변환
   */
  static async markdownToHtml(markdown: string): Promise<string> {
    if (!this.markdownRenderer) {
      throw new Error('MarkdownRenderer가 초기화되지 않았습니다.');
    }

    return await this.markdownRenderer.render(markdown, {
      showImages: true,
      highlightCode: true,
      supportCallouts: true,
      supportMath: true
    });
  }

  /**
   * 텍스트를 지정된 길이로 자르기
   */
  static truncateText(text: string, length: number): string {
    if (text.length <= length) {
      return text;
    }
    return text.slice(0, length) + '...';
  }

  /**
   * 날짜 포맷팅
   */
  static formatDate(date: Date): string {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * 태그 목록을 HTML로 변환
   */
  static renderTags(tags: string[]): string {
    return tags
      .map(tag => `<span class="tag">#${tag}</span>`)
      .join(' ');
  }

  /**
   * 속성 목록을 HTML로 변환
   */
  static renderProperties(properties: Record<string, any>): string {
    return Object.entries(properties)
      .map(([key, value]) => `<div class="property"><span class="key">${key}:</span> <span class="value">${value}</span></div>`)
      .join('');
  }

  /**
   * 섹션 내용 렌더링
   */
  private static renderSectionContent(card: any, displayConfig: ISectionDisplayConfig): string {
    const parts: string[] = [];

    if (displayConfig.showFileName) {
      parts.push(`<div class="file-name">${card.fileName}</div>`);
    }

    if (displayConfig.showFirstHeader && card.firstHeader) {
      parts.push(`<div class="first-header">${card.firstHeader}</div>`);
    }

    if (displayConfig.showContent) {
      parts.push(`<div class="content">${card.content}</div>`);
    }

    if (displayConfig.showTags && card.tags.length > 0) {
      parts.push(`<div class="tags">${this.renderTags(card.tags)}</div>`);
    }

    if (displayConfig.showCreatedDate) {
      parts.push(`<div class="created-date">Created: ${this.formatDate(card.createdAt)}</div>`);
    }

    if (displayConfig.showUpdatedDate) {
      parts.push(`<div class="updated-date">Updated: ${this.formatDate(card.updatedAt)}</div>`);
    }

    if (displayConfig.showProperties.length > 0) {
      const selectedProperties = Object.entries(card.frontmatter)
        .filter(([key]) => displayConfig.showProperties.includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      parts.push(`<div class="properties">${this.renderProperties(selectedProperties)}</div>`);
    }

    return parts.join('');
  }

  /**
   * 카드 헤더 렌더링
   */
  static renderCardHeader(card: any, config: ICardRenderConfig): string {
    if (!config.showHeader) {
      return '';
    }

    const content = this.renderSectionContent(card, config.headerDisplay);
    return content ? `<div class="card-header">${content}</div>` : '';
  }

  /**
   * 카드 본문 렌더링
   */
  static async renderCardBody(card: any, config: ICardRenderConfig): Promise<string> {
    if (!config.showBody) {
      return '';
    }

    let content = this.renderSectionContent(card, config.bodyDisplay);
    
    // 본문 내용이 있고 마크다운 렌더링이 활성화된 경우
    if (content && config.renderMarkdown) {
      content = await this.markdownToHtml(content);
    }

    // 본문 길이 제한이 설정된 경우
    if (config.contentLengthLimitEnabled && config.contentLengthLimit) {
      content = this.truncateText(content, config.contentLengthLimit);
    }

    return content ? `<div class="card-body">${content}</div>` : '';
  }

  /**
   * 카드 푸터 렌더링
   */
  static renderCardFooter(card: any, config: ICardRenderConfig): string {
    if (!config.showFooter) {
      return '';
    }

    const content = this.renderSectionContent(card, config.footerDisplay);
    return content ? `<div class="card-footer">${content}</div>` : '';
  }
} 