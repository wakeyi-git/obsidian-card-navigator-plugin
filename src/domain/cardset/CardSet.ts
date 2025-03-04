import { ICard } from '../card/Card';
import { ModeType } from '../mode/Mode';

/**
 * 카드 세트 타입
 * 카드 세트의 타입을 정의합니다.
 */
export type CardSetType = 'folder' | 'tag' | 'search' | 'custom';

/**
 * 카드 세트 인터페이스
 * 카드 세트의 공통 인터페이스를 정의합니다.
 */
export interface ICardSet {
  /**
   * 카드 세트 ID
   */
  id: string;
  
  /**
   * 카드 세트 이름
   */
  name: string;
  
  /**
   * 카드 세트 타입
   */
  type: CardSetType;
  
  /**
   * 카드 세트 모드
   */
  mode: ModeType;
  
  /**
   * 카드 세트 경로 또는 태그
   */
  path: string;
  
  /**
   * 하위 폴더 포함 여부
   */
  includeSubfolders: boolean;
  
  /**
   * 고정 여부
   */
  isFixed: boolean;
  
  /**
   * 카드 목록 가져오기
   * @returns 카드 목록
   */
  getCards(): Promise<ICard[]>;
  
  /**
   * 카드 세트 정보 업데이트
   * @param options 업데이트할 옵션
   */
  update(options: Partial<{
    name: string;
    path: string;
    includeSubfolders: boolean;
    isFixed: boolean;
  }>): void;
}

/**
 * 카드 세트 추상 클래스
 * 카드 세트 인터페이스를 구현하는 추상 클래스입니다.
 */
export abstract class CardSet implements ICardSet {
  id: string;
  name: string;
  type: CardSetType;
  mode: ModeType;
  path: string;
  includeSubfolders: boolean;
  isFixed: boolean;
  
  constructor(
    id: string,
    name: string,
    type: CardSetType,
    mode: ModeType,
    path: string,
    includeSubfolders: boolean = true,
    isFixed: boolean = false
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.mode = mode;
    this.path = path;
    this.includeSubfolders = includeSubfolders;
    this.isFixed = isFixed;
  }
  
  abstract getCards(): Promise<ICard[]>;
  
  update(options: Partial<{
    name: string;
    path: string;
    includeSubfolders: boolean;
    isFixed: boolean;
  }>): void {
    if (options.name !== undefined) {
      this.name = options.name;
    }
    
    if (options.path !== undefined) {
      this.path = options.path;
    }
    
    if (options.includeSubfolders !== undefined) {
      this.includeSubfolders = options.includeSubfolders;
    }
    
    if (options.isFixed !== undefined) {
      this.isFixed = options.isFixed;
    }
  }
} 