import { App, AbstractInputSuggest } from 'obsidian';

/**
 * 검색 옵션 인터페이스
 */
export interface SearchOption {
  type: string;
  label: string;
  description: string;
  prefix: string;
}

/**
 * 검색 옵션 제안 클래스
 * Obsidian의 AbstractInputSuggest API를 사용하여 구현
 */
export class SearchOptionSuggest extends AbstractInputSuggest<SearchOption> {
  private options: SearchOption[];
  private onSelectCallback: (option: SearchOption) => void;
  private inputElement: HTMLInputElement;
  
  constructor(
    app: App, 
    inputEl: HTMLInputElement, 
    options: SearchOption[],
    onSelect: (option: SearchOption) => void
  ) {
    super(app, inputEl);
    this.options = options;
    this.onSelectCallback = onSelect;
    this.inputElement = inputEl;
    this.limit = 10; // 한 번에 표시할 최대 제안 수
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
    console.log('getSuggestions 호출됨, 쿼리:', query);
    
    // 항상 모든 옵션 반환 (검색어가 비어있을 때도)
    if (!query || query.trim() === '') {
      console.log('검색어가 비어있어 모든 옵션 반환:', this.options.length);
      return this.options;
    }
    
    // 검색어가 있으면 필터링
    const lowerCaseQuery = query.toLowerCase();
    const filtered = this.options.filter(option => 
      option.label.toLowerCase().includes(lowerCaseQuery) || 
      option.description.toLowerCase().includes(lowerCaseQuery) ||
      option.prefix.toLowerCase().includes(lowerCaseQuery)
    );
    
    console.log('필터링된 옵션 수:', filtered.length);
    return filtered.length > 0 ? filtered : this.options;
  }
  
  /**
   * 제안 항목 렌더링
   */
  renderSuggestion(option: SearchOption, el: HTMLElement): void {
    console.log('renderSuggestion 호출됨, 옵션:', option.type);
    
    // 컨테이너에 플러그인 고유 클래스 추가
    el.addClass('card-navigator-suggestion-item');
    
    // 제목 영역 (아이콘 없이 접두사와 레이블만 포함)
    const titleEl = el.createDiv({ cls: 'card-navigator-suggestion-title' });
    
    // 접두사와 레이블을 하나의 요소로 통합
    titleEl.createSpan({ 
      cls: 'card-navigator-suggestion-label',
      text: `${option.prefix} ${option.label}`
    });
    
    // 설명 추가 (간결하게)
    el.createDiv({ 
      cls: 'card-navigator-suggestion-description',
      text: option.description
    });
  }
  
  /**
   * 제안 항목 선택 시 처리
   */
  selectSuggestion(option: SearchOption, evt: MouseEvent | KeyboardEvent): void {
    // 콜백 함수 호출
    this.onSelectCallback(option);
    
    // 입력 필드 포커스
    this.inputElement.focus();
    
    // 제안 창 닫기
    this.close();
  }
  
  /**
   * 제안 창 열기 오버라이드
   */
  open(): void {
    console.log('open 메서드 호출됨');
    
    // 부모 클래스의 open 메서드 호출
    super.open();
    
    // 포커스 인디케이터 제거 및 키보드 이벤트 처리 개선
    setTimeout(() => {
      console.log('제안 창 스타일 적용 시도');
      const containers = document.querySelectorAll('.suggestion-container');
      console.log('발견된 제안 컨테이너 수:', containers.length);
      
      containers.forEach(container => {      
        // 타입 캐스팅
        const containerEl = container as HTMLElement;
        
        // 플러그인 고유 클래스 추가
        containerEl.classList.add('card-navigator-suggestion-container');
        
        // 입력 필드의 너비와 동일하게 설정
        if (this.inputElement) {
          const inputRect = this.inputElement.getBoundingClientRect();
          containerEl.style.width = `${inputRect.width}px`;
          containerEl.style.minWidth = `${inputRect.width}px`;
          containerEl.style.maxWidth = `${inputRect.width}px`;
          
          // 위치 조정 (입력 필드 바로 아래)
          containerEl.style.left = `${inputRect.left}px`;
          
          console.log('제안 창 너비 설정:', inputRect.width);
        }
      });
    }, 50);
  }
}