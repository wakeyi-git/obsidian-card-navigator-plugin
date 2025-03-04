import React from 'react';

/**
 * 카드 컴포넌트 속성 인터페이스
 */
export interface ICardProps {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  path?: string;
  created?: number;
  modified?: number;
  onClick?: (id: string) => void;
  style?: React.CSSProperties;
}

/**
 * 카드 컴포넌트
 * 노트의 내용을 카드 형태로 표시합니다.
 */
const Card: React.FC<ICardProps> = ({
  id,
  title,
  content,
  tags = [],
  path,
  created,
  modified,
  onClick,
  style = {},
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 내용 요약 (150자 제한)
  const summarizeContent = (text: string) => {
    if (text.length <= 150) return text;
    return text.substring(0, 150) + '...';
  };

  return (
    <div
      className="card-navigator-card"
      onClick={handleClick}
      style={style}
    >
      <div className="card-navigator-card-header">
        <h3 className="card-navigator-card-title" title={title}>
          {title}
        </h3>
      </div>
      
      <div className="card-navigator-card-content">
        {summarizeContent(content)}
      </div>
      
      <div className="card-navigator-card-footer">
        <div className="card-navigator-card-tags">
          {tags.slice(0, 3).map((tag, index) => (
            <span key={`${id}-${tag}-${index}`} className="card-navigator-card-tag">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="card-navigator-card-tag">
              +{tags.length - 3}
            </span>
          )}
        </div>
        
        <div className="card-navigator-card-date">
          {modified ? formatDate(modified) : formatDate(created)}
        </div>
      </div>
    </div>
  );
};

export default Card; 