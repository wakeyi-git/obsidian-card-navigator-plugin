import React, { useState } from 'react';

/**
 * 검색바 컴포넌트 속성 인터페이스
 */
interface ISearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

/**
 * 검색바 컴포넌트
 * 사용자가 카드를 검색할 수 있는 입력 필드를 제공합니다.
 */
const SearchBar: React.FC<ISearchBarProps> = ({
  onSearch,
  placeholder = '카드 검색...',
}) => {
  const [query, setQuery] = useState('');

  // 검색어 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // 검색 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  // 검색어 초기화 핸들러
  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="card-navigator-search">
      <form onSubmit={handleSubmit}>
        <span className="card-navigator-search-icon">🔍</span>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          aria-label="검색"
        />
        {query && (
          <button
            type="button"
            className="card-navigator-search-clear"
            onClick={handleClear}
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </form>
    </div>
  );
};

export default SearchBar; 