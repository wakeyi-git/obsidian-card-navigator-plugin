import { TFile, Component, App } from 'obsidian';
import { CardRenderOptions } from '../../../core/types/card.types';

/**
 * 카드 푸터 컴포넌트 클래스
 * 카드의 푸터 부분을 생성하고 관리합니다.
 */
export class CardFooter extends Component {
  /**
   * 푸터 요소
   */
  private element: HTMLElement;
  
  /**
   * 태그 컨테이너 요소
   */
  private tagContainer: HTMLElement;
  
  /**
   * 파일 객체
   */
  private file: TFile;
  
  /**
   * 태그 목록
   */
  private tags: string[];
  
  /**
   * 렌더링 옵션
   */
  private renderOptions: CardRenderOptions;
  
  /**
   * 앱 인스턴스
   */
  private app: App;
  
  /**
   * 태그 핸들러 관리를 위한 속성 추가
   */
  private tagHandlers: Map<string, { element: HTMLElement; handler: EventListener }> = new Map();
  
  /**
   * 카드 푸터 컴포넌트 생성자
   * @param file 파일 객체
   * @param tags 태그 목록
   * @param renderOptions 렌더링 옵션
   * @param app 앱 인스턴스
   */
  constructor(file: TFile, tags: string[], renderOptions: CardRenderOptions, app: App) {
    super();
    this.file = file;
    this.tags = tags || [];
    this.renderOptions = renderOptions;
    this.app = app;
    
    this.element = this.createFooterElement();
    this.tagContainer = this.createTagContainer();
    
    this.element.appendChild(this.tagContainer);
    
    // 태그 렌더링
    this.renderTags();
  }
  
  /**
   * 푸터 요소 가져오기
   * @returns 푸터 HTML 요소
   */
  getElement(): HTMLElement {
    return this.element;
  }
  
  /**
   * 태그 업데이트
   * @param newTags 새 태그 목록
   */
  updateTags(newTags: string[]): void {
    this.tags = newTags || [];
    this.renderTags();
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
    
    // 태그 폰트 크기 업데이트
    this.tagContainer.style.fontSize = `${this.renderOptions.tagsFontSize}px`;
    
    // 태그 다시 렌더링
    this.renderTags();
  }
  
  /**
   * 푸터 요소 생성
   * @returns 푸터 HTML 요소
   */
  private createFooterElement(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'card-footer';
    
    return footer;
  }
  
  /**
   * 태그 컨테이너 생성
   * @returns 태그 컨테이너 HTML 요소
   */
  private createTagContainer(): HTMLElement {
    const tagContainer = document.createElement('div');
    tagContainer.className = 'card-tags';
    
    // 태그 폰트 크기 설정
    tagContainer.style.fontSize = `${this.renderOptions.tagsFontSize}px`;
    
    return tagContainer;
  }
  
  /**
   * 태그 렌더링
   */
  private renderTags(): void {
    // 기존 태그 핸들러 정리
    this.clearTagHandlers();
    
    // 태그 컨테이너 초기화
    this.tagContainer.replaceChildren();
    
    // 태그가 없는 경우 처리
    if (!this.tags || this.tags.length === 0) {
      if (this.renderOptions.showEmptyTagsMessage) {
        const emptyMessage = document.createElement('span');
        emptyMessage.className = 'card-tags-empty';
        emptyMessage.textContent = '태그 없음';
        this.tagContainer.appendChild(emptyMessage);
      }
      return;
    }
    
    // 태그 수 제한
    const displayTags = this.renderOptions.maxTagCount > 0 && this.tags.length > this.renderOptions.maxTagCount
      ? this.tags.slice(0, this.renderOptions.maxTagCount)
      : this.tags;
    
    // 태그 요소 생성 및 추가
    const fragment = document.createDocumentFragment();
    displayTags.forEach(tag => {
      const tagElement = this.createTagElement(tag);
      fragment.appendChild(tagElement);
    });
    
    // 추가 태그가 있는 경우 표시
    if (this.renderOptions.maxTagCount > 0 && this.tags.length > this.renderOptions.maxTagCount) {
      const moreTagsElement = document.createElement('span');
      moreTagsElement.className = 'card-tag card-tag-more';
      moreTagsElement.textContent = `+${this.tags.length - this.renderOptions.maxTagCount}`;
      fragment.appendChild(moreTagsElement);
    }
    
    this.tagContainer.appendChild(fragment);
  }
  
