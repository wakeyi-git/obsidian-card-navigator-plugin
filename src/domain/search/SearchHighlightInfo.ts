/**
 * 검색 결과 강조 정보 클래스
 * 검색 결과에서 검색어 강조 정보를 관리합니다.
 */
export class SearchHighlightInfo {
  private text: string;
  private positions: number[];

  constructor(text: string, positions: number[] = []) {
    this.text = text;
    this.positions = positions;
  }

  /**
   * 텍스트 가져오기
   * @returns 텍스트
   */
  getText(): string {
    return this.text;
  }

  /**
   * 위치 가져오기
   * @returns 위치 목록
   */
  getPositions(): number[] {
    return [...this.positions];
  }

  /**
   * 위치 추가
   * @param position 추가할 위치
   */
  addPosition(position: number): void {
    this.positions.push(position);
  }

  /**
   * 위치 설정
   * @param positions 위치 목록
   */
  setPositions(positions: number[]): void {
    this.positions = [...positions];
  }

  /**
   * 강조 정보 직렬화
   * @returns 직렬화된 강조 정보
   */
  serialize(): { text: string, positions: number[] } {
    return {
      text: this.text,
      positions: [...this.positions]
    };
  }
} 