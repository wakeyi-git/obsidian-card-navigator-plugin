import { ICard } from '../card/Card';
import { ISort, SortDirection, SortType } from './Sort';

/**
 * 파일명 정렬 클래스
 * 파일명을 기준으로 카드를 정렬합니다.
 */
export class FilenameSort implements ISort {
  /**
   * 정렬 타입
   */
  type: SortType = 'filename';
  
  /**
   * 정렬 방향
   */
  direction: SortDirection;
  
  /**
   * 생성자
   * @param direction 정렬 방향
   */
  constructor(direction: SortDirection = 'asc') {
    this.direction = direction;
  }
  
  /**
   * 정렬 적용
   * @param cards 카드 목록
   * @returns 정렬된 카드 목록
   */
  apply(cards: ICard[]): ICard[] {
    return [...cards].sort((a, b) => this.compare(a, b));
  }
  
  /**
   * 정렬 방향 전환
   */
  toggleDirection(): void {
    this.direction = this.direction === 'asc' ? 'desc' : 'asc';
  }
  
  /**
   * 두 카드 비교
   * @param a 첫 번째 카드
   * @param b 두 번째 카드
   * @returns 비교 결과
   */
  compare(a: ICard, b: ICard): number {
    // 파일명 추출
    const filenameA = this.getFilename(a.path);
    const filenameB = this.getFilename(b.path);
    
    // 파일명 비교
    const result = filenameA.localeCompare(filenameB);
    
    // 정렬 방향에 따라 결과 반환
    return this.direction === 'asc' ? result : -result;
  }
  
  /**
   * 파일 경로에서 파일명 추출
   * @param path 파일 경로
   * @returns 파일명
   */
  private getFilename(path: string): string {
    const lastSlashIndex = path.lastIndexOf('/');
    const filename = lastSlashIndex >= 0 ? path.substring(lastSlashIndex + 1) : path;
    return filename.toLowerCase();
  }
} 