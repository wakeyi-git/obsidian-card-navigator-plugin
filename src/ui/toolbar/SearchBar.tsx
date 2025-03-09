import React, { useRef, useEffect, useState } from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { ICardProps } from '../cards-container/Card';
import { SearchType } from '../../domain/search/Search';
import './SearchBar.css';
import { App } from 'obsidian';

// 컴포넌트 import
import SearchInput from './components/SearchInput';
import SearchScopeToggle from './components/SearchScopeToggle';
import SearchHistory from './components/SearchHistory';
import DatePicker from './components/DatePicker';
import FrontmatterKeySuggestions from './components/FrontmatterKeySuggestions';
import SuggestedValues from './components/SuggestedValues';
import { SearchOptionSuggest } from './components/SearchOptionSuggest';
import { SearchOption } from './components/SearchOptionSuggest';

// 훅 import
import useSearchBar from './hooks/useSearchBar';

/**
 * 검색바 컴포넌트 속성
 */
interface SearchBarProps {
  cardNavigatorService?: ICardNavigatorService | null;
  onSearch: (query: string, type?: string) => void;
  currentCards?: ICardProps[]; // 현재 표시 중인 카드셋
  
  // 추가 속성
  onSearchTypeChange?: (type: SearchType) => void;
  onCaseSensitiveChange?: (sensitive: boolean) => void;
  onFrontmatterKeyChange?: (key: string) => void;
  onSearchScopeChange?: (scope: 'all' | 'current') => void;
  onEnterSearchMode?: (query: string, type?: SearchType) => void;
  onExitSearchMode?: () => void;
  searchQuery?: string;
  searchType?: SearchType;
  caseSensitive?: boolean;
  frontmatterKey?: string;
  searchScopeProps?: 'all' | 'current';
  isSearchMode?: boolean;
  app?: App; // Obsidian App 인스턴스 추가
}

/**
 * 검색바 컴포넌트
 */
