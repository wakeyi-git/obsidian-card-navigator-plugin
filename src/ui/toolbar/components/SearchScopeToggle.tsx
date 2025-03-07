import React from 'react';

interface SearchScopeToggleProps {
  searchScope: 'all' | 'current';
  onToggle: () => void;
}

/**
 * 검색 범위 토글 컴포넌트
 */
const SearchScopeToggle: React.FC<SearchScopeToggleProps> = ({ searchScope, onToggle }) => {
  return (
    <div 
      className={`card-navigator-search-scope-toggle ${searchScope === 'current' ? 'is-current' : 'is-all'}`}
      onClick={onToggle}
      title={searchScope === 'current' ? '현재 카드셋에서 검색' : '전체 노트에서 검색'}
    >
      {searchScope === 'current' ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>
          <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>
          <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
      )}
    </div>
  );
};

export default SearchScopeToggle; 