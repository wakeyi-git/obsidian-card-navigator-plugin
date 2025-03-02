import { TFile } from 'obsidian';
import { CardData } from '../types/card.types';

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
  public readonly file: TFile;
  
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
   * 카드 생성자
   * @param file 파일 객체
   * @param filename 파일명
   * @param firstHeader 첫 번째 헤더
   * @param content 본문 내용
   * @param tags 태그 배열
   * @param creationDate 생성 날짜
   * @param modificationDate 수정 날짜
   * @param fileSize 파일 크기
   */
  constructor(
    file: TFile,
    filename: string,
    firstHeader: string | undefined,
    content: string | undefined,
    tags: string[],
    creationDate: number,
    modificationDate: number,
    fileSize: number
  ) {
    this.id = file.path;
    this.file = file;
    this.path = file.path;
    this.filename = filename;
    this.firstHeader = firstHeader;
    this.content = content;
    this.tags = [...tags];
    this.creationDate = creationDate;
    this.modificationDate = modificationDate;
    this.fileSize = fileSize;
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
      fileSize: this.fileSize
    };
  }
} 