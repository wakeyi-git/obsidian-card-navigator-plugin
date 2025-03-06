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
      <div className="card-navigator-empty-state">
        <div className="card-navigator-empty-message">
          <span>표시할 카드가 없습니다</span>
          <p>다른 폴더나 태그를 선택해보세요.</p>
        </div>
      </div>
    );
  }

  // 그리드 레이아웃
  if (layout === 'grid') {
    return (
      <div className="card-navigator-grid">
        {cards.map((card, index) => (
          <Card
            key={`grid-${card.id}-${index}`}
            id={card.id}
            title={card.title}
            content={card.content}
            tags={card.tags}
            path={card.path}
            created={card.created}
            modified={card.modified}
            onClick={onCardClick}
            searchQuery={searchQuery}
          />
        ))}
      </div>
    );
  }

  // 메이슨리 레이아웃
  return (
    <div className="card-navigator-masonry">
      <div className="card-navigator-masonry-column">
        {cards
          .filter((_, i) => i % 3 === 0)
          .map((card, index) => (
            <Card
              key={`masonry-col1-${card.id}-${index}`}
              id={card.id}
              title={card.title}
              content={card.content}
              tags={card.tags}
              path={card.path}
              created={card.created}
              modified={card.modified}
              onClick={onCardClick}
              searchQuery={searchQuery}
            />
          ))}
      </div>
      <div className="card-navigator-masonry-column">
        {cards
          .filter((_, i) => i % 3 === 1)
          .map((card, index) => (
            <Card
              key={`masonry-col2-${card.id}-${index}`}
              id={card.id}
              title={card.title}
              content={card.content}
              tags={card.tags}
              path={card.path}
              created={card.created}
              modified={card.modified}
              onClick={onCardClick}
              searchQuery={searchQuery}
            />
          ))}
      </div>
      <div className="card-navigator-masonry-column">
        {cards
          .filter((_, i) => i % 3 === 2)
          .map((card, index) => (
            <Card
              key={`masonry-col3-${card.id}-${index}`}
              id={card.id}
              title={card.title}
              content={card.content}
              tags={card.tags}
              path={card.path}
              created={card.created}
              modified={card.modified}
              onClick={onCardClick}
              searchQuery={searchQuery}
            />
          ))}
      </div>
    </div>
  );
};

export default CardContainer; 