import React from 'react';

interface SearchScopeToggleProps {
  currentScope: 'all' | 'current';
  onChange: (scope: 'all' | 'current') => void;
  disabled?: boolean;
}

/**
 * 검색 범위 토글 컴포넌트
 * 검색 범위를 전체 또는 현재 카드셋으로 전환하는 컴포넌트
 */
const SearchScopeToggle: React.FC<SearchScopeToggleProps> = ({ 
  currentScope, 
  onChange,
  disabled = false
}) => {
  const handleToggle = () => {
    if (disabled) return;
    
    const newScope = currentScope === 'all' ? 'current' : 'all';
    onChange(newScope);
  };
  
  return (
    <div 
      className={`card-navigator-search-scope-toggle ${currentScope} ${disabled ? 'disabled' : ''}`}
      onClick={handleToggle}
      title={currentScope === 'all' ? '전체 검색 (모든 카드)' : '현재 카드셋만 검색'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {currentScope === 'all' ? (
          <circle cx="12" cy="12" r="10"></circle>
        ) : (
          <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"></path>
        )}
      </svg>
    </div>
  );
};

export default SearchScopeToggle; 