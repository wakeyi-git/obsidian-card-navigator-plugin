import { DomainError } from './DomainError';

/**
 * 카드 내비게이터 에러 클래스
 */
export class CardNavigatorError extends DomainError {
  constructor(message: string) {
    super('CardNavigator', 'CARD_NAVIGATOR_ERROR', message);
  }
} 