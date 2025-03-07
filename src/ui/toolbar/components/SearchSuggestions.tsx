import React, { useState, useEffect, useRef } from 'react';

interface SearchOption {
  type: string;
  label: string;
  description: string;
  prefix: string;
}

interface SearchSuggestionsProps {
  searchText: string;
  options: SearchOption[];
  isVisible: boolean;
  onSelect: (option: SearchOption) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

/**
 * 검색 옵션 아이콘 가져오기
 */
const getSearchOptionIcon = (type: string): JSX.Element => {
  switch (type) {
    case 'filename':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      );
    case 'content':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="21" y1="10" x2="3" y2="10"></line>
          <line x1="21" y1="6" x2="3" y2="6"></line>
          <line x1="21" y1="14" x2="3" y2="14"></line>
          <line x1="21" y1="18" x2="3" y2="18"></line>
        </svg>
      );
    case 'tag':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
      );
    case 'path':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      );
    case 'frontmatter':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
      );
    case 'create':
    case 'modify':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      );
    case 'complex':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="21" x2="4" y2="14"></line>
          <line x1="4" y1="10" x2="4" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12" y2="3"></line>
          <line x1="20" y1="21" x2="20" y2="16"></line>
          <line x1="20" y1="12" x2="20" y2="3"></line>
          <line x1="1" y1="14" x2="7" y2="14"></line>
          <line x1="9" y1="8" x2="15" y2="8"></line>
          <line x1="17" y1="16" x2="23" y2="16"></line>
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      );
  }
};

/**
 * 검색 옵션 제안 컴포넌트
 */
const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  searchText,
  options,
  isVisible,
  onSelect,
  inputRef
}) => {
  const [filteredOptions, setFilteredOptions] = useState<SearchOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // 검색어에 따라 옵션 필터링
  useEffect(() => {
    if (!searchText) {
      setFilteredOptions(options);
      return;
    }
    
    const lowerCaseSearchText = searchText.toLowerCase();
    const filtered = options.filter(option => 
      option.label.toLowerCase().includes(lowerCaseSearchText) || 
      option.description.toLowerCase().includes(lowerCaseSearchText) ||
      option.prefix.toLowerCase().includes(lowerCaseSearchText)
    );
    
    setFilteredOptions(filtered.length > 0 ? filtered : options);
    setSelectedIndex(0);
  }, [searchText, options]);
  
  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || filteredOptions.length === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredOptions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev <= 0 ? filteredOptions.length - 1 : prev - 1));
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
            e.preventDefault();
            onSelect(filteredOptions[selectedIndex]);
          }
          break;
        case 'Tab':
          // Tab 키로도 선택 가능하게 함
          if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
            e.preventDefault();
            onSelect(filteredOptions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          // 여기서는 isVisible을 직접 제어하지 않고, 부모 컴포넌트에서 처리
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, filteredOptions, selectedIndex, onSelect]);
  
  // 선택된 항목이 변경될 때 스크롤 조정
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        const containerRect = suggestionsRef.current.getBoundingClientRect();
        const selectedRect = selectedElement.getBoundingClientRect();
        
        // 선택된 항목이 컨테이너 아래에 있는 경우
        if (selectedRect.bottom > containerRect.bottom) {
          suggestionsRef.current.scrollTop += selectedRect.bottom - containerRect.bottom;
        } 
        // 선택된 항목이 컨테이너 위에 있는 경우
        else if (selectedRect.top < containerRect.top) {
          suggestionsRef.current.scrollTop -= containerRect.top - selectedRect.top;
        }
      }
    }
  }, [selectedIndex]);
  
  // 단축키 표시
  const getShortcut = (index: number): string => {
    return `Alt+${index + 1}`;
  };
  
  if (!isVisible || filteredOptions.length === 0) {
    return null;
  }
  
  return (
    <div 
      className="card-navigator-suggestions-container"
      ref={suggestionsRef}
      onClick={(e) => {
        // 이벤트 버블링 방지
        e.stopPropagation();
      }}
    >
      <div className="card-navigator-suggestions-header">
        검색 옵션
      </div>
      {filteredOptions.map((option, index) => (
        <div 
          key={option.type}
          className={`card-navigator-suggestion-item ${index === selectedIndex ? 'is-selected' : ''}`}
          onClick={() => onSelect(option)}
          onMouseEnter={() => setSelectedIndex(index)}
          role="option"
          aria-selected={index === selectedIndex}
          tabIndex={0}
        >
          <div className="card-navigator-suggestion-title">
            <span className="card-navigator-suggestion-icon">
              {getSearchOptionIcon(option.type)}
            </span>
            <span className="card-navigator-suggestion-prefix">{option.prefix}</span>
            {option.label}
            <span className="card-navigator-suggestion-shortcut">{getShortcut(index)}</span>
          </div>
          <div className="card-navigator-suggestion-description">
            {option.description}
          </div>
        </div>
      ))}
    </div>
  );
};

export type { SearchOption };
export { SearchSuggestions };
export default SearchSuggestions; 