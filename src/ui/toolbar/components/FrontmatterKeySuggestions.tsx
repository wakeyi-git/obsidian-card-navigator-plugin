import React, { useState, useEffect, useRef } from 'react';

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

export default FrontmatterKeySuggestions; 