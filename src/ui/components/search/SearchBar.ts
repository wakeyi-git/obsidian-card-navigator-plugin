import { App, setIcon } from 'obsidian';
import { SearchService } from '../../../services/search/SearchService';
import { SearchHistoryService } from '../../../services/search/SearchHistoryService';
import { SearchSuggestionService } from '../../../services/search/SearchSuggestionService';
import { ErrorHandler } from '../../../utils/error/ErrorHandler';

/**
 * 검색 바 컴포넌트
 * 검색 입력 필드와 검색 옵션을 제공합니다.
 */
export class SearchBar {
  /**
   * 컴포넌트 컨테이너 요소
   */
  private containerEl: HTMLElement;
  
  /**
   * 검색 입력 필드
   */
  private searchInputEl: HTMLInputElement;
  
  /**
   * 검색 옵션 컨테이너
   */
  private searchOptionsEl: HTMLElement;
  
  /**
   * 검색 제안 컨테이너
   */
  private suggestionsEl: HTMLElement;
  
  /**
   * 검색 서비스
   */
  private searchService: SearchService;
  
  /**
   * 검색 기록 서비스
   */
  private searchHistoryService: SearchHistoryService;
  
  /**
   * 검색 제안 서비스
   */
  private searchSuggestionService: SearchSuggestionService;
  
  /**
   * 검색 콜백 함수
   */
  private onSearch: (searchTerm: string) => void;
  
  /**
   * 검색 입력 디바운스 타이머
   */
  private debounceTimer: number | null = null;
  
  /**
   * 검색 입력 디바운스 지연 시간 (밀리초)
   */
  private debounceDelay: number = 300;
  
  /**
   * 현재 선택된 제안 인덱스
   */
  private selectedSuggestionIndex: number = -1;
  
  /**
   * 현재 제안 목록
   */
  private currentSuggestions: string[] = [];
  
  /**
   * 검색 중 여부
   */
  private isSearching: boolean = false;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param containerEl 컴포넌트 컨테이너 요소
   * @param searchService 검색 서비스
   * @param searchHistoryService 검색 기록 서비스
   * @param searchSuggestionService 검색 제안 서비스
   * @param onSearch 검색 콜백 함수
   */
  constructor(
    private app: App,
    containerEl: HTMLElement,
    searchService: SearchService,
    searchHistoryService: SearchHistoryService,
    searchSuggestionService: SearchSuggestionService,
    onSearch: (searchTerm: string) => void
  ) {
    this.containerEl = containerEl;
    this.searchService = searchService;
    this.searchHistoryService = searchHistoryService;
    this.searchSuggestionService = searchSuggestionService;
    this.onSearch = onSearch;
    
    this.render();
    this.setupEventListeners();
  }
  
