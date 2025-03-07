import { useState, useEffect, RefObject } from 'react';

interface UseSuggestedValuesProps {
  values: string[];
  isVisible: boolean;
}

interface UseSuggestedValuesReturn {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (e: KeyboardEvent) => void;
}

/**
 * 추천 검색어 관련 로직을 처리하는 훅
 */
export const useSuggestedValues = (
  props: UseSuggestedValuesProps,
  onSelect: (value: string) => void,
  containerRef: RefObject<HTMLDivElement>
): UseSuggestedValuesReturn => {
  const { values, isVisible } = props;
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  
  // 선택된 항목이 변경될 때 스크롤 조정
  useEffect(() => {
    if (selectedIndex >= 0 && containerRef.current) {
      const selectedElement = containerRef.current.children[selectedIndex + 1] as HTMLElement; // +1 for header
      if (selectedElement) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const selectedRect = selectedElement.getBoundingClientRect();
        
        if (selectedRect.bottom > containerRect.bottom) {
          containerRef.current.scrollTop += selectedRect.bottom - containerRect.bottom;
        } else if (selectedRect.top < containerRect.top) {
          containerRef.current.scrollTop -= containerRect.top - selectedRect.top;
        }
      }
    }
  }, [selectedIndex, containerRef]);
  
  // 키보드 이벤트 처리
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isVisible || values.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % values.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev <= 0 ? values.length - 1 : prev - 1));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < values.length) {
          e.preventDefault();
          onSelect(values[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        // 여기서는 isVisible을 직접 제어하지 않고, 부모 컴포넌트에서 처리
        break;
    }
  };
  
  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown
  };
};

export default useSuggestedValues;
