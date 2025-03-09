import React from 'react';
import { SearchOption } from './SearchOptionSuggest';
import './SearchOptionSuggestStyle.css';

interface SearchOptionSuggestProps {
  options: SearchOption[];
  onSelect: (option: SearchOption, evt: MouseEvent | KeyboardEvent) => void;
  selectedIndex: number;
  currentOption?: SearchOption | null;
}

/**
 * 검색 옵션 제안 React 컴포넌트
 */
export const SearchOptionSuggest: React.FC<SearchOptionSuggestProps> = ({
  options,
  onSelect,
  selectedIndex,
  currentOption
}) => {
  return (
    <div className="search-option-suggestions">
      {options.map((option, index) => (
        <div 
          key={option.type}
          className={`search-option-item ${selectedIndex === index ? 'selected' : ''} ${currentOption?.type === option.type ? 'current' : ''}`}
          onClick={(e) => onSelect(option, e.nativeEvent)}
        >
          <span className="search-option-prefix">{option.prefix}</span>
          <span className="search-option-label">{option.label}</span>
          <span className="search-option-description">{option.description}</span>
        </div>
      ))}
    </div>
  );
}; 