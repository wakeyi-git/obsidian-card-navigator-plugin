import { useState, useRef, useEffect } from 'react';
import { ICardNavigatorService } from '../../../application/CardNavigatorService';
import { ICardProps } from '../../../ui/cards-container/Card';
import { ICard as _ICard } from '../../../domain/card/Card';
import { SearchType } from '../../../domain/search/Search';
import type { SearchOption } from '../components/SearchOptionSuggest';
import { useComplexSearch } from './useComplexSearch';
import { useSearchOptionPair } from './useSearchOptionPair';
import { useSearchOptionPrefix } from './useSearchOptionPrefix';
import { useSuggestedValuesFromCurrentCards } from './useSuggestedValuesFromCurrentCards';
import { useFilterSuggestedValues } from './useFilterSuggestedValues';
import { useLoadSuggestedValues } from './useLoadSuggestedValues';
import { useFrontmatterValues } from './useFrontmatterValues';
import { useDateSearch } from './useDateSearch';
import { useSearchHistory } from './useSearchHistory';

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
  }
];

/**
 * useSearchBar 훅 속성 인터페이스
 */
interface UseSearchBarProps {
  cardNavigatorService: ICardNavigatorService | null | undefined;
  onSearch: (query: string, type?: string) => void;
  currentCards: ICardProps[];
  
  // 추가 속성 - 초기값
  searchQuery?: string;
  searchType?: SearchType;
  caseSensitive?: boolean;
  frontmatterKey?: string;
  searchScope?: 'all' | 'current';
  app?: any; // Obsidian App 인스턴스
}

interface UseSearchBarReturn {
  // 상태
  searchText: string;
  setSearchText: (text: string) => void;
  showSearchSuggestions: boolean;
  setShowSearchSuggestions: (show: boolean) => void;
  showFrontmatterKeySuggestions: boolean;
  setShowFrontmatterKeySuggestions: (show: boolean) => void;
  showSuggestedValues: boolean;
  setShowSuggestedValues: (show: boolean) => void;
  showSearchHistory: boolean;
  setShowSearchHistory: (show: boolean) => void;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  isDateRangeCardSetSource: boolean;
  setIsDateRangeCardSetSource: (isRange: boolean) => void;
  datePickerType: 'start' | 'end';
  setDatePickerType: (type: 'start' | 'end') => void;
  datePickerPosition: { top: number; left: number };
  setDatePickerPosition: (position: { top: number; left: number }) => void;
  isComplexSearch: boolean;
  setIsComplexSearch: (isComplex: boolean) => void;
  searchHistory: string[];
  setSearchHistory: (history: string[]) => void;
  frontmatterKeys: string[];
  setFrontmatterKeys: (keys: string[]) => void;
  searchScope: 'all' | 'current';
  setSearchScope: (scope: 'all' | 'current') => void;
  suggestedValues: string[];
  setSuggestedValues: (values: string[]) => void;
  selectedSuggestionIndex: number;
  setSelectedSuggestionIndex: (index: number) => void;
  currentSearchOption: SearchOption | null;
  setCurrentSearchOption: (option: SearchOption | null) => void;
  frontmatterKey: string;
  setFrontmatterKey: (key: string) => void;
  
  // 참조
  inputRef: React.RefObject<HTMLInputElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  datePickerRef: React.RefObject<HTMLDivElement>;
  searchHistoryRef: React.RefObject<HTMLDivElement>;
  
  // 핸들러
  handleTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleClear: () => void;
  handleFocus: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSearchOptionSelect: (option: SearchOption, evt: MouseEvent | KeyboardEvent) => void;
  handleDateSelect: (date: string) => void;
  handleSearchScopeToggle: () => void;
  handleFrontmatterKeySelect: (key: string) => void;
  handleSuggestedValueSelect: (value: string) => void;
  handleSearchHistorySelect: (query: string) => void;
  handleClickOutside: (event: MouseEvent) => void;
  clearSearchHistory: () => void;
  
