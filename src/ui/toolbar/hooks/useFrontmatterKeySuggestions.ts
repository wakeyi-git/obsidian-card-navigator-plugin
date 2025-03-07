import { useState, useEffect, RefObject } from 'react';

interface UseFrontmatterKeySuggestionsProps {
  keys: string[];
  isVisible: boolean;
  inputRef: RefObject<HTMLInputElement>;
}

interface UseFrontmatterKeySuggestionsReturn {
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
  props: UseFrontmatterKeySuggestionsProps,
  onSelect: (key: string) => void,
  suggestionsRef: RefObject<HTMLDivElement>
): UseFrontmatterKeySuggestionsReturn => {
  const { keys, isVisible, inputRef } = props;
  const [filteredKeys, setFilteredKeys] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
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
  
  // 키보드 이벤트 처리
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
  
  return {
    filteredKeys,
    selectedIndex,
    setSelectedIndex,
    searchText,
    handleKeyDown
  };
};

export default useFrontmatterKeySuggestions;
