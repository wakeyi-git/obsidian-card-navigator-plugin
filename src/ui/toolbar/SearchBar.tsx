import React, { useState, useRef, useEffect } from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { SearchType } from '../../domain/search/Search';
import { ModeType } from '../../domain/mode/Mode';
import { App, TFile } from 'obsidian';
import { ICard } from '../../domain/card/Card';
import { ICardProps } from '../cards-container/Card';
import './SearchBar.css';

/**
 * 검색 옵션 인터페이스
 */
interface SearchOption {
  type: string;
  label: string;
  description: string;
  prefix: string;
}

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
 * 검색 옵션 아이콘 가져오기
 * @param type 검색 옵션 타입
 * @returns SVG 아이콘 요소
 */
const getSearchOptionIcon = (type: string): JSX.Element => {
  switch (type) {
    case 'filename':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      );
    case 'content':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="21" y1="10" x2="3" y2="10"></line>
          <line x1="21" y1="6" x2="3" y2="6"></line>
          <line x1="21" y1="14" x2="3" y2="14"></line>
          <line x1="21" y1="18" x2="3" y2="18"></line>
        </svg>
      );
    case 'tag':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
      );
    case 'path':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      );
    case 'frontmatter':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
      );
    case 'create':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      );
    case 'modify':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      );
    case 'complex':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 4 5"></polyline>
          <line x1="12" y1="19" x2="20" y2="19"></line>
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      );
  }
};

/**
 * 검색 제안 컴포넌트 속성
 */
