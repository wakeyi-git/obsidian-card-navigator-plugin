import React, { forwardRef } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClear: () => void;
  placeholder?: string;
  isComplexSearch?: boolean;
}

/**
 * 검색 입력 필드 컴포넌트
 */
const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onFocus, onKeyDown, onClear, placeholder = '검색어를 입력하세요...', isComplexSearch = false }, ref) => {
    return (
      <div className="card-navigator-search-input-wrapper">
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
        {value && (
          <div className="card-navigator-search-clear" onClick={onClear}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        )}
      </div>
    );
  }
);

export default SearchInput; 