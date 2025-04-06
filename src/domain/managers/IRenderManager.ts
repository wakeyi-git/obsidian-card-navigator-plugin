import { ICard } from '../models/Card';
import { ICardRenderer } from '../renderders/ICardRenderer';
import { ICardStyle } from '../models/CardStyle';
import { ICardConfig } from '../models/CardConfig';

/**
 * 렌더링 관리 담당
 * - 렌더링 요청 처리
 * - 렌더링 캐시 관리
 * - 렌더링 이벤트 처리
 */
export interface IRenderManager {
  /**
   * 렌더링 매니저를 초기화합니다.
   */
  initialize(): void;

  /**
   * 렌더링 매니저를 정리합니다.
   */
  cleanup(): void;

  /**
   * 렌더링 매니저가 초기화되었는지 확인합니다.
   * @returns 초기화 여부
   */
  isInitialized(): boolean;
  
  /**
   * 렌더러를 설정합니다.
   * @param renderer 렌더러
   */
  setRenderer(renderer: ICardRenderer): void;

  /**
   * 카드 렌더링을 요청합니다.
   * @param cardId 카드 ID
   * @param card 카드
   * @returns 렌더링된 HTML 문자열
   */
  requestRender(cardId: string, card: ICard): Promise<string>;
  
  /**
   * 렌더링 캐시를 초기화합니다.
   */
  clearRenderCache(): void;

  /**
   * 카드의 렌더링 캐시를 업데이트합니다.
   * @param cardId 카드 ID
   */
  updateCardRenderCache(cardId: string): Promise<void>;

  /**
   * 카드의 렌더링 캐시를 제거합니다.
   * @param cardId 카드 ID
   */
  removeCardRenderCache(cardId: string): void;
  
  /**
   * 렌더링 이벤트를 구독합니다.
   * @param callback 이벤트 콜백
   */
  subscribeToRenderEvents(callback: (event: {
    type: 'render' | 'cache-update';
    cardId?: string;
    data?: any;
  }) => void): void;
  
  /**
   * 렌더링 이벤트 구독을 해제합니다.
   * @param callback 이벤트 콜백
   */
  unsubscribeFromRenderEvents(callback: (event: any) => void): void;
  
  /**
   * 카드가 렌더링되었는지 확인합니다.
   * @param cardId 카드 ID
   * @returns 렌더링 여부
   */
  isCardRendered(cardId: string): boolean;

  /**
   * 카드가 렌더링 중인지 확인합니다.
   * @param cardId 카드 ID
   * @returns 렌더링 중 여부
   */
  isCardRendering(cardId: string): boolean;

  /**
   * 스타일 업데이트
   * @param style 카드 스타일
   */
  updateStyle(style: ICardStyle): void;

  /**
   * 렌더링 설정 업데이트
   * @param config 카드 설정
   */
  updateRenderConfig(config: ICardConfig): void;
} 