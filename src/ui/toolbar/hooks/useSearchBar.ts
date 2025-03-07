import { useState, useRef, useEffect } from 'react';
import { ICardNavigatorService } from '../../../application/CardNavigatorService';
import { ICardProps } from '../../../ui/cards-container/Card';
import { ICard } from '../../../domain/card/Card';
import type { SearchOption } from '../components/SearchSuggestions';

interface UseSearchBarProps {
  cardNavigatorService: ICardNavigatorService | null;
  onSearch: (query: string, type?: string) => void;
  currentCards: ICardProps[];
  searchOptions: SearchOption[];
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
  isDateRangeMode: boolean;
  setIsDateRangeMode: (isRange: boolean) => void;
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
  handleSearchOptionSelect: (option: SearchOption) => void;
  handleDateSelect: (date: string) => void;
  handleSearchScopeToggle: () => void;
  handleHistoryItemClick: (query: string) => void;
  handleFrontmatterKeySelect: (key: string) => void;
  handleSuggestedValueSelect: (value: string) => void;
  
  // 유틸리티 함수
  loadSuggestedValues: (option: SearchOption) => Promise<void>;
  loadFrontmatterValues: (key: string) => Promise<void>;
  filterSuggestedValues: (filterText: string) => void;
  mapPropsToCard: (cardProps: ICardProps) => ICard;
  mapPropsArrayToCardArray: (cardProps: ICardProps[]) => ICard[];
}

/**
 * 검색바 관련 핵심 로직을 처리하는 훅
 */
