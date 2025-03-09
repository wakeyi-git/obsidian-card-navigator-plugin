import React, { useState, useEffect, useRef } from 'react';

interface FrontmatterKeySuggestionsProps {
  keys: string[];
  onSelect: (key: string) => void;
}

/**
 * 프론트매터 키 제안 컴포넌트
 */
const FrontmatterKeySuggestions: React.FC<FrontmatterKeySuggestionsProps> = ({
  keys,
  onSelect
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (keys.length === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % keys.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev <= 0 ? keys.length - 1 : prev - 1));
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < keys.length) {
            e.preventDefault();
            onSelect(keys[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [keys, selectedIndex, onSelect]);
  
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
  
  if (keys.length === 0) {
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
      {keys.map((key, index) => (
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