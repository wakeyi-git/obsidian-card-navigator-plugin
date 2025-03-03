import { Card } from '../../models/Card';
import { CardRenderOptions } from '../../types/card.types';
import { TFile } from 'obsidian';

/**
 * 카드 렌더링 서비스 인터페이스
 * 카드의 시각적 표현을 담당하는 서비스의 인터페이스를 정의합니다.
 */
export interface ICardRenderService {
  /**
   * 서비스 초기화
   * 렌더링 서비스를 초기화합니다.
   */
  initialize(options?: Partial<CardRenderOptions>): void;

  /**
   * 서비스 정리
   * 렌더링 서비스가 사용한 리소스를 정리합니다.
   */
  destroy(): void;

  /**
   * 카드 렌더링 옵션 설정
   */
  setRenderOptions(options: Partial<CardRenderOptions>): void;

  /**
   * 카드 렌더링 옵션 가져오기
   */
  getRenderOptions(): CardRenderOptions;

  /**
   * 카드 요소 스타일 적용
   */
  applyCardStyle(element: HTMLElement, options?: Partial<CardRenderOptions>): void;

  /**
   * 카드 요소를 생성합니다.
   * @param card 카드 객체
   * @param options 렌더링 옵션 (선택적)
   * @returns 생성된 카드 HTML 요소
   */
  createCardElement(card: Card, options?: Partial<CardRenderOptions>): HTMLElement;

  /**
   * 카드 요소를 업데이트합니다.
   * @param element 업데이트할 카드 요소
   * @param card 카드 객체
   * @param options 렌더링 옵션 (선택적)
   * @returns 업데이트된 카드 HTML 요소
   */
  updateCardElement(element: HTMLElement, card: Card, options?: Partial<CardRenderOptions>): HTMLElement;

  /**
   * 마크다운 텍스트를 HTML 문자열로 변환
   */
  convertMarkdownToHtml(markdown: string, card?: Card): string;

  /**
   * 마크다운 컨텐츠를 HTML 요소에 렌더링
   */
  renderMarkdownToElement(
    content: string,
    element: HTMLElement,
    sourcePath: string
  ): Promise<void>;

  /**
   * 카드 객체의 컨텐츠를 렌더링
   */
  renderCardContentFromCard(
    card: Card,
    options?: Partial<CardRenderOptions>
  ): HTMLElement;

  /**
   * 문자열 컨텐츠를 HTML 요소에 렌더링
   */
  renderContentToElement(
    content: string,
    element: HTMLElement,
    options: CardRenderOptions,
    file: TFile | null
  ): Promise<void>;

  /**
   * 수학 수식을 렌더링
   */
  renderMathEquations(element: HTMLElement): Promise<void>;

  /**
   * 코드 블록을 하이라이팅
   */
  highlightCodeBlocks(element: HTMLElement): Promise<void>;

  /**
   * 이미지를 렌더링
   */
  renderImages(element: HTMLElement, basePath: string): Promise<void>;

  /**
   * 렌더링된 요소의 크기를 조정
   */
  resizeRenderedContent(element: HTMLElement, options: CardRenderOptions): void;
} 