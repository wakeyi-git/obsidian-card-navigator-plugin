import { MarkdownRenderer, TFile, Component, App } from 'obsidian';
import { CardRenderOptions } from '../../../core/types/card.types';

/**
 * 카드 본문 컴포넌트 클래스
 * 카드의 본문 부분을 생성하고 관리합니다.
 */
export class CardBody extends Component {
  /**
   * 본문 요소
   */
  private element: HTMLElement;
  
  /**
   * 본문 내용
   */
  private content: string;
  
  /**
   * 파일 객체
   */
  private file: TFile;
  
  /**
   * 렌더링 옵션
   */
  private renderOptions: CardRenderOptions;
  
  /**
   * 앱 인스턴스
   */
  private app: App;
  
  /**
   * 카드 본문 컴포넌트 생성자
   * @param file 파일 객체
   * @param content 본문 내용
   * @param renderOptions 렌더링 옵션
   * @param app 앱 인스턴스
   */
  constructor(file: TFile, content: string, renderOptions: CardRenderOptions, app: App) {
    super();
    this.file = file;
    this.content = content;
    this.renderOptions = renderOptions;
    this.app = app;
    
    this.element = this.createBodyElement();
  }
  
  /**
   * 본문 요소 가져오기
   * @returns 본문 HTML 요소
   */
  getElement(): HTMLElement {
    return this.element;
  }
  
  /**
   * 본문 내용 업데이트
   * @param newContent 새 본문 내용
   */
  updateContent(newContent: string): void {
    this.content = newContent;
    this.render();
  }
  
  /**
   * 파일 업데이트
   * @param newFile 새 파일 객체
   */
  updateFile(newFile: TFile): void {
    this.file = newFile;
  }
  
  /**
   * 렌더링 옵션 업데이트
   * @param newOptions 새 렌더링 옵션
   */
  updateRenderOptions(newOptions: CardRenderOptions): void {
    this.renderOptions = newOptions;
    
    // 본문 폰트 크기 업데이트
    this.element.style.fontSize = `${this.renderOptions.bodyFontSize}px`;
    
    // 내용 다시 렌더링
    this.render();
  }
  
  /**
   * 본문 렌더링
   */
  private render = async (): Promise<void> => {
    // 본문 내용 초기화
    this.element.replaceChildren();
    
    // 내용이 없는 경우 처리
    if (!this.content || this.content.trim() === '') {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'card-body-empty';
      emptyMessage.textContent = '내용 없음';
      this.element.appendChild(emptyMessage);
      return;
    }
    
    // 본문 내용 제한
    let displayContent = this.content;
    if (this.renderOptions.maxBodyLength > 0 && displayContent.length > this.renderOptions.maxBodyLength) {
      displayContent = displayContent.substring(0, this.renderOptions.maxBodyLength) + '...';
    }
    
    // 마크다운 렌더링 여부에 따라 처리
    if (this.renderOptions.renderMarkdown) {
      await this.renderMarkdown(displayContent);
    } else {
      this.renderPlainText(displayContent);
    }
  };
  
  /**
   * 본문 요소 생성
   * @returns 본문 HTML 요소
   */
  private createBodyElement(): HTMLElement {
    const body = document.createElement('div');
    body.className = 'card-body';
    
    // 본문 폰트 크기 설정
    body.style.fontSize = `${this.renderOptions.bodyFontSize}px`;
    
    // 내용 렌더링
    this.render();
    
    return body;
  }
  
  /**
   * 마크다운 렌더링
   * @param content 렌더링할 내용
   */
  private async renderMarkdown(content: string): Promise<void> {
    try {
      // 마크다운 렌더링을 위한 컨테이너
      const markdownContainer = document.createElement('div');
      markdownContainer.className = 'card-markdown-content';
      
      // Obsidian의 마크다운 렌더러 사용
      await MarkdownRenderer.renderMarkdown(
        content,
        markdownContainer,
        this.file.path,
        this
      );
      
      // 렌더링된 내용 추가
      this.element.appendChild(markdownContainer);
      
      // 이미지 처리
      this.processImages();
      
      // 링크 처리
      this.processLinks();
      
    } catch (error) {
      // 마크다운 렌더링 실패 시 일반 텍스트로 표시
      console.error('마크다운 렌더링 실패:', error);
      this.renderPlainText(content);
    }
  }
  
  /**
   * 일반 텍스트 렌더링
   * @param content 렌더링할 내용
   */
  private renderPlainText(content: string): void {
    const textContainer = document.createElement('div');
    textContainer.className = 'card-text-content';
    textContainer.textContent = content;
    
    this.element.appendChild(textContainer);
  }
  
  /**
   * 이미지 처리
   * 카드 내 이미지 크기 조정 및 로딩 최적화
   */
  private processImages(): void {
    const images = this.element.querySelectorAll('img');
    
    images.forEach(img => {
      // 이미지 로딩 지연
      img.loading = 'lazy';
      
      // 이미지 크기 제한
      img.style.maxWidth = '100%';
      img.style.maxHeight = '150px'; // 최대 높이 제한
      
      // 이미지 클릭 이벤트 (확대 보기 등)
      img.addEventListener('click', this.handleImageClick);
      
      // 이미지 로드 오류 처리
      img.onerror = () => {
        img.alt = '이미지 로드 실패';
        img.style.display = 'none';
        
        const errorText = document.createElement('span');
        errorText.className = 'card-image-error';
        errorText.textContent = '이미지 로드 실패';
        img.parentNode?.appendChild(errorText);
      };
    });
  }
  
  /**
   * 링크 처리
   * 카드 내 링크 클릭 이벤트 처리
   */
  private processLinks(): void {
    const links = this.element.querySelectorAll('a');
    
    links.forEach(link => {
      // 링크 클릭 이벤트
      link.addEventListener('click', this.handleLinkClick);
    });
  }

  /**
   * 컴포넌트 언로드
   * 이벤트 리스너 제거 및 정리 작업 수행
   */
  onunload(): void {
    // 이미지 이벤트 리스너 제거
    const images = this.element.querySelectorAll('img');
    images.forEach(img => {
      img.removeEventListener('click', this.handleImageClick);
    });
    
    // 링크 이벤트 리스너 제거
    const links = this.element.querySelectorAll('a');
    links.forEach(link => {
      link.removeEventListener('click', this.handleLinkClick);
    });
    
    // DOM에서 제거
    this.element.remove();
    
    super.onunload();
  }

  /**
   * 이미지 클릭 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleImageClick = (event: MouseEvent): void => {
    event.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    
    const img = event.target as HTMLImageElement;
    if (!img) return;
    
    // 이미지 클릭 시 동작 구현
    // 예: 이미지 확대 보기, 갤러리 열기 등
    const customEvent = new CustomEvent('image-click', {
      detail: {
        src: img.src,
        alt: img.alt,
        originalEvent: event
      },
      bubbles: true
    });
    
    this.element.dispatchEvent(customEvent);
  };

  /**
   * 링크 클릭 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleLinkClick = (event: MouseEvent): void => {
    event.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    
    const link = event.target as HTMLAnchorElement;
    if (!link) return;
    
    // 내부 링크인 경우 (옵시디언 내부 파일 링크)
    if (link.hasClass('internal-link')) {
      // 기본 동작 유지 (옵시디언이 처리)
    } 
    // 외부 링크인 경우
    else {
      // 외부 링크 처리 (필요시 구현)
      const customEvent = new CustomEvent('external-link-click', {
        detail: {
          href: link.href,
          originalEvent: event
        },
        bubbles: true
      });
      
      this.element.dispatchEvent(customEvent);
    }
  };
} 