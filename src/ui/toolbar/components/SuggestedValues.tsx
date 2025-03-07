import React, { useEffect, useRef } from 'react';

/**
 * 추천 검색어 컴포넌트 속성
 */
interface SuggestedValuesProps {
  values: string[];
  isVisible: boolean;
  selectedIndex: number;
  onSelect: (value: string) => void;
  onMouseEnter?: (index: number) => void;
  title?: string;
}

/**
 * 추천 검색어 컴포넌트
 * 검색 옵션에 따른 추천 검색어를 표시합니다.
 */
const SuggestedValues: React.FC<SuggestedValuesProps> = ({
  values,
  isVisible,
  selectedIndex,
  onSelect,
  onMouseEnter,
  title = '추천 검색어'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
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
          onMouseEnter={() => onMouseEnter && onMouseEnter(index)}
        >
          <div className="card-navigator-suggestion-title">
            <span className="card-navigator-suggestion-value">{value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SuggestedValues; 