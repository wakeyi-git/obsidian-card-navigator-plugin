import { Card } from '@/domain/models/Card';

/**
 * 스크롤러 클래스
 * 카드 스크롤 및 포커스 관련 기능을 관리하는 클래스
 */
export class Scroller {
  private _container: HTMLElement | null = null;
  private _isScrolling = false;
  private _scrollBehavior: ScrollBehavior = 'smooth';
  private _scrollToCenter = true;

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
   * 중앙 정렬 설정
   */
  setScrollToCenter(scrollToCenter: boolean): void {
    this._scrollToCenter = scrollToCenter;
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

    let scrollLeft = 0;
    let scrollTop = 0;

    if (this._scrollToCenter) {
      // 카드를 뷰포트 중앙에 위치
      scrollLeft = cardRect.left - containerRect.left - (containerRect.width - cardRect.width) / 2;
      scrollTop = cardRect.top - containerRect.top - (containerRect.height - cardRect.height) / 2;
    } else {
      // 카드가 뷰포트에 보이도록 스크롤
      if (cardRect.left < containerRect.left) {
        scrollLeft = cardRect.left - containerRect.left;
      } else if (cardRect.right > containerRect.right) {
        scrollLeft = cardRect.right - containerRect.right;
      }

      if (cardRect.top < containerRect.top) {
        scrollTop = cardRect.top - containerRect.top;
      } else if (cardRect.bottom > containerRect.bottom) {
        scrollTop = cardRect.bottom - containerRect.bottom;
      }
    }

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
    if (!this._container) return;

    this._container.scrollTo({
      left: 0,
      top: 0,
      behavior: this._scrollBehavior
    });
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