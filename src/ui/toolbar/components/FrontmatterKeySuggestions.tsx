import React from 'react';

interface FrontmatterKeySuggestionsProps {
  keys: string[];
  onSelect: (key: string) => void;
}

/**
 * 프론트매터 키 제안 컴포넌트
 * 프론트매터 키 목록을 표시하고 선택할 수 있는 컴포넌트
 */
const FrontmatterKeySuggestions: React.FC<FrontmatterKeySuggestionsProps> = ({ 
  keys, 
  onSelect 
}) => {
  if (keys.length === 0) {
    return (
      <div className="card-navigator-frontmatter-key-suggestions">
        <div className="card-navigator-frontmatter-key-suggestions-header">
          <span>프론트매터 키</span>
        </div>
        <div className="card-navigator-frontmatter-key-suggestions-empty">
          <span>사용 가능한 프론트매터 키가 없습니다.</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card-navigator-frontmatter-key-suggestions">
      <div className="card-navigator-frontmatter-key-suggestions-header">
        <span>프론트매터 키</span>
      </div>
      <div className="card-navigator-frontmatter-key-suggestions-list">
        {keys.map((key, index) => (
          <div 
            key={`${key}-${index}`}
            className="card-navigator-frontmatter-key-suggestion-item"
            onClick={() => onSelect(key)}
          >
            {key}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FrontmatterKeySuggestions; 