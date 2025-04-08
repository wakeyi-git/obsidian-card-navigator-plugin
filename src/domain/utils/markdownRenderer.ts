import { App, MarkdownRenderer } from 'obsidian';

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
export class CustomMarkdownRenderer {
  private static instance: CustomMarkdownRenderer;
  private renderCache: Map<string, string> = new Map();
  private initialized: boolean = false;

  private constructor(private app: App) {
    // 임시 렌더링 컨테이너 제거
  }

  static getInstance(app: App): CustomMarkdownRenderer {
    if (!CustomMarkdownRenderer.instance) {
      CustomMarkdownRenderer.instance = new CustomMarkdownRenderer(app);
    }
    return CustomMarkdownRenderer.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * 리소스 정리
   */
  cleanup(): void {
    this.renderCache.clear();
    this.initialized = false;
  }
  
  /**
   * 마크다운 텍스트를 HTML로 렌더링
   * @param markdown 마크다운 텍스트
   * @param options 렌더링 옵션
   */
  async render(
    markdown: string, 
    options: MarkdownRenderOptions = {
      showImages: true,
      highlightCode: true,
      supportCallouts: true,
      supportMath: true
    }
  ): Promise<string> {
    try {
      // 빈 마크다운 처리
      if (!markdown || markdown.trim() === '') {
        return '';
      }
      
      // 캐시 체크 - 동일 마크다운에 동일 옵션이면 캐시된 결과 반환
      const cacheKey = this.generateCacheKey(markdown, options);
      if (this.renderCache.has(cacheKey)) {
        return this.renderCache.get(cacheKey) || '';
      }
      
      // 임시 컨테이너 생성
      const tempEl = document.createElement('div');
      
      // 이미지 처리 옵션 적용
      let processedMarkdown = markdown;
      if (!options.showImages) {
        // 이미지 링크를 텍스트로 변환
        processedMarkdown = this.removeImageLinks(processedMarkdown);
      }
      
      // 코드 하이라이팅 옵션 설정
      const renderOptions = {
        highlighting: options.highlightCode
      };
      
      // 렌더링 프로미스 생성
      await MarkdownRenderer.render(
        this.app,
        processedMarkdown,
        tempEl,
        '',
        {} as any
      );
      
      // 렌더링 후처리
      // Callout 지원 옵션에 따라 처리
      if (options.supportCallouts) {
        this.processCallouts(tempEl);
      }
      
      // MathJax 수식 지원 옵션에 따라 처리
      if (options.supportMath) {
        this.processMathExpressions(tempEl);
      }
      
      // 렌더링 결과 캐시
      const renderedContent = this.serializeElementContent(tempEl);
      this.renderCache.set(cacheKey, renderedContent);
      
      return renderedContent;
    } catch (error) {
      console.error('마크다운 렌더링 중 오류 발생:', error);
      return this.createErrorMessage('마크다운 렌더링 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 캐시 키 생성
   */
  private generateCacheKey(markdown: string, options: MarkdownRenderOptions): string {
    // 옵션을 문자열로 변환하여 캐시 키 생성
    return `${markdown.substring(0, 100)}:${JSON.stringify(options)}`;
  }
  
  /**
   * 이미지 링크 제거
   */
  private removeImageLinks(markdown: string): string {
    // 마크다운 이미지 구문 제거: ![alt](url)
    return markdown.replace(/!\[([^\]]*)\]\([^)]+\)/g, '이미지: $1');
  }
  
  /**
   * Callout 처리
   */
  private processCallouts(element: HTMLElement): void {
    // Obsidian의 callout 클래스가 있는 요소 찾기
    const calloutElements = element.querySelectorAll('.callout');
    calloutElements.forEach(callout => {
      // callout 요소에 추가 스타일 적용
      callout.addClass('card-navigator-callout');
    });
  }
  
  /**
   * 수식 표현식 처리
   */
  private processMathExpressions(element: HTMLElement): void {
    // MathJax 관련 요소 처리
    const mathElements = element.querySelectorAll('.math');
    mathElements.forEach(math => {
      // 수식 요소에 추가 스타일 적용
      math.addClass('card-navigator-math');
    });
  }
  
  /**
   * 캐시 정리
   */
  clearCache(): void {
    this.renderCache.clear();
  }
  
  /**
   * 에러 메시지 생성
   */
  private createErrorMessage(errorMessage: string): string {
    const tempContainer = document.createElement('div');
    tempContainer.className = 'markdown-render-error';
    
    const textContent = `렌더링 오류: ${errorMessage}`;
    tempContainer.textContent = textContent;
    
    return this.serializeElementContent(tempContainer);
  }
  
  /**
   * 요소 내용을 안전하게 직렬화
   */
  private serializeElementContent(element: HTMLElement): string {
    // 새로운 임시 컨테이너 생성
    const container = document.createElement('div');
    
    // 원본 요소의 모든 자식 노드를 깊게 복제해서 추가
    Array.from(element.childNodes).forEach(node => {
      container.appendChild(node.cloneNode(true));
    });
    
    // 내용을 직렬화 (outerHTML 대신 사용)
    const serializer = new XMLSerializer();
    let result = '';
    
    // 각 자식 요소를 순회하며 직렬화
    Array.from(container.childNodes).forEach(node => {
      result += serializer.serializeToString(node);
    });
    
    return result;
  }
} 