interface SearchSuggestionsProps {
  searchText: string;
  options: SearchOption[];
  isVisible: boolean;
  onSelect: (option: SearchOption) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

/**
 * 검색 제안 컴포넌트
 * 검색어 입력 필드 아래에 표시되는 검색 옵션 목록
 */
const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  searchText,
  options,
  isVisible,
  onSelect,
  inputRef
}) => {
  const [filteredOptions, setFilteredOptions] = useState<SearchOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // 검색어에 따라 옵션 필터링
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredOptions(options);
      return;
    }
    
    const lowerCaseSearchText = searchText.toLowerCase();
    const filtered = options.filter(option => 
      option.label.toLowerCase().includes(lowerCaseSearchText) || 
      option.description.toLowerCase().includes(lowerCaseSearchText) ||
      option.prefix.toLowerCase().includes(lowerCaseSearchText)
    );
    
    setFilteredOptions(filtered);
    setSelectedIndex(-1);
  }, [searchText, options]);
  
  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || filteredOptions.length === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredOptions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev <= 0 ? filteredOptions.length - 1 : prev - 1));
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
            e.preventDefault();
            onSelect(filteredOptions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          // 여기서는 isVisible을 직접 제어하지 않고, 부모 컴포넌트에서 처리
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, filteredOptions, selectedIndex, onSelect]);
  
  // 선택된 항목이 변경될 때 스크롤 조정
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex + 1] as HTMLElement; // +1 for header
      if (selectedElement) {
        const containerRect = suggestionsRef.current.getBoundingClientRect();
        const selectedRect = selectedElement.getBoundingClientRect();
        
        if (selectedRect.bottom > containerRect.bottom) {
          suggestionsRef.current.scrollTop += selectedRect.bottom - containerRect.bottom;
        } else if (selectedRect.top < containerRect.top) {
          suggestionsRef.current.scrollTop -= containerRect.top - selectedRect.top;
        }
      }
    }
  }, [selectedIndex]);
  
  // 옵션 선택 핸들러
  const handleOptionSelect = (option: SearchOption, e: React.MouseEvent) => {
    // 이벤트 전파 중지
    e.preventDefault();
    e.stopPropagation();
    
    console.log('검색 옵션 선택 (마우스):', option.type, option.prefix);
    
    // 선택한 옵션을 부모 컴포넌트로 전달
    onSelect(option);
  };
  
  if (!isVisible || filteredOptions.length === 0) {
    return null;
  }
  
  // 키보드 단축키 매핑
  const getShortcut = (index: number): string => {
    if (index < 9) {
      return `Alt+${index + 1}`;
    }
    return '';
  };
  
  return (
    <div 
      className="card-navigator-suggestions-container"
      ref={suggestionsRef}
      onClick={(e) => {
        // 이벤트 버블링 방지
        e.stopPropagation();
      }}
    >
      <div className="card-navigator-suggestions-header">
        검색 옵션
      </div>
      {filteredOptions.map((option, index) => (
        <div 
          key={option.type}
          className={`card-navigator-suggestion-item ${index === selectedIndex ? 'is-selected' : ''}`}
          onClick={(e) => handleOptionSelect(option, e)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div className="card-navigator-suggestion-title">
            <span className="card-navigator-suggestion-icon">
              {getSearchOptionIcon(option.type)}
            </span>
            <span className="card-navigator-suggestion-prefix">{option.prefix}</span>
            <span>{option.label}</span>
            {index < 9 && (
              <span className="card-navigator-suggestion-shortcut">
                {getShortcut(index)}
              </span>
            )}
          </div>
          <div className="card-navigator-suggestion-description">
            {option.description}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * 날짜 선택기 컴포넌트 속성
 */
interface DatePickerProps {
  onSelect: (date: string) => void;
  onClose: () => void;
  isRangeMode: boolean;
  dateType: 'start' | 'end';
}

/**
 * 날짜 선택기 컴포넌트
 */
const DatePicker: React.FC<DatePickerProps> = ({ onSelect, onClose, isRangeMode, dateType }) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };
  
  const handleSelect = () => {
    onSelect(date);
  };
  
  return (
    <div className="card-navigator-date-picker">
      <div className="card-navigator-date-picker-header">
        {isRangeMode ? `${dateType === 'start' ? '시작' : '종료'} 날짜 선택` : '날짜 선택'}
      </div>
      <input
        type="date"
        className="card-navigator-date-input"
        value={date}
        onChange={handleDateChange}
      />
      <div className="card-navigator-date-picker-buttons">
        <button
          type="button"
          className="card-navigator-date-select-button"
          onClick={handleSelect}
        >
          선택
        </button>
        <button
          type="button"
          className="card-navigator-date-cancel-button"
          onClick={onClose}
        >
          취소
        </button>
      </div>
    </div>
  );
};

/**
 * 프론트매터 키 제안 컴포넌트 속성
 */
interface FrontmatterKeySuggestionsProps {
  keys: string[];
  isVisible: boolean;
  onSelect: (key: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

/**
 * 프론트매터 키 제안 컴포넌트
 */
const FrontmatterKeySuggestions: React.FC<FrontmatterKeySuggestionsProps> = ({
  keys,
  isVisible,
  onSelect,
  inputRef
}) => {
  const [filteredKeys, setFilteredKeys] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState<string>('');
  
  // 입력 필드의 값 변경 감지
  useEffect(() => {
    if (inputRef.current) {
      const value = inputRef.current.value;
      const match = value.match(/\[([^\]]*)\]/);
      if (match) {
        setSearchText(match[1]);
      } else {
        setSearchText('');
      }
    }
  }, [inputRef.current?.value]);
  
  // 검색어에 따라 키 필터링
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredKeys(keys);
      return;
    }
    
    const lowerCaseSearchText = searchText.toLowerCase();
    const filtered = keys.filter(key => 
      key.toLowerCase().includes(lowerCaseSearchText)
    );
    
    setFilteredKeys(filtered);
    setSelectedIndex(-1);
  }, [searchText, keys]);
  
  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || filteredKeys.length === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredKeys.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev <= 0 ? filteredKeys.length - 1 : prev - 1));
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < filteredKeys.length) {
            e.preventDefault();
            onSelect(filteredKeys[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          // 여기서는 isVisible을 직접 제어하지 않고, 부모 컴포넌트에서 처리
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, filteredKeys, selectedIndex, onSelect]);
  
  // 선택된 항목이 변경될 때 스크롤 조정
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex + 1] as HTMLElement; // +1 for header
      if (selectedElement) {
        const containerRect = suggestionsRef.current.getBoundingClientRect();
        const selectedRect = selectedElement.getBoundingClientRect();
        
        if (selectedRect.bottom > containerRect.bottom) {
          suggestionsRef.current.scrollTop += selectedRect.bottom - containerRect.bottom;
        } else if (selectedRect.top < containerRect.top) {
          suggestionsRef.current.scrollTop -= containerRect.top - selectedRect.top;
        }
      }
    }
  }, [selectedIndex]);
  
  // 키 선택 핸들러
  const handleKeySelect = (key: string, e: React.MouseEvent) => {
    // 이벤트 전파 중지
    e.preventDefault();
    e.stopPropagation();
    
    console.log('프론트매터 키 선택 (마우스):', key);
    
    // 선택한 키를 부모 컴포넌트로 전달
    onSelect(key);
  };
  
  if (!isVisible || filteredKeys.length === 0) {
    return null;
  }
  
  return (
    <div 
      className="card-navigator-suggestions-container"
      ref={suggestionsRef}
      onClick={(e) => {
        // 이벤트 버블링 방지
        e.stopPropagation();
      }}
    >
      <div className="card-navigator-suggestions-header">
        프론트매터 속성
      </div>
      {filteredKeys.map((key, index) => (
        <div 
          key={key}
          className={`card-navigator-suggestion-item ${index === selectedIndex ? 'is-selected' : ''}`}
          onClick={(e) => handleKeySelect(key, e)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div className="card-navigator-suggestion-title">
            <span className="card-navigator-suggestion-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </span>
            <span className="card-navigator-suggestion-prefix">[{key}]:</span>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * UI 카드 속성을 도메인 카드로 변환하는 함수
 * @param cardProps UI 카드 속성
 * @returns 도메인 카드
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
    frontmatter: {}
  };
};

/**
 * UI 카드 속성 배열을 도메인 카드 배열로 변환하는 함수
 * @param cardProps UI 카드 속성 배열
 * @returns 도메인 카드 배열
 */
const mapPropsArrayToCardArray = (cardProps: ICardProps[]): ICard[] => {
  return cardProps.map(mapPropsToCard);
};

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
  const [searchText, setSearchText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerPosition, setDatePickerPosition] = useState({ top: 0, left: 0 });
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showFrontmatterKeySuggestions, setShowFrontmatterKeySuggestions] = useState(false);
  const [frontmatterKeys, setFrontmatterKeys] = useState<string[]>([]);
  const [isComplexSearch, setIsComplexSearch] = useState(false);
  const [searchScope, setSearchScope] = useState<'all' | 'current'>('all');
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [isDateRangeMode, setIsDateRangeMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const searchHistoryRef = useRef<HTMLDivElement>(null);
  const prevSearchText = useRef<string>('');
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // 검색 기록 로드
  useEffect(() => {
    try {
      if (cardNavigatorService) {
        setSearchHistory(cardNavigatorService.getSearchService().getSearchHistory());
      } else {
        console.warn('SearchBar: cardNavigatorService가 null입니다.');
        setSearchHistory([]);
      }
    } catch (error) {
      console.error('검색 기록 로드 중 오류 발생:', error);
      setSearchHistory([]);
    }
  }, [cardNavigatorService]);

  // 프론트매터 키 로드
  useEffect(() => {
    const loadFrontmatterKeys = async () => {
      try {
        if (cardNavigatorService) {
          const keys = await cardNavigatorService.getSearchService().getFrontmatterKeys();
          setFrontmatterKeys(keys);
        }
      } catch (error) {
        console.error('프론트매터 키 로드 중 오류 발생:', error);
        setFrontmatterKeys([]);
      }
    };
    
    loadFrontmatterKeys();
  }, [cardNavigatorService]);

  // 검색어 변경 시 실시간 검색 적용
  useEffect(() => {
    // 디바운스 타이머
    const debounceTimer = setTimeout(() => {
      // 이전 검색어와 동일하면 중복 검색 방지
      if (searchText === prevSearchText.current) {
        return;
      }
      
      // 현재 검색어 저장
      prevSearchText.current = searchText;
      
      if (searchText) {
        try {
          // 검색 서비스에 검색어 설정
          if (cardNavigatorService) {
            cardNavigatorService.getSearchService().setSearchQuery(searchText);
          }
          
          // 검색 실행
          onSearch(searchText);
        } catch (error) {
          console.error('검색 실행 중 오류 발생:', error);
        }
      } else {
        // 검색어가 비어있으면 검색 초기화
        try {
          if (cardNavigatorService) {
            cardNavigatorService.getSearchService().clearSearch();
          }
          
          // 빈 검색어로 검색 실행
          onSearch('');
        } catch (error) {
          console.error('검색 초기화 중 오류 발생:', error);
        }
      }
    }, 300); // 300ms 디바운스
    
    return () => clearTimeout(debounceTimer);
  }, [searchText, onSearch, cardNavigatorService]);

  // 날짜 선택기 및 검색 기록 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      try {
        const target = event.target as Node;
        const targetElement = event.target as HTMLElement;
        
        // 검색 제안 영역 외부 클릭 시 숨기기
        if (
          showSearchSuggestions &&
          inputRef.current && 
          !inputRef.current.contains(target) &&
          !targetElement.closest('.card-navigator-suggestions-container') // 제안 컨테이너 내부 클릭은 무시
        ) {
          setShowSearchSuggestions(false);
        }
        
        // 프론트매터 키 제안 영역 외부 클릭 시 숨기기
        if (
          showFrontmatterKeySuggestions &&
          inputRef.current && 
          !inputRef.current.contains(target) &&
          !targetElement.closest('.card-navigator-suggestions-container') // 제안 컨테이너 내부 클릭은 무시
        ) {
          setShowFrontmatterKeySuggestions(false);
        }
        
        // 날짜 선택기 외부 클릭 시 숨기기
        if (
          showDatePicker &&
          datePickerRef.current && 
          !datePickerRef.current.contains(target)
        ) {
          setShowDatePicker(false);
        }
        
        // 검색 기록 외부 클릭 시 숨기기
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
  }, [showSearchSuggestions, showFrontmatterKeySuggestions, showDatePicker, showSearchHistory]);

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
      } else {
        // 프론트매터 키 입력 중인지 확인
        const frontmatterKeyMatch = newValue.match(/\[([^\]]*)\]?$/);
        if (frontmatterKeyMatch) {
          setShowFrontmatterKeySuggestions(true);
          setShowSearchSuggestions(false);
        } else {
          setShowFrontmatterKeySuggestions(false);
          
          // 검색어에 따라 제안 필터링
          const searchOptionPrefix = SEARCH_OPTIONS.find(option => 
            newValue.startsWith(option.prefix) && option.prefix !== '|'
          );
          
          if (searchOptionPrefix) {
            // 검색 옵션 접두사가 있으면 제안 숨기기
            setShowSearchSuggestions(false);
            
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
            
            // 날짜 검색인 경우 날짜 선택기 표시
            if (searchOptionPrefix.type === 'create' || searchOptionPrefix.type === 'modify') {
              // 시작일 또는 종료일 선택 모드 확인
              if (newValue.includes('[start date]')) {
                setDatePickerType('start');
                setIsDateRangeMode(true);
              } else if (newValue.includes('[end date]')) {
                setDatePickerType('end');
                setIsDateRangeMode(true);
              } else {
                setDatePickerType('start');
                setIsDateRangeMode(false);
              }
              
              // 커서 위치에 날짜 선택기 표시
              if (inputRef.current) {
                const rect = inputRef.current.getBoundingClientRect();
                setDatePickerPosition({
                  top: rect.bottom + window.scrollY,
                  left: rect.left + window.scrollX
                });
                setShowDatePicker(true);
              }
            }
          } else if (isComplex) {
            // 복합 검색인 경우 디바운스 처리로 검색 실행
            if (searchDebounceRef.current) {
              clearTimeout(searchDebounceRef.current);
            }
            searchDebounceRef.current = setTimeout(() => {
              if (cardNavigatorService) {
                // 복합 검색 실행
                onSearch(newValue, 'complex');
              }
            }, 300);
          } else {
            // 검색어에 따라 제안 표시 여부 결정
            setShowSearchSuggestions(newValue.length < 3);
            
            // 일반 검색어인 경우 디바운스 처리로 검색 실행
            if (newValue.length >= 2) {
              if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
              }
              searchDebounceRef.current = setTimeout(() => {
                onSearch(newValue);
              }, 300);
            }
          }
        }
      }
    } catch (error) {
      console.error('텍스트 변경 처리 중 오류 발생:', error);
    }
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 복합 검색 여부 확인
    const isComplex = searchText.includes('|');
    
    if (isComplex) {
      // 복합 검색 실행
      onSearch(searchText, 'complex');
    } else {
      // 검색어에 검색 옵션 접두사가 있는지 확인
      const searchOptionPrefix = SEARCH_OPTIONS.find(option => 
        searchText.startsWith(option.prefix) && option.prefix !== '|'
      );
      
      // 검색 옵션 접두사가 있으면 해당 타입으로 검색 실행
      if (searchOptionPrefix) {
        onSearch(searchText, searchOptionPrefix.type);
      } else {
        onSearch(searchText);
      }
    }
    
    // 검색 기록 저장
    try {
      if (searchText.trim() && cardNavigatorService) {
        cardNavigatorService.getSearchService().saveSearchHistory(searchText);
      }
    } catch (error) {
      console.error('검색 기록 저장 중 오류 발생:', error);
    }
  };

  /**
   * 검색어 지우기 핸들러
   */
  const handleClear = () => {
    setSearchText('');
    try {
      if (cardNavigatorService) {
        cardNavigatorService.getSearchService().clearSearch();
      }
    } catch (error) {
      console.error('검색 초기화 중 오류 발생:', error);
    }
    onSearch('');
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * 포커스 핸들러
   */
  const handleFocus = () => {
    try {
      // 검색어가 비어있을 때 검색 옵션 제안 표시
      if (!searchText) {
        setShowSearchSuggestions(true);
      }
      
      // 검색 기록 표시
      if (searchHistory.length > 0) {
        setShowSearchHistory(true);
      }
    } catch (error) {
      console.error('포커스 처리 중 오류 발생:', error);
    }
  };

  /**
   * 키 입력 핸들러
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    try {
      // Ctrl+Space 또는 Alt+Space로 검색 옵션 제안 표시
      if ((e.ctrlKey || e.altKey) && e.key === ' ') {
        e.preventDefault();
        setShowSearchSuggestions(true);
        return;
      }
      
      // Alt+숫자 키로 검색 옵션 빠른 선택
      if (e.altKey && !isNaN(parseInt(e.key)) && parseInt(e.key) > 0 && parseInt(e.key) <= 9) {
        e.preventDefault();
        const optionIndex = parseInt(e.key) - 1;
        if (optionIndex < SEARCH_OPTIONS.length) {
          handleSearchOptionSelect(SEARCH_OPTIONS[optionIndex]);
        }
        return;
      }
      
      // Escape 키로 검색 옵션 제안 숨기기
      if (e.key === 'Escape') {
        setShowSearchSuggestions(false);
        setShowFrontmatterKeySuggestions(false);
        setShowDatePicker(false);
        return;
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
        
        console.log('삽입할 텍스트:', insertText, '커서 위치:', newCursorPosition);
        
        const newValue = textBeforeCursor + insertText + textAfterCursor;
        setSearchText(newValue);
        
        // 커서 위치 조정
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
            
            // 검색 옵션에 따른 검색 실행
            if (option.type !== 'complex' && cardNavigatorService) {
              // 검색 옵션에 맞는 검색 실행
              onSearch(newValue, option.type);
              
              // 검색 기록 저장
              try {
                if (cardNavigatorService) {
                  cardNavigatorService.getSearchService().saveSearchHistory(newValue);
                }
              } catch (error) {
                console.error('검색 기록 저장 중 오류 발생:', error);
              }
            }
          }
        }, 10);
        
        // 검색 제안 목록 닫기
        setShowSearchSuggestions(false);
      }
    } catch (error) {
      console.error('검색 옵션 선택 처리 중 오류 발생:', error);
    }
  };

  /**
   * 날짜 선택 핸들러
   */
  const handleDateSelect = (date: string) => {
    try {
      if (inputRef.current) {
        const currentValue = inputRef.current.value;
        
        // 날짜 형식 삽입
        let newValue = currentValue;
        
        if (isDateRangeMode) {
          if (datePickerType === 'start') {
            // 시작일 삽입
            newValue = currentValue.replace('[start date]:', date);
            
            // 종료일 옵션 추가 (아직 없는 경우)
            if (!newValue.includes('[end date]:')) {
              newValue += ' [end date]:';
              setDatePickerType('end');
              
              // 종료일 선택기 표시
              setTimeout(() => {
                if (inputRef.current) {
                  const rect = inputRef.current.getBoundingClientRect();
                  setDatePickerPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX
                  });
                }
              }, 100);
            } else {
              setShowDatePicker(false);
            }
          } else {
            // 종료일 삽입
            newValue = currentValue.replace('[end date]:', date);
            setShowDatePicker(false);
          }
        } else {
          // 단일 날짜 검색
          if (currentValue.includes('create:') || currentValue.includes('modify:')) {
            const prefix = currentValue.includes('create:') ? 'create:' : 'modify:';
            const prefixPos = currentValue.indexOf(prefix);
            const restOfString = currentValue.substring(prefixPos + prefix.length);
            
            // 기존 날짜 또는 내용 대체
            newValue = currentValue.substring(0, prefixPos + prefix.length) + ' ' + date;
          }
          setShowDatePicker(false);
        }
        
        setSearchText(newValue);
        
        // 검색 실행
        if (cardNavigatorService) {
          cardNavigatorService.getSearchService().setSearchQuery(newValue);
          onSearch(newValue);
        }
        
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('날짜 선택 처리 중 오류 발생:', error);
      setShowDatePicker(false);
    }
  };

  /**
   * 검색 기록 항목 클릭 핸들러
   */
  const handleHistoryItemClick = (query: string) => {
    setSearchText(query);
    try {
      if (cardNavigatorService) {
        cardNavigatorService.getSearchService().setSearchQuery(query);
      }
    } catch (error) {
      console.error('검색 기록 설정 중 오류 발생:', error);
    }
    onSearch(query);
    setShowSearchHistory(false);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * 프론트매터 키 선택 핸들러
   */
  const handleFrontmatterKeySelect = (key: string) => {
    try {
      console.log('프론트매터 키 선택:', key);
      
      if (inputRef.current) {
        const cursorPosition = inputRef.current.selectionStart || 0;
        const currentValue = inputRef.current.value;
        
        // 현재 입력 중인 프론트매터 키 부분 찾기
        const beforeCursor = currentValue.substring(0, cursorPosition);
        const afterCursor = currentValue.substring(cursorPosition);
        
        // 대괄호 열기 위치 찾기
        const openBracketPos = beforeCursor.lastIndexOf('[');
        if (openBracketPos !== -1) {
          // 대괄호 닫기 위치 찾기 (열기 이후)
          const closeBracketPos = beforeCursor.indexOf(']', openBracketPos);
          
          if (closeBracketPos === -1) {
            // 닫는 대괄호가 없으면 키 삽입 후 닫는 대괄호와 콜론 추가
            const newValue = 
              beforeCursor.substring(0, openBracketPos + 1) + 
              key + 
              ']' + 
              (afterCursor.startsWith(':') ? '' : ':') + 
              (afterCursor.startsWith(':') ? afterCursor : ' ' + afterCursor);
            
            console.log('새 값 (닫는 대괄호 없음):', newValue);
            setSearchText(newValue);
            
            // 커서 위치 조정 (콜론 뒤로)
            const newCursorPosition = openBracketPos + key.length + 3; // [key]:
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
              }
            }, 10);
          } else {
            // 이미 닫는 대괄호가 있으면 키만 교체
            const newValue = 
              beforeCursor.substring(0, openBracketPos + 1) + 
              key + 
              beforeCursor.substring(closeBracketPos) + 
              afterCursor;
            
            console.log('새 값 (닫는 대괄호 있음):', newValue);
            setSearchText(newValue);
            
            // 커서 위치 조정 (콜론 뒤로)
            setTimeout(() => {
              if (inputRef.current) {
                const colonPos = newValue.indexOf(':', openBracketPos);
                const newCursorPosition = colonPos + 1;
                inputRef.current.focus();
                inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
              }
            }, 10);
          }
          
          // 검색 실행
          if (cardNavigatorService) {
            setTimeout(() => {
              onSearch(inputRef.current?.value || '', 'frontmatter');
            }, 20);
          }
        }
      }
      
      // 프론트매터 키 제안 목록 닫기
      setShowFrontmatterKeySuggestions(false);
    } catch (error) {
      console.error('프론트매터 키 선택 처리 중 오류 발생:', error);
    }
  };

  /**
   * 검색 범위 토글 핸들러
   */
  const handleSearchScopeToggle = () => {
    // 현재 검색 범위의 반대로 토글
    const newScope = searchScope === 'all' ? 'current' : 'all';
    setSearchScope(newScope);
    
    if (cardNavigatorService) {
      const searchService = cardNavigatorService.getSearchService();
      searchService.setSearchScope(newScope);
      
      // 현재 카드셋 저장 (검색 범위가 'current'인 경우 사용)
      if (newScope === 'current' && currentCards && currentCards.length > 0) {
        searchService.setPreSearchCards(mapPropsArrayToCardArray(currentCards));
      }
      
      // 현재 검색어가 있으면 검색 다시 실행
      if (searchText) {
        onSearch(searchText);
      }
    }
  };

  return (
    <div className="card-navigator-search-container">
      <form onSubmit={handleSubmit} className="card-navigator-search-form">
        <div className="card-navigator-search-input-container">
          <input
            ref={inputRef}
            type="text"
            className={`card-navigator-search-input ${isComplexSearch ? 'complex-search' : ''}`}
            placeholder="검색어를 입력하세요... (Ctrl+Space로 검색 옵션 표시)"
            value={searchText}
            onChange={handleTextChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
          />
          {/* 검색어 삭제 아이콘 - 입력 필드 내부에 위치 */}
          {searchText && (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="card-navigator-search-clear-icon"
              onClick={handleClear}
              aria-label="검색어 지우기"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          )}
          
          {/* 검색 옵션 제안 컴포넌트 */}
          {showSearchSuggestions && (
            <div 
              onClick={(e) => {
                // 이벤트 전파 중지 (부모 요소로의 클릭 이벤트 전파 방지)
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <SearchSuggestions
                searchText={searchText}
                options={SEARCH_OPTIONS}
                isVisible={showSearchSuggestions}
                onSelect={handleSearchOptionSelect}
                inputRef={inputRef}
              />
            </div>
          )}
          
          {/* 프론트매터 키 제안 컴포넌트 */}
          {showFrontmatterKeySuggestions && (
            <div 
              onClick={(e) => {
                // 이벤트 전파 중지 (부모 요소로의 클릭 이벤트 전파 방지)
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <FrontmatterKeySuggestions
                keys={frontmatterKeys}
                isVisible={showFrontmatterKeySuggestions}
                onSelect={handleFrontmatterKeySelect}
                inputRef={inputRef}
              />
            </div>
          )}
        </div>
        
        {/* 검색 범위 토글 - 입력 필드 외부에 위치 */}
        <div className="card-navigator-search-scope-container">
          <div 
            className={`card-navigator-search-scope-toggle ${searchScope === 'current' ? 'active' : ''}`}
            onClick={handleSearchScopeToggle}
            title={searchScope === 'all' ? '볼트 전체 검색' : '현재 카드셋 검색'}
          >
            {searchScope === 'all' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2"/>
                <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>
                <path d="m7.9 7.9 2.7 2.7"/>
                <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>
                <path d="m13.4 10.6 2.7-2.7"/>
                <circle cx="7.5" cy="16.5" r=".5" fill="currentColor"/>
                <path d="m7.9 16.1 2.7-2.7"/>
                <circle cx="16.5" cy="16.5" r=".5" fill="currentColor"/>
                <path d="m13.4 13.4 2.7 2.7"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
                <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
                <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
              </svg>
            )}
          </div>
        </div>
        
        {isComplexSearch && (
          <div className="card-navigator-complex-search-indicator">
            <span>다중 필드 검색 모드</span>
          </div>
        )}
      </form>
      
      {showSearchHistory && searchHistory.length > 0 && (
        <div 
          ref={searchHistoryRef}
          className="card-navigator-search-history"
        >
          <div className="card-navigator-search-history-header">
            <span>최근 검색어</span>
          </div>
          <div className="card-navigator-search-history-list">
            {searchHistory.map((query, index) => (
              <div 
                key={index} 
                className="card-navigator-search-history-item"
                onClick={() => handleHistoryItemClick(query)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>{query}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
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
    </div>
  );
}; 