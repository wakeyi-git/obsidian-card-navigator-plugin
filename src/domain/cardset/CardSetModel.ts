import { ICardSet, CardSetSourceType, CardSetType } from './CardSet';
import { TFile } from 'obsidian';

/**
 * 카드셋 클래스
 * 카드셋 모델을 정의합니다.
 */
export class CardSet implements ICardSet {
  /**
   * 카드셋 고유 식별자
   */
  id: string;
  
  /**
   * 카드셋 이름 (UI에 표시될 이름)
   */
  name: string;
  
  /**
   * 카드셋 소스 타입 (폴더, 태그, 검색)
   */
  sourceType: CardSetSourceType;
  
  /**
   * 카드셋 소스 (폴더 경로, 태그 이름, 검색 쿼리 등)
   */
  source: string;
  
  /**
   * 카드셋 타입 (활성, 고정)
   */
  type: CardSetType;
  
  /**
   * 파일 목록
   */
  files: TFile[];
  
  /**
   * 추가 메타데이터 (선택 사항)
   */
  metadata?: Record<string, any>;
  
  /**
   * 생성자
   * @param data 카드셋 데이터
   */
  constructor(data: {
    id: string;
    name: string;
    sourceType: CardSetSourceType;
    source: string;
    type: CardSetType;
    files: TFile[];
    metadata?: Record<string, any>;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.sourceType = data.sourceType;
    this.source = data.source;
    this.type = data.type;
    this.files = data.files;
    this.metadata = data.metadata;
  }
} 