  /**
   * 태그 요소 생성
   * @param tag 태그 문자열
   * @returns 태그 HTML 요소
   */
  private createTagElement(tag: string): HTMLElement {
    const tagElement = document.createElement('span');
    tagElement.className = 'card-tag';
    
    // 태그 텍스트 설정 (# 접두사 추가)
    const tagText = tag.startsWith('#') ? tag : `#${tag}`;
    tagElement.textContent = tagText;
    
    // 태그 색상 설정
    if (this.renderOptions.useTagColors) {
      const tagColor = this.getTagColor(tag);
      tagElement.style.backgroundColor = tagColor;
      tagElement.style.color = this.getContrastColor(tagColor);
    }
    
    // 태그 클릭 이벤트
    const handleClick: EventListener = ((event: Event) => {
      event.stopPropagation();
      if (event instanceof MouseEvent) {
        this.handleTagClick(tag, event);
      }
    });
    
    tagElement.addEventListener('click', handleClick);
    
    // 이벤트 핸들러 참조 저장
    const handlerId = this.generateHandlerId(tag);
    this.tagHandlers.set(handlerId, { element: tagElement, handler: handleClick });
    tagElement.dataset.tagHandler = handlerId;
    
    return tagElement;
  }
  
  /**
   * 태그 핸들러 ID 생성
   * @param tag 태그 문자열
   * @returns 핸들러 ID
   */
  private generateHandlerId(tag: string): string {
    return `tag-handler-${tag}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 태그 핸들러 정리
   */
  private clearTagHandlers(): void {
    this.tagHandlers.forEach(({ element, handler }) => {
      element.removeEventListener('click', handler);
    });
    this.tagHandlers.clear();
  }
  
  /**
   * 태그 클릭 이벤트 처리
   * @param tag 클릭된 태그
   * @param event 클릭 이벤트
   */
  private handleTagClick(tag: string, event: MouseEvent): void {
    const customEvent = new CustomEvent('tag-click', {
      detail: {
        tag: tag,
        originalEvent: event
      },
      bubbles: true
    });
    
    this.element.dispatchEvent(customEvent);
  }
  
  /**
   * 태그 색상 가져오기
   * @param tag 태그 문자열
   * @returns 태그 색상 (CSS 색상 문자열)
   */
  private getTagColor(tag: string): string {
    // 태그 색상 매핑이 있는 경우 사용
    if (this.renderOptions.tagColorMap && this.renderOptions.tagColorMap[tag]) {
      return this.renderOptions.tagColorMap[tag];
    }
    
    // 없는 경우 태그 문자열 기반으로 색상 생성
    return this.generateTagColor(tag);
  }
  
  /**
   * 태그 색상 생성
   * @param tag 태그 문자열
   * @returns 생성된 색상 (CSS 색상 문자열)
   */
  private generateTagColor(tag: string): string {
    // 태그 문자열에서 해시 코드 생성
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // HSL 색상 생성 (색상만 다양하게, 채도와 명도는 고정)
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 65%)`;
  }
  
  /**
   * 배경색에 따른 대비 텍스트 색상 가져오기
   * @param backgroundColor 배경 색상
   * @returns 대비 텍스트 색상 (검정 또는 흰색)
   */
  private getContrastColor(backgroundColor: string): string {
    // HSL 색상에서 명도 추출
    let lightness = 65; // 기본값
    
    // HSL 형식 파싱
    const hslMatch = backgroundColor.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
    if (hslMatch) {
      lightness = parseInt(hslMatch[3], 10);
    }
    
    // 명도가 높으면 어두운 텍스트, 낮으면 밝은 텍스트
    return lightness > 60 ? '#000000' : '#ffffff';
  }

  /**
   * 컴포넌트 언로드
   */
  onunload(): void {
    this.clearTagHandlers();
    this.element.remove();
    super.onunload();
  }
} 