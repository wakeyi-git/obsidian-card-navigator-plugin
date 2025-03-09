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
  searchScope?: 'all' | 'current';
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
  searchScope = 'current',
  isSearchMode = false,
  app
}) => {
  // useSearchBar 훅 사용
  const {
    // 상태
    searchText,
    setSearchText,
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
    setIsDateRangeMode,
    datePickerType,
    setDatePickerType,
    datePickerPosition,
    setDatePickerPosition,
    isComplexSearch,
    searchHistory,
    frontmatterKeys,
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
    handleFrontmatterKeySelect: baseFrontmatterKeySelect,
    handleSuggestedValueSelect,
    handleSearchHistorySelect,
    handleClickOutside,
    
    // 서비스 호출
    getScopedTags,
    getScopedFilenames,
    getScopedFrontmatterKeys,
    getScopedFrontmatterValues,
    
    // 검색 옵션
    searchOptions,
    filteredSuggestions
  } = useSearchBar({
    cardNavigatorService,
    onSearch,
    currentCards,
    searchQuery,
    searchType,
    caseSensitive,
    frontmatterKey,
    searchScope,
    app
  });
  
  // SearchOptionSuggest 인스턴스 참조
  const [searchOptionSuggestInstance, setSearchOptionSuggestInstance] = useState<any>(null);
  
  // 컴포넌트 마운트 시 SearchOptionSuggest 인스턴스 생성
  useEffect(() => {
    if (app && inputRef.current && showSearchSuggestions) {
      try {
        // SearchOptionSuggest 클래스 동적 임포트
        import('./components/SearchOptionSuggest').then(({ SearchOptionSuggest }) => {
          const instance = SearchOptionSuggest.getInstance(
            app,
            inputRef.current!,
            searchOptions,
            handleSearchOptionSelect
          );
          setSearchOptionSuggestInstance(instance);
          instance.open();
        });
      } catch (error) {
        console.error('SearchOptionSuggest 로드 오류:', error);
      }
    }
    
    return () => {
      if (searchOptionSuggestInstance) {
        searchOptionSuggestInstance.close();
      }
    };
  }, [app, inputRef.current, showSearchSuggestions, searchOptions]);
  
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
  
  // 검색 옵션 선택 핸들러
  const handleSearchOptionSelect = (option: SearchOption, evt: MouseEvent | KeyboardEvent) => {
    baseHandleSearchOptionSelect(option, evt);
    
    // 검색 타입 변경
    if (onSearchTypeChange) {
      const searchType = convertOptionTypeToSearchType(option.type);
      onSearchTypeChange(searchType);
    }
    
    // 프론트매터 키 변경
    if (option.type === 'frontmatter' && option.frontmatterKey && onFrontmatterKeyChange) {
      onFrontmatterKeyChange(option.frontmatterKey);
    }
  };
  
  // 프론트매터 키 선택 핸들러
  const handleFrontmatterKeySelect = (key: string) => {
    baseFrontmatterKeySelect(key);
    
    if (onFrontmatterKeyChange) {
      onFrontmatterKeyChange(key);
    }
  };
  
  // 검색 옵션 타입을 SearchType으로 변환
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
      case 'create':
        return 'create';
      case 'modify':
        return 'modify';
      default:
        return 'filename';
    }
  };
  
  // 대소문자 구분 토글 핸들러
  const handleCaseSensitiveToggle = (sensitive: boolean) => {
    if (onCaseSensitiveChange) {
      onCaseSensitiveChange(sensitive);
    }
  };
  
  // 검색 입력 필드에 포커스가 있을 때 자동으로 검색 모드로 전환
  useEffect(() => {
    const handleInputFocus = () => {
      if (!isSearchMode && inputRef.current === document.activeElement && searchText) {
        handleEnterSearchMode();
      }
    };
    
    const input = inputRef.current;
    if (input) {
      input.addEventListener('focus', handleInputFocus);
      
      return () => {
        input.removeEventListener('focus', handleInputFocus);
      };
    }
  }, [inputRef, isSearchMode, searchText]);
  
  return (
    <div className="card-navigator-search-bar" ref={containerRef}>
      <div className="card-navigator-search-container">
        {/* 검색 범위 토글 */}
        <SearchScopeToggle 
          scope={searchScope || 'current'} 
          onChange={handleSearchScopeChange}
          isSearchMode={isSearchMode}
        />
        
        {/* 검색 입력 필드 */}
        <SearchInput
          ref={inputRef}
          value={searchText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleClickOutside}
          placeholder="검색어 입력..."
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
      
      {/* 검색 제안 및 옵션 */}
      {showSearchSuggestions && (
        <div className="card-navigator-search-suggestions">
          <SearchOptionSuggest
            options={searchOptions}
            onSelect={handleSearchOptionSelect}
            selectedIndex={selectedSuggestionIndex}
            currentOption={currentSearchOption}
          />
        </div>
      )}
      
      {/* 검색 기록 */}
      {showSearchHistory && (
        <SearchHistory
          ref={searchHistoryRef}
          history={searchHistory}
          onSelect={handleSearchHistorySelect}
          onClear={handleClear}
        />
      )}
      
      {/* 프론트매터 키 제안 */}
      {showFrontmatterKeySuggestions && (
        <FrontmatterKeySuggestions
          keys={frontmatterKeys}
          onSelect={handleFrontmatterKeySelect}
          selectedIndex={selectedSuggestionIndex}
        />
      )}
      
      {/* 제안 값 */}
      {showSuggestedValues && (
        <SuggestedValues
          values={suggestedValues}
          onSelect={handleSuggestedValueSelect}
          selectedIndex={selectedSuggestionIndex}
        />
      )}
      
      {/* 날짜 선택기 */}
      {showDatePicker && (
        <DatePicker
          ref={datePickerRef}
          position={datePickerPosition}
          onSelect={handleDateSelect}
          isRange={isDateRangeMode}
          type={datePickerType}
        />
      )}
    </div>
  );
};

export default SearchBar; 