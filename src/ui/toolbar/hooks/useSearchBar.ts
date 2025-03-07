import { useState, useRef, useEffect } from 'react';
import { ICardNavigatorService } from '../../../application/CardNavigatorService';
import { ICardProps } from '../../../ui/cards-container/Card';
import { ICard } from '../../../domain/card/Card';
import type { SearchOption } from '../components/SearchSuggestions';

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

interface UseSearchBarProps {
  cardNavigatorService: ICardNavigatorService | null;
  onSearch: (query: string, type?: string) => void;
  currentCards: ICardProps[];
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
  
  // 검색 옵션
  searchOptions: SearchOption[];
}

/**
 * 검색바 관련 핵심 로직을 처리하는 훅
 */
export const useSearchBar = (props: UseSearchBarProps): UseSearchBarReturn => {
  const { cardNavigatorService, onSearch, currentCards } = props;
  
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
        setCurrentSearchOption(null);
        return;
      }
      
      // 프론트매터 키 입력 중인지 확인
      const frontmatterKeyMatch = newValue.match(/\[([^\]]*)\]?$/);
      if (frontmatterKeyMatch) {
        setShowFrontmatterKeySuggestions(true);
        setShowSearchSuggestions(false);
        setShowSuggestedValues(false);
        return;
      }
      
      setShowFrontmatterKeySuggestions(false);
      
      // 검색어에 따라 제안 필터링
      const searchOptionPrefix = getSearchOptionByPrefix(newValue);
      
      if (searchOptionPrefix) {
        // 검색 옵션 접두사가 있으면 검색 옵션 제안 숨기기
        setShowSearchSuggestions(false);
        
        // 현재 선택된 검색 옵션 업데이트
        if (!currentSearchOption || currentSearchOption.type !== searchOptionPrefix.type) {
          console.log('검색 옵션 변경:', searchOptionPrefix.type, searchOptionPrefix.prefix);
          setCurrentSearchOption(searchOptionPrefix);
          
          // 검색 옵션에 따른 추천 검색어 로드
          if (searchOptionPrefix.type !== 'frontmatter' && 
              searchOptionPrefix.type !== 'create' && 
              searchOptionPrefix.type !== 'modify' && 
              searchOptionPrefix.type !== 'complex') {
            // 약간의 지연을 두고 추천 검색어 로드 (상태 업데이트 후)
            setTimeout(() => {
              loadSuggestedValues(searchOptionPrefix);
            }, 50);
          }
        } else {
          // 이미 같은 검색 옵션이 선택되어 있고 추천 검색어가 표시 중이면 필터링
          // 파이프로 구분된 부분이 있는 경우 마지막 부분만 고려
          const parts = newValue.split('|');
          const lastPart = parts[parts.length - 1].trim();
          
          // 접두사 이후의 텍스트 추출
          let prefixContent = '';
          if (lastPart.startsWith(searchOptionPrefix.prefix)) {
            prefixContent = lastPart.substring(searchOptionPrefix.prefix.length).trim();
          } else if (newValue.includes(searchOptionPrefix.prefix)) {
            const prefixIndex = newValue.lastIndexOf(searchOptionPrefix.prefix);
            prefixContent = newValue.substring(prefixIndex + searchOptionPrefix.prefix.length).trim();
          }
          
          // 추천 검색어 필터링
          if (prefixContent) {
            filterSuggestedValues(prefixContent);
          }
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
        let prefixContent = '';
        if (isComplex) {
          // 복합 검색의 경우 마지막 부분만 고려
          const parts = newValue.split('|');
          const lastPart = parts[parts.length - 1].trim();
          
          if (lastPart.startsWith(searchOptionPrefix.prefix)) {
            prefixContent = lastPart.substring(searchOptionPrefix.prefix.length).trim();
          }
        } else if (newValue.includes(searchOptionPrefix.prefix)) {
          const prefixIndex = newValue.indexOf(searchOptionPrefix.prefix);
          prefixContent = newValue.substring(prefixIndex + searchOptionPrefix.prefix.length).trim();
        }
        
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
        setCurrentSearchOption(null);
        
        // 디바운스 처리로 타이핑 중에 너무 많은 검색이 실행되지 않도록 함
        if (searchDebounceRef.current) {
          clearTimeout(searchDebounceRef.current);
        }
        searchDebounceRef.current = setTimeout(() => {
          onSearch(newValue);
        }, 300);
      }
    } catch (error) {
      console.error('텍스트 변경 처리 중 오류 발생:', error);
    }
  };
  
  /**
   * 검색 옵션 접두사로 검색 옵션 찾기
   */
  const getSearchOptionByPrefix = (text: string): SearchOption | null => {
    try {
      if (!text || text.trim() === '') {
        return null;
      }
      
      // 검색어에서 파이프로 구분된 부분이 있는 경우 마지막 부분만 고려
      const parts = text.split('|');
      const lastPart = parts[parts.length - 1].trim();
      
      // 검색 옵션 접두사 찾기 - 마지막 부분 우선 확인
      for (const option of SEARCH_OPTIONS) {
        // 파이프 접두사는 건너뛰기
        if (option.prefix === '|') continue;
        
        // 마지막 부분이 검색 옵션 접두사로 시작하는지 확인
        if (lastPart.startsWith(option.prefix)) {
          console.log(`검색 옵션 접두사 찾음 (마지막 부분): ${option.type}, ${option.prefix}`);
          return option;
        }
      }
      
      // 전체 텍스트가 검색 옵션 접두사로 시작하는지 확인
      for (const option of SEARCH_OPTIONS) {
        // 파이프 접두사는 건너뛰기
        if (option.prefix === '|') continue;
        
        if (text.startsWith(option.prefix)) {
          console.log(`검색 옵션 접두사 찾음 (전체 텍스트): ${option.type}, ${option.prefix}`);
          return option;
        }
      }
      
      // 복합 검색에서 각 부분별로 검색 옵션 확인
      if (parts.length > 1) {
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim();
          
          for (const option of SEARCH_OPTIONS) {
            // 파이프 접두사는 건너뛰기
            if (option.prefix === '|') continue;
            
            if (part.startsWith(option.prefix)) {
              console.log(`검색 옵션 접두사 찾음 (복합 검색): ${option.type}, ${option.prefix}`);
              return option;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('검색 옵션 접두사 찾기 중 오류 발생:', error);
      return null;
    }
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
              handleSearchOptionSelect(filteredOptions[selectedSuggestionIndex]);
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
            handleSearchOptionSelect(selectedOption);
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
  const handleSearchOptionSelect = (option: SearchOption) => {
    try {
      console.log('검색 옵션 선택 처리 시작:', option.type, option.prefix);
      
      // 현재 선택된 검색 옵션 업데이트
      setCurrentSearchOption(option);
      
      // 추천 검색어 관련 상태 초기화
      setShowSuggestedValues(false);
      setSelectedSuggestionIndex(-1);
      
      // 검색 옵션 처리 후 검색 제안 숨기기 (지연 처리)
      const hideSearchSuggestions = () => {
        setShowSearchSuggestions(false);
      };
      
      // 약간의 지연 후 처리 (UI 업데이트 후)
      setTimeout(() => {
        if (inputRef.current) {
          const cursorPosition = inputRef.current.selectionStart || 0;
          const currentValue = inputRef.current.value;
          
          // 현재 커서 위치 이전과 이후의 텍스트
          const textBeforeCursor = currentValue.substring(0, cursorPosition);
          const textAfterCursor = currentValue.substring(cursorPosition);
          
          // 커서 위치에 접두사 삽입
          let insertText = '';
          let newCursorPosition = 0;
          
          // 복합 검색 옵션 처리
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
          } 
          // 일반 검색 옵션 처리
          else {
            // 현재 입력 필드가 비어있는 경우
            if (currentValue.trim() === '') {
              // 검색 옵션 접두사 사용 - 선택한 옵션의 접두사 사용
              insertText = option.prefix;
              console.log(`빈 입력 필드에 접두사 삽입: ${option.type}, ${option.prefix}`);
              
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
            // 이미 검색어가 있는 경우
            else {
              // 현재 검색어에 이미 검색 옵션이 있는지 확인
              const existingOption = getSearchOptionByPrefix(currentValue);
              
              // 이미 같은 검색 옵션이 있는 경우 (대체)
              if (existingOption && existingOption.type === option.type) {
                // 기존 검색어를 새 검색 옵션으로 대체
                const newValue = option.prefix + currentValue.substring(existingOption.prefix.length);
                console.log(`기존 검색 옵션 대체: ${existingOption.type} -> ${option.type}`);
                setSearchText(newValue);
                
                // 커서 위치 조정
                setTimeout(() => {
                  if (inputRef.current) {
                    inputRef.current.focus();
                    const newPosition = option.prefix.length;
                    inputRef.current.setSelectionRange(newPosition, newPosition);
                  }
                }, 10);
                
                // 검색 옵션에 따른 추천 검색어 로드
                if (option.type !== 'frontmatter' && option.type !== 'create' && option.type !== 'modify' && option.type !== 'complex') {
                  loadSuggestedValues(option);
                }
                
                // 검색 제안 숨기기
                hideSearchSuggestions();
                return;
              }
              
              // 파이프 문자가 있는지 확인하여 복합 검색 여부 판단
              const hasComplexSearch = currentValue.includes('|');
              
              if (hasComplexSearch) {
                // 복합 검색인 경우, 마지막 파이프 이후 부분을 새 검색 옵션으로 대체
                const parts = currentValue.split('|');
                const lastPartIndex = parts.length - 1;
                const lastPart = parts[lastPartIndex].trim();
                
                // 마지막 부분에 이미 검색 옵션이 있는지 확인
                const lastPartOption = getSearchOptionByPrefix(lastPart);
                
                if (lastPartOption) {
                  // 마지막 부분의 검색 옵션을 새 옵션으로 대체
                  parts[lastPartIndex] = ' ' + option.prefix + lastPart.substring(lastPartOption.prefix.length);
                  console.log(`복합 검색에서 마지막 부분 대체: ${lastPartOption.type} -> ${option.type}`);
                } else {
                  // 마지막 부분에 검색 옵션이 없으면 새 옵션 추가
                  parts[lastPartIndex] = ' ' + option.prefix + ' ' + lastPart;
                  console.log(`복합 검색에서 마지막 부분에 새 옵션 추가: ${option.type}`);
                }
                
                // 새 검색어 설정
                const newValue = parts.join('|');
                setSearchText(newValue);
                
                // 커서 위치 조정
                setTimeout(() => {
                  if (inputRef.current) {
                    inputRef.current.focus();
                    const newPosition = newValue.length;
                    inputRef.current.setSelectionRange(newPosition, newPosition);
                  }
                }, 10);
                
                // 검색 제안 숨기기
                hideSearchSuggestions();
                return;
              }
              
              // 복합 검색으로 추가 (파이프 사용)
              if (textBeforeCursor.endsWith(' ') || textBeforeCursor.endsWith('| ')) {
                // 이미 공백이나 파이프가 있으면 접두사만 추가
                insertText = option.prefix;
                console.log(`공백/파이프 이후에 접두사 추가: ${option.type}, ${option.prefix}`);
              } else {
                // 공백과 파이프, 접두사 추가
                insertText = ' | ' + option.prefix;
                console.log(`공백과 파이프, 접두사 추가: ${option.type}, ${option.prefix}`);
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
          console.log(`새 검색어 설정: ${newValue}`);
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
            // 약간의 지연을 두고 추천 검색어 로드 (상태 업데이트 후)
            setTimeout(() => {
              loadSuggestedValues(option);
            }, 50);
          }
          
          // 검색 제안 숨기기
          hideSearchSuggestions();
        }
      }, 20);
    } catch (error) {
      console.error('검색 옵션 선택 처리 중 오류 발생:', error);
      // 오류 발생 시에도 검색 제안 숨기기
      setShowSearchSuggestions(false);
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
      console.log('추천 검색어 로드 시작:', option.type, '검색 범위:', searchScope);
      
      // 현재 선택된 검색 옵션 저장
      setCurrentSearchOption(option);
      
      // 기존 추천 검색어 초기화
      setSuggestedValues([]);
      setShowSuggestedValues(false);
      
      const searchService = cardNavigatorService.getSearchService();
      const currentCardsArray = mapPropsArrayToCardArray(currentCards);
      
      let values: string[] = [];
      
      switch (option.type) {
        case 'tag':
          // 태그 검색: 검색 범위에 따라 전체 또는 현재 카드셋의 태그 로드
          values = await searchService.getScopedTags(searchScope, currentCardsArray);
          break;
        case 'filename':
          // 파일명 검색: 검색 범위에 따라 전체 또는 현재 카드셋의 파일명 로드
          values = await searchService.getScopedFilenames(searchScope, currentCardsArray);
          break;
        case 'frontmatter':
          // 프론트매터 키 목록 로드 (이미 FrontmatterKeySuggestions 컴포넌트에서 처리)
          return;
        case 'path':
          // 경로 검색: 폴더 경로 로드 (검색 범위가 current인 경우 현재 카드셋의 경로만 로드)
          if (searchScope === 'current') {
            // 현재 카드셋의 고유한 경로 목록 추출
            const paths = new Set<string>();
            currentCardsArray.forEach(card => {
              if (card.path) {
                // 파일 이름을 제외한 경로만 추출
                const folderPath = card.path.split('/').slice(0, -1).join('/');
                if (folderPath) paths.add(folderPath);
              }
            });
            values = Array.from(paths);
          } else {
            // 전체 폴더 경로 로드
            values = await searchService.getFolderPaths();
          }
          break;
        case 'content':
          // 내용 검색: 검색 범위에 따라 전체 또는 현재 카드셋의 내용 중 주요 키워드 로드
          // (이 기능은 복잡할 수 있으므로 기본적인 구현만 제공)
          if (searchScope === 'current') {
            // 현재 카드셋의 내용에서 주요 키워드 추출 (간단한 구현)
            const contentWords = new Set<string>();
            currentCardsArray.forEach(card => {
              if (card.content) {
                // 내용에서 단어 추출 (최소 3자 이상)
                const words = card.content.split(/\s+/).filter(word => word.length >= 3);
                words.forEach(word => contentWords.add(word));
              }
            });
            values = Array.from(contentWords).slice(0, 50); // 최대 50개 키워드만 표시
          } else {
            // 전체 내용에서 주요 키워드 추출은 성능 문제로 제한적으로 구현
            // 임시 구현: 검색 서비스에서 제공하는 기능이 없으므로 빈 배열 반환
            values = [];
            console.log('전체 내용 키워드 추출은 아직 구현되지 않았습니다.');
          }
          break;
        default:
          return;
      }
      
      console.log('로드된 추천 검색어:', values.length, '개');
      
      // 중복 제거 및 정렬
      values = [...new Set(values)].sort();
      
      setSuggestedValues(values);
      setShowSuggestedValues(values.length > 0);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error('추천 검색어 로드 중 오류 발생:', error);
      setSuggestedValues([]);
      setShowSuggestedValues(false);
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
      
      // 현재 검색 옵션에 따른 원본 추천 검색어 가져오기
      if (currentSearchOption && cardNavigatorService) {
        const searchService = cardNavigatorService.getSearchService();
        const currentCardsArray = mapPropsArrayToCardArray(currentCards);
        
        // 원본 추천 검색어 로드 (비동기 처리)
        const loadOriginalValues = async () => {
          try {
            let originalValues: string[] = [];
            
            switch (currentSearchOption.type) {
              case 'tag':
                originalValues = await searchService.getScopedTags(searchScope, currentCardsArray);
                break;
              case 'filename':
                originalValues = await searchService.getScopedFilenames(searchScope, currentCardsArray);
                break;
              case 'path':
                if (searchScope === 'current') {
                  const paths = new Set<string>();
                  currentCardsArray.forEach(card => {
                    if (card.path) {
                      const folderPath = card.path.split('/').slice(0, -1).join('/');
                      if (folderPath) paths.add(folderPath);
                    }
                  });
                  originalValues = Array.from(paths);
                } else {
                  originalValues = await searchService.getFolderPaths();
                }
                break;
              default:
                originalValues = suggestedValues;
                break;
            }
            
            // 중복 제거 및 정렬
            originalValues = [...new Set(originalValues)].sort();
            
            // 필터 텍스트에 따라 추천 검색어 필터링
            const lowerCaseFilter = filterText.toLowerCase();
            const filtered = originalValues.filter(value => 
              value.toLowerCase().includes(lowerCaseFilter)
            );
            
            // 필터링된 결과 설정
            setSuggestedValues(filtered);
            setShowSuggestedValues(filtered.length > 0);
            setSelectedSuggestionIndex(-1);
          } catch (error) {
            console.error('원본 추천 검색어 로드 중 오류 발생:', error);
          }
        };
        
        // 원본 추천 검색어 로드 및 필터링 실행
        loadOriginalValues();
      } else {
        // 현재 검색 옵션이 없는 경우 기존 방식으로 필터링
        const lowerCaseFilter = filterText.toLowerCase();
        const filtered = suggestedValues.filter(value => 
          value.toLowerCase().includes(lowerCaseFilter)
        );
        
        // 필터링된 결과 설정
        setSuggestedValues(filtered);
        setShowSuggestedValues(filtered.length > 0);
        setSelectedSuggestionIndex(-1);
      }
    } catch (error) {
      console.error('추천 검색어 필터링 중 오류 발생:', error);
    }
  };
  
  /**
   * 추천 검색어 선택 핸들러
   */
  const handleSuggestedValueSelect = (value: string) => {
    try {
      if (!inputRef.current || !currentSearchOption) return;
      
      console.log('추천 검색어 선택:', value);
      
      // 현재 커서 위치 저장
      const cursorPosition = inputRef.current.selectionStart || 0;
      
      // 현재 검색어 가져오기
      const currentText = searchText;
      
      // 검색 옵션 접두사 찾기
      const prefixIndex = currentText.lastIndexOf(currentSearchOption.prefix);
      if (prefixIndex === -1) return;
      
      // 접두사 이후의 텍스트 시작 위치
      const prefixEndIndex = prefixIndex + currentSearchOption.prefix.length;
      
      // 접두사 이후의 텍스트 (있는 경우 제거)
      let valueStartIndex = prefixEndIndex;
      
      // 공백 이후의 텍스트 찾기
      while (valueStartIndex < currentText.length && 
             currentText[valueStartIndex] === ' ') {
        valueStartIndex++;
      }
      
      // 접두사 이후의 텍스트 끝 위치 찾기 (다음 공백 또는 문자열 끝까지)
      let valueEndIndex = valueStartIndex;
      while (valueEndIndex < currentText.length && 
             currentText[valueEndIndex] !== ' ' && 
             currentText[valueEndIndex] !== '|') {
        valueEndIndex++;
      }
      
      // 새 검색어 생성
      const newText = 
        currentText.substring(0, valueStartIndex) + 
        value + 
        currentText.substring(valueEndIndex);
      
      // 검색어 업데이트
      setSearchText(newText);
      
      // 커서 위치 업데이트 (선택된 값 뒤로)
      const newCursorPosition = valueStartIndex + value.length;
      
      // 다음 렌더링 후 커서 위치 설정
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
      
      // 추천 검색어 숨기기
      setShowSuggestedValues(false);
    } catch (error) {
      console.error('추천 검색어 선택 처리 중 오류 발생:', error);
    }
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
    mapPropsArrayToCardArray,
    
    // 검색 옵션
    searchOptions: SEARCH_OPTIONS
  };
};

export default useSearchBar;
