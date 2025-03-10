import { SearchService } from '../../services/SearchService';
import { ISearchSuggestion, SearchType } from '../../domain/search/Search';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';

/**
 * 검색 뷰 컴포넌트
 * 검색 UI를 담당합니다.
 */
export class SearchView {
  /**
   * 검색 서비스
   */
  private searchService: SearchService;
  
  /**
   * 이벤트 버스
   */
  private eventBus: DomainEventBus;
  
  /**
   * 컨테이너 요소
   */
  private container: HTMLElement | null = null;
  
  /**
   * 검색 입력 요소
   */
  private searchInput: HTMLInputElement | null = null;
  
  /**
   * 제안 목록 요소
   */
  private suggestionList: HTMLElement | null = null;
  
  /**
   * 현재 제안 목록
   */
  private suggestions: ISearchSuggestion[] = [];
  
  /**
   * 선택된 제안 인덱스
   */
  private selectedIndex: number = -1;
  
  /**
   * 생성자
   * @param searchService 검색 서비스
   */
  constructor(searchService: SearchService) {
    this.searchService = searchService;
    this.eventBus = DomainEventBus.getInstance();
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 검색 변경 이벤트 리스너
    this.eventBus.on(EventType.SEARCH_CHANGED, (data) => {
      this.updateSearchInput(data.query);
    });
  }
  
  /**
   * 검색 입력 업데이트
   * @param query 검색어
   */
  private updateSearchInput(query: string): void {
    if (this.searchInput) {
      this.searchInput.value = query;
    }
  }
  
  /**
   * 컴포넌트 렌더링
   * @param container 컨테이너 요소
   */
  render(container: HTMLElement): void {
    this.container = container;
    
    // 컨테이너 초기화
    container.empty();
    container.addClass('card-navigator-search-container');
    
    // 검색 입력 생성
    this.createSearchInput(container);
    
    // 제안 목록 생성
    this.createSuggestionList(container);
  }
  
  /**
   * 검색 입력 생성
   * @param container 컨테이너 요소
   */
  private createSearchInput(container: HTMLElement): void {
    const searchContainer = container.createDiv({ cls: 'card-navigator-search-input-container' });
    
    // 검색 아이콘
    const searchIcon = searchContainer.createDiv({ cls: 'card-navigator-search-icon' });
    searchIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
    
    // 검색 입력
    this.searchInput = searchContainer.createEl('input', {
      cls: 'card-navigator-search-input',
      attr: {
        type: 'text',
        placeholder: '검색어 입력...'
      }
    });
    
    // 검색 입력 이벤트 리스너
    this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
    this.searchInput.addEventListener('keydown', this.handleSearchKeydown.bind(this));
    
    // 검색 버튼
    const searchButton = searchContainer.createDiv({ cls: 'card-navigator-search-button' });
    searchButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-right"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
    searchButton.addEventListener('click', this.handleSearchButtonClick.bind(this));
    
    // 초기 검색어 설정
    const currentQuery = this.searchService.getCurrentQuery();
    if (currentQuery) {
      this.searchInput.value = currentQuery;
    }
  }
  
  /**
   * 제안 목록 생성
   * @param container 컨테이너 요소
   */
  private createSuggestionList(container: HTMLElement): void {
    this.suggestionList = container.createDiv({ cls: 'card-navigator-suggestion-list' });
    this.suggestionList.style.display = 'none';
  }
  
  /**
   * 검색 입력 처리
   * @param event 입력 이벤트
   */
  private async handleSearchInput(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const query = input.value;
    
    // 제안 목록 가져오기
    this.suggestions = await this.searchService.getSuggestionsForInput(query);
    
    // 제안 목록 렌더링
    this.renderSuggestions();
  }
  
  /**
   * 검색 키 입력 처리
   * @param event 키 이벤트
   */
  private handleSearchKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        // 다음 제안 선택
        event.preventDefault();
        this.selectNextSuggestion();
        break;
        
      case 'ArrowUp':
        // 이전 제안 선택
        event.preventDefault();
        this.selectPreviousSuggestion();
        break;
        
