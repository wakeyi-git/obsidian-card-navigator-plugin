import { ICard } from '../models/Card';
import { ICardConfig } from '../models/CardConfig';

export interface IRenderManager {
  /**
   * 카드 렌더링을 시작합니다.
   * @param card 렌더링할 카드
   * @param config 렌더링 설정
   */
  startRendering(card: ICard, config: ICardConfig): void;

  /**
   * 카드 렌더링을 중지합니다.
   * @param cardId 중지할 카드의 ID
   */
  stopRendering(cardId: string): void;

  /**
   * 모든 렌더링을 중지합니다.
   */
  stopAllRendering(): void;

  /**
   * 렌더링 큐를 처리합니다.
   */
  processRenderQueue(): void;

  /**
   * 마크다운 텍스트를 HTML로 렌더링합니다.
   * @param markdown 렌더링할 마크다운 텍스트
   * @returns 렌더링된 HTML
   */
  renderMarkdown(markdown: string): Promise<string>;
} 