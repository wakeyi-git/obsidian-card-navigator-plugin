import { Card } from '../../models/Card';
import { CardRenderOptions } from '../../types/card.types';

/**
 * 카드 렌더링 서비스 인터페이스
 * 카드의 시각적 표현을 담당하는 서비스의 인터페이스를 정의합니다.
 */
export interface ICardRenderService {
  /**
   * 카드 요소 생성
   * 카드 데이터를 기반으로 HTML 요소를 생성합니다.
   * @param card 카드 객체
   * @param options 렌더링 옵션
   * @returns 생성된 카드 HTML 요소
   */
  createCardElement(card: Card, options?: Partial<CardRenderOptions>): HTMLElement;
  
  /**
   * 카드 요소 업데이트
   * 기존 카드 요소를 새로운 카드 데이터로 업데이트합니다.
   * @param element 업데이트할 카드 요소
   * @param card 카드 객체
   * @param options 렌더링 옵션
   * @returns 업데이트된 카드 HTML 요소
   */
  updateCardElement(element: HTMLElement, card: Card, options?: Partial<CardRenderOptions>): HTMLElement;
  
  /**
   * 카드 렌더링 옵션 설정
   * 카드 렌더링에 사용될 옵션을 설정합니다.
   * @param options 렌더링 옵션
   */
  setRenderOptions(options: Partial<CardRenderOptions>): void;
  
  /**
   * 카드 렌더링 옵션 가져오기
   * 현재 설정된 렌더링 옵션을 반환합니다.
   * @returns 현재 렌더링 옵션
   */
  getRenderOptions(): CardRenderOptions;
  
  /**
   * 카드 요소 스타일 적용
   * 카드 요소에 스타일을 적용합니다.
   * @param element 스타일을 적용할 카드 요소
   * @param options 스타일 옵션
   */
  applyCardStyle(element: HTMLElement, options?: Partial<CardRenderOptions>): void;
  
  /**
   * 마크다운 렌더링
   * 마크다운 텍스트를 HTML로 렌더링합니다.
   * @param markdown 마크다운 텍스트
   * @param card 관련 카드 객체 (선택 사항)
   * @returns 렌더링된 HTML
   */
  renderMarkdown(markdown: string, card?: Card): string;
  
  /**
   * 카드 콘텐츠 렌더링
   * 카드의 콘텐츠 부분을 렌더링합니다.
   * @param card 카드 객체
   * @param options 렌더링 옵션
   * @returns 렌더링된 콘텐츠 요소
   */
  renderCardContent(card: Card, options?: Partial<CardRenderOptions>): HTMLElement;
  
  /**
   * 서비스 초기화
   * 렌더링 서비스를 초기화합니다.
   * @param options 초기화 옵션
   */
  initialize(options?: Partial<CardRenderOptions>): void;
  
  /**
   * 서비스 정리
   * 렌더링 서비스가 사용한 리소스를 정리합니다.
   */
  destroy(): void;
} 