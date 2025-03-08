import React, { useEffect } from 'react';
import Card, { ICardProps } from './Card';
import './CardContainer.css';

/**
 * 카드 컨테이너 속성 인터페이스
 */
export interface ICardContainerProps {
  cards: ICardProps[];
  onCardClick?: (id: string) => void;
  layout?: 'grid' | 'masonry';
  searchQuery?: string;
  emptyMessage?: string;
  
  // 추가 속성
  onCardContextMenu?: (id: string, event: React.MouseEvent) => void;
  onCardDragStart?: (id: string, event: React.DragEvent) => void;
  onCardDragEnd?: (id: string, event: React.DragEvent) => void;
  onCardDrop?: (id: string, event: React.DragEvent) => void;
  onCardDragOver?: (id: string, event: React.DragEvent) => void;
  onCardDragEnter?: (id: string, event: React.DragEvent) => void;
  onCardDragLeave?: (id: string, event: React.DragEvent) => void;
  service?: any;
}

/**
 * 카드 컨테이너 컴포넌트
 * 카드 목록을 그리드 또는 메이슨리 레이아웃으로 표시합니다.
 */
const CardContainer: React.FC<ICardContainerProps> = ({
  cards,
  onCardClick,
  layout = 'grid',
  searchQuery = '',
  emptyMessage = '표시할 카드가 없습니다',
  
  // 추가 속성
  onCardContextMenu = () => {},
  onCardDragStart = () => {},
  onCardDragEnd = () => {},
  onCardDrop = () => {},
  onCardDragOver = () => {},
  onCardDragEnter = () => {},
  onCardDragLeave = () => {},
  service
}) => {
  // 이 줄을 제거합니다
  // console.time('[성능] CardContainer 렌더링 시간');
  
// 컴포넌트 렌더링 성능 측정 (CardContainer 컴포넌트 내부)
useEffect(() => {
  // 타이머 ID를 고유하게 만들기 위해 타임스탬프 추가
  const timerId = `[성능] CardContainer 렌더링 시간-${Date.now()}`;
  
  // 타이머 시작
  console.time(timerId);
  
  return () => {
    // 클린업 함수에서 동일한 ID로 타이머 종료
    try {
      console.timeEnd(timerId);
    } catch (e) {
      // 타이머가 없는 경우 오류 무시
    }
  };
}, [cards, layout, searchQuery]); // 의존성 배열은 실제 컴포넌트에 맞게 조정
  
  // 카드가 없는 경우 메시지 표시
  if (cards.length === 0) {
    return (
      <div className={`card-navigator-empty-state ${layout}`}>
        <div className="card-navigator-empty-message">
          <span>{emptyMessage}</span>
          {!searchQuery && <p>다른 폴더나 태그를 선택해보세요.</p>}
        </div>
      </div>
    );
  }

  // 카드 렌더링 함수
  const renderCard = (card: ICardProps, index: number) => {
    return (
      <Card
        key={card.id}
        id={card.id}
        title={card.title}
        content={card.content}
        tags={card.tags}
        path={card.path}
        created={card.created}
        modified={card.modified}
        onClick={onCardClick}
        searchQuery={searchQuery}
        isActive={card.isActive}
        onContextMenu={onCardContextMenu}
        onDragStart={onCardDragStart}
        onDragEnd={onCardDragEnd}
        onDrop={onCardDrop}
        onDragOver={onCardDragOver}
        onDragEnter={onCardDragEnter}
        onDragLeave={onCardDragLeave}
        cardNavigatorService={service}
      />
    );
  };

  // 그리드 레이아웃
  if (layout === 'grid') {
    return (
      <div className="card-navigator-grid">
        {cards.map((card, index) => renderCard(card, index))}
      </div>
    );
  }

  // 메이슨리 레이아웃
  return (
    <div className="card-navigator-masonry">
      <div className="card-navigator-masonry-column">
        {cards
          .filter((_, i) => i % 3 === 0)
          .map((card, index) => renderCard(card, index))}
      </div>
      <div className="card-navigator-masonry-column">
        {cards
          .filter((_, i) => i % 3 === 1)
          .map((card, index) => renderCard(card, index))}
      </div>
      <div className="card-navigator-masonry-column">
        {cards
          .filter((_, i) => i % 3 === 2)
          .map((card, index) => renderCard(card, index))}
      </div>
    </div>
  );
};

export default CardContainer; 