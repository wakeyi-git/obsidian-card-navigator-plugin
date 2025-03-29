import { ICardRenderConfig } from '../models/Card';

/**
 * 렌더링 유틸리티
 */
export class RenderUtils {
  /**
   * 마크다운 텍스트를 HTML로 변환
   */
  static markdownToHtml(markdown: string): string {
    // TODO: 마크다운 파서를 사용하여 HTML로 변환
    return markdown;
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
   * 카드 헤더 렌더링
   */
  static renderCardHeader(card: any, config: ICardRenderConfig['header']): string {
    const parts: string[] = [];

    if (config.showFileName) {
      parts.push(`<div class="file-name">${card.fileName}</div>`);
    }

    if (config.showFirstHeader && card.firstHeader) {
      parts.push(`<div class="first-header">${card.firstHeader}</div>`);
    }

    if (config.showTags && card.tags.length > 0) {
      parts.push(`<div class="tags">${this.renderTags(card.tags)}</div>`);
    }

    if (config.showCreatedDate) {
      parts.push(`<div class="created-date">Created: ${this.formatDate(card.createdAt)}</div>`);
    }

    if (config.showUpdatedDate) {
      parts.push(`<div class="updated-date">Updated: ${this.formatDate(card.updatedAt)}</div>`);
    }

    if (config.showProperties.length > 0) {
      const selectedProperties = Object.entries(card.frontmatter)
        .filter(([key]) => config.showProperties.includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      parts.push(`<div class="properties">${this.renderProperties(selectedProperties)}</div>`);
    }

    return parts.join('');
  }

  /**
   * 카드 본문 렌더링
   */
  static renderCardBody(card: any, config: ICardRenderConfig['body']): string {
    const parts: string[] = [];

    if (config.showFileName) {
      parts.push(`<div class="file-name">${card.fileName}</div>`);
    }

    if (config.showFirstHeader && card.firstHeader) {
      parts.push(`<div class="first-header">${card.firstHeader}</div>`);
    }

    if (config.showContent) {
      const content = config.contentLength
        ? this.truncateText(card.content, config.contentLength)
        : card.content;
      const htmlContent = config.renderMarkdown
        ? this.markdownToHtml(content)
        : content;
      parts.push(`<div class="content">${htmlContent}</div>`);
    }

    if (config.showTags && card.tags.length > 0) {
      parts.push(`<div class="tags">${this.renderTags(card.tags)}</div>`);
    }

    if (config.showCreatedDate) {
      parts.push(`<div class="created-date">Created: ${this.formatDate(card.createdAt)}</div>`);
    }

    if (config.showUpdatedDate) {
      parts.push(`<div class="updated-date">Updated: ${this.formatDate(card.updatedAt)}</div>`);
    }

    if (config.showProperties.length > 0) {
      const selectedProperties = Object.entries(card.frontmatter)
        .filter(([key]) => config.showProperties.includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      parts.push(`<div class="properties">${this.renderProperties(selectedProperties)}</div>`);
    }

    return parts.join('');
  }

  /**
   * 카드 푸터 렌더링
   */
  static renderCardFooter(card: any, config: ICardRenderConfig['footer']): string {
    const parts: string[] = [];

    if (config.showFileName) {
      parts.push(`<div class="file-name">${card.fileName}</div>`);
    }

    if (config.showFirstHeader && card.firstHeader) {
      parts.push(`<div class="first-header">${card.firstHeader}</div>`);
    }

    if (config.showTags && card.tags.length > 0) {
      parts.push(`<div class="tags">${this.renderTags(card.tags)}</div>`);
    }

    if (config.showCreatedDate) {
      parts.push(`<div class="created-date">Created: ${this.formatDate(card.createdAt)}</div>`);
    }

    if (config.showUpdatedDate) {
      parts.push(`<div class="updated-date">Updated: ${this.formatDate(card.updatedAt)}</div>`);
    }

    if (config.showProperties.length > 0) {
      const selectedProperties = Object.entries(card.frontmatter)
        .filter(([key]) => config.showProperties.includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      parts.push(`<div class="properties">${this.renderProperties(selectedProperties)}</div>`);
    }

    return parts.join('');
  }
} 