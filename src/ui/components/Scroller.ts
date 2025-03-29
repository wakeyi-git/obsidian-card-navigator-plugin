import { Card } from '@/domain/models/Card';

/**
 * 스크롤러 클래스
 * 카드 스크롤 및 포커스 관련 기능을 관리하는 클래스
 */
export class Scroller {
  private _container: HTMLElement | null = null;
  private _isScrolling = false;
  private _scrollBehavior: ScrollBehavior = 'smooth';

  /**
   * 컨테이너 설정
   */
  setContainer(container: HTMLElement): void {
    this._container = container;
  }

  /**
   * 스크롤 동작 설정
   */
  setScrollBehavior(behavior: ScrollBehavior): void {
    this._scrollBehavior = behavior;
  }

  /**
   * 카드로 스크롤
   */
  scrollToCard(cardId: string): void {
    if (!this._container || this._isScrolling) return;

    const cardElement = this._container.querySelector(`[data-card-id="${cardId}"]`);
    if (!cardElement) return;

    this._isScrolling = true;

    const containerRect = this._container.getBoundingClientRect();
    const cardRect = cardElement.getBoundingClientRect();
    const scrollLeft = cardRect.left - containerRect.left - (containerRect.width - cardRect.width) / 2;
    const scrollTop = cardRect.top - containerRect.top - (containerRect.height - cardRect.height) / 2;

    this._container.scrollTo({
      left: this._container.scrollLeft + scrollLeft,
      top: this._container.scrollTop + scrollTop,
      behavior: this._scrollBehavior
    });

    // 스크롤 완료 후 상태 초기화
    setTimeout(() => {
      this._isScrolling = false;
    }, 300);
  }

  /**
   * 스크롤 위치 초기화
   */
  resetScroll(): void {
    if (!this._container || this._isScrolling) return;

    this._isScrolling = true;

    this._container.scrollTo({
      left: 0,
      top: 0,
      behavior: this._scrollBehavior
    });

    setTimeout(() => {
      this._isScrolling = false;
    }, 300);
  }

  /**
   * 스크롤 위치 저장
   */
  saveScrollPosition(): { x: number; y: number } | null {
    if (!this._container) return null;

    return {
      x: this._container.scrollLeft,
      y: this._container.scrollTop
    };
  }

  /**
   * 스크롤 위치 복원
   */
  restoreScrollPosition(position: { x: number; y: number }): void {
    if (!this._container || this._isScrolling) return;

    this._isScrolling = true;

    this._container.scrollTo({
      left: position.x,
      top: position.y,
      behavior: this._scrollBehavior
    });

    setTimeout(() => {
      this._isScrolling = false;
    }, 300);
  }

  /**
   * 스크롤 이벤트 처리
   */
  handleScroll(): void {
    if (this._isScrolling) return;

    this._isScrolling = true;
    requestAnimationFrame(() => {
      this._isScrolling = false;
    });
  }
} 