import React, { useRef } from 'react';
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
import { SearchOptionSuggest, SearchOption } from './components/SearchOptionSuggest';

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
  searchQuery?: string;
  searchType?: SearchType;
  caseSensitive?: boolean;
  frontmatterKey?: string;
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
  searchQuery = '',
  searchType = 'filename',
  caseSensitive = false,
  frontmatterKey = '',
  app
}) => {
  // useSearchBar 훅 사용
  const {
    // 상태
    searchText,
    showSearchSuggestions,
    setShowSearchSuggestions,
    showFrontmatterKeySuggestions,
    setShowFrontmatterKeySuggestions,
    showSuggestedValues,
    setShowSuggestedValues,
    showSearchHistory,
    setShowSearchHistory,
    showDatePicker,
    setShowDatePicker,
    isDateRangeMode,
    datePickerType,
    datePickerPosition,
    isComplexSearch,
    searchHistory,
    frontmatterKeys,
    searchScope,
    suggestedValues,
    selectedSuggestionIndex,
    setSelectedSuggestionIndex,
    currentSearchOption,
    
    // 참조
    inputRef,
    containerRef,
    datePickerRef,
    searchHistoryRef,
    
    // 핸들러
    handleTextChange,
    handleSubmit,
    handleClear,
    handleFocus,
    handleKeyDown,
    handleSearchOptionSelect: baseHandleSearchOptionSelect,
    handleDateSelect,
    handleSearchScopeToggle,
    handleHistoryItemClick,
    handleFrontmatterKeySelect: baseHandleFrontmatterKeySelect,
    handleSuggestedValueSelect,
    clearSearchHistory,
    
    // 검색 옵션
    searchOptions,
  } = useSearchBar({
    cardNavigatorService: cardNavigatorService || null,
    onSearch,
    currentCards,
    initialSearchText: searchQuery,
    initialSearchType: searchType,
    initialCaseSensitive: caseSensitive,
    initialFrontmatterKey: frontmatterKey
  });
  
  // 검색 옵션 선택 핸들러 래핑
  const handleSearchOptionSelect = (option: SearchOption) => {
    baseHandleSearchOptionSelect(option);
    if (onSearchTypeChange) {
      // SearchOption 타입을 SearchType으로 변환
      const searchType = convertOptionTypeToSearchType(option.type);
      onSearchTypeChange(searchType);
    }
  };
  
  // SearchOption 타입을 SearchType으로 변환하는 함수
  const convertOptionTypeToSearchType = (optionType: string): SearchType => {
    switch (optionType) {
      case 'filename':
        return 'filename';
      case 'content':
        return 'content';
      case 'tag':
        return 'tag';
      case 'path':
        return 'path';
      case 'frontmatter':
        return 'frontmatter';
      case 'created':
        return 'create';
      case 'modified':
        return 'modify';
      case 'folder':
        return 'folder';
      default:
        return 'filename';
    }
  };
  
  // 프론트매터 키 선택 핸들러 래핑
  const handleFrontmatterKeySelect = (key: string) => {
    baseHandleFrontmatterKeySelect(key);
    if (onFrontmatterKeyChange) {
      onFrontmatterKeyChange(key);
    }
  };
  
  // 대소문자 구분 토글 핸들러
  const handleCaseSensitiveToggle = (sensitive: boolean) => {
    if (onCaseSensitiveChange) {
      onCaseSensitiveChange(sensitive);
    }
  };

  // SearchOptionSuggest 인스턴스 참조
  const searchOptionSuggestRef = useRef<SearchOptionSuggest | null>(null);
  
  // 컴포넌트 마운트 시 SearchOptionSuggest 인스턴스 생성
  React.useEffect(() => {
    // app이 없거나 inputRef가 없으면 실행하지 않음
    if (!app || !inputRef.current) return;
    
    // 인스턴스가 이미 있으면 생성하지 않음
    if (!searchOptionSuggestRef.current) {
      console.log('SearchOptionSuggest 인스턴스 생성');
      // SearchOptionSuggest 인스턴스 생성
      searchOptionSuggestRef.current = new SearchOptionSuggest(
        app,
        inputRef.current,
        searchOptions,
        handleSearchOptionSelect
      );
    } else {
      console.log('SearchOptionSuggest 인스턴스 업데이트');
      // 인스턴스가 이미 있으면 옵션 업데이트
      searchOptionSuggestRef.current.updateOptions(searchOptions);
    }
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      console.log('SearchOptionSuggest 인스턴스 정리');
      if (searchOptionSuggestRef.current) {
        searchOptionSuggestRef.current.close();
        searchOptionSuggestRef.current = null;
      }
    };
  }, [app, searchOptions]); // app과 searchOptions가 변경될 때 실행
  
  // showSearchSuggestions 상태가 변경될 때 인스턴스의 open/close 메서드 호출
  React.useEffect(() => {
    if (!searchOptionSuggestRef.current) return;
    
    console.log('showSearchSuggestions 변경:', showSearchSuggestions);
    
    if (showSearchSuggestions) {
      console.log('SearchOptionSuggest 열기');
      searchOptionSuggestRef.current.open();
    } else {
      console.log('SearchOptionSuggest 닫기');
      searchOptionSuggestRef.current.close();
    }
  }, [showSearchSuggestions]);

  return (
    <div className="card-navigator-search-container" ref={containerRef}>
      <form onSubmit={handleSubmit} className="card-navigator-search-form">
        <div className="card-navigator-search-input-container">
          {/* 검색 입력 필드 */}
          <SearchInput
            ref={inputRef}
            value={searchText}
            onChange={handleTextChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            onClear={handleClear}
            isComplexSearch={isComplexSearch}
            caseSensitive={caseSensitive}
            onCaseSensitiveToggle={handleCaseSensitiveToggle}
            searchScope={searchScope}
            onSearchScopeToggle={handleSearchScopeToggle}
          />
          
          {/* 검색 범위 토글 */}
          <SearchScopeToggle
            searchScope={searchScope}
            onToggle={handleSearchScopeToggle}
          />
        </div>
        
        {/* 프론트매터 키 제안 */}
        {showFrontmatterKeySuggestions && (
          <FrontmatterKeySuggestions
            keys={frontmatterKeys}
            isVisible={showFrontmatterKeySuggestions}
            onSelect={handleFrontmatterKeySelect}
            inputRef={inputRef}
            onClose={() => setShowFrontmatterKeySuggestions(false)}
          />
        )}
        
        {/* 추천 검색어 */}
        {showSuggestedValues && (
          <SuggestedValues
            values={suggestedValues}
            isVisible={showSuggestedValues}
            selectedIndex={selectedSuggestionIndex}
            onSelect={handleSuggestedValueSelect}
            onMouseEnter={setSelectedSuggestionIndex}
            title={currentSearchOption ? `${currentSearchOption.label} 추천` : '추천 검색어'}
            filterText={currentSearchOption ? (() => {
              // 현재 검색어에서 검색 옵션 접두사 이후의 텍스트 추출
              const isComplex = searchText.includes('|');
              
              if (isComplex) {
                // 복합 검색의 경우 마지막 부분만 고려
                const parts = searchText.split('|');
                const lastPart = parts[parts.length - 1].trim();
                
                if (lastPart.startsWith(currentSearchOption.prefix)) {
                  return lastPart.substring(currentSearchOption.prefix.length).trim();
                }
              } else if (searchText.startsWith(currentSearchOption.prefix)) {
                return searchText.substring(currentSearchOption.prefix.length).trim();
              }
              
              return '';
            })() : ''}
            onClose={() => setShowSuggestedValues(false)}
          />
        )}
        
        {/* 검색 기록 */}
        {showSearchHistory && (
          <SearchHistory
            ref={searchHistoryRef}
            searchHistory={searchHistory}
            isVisible={showSearchHistory}
            onItemClick={handleHistoryItemClick}
            onClearHistory={clearSearchHistory}
            onClose={() => setShowSearchHistory(false)}
          />
        )}
        
        {/* 날짜 선택기 */}
        {showDatePicker && (
          <div 
            ref={datePickerRef}
            className="card-navigator-date-picker-container"
            style={{ 
              position: 'absolute', 
              top: `${datePickerPosition.top}px`, 
              left: `${datePickerPosition.left}px`,
              zIndex: 1000
            }}
          >
            <DatePicker 
              onSelect={handleDateSelect} 
              onClose={() => setShowDatePicker(false)}
              isRangeMode={isDateRangeMode}
              dateType={datePickerType}
            />
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar; 