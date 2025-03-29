import { TFile, App } from 'obsidian';
import { CardContent, CardStyle, CardPosition } from './types';

/**
 * 카드 도메인 모델
 */
export class Card {
  private readonly createdAt: Date;
  private updatedAt: Date;
  private content: CardContent;
  private style: CardStyle;
  private position: CardPosition;
  private isActiveState: boolean = false;
  private isFocusedState: boolean = false;
  private file: TFile;

  constructor(
    private readonly filePath: string,
    file: TFile,
    content: CardContent,
    style: CardStyle,
    position: CardPosition = { left: 0, top: 0, width: style.width, height: style.height },
    private readonly app: App
  ) {
    this.file = file;
    this.content = content;
    this.style = style;
    this.position = position;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 카드 ID를 반환합니다.
   */
  getId(): string {
    return this.filePath;
  }

  /**
   * 카드의 파일 경로를 반환합니다.
   */
  getFilePath(): string {
    return this.filePath;
  }

  /**
   * 카드의 파일 객체를 반환합니다.
   */
  getFile(): TFile {
    return this.file;
  }

  /**
   * 카드의 컨텐츠를 반환합니다.
   */
  getContent(): CardContent {
    return this.content;
  }

  /**
   * 카드의 스타일을 반환합니다.
   */
  getStyle(): CardStyle {
    return this.style;
  }

  /**
   * 카드의 위치를 반환합니다.
   */
  getPosition(): CardPosition {
    return this.position;
  }

  /**
   * 카드의 컨텐츠를 업데이트합니다.
   */
  updateContent(content: CardContent): void {
    this.content = content;
    this.updatedAt = new Date();
  }

  /**
   * 카드의 스타일을 업데이트합니다.
   */
  updateStyle(style: CardStyle): void {
    this.style = style;
    this.updatedAt = new Date();
  }

  /**
   * 카드의 위치를 업데이트합니다.
   */
  updatePosition(position: CardPosition): void {
    this.position = position;
    this.updatedAt = new Date();
  }

  /**
   * 카드 생성 시간을 반환합니다.
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * 카드 수정 시간을 반환합니다.
   */
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * 카드가 활성 상태인지 확인합니다.
   */
  isActive(): boolean {
    return this.isActiveState;
  }

  /**
   * 카드가 포커스 상태인지 확인합니다.
   */
  isFocused(): boolean {
    return this.isFocusedState;
  }

  /**
   * 카드의 활성 상태를 설정합니다.
   */
  setActive(active: boolean): void {
    this.isActiveState = active;
    this.updatedAt = new Date();
  }

  /**
   * 카드의 포커스 상태를 설정합니다.
   */
  setFocused(focused: boolean): void {
    this.isFocusedState = focused;
    this.updatedAt = new Date();
  }
} 