  /**
   * 컴포넌트 렌더링
   */
  private render(): void {
    try {
      // 컨테이너 클래스 추가
      this.containerEl.addClass('card-navigator-search-bar');
      
      // 검색 입력 필드 생성
      const searchInputContainer = this.containerEl.createDiv({
        cls: 'card-navigator-search-input-container'
      });
      
      // 검색 아이콘 추가
      const searchIconEl = searchInputContainer.createDiv({
        cls: 'card-navigator-search-icon'
      });
      setIcon(searchIconEl, 'search');
      
      // 검색 입력 필드 생성
      this.searchInputEl = searchInputContainer.createEl('input', {
        cls: 'card-navigator-search-input',
        attr: {
          type: 'text',
          placeholder: '검색어를 입력하세요',
          spellcheck: 'false'
        }
      });
      
      // 클리어 버튼 생성
      const clearButtonEl = searchInputContainer.createDiv({
        cls: 'card-navigator-search-clear-button'
      });
      setIcon(clearButtonEl, 'x');
      clearButtonEl.addEventListener('click', this.clearSearch.bind(this));
      
      // 검색 옵션 컨테이너 생성
      this.searchOptionsEl = this.containerEl.createDiv({
        cls: 'card-navigator-search-options'
      });
      
      // 검색 제안 컨테이너 생성
      this.suggestionsEl = this.containerEl.createDiv({
        cls: 'card-navigator-search-suggestions'
      });
      this.suggestionsEl.style.display = 'none';
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 바 컴포넌트를 렌더링하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    try {
      // 검색 입력 이벤트
      this.searchInputEl.addEventListener('input', this.handleSearchInput.bind(this));
      this.searchInputEl.addEventListener('keydown', this.handleKeyDown.bind(this));
      this.searchInputEl.addEventListener('focus', this.handleFocus.bind(this));
      
      // 문서 클릭 이벤트 (제안 목록 닫기)
      document.addEventListener('click', this.handleDocumentClick.bind(this));
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 바 이벤트 리스너를 설정하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 검색 입력 처리
   * @param e 입력 이벤트
   */
  private handleSearchInput(e: Event): void {
    try {
      const searchTerm = this.searchInputEl.value.trim();
      
      // 디바운스 처리
      if (this.debounceTimer !== null) {
        window.clearTimeout(this.debounceTimer);
      }
      
      this.debounceTimer = window.setTimeout(() => {
        // 검색어가 비어있으면 제안 목록 숨기기
        if (!searchTerm) {
          this.hideSuggestions();
          this.onSearch('');
          return;
        }
        
        // 검색 기록에 추가
        this.searchHistoryService.addSearchQuery(searchTerm);
        
        // 검색 제안 표시
        this.showSuggestions(searchTerm);
        
        // 검색 콜백 호출
        this.onSearch(searchTerm);
      }, this.debounceDelay);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 입력을 처리하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 키 입력 처리
   * @param e 키보드 이벤트
   */
  private handleKeyDown(e: KeyboardEvent): void {
    try {
      // 제안 목록이 표시되어 있을 때만 처리
      if (this.suggestionsEl.style.display === 'none') {
        return;
      }
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.navigateSuggestion(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.navigateSuggestion(-1);
          break;
        case 'Enter':
          e.preventDefault();
          this.selectSuggestion();
          break;
        case 'Escape':
          e.preventDefault();
          this.hideSuggestions();
          break;
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '키 입력을 처리하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 포커스 처리
   */
  private handleFocus(): void {
    try {
      const searchTerm = this.searchInputEl.value.trim();
      if (searchTerm) {
        this.showSuggestions(searchTerm);
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '포커스를 처리하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 문서 클릭 처리
   * @param e 마우스 이벤트
   */
  private handleDocumentClick(e: MouseEvent): void {
    try {
      // 클릭 이벤트가 검색 바 외부에서 발생한 경우 제안 목록 숨기기
      if (!this.containerEl.contains(e.target as Node)) {
        this.hideSuggestions();
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '문서 클릭을 처리하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 제안 목록 표시
   * @param searchTerm 검색어
   */
  private async showSuggestions(searchTerm: string): Promise<void> {
    try {
      // 검색 중 표시
      this.isSearching = true;
      
      // 제안 가져오기
      this.currentSuggestions = await this.searchSuggestionService.getSuggestions(searchTerm);
      
      // 검색 완료
      this.isSearching = false;
      
      // 제안이 없으면 제안 목록 숨기기
      if (this.currentSuggestions.length === 0) {
        this.hideSuggestions();
        return;
      }
      
      // 제안 목록 렌더링
      this.renderSuggestions();
      
      // 제안 목록 표시
      this.suggestionsEl.style.display = 'block';
    } catch (error) {
      this.isSearching = false;
      ErrorHandler.getInstance().handleError(
        '제안 목록을 표시하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 제안 목록 렌더링
   */
  private renderSuggestions(): void {
    try {
      // 제안 목록 초기화
      this.suggestionsEl.empty();
      
      // 제안 목록 생성
      const suggestionListEl = this.suggestionsEl.createEl('ul', {
        cls: 'card-navigator-suggestion-list'
      });
      
      // 제안 항목 생성
      this.currentSuggestions.forEach((suggestion, index) => {
        const suggestionItemEl = suggestionListEl.createEl('li', {
          cls: 'card-navigator-suggestion-item',
          text: suggestion
        });
        
        // 선택된 제안 강조
        if (index === this.selectedSuggestionIndex) {
          suggestionItemEl.addClass('selected');
        }
        
        // 클릭 이벤트 추가
        suggestionItemEl.addEventListener('click', () => {
          this.selectSuggestionByIndex(index);
        });
        
        // 마우스 오버 이벤트 추가
        suggestionItemEl.addEventListener('mouseover', () => {
          this.selectedSuggestionIndex = index;
          this.renderSuggestions();
        });
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '제안 목록을 렌더링하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 제안 목록 숨기기
   */
  private hideSuggestions(): void {
    this.suggestionsEl.style.display = 'none';
    this.selectedSuggestionIndex = -1;
  }
  
  /**
   * 제안 탐색
   * @param direction 탐색 방향 (1: 다음, -1: 이전)
   */
  private navigateSuggestion(direction: number): void {
    try {
      if (this.currentSuggestions.length === 0) {
        return;
      }
      
      // 다음/이전 제안 인덱스 계산
      this.selectedSuggestionIndex += direction;
      
      // 범위 검사
      if (this.selectedSuggestionIndex < 0) {
        this.selectedSuggestionIndex = this.currentSuggestions.length - 1;
      } else if (this.selectedSuggestionIndex >= this.currentSuggestions.length) {
        this.selectedSuggestionIndex = 0;
      }
      
      // 제안 목록 다시 렌더링
      this.renderSuggestions();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '제안을 탐색하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 제안 선택
   */
  private selectSuggestion(): void {
    try {
      if (this.selectedSuggestionIndex >= 0 && this.selectedSuggestionIndex < this.currentSuggestions.length) {
        this.selectSuggestionByIndex(this.selectedSuggestionIndex);
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '제안을 선택하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 인덱스로 제안 선택
   * @param index 제안 인덱스
   */
  private selectSuggestionByIndex(index: number): void {
    try {
      if (index >= 0 && index < this.currentSuggestions.length) {
        const suggestion = this.currentSuggestions[index];
        
        // 검색 입력 필드에 제안 설정
        this.searchInputEl.value = suggestion;
        
        // 제안 목록 숨기기
        this.hideSuggestions();
        
        // 검색 콜백 호출
        this.onSearch(suggestion);
        
        // 검색 기록에 추가
        this.searchHistoryService.addSearchQuery(suggestion);
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '인덱스로 제안을 선택하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 검색 지우기
   */
  private clearSearch(): void {
    try {
      // 검색 입력 필드 초기화
      this.searchInputEl.value = '';
      
      // 제안 목록 숨기기
      this.hideSuggestions();
      
      // 검색 콜백 호출
      this.onSearch('');
      
      // 포커스 설정
      this.searchInputEl.focus();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색을 지우는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 검색어 설정
   * @param searchTerm 검색어
   */
  public setSearchTerm(searchTerm: string): void {
    try {
      this.searchInputEl.value = searchTerm;
      
      // 검색 콜백 호출
      if (searchTerm) {
        this.onSearch(searchTerm);
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색어를 설정하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 검색어 가져오기
   * @returns 현재 검색어
   */
  public getSearchTerm(): string {
    return this.searchInputEl.value;
  }
  
  /**
   * 포커스 설정
   */
  public focus(): void {
    this.searchInputEl.focus();
  }
  
  /**
   * 디바운스 지연 시간 설정
   * @param delay 지연 시간 (밀리초)
   */
  public setDebounceDelay(delay: number): void {
    this.debounceDelay = delay;
  }
  
  /**
   * 컴포넌트 파괴
   */
  public destroy(): void {
    try {
      // 이벤트 리스너 제거
      this.searchInputEl.removeEventListener('input', this.handleSearchInput);
      this.searchInputEl.removeEventListener('keydown', this.handleKeyDown);
      this.searchInputEl.removeEventListener('focus', this.handleFocus);
      document.removeEventListener('click', this.handleDocumentClick);
      
      // 디바운스 타이머 정리
      if (this.debounceTimer !== null) {
        window.clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      
      // 컨테이너 비우기
      this.containerEl.empty();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 바 컴포넌트를 파괴하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
} 