      case 'Enter':
        // 제안 선택 또는 검색 실행
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.suggestions.length) {
          this.selectSuggestion(this.selectedIndex);
        } else {
          this.executeSearch();
        }
        break;
        
      case 'Escape':
        // 제안 목록 닫기
        event.preventDefault();
        this.hideSuggestions();
        break;
    }
  }
  
  /**
   * 검색 버튼 클릭 처리
   */
  private handleSearchButtonClick(): void {
    this.executeSearch();
  }
  
  /**
   * 제안 목록 렌더링
   */
  private renderSuggestions(): void {
    if (!this.suggestionList) return;
    
    // 제안 목록 초기화
    this.suggestionList.empty();
    
    // 제안이 없는 경우 숨기기
    if (this.suggestions.length === 0) {
      this.suggestionList.style.display = 'none';
      return;
    }
    
    // 제안 목록 표시
    this.suggestionList.style.display = 'block';
    
    // 제안 항목 생성
    this.suggestions.forEach((suggestion, index) => {
      const item = this.suggestionList!.createDiv({ cls: 'card-navigator-suggestion-item' });
      
      // 선택된 항목 스타일 적용
      if (index === this.selectedIndex) {
        item.addClass('selected');
      }
      
      // 제안 텍스트
      const textEl = item.createDiv({ cls: 'card-navigator-suggestion-text' });
      
      // 강조 표시가 있는 경우
      if (suggestion.highlightIndices && suggestion.highlightIndices.length > 0) {
        let lastIndex = 0;
        const text = suggestion.text;
        
        suggestion.highlightIndices.forEach(([start, end]) => {
          // 강조 전 텍스트
          if (start > lastIndex) {
            textEl.createSpan({ text: text.substring(lastIndex, start) });
          }
          
          // 강조 텍스트
          const highlightSpan = textEl.createSpan({
            cls: 'card-navigator-suggestion-highlight',
            text: text.substring(start, end)
          });
          
          lastIndex = end;
        });
        
        // 남은 텍스트
        if (lastIndex < text.length) {
          textEl.createSpan({ text: text.substring(lastIndex) });
        }
      } else {
        // 강조 없는 경우
        textEl.setText(suggestion.text);
      }
      
      // 제안 설명
      if (suggestion.description) {
        const descEl = item.createDiv({ cls: 'card-navigator-suggestion-description' });
        descEl.setText(suggestion.description);
      }
      
      // 클릭 이벤트
      item.addEventListener('click', () => {
        this.selectSuggestion(index);
      });
      
      // 마우스 오버 이벤트
      item.addEventListener('mouseover', () => {
        this.selectedIndex = index;
        this.renderSuggestions();
      });
    });
  }
  
  /**
   * 다음 제안 선택
   */
  private selectNextSuggestion(): void {
    if (this.suggestions.length === 0) return;
    
    this.selectedIndex = (this.selectedIndex + 1) % this.suggestions.length;
    this.renderSuggestions();
  }
  
  /**
   * 이전 제안 선택
   */
  private selectPreviousSuggestion(): void {
    if (this.suggestions.length === 0) return;
    
    this.selectedIndex = (this.selectedIndex - 1 + this.suggestions.length) % this.suggestions.length;
    this.renderSuggestions();
  }
  
  /**
   * 제안 선택
   * @param index 선택할 제안 인덱스
   */
  private selectSuggestion(index: number): void {
    if (index < 0 || index >= this.suggestions.length) return;
    
    const suggestion = this.suggestions[index];
    
    // 검색 입력 업데이트
    if (this.searchInput) {
      this.searchInput.value = suggestion.text;
      this.searchInput.focus();
    }
    
    // 제안 목록 숨기기
    this.hideSuggestions();
    
    // 검색 상태 업데이트
    this.searchService.setSearchState(suggestion.text, suggestion.type, false);
  }
  
  /**
   * 제안 목록 숨기기
   */
  private hideSuggestions(): void {
    if (this.suggestionList) {
      this.suggestionList.style.display = 'none';
    }
    
    this.selectedIndex = -1;
  }
  
  /**
   * 검색 실행
   */
  private executeSearch(): void {
    if (!this.searchInput) return;
    
    const query = this.searchInput.value;
    if (!query) return;
    
    // 검색 타입 추출
    const searchTypeMatch = this.extractSearchType(query);
    const searchType = searchTypeMatch ? searchTypeMatch.type : 'filename';
    const actualQuery = searchTypeMatch ? searchTypeMatch.query : query;
    
    // 검색 실행
    this.searchService.search(actualQuery, searchType);
    
    // 제안 목록 숨기기
    this.hideSuggestions();
  }
  
  /**
   * 검색 타입 추출
   * @param query 검색어
   * @returns 검색 타입과 실제 검색어
   */
  private extractSearchType(query: string): { type: SearchType, query: string } | null {
    // 검색 타입 접두사 패턴
    const patterns = [
      { prefix: 'path:', type: 'path' as SearchType },
      { prefix: 'file:', type: 'file' as SearchType },
      { prefix: 'tag:', type: 'tag' as SearchType },
      { prefix: 'content:', type: 'content' as SearchType },
      { prefix: 'create:', type: 'create' as SearchType },
      { prefix: 'modify:', type: 'modify' as SearchType }
    ];
    
    // 접두사 확인
    for (const pattern of patterns) {
      if (query.startsWith(pattern.prefix)) {
        const actualQuery = query.substring(pattern.prefix.length);
        return { type: pattern.type, query: actualQuery };
      }
    }
    
    // 프론트매터 검색 패턴 확인
    const frontmatterMatch = query.match(/\[([^\]]*)\](.*)/);
    if (frontmatterMatch) {
      const key = frontmatterMatch[1];
      const value = frontmatterMatch[2].trim();
      
      return {
        type: 'frontmatter' as SearchType,
        query: value ? `${key}:${value}` : key
      };
    }
    
    return null;
  }
} 