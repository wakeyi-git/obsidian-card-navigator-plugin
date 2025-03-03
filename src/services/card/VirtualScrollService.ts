import { Card } from '../../core/models/Card';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';

/**
 * 가상 스크롤 서비스 클래스
 * 대량의 카드를 효율적으로 렌더링하기 위한 가상 스크롤링을 제공합니다.
 */
export class VirtualScrollService {
  private allCards: Card[] = [];
  private visibleCards: Card[] = [];
  private cardHeight: number = 200;
  private containerHeight: number = 0;
  private scrollTop: number = 0;
  private bufferSize: number = 5;

  /**
   * 서비스를 초기화합니다.
   */
  public initialize(cards: Card[], containerHeight: number, cardHeight: number): void {
    try {
      this.allCards = cards;
      this.containerHeight = containerHeight;
      this.cardHeight = cardHeight;
      this.updateVisibleCards(0);

      Log.debug('VirtualScrollService', '가상 스크롤 서비스 초기화 완료');
    } catch (error) {
      ErrorHandler.handleError(
        'VirtualScrollService.initialize',
        `초기화 실패: ${error}`,
        false
      );
    }
  }

  /**
   * 보이는 카드 목록을 업데이트합니다.
   */
  public updateVisibleCards(newScrollTop: number): Card[] {
    try {
      this.scrollTop = newScrollTop;

      // 시작 및 끝 인덱스 계산
      const startIndex = Math.floor(this.scrollTop / this.cardHeight);
      const endIndex = Math.ceil((this.scrollTop + this.containerHeight) / this.cardHeight);

      // 버퍼를 포함한 실제 범위 계산
      const bufferStart = Math.max(0, startIndex - this.bufferSize);
      const bufferEnd = Math.min(this.allCards.length, endIndex + this.bufferSize);

      // 보이는 카드 업데이트
      this.visibleCards = this.allCards.slice(bufferStart, bufferEnd);

      Log.debug(
        'VirtualScrollService',
        `보이는 카드 업데이트: ${bufferStart}-${bufferEnd}/${this.allCards.length}`
      );

      return this.visibleCards;
    } catch (error) {
      ErrorHandler.handleError(
        'VirtualScrollService.updateVisibleCards',
        `카드 업데이트 실패: ${error}`,
        false
      );
      return [];
    }
  }

  /**
   * 특정 카드의 오프셋 위치를 계산합니다.
   */
  public getCardOffset(index: number): number {
    return index * this.cardHeight;
  }

  /**
   * 전체 스크롤 높이를 계산합니다.
   */
  public getTotalScrollHeight(): number {
    return this.allCards.length * this.cardHeight;
  }

  /**
   * 현재 보이는 카드 목록을 반환합니다.
   */
  public getVisibleCards(): Card[] {
    return this.visibleCards;
  }

  /**
   * 카드 높이를 설정합니다.
   */
  public setCardHeight(height: number): void {
    if (height <= 0) {
      throw new Error('카드 높이는 0보다 커야 합니다.');
    }
    this.cardHeight = height;
    this.updateVisibleCards(this.scrollTop);
  }

  /**
   * 컨테이너 높이를 설정합니다.
   */
  public setContainerHeight(height: number): void {
    if (height <= 0) {
      throw new Error('컨테이너 높이는 0보다 커야 합니다.');
    }
    this.containerHeight = height;
    this.updateVisibleCards(this.scrollTop);
  }

  /**
   * 버퍼 크기를 설정합니다.
   */
  public setBufferSize(size: number): void {
    if (size < 0) {
      throw new Error('버퍼 크기는 0 이상이어야 합니다.');
    }
    this.bufferSize = size;
    this.updateVisibleCards(this.scrollTop);
  }

  /**
   * 현재 버퍼 크기를 반환합니다.
   */
  public getBufferSize(): number {
    return this.bufferSize;
  }
} 