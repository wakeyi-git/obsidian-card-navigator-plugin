import { CardFilter, CardSort, CardSetType } from '../../domain/models/types';

/**
 * 카드셋 생성 DTO
 */
export interface CreateCardSetDto {
  name: string;
  type: CardSetType;
  source: string;
  filter?: CardFilter;
  sort?: CardSort;
}

/**
 * 카드셋 업데이트 DTO
 */
export interface UpdateCardSetDto {
  filter?: CardFilter;
  sort?: CardSort;
}

/**
 * 카드셋 응답 DTO
 */
export interface CardSetResponseDto {
  id: string;
  type: CardSetType;
  source: string;
  filter: CardFilter;
  sort: CardSort;
  cardIds: string[];
  createdAt: Date;
  updatedAt: Date;
} 