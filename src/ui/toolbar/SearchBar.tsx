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
import { SearchSuggestions, SearchOption } from './components/SearchSuggestions';
import SuggestedValues from './components/SuggestedValues';

// 훅 import
import useSearchBar from './hooks/useSearchBar';

/**
 * 검색 옵션 목록
 */
const SEARCH_OPTIONS: SearchOption[] = [
  {
    type: 'filename',
    label: '파일 이름 검색',
    description: '카드의 파일 이름에서 검색합니다.',
    prefix: 'file:'
  },
  {
    type: 'content',
    label: '내용 검색',
    description: '카드 내용에서 검색합니다.',
    prefix: 'content:'
  },
  {
    type: 'tag',
    label: '태그 검색',
    description: '카드의 태그에서 검색합니다.',
    prefix: 'tag:'
  },
  {
    type: 'path',
    label: '경로 검색',
    description: '카드의 경로에서 검색합니다.',
    prefix: 'path:'
  },
  {
    type: 'frontmatter',
    label: '속성 검색',
    description: '카드의 프론트매터 속성에서 검색합니다.',
    prefix: '['
  },
  {
    type: 'create',
    label: '생성일 검색',
    description: '카드의 생성일로 검색합니다.',
    prefix: 'create:'
  },
  {
    type: 'modify',
    label: '수정일 검색',
    description: '카드의 수정일로 검색합니다.',
    prefix: 'modify:'
  },
  {
    type: 'complex',
    label: '다중 필드 검색',
    description: '여러 필드를 동시에 검색합니다. (예: file:제목 | tag:태그)',
    prefix: '|'
  }
];

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
    frontmatterKey,
    
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
  } = useSearchBar({
    cardNavigatorService,
    onSearch,
    currentCards,
    searchOptions: SEARCH_OPTIONS
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
            options={SEARCH_OPTIONS}
            isVisible={showSearchSuggestions}
            onSelect={handleSearchOptionSelect}
            inputRef={inputRef}
          />
        )}
        
        {/* 프론트매터 키 제안 */}
        {showFrontmatterKeySuggestions && (
          <FrontmatterKeySuggestions
            keys={frontmatterKeys}
            isVisible={showFrontmatterKeySuggestions}
            onSelect={handleFrontmatterKeySelect}
            inputRef={inputRef}
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
          />
        )}
        
        {/* 검색 기록 */}
        {showSearchHistory && (
          <SearchHistory
            ref={searchHistoryRef}
            searchHistory={searchHistory}
            isVisible={showSearchHistory}
            onItemClick={handleHistoryItemClick}
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