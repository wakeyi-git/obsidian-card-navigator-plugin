import React, { useEffect, useRef, useState } from 'react';

/**
 * 추천 검색어 컴포넌트 속성
 */
interface SuggestedValuesProps {
  values: string[];
  isVisible: boolean;
  selectedIndex?: number;
  onSelect: (value: string) => void;
  onMouseEnter?: (index: number) => void;
  title?: string;
  filterText?: string; // 필터링 텍스트 추가
  onClose?: () => void; // 닫기 콜백 추가
}

/**
 * 검색어와 일치하는 부분을 강조 표시하는 함수
 */
const HighlightedText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight || highlight.trim() === '') {
    return <span>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, index) => 
        part.toLowerCase() === highlight.toLowerCase() ? 
          <span key={index} className="card-navigator-highlight">{part}</span> : 
          <span key={index}>{part}</span>
      )}
    </span>
  );
};

/**
 * 추천 검색어 컴포넌트
 * 검색 옵션에 따른 추천 검색어를 표시합니다.
 */
const SuggestedValues: React.FC<SuggestedValuesProps> = ({
  values,
  isVisible,
  selectedIndex: externalSelectedIndex,
  onSelect,
  onMouseEnter,
  title = '추천 검색어',
  filterText = '',
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(-1);
  
  // 실제 사용할 selectedIndex 결정
  const selectedIndex = externalSelectedIndex !== undefined ? externalSelectedIndex : internalSelectedIndex;
  
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
  }, [selectedIndex]);
  
  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setInternalSelectedIndex(prev => (prev + 1) % values.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setInternalSelectedIndex(prev => (prev <= 0 ? values.length - 1 : prev - 1));
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < values.length) {
            e.preventDefault();
            onSelect(values[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (onClose) {
            onClose();
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, values, selectedIndex, onSelect, onClose]);
  
  if (!isVisible || values.length === 0) {
    return null;
  }
  
  return (
    <div 
      className="card-navigator-suggestions-container"
      ref={containerRef}
      onClick={(e) => {
        // 이벤트 버블링 방지
        e.stopPropagation();
      }}
    >
      <div className="card-navigator-suggestions-header">
        {title}
      </div>
      {values.map((value, index) => (
        <div 
          key={value}
          className={`card-navigator-suggestion-item ${index === selectedIndex ? 'is-selected' : ''}`}
          onClick={() => onSelect(value)}
          onMouseEnter={() => {
            setInternalSelectedIndex(index);
            if (onMouseEnter) onMouseEnter(index);
          }}
          role="option"
          aria-selected={index === selectedIndex}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(value);
            } else if (e.key === 'Escape' && onClose) {
              e.preventDefault();
              onClose();
            }
          }}
        >
          <div className="card-navigator-suggestion-title">
            <HighlightedText text={value} highlight={filterText} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SuggestedValues; 