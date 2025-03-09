import React, { useState } from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { CardSetSourceType, CardSetType } from '../../domain/cardset/CardSet';
import './CardSetToggle.css';

/**
 * CardSetSourceToggle 컴포넌트 속성
 */
interface CardSetSourceToggleProps {
  currentCardSetSource: CardSetSourceType;
  onCardSetSourceChange: (cardSetSource: CardSetSourceType) => void;
  service: ICardNavigatorService | null;
}

/**
 * 카드 세트 토글 컴포넌트
 * 폴더 카드 세트와 태그 카드 세트를 전환하는 버튼을 제공합니다.
 */
const CardSetSourceToggle: React.FC<CardSetSourceToggleProps> = ({ currentCardSetSource, onCardSetSourceChange, service }) => {
  const [showCardSetSourceMenu, setShowCardSetSourceMenu] = useState(false);

  /**
   * 카드 세트 토글 처리
   * 현재 카드 세트에 따라 다음 카드 세트로 전환합니다.
   */
  const handleCardSetSourceToggle = () => {
    // 폴더 카드 세트와 태그 카드 세트 간 직접 전환
    if (currentCardSetSource === 'folder') {
      handleSelectCardSetSource('tag');
    } else if (currentCardSetSource === 'tag') {
      handleSelectCardSetSource('folder');
    } else {
      // 검색 카드 세트인 경우 이전 카드 세트로 복원
      if (service) {
        const cardSetSourceService = service.getCardSetSourceService();
        const previousCardSetSource = cardSetSourceService.getPreviousCardSetSource();
        handleSelectCardSetSource(previousCardSetSource === 'search' ? 'folder' : previousCardSetSource);
      } else {
        handleSelectCardSetSource('folder');
      }
    }
  };
  
  /**
   * 카드 세트 직접 선택 처리
   * 특정 카드 세트로 직접 전환합니다.
   */
  const handleSelectCardSetSource = (cardSetSource: CardSetSourceType) => {
    if (cardSetSource === currentCardSetSource) {
      return;
    }
    
    if (!service) {
      return;
    }
    
    // 검색 카드 세트로 전환 시
    if (cardSetSource === 'search') {
      const searchService = service.getSearchService();
      if (searchService) {
        // 현재 카드 세트 상태 저장 후 검색 카드 세트로 전환
        searchService.enterSearchCardSetSource('', 'filename', false);
        onCardSetSourceChange('search');
        return;
      }
    }
    
    // 검색 카드 세트에서 다른 카드 세트로 전환 시
    if (currentCardSetSource === 'search') {
      const searchService = service.getSearchService();
      if (searchService) {
        // 검색 카드 세트 종료
        searchService.exitSearchCardSetSource();
        
        // 선택한 카드 세트가 이전 카드 세트와 다른 경우 추가 전환
        if (cardSetSource !== service.getCardSetSourceService().getPreviousCardSetSource()) {
          service.changeCardSetSource(cardSetSource).then(() => {
            onCardSetSourceChange(cardSetSource);
          });
        } else {
          // 이전 카드 세트로 자동 복원되므로 UI 업데이트만 수행
          onCardSetSourceChange(cardSetSource);
        }
        return;
      }
    }
    
    // 일반적인 카드 세트 전환
    service.changeCardSetSource(cardSetSource).then(() => {
      onCardSetSourceChange(cardSetSource);
    });
  };
  
  /**
   * 현재 카드 세트에 따른 표시 카드 세트 가져오기
   */
  const getDisplayCardSetSource = (): CardSetSourceType => {
    return currentCardSetSource;
  };
  
  // 현재 표시 카드 세트
  const displayCardSetSource = getDisplayCardSetSource();
  
  // 카드 세트별 표시 텍스트
  const getCardSetSourceDisplayText = (cardSetSource: CardSetSourceType): string => {
    switch (cardSetSource) {
      case 'folder':
        return '폴더 카드 세트';
      case 'tag':
        return '태그 카드 세트';
      case 'search':
        return '검색 카드 세트';
      default:
        return '카드 세트 선택';
    }
  };
  
  // 카드 세트별 아이콘 가져오기
  const getCardSetSourceIcon = (cardSetSource: CardSetSourceType) => {
    switch (cardSetSource) {
      case 'folder':
        return (
          <svg className="cardSetSource-icon folder-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path>
          </svg>
        );
      case 'tag':
        return (
          <svg className="cardSetSource-icon tag-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"></path>
          </svg>
        );
      case 'search':
        return (
          <svg className="cardSetSource-icon search-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
          </svg>
        );
      default:
        return (
          <svg className="cardSetSource-icon folder-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path>
          </svg>
        );
    }
  };
  
  // 다음 카드 세트 아이콘 가져오기 (폴더 <-> 태그)
  const getNextCardSetSourceIcon = () => {
    if (currentCardSetSource === 'folder') {
      return (
        <svg className="cardSetSource-icon tag-icon" viewBox="0 0 24 24">
          <path fill="currentColor" d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"></path>
        </svg>
      );
    } else {
      return (
        <svg className="cardSetSource-icon folder-icon" viewBox="0 0 24 24">
          <path fill="currentColor" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path>
        </svg>
      );
    }
  };
  
  return (
    <div className="card-navigator-cardSetSource-toggle-container">
      <div 
        className="card-navigator-cardSetSource-toggle" 
        onClick={handleCardSetSourceToggle}
        title={`${getCardSetSourceDisplayText(displayCardSetSource)} (클릭하여 ${currentCardSetSource === 'folder' ? '태그' : '폴더'} 카드 세트로 전환)`}
      >
        <div className="card-navigator-cardSetSource-icon">
          {getCardSetSourceIcon(displayCardSetSource)}
        </div>
      </div>
    </div>
  );
};

export default CardSetSourceToggle; 