  // 서비스 호출
  getScopedTags: (searchScope: 'all' | 'current') => Promise<string[]>;
  getScopedFilenames: (searchScope: 'all' | 'current') => Promise<string[]>;
  getScopedFrontmatterKeys: (searchScope: 'all' | 'current') => Promise<string[]>;
  getScopedFrontmatterValues: (key: string, searchScope: 'all' | 'current') => Promise<string[]>;
  
  // 유틸리티 함수
  loadSuggestedValues: (option: SearchOption, searchScope?: 'all' | 'current') => Promise<void>;
  loadFrontmatterValues: (key: string, searchScope?: 'all' | 'current') => Promise<void>;
  filterSuggestedValues: (filterText: string, currentSearchOption?: SearchOption | null, searchScope?: 'all' | 'current', isComplexSearch?: boolean) => void;
  
  // 검색 옵션
  searchOptions: SearchOption[];
  
  // 필터링된 검색 옵션 목록
  filteredSuggestions: SearchOption[];
  setFilteredSuggestions: (suggestions: SearchOption[]) => void;
}

/**
 * 검색바 관련 핵심 로직을 처리하는 훅
 */
export const useSearchBar = (props: UseSearchBarProps): UseSearchBarReturn => {
  const { 
    cardNavigatorService: originalCardNavigatorService, 
    onSearch, 
    currentCards,
    searchQuery = '',
    searchType = 'filename',
    caseSensitive = false,
    frontmatterKey: initialFrontmatterKey = '',
    searchScope: initialSearchScope = 'current',
    app
  } = props;
  
  // cardNavigatorService가 undefined인 경우 null로 변환
  const cardNavigatorService = originalCardNavigatorService || null;
  
  // 상태
  const [searchText, setSearchText] = useState<string>(searchQuery);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState<boolean>(false);
  const [showFrontmatterKeySuggestions, setShowFrontmatterKeySuggestions] = useState<boolean>(false);
  const [showSuggestedValues, setShowSuggestedValues] = useState<boolean>(false);
  const [showSearchHistory, setShowSearchHistory] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [isDateRangeCardSetSource, setIsDateRangeCardSetSource] = useState<boolean>(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [datePickerPosition, setDatePickerPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isComplexSearch, setIsComplexSearch] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [frontmatterKeys, setFrontmatterKeys] = useState<string[]>([]);
  
  // 검색 범위 상태 초기화 (설정에서 기본값 가져오기)
  const [searchScope, setSearchScope] = useState<'all' | 'current'>(() => {
    if (cardNavigatorService) {
      // 검색 서비스에서 현재 설정된 검색 범위 가져오기
      return cardNavigatorService.getSearchService().getSearchScope();
    }
    return 'current';
  });
  
  const [suggestedValues, setSuggestedValues] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  
  // 초기 검색 옵션 설정
  const [currentSearchOption, setCurrentSearchOption] = useState<SearchOption | null>(() => {
    if (searchType) {
      // SearchType을 SearchOption으로 변환
      const option = SEARCH_OPTIONS.find(opt => {
        switch (searchType) {
          case 'filename':
            return opt.type === 'filename';
          case 'content':
            return opt.type === 'content';
          case 'tag':
            return opt.type === 'tag';
          case 'path':
            return opt.type === 'path';
          case 'frontmatter':
            return opt.type === 'frontmatter';
          case 'create':
            return opt.type === 'created';
          case 'modify':
            return opt.type === 'modified';
          case 'folder':
            return opt.type === 'folder';
          default:
            return false;
        }
      });
      return option || null;
    }
    return null;
  });
  
  const [frontmatterKey, setFrontmatterKey] = useState<string>(initialFrontmatterKey);
  
  // 필터링된 검색 옵션 목록
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchOption[]>(SEARCH_OPTIONS);
  
  // 참조
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const _optionIndexRef = useRef<number>(0);
  
  // 새로 만든 훅들 사용
  const { isComplexSearch: _isComplexSearch, setIsComplexSearch: _setIsComplexSearch, updateComplexSearchStatus } = useComplexSearch();
  const { checkIfAfterSearchOptionPair } = useSearchOptionPair();
  const { getSearchOptionByPrefix } = useSearchOptionPrefix(SEARCH_OPTIONS);
  const { 
    loadSuggestedValuesFromCurrentCards,
    suggestedValues: _currentCardsSuggestedValues,
    setSuggestedValues: _setCurrentCardsSuggestedValues,
    showSuggestedValues: _showCurrentCardsSuggestedValues,
    setShowSuggestedValues: _setShowCurrentCardsSuggestedValues,
    selectedSuggestionIndex: _currentCardsSelectedSuggestionIndex,
    setSelectedSuggestionIndex: _setCurrentCardsSelectedSuggestionIndex,
    mapPropsToCard: _currentCardsMapPropsToCard,
    mapPropsArrayToCardArray: currentCardsMapPropsArrayToCardArray
  } = useSuggestedValuesFromCurrentCards(cardNavigatorService, currentCards);
  const { filterSuggestedValues } = useFilterSuggestedValues(
    cardNavigatorService,
    currentCards,
    suggestedValues,
    setSuggestedValues,
    setShowSuggestedValues,
    setSelectedSuggestionIndex,
    currentCardsMapPropsArrayToCardArray
  );
  const {
    loadSuggestedValues,
    suggestedValues: _loadedSuggestedValues,
    setSuggestedValues: _setLoadedSuggestedValues,
    showSuggestedValues: _showLoadedSuggestedValues,
    setShowSuggestedValues: _setLoadedShowSuggestedValues,
    selectedSuggestionIndex: _loadedSelectedSuggestionIndex,
    setSelectedSuggestionIndex: _setLoadedSelectedSuggestionIndex,
    currentSearchOption: _loadedCurrentSearchOption,
    setCurrentSearchOption: _setLoadedCurrentSearchOption
  } = useLoadSuggestedValues(cardNavigatorService, currentCards, currentCardsMapPropsArrayToCardArray);
  const { loadFrontmatterValues } = useFrontmatterValues(cardNavigatorService, currentCards, currentCardsMapPropsArrayToCardArray);
  
  // 날짜 검색 훅 사용
  const {
    showDatePicker: _showDatePicker,
    setShowDatePicker: _setShowDatePicker,
    isDateRangeCardSetSource: _isDateRangeCardSetSource,
    setIsDateRangeCardSetSource: _setIsDateRangeCardSetSource,
    datePickerType: _datePickerType,
    setDatePickerType: _setDatePickerType,
    datePickerPosition: _datePickerPosition,
    setDatePickerPosition: _setDatePickerPosition,
    datePickerRef,
    handleDateSelect,
    checkForDateSearch: _checkForDateSearch
  } = useDateSearch({
    cardNavigatorService,
    searchText,
    setSearchText,
    inputRef
  });
  
  // 검색 히스토리 훅 사용
  const {
    searchHistory: _searchHistory,
    setSearchHistory: _setSearchHistory,
    showSearchHistory: _showSearchHistory,
    setShowSearchHistory: _setShowSearchHistory,
    searchHistoryRef,
    handleHistoryItemClick,
    toggleSearchHistory: _toggleSearchHistory,
    clearSearchHistory
  } = useSearchHistory({
    cardNavigatorService,
    searchText,
    setSearchText,
    onSearch
  });
  
  // 프론트매터 키 로드
  useEffect(() => {
    const loadFrontmatterKeys = async () => {
      if (cardNavigatorService) {
        try {
          const keys = await cardNavigatorService.getSearchService().getFrontmatterKeys();
          setFrontmatterKeys(keys);
        } catch (error) {
          console.error('프론트매터 키 로드 중 오류 발생:', error);
        }
      }
    };
    
    loadFrontmatterKeys();
  }, [cardNavigatorService]);
  
  // 외부 클릭 감지 이벤트 핸들러
  useEffect(() => {
    const handleClickOutsideEvent = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSearchSuggestions(false);
        setShowFrontmatterKeySuggestions(false);
        setShowSuggestedValues(false);
        setShowSearchHistory(false);
        setShowDatePicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutsideEvent);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideEvent);
    };
  }, [containerRef]);
  
  /**
   * 텍스트 변경 핸들러
   */
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    
    // 검색어 업데이트
    setSearchText(newText);
    
    // 복합 검색 상태 업데이트
    const _isComplex = updateComplexSearchStatus(newText);
    
    // 검색어가 비어있으면 검색 제안 숨기기
    if (!newText.trim()) {
      setShowSearchSuggestions(false);
      setShowFrontmatterKeySuggestions(false);
      setShowSuggestedValues(false);
      
      // 디바운스 처리로 타이핑 중에 너무 많은 검색이 실행되지 않도록 함
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      searchDebounceRef.current = setTimeout(() => {
        onSearch(newText);
      }, 100);
      
      return;
    }
    
    // 검색 타입 확인
    const searchOptionPrefix = getSearchOptionByPrefix(newText);
    
    // 검색 타입이 있는 경우
    if (searchOptionPrefix) {
      // 검색 타입에 따라 다른 처리
      switch (searchOptionPrefix.type) {
        case 'frontmatter':
          // 프론트매터 검색인 경우 프론트매터 키 제안 표시
          setShowSearchSuggestions(false);
          setShowFrontmatterKeySuggestions(true);
          setShowSuggestedValues(false);
          
          // 검색 결과를 유지하기 위해 검색 옵션 제안을 표시하되,
          // 검색 실행은 그대로 유지
          if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
          }
          searchDebounceRef.current = setTimeout(() => {
            // 스페이스바만 있는 경우가 아니라면 검색 실행
            if (newText.trim() !== '') {
              onSearch(newText);
            }
          }, 100);
          break;
          
        case 'create':
        case 'modify':
          // 날짜 검색인 경우 날짜 선택기 표시
          setShowSearchSuggestions(false);
          setShowFrontmatterKeySuggestions(false);
          setShowSuggestedValues(false);
          
          // 항상 검색 실행 (접두사 이후 내용 확인 없이)
          // 디바운스 처리로 타이핑 중에 너무 많은 검색이 실행되지 않도록 함
          if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
          }
          searchDebounceRef.current = setTimeout(() => {
            onSearch(newText, searchOptionPrefix.type);
          }, 100);
          break;
          
        default:
          // 다른 검색 타입인 경우 검색 옵션 제안 숨기기
          setShowSearchSuggestions(false);
          setShowFrontmatterKeySuggestions(false);
          
          // 디바운스 처리로 타이핑 중에 너무 많은 검색이 실행되지 않도록 함
          if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
          }
          searchDebounceRef.current = setTimeout(() => {
            onSearch(newText);
          }, 100);
          break;
      }
    } else {
      // 검색 타입이 없는 경우 검색 옵션 제안 표시
      setShowSearchSuggestions(true);
      setShowFrontmatterKeySuggestions(false);
      setShowSuggestedValues(false);
      
      // 디바운스 처리로 타이핑 중에 너무 많은 검색이 실행되지 않도록 함
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      searchDebounceRef.current = setTimeout(() => {
        onSearch(newText);
      }, 100);
    }
  };
  
  /**
   * 검색 제출 핸들러
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchText.trim()) return;
    
    try {
      // 검색 옵션 확인
      const searchOption = getSearchOptionByPrefix(searchText);
      
      // 복합 검색 여부 업데이트
      const isComplex = updateComplexSearchStatus(searchText);
      
      // 검색 실행
      if (searchOption) {
        onSearch(searchText, searchOption.type);
      } else {
        onSearch(searchText);
      }
      
      // 검색 기록 저장
      if (cardNavigatorService) {
        cardNavigatorService.getSearchService().saveSearchHistory(searchText);
        const history = cardNavigatorService.getSearchService().getSearchHistory();
        setSearchHistory(history);
      }
      
      // 검색 제안 숨기기
      setShowSearchSuggestions(false);
      setShowFrontmatterKeySuggestions(false);
      setShowSuggestedValues(false);
    } catch (error) {
      console.error('검색 제출 처리 중 오류 발생:', error);
    }
  };
  
  /**
   * 검색어 지우기 핸들러
   */
  const handleClear = () => {
    setSearchText('');
    setShowSearchSuggestions(true);
    setShowFrontmatterKeySuggestions(false);
    setShowSuggestedValues(false);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // 검색 초기화
    onSearch('');
  };
  
  /**
   * 포커스 핸들러
   */
  const handleFocus = () => {
    console.log('handleFocus 호출됨, 검색어:', searchText);
    
    // 검색어가 비어있으면 검색 옵션 제안 표시
    if (!searchText.trim()) {
      console.log('검색어가 비어있어 검색 옵션 제안 표시');
      setShowSearchSuggestions(true);
    }
    
    // 검색 기록 로드
    if (cardNavigatorService) {
      const history = cardNavigatorService.getSearchService().getSearchHistory();
      setSearchHistory(history);
    }
  };
  
  /**
   * 키 입력 핸들러
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    try {
      // 날짜 선택기가 표시 중이면 키 이벤트 무시
      if (showDatePicker) return;
      
      // 검색어 제안 목록이 표시 중인 경우
      if (showSearchSuggestions) {
        const filteredOptions = SEARCH_OPTIONS.filter(option => 
          option.label.toLowerCase().includes(searchText.toLowerCase()) ||
          option.prefix.toLowerCase().includes(searchText.toLowerCase())
        );
        
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedSuggestionIndex(prev => 
              prev < filteredOptions.length - 1 ? prev + 1 : prev
            );
            return;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
            return;
          case 'Enter':
          case 'Tab':
            if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < filteredOptions.length) {
              e.preventDefault();
              handleSearchOptionSelect(filteredOptions[selectedSuggestionIndex], e as unknown as KeyboardEvent);
              return;
            }
            break;
          case 'Escape':
            e.preventDefault();
            setShowSearchSuggestions(false);
            return;
        }
      }
      
      // 프론트매터 키 제안 목록이 표시 중인 경우
      if (showFrontmatterKeySuggestions) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedSuggestionIndex(prev => 
              prev < frontmatterKeys.length - 1 ? prev + 1 : prev
            );
            return;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
            return;
          case 'Enter':
          case 'Tab':
            if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < frontmatterKeys.length) {
              e.preventDefault();
              handleFrontmatterKeySelect(frontmatterKeys[selectedSuggestionIndex]);
              return;
            }
            break;
          case 'Escape':
            e.preventDefault();
            setShowFrontmatterKeySuggestions(false);
            return;
        }
      }
      
      // 추천 검색어 목록이 표시 중인 경우
      if (showSuggestedValues) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedSuggestionIndex(prev => 
              prev < suggestedValues.length - 1 ? prev + 1 : prev
            );
            return;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
            return;
          case 'Enter':
          case 'Tab':
            if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestedValues.length) {
              e.preventDefault();
              handleSuggestedValueSelect(suggestedValues[selectedSuggestionIndex]);
              return;
            }
            break;
          case 'Escape':
            e.preventDefault();
            setShowSuggestedValues(false);
            return;
        }
      }
      
      // Alt + 숫자 키 단축키 처리
      if (e.altKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        
        // 검색 옵션 제안이 표시 중인 경우
        if (showSearchSuggestions) {
          // 필터링된 옵션 목록 가져오기
          const filteredOptions = SEARCH_OPTIONS.filter(option => 
            option.label.toLowerCase().includes(searchText.toLowerCase()) ||
            option.prefix.toLowerCase().includes(searchText.toLowerCase()) ||
            option.description.toLowerCase().includes(searchText.toLowerCase())
          );
          
          // 인덱스가 유효한지 확인
          if (index >= 0 && index < filteredOptions.length) {
            const selectedOption = filteredOptions[index];
            console.log(`Alt+${e.key} 단축키로 선택된 옵션:`, selectedOption.type, selectedOption.prefix);
            
            // 선택된 옵션 처리
            handleSearchOptionSelect(selectedOption, e as unknown as KeyboardEvent);
            return;
          }
        }
        
        // 추천 검색어가 표시 중인 경우
        if (showSuggestedValues && index < suggestedValues.length) {
          handleSuggestedValueSelect(suggestedValues[index]);
          return;
        }
      }
      
      // Enter 키로 검색 실행
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    } catch (error) {
      console.error('키 이벤트 처리 중 오류 발생:', error);
    }
  };
  
  /**
   * 검색 옵션 선택 핸들러
   */
  const handleSearchOptionSelect = (option: SearchOption, evt: MouseEvent | KeyboardEvent) => {
    try {
      // 현재 선택된 검색 옵션 업데이트
      setCurrentSearchOption(option);
      
      // 추천 검색어 관련 상태 초기화
      setShowSuggestedValues(false);
      setSelectedSuggestionIndex(-1);
      
      // 검색 제안 숨기기
      setShowSearchSuggestions(false);
      
      // 마우스 이벤트일 때는 SearchOptionSuggest에서 이미 처리했으므로 추가 처리 불필요
      if (evt instanceof MouseEvent) {
        // 마우스 이벤트 처리는 SearchOptionSuggest에서 수행
        // 검색 실행만 수행
        if (inputRef.current) {
          onSearch(inputRef.current.value, option.type);
        }
        return;
      }
      
      // 키보드 이벤트일 때만 추가 처리
      if (inputRef.current) {
        // 검색 옵션 접두사 생성
        let insertText = option.prefix;
        let newCursorPosition = 0;
        
        // 옵션 타입에 따라 접두사 형식 조정
        if (option.type === 'frontmatter') {
          insertText += ']:'; // 프론트매터 검색의 경우 닫는 괄호와 콜론 추가
          newCursorPosition = insertText.length - 2; // 커서를 대괄호 안에 위치시킴
        } else if (option.type === 'create' || option.type === 'modify') {
          // 날짜 검색의 경우 시작일 옵션 추가
          insertText += ' [start date]:';
          newCursorPosition = insertText.length;
          
          setDatePickerType('start');
          setIsDateRangeCardSetSource(true);
          
          // 날짜 선택기 표시
          setTimeout(() => {
            if (inputRef.current) {
              const rect = inputRef.current.getBoundingClientRect();
              setDatePickerPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX
              });
              setShowDatePicker(true);
            }
          }, 100);
        } else if (option.type === 'filename' || option.type === 'path') {
          // 파일명과 경로 검색의 경우 큰따옴표 추가
          insertText += '"';
          newCursorPosition = insertText.length;
        } else {
          // 다른 검색 타입의 경우 커서 위치 조정
          newCursorPosition = insertText.length;
        }
        
        // 입력 필드에 접두사 삽입
        inputRef.current.value = insertText;
        setSearchText(insertText);
        
        // 커서 위치 조정
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        
        // 입력 필드에 포커스
        inputRef.current.focus();
        
        // 검색 실행
        onSearch(insertText, option.type);
      }
    } catch (error) {
      console.error('검색 옵션 선택 처리 중 오류 발생:', error);
    }
  };
  
  /**
   * 검색 범위 토글 핸들러
   */
  const handleSearchScopeToggle = () => {
    const newScope = searchScope === 'all' ? 'current' : 'all';
    setSearchScope(newScope);
    
    if (cardNavigatorService) {
      cardNavigatorService.getSearchService().setSearchScope(newScope);
    }
  };
  
  /**
   * 프론트매터 키 선택 핸들러
   */
  const handleFrontmatterKeySelect = (key: string) => {
    if (!inputRef.current) return;
    
    const _cursorPosition = inputRef.current.selectionStart || 0;
    
    console.log('프론트매터 키 선택:', key);
    
    // 현재 검색어 가져오기
    const currentText = searchText;
    
    // 프론트매터 검색 옵션 찾기
    const frontmatterOption = SEARCH_OPTIONS.find(option => option.type === 'frontmatter');
    if (!frontmatterOption) return;
    
    // 새 검색어 생성 (프론트매터 키 추가)
    let newText = '';
    
    // 검색어가 비어있거나 프론트매터 접두사로 시작하지 않는 경우
    if (!currentText.trim() || !currentText.startsWith(frontmatterOption.prefix)) {
      newText = `${frontmatterOption.prefix}[${key}]: `;
    } else {
      // 이미 프론트매터 접두사가 있는 경우, 대괄호 안의 내용만 교체
      const bracketStartIndex = currentText.indexOf('[');
      const bracketEndIndex = currentText.indexOf(']');
      
      if (bracketStartIndex !== -1 && bracketEndIndex !== -1) {
        newText = currentText.substring(0, bracketStartIndex + 1) + key + currentText.substring(bracketEndIndex);
      } else {
        // 대괄호가 없는 경우, 접두사 뒤에 추가
        newText = `${frontmatterOption.prefix}[${key}]: `;
      }
    }
    
    // 검색어 업데이트
    setSearchText(newText);
    
    // 프론트매터 키 저장
    setFrontmatterKey(key);
    
    // 프론트매터 값 로드
    loadFrontmatterValues(key, searchScope);
    
    // 다음 렌더링 후 커서 위치 설정
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPosition = newText.length;
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
    
    // 프론트매터 키 선택 후 자동으로 검색 실행
    setTimeout(() => {
      onSearch(newText, 'frontmatter');
    }, 100);
  };
  
  /**
   * 추천 검색어 선택 핸들러
   */
  const handleSuggestedValueSelect = (value: string) => {
    if (!inputRef.current || !currentSearchOption) return;
    
    const _cursorPosition = inputRef.current.selectionStart || 0;
    
    console.log('추천 검색어 선택:', value);
    
    // 현재 검색어 가져오기
    const currentText = searchText;
    
    // 검색 옵션 접두사 위치 찾기
    const prefixIndex = currentText.lastIndexOf(currentSearchOption.prefix);
    
    // 접두사 이후의 텍스트 교체
    let newText = '';
    const prefixEndIndex = prefixIndex + currentSearchOption.prefix.length;
    
    // 접두사 이후의 텍스트를 선택한 값으로 교체
    newText = currentText.substring(0, prefixEndIndex) + value;
    
    // 검색어 업데이트
    setSearchText(newText);
    
    // 추천 검색어 숨기기
    setShowSuggestedValues(false);
    
    // 검색 실행
    if (currentSearchOption.type === 'filename' || currentSearchOption.type === 'path') {
      // 파일명이나 경로 검색인 경우 즉시 검색 실행
      onSearch(newText, currentSearchOption.type);
    } else {
      // 다른 검색 타입인 경우 약간의 지연 후 검색 실행
      setTimeout(() => {
        onSearch(newText, currentSearchOption.type);
      }, 100);
    }
  };
  
  // 검색 기록 선택 핸들러
  const handleSearchHistorySelect = (query: string) => {
    setSearchText(query);
    setShowSearchHistory(false);
    
    // 검색 실행
    if (onSearch) {
      onSearch(query);
    }
  };
  
  // 서비스 호출 메서드들
  const getScopedTags = async (scope: 'all' | 'current'): Promise<string[]> => {
    if (!cardNavigatorService) return [];
    
    try {
      const searchService = (cardNavigatorService as any).searchService;
      if (searchService && typeof searchService.getScopedTags === 'function') {
        return await searchService.getScopedTags(scope, currentCards);
      }
      return [];
    } catch (error) {
      console.error('[useSearchBar] 태그 목록 가져오기 오류:', error);
      return [];
    }
  };
  
  const getScopedFilenames = async (scope: 'all' | 'current'): Promise<string[]> => {
    if (!cardNavigatorService) return [];
    
    try {
      const searchService = (cardNavigatorService as any).searchService;
      if (searchService && typeof searchService.getScopedFilenames === 'function') {
        return await searchService.getScopedFilenames(scope, currentCards);
      }
      return [];
    } catch (error) {
      console.error('[useSearchBar] 파일명 목록 가져오기 오류:', error);
      return [];
    }
  };
  
  const getScopedFrontmatterKeys = async (scope: 'all' | 'current'): Promise<string[]> => {
    if (!cardNavigatorService) return [];
    
    try {
      const searchService = (cardNavigatorService as any).searchService;
      if (searchService && typeof searchService.getScopedFrontmatterKeys === 'function') {
        return await searchService.getScopedFrontmatterKeys(scope, currentCards);
      }
      return [];
    } catch (error) {
      console.error('[useSearchBar] 프론트매터 키 목록 가져오기 오류:', error);
      return [];
    }
  };
  
  const getScopedFrontmatterValues = async (key: string, scope: 'all' | 'current'): Promise<string[]> => {
    if (!cardNavigatorService || !key) return [];
    
    try {
      const searchService = (cardNavigatorService as any).searchService;
      if (searchService && typeof searchService.getScopedFrontmatterValues === 'function') {
        return await searchService.getScopedFrontmatterValues(key, scope, currentCards);
      }
      return [];
    } catch (error) {
      console.error('[useSearchBar] 프론트매터 값 목록 가져오기 오류:', error);
      return [];
    }
  };
  
  // 초기화
  useEffect(() => {
    if (searchQuery) {
      setSearchText(searchQuery);
    }
  }, [searchQuery]);
  
  return {
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
    isDateRangeCardSetSource,
    setIsDateRangeCardSetSource,
    datePickerType,
    setDatePickerType,
    datePickerPosition,
    setDatePickerPosition,
    isComplexSearch,
    setIsComplexSearch,
    searchHistory,
    setSearchHistory,
    frontmatterKeys,
    setFrontmatterKeys,
    searchScope,
    setSearchScope,
    suggestedValues,
    setSuggestedValues,
    selectedSuggestionIndex,
    setSelectedSuggestionIndex,
    currentSearchOption,
    setCurrentSearchOption,
    frontmatterKey,
    setFrontmatterKey,
    
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
    handleFrontmatterKeySelect,
    handleSuggestedValueSelect,
    handleSearchHistorySelect,
    handleClickOutside: (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSearchSuggestions(false);
        setShowFrontmatterKeySuggestions(false);
        setShowSuggestedValues(false);
        setShowSearchHistory(false);
        setShowDatePicker(false);
      }
    },
    clearSearchHistory,
    
    // 서비스 호출
    getScopedTags,
    getScopedFilenames,
    getScopedFrontmatterKeys,
    getScopedFrontmatterValues,
    
    // 유틸리티 함수
    loadSuggestedValues,
    loadFrontmatterValues,
    filterSuggestedValues,
    
    // 검색 옵션
    searchOptions: SEARCH_OPTIONS,
    
    // 필터링된 검색 옵션 목록
    filteredSuggestions,
    setFilteredSuggestions
  };
};

export default useSearchBar;

