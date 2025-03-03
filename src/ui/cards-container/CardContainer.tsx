import React from 'react';
import Card, { ICardProps } from './Card';

/**
 * 카드 컨테이너 속성 인터페이스
 */
export interface ICardContainerProps {
  cards: ICardProps[];
  onCardClick?: (id: string) => void;
  layout?: 'grid' | 'masonry';
}

/**
 * 카드 컨테이너 컴포넌트
 * 카드 목록을 그리드 또는 메이슨리 레이아웃으로 표시합니다.
 */
const CardContainer: React.FC<ICardContainerProps> = ({
  cards,
  onCardClick,
  layout = 'grid',
}) => {
  // 카드가 없는 경우 메시지 표시
  if (cards.length === 0) {
    return (
      <div className="card-navigator-empty">
        <p>표시할 카드가 없습니다.</p>
      </div>
    );
  }

  // 그리드 레이아웃
  if (layout === 'grid') {
    return (
      <div className="card-navigator-grid">
        {cards.map((card) => (
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
          .map((card) => (
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
            />
          ))}
      </div>
      <div className="card-navigator-masonry-column">
        {cards
          .filter((_, i) => i % 3 === 1)
          .map((card) => (
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
            />
          ))}
      </div>
      <div className="card-navigator-masonry-column">
        {cards
          .filter((_, i) => i % 3 === 2)
          .map((card) => (
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
            />
          ))}
      </div>
    </div>
  );
};

export default CardContainer; 