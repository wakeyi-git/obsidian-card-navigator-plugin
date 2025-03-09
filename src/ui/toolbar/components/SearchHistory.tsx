import React, { forwardRef, useEffect } from 'react';

interface SearchHistoryProps {
  items: string[];
  onSelect: (query: string) => void;
  onClear?: () => void;
}

/**
 * 검색어에서 검색 타입 추출
 * @param query 검색어
 * @returns 검색 타입
 */
const getSearchType = (query: string): string => {
  if (query.startsWith('file:')) return '파일명';
  if (query.startsWith('content:')) return '내용';
  if (query.startsWith('tag:')) return '태그';
  if (query.startsWith('path:')) return '경로';
  if (query.startsWith('create:')) return '생성일';
  if (query.startsWith('modify:')) return '수정일';
  if (query.includes('|')) return '복합';
  if (query.startsWith('[') && query.includes(']:')) {
    const match = query.match(/\[([^\]]+)\]:/);
    if (match) return `속성:${match[1]}`;
  }
  return '일반';
};

/**
 * 검색 기록 컴포넌트
 */
const SearchHistory = forwardRef<HTMLDivElement, SearchHistoryProps>(
  ({ items, onSelect }, ref) => {
    if (items.length === 0) {
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
          {items.map((query, index) => (
            <div 
              key={index} 
              className="card-navigator-search-history-item"
              onClick={() => onSelect(query)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span className="card-navigator-search-history-item-text">{query}</span>
              <span className="card-navigator-search-history-item-type">
                {getSearchType(query)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default SearchHistory; 