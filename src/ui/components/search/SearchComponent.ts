import { Component } from '../Component';
import { ISearchService } from '../../../application/search/SearchService';
import { ISearchSuggestionService } from '../../../application/search/SearchSuggestionService';
import { ISearchHistoryService } from '../../../application/search/SearchHistoryService';
import { SearchType, SearchScope, ISearchSuggestion } from '../../../domain/search/Search';
import { IToolbarItem } from '../../../application/toolbar/ToolbarService';
import { setIcon } from 'obsidian';
import { EventType } from '../../../domain/events/EventTypes';
import { DomainEventBus } from '../../../core/events/DomainEventBus';

/**
 * 검색 컴포넌트 인터페이스
 */
export interface ISearchComponent {
  /**
   * 검색 수행
   * @param query 검색어
   * @param searchType 검색 타입
   * @param scope 검색 범위
   */
  search(query: string, searchType?: SearchType, scope?: SearchScope): Promise<void>;
  
  /**
   * 검색어 설정
   * @param query 검색어
   */
  setQuery(query: string): void;
  
  /**
   * 검색 타입 설정
   * @param searchType 검색 타입
   */
  setSearchType(searchType: SearchType): void;
  
  /**
   * 검색 범위 설정
   * @param scope 검색 범위
   */
  setScope(scope: SearchScope): void;
  
  /**
   * 툴바용 검색 요소 생성
   * @param item 툴바 아이템
   * @param onValueChange 값 변경 콜백
   * @returns 생성된 HTML 요소
   */
  createToolbarSearchElement(item: IToolbarItem, onValueChange: (value: string) => void): HTMLElement;
  
  /**
   * 컴포넌트 요소 가져오기
   * @returns 컴포넌트 요소
   */
  getElement(): HTMLElement | null;
  
  /**
   * 컴포넌트 제거
   */
  remove(): void;
}

/**
 * 검색 컴포넌트
 * 검색 기능을 제공하는 컴포넌트입니다.
 */
export class SearchComponent extends Component implements ISearchComponent {
  private searchService: ISearchService;
  private suggestionService: ISearchSuggestionService;
  private historyService: ISearchHistoryService;
  private eventBus: DomainEventBus;
  private query = '';
  private searchType: SearchType = 'filename';
  private scope: SearchScope = 'current';
  private caseSensitive = false;
  private showSuggestions = false;
  private suggestions: ISearchSuggestion[] = [];
  private history: string[] = [];
  private inputElement: HTMLInputElement | null = null;
  private suggestionElement: HTMLElement | null = null;
  private toolbarInputElement: HTMLInputElement | null = null;
  
  /**
   * 생성자
   * @param searchService 검색 서비스
   * @param suggestionService 검색 제안 서비스
   * @param historyService 검색 히스토리 서비스
   */
  constructor(
    searchService: ISearchService,
    suggestionService: ISearchSuggestionService,
    historyService: ISearchHistoryService
  ) {
    super();
    this.searchService = searchService;
    this.suggestionService = suggestionService;
    this.historyService = historyService;
    this.eventBus = DomainEventBus.getInstance();
    this.loadHistory();
  }
  
  /**
   * 전역 이벤트 리스너 등록
   */
  private registerGlobalEventListeners(): void {
    // 검색어 변경 이벤트 리스너
    this.eventBus.on(EventType.SEARCH_QUERY_CHANGED, (data) => {
      this.setQuery(data.query);
      if (this.toolbarInputElement) {
        this.toolbarInputElement.focus();
      }
    });
  }
  
  /**
   * 검색 히스토리 로드
   */
  private loadHistory(): void {
    this.history = this.historyService.getHistory();
  }
  
