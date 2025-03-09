import { ICard } from '../../domain/card/Card';
import { ICardProps } from '../cards-container/Card';

/**
 * 카드 객체를 카드 프롭스로 변환
 * @param card 카드 객체
 * @returns 카드 프롭스
 */
export const mapCardToProps = (card: ICard): ICardProps => {
  return {
    id: card.id,
    title: card.title,
    content: card.content,
    path: card.path,
    tags: card.tags,
    created: card.created,
    modified: card.modified,
    firstHeader: card.firstHeader || '',
    frontmatter: card.frontmatter || {},
    displaySettings: card.displaySettings,
    isActive: false, // 기본값 설정
    isFocused: false, // 기본값 설정
  };
};

/**
 * 카드 프롭스를 카드 객체로 변환
 * @param cardProps 카드 프롭스
 * @returns 카드 객체
 */
export const mapPropsToCard = (cardProps: ICardProps): ICard => {
  return {
    id: cardProps.id,
    title: cardProps.title,
    content: cardProps.content,
    // path와 tags는 optional이므로 기본값 제공
    path: cardProps.path || '',
    tags: cardProps.tags || [],
    // created와 modified는 optional이므로 기본값 제공
    created: cardProps.created || Date.now(),
    modified: cardProps.modified || Date.now(),
    // frontmatter는 optional이므로 undefined 허용
    frontmatter: undefined
  };
};

/**
 * 카드 프롭스 배열을 카드 객체 배열로 변환
 * @param cardProps 카드 프롭스 배열
 * @returns 카드 객체 배열
 */
export const mapPropsArrayToCardArray = (cardProps: ICardProps[]): ICard[] => {
  return cardProps.map(mapPropsToCard);
};

/**
 * 카드 객체 배열을 카드 프롭스 배열로 변환
 * @param cards 카드 객체 배열
 * @returns 카드 프롭스 배열
 */
export const mapCardArrayToPropsArray = (cards: ICard[]): ICardProps[] => {
  return cards.map(mapCardToProps);
}; 