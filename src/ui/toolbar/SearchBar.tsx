import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { SearchType } from '../../domain/search/Search';

// SearchType에 'path'가 없으므로 내부적으로 사용할 확장 타입 정의
type ExtendedSearchType = SearchType | 'path';

/**
 * 검색 쿼리 파싱 결과 인터페이스
 */
interface ParsedSearchQuery {
  type: SearchType;
  query: string;
  frontmatterKey?: string;
}

/**
 * 검색 옵션 인터페이스
 */
interface SearchOption {
  prefix: string;
  label: string;
  description: string;
  type: SearchType;
}

/**
 * 검색바 컴포넌트 속성 인터페이스
 */
interface ISearchBarProps {
  onSearch: (query: string) => void;
  onSearchTypeChange?: (type: SearchType, frontmatterKey?: string) => void;
  onCaseSensitiveChange?: (caseSensitive: boolean) => void;
  placeholder?: string;
  service: ICardNavigatorService | null;
}

/**
 * 검색바 컴포넌트
 * 사용자가 카드를 검색할 수 있는 입력 필드와 검색 옵션을 제공합니다.
 */
const SearchBar: React.FC<ISearchBarProps> = ({
  onSearch,
  onSearchTypeChange = () => {},
  onCaseSensitiveChange = () => {},
  placeholder = '카드 검색...',
  service,
}) => {
  const [query, setQuery] = useState('');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>('filename');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [frontmatterKey, setFrontmatterKey] = useState('');
  const [frontmatterKeys, setFrontmatterKeys] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [searchParts, setSearchParts] = useState<string[]>([]);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 검색 옵션 정의
  const searchOptions: SearchOption[] = [
    { prefix: 'file:', label: 'file:', description: '파일명 검색', type: 'filename' },
    { prefix: 'content:', label: 'content:', description: '파일 내용 검색', type: 'content' },
    { prefix: 'tag:', label: 'tag:', description: '태그 검색', type: 'tag' },
    { prefix: 'path:', label: 'path:', description: '파일 경로 검색', type: 'folder' },
    { prefix: '[', label: '[속성]:', description: '프론트매터 속성 검색', type: 'frontmatter' },
  ];

  // 폴더 경로 목록 (예시)
  const [folderPaths, setFolderPaths] = useState<string[]>([]);

  // 검색 타입 자동 감지
  const detectSearchType = (query: string): SearchType => {
    if (query.startsWith('file:')) return 'filename';
    if (query.startsWith('content:')) return 'content';
    if (query.startsWith('tag:')) return 'tag';
    if (query.startsWith('path:')) return 'folder'; // path: 접두사는 folder 타입으로 매핑
    if (query.match(/^\[.+\]:/)) return 'frontmatter';
    return 'filename';
  };
  
  // 프론트매터 키 추출
  const extractFrontmatterKey = (query: string): string | undefined => {
    const match = query.match(/^\[(.+)\]:/);
    return match ? match[1] : undefined;
  };
  
  // 검색 쿼리 파싱 함수
  const parseSearchQuery = (query: string): ParsedSearchQuery => {
    let type: SearchType = 'filename';
    let parsedQuery = query;
    let frontmatterKey: string | undefined;
    
    if (query.startsWith('file:')) {
      type = 'filename';
      parsedQuery = query.substring(5).trim();
    } else if (query.startsWith('content:')) {
      type = 'content';
      parsedQuery = query.substring(8).trim();
    } else if (query.startsWith('tag:')) {
      type = 'tag';
      parsedQuery = query.substring(4).trim();
    } else if (query.startsWith('path:')) {
      type = 'folder'; // path: 접두사는 folder 타입으로 매핑
      parsedQuery = query.substring(5).trim();
    } else if (query.match(/^\[.+\]:/)) {
      type = 'frontmatter';
      frontmatterKey = extractFrontmatterKey(query);
      const keyPart = frontmatterKey ? `[${frontmatterKey}]:` : '';
      parsedQuery = query.substring(keyPart.length).trim();
    }
    
    return { type, query: parsedQuery, frontmatterKey };
  };

  // 최근 검색어 로드
  const loadRecentSearches = async () => {
    if (service) {
      try {
        const searchService = service.getSearchService();
        const history = searchService.getSearchHistory();
        setRecentSearches(history);
      } catch (error) {
        console.error('최근 검색어 로드 중 오류 발생:', error);
      }
    }
  };

  // 프론트매터 키 로드
  useEffect(() => {
    const loadFrontmatterKeys = async () => {
      if (service) {
        try {
          const searchService = service.getSearchService();
          // 검색 서비스에서 프론트매터 키 가져오기
          const cards = await service.getCards();
          const frontmatterKeysSet = new Set<string>();
          
          // 모든 카드에서 프론트매터 키 수집
          cards.forEach(card => {
            if (card.frontmatter) {
              Object.keys(card.frontmatter).forEach(key => {
                frontmatterKeysSet.add(key);
              });
            }
          });
          
          setFrontmatterKeys(Array.from(frontmatterKeysSet));
        } catch (error) {
          console.error('프론트매터 키 로드 중 오류 발생:', error);
        }
      }
    };

    loadFrontmatterKeys();
  }, [service]);

  // 폴더 경로 로드
  useEffect(() => {
    const loadFolderPaths = async () => {
      if (service) {
        try {
          const modeService = service.getModeService();
          const paths = await modeService.getCardSets();
          setFolderPaths(paths);
        } catch (error) {
          console.error('폴더 경로 로드 중 오류 발생:', error);
        }
      }
    };

    loadFolderPaths();
  }, [service]);

  // 최근 검색어 로드
  useEffect(() => {
    loadRecentSearches();
  }, [service]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOptionsOpen(false);
        setIsSuggestionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 검색어 변경 처리
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // 검색 타입 자동 변경
    const detectedType = detectSearchType(newQuery);
    if (detectedType !== searchType) {
      setSearchType(detectedType);
      
      if (detectedType === 'frontmatter') {
        const key = extractFrontmatterKey(newQuery);
        if (key) {
          setFrontmatterKey(key);
          onSearchTypeChange(detectedType, key);
        }
      } else {
        onSearchTypeChange(detectedType);
      }
    }
    
    // 실시간 검색
    onSearch(newQuery);
  };

  // 검색 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (service && query.trim() !== '') {
      const searchService = service.getSearchService();
      
      // 모든 파트 처리
      const allParts = query.split('|').map(part => part.trim()).filter(part => part);
      if (allParts.length > 0) {
        // 마지막 파트로 검색 타입 설정
        const lastPart = allParts[allParts.length - 1];
        const { type, query: parsedQuery, frontmatterKey } = parseSearchQuery(lastPart);
        
        searchService.changeSearchType(type, frontmatterKey);
        onSearchTypeChange(type, frontmatterKey);
        
        // 검색어 설정
        searchService.setSearchQuery(query);
        searchService.saveSearchHistory(query);
        
        // 최근 검색어 업데이트
        loadRecentSearches();
      }
      
      onSearch(query);
    }
    
    // 제안 닫기
    setIsSuggestionsOpen(false);
  };

  // 검색어 초기화 핸들러
  const handleClear = () => {
    setQuery('');
    
    if (service) {
      const searchService = service.getSearchService();
      searchService.clearSearch();
    }
    
    onSearch('');
    setIsSuggestionsOpen(false);
    setIsOptionsOpen(false);
  };

  // 대소문자 구분 변경 핸들러
  const handleCaseSensitiveChange = () => {
    const newValue = !caseSensitive;
    setCaseSensitive(newValue);
    
    if (service) {
      const searchService = service.getSearchService();
      searchService.setCaseSensitive(newValue);
    }
    
    onCaseSensitiveChange(newValue);
  };

  // 검색 옵션 선택 핸들러
  const handleOptionSelect = (option: SearchOption) => {
    let newQuery = '';
    const parts = [...searchParts];
    
    // 현재 파트 업데이트
    if (parts.length === 0) {
      parts.push(option.prefix);
    } else {
      parts[currentPartIndex] = option.prefix;
    }
    
    newQuery = parts.join(' | ');
    setQuery(newQuery);
    
    // 입력 필드에 포커스 유지하고 커서 위치 설정
    if (inputRef.current) {
      inputRef.current.focus();
      const cursorPos = newQuery.length;
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(cursorPos, cursorPos);
        }
      }, 0);
    }
    
    // 검색 타입 업데이트
    setSearchType(option.type);
    
    // 제안 업데이트
    updateSuggestions(option.prefix);
    setIsSuggestionsOpen(true);
    setIsOptionsOpen(false);
  };

  // 제안 선택 핸들러
  const handleSuggestionSelect = (suggestion: string) => {
    let newQuery = '';
    const parts = [...searchParts];
    
    // 현재 파트가 없으면 새로운 쿼리로 설정
    if (parts.length === 0) {
      newQuery = suggestion;
    } else {
      parts[currentPartIndex] = suggestion;
    }
    
    newQuery = parts.join(' | ');
    setQuery(newQuery);
    
    if (service) {
      const searchService = service.getSearchService();
      
      // 검색어 구문 분석
      const { type, query: parsedQuery, frontmatterKey } = parseSearchQuery(suggestion);
      
      // 검색 타입 설정
      searchService.changeSearchType(type, frontmatterKey);
      onSearchTypeChange(type, frontmatterKey);
      
      searchService.setSearchQuery(parsedQuery);
    }
    
    onSearch(newQuery);
    setIsSuggestionsOpen(false);
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 제안 목록이 열려있을 때
    if (isSuggestionsOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : 0
        );
      } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsSuggestionsOpen(false);
        setIsOptionsOpen(false);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
        } else if (suggestions.length > 0) {
          handleSuggestionSelect(suggestions[0]);
        }
      }
    }
    // 검색 옵션이 열려있을 때
    else if (isOptionsOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOptionsOpen(false);
      }
    }
    // 파이프 문자 입력 시 새 검색 파트 추가
    else if (e.key === '|') {
      setTimeout(() => {
        setIsOptionsOpen(true);
      }, 0);
    }
  };

  // 제안 업데이트
  const updateSuggestions = (currentInput: string) => {
    let newSuggestions: string[] = [];
    
    // 입력이 비어있으면 최근 검색어 표시
    if (!currentInput) {
      newSuggestions = recentSearches;
    } 
    // 검색 옵션 접두사에 따라 제안 생성
    else {
      const { type, query, frontmatterKey } = parseSearchQuery(currentInput);
      
      switch (type) {
        case 'filename':
          // 파일명 검색 제안
          newSuggestions = [`file:${query || ''}`];
          break;
        case 'content':
          // 내용 검색 제안
          newSuggestions = [`content:${query || ''}`];
          break;
        case 'tag':
          // 태그 검색 제안 (예시 태그)
          const exampleTags = ['#개발', '#프로젝트', '#할일', '#아이디어'];
          newSuggestions = exampleTags
            .filter(tag => !query || tag.toLowerCase().includes(query.toLowerCase()))
            .map(tag => `tag:${tag.startsWith('#') ? tag.substring(1) : tag}`);
          break;
        case 'folder':
          // 폴더 검색 제안
          newSuggestions = folderPaths
            .filter(path => !query || path.toLowerCase().includes(query.toLowerCase()))
            .map(path => `path:"${path}"`);
          break;
        case 'frontmatter':
          // 프론트매터 검색 제안
          if (frontmatterKey) {
            newSuggestions = [`[${frontmatterKey}:${query || ''}]`];
          } else {
            newSuggestions = frontmatterKeys
              .filter(key => !query || key.toLowerCase().includes(query.toLowerCase()))
              .map(key => `[${key}:]`);
          }
          break;
        default:
          // 기본 제안 (검색 옵션)
          newSuggestions = searchOptions.map(option => option.prefix);
      }
    }
    
    setSuggestions(newSuggestions);
    setSelectedSuggestionIndex(-1);
  };

  // 검색 옵션 표시
  const renderSearchOptions = () => {
    return (
      <div className="card-navigator-search-options-dropdown">
        <div className="card-navigator-search-options-header">
          검색 옵션
        </div>
        <div className="card-navigator-search-options-list">
          {searchOptions.map((option, index) => (
            <div 
              key={index}
              className="card-navigator-search-option-item"
              onClick={() => handleOptionSelect(option)}
            >
              <div className="card-navigator-search-option-label">{option.label}</div>
              <div className="card-navigator-search-option-description">{option.description}</div>
            </div>
          ))}
        </div>
        <div className="card-navigator-search-option-case">
          <label>
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={handleCaseSensitiveChange}
            />
            <span>대소문자 구분</span>
          </label>
        </div>
      </div>
    );
  };

  // 검색 제안 표시
  const renderSearchSuggestions = () => {
    if (suggestions.length === 0) return null;
    
    return (
      <div className="card-navigator-search-suggestions">
        <div className="card-navigator-search-suggestions-list">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`card-navigator-search-suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="card-navigator-search" ref={dropdownRef}>
      <form onSubmit={handleSubmit}>
        <div className="card-navigator-search-input-container">
          <span className="card-navigator-search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="검색"
            className="card-navigator-search-input"
            onFocus={() => setIsOptionsOpen(true)}
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
          <button
            type="button"
            className="card-navigator-search-options-button"
            onClick={() => setIsOptionsOpen(!isOptionsOpen)}
            aria-label="검색 옵션"
          >
            <span className="card-navigator-search-options-icon">⚙️</span>
          </button>
        </div>

        {isOptionsOpen && renderSearchOptions()}
        {isSuggestionsOpen && renderSearchSuggestions()}
      </form>
    </div>
  );
};

export default SearchBar; 