  /**
   * 검색 수행
   * @param query 검색어
   * @param searchType 검색 타입
   * @param scope 검색 범위
   */
  async search(query: string, searchType: SearchType = this.searchType, scope: SearchScope = this.scope): Promise<void> {
    this.query = query;
    this.searchType = searchType;
    this.scope = scope;
    
    if (!query) {
      this.searchService.clearResults();
      return;
    }
    
    try {
      await this.searchService.search(query, searchType, scope);
      this.hideSuggestions();
      this.update();
      
      // 검색 히스토리에 추가
      this.historyService.addToHistory(query);
      this.loadHistory();
      
      // 검색 이벤트 발생
      this.eventBus.emit(EventType.SEARCH_CHANGED, {
        query,
        searchType,
        caseSensitive: this.caseSensitive
      });
    } catch (error) {
      console.error('검색 오류:', error);
    }
  }
  
  /**
   * 검색어 설정
   * @param query 검색어
   */
  setQuery(query: string): void {
    this.query = query;
    
    if (this.inputElement) {
      this.inputElement.value = query;
    }
    
    if (this.toolbarInputElement) {
      this.toolbarInputElement.value = query;
    }
    
    this.updateSuggestions();
  }
  
  /**
   * 검색 타입 설정
   * @param searchType 검색 타입
   */
  setSearchType(searchType: SearchType): void {
    this.searchType = searchType;
    this.updateSuggestions();
  }
  
  /**
   * 검색 범위 설정
   * @param scope 검색 범위
   */
  setScope(scope: SearchScope): void {
    this.scope = scope;
  }
  
  /**
   * 대소문자 구분 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): void {
    this.caseSensitive = caseSensitive;
  }
  
  /**
   * 검색 제안 업데이트
   */
  private async updateSuggestions(): Promise<void> {
    if (!this.query) {
      this.suggestions = [];
      this.hideSuggestions();
      return;
    }
    
    try {
      this.suggestions = await this.suggestionService.getSuggestions(
        this.query,
        this.searchType,
        this.caseSensitive
      );
      
      if (this.suggestions.length > 0) {
        this.showSuggestions = true;
        this.renderSuggestions();
      } else {
        this.hideSuggestions();
      }
    } catch (error) {
      console.error('검색 제안 오류:', error);
      this.hideSuggestions();
    }
  }
  
  /**
   * 검색 제안 표시
   */
  private renderSuggestions(): void {
    if (!this.suggestionElement) return;
    
    this.suggestionElement.innerHTML = '';
    this.suggestionElement.style.display = 'block';
    
    // 제안 목록 생성
    const suggestionList = document.createElement('ul');
    suggestionList.className = 'search-suggestions-list';
    
    // 제안 아이템 추가
    this.suggestions.forEach((suggestion, index) => {
      const suggestionItem = document.createElement('li');
      suggestionItem.className = 'search-suggestion-item';
      suggestionItem.textContent = suggestion.text || suggestion.toString();
      suggestionItem.dataset.index = index.toString();
      
      // 클릭 이벤트 추가
      suggestionItem.addEventListener('click', () => {
        this.setQuery(suggestion.text || suggestion.toString());
        this.search(suggestion.text || suggestion.toString());
      });
      
      suggestionList.appendChild(suggestionItem);
    });
    
    this.suggestionElement.appendChild(suggestionList);
  }
  
  /**
   * 검색 제안 숨기기
   */
  private hideSuggestions(): void {
    this.showSuggestions = false;
    
    if (this.suggestionElement) {
      this.suggestionElement.style.display = 'none';
    }
  }
  
