import { App, MarkdownRenderer, Component } from 'obsidian';

/**
 * 마크다운 렌더링 옵션
 */
export interface RenderOptions {
  /**
   * 코드 하이라이팅 활성화 여부
   */
  highlightCode?: boolean;
  /**
   * 이미지 렌더링 활성화 여부
   */
  renderImages?: boolean;
  /**
   * 수학 수식 렌더링 활성화 여부
   */
  renderMath?: boolean;
  /**
   * 링크 렌더링 활성화 여부
   */
  renderLinks?: boolean;
  /**
   * 콜아웃 렌더링 활성화 여부
   */
  renderCallouts?: boolean;
}

/**
 * 마크다운 렌더링 서비스
 * Obsidian의 마크다운 렌더링 기능을 래핑하여 제공합니다.
 */
export class MarkdownRendererService extends Component {
  constructor(private app: App) {
    super();
    if (!app) {
      throw new Error('App 인스턴스가 필요합니다.');
    }
  }

  /**
   * 마크다운을 HTML로 렌더링합니다.
   * @param markdown - 렌더링할 마크다운 문자열
   * @param options - 렌더링 옵션
   * @returns 렌더링된 HTML 문자열
   */
  async render(markdown: string, options: RenderOptions = {}): Promise<string> {
    try {
      const container = document.createElement('div');
      const defaultOptions = this.getDefaultOptions();
      const finalOptions = { ...defaultOptions, ...options };

      // 마크다운 렌더링
      await MarkdownRenderer.render(this.app, markdown, container, '', this);

      // 렌더링된 HTML 반환
      return container.innerHTML;
    } catch (error) {
      console.error('마크다운 렌더링 중 오류 발생:', error);
      return markdown; // 오류 발생 시 원본 마크다운 반환
    }
  }

  /**
   * 기본 렌더링 옵션을 반환합니다.
   */
  private getDefaultOptions(): RenderOptions {
    return {
      highlightCode: true,
      renderImages: true,
      renderMath: true,
      renderLinks: true,
      renderCallouts: true
    };
  }
} 