import React from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { ICardProps } from '../cards-container/Card';
import './SearchBar.css';

// 컴포넌트 import
import SearchInput from './components/SearchInput';
import SearchScopeToggle from './components/SearchScopeToggle';
import SearchHistory from './components/SearchHistory';
import DatePicker from './components/DatePicker';
import FrontmatterKeySuggestions from './components/FrontmatterKeySuggestions';
import { SearchSuggestions } from './components/SearchSuggestions';
import SuggestedValues from './components/SuggestedValues';

// 훅 import
import useSearchBar from './hooks/useSearchBar';

/**
 * 검색바 컴포넌트 속성
 */
interface SearchBarProps {
  cardNavigatorService: ICardNavigatorService | null;
  onSearch: (query: string, type?: string) => void;
  currentCards?: ICardProps[]; // 현재 표시 중인 카드셋
}

/**
 * 검색바 컴포넌트
 */
export const SearchBar: React.FC<SearchBarProps> = ({ cardNavigatorService, onSearch, currentCards = [] }) => {
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
    handleSearchOptionSelect,
    handleDateSelect,
    handleSearchScopeToggle,
    handleHistoryItemClick,
    handleFrontmatterKeySelect,
    handleSuggestedValueSelect,
    clearSearchHistory,
    
    // 검색 옵션
    searchOptions,
  } = useSearchBar({
    cardNavigatorService,
    onSearch,
    currentCards,
  });
  
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
          />
          
          {/* 검색 범위 토글 */}
          <SearchScopeToggle
            searchScope={searchScope}
            onToggle={handleSearchScopeToggle}
          />
        </div>
        
        {/* 검색 옵션 제안 */}
        {showSearchSuggestions && (
          <SearchSuggestions
            searchText={searchText}
            options={searchOptions}
            isVisible={showSearchSuggestions}
            onSelect={handleSearchOptionSelect}
            inputRef={inputRef}
            onClose={() => setShowSearchSuggestions(false)}
          />
        )}
        
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