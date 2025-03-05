import React, { useState, useRef, useEffect } from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { SearchType } from '../../domain/search/Search';
import { ModeType } from '../../domain/mode/Mode';
import { App, AbstractInputSuggest } from 'obsidian';
import './SearchBar.css';

/**
 * 검색 옵션 인터페이스
 */
interface SearchOption {
  type: string;
  label: string;
  description: string;
  prefix: string;
}

/**
 * 검색 옵션 목록
 */
const SEARCH_OPTIONS: SearchOption[] = [
  {
    type: 'content',
    label: '내용 검색',
    description: '카드 내용에서 검색합니다.',
    prefix: 'content:'
  },
  {
    type: 'tag',
    label: '태그 검색',
    description: '카드의 태그에서 검색합니다.',
    prefix: 'tag:'
  },
  {
    type: 'path',
    label: '경로 검색',
    description: '카드의 경로에서 검색합니다.',
    prefix: 'path:'
  }
];

/**
 * 검색 옵션 제안 클래스
 */
class SearchOptionSuggest extends AbstractInputSuggest<SearchOption> {
  private options: SearchOption[];
  private inputElement: HTMLInputElement;

  constructor(app: App, inputEl: HTMLInputElement, options: SearchOption[]) {
    super(app, inputEl);
    this.options = options;
    this.inputElement = inputEl;
  }

  getSuggestions(inputStr: string): SearchOption[] {
    const lowerCaseInputStr = inputStr.toLowerCase();
    return this.options.filter(option => 
      option.label.toLowerCase().includes(lowerCaseInputStr) || 
      option.description.toLowerCase().includes(lowerCaseInputStr) ||
      option.prefix.toLowerCase().includes(lowerCaseInputStr)
    );
  }

  renderSuggestion(option: SearchOption, el: HTMLElement): void {
    el.addClass('suggestion-item');
    
    const title = el.createDiv({ cls: 'suggestion-title' });
    title.createSpan({ cls: 'search-option-prefix', text: option.prefix });
    title.createSpan({ text: option.label });
    
    el.createDiv({ cls: 'suggestion-description', text: option.description });
  }

  selectSuggestion(option: SearchOption): void {
    if (this.inputElement) {
      const cursorPosition = this.inputElement.selectionStart || 0;
      const currentValue = this.inputElement.value;
      const textBeforeCursor = currentValue.substring(0, cursorPosition);
      const textAfterCursor = currentValue.substring(cursorPosition);
      
      // 커서 위치에 접두사 삽입
      this.inputElement.value = textBeforeCursor + option.prefix + ' ' + textAfterCursor;
      
      // 커서 위치 조정
      const newCursorPosition = cursorPosition + option.prefix.length + 1;
      this.inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
      this.inputElement.focus();
    }
  }
}

/**
 * 검색바 컴포넌트 속성
 */
interface SearchBarProps {
  onSearch: (query: string, type: string) => void;
}

/**
 * 검색바 컴포넌트
 */
export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState<string>('content');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<SearchOptionSuggest | null>(null);

  // 검색 옵션 제안 초기화
  useEffect(() => {
    if (inputRef.current) {
      // @ts-ignore
      suggestRef.current = new SearchOptionSuggest(
        // @ts-ignore
        window.app,
        inputRef.current,
        SEARCH_OPTIONS
      );
    }
    
    return () => {
      if (suggestRef.current) {
        // 정리 작업
      }
    };
  }, []);

  /**
   * 검색 타입 변경 핸들러
   */
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchType(e.target.value);
  };

  /**
   * 검색어 변경 핸들러
   */
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchText, searchType);
  };

  /**
   * 검색어 지우기 핸들러
   */
  const handleClear = () => {
    setSearchText('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * 포커스 핸들러
   */
  const handleFocus = () => {
    // 포커스 시 처리
  };

  /**
   * 키 입력 핸들러
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Space 또는 Alt+Space로 제안 표시
    if ((e.ctrlKey || e.altKey) && e.key === ' ') {
      e.preventDefault();
      if (suggestRef.current) {
        suggestRef.current.open();
      }
    }
  };

  return (
    <div className="card-navigator-search-container">
      <form onSubmit={handleSubmit} className="card-navigator-search-form">
        <div className="card-navigator-search-input-container">
          <input
            ref={inputRef}
            type="text"
            className="card-navigator-search-input"
            placeholder="검색어를 입력하세요..."
            value={searchText}
            onChange={handleTextChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
          />
          {searchText && (
            <button
              type="button"
              className="card-navigator-search-clear-button"
              onClick={handleClear}
              aria-label="검색어 지우기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="card-navigator-clear-icon">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}; 