import { ICard } from '../models/Card';
import { ICardConfig } from '../models/CardConfig';
import { ICardStyle } from '../models/CardStyle';

/**
 * 순수 렌더링 로직 담당
 * - 카드 내용을 HTML로 렌더링
 * - 마크다운 콘텐츠 변환
 * - 스타일 적용
 */
export interface ICardRenderer {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 카드 내용을 렌더링합니다.
   * @param card 렌더링할 카드
   * @param config 카드 설정
   * @param style 스타일
   * @returns 렌더링된 HTML 문자열
   */
  render(card: ICard, config: ICardConfig, style: ICardStyle): Promise<string>;
} 