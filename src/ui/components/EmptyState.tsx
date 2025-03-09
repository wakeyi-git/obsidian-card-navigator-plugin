import React from 'react';
import { CardSetSourceType } from '../../domain/cardset/CardSet';

/**
 * 빈 상태 컴포넌트 속성
 */
export interface EmptyStateProps {
  cardSetSource?: CardSetSourceType;
  message?: string;
  title?: string;
  description?: string;
  icon?: string;
}

/**
 * 빈 상태 컴포넌트
 * 카드가 없을 때 표시되는 컴포넌트
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ 
  cardSetSource, 
  message,
  title,
  description,
  icon
}) => {
  // 카드 세트에 따른 기본 메시지 설정
  const defaultMessage = (() => {
    if (cardSetSource) {
      switch (cardSetSource) {
        case 'folder':
          return '이 폴더에 카드가 없습니다.';
        case 'tag':
          return '이 태그에 카드가 없습니다.';
        case 'search':
          return '검색 결과가 없습니다.';
        default:
          return '카드가 없습니다.';
      }
    }
    return '카드가 없습니다.';
  })();
  
  // 사용자 지정 메시지가 있으면 사용, 없으면 기본 메시지 사용
  const displayMessage = message || description || defaultMessage;
  const displayTitle = title || '카드가 없습니다';
  const displayIcon = icon || 'card';
  
  // 아이콘 선택
  const renderIcon = () => {
    switch (displayIcon) {
      case 'folder':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        );
      case 'tag':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
        );
      case 'search':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="15"></line>
            <line x1="15" y1="9" x2="9" y2="15"></line>
          </svg>
        );
    }
  };
  
  return (
    <div className="card-navigator-empty">
      <div className="card-navigator-empty-icon">
        {renderIcon()}
      </div>
      <div className="card-navigator-empty-title">{displayTitle}</div>
      <div className="card-navigator-empty-description">{displayMessage}</div>
    </div>
  );
}; 