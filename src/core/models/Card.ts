import { TFile } from 'obsidian';
import { CardData } from '../types/card.types';
import { ICardPosition } from '../types/layout.types';

/**
 * 카드 모델 클래스
 * 카드의 데이터를 관리합니다.
 */
export class Card implements CardData {
  /**
   * 고유 식별자
   */
  id: string;

  /**
   * 파일 객체
   */
  public readonly file?: TFile;
  
  /**
   * 파일 경로
   */
  public readonly path: string;
  
  /**
   * 파일명
   */
  public readonly filename: string;
  
  /**
   * 첫 번째 헤더
   */
  public readonly firstHeader?: string;
  
  /**
   * 본문 내용
   */
  public readonly content?: string;
  
  /**
   * 태그 배열
   */
  public readonly tags: string[];
  
  /**
   * 생성 날짜
   */
  public readonly creationDate: number;
  
  /**
   * 수정 날짜
   */
  public readonly modificationDate: number;
  
  /**
   * 파일 크기
   */
  public readonly fileSize: number;
  
  /**
   * 카드 위치
   */
  public readonly position: ICardPosition | null;
  
  /**
   * 고정 여부
   */
  public readonly isPinned: boolean;
  
  /**
   * 카드 생성자
   * @param fileOrData 파일 객체 또는 카드 데이터
   * @param filename 파일명
   * @param firstHeader 첫 번째 헤더
   * @param content 본문 내용
   * @param tags 태그 배열
   * @param creationDate 생성 날짜
   * @param modificationDate 수정 날짜
   * @param fileSize 파일 크기
   * @param position 카드 위치
   * @param isPinned 고정 여부
   */
  constructor(
    fileOrData: TFile | CardData,
    filename?: string,
    firstHeader?: string,
    content?: string,
    tags?: string[],
    creationDate?: number,
    modificationDate?: number,
    fileSize?: number,
    position?: ICardPosition | null,
    isPinned?: boolean
  ) {
    if (fileOrData instanceof TFile) {
      // TFile 생성자 오버로드
      const file = fileOrData;
      this.id = file.path;
      this.file = file;
      this.path = file.path;
      this.filename = filename || file.basename;
      this.firstHeader = firstHeader;
      this.content = content;
      this.tags = tags ? [...tags] : [];
      this.creationDate = creationDate || file.stat.ctime;
      this.modificationDate = modificationDate || file.stat.mtime;
      this.fileSize = fileSize || file.stat.size;
      this.position = position || null;
      this.isPinned = isPinned || false;
    } else {
      // CardData 생성자 오버로드
      const cardData = fileOrData;
      this.id = cardData.id;
      this.file = cardData.file;
      this.path = cardData.path || cardData.file?.path || '';
      this.filename = cardData.filename || cardData.file?.basename || '';
      this.firstHeader = cardData.firstHeader;
      this.content = cardData.content;
      this.tags = cardData.tags ? [...cardData.tags] : [];
      this.creationDate = cardData.creationDate || 0;
      this.modificationDate = cardData.modificationDate || 0;
      this.fileSize = cardData.fileSize || 0;
      this.position = cardData.position || null;
      this.isPinned = isPinned || false;
    }
  }
  
  /**
   * 카드 데이터 업데이트
   * @param cardData 업데이트할 카드 데이터
   */
  public update(cardData: CardData): void {
    // readonly 속성이므로 타입 단언을 사용하여 업데이트
    (this as any).path = cardData.path || this.path;
    (this as any).filename = cardData.filename || this.filename;
    (this as any).firstHeader = cardData.firstHeader;
    (this as any).content = cardData.content;
    (this as any).tags = cardData.tags ? [...cardData.tags] : this.tags;
    (this as any).creationDate = cardData.creationDate || this.creationDate;
    (this as any).modificationDate = cardData.modificationDate || this.modificationDate;
    (this as any).fileSize = cardData.fileSize || this.fileSize;
    (this as any).position = cardData.position || this.position;
    (this as any).isPinned = cardData.isPinned || this.isPinned;
  }
  
  /**
   * 카드 제목 가져오기
   * @returns 카드 제목 (첫 번째 헤더 또는 파일명)
   */
  public getTitle(): string {
    return this.firstHeader || this.filename;
  }
  
  /**
   * 카드 데이터 객체로 변환
   * @returns 카드 데이터 객체
   */
  public toObject(): CardData {
    return {
      id: this.id,
      file: this.file,
      path: this.path,
      filename: this.filename,
      firstHeader: this.firstHeader,
      content: this.content,
      tags: this.tags,
      creationDate: this.creationDate,
      modificationDate: this.modificationDate,
      fileSize: this.fileSize,
      position: this.position,
      isPinned: this.isPinned
    };
  }
} 