import { ICardPosition } from '../types/layout.types';

/**
 * 카드 위치 모델 클래스
 * 카드의 위치 정보를 표현하는 모델입니다.
 */
export class CardPosition implements ICardPosition {
  /**
   * 카드 ID
   */
  public readonly cardId: string;
  
  /**
   * X 좌표
   */
  public x: number;
  
  /**
   * Y 좌표
   */
  public y: number;
  
  /**
   * 너비
   */
  public width: number;
  
  /**
   * 높이
   */
  public height: number;
  
  /**
   * 행 인덱스
   */
  public row: number;
  
  /**
   * 열 인덱스
   */
  public column: number;
  
  /**
   * 생성자
   * @param cardId 카드 ID
   * @param x X 좌표
   * @param y Y 좌표
   * @param width 너비
   * @param height 높이
   * @param row 행 인덱스
   * @param column 열 인덱스
   */
  constructor(
    cardId: string,
    x: number = 0,
    y: number = 0,
    width: number = 0,
    height: number = 0,
    row: number = 0,
    column: number = 0
  ) {
    this.cardId = cardId;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.row = row;
    this.column = column;
  }
  
  /**
   * 위치 업데이트
   * @param x X 좌표
   * @param y Y 좌표
   */
  public updatePosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
  
  /**
   * 크기 업데이트
   * @param width 너비
   * @param height 높이
   */
  public updateSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
  
  /**
   * 그리드 위치 업데이트
   * @param row 행 인덱스
   * @param column 열 인덱스
   */
  public updateGridPosition(row: number, column: number): void {
    this.row = row;
    this.column = column;
  }
  
  /**
   * 다른 위치와 비교
   * @param other 다른 카드 위치
   * @returns 같은 위치인지 여부
   */
  public equals(other: ICardPosition): boolean {
    return (
      this.x === other.x &&
      this.y === other.y &&
      this.width === other.width &&
      this.height === other.height &&
      this.row === other.row &&
      this.column === other.column
    );
  }
  
  /**
   * 객체로 변환
   * @returns 카드 위치 객체
   */
  public toObject(): ICardPosition {
    return {
      cardId: this.cardId,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      row: this.row,
      column: this.column
    };
  }
  
  /**
   * 객체에서 카드 위치 생성
   * @param obj 카드 위치 객체
   * @returns 카드 위치 인스턴스
   */
  public static fromObject(obj: ICardPosition): CardPosition {
    return new CardPosition(
      obj.cardId,
      obj.x,
      obj.y,
      obj.width,
      obj.height,
      obj.row,
      obj.column
    );
  }
} 