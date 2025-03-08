import { useState, useEffect, RefObject } from 'react';
import { ICardNavigatorService } from '../../../application/CardNavigatorService';
import { ICardProps } from '../../../ui/cards-container/Card';
import { ICard } from '../../../domain/card/Card';

interface UseFrontmatterKeySuggestionsReturn {
  frontmatterKeys: string[];
  setFrontmatterKeys: (keys: string[]) => void;
  frontmatterKey: string;
  setFrontmatterKey: (key: string) => void;
  suggestedValues: string[];
  setSuggestedValues: (values: string[]) => void;
  showSuggestedValues: boolean;
  setShowSuggestedValues: (show: boolean) => void;
  selectedSuggestionIndex: number;
  setSelectedSuggestionIndex: (index: number) => void;
  loadFrontmatterValues: (key: string, searchScope?: 'all' | 'current') => Promise<void>;
  filteredKeys: string[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  searchText: string;
  handleKeyDown: (e: KeyboardEvent) => void;
}

/**
 * 프론트매터 키 제안 관련 로직을 처리하는 훅
 */
export const useFrontmatterKeySuggestions = (
  cardNavigatorService: ICardNavigatorService | null,
  currentCards: ICardProps[],
  mapPropsArrayToCardArray: (cardProps: ICardProps[]) => ICard[],
  onSelect: (key: string) => void,
  suggestionsRef: RefObject<HTMLDivElement>,
  inputRef: RefObject<HTMLInputElement>
): UseFrontmatterKeySuggestionsReturn => {
  const [frontmatterKeys, setFrontmatterKeys] = useState<string[]>([]);
  const [frontmatterKey, setFrontmatterKey] = useState<string>('');
  const [suggestedValues, setSuggestedValues] = useState<string[]>([]);
  const [showSuggestedValues, setShowSuggestedValues] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [filteredKeys, setFilteredKeys] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [searchText, setSearchText] = useState<string>('');
  
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
      setFilteredKeys(frontmatterKeys);
      return;
    }
    
    const lowerCaseSearchText = searchText.toLowerCase();
    const filtered = frontmatterKeys.filter(key => 
      key.toLowerCase().includes(lowerCaseSearchText)
    );
    
    setFilteredKeys(filtered);
    setSelectedIndex(-1);
  }, [searchText, frontmatterKeys]);
  
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
  }, [selectedIndex, suggestionsRef]);
  
  /**
   * 프론트매터 값 로드
   */
  const loadFrontmatterValues = async (key: string, searchScope: 'all' | 'current' = 'current') => {
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
  
  // 키보드 이벤트 처리
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showSuggestedValues || filteredKeys.length === 0) return;
    
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
        // 여기서는 showSuggestedValues을 직접 제어하지 않고, 부모 컴포넌트에서 처리
        break;
    }
  };
  
  return {
    frontmatterKeys,
    setFrontmatterKeys,
    frontmatterKey,
    setFrontmatterKey,
    suggestedValues,
    setSuggestedValues,
    showSuggestedValues,
    setShowSuggestedValues,
    selectedSuggestionIndex,
    setSelectedSuggestionIndex,
    loadFrontmatterValues,
    filteredKeys,
    selectedIndex,
    setSelectedIndex,
    searchText,
    handleKeyDown
  };
};

export default useFrontmatterKeySuggestions;
