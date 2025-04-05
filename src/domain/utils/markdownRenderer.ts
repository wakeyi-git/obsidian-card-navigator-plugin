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
  private static instance: MarkdownRenderer;
  private tempEl: HTMLElement;
  private renderCache: Map<string, string> = new Map();
  private component: Component;

  constructor(private app: App) {
    // 임시 렌더링 컨테이너 생성
    this.tempEl = document.createElement('div');
    this.tempEl.className = 'markdown-renderer-temp';
    this.tempEl.style.position = 'absolute';
    this.tempEl.style.left = '-9999px';
    this.tempEl.style.top = '-9999px';
    document.body.appendChild(this.tempEl);
    
    // Obsidian 렌더링에 필요한 컴포넌트 인스턴스 생성
    this.component = new Component();
  }
  
  /**
   * 마크다운 텍스트를 HTML로 렌더링
   * @param markdown 마크다운 텍스트
   * @param options 렌더링 옵션
   */
  async render(
    markdown: string, 
    options: { 
      showImages?: boolean; 
      highlightCode?: boolean; 
      supportCallouts?: boolean; 
      supportMath?: boolean;
    } = {}
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
      
      // 렌더링 컨테이너 정리
      this.tempEl.empty();
      
      // 이미지 처리 옵션 적용
      let processedMarkdown = markdown;
      if (!options.showImages) {
        // 이미지 링크를 텍스트로 변환
        processedMarkdown = this.removeImageLinks(processedMarkdown);
      }
      
      // 코드 하이라이팅 옵션 설정
      const renderOptions = {
        highlighting: options.highlightCode !== false
      };
      
      // 렌더링 프로미스 생성
      const renderPromise = new Promise<string>(async (resolve, reject) => {
        try {
          // Obsidian 마크다운 렌더링 - deprecated된 메소드 대신 새 메소드 사용
          await ObsidianMarkdownRenderer.render(
            this.app,
            processedMarkdown,
            this.tempEl,
            '',
            this.component,
          );
          
          // 렌더링 후처리
          // Callout 지원 옵션에 따라 처리
          if (options.supportCallouts !== false) {
            this.processCallouts(this.tempEl);
          }
          
          // MathJax 수식 지원 옵션에 따라 처리
          if (options.supportMath !== false) {
            this.processMathExpressions(this.tempEl);
          }
          
          // 결과 추출 - innerHTML을 직접 사용하지 않고 노드 복제 방식으로 전환
          const content = this.serializeElementContent(this.tempEl);
          
          // 캐시에 결과 저장
          this.renderCache.set(cacheKey, content);
          
          // 렌더링 결과 추출 후 임시 요소 내용 비우기
          this.tempEl.empty();
          
          resolve(content);
        } catch (error) {
          reject(error);
        }
      });
      
      // 타임아웃 적용 (10초 후 렌더링 실패로 간주)
      const timeoutPromise = new Promise<string>((resolve) => {
        setTimeout(() => {
          // 안전한 방식으로 타임아웃 메시지 생성
          const timeoutContent = this.createTimeoutMessage(markdown);
          resolve(timeoutContent);
        }, 10000);
      });
      
      // 레이스 - 먼저 완료되는 프로미스 반환
      return Promise.race([renderPromise, timeoutPromise]);
    } catch (error) {
      console.error('마크다운 렌더링 실패:', error);
      // 안전한 방식으로 에러 메시지 생성
      return this.createErrorMessage(error instanceof Error ? error.message : String(error));
    }
  }
  
  /**
   * 캐시 키 생성
   */
  private generateCacheKey(markdown: string, options: any): string {
    // 옵션을 문자열로 변환하여 캐시 키 생성
    const optionsKey = JSON.stringify(options);
    return `${markdown.substring(0, 100)}:${optionsKey}`;
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
   * 렌더러 정리
   */
  dispose(): void {
    // 임시 요소 제거
    if (this.tempEl && this.tempEl.parentNode) {
      this.tempEl.parentNode.removeChild(this.tempEl);
    }
    this.renderCache.clear();
  }
  
  /**
   * 타임아웃 메시지 생성
   */
  private createTimeoutMessage(markdown: string): string {
    const tempContainer = document.createElement('div');
    tempContainer.className = 'markdown-render-timeout';
    
    const textContent = `렌더링 시간 초과: ${markdown.substring(0, 100)}${markdown.length > 100 ? '...' : ''}`;
    tempContainer.textContent = textContent;
    
    return this.serializeElementContent(tempContainer);
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