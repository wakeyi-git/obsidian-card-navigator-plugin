import { Component } from '../Component';
import { ISearchService } from '../../services/search/SearchService';
import { ISearchSuggestionService } from '../../services/search/SearchSuggestionService';
import { ISearchHistoryService } from '../../services/search/SearchHistoryService';
import { SearchType, SearchScope, ISearchSuggestion } from '../../domain/search/Search';

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
}

/**
 * 검색 컴포넌트
 * 검색 기능을 제공하는 컴포넌트입니다.
 */
export class SearchComponent extends Component implements ISearchComponent {
  private searchService: ISearchService;
  private suggestionService: ISearchSuggestionService;
  private historyService: ISearchHistoryService;
  private query: string = '';
  private searchType: SearchType = 'filename';
  private scope: SearchScope = 'current';
  private caseSensitive: boolean = false;
  private showSuggestions: boolean = false;
  private suggestions: ISearchSuggestion[] = [];
  private history: string[] = [];
  private inputElement: HTMLInputElement | null = null;
  private suggestionElement: HTMLElement | null = null;
  
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
    this.loadHistory();
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
  protected createComponent(): HTMLElement {
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
} 