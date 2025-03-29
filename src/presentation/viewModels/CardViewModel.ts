import { Card } from '../../domain/models/Card';
import { CardContent, CardPosition, CardStyle } from '../../domain/models/types';

/**
 * 카드 뷰 모델
 */
export class CardViewModel {
  constructor(private readonly card: Card) {}

  /**
   * 카드 ID를 반환합니다.
   */
  getId(): string {
    return this.card.getId();
  }

  /**
   * 파일 경로를 반환합니다.
   */
  getFilePath(): string {
    return this.card.getFilePath();
  }

  /**
   * 파일 이름을 반환합니다.
   */
  getFileName(): string {
    return this.card.getFile().name;
  }

  /**
   * 카드 내용을 반환합니다.
   */
  getContent(): CardContent {
    return this.card.getContent();
  }

  /**
   * 카드 스타일을 반환합니다.
   */
  getStyle(): CardStyle {
    return this.card.getStyle();
  }

  /**
   * 카드 위치를 반환합니다.
   */
  getPosition(): CardPosition {
    return this.card.getPosition();
  }

  /**
   * 카드가 활성화되어 있는지 확인합니다.
   */
  isActive(): boolean {
    return this.card.isActive();
  }

  /**
   * 카드가 포커스되어 있는지 확인합니다.
   */
  isFocused(): boolean {
    return this.card.isFocused();
  }

  /**
   * 카드 내용을 업데이트합니다.
   */
  updateContent(content: CardContent): void {
    this.card.updateContent(content);
  }

  /**
   * 카드 스타일을 업데이트합니다.
   */
  updateStyle(style: CardStyle): void {
    this.card.updateStyle(style);
  }

  /**
   * 카드 위치를 업데이트합니다.
   */
  updatePosition(position: CardPosition): void {
    this.card.updatePosition(position);
  }

  /**
   * 카드의 생성 시간을 반환합니다.
   */
  getCreatedAt(): Date {
    return this.card.getCreatedAt();
  }

  /**
   * 카드의 수정 시간을 반환합니다.
   */
  getUpdatedAt(): Date {
    return this.card.getUpdatedAt();
  }
} 