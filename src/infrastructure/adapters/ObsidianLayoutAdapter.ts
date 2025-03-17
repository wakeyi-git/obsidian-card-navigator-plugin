import { App, WorkspaceLeaf } from 'obsidian';
import { ILayout } from '../../domain/layout/Layout';
import { ICard } from '../../domain/card/Card';
import { ILayoutAdapter } from './ILayoutAdapter';

/**
 * Obsidian 레이아웃 어댑터
 * Obsidian의 UI 요소를 레이아웃으로 변환하는 어댑터입니다.
 */
export class ObsidianLayoutAdapter implements ILayoutAdapter {
  private layouts: Map<string, HTMLElement> = new Map();

  constructor(private app: App) {}

  /**
   * 레이아웃 요소 생성
   * @param layout 레이아웃
   * @returns HTML 요소
   */
  createLayoutElement(layout: ILayout): HTMLElement {
    const element = document.createElement('div');
    element.className = `card-navigator-layout ${layout.type}`;
    element.dataset.layoutId = layout.id;

    this.layouts.set(layout.id, element);
    this.updateLayoutElement(element, layout);

    return element;
  }

  /**
   * 레이아웃 요소 가져오기
   * @param layoutId 레이아웃 ID
   * @returns HTML 요소
   */
  getLayoutElement(layoutId: string): HTMLElement | undefined {
    return this.layouts.get(layoutId);
  }

  /**
   * 레이아웃 요소 업데이트
   * @param element HTML 요소
   * @param layout 레이아웃
   */
  updateLayoutElement(element: HTMLElement, layout: ILayout): void {
    // 레이아웃 타입에 따른 스타일 적용
    element.className = `card-navigator-layout ${layout.type}`;

    // 기존 카드 요소 제거
    element.innerHTML = '';

    // 카드 요소 추가
    const cards: ICard[] = layout.cards;
    cards.forEach(card => {
      const cardElement = this.createCardElement(card);
      element.appendChild(cardElement);
    });

    // 레이아웃 타입에 따른 배치 로직 적용
    this.applyLayoutStyle(element, layout.type);
  }

  /**
   * 레이아웃 요소 제거
   * @param element HTML 요소
   */
  destroyLayoutElement(element: HTMLElement): void {
    const layoutId = element.dataset.layoutId;
    if (layoutId) {
      this.layouts.delete(layoutId);
    }
    element.remove();
  }

  /**
   * 카드 요소 생성
   * @param card 카드
   * @returns HTML 요소
   */
  createCardElement(card: ICard): HTMLElement {
    const element = document.createElement('div');
    element.className = 'card-navigator-card';
    element.dataset.cardId = card.getId();

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = card.getTitle();
    element.appendChild(title);

    const content = document.createElement('div');
    content.className = 'card-content';
    content.textContent = card.getContent();
    element.appendChild(content);

    return element;
  }

  /**
   * 레이아웃 스타일 적용
   * @param element HTML 요소
   * @param type 레이아웃 타입
   */
  private applyLayoutStyle(element: HTMLElement, type: string): void {
    switch (type) {
      case 'grid':
        element.style.display = 'grid';
        element.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        element.style.gap = '1rem';
        break;

      case 'masonry':
        element.style.columnCount = '3';
        element.style.columnGap = '1rem';
        element.querySelectorAll('.card-navigator-card').forEach(card => {
          (card as HTMLElement).style.breakInside = 'avoid';
          (card as HTMLElement).style.marginBottom = '1rem';
        });
        break;
    }
  }
} 