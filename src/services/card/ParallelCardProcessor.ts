import { Card } from '../../core/models/Card';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';

/**
 * 병렬 카드 처리 서비스 클래스
 * 대량의 카드를 효율적으로 처리하기 위한 병렬 처리 기능을 제공합니다.
 */
export class ParallelCardProcessor {
  private chunkSize: number = 50;
  private delayBetweenChunks: number = 0;
  private isProcessing = false;

  /**
   * 카드 배열을 병렬로 처리합니다.
   */
  public async processCards(
    cards: Card[],
    processor: (card: Card) => Promise<void>,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      if (this.isProcessing) {
        throw new Error('이미 처리 중인 작업이 있습니다.');
      }

      this.isProcessing = true;
      const totalCards = cards.length;
      let processedCards = 0;

      // 청크 단위로 분할하여 처리
      for (let i = 0; i < cards.length; i += this.chunkSize) {
        const chunk = cards.slice(i, Math.min(i + this.chunkSize, cards.length));
        
        // 청크 내의 카드들을 병렬로 처리
        await Promise.all(
          chunk.map(async (card) => {
            try {
              await processor(card);
              processedCards++;
              
              // 진행률 업데이트
              if (onProgress) {
                const progress = (processedCards / totalCards) * 100;
                onProgress(progress);
              }
            } catch (error) {
              ErrorHandler.handleError(
                'ParallelCardProcessor.processCards',
                `카드 처리 실패 (ID: ${card.id}): ${error}`,
                false
              );
            }
          })
        );

        // 시스템 부하 방지를 위한 지연
        if (this.delayBetweenChunks > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenChunks));
        }

        Log.debug(
          'ParallelCardProcessor',
          `청크 처리 완료: ${Math.min(i + this.chunkSize, cards.length)}/${totalCards} 카드`
        );
      }
    } catch (error) {
      ErrorHandler.handleError(
        'ParallelCardProcessor.processCards',
        `병렬 처리 실패: ${error}`,
        false
      );
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 현재 처리 상태를 반환합니다.
   */
  public isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * 청크 크기를 설정합니다.
   */
  public setChunkSize(size: number): void {
    if (size < 1) {
      throw new Error('청크 크기는 1 이상이어야 합니다.');
    }
    this.chunkSize = size;
  }

  /**
   * 청크 간 지연 시간을 설정합니다.
   */
  public setDelayBetweenChunks(delay: number): void {
    if (delay < 0) {
      throw new Error('지연 시간은 0 이상이어야 합니다.');
    }
    this.delayBetweenChunks = delay;
  }

  /**
   * 현재 청크 크기를 반환합니다.
   */
  public getChunkSize(): number {
    return this.chunkSize;
  }

  /**
   * 현재 청크 간 지연 시간을 반환합니다.
   */
  public getDelayBetweenChunks(): number {
    return this.delayBetweenChunks;
  }
} 