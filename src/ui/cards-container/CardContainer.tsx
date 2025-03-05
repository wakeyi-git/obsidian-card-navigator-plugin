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
  console.time('[성능] CardContainer 렌더링 시간');
  
  useEffect(() => {
    console.timeEnd('[성능] CardContainer 렌더링 시간');
    console.log(`[성능] CardContainer 렌더링: 카드 수 = ${cards.length}, 레이아웃 = ${layout}`);
    console.log(`[CardContainer] 카드 목록 상태: ${cards.length > 0 ? '카드 있음' : '카드 없음'}`);
    if (cards.length > 0) {
      console.log(`[CardContainer] 첫 번째 카드 정보: 제목=${cards[0].title}, 경로=${cards[0].path}`);
    }
    if (searchQuery) {
      console.log(`[CardContainer] 검색 쿼리: ${searchQuery}`);
    }
  }, [cards, layout, searchQuery]);
  
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