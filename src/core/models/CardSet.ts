import { TFile } from 'obsidian';
import { CardSetMode, ICardSet } from '../types/cardset.types';
import { generateUniqueId } from '../../utils/helpers/string.helper';

/**
 * 간단한 카드셋 인터페이스
 * 기본 카드셋 데이터 구조를 정의합니다.
 */
export interface ISimpleCardSet {
  /**
   * 카드셋 고유 ID
   */
  id: string;
  
  /**
   * 카드셋에 포함된 파일 목록
   */
  files: TFile[];
  
  /**
   * 카드셋 생성/업데이트 타임스탬프
   */
  timestamp: number;
}

/**
 * 간단한 카드셋 생성 함수
 * @param files 파일 목록
 * @returns 새로운 간단한 카드셋 객체
 */
export function createSimpleCardSet(files: TFile[] = []): ISimpleCardSet {
  return {
    id: generateUniqueId(),
    files,
    timestamp: Date.now()
  };
}

/**
 * 간단한 카드셋 업데이트 함수
 * @param cardSet 기존 카드셋
 * @param files 새 파일 목록
 * @returns 업데이트된 카드셋
 */
export function updateSimpleCardSet(cardSet: ISimpleCardSet, files: TFile[]): ISimpleCardSet {
  return {
    ...cardSet,
    files,
    timestamp: Date.now()
  };
}

/**
 * 카드셋 모델 클래스
 * 카드셋 데이터를 표현하는 모델입니다.
 */
export class CardSet implements ICardSet {
  /**
   * 카드셋 ID
   */
  public readonly id: string;
  
  /**
   * 카드셋 모드
   */
  public readonly mode: CardSetMode;
  
  /**
   * 카드셋 소스 (폴더 경로 또는 검색어)
   */
  public readonly source: string | null;
  
  /**
   * 카드셋에 포함된 파일 목록
   */
  public readonly files: TFile[];
  
  /**
   * 마지막 업데이트 시간
   */
  public readonly lastUpdated: number;
  
  /**
   * 생성자
   * @param id 카드셋 ID
   * @param mode 카드셋 모드
   * @param source 카드셋 소스
   * @param files 파일 목록
   * @param lastUpdated 마지막 업데이트 시간
   */
  constructor(
    id: string,
    mode: CardSetMode,
    source: string | null,
    files: TFile[] = [],
    lastUpdated: number = Date.now()
  ) {
    this.id = id;
    this.mode = mode;
    this.source = source;
    this.files = [...files];
    this.lastUpdated = lastUpdated;
  }
  
  /**
   * 파일 포함 여부 확인
   * @param filePath 파일 경로
   * @returns 포함 여부
   */
  public containsFile(filePath: string): boolean {
    return this.files.some(file => file.path === filePath);
  }
  
  /**
   * 파일 추가
   * @param file 추가할 파일
   * @returns 새 카드셋 인스턴스
   */
  public addFile(file: TFile): CardSet {
    if (this.containsFile(file.path)) {
      return this;
    }
    
    return new CardSet(
      this.id,
      this.mode,
      this.source,
      [...this.files, file],
      Date.now()
    );
  }
  
  /**
   * 파일 제거
   * @param filePath 제거할 파일 경로
   * @returns 새 카드셋 인스턴스
   */
  public removeFile(filePath: string): CardSet {
    if (!this.containsFile(filePath)) {
      return this;
    }
    
    return new CardSet(
      this.id,
      this.mode,
      this.source,
      this.files.filter(file => file.path !== filePath),
      Date.now()
    );
  }
  
  /**
   * 파일 업데이트
   * @param file 업데이트할 파일
   * @returns 새 카드셋 인스턴스
   */
  public updateFile(file: TFile): CardSet {
    return this.removeFile(file.path).addFile(file);
  }
  
  /**
   * 파일 필터링
   * @param filterFn 필터 함수
   * @returns 새 카드셋 인스턴스
   */
  public filterFiles(filterFn: (file: TFile) => boolean): CardSet {
    return new CardSet(
      this.id,
      this.mode,
      this.source,
      this.files.filter(filterFn),
      Date.now()
    );
  }
  
  /**
   * 파일 정렬
   * @param compareFn 비교 함수
   * @returns 새 카드셋 인스턴스
   */
  public sortFiles(compareFn: (a: TFile, b: TFile) => number): CardSet {
    return new CardSet(
      this.id,
      this.mode,
      this.source,
      [...this.files].sort(compareFn),
      Date.now()
    );
  }
  
  /**
   * 파일 수 가져오기
   * @returns 파일 수
   */
  public getFileCount(): number {
    return this.files.length;
  }
  
  /**
   * 빈 카드셋 여부 확인
   * @returns 빈 카드셋 여부
   */
  public isEmpty(): boolean {
    return this.files.length === 0;
  }
  
  /**
   * 카드셋 새로고침
   * @param files 새 파일 목록
   * @returns 새 카드셋 인스턴스
   */
  public refresh(files: TFile[]): CardSet {
    return new CardSet(
      this.id,
      this.mode,
      this.source,
      files,
      Date.now()
    );
  }
  
  /**
   * 카드셋 모드 변경
   * @param mode 새 모드
   * @param source 새 소스
   * @returns 새 카드셋 인스턴스
   */
  public changeMode(mode: CardSetMode, source: string | null): CardSet {
    return new CardSet(
      this.id,
      mode,
      source,
      [],
      Date.now()
    );
  }
} 