export const SearchBar: React.FC<SearchBarProps> = ({ 
  cardNavigatorService, 
  onSearch, 
  currentCards = [],
  
  // 추가 속성
  onSearchTypeChange,
  onCaseSensitiveChange,
  onFrontmatterKeyChange,
  onSearchScopeChange,
  onEnterSearchMode,
  onExitSearchMode,
  searchQuery = '',
  searchType = 'filename',
  caseSensitive = false,
  frontmatterKey = '',
  searchScopeProps = 'current',
  isSearchMode = false,
  app
}) => {
  // 컨테이너 참조 추가
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);

  // useSearchBar 훅 사용
  const {
    searchText,
    setSearchText,
    handleTextChange: handleInputChange,
    handleSubmit,
    handleFocus: handleInputFocus,
    handleClear,
    handleKeyDown,
    handleSearchOptionSelect,
    handleSearchHistorySelect,
    handleSearchScopeToggle,
    clearSearchHistory: handleClearSearchHistory,
    searchOptions,
    currentSearchOption,
    searchScope,
    searchHistory,
    showSearchHistory,
    setShowSearchHistory,
    searchHistoryRef,
    inputRef,
    showDatePicker,
    datePickerPosition,
    handleDateSelect,
    isDateRangeMode,
    datePickerType,
    datePickerRef,
    showFrontmatterKeySuggestions,
    frontmatterKeys,
    handleFrontmatterKeySelect,
    showSuggestedValues,
    suggestedValues,
    handleSuggestedValueSelect,
    showSearchSuggestions,
    filteredSuggestions
  } = useSearchBar({
    cardNavigatorService,
    onSearch,
    currentCards,
    searchQuery,
    searchType,
    caseSensitive,
    frontmatterKey,
    searchScope: searchScopeProps as 'all' | 'current',
    app
  });

  /**
   * 검색 실행 함수
   * @param query 검색 쿼리
   */
  const handleSearch = (query: string) => {
    if (onSearch) {
      const searchTypeValue = currentSearchOption?.type ? 
        convertOptionTypeToSearchType(currentSearchOption.type) : 
        'filename';
      onSearch(query, searchTypeValue);
    }
  };

  /**
   * 검색 범위 변경 처리
   * @param scope 검색 범위 ('all' | 'current')
   */
  const handleSearchScopeChange = (scope: 'all' | 'current') => {
    console.log(`[SearchBar] 검색 범위 변경: ${scope}`);
    
    // 검색 범위 변경 콜백 호출
    if (onSearchScopeChange) {
      onSearchScopeChange(scope);
    }
    
    // 현재 검색 쿼리가 있으면 검색 다시 실행
    if (searchText) {
      handleSearch(searchText);
    }
  };

  /**
   * 검색 모드 진입 처리
   */
  const handleEnterSearchMode = () => {
    console.log(`[SearchBar] 검색 모드 진입: 쿼리=${searchText}, 타입=${currentSearchOption?.type}`);
    
    if (onEnterSearchMode && searchText) {
      const searchTypeValue = currentSearchOption?.type ? 
        convertOptionTypeToSearchType(currentSearchOption.type) : 
        'filename';
      
      onEnterSearchMode(searchText, searchTypeValue);
    }
  };

  /**
   * 검색 모드 종료 처리
   */
  const handleExitSearchMode = () => {
    console.log(`[SearchBar] 검색 모드 종료`);
    
    // 검색 텍스트 초기화
    setSearchText('');
    
    // 검색 모드 종료 콜백 호출
    if (onExitSearchMode) {
      onExitSearchMode();
    }
  };

  // 검색 플레이스홀더 텍스트 생성
  const getSearchPlaceholder = () => {
    if (currentSearchOption) {
      return `${currentSearchOption.label}...`;
    }
    return '검색어 입력...';
  };

  // 검색 옵션 타입을 SearchType으로 변환
  const convertOptionTypeToSearchType = (optionType: string): SearchType => {
    return optionType as SearchType;
  };

  return (
    <div className="card-navigator-search-bar" ref={containerRef}>
      <div className="card-navigator-search-container">
        {/* 검색 범위 토글 */}
        <SearchScopeToggle 
          currentScope={searchScope || 'current'} 
          onChange={handleSearchScopeChange}
          disabled={!isSearchMode}
        />
        
        {/* 검색 입력 필드 */}
        <SearchInput
          ref={inputRef}
          value={searchText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={getSearchPlaceholder()}
          onClear={() => {
            setSearchText('');
            if (isSearchMode) {
              handleExitSearchMode();
            }
          }}
          isSearchMode={isSearchMode}
        />
        
        {/* 검색 모드 전환 버튼 (검색 모드일 때만 표시) */}
        {isSearchMode && (
          <button 
            className="card-navigator-exit-search-mode" 
            onClick={handleExitSearchMode}
            title="검색 모드 종료"
          >
            <span className="card-navigator-exit-icon">×</span>
          </button>
        )}
      </div>
      
      {/* 검색 제안 */}
      {showSearchSuggestions && (
        <div className="card-navigator-search-suggestions">
          {/* SearchOptionSuggest는 React 컴포넌트가 아니라 Obsidian 클래스이므로 직접 사용할 수 없음 */}
          {/* 대신 filteredSuggestions를 사용하여 직접 렌더링 */}
          <div className="search-option-suggestions">
            {filteredSuggestions.map((option, index) => (
              <div 
                key={option.type}
                className={`search-option-item ${selectedSuggestionIndex === index ? 'selected' : ''} ${currentSearchOption?.type === option.type ? 'current' : ''}`}
                onClick={(e) => handleSearchOptionSelect(option, e.nativeEvent)}
              >
                <span className="search-option-prefix">{option.prefix}</span>
                <span className="search-option-label">{option.label}</span>
                <span className="search-option-description">{option.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 검색 기록 */}
      {showSearchHistory && (
        <SearchHistory
          ref={searchHistoryRef}
          items={searchHistory}
          onSelect={handleSearchHistorySelect}
          onClear={handleClearSearchHistory}
        />
      )}
      
      {/* 프론트매터 키 제안 */}
      {showFrontmatterKeySuggestions && (
        <FrontmatterKeySuggestions
          keys={frontmatterKeys}
          onSelect={handleFrontmatterKeySelect}
        />
      )}
      
      {/* 제안 값 */}
      {showSuggestedValues && (
        <SuggestedValues
          values={suggestedValues}
          onSelect={handleSuggestedValueSelect}
          isVisible={showSuggestedValues}
        />
      )}
      
      {/* 날짜 선택기 */}
      {showDatePicker && (
        <DatePicker
          position={datePickerPosition}
          onSelect={handleDateSelect}
          type={datePickerType}
          isRangeMode={isDateRangeMode}
          onRangeModeToggle={() => {}}
        />
      )}
    </div>
  );
};

export default SearchBar; 