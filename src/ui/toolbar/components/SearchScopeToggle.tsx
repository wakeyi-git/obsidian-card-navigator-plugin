import React from 'react';

interface SearchScopeToggleProps {
  currentScope: 'all' | 'current';
  onChange: (scope: 'all' | 'current') => void;
  disabled?: boolean;
}

/**
 * 검색 범위 토글 컴포넌트
 */
const SearchScopeToggle: React.FC<SearchScopeToggleProps> = ({ 
  currentScope, 
  onChange,
  disabled = false
}) => {
  const handleToggle = () => {
    if (disabled) return;
    
    const newScope = currentScope === 'current' ? 'all' : 'current';
    onChange(newScope);
  };
  
  return (
    <div 
      className={`card-navigator-search-scope-toggle ${currentScope === 'current' ? 'is-current' : 'is-all'} ${disabled ? 'disabled' : ''}`}
      onClick={handleToggle}
      title={currentScope === 'current' ? '현재 카드셋에서 검색' : '전체 노트에서 검색'}
    >
      {currentScope === 'current' ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2"/>
            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>
            <path d="m7.9 7.9 2.7 2.7"/>
            <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>
            <path d="m13.4 10.6 2.7-2.7"/>
            <circle cx="7.5" cy="16.5" r=".5" fill="currentColor"/>
            <path d="m7.9 16.1 2.7-2.7"/>
            <circle cx="16.5" cy="16.5" r=".5" fill="currentColor"/>
            <path d="m13.4 13.4 2.7 2.7"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>
          <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>
          <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>
        </svg>
      )}
    </div>
  );
};

export default SearchScopeToggle; 