import { ILayout } from '../../domain/layout/Layout';
import { ICard } from '../../domain/card/Card';

/**
 * 레이아웃 어댑터 인터페이스
 */
export interface ILayoutAdapter {
  /**
   * 레이아웃 요소 생성
   */
  createLayoutElement(layout: ILayout): HTMLElement;

  /**
   * 레이아웃 요소 가져오기
   */
  getLayoutElement(layoutId: string): HTMLElement | undefined;

  /**
   * 레이아웃 요소 업데이트
   */
  updateLayoutElement(element: HTMLElement, layout: ILayout): void;

  /**
   * 레이아웃 요소 제거
   */
  destroyLayoutElement(element: HTMLElement): void;

  /**
   * 카드 요소 생성
   */
  createCardElement(card: ICard): HTMLElement;
} 