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
  service?: ICardNavigatorService | null;
  onSearch: (query: string, type?: string) => void;
  currentCards?: ICardProps[]; // 현재 표시 중인 카드셋
  
  // 추가 속성
  onSearchTypeChange?: (type: SearchType) => void;
  onCaseSensitiveChange?: (sensitive: boolean) => void;
  _onFrontmatterKeyChange?: (key: string) => void;
  onSearchScopeChange?: (scope: 'all' | 'current') => void;
  onEnterSearchCardSetSource?: (query: string, type?: SearchType) => void;
  onExitSearchCardSetSource?: () => void;
  searchQuery?: string;
  searchType?: SearchType;
  caseSensitive?: boolean;
  frontmatterKey?: string;
  searchScopeProps?: 'all' | 'current';
  isSearchCardSetSource?: boolean;
  app?: App; // Obsidian App 인스턴스
  
  // 이전 속성 (하위 호환성 유지)
  cardNavigatorService?: ICardNavigatorService | null;
}

/**
 * 검색바 컴포넌트
 */
export const SearchBar: React.FC<SearchBarProps> = ({ 
  service,
  cardNavigatorService, // 이전 속성 (하위 호환성 유지)
  onSearch, 
  currentCards = [],
  
  // 추가 속성
  onSearchTypeChange,
  onCaseSensitiveChange,
  _onFrontmatterKeyChange,
  onSearchScopeChange,
  onEnterSearchCardSetSource,
  onExitSearchCardSetSource,
  searchQuery = '',
  searchType = 'filename' as SearchType,
  caseSensitive = false,
  frontmatterKey = '',
  searchScopeProps = 'current',
  isSearchCardSetSource = false,
  app
}) => {
  // 서비스 결정 (새 속성 또는 이전 속성 사용)
  const actualService = service || cardNavigatorService;
  
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
    isDateRangeCardSetSource,
    datePickerType,
    datePickerRef,
    showFrontmatterKeySuggestions,
    frontmatterKeys,
    handleFrontmatterKeySelect,
    showSuggestedValues,
    suggestedValues,
    handleSuggestedValueSelect,
    showSearchSuggestions,
    setShowSearchSuggestions,
    filteredSuggestions
  } = useSearchBar({
    cardNavigatorService: actualService,
    onSearch,
    currentCards,
    searchQuery,
    searchType: searchType as SearchType,
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
   * 검색 카드 세트 진입 처리
   */
  const handleEnterSearchCardSetSource = () => {
    console.log(`[SearchBar] 검색 카드 세트 진입: 쿼리=${searchText}, 타입=${currentSearchOption?.type}`);
    
    if (onEnterSearchCardSetSource && searchText) {
      const searchTypeValue = currentSearchOption?.type ? 
        convertOptionTypeToSearchType(currentSearchOption.type) : 
        'filename';
      
      onEnterSearchCardSetSource(searchText, searchTypeValue);
    }
  };

  /**
   * 검색 카드 세트 종료 처리
   */
  const handleExitSearchCardSetSource = () => {
    console.log(`[SearchBar] 검색 카드 세트 종료`);
    
    // 검색 텍스트 초기화
    setSearchText('');
    
    // 검색 카드 세트 종료 콜백 호출
    if (onExitSearchCardSetSource) {
      onExitSearchCardSetSource();
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

  // 검색 옵션 변경 시 처리
  const handleOptionChange = (option: SearchOption) => {
    // MouseEvent 객체 생성
    const mockEvent = new MouseEvent('click');
    
    // 검색 옵션 선택 처리
    handleSearchOptionSelect(option, mockEvent);
    
    // 검색 타입 변경 콜백 호출
    if (onSearchTypeChange) {
      onSearchTypeChange(convertOptionTypeToSearchType(option.type));
    }
    
    // 입력 필드에 포커스
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="card-navigator-search-bar" ref={containerRef}>
      <div className="card-navigator-search-container">
        {/* 검색 범위 토글 */}
        <SearchScopeToggle 
          currentScope={searchScope || 'current'} 
          onChange={handleSearchScopeChange}
          disabled={!isSearchCardSetSource}
        />
        
        {/* 검색 옵션 선택 */}
        <div className="card-navigator-search-option-selector">
          <div 
            className="card-navigator-search-option-current"
            onClick={() => setShowSearchSuggestions(!showSearchSuggestions)}
            title="검색 옵션 변경"
          >
            {currentSearchOption?.prefix || ''}
          </div>
        </div>
        
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
            if (isSearchCardSetSource) {
              handleExitSearchCardSetSource();
            }
          }}
          isSearchCardSetSource={isSearchCardSetSource}
        />
        
        {/* 대소문자 구분 토글 */}
        <div 
          className={`card-navigator-case-sensitive-toggle ${caseSensitive ? 'active' : ''}`}
          onClick={() => {
            if (onCaseSensitiveChange) {
              onCaseSensitiveChange(!caseSensitive);
            }
          }}
          title={caseSensitive ? "대소문자 구분 (켜짐)" : "대소문자 구분 (꺼짐)"}
        >
          <span className="card-navigator-case-sensitive-icon">Aa</span>
        </div>
        
        {/* 검색 카드 세트 전환 버튼 (검색 카드 세트일 때만 표시) */}
        {isSearchCardSetSource && (
          <button 
            className="card-navigator-exit-search-cardSetSource" 
            onClick={handleExitSearchCardSetSource}
            title="검색 카드 세트 종료"
          >
            <span className="card-navigator-exit-icon">×</span>
          </button>
        )}
      </div>
      
      {/* 검색 제안 */}
      {showSearchSuggestions && (
        <div className="card-navigator-search-suggestions">
          <div className="search-option-suggestions">
            {filteredSuggestions.map((option, index) => (
              <div 
                key={option.type}
                className={`search-option-item ${selectedSuggestionIndex === index ? 'selected' : ''} ${currentSearchOption?.type === option.type ? 'current' : ''}`}
                onClick={() => handleOptionChange(option)}
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
      
      {/* 날짜 선택기 */}
      {showDatePicker && (
        <DatePicker
          position={datePickerPosition}
          onSelect={handleDateSelect}
          isRangeCardSetSource={isDateRangeCardSetSource}
          type={datePickerType}
          onRangeCardSetSourceToggle={() => {}}
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
    </div>
  );
};

export default SearchBar; 