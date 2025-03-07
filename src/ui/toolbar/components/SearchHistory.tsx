import React, { forwardRef, useEffect } from 'react';

interface SearchHistoryProps {
  searchHistory: string[];
  isVisible: boolean;
  onItemClick: (query: string) => void;
  onClose?: () => void;
}

/**
 * 검색 기록 컴포넌트
 */
const SearchHistory = forwardRef<HTMLDivElement, SearchHistoryProps>(
  ({ searchHistory, isVisible, onItemClick, onClose }, ref) => {
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isVisible) return;
        
        if (e.key === 'Escape' && onClose) {
          e.preventDefault();
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isVisible, onClose]);
    
    if (!isVisible || searchHistory.length === 0) {
      return null;
    }

    return (
      <div 
        className="card-navigator-search-history-container" 
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="card-navigator-search-history-header">
          <span>최근 검색어</span>
        </div>
        <div className="card-navigator-search-history-list">
          {searchHistory.map((query, index) => (
            <div 
              key={index} 
              className="card-navigator-search-history-item"
              onClick={() => onItemClick(query)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>{query}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default SearchHistory; 