export const useSearchBar = (props: UseSearchBarProps): UseSearchBarReturn => {
  const { cardNavigatorService, onSearch, currentCards, searchOptions } = props;
  
  // 상태
  const [searchText, setSearchText] = useState<string>('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState<boolean>(false);
  const [showFrontmatterKeySuggestions, setShowFrontmatterKeySuggestions] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showSearchHistory, setShowSearchHistory] = useState<boolean>(false);
  const [isDateRangeMode, setIsDateRangeMode] = useState<boolean>(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [datePickerPosition, setDatePickerPosition] = useState<{ top: number, left: number }>({ top: 0, left: 0 });
  const [isComplexSearch, setIsComplexSearch] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [frontmatterKeys, setFrontmatterKeys] = useState<string[]>([]);
  const [searchScope, setSearchScope] = useState<'all' | 'current'>('current');
  
  // 추천 검색어 관련 상태
  const [suggestedValues, setSuggestedValues] = useState<string[]>([]);
  const [showSuggestedValues, setShowSuggestedValues] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [currentSearchOption, setCurrentSearchOption] = useState<SearchOption | null>(null);
  const [frontmatterKey, setFrontmatterKey] = useState<string>('');
  
  // 참조
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const searchHistoryRef = useRef<HTMLDivElement>(null);
  const prevSearchText = useRef<string>('');
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const optionIndexRef = useRef<number>(0);
  
  // 검색 기록 로드
  useEffect(() => {
    if (cardNavigatorService) {
      const history = cardNavigatorService.getSearchService().getSearchHistory();
      setSearchHistory(history);
    }
  }, [cardNavigatorService]);
  
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
  
  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      try {
        // 검색 제안 외부 클릭 감지
        if (
          showSearchSuggestions &&
          inputRef.current && 
          !inputRef.current.contains(target)
        ) {
          setShowSearchSuggestions(false);
        }
        
        // 프론트매터 키 제안 외부 클릭 감지
        if (
          showFrontmatterKeySuggestions &&
          inputRef.current && 
          !inputRef.current.contains(target)
        ) {
          setShowFrontmatterKeySuggestions(false);
        }
        
        // 추천 검색어 외부 클릭 감지
        if (
          showSuggestedValues &&
          inputRef.current && 
          !inputRef.current.contains(target)
        ) {
          setShowSuggestedValues(false);
        }
        
        // 날짜 선택기 외부 클릭 감지
        if (
          showDatePicker &&
          datePickerRef.current && 
          !datePickerRef.current.contains(target) &&
          inputRef.current && 
          !inputRef.current.contains(target)
        ) {
          setShowDatePicker(false);
        }
        
        // 검색 기록 외부 클릭 감지
        if (
          showSearchHistory &&
          searchHistoryRef.current && 
          !searchHistoryRef.current.contains(target) &&
          inputRef.current && 
          !inputRef.current.contains(target)
        ) {
          setShowSearchHistory(false);
        }
      } catch (error) {
        console.error('외부 클릭 처리 중 오류 발생:', error);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchSuggestions, showFrontmatterKeySuggestions, showDatePicker, showSearchHistory, showSuggestedValues]);
  
  /**
   * 텍스트 변경 핸들러
   */
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const newValue = e.target.value;
      setSearchText(newValue);
      
      // 복합 검색 여부 확인
      const isComplex = newValue.includes('|');
      setIsComplexSearch(isComplex);
      
      // 검색어가 비어있으면 검색 옵션 제안 표시
      if (!newValue.trim()) {
        setShowSearchSuggestions(true);
        setShowFrontmatterKeySuggestions(false);
        setShowSuggestedValues(false);
      } else {
        // 프론트매터 키 입력 중인지 확인
        const frontmatterKeyMatch = newValue.match(/\[([^\]]*)\]?$/);
        if (frontmatterKeyMatch) {
          setShowFrontmatterKeySuggestions(true);
          setShowSearchSuggestions(false);
          setShowSuggestedValues(false);
        } else {
          setShowFrontmatterKeySuggestions(false);
          
          // 검색어에 따라 제안 필터링
          const searchOptionPrefix = getSearchOptionByPrefix(newValue);
          
          if (searchOptionPrefix) {
            // 검색 옵션 접두사가 있으면 제안 숨기기
            setShowSearchSuggestions(false);
            
            // 현재 선택된 검색 옵션 업데이트
            if (currentSearchOption?.type !== searchOptionPrefix.type) {
              setCurrentSearchOption(searchOptionPrefix);
              
              // 검색 옵션에 따른 추천 검색어 로드
              if (searchOptionPrefix.type !== 'frontmatter' && 
                  searchOptionPrefix.type !== 'create' && 
                  searchOptionPrefix.type !== 'modify' && 
                  searchOptionPrefix.type !== 'complex') {
                loadSuggestedValues(searchOptionPrefix);
              }
            } else if (showSuggestedValues) {
              // 이미 같은 검색 옵션이 선택되어 있고 추천 검색어가 표시 중이면 필터링
              const prefixContent = newValue.substring(searchOptionPrefix.prefix.length).trim();
              filterSuggestedValues(prefixContent);
            }
            
            // 프론트매터 값 필터링
            if (frontmatterKey && newValue.includes(`[${frontmatterKey}]:`)) {
              const keyPattern = new RegExp(`\\[${frontmatterKey}\\]:\\s*(.*?)(?:\\s|$)`);
              const match = newValue.match(keyPattern);
              if (match) {
                filterSuggestedValues(match[1]);
              }
            }
            
            // 검색어에 접두사 이후 내용이 있으면 자동으로 검색 실행
            const prefixContent = newValue.substring(searchOptionPrefix.prefix.length).trim();
            if (prefixContent.length > 0) {
              // 디바운스 처리로 타이핑 중에 너무 많은 검색이 실행되지 않도록 함
              if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
              }
              searchDebounceRef.current = setTimeout(() => {
                onSearch(newValue, searchOptionPrefix.type);
              }, 300);
            }
          } else {
            // 검색 옵션 접두사가 없으면 검색 옵션 제안 표시
            setShowSearchSuggestions(true);
            setShowSuggestedValues(false);
            
            // 디바운스 처리로 타이핑 중에 너무 많은 검색이 실행되지 않도록 함
            if (searchDebounceRef.current) {
              clearTimeout(searchDebounceRef.current);
            }
            searchDebounceRef.current = setTimeout(() => {
              onSearch(newValue);
            }, 300);
          }
        }
      }
    } catch (error) {
      console.error('텍스트 변경 처리 중 오류 발생:', error);
    }
  };
  
  /**
   * 검색 옵션 접두사로 검색 옵션 찾기
   */
  const getSearchOptionByPrefix = (text: string): SearchOption | null => {
    return searchOptions.find(option => 
      text.startsWith(option.prefix) && option.prefix !== '|'
    ) || null;
  };
  
  /**
   * 검색 제출 핸들러
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchText.trim()) return;
    
    try {
      // 검색 실행
      onSearch(searchText);
      
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
    // 검색어가 비어있으면 검색 옵션 제안 표시
    if (!searchText.trim()) {
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
      // Enter 키로 검색 실행
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        
        // 추천 검색어가 선택된 경우 해당 값 선택
        if (showSuggestedValues && selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestedValues.length) {
          handleSuggestedValueSelect(suggestedValues[selectedSuggestionIndex]);
          return;
        }
        
        // 프론트매터 키 제안이 선택된 경우 해당 키 선택
        if (showFrontmatterKeySuggestions) {
          return;
        }
        
        // 검색 실행
        handleSubmit(e);
        return;
      }
      
      // 추천 검색어 네비게이션
      if (showSuggestedValues && suggestedValues.length > 0) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedSuggestionIndex(prev => (prev + 1) % suggestedValues.length);
            return;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedSuggestionIndex(prev => (prev <= 0 ? suggestedValues.length - 1 : prev - 1));
            return;
          case 'Escape':
            e.preventDefault();
            setShowSuggestedValues(false);
            return;
        }
      }
      
      // 검색 옵션 제안 네비게이션
      if (showSearchSuggestions) {
        // 위/아래 화살표로 검색 옵션 선택
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const optionIndex = Math.min(searchOptions.length - 1, optionIndexRef.current + 1);
          optionIndexRef.current = optionIndex;
          return;
        }
        
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const optionIndex = Math.max(0, optionIndexRef.current - 1);
          optionIndexRef.current = optionIndex;
          return;
        }
        
        // Enter 키로 검색 옵션 선택
        if (e.key === 'Enter') {
          e.preventDefault();
          const optionIndex = optionIndexRef.current;
          if (optionIndex < searchOptions.length) {
            handleSearchOptionSelect(searchOptions[optionIndex]);
          }
          return;
        }
        
        // Tab 키로도 검색 옵션 선택 가능하게 함
        if (e.key === 'Tab') {
          e.preventDefault();
          const optionIndex = optionIndexRef.current;
          if (optionIndex < searchOptions.length) {
            handleSearchOptionSelect(searchOptions[optionIndex]);
          }
          return;
        }
        
        // Escape 키로 검색 옵션 제안 숨기기
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowSearchSuggestions(false);
          setShowFrontmatterKeySuggestions(false);
          setShowDatePicker(false);
          setShowSuggestedValues(false);
          return;
        }
      }
    } catch (error) {
      console.error('키 입력 처리 중 오류 발생:', error);
    }
  };
  
  /**
   * 검색 옵션 선택 핸들러
   */
  const handleSearchOptionSelect = (option: SearchOption) => {
    try {
      console.log('검색 옵션 선택 처리 시작:', option.type, option.prefix);
      
      // 추천 검색어 관련 상태 초기화
      setShowSuggestedValues(false);
      setSelectedSuggestionIndex(-1);
      
      if (inputRef.current) {
        const cursorPosition = inputRef.current.selectionStart || 0;
        const currentValue = inputRef.current.value;
        
        // 현재 커서 위치 이전과 이후의 텍스트
        const textBeforeCursor = currentValue.substring(0, cursorPosition);
        const textAfterCursor = currentValue.substring(cursorPosition);
        
        // 커서 위치에 접두사 삽입
        let insertText = '';
        let newCursorPosition = 0;
        
        if (option.type === 'complex') {
          // 복합 검색의 경우 파이프 추가
          if (currentValue.trim() === '') {
            // 빈 검색어인 경우 파이프 추가하지 않음
            insertText = '';
            newCursorPosition = textBeforeCursor.length + insertText.length;
          } else if (currentValue.endsWith(' ')) {
            // 이미 공백이 있으면 파이프만 추가
            insertText = '| ';
            newCursorPosition = textBeforeCursor.length + insertText.length;
          } else {
            // 공백과 파이프 추가
            insertText = ' | ';
            newCursorPosition = textBeforeCursor.length + insertText.length;
          }
        } else {
          // 현재 입력 필드가 비어있거나 커서가 맨 앞에 있는 경우
          if (currentValue.trim() === '' || cursorPosition === 0) {
            insertText = option.prefix;
            
            if (option.type === 'frontmatter') {
              insertText += ']:'; // 프론트매터 검색의 경우 닫는 괄호와 콜론 추가
              newCursorPosition = insertText.length - 2; // 커서를 대괄호 안에 위치시킴
            } else if (option.type === 'create' || option.type === 'modify') {
              // 날짜 검색의 경우 시작일 옵션 추가
              insertText += ' [start date]:';
              newCursorPosition = insertText.length;
              
              setDatePickerType('start');
              setIsDateRangeMode(true);
              
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
            } else {
              insertText += ' '; // 다른 검색 타입의 경우 공백 추가
              newCursorPosition = insertText.length;
            }
          } 
          // 이미 검색어가 있는 경우 (복합 검색으로 추가)
          else if (currentValue.trim() !== '') {
            // 현재 커서 위치에 파이프와 함께 검색 옵션 추가
            if (textBeforeCursor.endsWith(' ') || textBeforeCursor.endsWith('| ')) {
              // 이미 공백이나 파이프가 있으면 접두사만 추가
              insertText = option.prefix;
            } else {
              // 공백과 파이프, 접두사 추가
              insertText = ' | ' + option.prefix;
            }
            
            if (option.type === 'frontmatter') {
              insertText += ']:'; // 프론트매터 검색의 경우 닫는 괄호와 콜론 추가
              newCursorPosition = textBeforeCursor.length + insertText.length - 2; // 커서를 대괄호 안에 위치시킴
            } else if (option.type === 'create' || option.type === 'modify') {
              // 날짜 검색의 경우 시작일 옵션 추가
              insertText += ' [start date]:';
              newCursorPosition = textBeforeCursor.length + insertText.length;
              
              setDatePickerType('start');
              setIsDateRangeMode(true);
              
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
            } else {
              insertText += ' '; // 다른 검색 타입의 경우 공백 추가
              newCursorPosition = textBeforeCursor.length + insertText.length;
            }
          }
        }
        
        // 새 검색어 설정
        const newValue = textBeforeCursor + insertText + textAfterCursor;
        setSearchText(newValue);
        
        // 커서 위치 조정
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
          }
        }, 10);
        
        // 검색 옵션에 따른 추천 검색어 로드
        if (option.type !== 'frontmatter' && option.type !== 'create' && option.type !== 'modify' && option.type !== 'complex') {
          loadSuggestedValues(option);
        }
      }
      
      // 검색 제안 숨기기
      setShowSearchSuggestions(false);
    } catch (error) {
      console.error('검색 옵션 선택 처리 중 오류 발생:', error);
    }
  };
  
  /**
   * 날짜 선택 핸들러
   */
  const handleDateSelect = (date: string) => {
    // 이 함수는 SearchBar.tsx에서 구현해야 합니다.
    console.log('날짜 선택:', date);
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
   * 검색 기록 항목 클릭 핸들러
   */
  const handleHistoryItemClick = (query: string) => {
    setSearchText(query);
    setShowSearchHistory(false);
    
    // 검색 실행
    onSearch(query);
  };
  
  /**
   * 프론트매터 키 선택 핸들러
   */
  const handleFrontmatterKeySelect = (key: string) => {
    // 이 함수는 SearchBar.tsx에서 구현해야 합니다.
    console.log('프론트매터 키 선택:', key);
  };
  
  /**
   * 추천 검색어 로드
   */
  const loadSuggestedValues = async (option: SearchOption) => {
    if (!cardNavigatorService) return;
    
    try {
      console.log('추천 검색어 로드 시작:', option.type);
      
      // 현재 선택된 검색 옵션 저장
      setCurrentSearchOption(option);
      
      const searchService = cardNavigatorService.getSearchService();
      const currentCardsArray = mapPropsArrayToCardArray(currentCards);
      
      let values: string[] = [];
      
      switch (option.type) {
        case 'tag':
          values = await searchService.getScopedTags(searchScope, currentCardsArray);
          break;
        case 'filename':
          values = await searchService.getScopedFilenames(searchScope, currentCardsArray);
          break;
        case 'frontmatter':
          // 프론트매터 키 목록 로드 (이미 FrontmatterKeySuggestions 컴포넌트에서 처리)
          return;
        case 'path':
          values = await searchService.getFolderPaths();
          break;
        default:
          return;
      }
      
      console.log('로드된 추천 검색어:', values);
      setSuggestedValues(values);
      setShowSuggestedValues(values.length > 0);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error('추천 검색어 로드 중 오류 발생:', error);
    }
  };
  
  /**
   * 프론트매터 값 로드
   */
  const loadFrontmatterValues = async (key: string) => {
    if (!cardNavigatorService) return;
    
    try {
      console.log('프론트매터 값 로드 시작:', key);
      
      // 선택된 프론트매터 키 저장
      setFrontmatterKey(key);
      
      const searchService = cardNavigatorService.getSearchService();
      const currentCardsArray = mapPropsArrayToCardArray(currentCards);
      
      const values = await searchService.getScopedFrontmatterValues(key, searchScope, currentCardsArray);
      console.log('로드된 프론트매터 값:', values);
      
      setSuggestedValues(values);
      setShowSuggestedValues(values.length > 0);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error('프론트매터 값 로드 중 오류 발생:', error);
    }
  };
  
  /**
   * 추천 검색어 필터링
   */
  const filterSuggestedValues = (filterText: string) => {
    try {
      if (!filterText) {
        // 필터 텍스트가 없으면 모든 값 표시
        setShowSuggestedValues(suggestedValues.length > 0);
        return;
      }
      
      // 필터 텍스트에 따라 추천 검색어 필터링
      const lowerCaseFilter = filterText.toLowerCase();
      const filtered = suggestedValues.filter(value => 
        value.toLowerCase().includes(lowerCaseFilter)
      );
      
      setSuggestedValues(filtered);
      setShowSuggestedValues(filtered.length > 0);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error('추천 검색어 필터링 중 오류 발생:', error);
    }
  };
  
  /**
   * 추천 검색어 선택 핸들러
   */
  const handleSuggestedValueSelect = (value: string) => {
    // 이 함수는 SearchBar.tsx에서 구현해야 합니다.
    console.log('추천 검색어 선택:', value);
  };
  
  /**
   * UI 카드 속성을 도메인 카드로 변환하는 함수
   */
  const mapPropsToCard = (cardProps: ICardProps): ICard => {
    return {
      id: cardProps.id,
      title: cardProps.title,
      content: cardProps.content || '',
      tags: cardProps.tags || [],
      path: cardProps.path || '',
      created: cardProps.created || Date.now(),
      modified: cardProps.modified || Date.now(),
      frontmatter: {} // ICardProps에는 frontmatter 속성이 없으므로 빈 객체로 초기화
    };
  };
  
  /**
   * UI 카드 속성 배열을 도메인 카드 배열로 변환하는 함수
   */
  const mapPropsArrayToCardArray = (cardProps: ICardProps[]): ICard[] => {
    return cardProps.map(mapPropsToCard);
  };
  
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
    isDateRangeMode,
    setIsDateRangeMode,
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
    handleHistoryItemClick,
    handleFrontmatterKeySelect,
    handleSuggestedValueSelect,
    
    // 유틸리티 함수
    loadSuggestedValues,
    loadFrontmatterValues,
    filterSuggestedValues,
    mapPropsToCard,
    mapPropsArrayToCardArray
  };
};

export default useSearchBar;
