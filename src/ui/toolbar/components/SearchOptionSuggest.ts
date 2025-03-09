import { App, AbstractInputSuggest } from 'obsidian';

/**
 * 검색 옵션 인터페이스
 */
export interface SearchOption {
  type: string;
  label: string;
  description: string;
  prefix: string;
  frontmatterKey?: string; // 프론트매터 검색 시 사용할 키
}

/**
 * 검색 옵션 제안 클래스
 * Obsidian의 AbstractInputSuggest API를 사용하여 구현
 */
export class SearchOptionSuggest extends AbstractInputSuggest<SearchOption> {
  private options: SearchOption[];
  private onSelectCallback: (option: SearchOption, evt: MouseEvent | KeyboardEvent) => void;
  private inputElement: HTMLInputElement;
  private isOpen = false;
  
  // 싱글톤 인스턴스
  private static instance: SearchOptionSuggest | null = null;
  
  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(
    app: App, 
    inputEl: HTMLInputElement, 
    options: SearchOption[],
    onSelect: (option: SearchOption, evt: MouseEvent | KeyboardEvent) => void
  ): SearchOptionSuggest {
    if (!this.instance) {
      this.instance = new SearchOptionSuggest(app, inputEl, options);
      this.instance.onSelect(onSelect);
    } else {
      // 기존 인스턴스의 속성 업데이트
      this.instance.updateOptions(options);
      this.instance.onSelect(onSelect);
      this.instance.inputElement = inputEl;
    }
    return this.instance;
  }
  
  constructor(
    app: App, 
    inputEl: HTMLInputElement, 
    options: SearchOption[]
  ) {
    super(app, inputEl);
    this.options = options;
    this.inputElement = inputEl;
    this.limit = 10; // 한 번에 표시할 최대 제안 수
    
    // 기본 콜백 설정 (나중에 onSelect로 재정의 가능)
    this.onSelectCallback = (option, _evt) => {
      console.log('기본 콜백 호출됨:', option.type);
    };
  }
  
  /**
   * 검색 옵션 업데이트
   */
  updateOptions(options: SearchOption[]): void {
    this.options = options;
  }
  
  /**
   * 검색어에 따라 제안 목록 필터링
   */
  getSuggestions(query: string): SearchOption[] {
    // 항상 모든 옵션 반환 (검색어가 비어있을 때도)
    if (!query || query.trim() === '') {
      return this.options;
    }
    
    // 검색어가 있으면 필터링
    const lowerCaseQuery = query.toLowerCase();
    const filtered = this.options.filter(option => 
      option.label.toLowerCase().includes(lowerCaseQuery) || 
      option.description.toLowerCase().includes(lowerCaseQuery) ||
      option.prefix.toLowerCase().includes(lowerCaseQuery)
    );
    
    return filtered.length > 0 ? filtered : this.options;
  }
  
  /**
   * 제안 항목 렌더링
   */
  renderSuggestion(option: SearchOption, el: HTMLElement): void {
    // 제안 항목 컨테이너
    const titleEl = el.createDiv();
    
    // 접두사 (강조 표시)
    titleEl.createSpan({
      text: option.prefix,
      cls: 'search-option-prefix'
    });
    
    // 레이블
    titleEl.createSpan({
      text: ` ${option.label}`
    });
    
    // 설명 추가
    el.createDiv({
      text: option.description,
      cls: 'search-option-description'
    });
  }
  
  /**
   * 선택 콜백 등록 (Obsidian API 준수)
   */
  onSelect(callback: (option: SearchOption, evt: MouseEvent | KeyboardEvent) => void): this {
    this.onSelectCallback = callback;
    return this;
  }
  
  /**
   * 제안 항목 선택 시 처리 (Obsidian API 오버라이드)
   */
  selectSuggestion(option: SearchOption, evt: MouseEvent | KeyboardEvent): void {
    // 검색 옵션 접두사 생성
    let insertText = option.prefix;
    
    // 옵션 타입에 따라 접두사 형식 조정
    if (option.type === 'frontmatter') {
      insertText += ']:'; // 프론트매터 검색의 경우 닫는 괄호와 콜론 추가
    } else if (option.type === 'filename' || option.type === 'path') {
      insertText += '"'; // 파일명과 경로 검색의 경우 큰따옴표 추가
    }
    
    // 마우스 이벤트와 키보드 이벤트 구분 처리
    if (evt instanceof MouseEvent) {
      // 마우스 이벤트일 때는 직접 DOM 요소 조작
      if (this.inputElement) {
        // 입력 필드에 값 직접 설정
        this.inputElement.value = insertText;
        
        // 커서 위치 조정
        const newCursorPosition = option.type === 'frontmatter' ? insertText.length - 2 : insertText.length;
        this.inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
        
        // 입력 이벤트 발생시켜 React 상태 업데이트
        const inputEvent = new Event('input', { bubbles: true });
        this.inputElement.dispatchEvent(inputEvent);
        
        // 변경 이벤트 발생시켜 React 상태 업데이트
        const changeEvent = new Event('change', { bubbles: true });
        this.inputElement.dispatchEvent(changeEvent);
      }
    } else {
      // 키보드 이벤트일 때는 setValue 메서드 사용
      this.setValue(insertText);
    }
    
    // 제안 창 닫기
    this.close();
    
    // 콜백 함수 호출
    this.onSelectCallback(option, evt);
    
    // 입력 필드에 포커스
    this.inputElement.focus();
  }
  
  /**
   * 제안 창 열기 오버라이드
   */
  open(): void {
    // 이미 열려있으면 다시 열지 않음
    if (this.isOpen) {
      return;
    }
    
    // 부모 클래스의 open 메서드 호출
    super.open();
    this.isOpen = true;
  }
  
  /**
   * 제안 창 닫기 오버라이드
   */
  close(): void {
    super.close();
    this.isOpen = false;
  }
}