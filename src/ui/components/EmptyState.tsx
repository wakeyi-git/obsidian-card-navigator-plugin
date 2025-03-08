import React from 'react';
import { ModeType } from '../../domain/mode/Mode';

/**
 * 빈 상태 컴포넌트 속성
 */
export interface EmptyStateProps {
  mode: ModeType;
  message?: string;
}

/**
 * 빈 상태 컴포넌트
 * 카드가 없을 때 표시되는 컴포넌트
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ mode, message }) => {
  // 모드에 따른 기본 메시지 설정
  const defaultMessage = (() => {
    switch (mode) {
      case 'folder':
        return '이 폴더에 카드가 없습니다.';
      case 'tag':
        return '이 태그에 카드가 없습니다.';
      case 'search':
        return '검색 결과가 없습니다.';
      default:
        return '카드가 없습니다.';
    }
  })();
  
  // 사용자 지정 메시지가 있으면 사용, 없으면 기본 메시지 사용
  const displayMessage = message || defaultMessage;
  
  return (
    <div className="card-navigator-empty-state">
      <div className="card-navigator-empty-state-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="15"></line>
          <line x1="15" y1="9" x2="9" y2="15"></line>
        </svg>
      </div>
      <div className="card-navigator-empty-state-message">{displayMessage}</div>
    </div>
  );
}; 