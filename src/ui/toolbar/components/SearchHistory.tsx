import React, { forwardRef } from 'react';

interface SearchHistoryProps {
  history: string[];
  onSelect: (query: string) => void;
  onClear: () => void;
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
 * 검색 히스토리 컴포넌트
 * 이전 검색 기록을 표시하고 선택할 수 있는 컴포넌트
 */
const SearchHistory = forwardRef<HTMLDivElement, SearchHistoryProps>(
  ({ history, onSelect, onClear }, ref) => {
    if (history.length === 0) {
      return (
        <div className="card-navigator-search-history" ref={ref}>
          <div className="card-navigator-search-history-header">
            <span>검색 기록</span>
            <button 
              className="card-navigator-search-history-clear"
              onClick={onClear}
              disabled
            >
              기록 지우기
            </button>
          </div>
          <div className="card-navigator-search-history-empty">
            <span>검색 기록이 없습니다.</span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="card-navigator-search-history" ref={ref}>
        <div className="card-navigator-search-history-header">
          <span>검색 기록</span>
          <button 
            className="card-navigator-search-history-clear"
            onClick={onClear}
          >
            기록 지우기
          </button>
        </div>
        <div className="card-navigator-search-history-list">
          {history.map((query, index) => (
            <div 
              key={`${query}-${index}`}
              className="card-navigator-search-history-item"
              onClick={() => onSelect(query)}
            >
              <div className="card-navigator-search-history-query">
                {query}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default SearchHistory; 