  /**
   * 컴포넌트 생성
   * @returns 생성된 HTML 요소
   */
  protected async createComponent(): Promise<HTMLElement> {
    const searchElement = document.createElement('div');
    searchElement.className = 'card-navigator-search';
    
    // 검색 폼 생성
    const searchForm = document.createElement('form');
    searchForm.className = 'search-form';
    
    // 검색 입력 필드 생성
    const searchInput = document.createElement('input');
    searchInput.className = 'search-input';
    searchInput.type = 'text';
    searchInput.placeholder = '검색어 입력...';
    searchInput.value = this.query;
    this.inputElement = searchInput;
    
    // 검색 버튼 생성
    const searchButton = document.createElement('button');
    searchButton.className = 'search-button';
    searchButton.type = 'submit';
    searchButton.innerHTML = '<span class="search-icon">🔍</span>';
    
    // 검색 옵션 생성
    const searchOptions = document.createElement('div');
    searchOptions.className = 'search-options';
    
    // 검색 타입 선택 생성
    const searchTypeSelect = document.createElement('select');
    searchTypeSelect.className = 'search-type-select';
    
    const searchTypes: { value: SearchType; label: string }[] = [
      { value: 'filename', label: '파일명' },
      { value: 'content', label: '내용' },
      { value: 'tag', label: '태그' },
      { value: 'frontmatter', label: '프론트매터' }
    ];
    
    searchTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type.value;
      option.textContent = type.label;
      
      if (type.value === this.searchType) {
        option.selected = true;
      }
      
      searchTypeSelect.appendChild(option);
    });
    
    // 검색 범위 선택 생성
    const scopeSelect = document.createElement('select');
    scopeSelect.className = 'search-scope-select';
    
    const scopes: { value: SearchScope; label: string }[] = [
      { value: 'current', label: '현재 카드셋' },
      { value: 'all', label: '전체 볼트' }
    ];
    
    scopes.forEach(scope => {
      const option = document.createElement('option');
      option.value = scope.value;
      option.textContent = scope.label;
      
      if (scope.value === this.scope) {
        option.selected = true;
      }
      
      scopeSelect.appendChild(option);
    });
    
    // 대소문자 구분 체크박스 생성
    const caseSensitiveLabel = document.createElement('label');
    caseSensitiveLabel.className = 'case-sensitive-label';
    
    const caseSensitiveCheckbox = document.createElement('input');
    caseSensitiveCheckbox.type = 'checkbox';
    caseSensitiveCheckbox.className = 'case-sensitive-checkbox';
    caseSensitiveCheckbox.checked = this.caseSensitive;
    
    caseSensitiveLabel.appendChild(caseSensitiveCheckbox);
    caseSensitiveLabel.appendChild(document.createTextNode('대소문자 구분'));
    
    // 검색 제안 컨테이너 생성
    const suggestionContainer = document.createElement('div');
    suggestionContainer.className = 'search-suggestions';
    suggestionContainer.style.display = this.showSuggestions ? 'block' : 'none';
    this.suggestionElement = suggestionContainer;
    
    // 요소 조합
    searchOptions.appendChild(searchTypeSelect);
    searchOptions.appendChild(scopeSelect);
    searchOptions.appendChild(caseSensitiveLabel);
    
    searchForm.appendChild(searchInput);
    searchForm.appendChild(searchButton);
    
    searchElement.appendChild(searchForm);
    searchElement.appendChild(searchOptions);
    searchElement.appendChild(suggestionContainer);
    
    return searchElement;
  }
  
  /**
   * 이벤트 리스너 등록
   */
  registerEventListeners(): void {
    super.registerEventListeners();
    
    // 전역 이벤트 리스너 등록
    this.registerGlobalEventListeners();
    
    if (!this.element) return;
    
    const searchForm = this.element.querySelector('.search-form');
    const searchInput = this.element.querySelector('.search-input') as HTMLInputElement;
    const searchTypeSelect = this.element.querySelector('.search-type-select') as HTMLSelectElement;
    const scopeSelect = this.element.querySelector('.search-scope-select') as HTMLSelectElement;
    const caseSensitiveCheckbox = this.element.querySelector('.case-sensitive-checkbox') as HTMLInputElement;
    
    // 폼 제출 이벤트
    if (searchForm) {
      searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        this.search(searchInput.value);
      });
    }
    
    // 입력 이벤트
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.setQuery(searchInput.value);
      });
      
      searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          this.hideSuggestions();
        } else if (event.key === 'Enter') {
          event.preventDefault();
          this.search(searchInput.value);
        }
      });
      
      searchInput.addEventListener('focus', () => {
        if (this.suggestions.length > 0) {
          this.showSuggestions = true;
          this.renderSuggestions();
        }
      });
      
      searchInput.addEventListener('blur', (event) => {
        // 제안 항목 클릭 시 제안이 사라지지 않도록 지연
        setTimeout(() => {
          this.hideSuggestions();
        }, 200);
      });
    }
    
    // 검색 타입 변경 이벤트
    if (searchTypeSelect) {
      searchTypeSelect.addEventListener('change', () => {
        this.setSearchType(searchTypeSelect.value as SearchType);
      });
    }
    
    // 검색 범위 변경 이벤트
    if (scopeSelect) {
      scopeSelect.addEventListener('change', () => {
        this.setScope(scopeSelect.value as SearchScope);
      });
    }
    
    // 대소문자 구분 변경 이벤트
    if (caseSensitiveCheckbox) {
      caseSensitiveCheckbox.addEventListener('change', () => {
        this.setCaseSensitive(caseSensitiveCheckbox.checked);
      });
    }
    
    // 문서 클릭 이벤트 (제안 숨기기)
    document.addEventListener('click', (event) => {
      if (this.element && !this.element.contains(event.target as Node)) {
        this.hideSuggestions();
      }
    });
  }
  
  /**
   * 이벤트 리스너 제거
   */
  removeEventListeners(): void {
    // 문서 클릭 이벤트 제거
    document.removeEventListener('click', (event) => {
      if (this.element && !this.element.contains(event.target as Node)) {
        this.hideSuggestions();
      }
    });
  }
  
  /**
   * 툴바용 검색 요소 생성
   * @param item 툴바 아이템
   * @param onValueChange 값 변경 콜백
   * @returns 생성된 HTML 요소
   */
  createToolbarSearchElement(item: IToolbarItem, onValueChange: (value: string) => void): HTMLElement {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'toolbar-search-container';
    
    // 검색 아이콘
    const searchIconContainer = document.createElement('div');
    searchIconContainer.className = 'toolbar-search-icon-container';
    const searchIcon = document.createElement('span');
    setIcon(searchIcon, 'search');
    searchIconContainer.appendChild(searchIcon);
    
    // 입력 필드
    const inputElement = document.createElement('input');
    inputElement.className = 'toolbar-search-input';
    inputElement.type = 'text';
    inputElement.placeholder = '검색...';
    this.toolbarInputElement = inputElement;
    
    if (item.value) {
      inputElement.value = item.value;
    }
    
    if (item.tooltip) {
      inputElement.title = item.tooltip;
    }
    
    // 지우기 버튼
    const clearButton = document.createElement('button');
    clearButton.className = 'toolbar-search-clear-button';
    clearButton.type = 'button';
    clearButton.setAttribute('aria-label', '검색어 지우기');
    const clearIcon = document.createElement('span');
    setIcon(clearIcon, 'x');
    clearButton.appendChild(clearIcon);
    clearButton.style.display = inputElement.value ? 'flex' : 'none';
    
    // 이벤트 리스너 등록
    inputElement.addEventListener('input', () => {
      if (!item.disabled) {
        const value = inputElement.value;
        onValueChange(value);
        clearButton.style.display = value ? 'flex' : 'none';
        this.setQuery(value);
        
        // 입력 중에도 실시간 검색 수행
        this.search(value);
      }
    });
    
    inputElement.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        console.log('검색 실행:', inputElement.value);
        this.search(inputElement.value);
      }
    });
    
    clearButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      inputElement.value = '';
      onValueChange('');
      clearButton.style.display = 'none';
      this.setQuery('');
      this.searchService.clearResults();
      inputElement.focus();
    });
    
    // 검색 아이콘 클릭 시 검색 실행
    searchIconContainer.addEventListener('click', () => {
      console.log('검색 아이콘 클릭:', inputElement.value);
      this.search(inputElement.value);
    });
    
    // 요소 조합
    searchContainer.appendChild(searchIconContainer);
    searchContainer.appendChild(inputElement);
    searchContainer.appendChild(clearButton);
    
    return searchContainer;
  }
  
  /**
   * 컴포넌트 요소 가져오기
   * @returns 컴포넌트 요소
   */
  getElement(): HTMLElement | null {
    return this.element;
  }
  
  /**
   * 컴포넌트 제거
   */
  remove(): void {
    // 이벤트 리스너 제거
    this.removeEventListeners();
    
    // 컴포넌트 요소 제거
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // 요소 참조 제거
    this.element = null;
  }
} 