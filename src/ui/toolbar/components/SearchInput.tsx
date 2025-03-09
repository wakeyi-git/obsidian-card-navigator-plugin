import React, { forwardRef } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClear: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  placeholder?: string;
  isComplexSearch?: boolean;
  
  // 추가 속성
  caseSensitive?: boolean;
  onCaseSensitiveToggle?: (sensitive: boolean) => void;
  searchScope?: 'all' | 'current';
  onSearchScopeToggle?: () => void;
  isSearchCardSetSource?: boolean;
}

/**
 * 검색 입력 필드 컴포넌트
 */
const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ 
    value, 
    onChange, 
    onFocus, 
    onKeyDown, 
    onClear,
    onSubmit,
    placeholder = '검색어를 입력하세요...', 
    isComplexSearch = false,
    caseSensitive = false,
    onCaseSensitiveToggle,
    searchScope = 'current',
    onSearchScopeToggle
  }, ref) => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (onSubmit) {
        onSubmit(e);
      }
    };
    
    return (
      <div className="card-navigator-search-input-wrapper">
        <form onSubmit={handleSubmit}>
          <input
            ref={ref}
            type="text"
            className={`card-navigator-search-input ${isComplexSearch ? 'complex-search' : ''}`}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
          />
        </form>
        {value && (
          <div className="card-navigator-search-clear" onClick={onClear}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        )}
        
        {/* 대소문자 구분 토글 버튼 */}
        {onCaseSensitiveToggle && (
          <div 
            className={`card-navigator-case-sensitive-toggle ${caseSensitive ? 'active' : ''}`}
            onClick={() => onCaseSensitiveToggle(!caseSensitive)}
            title={caseSensitive ? '대소문자 구분 끄기' : '대소문자 구분 켜기'}
          >
            <span>Aa</span>
          </div>
        )}
        
        {/* 검색 범위 토글 버튼 */}
        {onSearchScopeToggle && (
          <div 
            className={`card-navigator-search-scope ${searchScope === 'all' ? 'global' : 'local'}`} 
            onClick={onSearchScopeToggle}
            title={searchScope === 'all' ? '현재 카드셋만 검색' : '전체 검색'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {searchScope === 'all' ? (
                <circle cx="12" cy="12" r="10"></circle>
              ) : (
                <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"></path>
              )}
            </svg>
          </div>
        )}
      </div>
    );
  }
);

export default SearchInput; 