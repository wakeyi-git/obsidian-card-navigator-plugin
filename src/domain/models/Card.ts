import { TFile, App } from 'obsidian';
import { CardContent, CardStyle, CardPosition } from './types';

/**
 * 카드 도메인 모델
 */
export class Card {
  private readonly createdAt: Date;
  private readonly updatedAt: Date;

  constructor(
    private readonly id: string,
    private readonly file: TFile,
    private content: CardContent,
    private style: CardStyle,
    private position: CardPosition,
    private readonly app: App
  ) {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 카드 ID를 반환합니다.
   */
  getId(): string {
    return this.id;
  }

  /**
   * 카드의 파일을 반환합니다.
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
  }

  /**
   * 카드의 스타일을 업데이트합니다.
   */
  updateStyle(style: CardStyle): void {
    this.style = style;
  }

  /**
   * 카드의 위치를 업데이트합니다.
   */
  updatePosition(position: CardPosition): void {
    this.position = position;
  }

  /**
   * 카드가 활성 상태인지 확인합니다.
   */
  isActive(): boolean {
    const activeFile = this.app.workspace.getActiveFile();
    return activeFile ? this.file.path === activeFile.path : false;
  }

  /**
   * 카드가 포커스 상태인지 확인합니다.
   */
  isFocused(): boolean {
    const activeFile = this.app.workspace.getActiveFile();
    return activeFile ? this.id === activeFile.path : false;
  }

  getFilePath(): string {
    return this.file.path;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
} 