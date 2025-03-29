import { App, MarkdownRenderer as ObsidianMarkdownRenderer, Component } from 'obsidian';

/**
 * 마크다운 렌더링 옵션
 */
export interface MarkdownRenderOptions {
  showImages: boolean;
  highlightCode: boolean;
  supportCallouts: boolean;
  supportMath: boolean;
}

/**
 * 마크다운 렌더러 클래스
 */
export class MarkdownRenderer {
  private readonly component: Component;

  constructor(private readonly app: App) {
    this.component = new Component();
  }
  
  /**
   * 마크다운을 HTML로 렌더링
   */
  async render(content: string, options: MarkdownRenderOptions): Promise<string> {
    // 임시 HTML 요소 생성
    const el = document.createElement('div');
    
    // 마크다운 렌더링
    await ObsidianMarkdownRenderer.render(
      this.app,
      content,
      el,
      '', // sourcePath는 빈 문자열로 설정
      this.component
    );
    
    let html = el.innerHTML;
    
    // 이미지 처리
    if (options.showImages) {
      html = this.processImages(html);
    }
    
    // 코드 블록 하이라이팅
    if (options.highlightCode) {
      html = this.highlightCode(html);
    }
    
    // 콜아웃 처리
    if (options.supportCallouts) {
      html = this.processCallouts(html);
    }
    
    // 수식 처리
    if (options.supportMath) {
      html = this.processMath(html);
    }
    
    return html;
  }
  
  /**
   * 이미지 처리
   */
  private processImages(html: string): string {
    // 이미지 태그를 찾아서 처리
    return html.replace(/<img[^>]*>/g, (match) => {
      // 이미지 크기 조정 및 스타일 적용
      return match.replace(/<img/, '<img class="card-image"');
    });
  }
  
  /**
   * 코드 블록 하이라이팅
   */
  private highlightCode(html: string): string {
    // 코드 블록을 찾아서 하이라이팅 적용
    return html.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, (match, code) => {
      // 코드 하이라이팅 적용
      return `<pre><code class="highlighted-code">${code}</code></pre>`;
    });
  }
  
  /**
   * 콜아웃 처리
   */
  private processCallouts(html: string): string {
    // 콜아웃 블록을 찾아서 처리
    return html.replace(/<div class="callout[^>]*>([\s\S]*?)<\/div>/g, (match, content) => {
      // 콜아웃 스타일 적용
      return `<div class="card-callout">${content}</div>`;
    });
  }
  
  /**
   * 수식 처리
   */
  private processMath(html: string): string {
    // 수식 블록을 찾아서 처리
    return html.replace(/\$\$(.*?)\$\$/g, (match, math) => {
      // 수식 렌더링 적용
      return `<div class="math-block">${math}</div>`;
    });
  }
} 