import { useState, useEffect, RefObject } from 'react';
import type { SearchOption } from '../components/SearchSuggestions';

interface UseSearchSuggestionsProps {
  searchText: string;
  options: SearchOption[];
  isVisible: boolean;
}

interface UseSearchSuggestionsReturn {
  filteredOptions: SearchOption[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (e: KeyboardEvent) => void;
  getShortcut: (index: number) => string;
}

/**
 * 검색 제안 관련 로직을 처리하는 훅
 */
export const useSearchSuggestions = (
  props: UseSearchSuggestionsProps,
  onSelect: (option: SearchOption) => void,
  suggestionsRef: RefObject<HTMLDivElement>
): UseSearchSuggestionsReturn => {
  const { searchText, options, isVisible } = props;
  const [filteredOptions, setFilteredOptions] = useState<SearchOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  
  // 검색어에 따라 옵션 필터링
  useEffect(() => {
    if (!searchText) {
      setFilteredOptions(options);
      return;
    }
    
    const lowerCaseSearchText = searchText.toLowerCase();
    const filtered = options.filter(option => 
      option.label.toLowerCase().includes(lowerCaseSearchText) || 
      option.description.toLowerCase().includes(lowerCaseSearchText) ||
      option.prefix.toLowerCase().includes(lowerCaseSearchText)
    );
    
    setFilteredOptions(filtered.length > 0 ? filtered : options);
    setSelectedIndex(0);
  }, [searchText, options]);
  
  // 선택된 항목이 변경될 때 스크롤 조정
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
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
  
  // 키보드 이벤트 처리
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
  
  // 단축키 표시
  const getShortcut = (index: number): string => {
    return `Alt+${index + 1}`;
  };
  
  return {
    filteredOptions,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    getShortcut
  };
};

export default useSearchSuggestions;
