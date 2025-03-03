import { App } from 'obsidian';
import { SearchSuggestionService } from '../../../services/search/SearchSuggestionService';
import { ErrorHandler } from '../../../utils/error/ErrorHandler';

/**
 * 검색 제안 컴포넌트
 * 검색 제안을 표시하는 UI를 제공합니다.
 */
export class SearchSuggestions {
  /**
   * 컴포넌트 컨테이너 요소
   */
  private containerEl: HTMLElement;
  
  /**
   * 제안 목록 요소
   */
  private suggestionListEl: HTMLElement;
  
  /**
   * 검색 제안 서비스
   */
  private searchSuggestionService: SearchSuggestionService;
  
  /**
   * 현재 제안 목록
   */
  private currentSuggestions: string[] = [];
  
  /**
   * 현재 선택된 제안 인덱스
   */
  private selectedIndex: number = -1;
  
  /**
   * 제안 선택 콜백 함수
   */
  private onSuggestionSelect: (suggestion: string) => void;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param containerEl 컴포넌트 컨테이너 요소
   * @param searchSuggestionService 검색 제안 서비스
   * @param onSuggestionSelect 제안 선택 콜백 함수
   */
  constructor(
    private app: App,
    containerEl: HTMLElement,
    searchSuggestionService: SearchSuggestionService,
    onSuggestionSelect: (suggestion: string) => void
  ) {
    this.containerEl = containerEl;
    this.searchSuggestionService = searchSuggestionService;
    this.onSuggestionSelect = onSuggestionSelect;
    
    this.render();
  }
  
  /**
   * 컴포넌트 렌더링
   */
  private render(): void {
    try {
      // 컨테이너 클래스 추가
      this.containerEl.addClass('card-navigator-search-suggestions');
      
      // 제안 목록 요소 생성
      this.suggestionListEl = this.containerEl.createEl('ul', {
        cls: 'card-navigator-suggestion-list'
      });
      
      // 기본적으로 숨김
      this.hide();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 제안 컴포넌트를 렌더링하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 제안 업데이트
   * @param query 검색어
   * @param maxSuggestions 최대 제안 수
   */
  public async updateSuggestions(query: string, maxSuggestions: number = 5): Promise<void> {
    try {
      if (!query) {
        this.currentSuggestions = [];
        this.hide();
        return;
      }
      
      // 제안 가져오기
      this.currentSuggestions = await this.searchSuggestionService.getSuggestions(query, maxSuggestions);
      
      // 제안이 없으면 숨기기
      if (this.currentSuggestions.length === 0) {
        this.hide();
        return;
      }
      
      // 제안 렌더링
      this.renderSuggestions();
      
      // 제안 표시
      this.show();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 제안을 업데이트하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 제안 렌더링
   */
  private renderSuggestions(): void {
    try {
      // 제안 목록 초기화
      this.suggestionListEl.empty();
      
      // 제안 항목 생성
      this.currentSuggestions.forEach((suggestion, index) => {
        const suggestionItemEl = this.suggestionListEl.createEl('li', {
          cls: 'card-navigator-suggestion-item'
        });
        
        // 제안 텍스트 설정
        suggestionItemEl.textContent = suggestion;
        
        // 선택된 제안 강조
        if (index === this.selectedIndex) {
          suggestionItemEl.addClass('selected');
        }
        
        // 클릭 이벤트 추가
        suggestionItemEl.addEventListener('click', () => {
          this.selectSuggestion(index);
        });
        
        // 마우스 오버 이벤트 추가
        suggestionItemEl.addEventListener('mouseover', () => {
          this.setSelectedIndex(index);
        });
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 제안을 렌더링하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 제안 표시
   */
  public show(): void {
    this.containerEl.style.display = 'block';
  }
  
  /**
   * 제안 숨기기
   */
  public hide(): void {
    this.containerEl.style.display = 'none';
    this.selectedIndex = -1;
  }
  
  /**
   * 선택된 인덱스 설정
   * @param index 인덱스
   */
  public setSelectedIndex(index: number): void {
    try {
      // 범위 검사
      if (index < -1 || index >= this.currentSuggestions.length) {
        return;
      }
      
      this.selectedIndex = index;
      this.renderSuggestions();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '선택된 인덱스를 설정하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 다음 제안 선택
   */
  public selectNext(): void {
    try {
      if (this.currentSuggestions.length === 0) {
        return;
      }
      
      let nextIndex = this.selectedIndex + 1;
      if (nextIndex >= this.currentSuggestions.length) {
        nextIndex = 0;
      }
      
      this.setSelectedIndex(nextIndex);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '다음 제안을 선택하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 이전 제안 선택
   */
  public selectPrevious(): void {
    try {
      if (this.currentSuggestions.length === 0) {
        return;
      }
      
      let prevIndex = this.selectedIndex - 1;
      if (prevIndex < 0) {
        prevIndex = this.currentSuggestions.length - 1;
      }
      
      this.setSelectedIndex(prevIndex);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '이전 제안을 선택하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 제안 선택
   * @param index 인덱스
   */
  public selectSuggestion(index: number): void {
    try {
      if (index < 0 || index >= this.currentSuggestions.length) {
        return;
      }
      
      const suggestion = this.currentSuggestions[index];
      this.onSuggestionSelect(suggestion);
      this.hide();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '제안을 선택하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 현재 선택된 제안 선택
   */
  public selectCurrentSuggestion(): void {
    try {
      if (this.selectedIndex >= 0 && this.selectedIndex < this.currentSuggestions.length) {
        this.selectSuggestion(this.selectedIndex);
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '현재 선택된 제안을 선택하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 제안 목록 가져오기
   * @returns 현재 제안 목록
   */
  public getSuggestions(): string[] {
    return [...this.currentSuggestions];
  }
  
  /**
   * 선택된 인덱스 가져오기
   * @returns 현재 선택된 인덱스
   */
  public getSelectedIndex(): number {
    return this.selectedIndex;
  }
  
  /**
   * 컴포넌트 파괴
   */
  public destroy(): void {
    try {
      // 컨테이너 비우기
      this.containerEl.empty();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 제안 컴포넌트를 파괴하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
} 