import { ICard } from '../models/Card';
import { ICardRenderConfig } from '../models/CardRenderConfig';
import { ICardStyle } from '../models/CardStyle';

/**
 * 렌더링 관리자 인터페이스
 * - 카드 렌더링 관리
 * - 렌더링 캐시 관리
 * - 렌더링 이벤트 처리
 */
export interface IRenderManager {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 카드 렌더링
   * @param card 카드
   * @param config 렌더링 설정
   * @param style 스타일
   */
  renderCard(card: ICard, config: ICardRenderConfig, style: ICardStyle): Promise<string>;

  /**
   * 렌더링 설정 업데이트
   * @param config 렌더링 설정
   */
  updateRenderConfig(config: ICardRenderConfig): void;

  /**
   * 스타일 업데이트
   * @param style 스타일
   */
  updateStyle(style: ICardStyle): void;

  /**
   * 렌더링 캐시 초기화
   */
  clearRenderCache(): void;

  /**
   * 카드 렌더링 캐시 업데이트
   * @param cardId 카드 ID
   */
  updateCardRenderCache(cardId: string): Promise<void>;

  /**
   * 카드 렌더링 캐시 삭제
   * @param cardId 카드 ID
   */
  removeCardRenderCache(cardId: string): void;

  /**
   * 렌더링 이벤트 구독
   * @param callback 콜백 함수
   */
  subscribeToRenderEvents(callback: (event: {
    type: 'render' | 'cache-update' | 'config-update' | 'style-update';
    cardId?: string;
    data?: any;
  }) => void): void;

  /**
   * 렌더링 이벤트 구독 해제
   * @param callback 콜백 함수
   */
  unsubscribeFromRenderEvents(callback: (event: any) => void): void;

  /**
   * 렌더링 상태 확인
   * @param cardId 카드 ID
   */
  isCardRendered(cardId: string): boolean;

  /**
   * 렌더링 진행 상태 확인
   * @param cardId 카드 ID
   */
  isCardRendering(cardId: string): boolean;
} 