import { CardContent, CardPosition, CardStyle } from '../../domain/models/types';

/**
 * 카드 생성 DTO
 */
export interface CreateCardDto {
  filePath: string;
  style?: CardStyle;
  position?: CardPosition;
}

/**
 * 카드 업데이트 DTO
 */
export interface UpdateCardDto {
  content?: CardContent;
  style?: CardStyle;
  position?: CardPosition;
}

/**
 * 카드 응답 DTO
 */
export interface CardResponseDto {
  id: string;
  filePath: string;
  content: CardContent;
  style: CardStyle;
  position: CardPosition;
  isActive: boolean;
  isFocused: boolean;
  createdAt: Date;
  updatedAt: Date;
} 