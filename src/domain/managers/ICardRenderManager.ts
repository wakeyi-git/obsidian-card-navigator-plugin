import { IRenderConfig, IRenderState } from '../models/Card';

/**
 * 카드 렌더링 관리 담당
 * - 렌더링 상태 관리
 * - 렌더링 이벤트 관리
 * - 렌더링 리소스 관리
 */
export interface ICardRenderManager {
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
   * 렌더링 상태를 등록합니다.
   * @param cardId 카드 ID
   * @param state 렌더링 상태
   */
  registerRenderState(cardId: string, state: IRenderState): void;

  /**
   * 렌더링 상태를 등록 해제합니다.
   * @param cardId 카드 ID
   */
  unregisterRenderState(cardId: string): void;

  /**
   * 렌더링 상태를 가져옵니다.
   * @param cardId 카드 ID
   * @returns 렌더링 상태
   */
  getRenderState(cardId: string): IRenderState | null;

  /**
   * 렌더링 상태를 업데이트합니다.
   * @param cardId 카드 ID
   * @param state 업데이트할 상태
   */
  updateRenderState(cardId: string, state: Partial<IRenderState>): void;

  /**
   * 렌더링 이벤트를 구독합니다.
   * @param callback 이벤트 콜백
   */
  subscribeToRenderEvents(callback: (event: {
    type: 'render' | 'cache-update';
    cardId?: string;
    data?: {
      status: string;
      config?: IRenderConfig;
      error?: string;
    };
  }) => void): void;

  /**
   * 렌더링 이벤트 구독을 해제합니다.
   * @param callback 이벤트 콜백
   */
  unsubscribeFromRenderEvents(callback: (event: any) => void): void;

  /**
   * 렌더링 리소스를 등록합니다.
   * @param cardId 카드 ID
   * @param resource 리소스
   */
  registerRenderResource(cardId: string, resource: any): void;

  /**
   * 렌더링 리소스를 등록 해제합니다.
   * @param cardId 카드 ID
   */
  unregisterRenderResource(cardId: string): void;

  /**
   * 렌더링 리소스를 가져옵니다.
   * @param cardId 카드 ID
   * @returns 렌더링 리소스
   */
  getRenderResource(cardId: string): any | null;

  /**
   * 렌더링 설정을 가져옵니다.
   * @returns 렌더링 설정
   */
  getRenderConfig(): IRenderConfig;
} 