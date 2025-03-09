import { ILayout } from '../layout/Layout';
import { ICardSetSource } from '../cardset/CardSet';
import { ISearch } from '../search/Search';
import { ISort } from '../sorting/Sort';

/**
 * 프리셋 인터페이스
 * 카드 네비게이터의 설정을 저장하고 불러오기 위한 인터페이스입니다.
 */
export interface IPreset {
  /**
   * 프리셋 ID
   */
  id: string;
  
  /**
   * 프리셋 이름
   */
  name: string;
  
  /**
   * 프리셋 설명
   */
  description?: string;
  
  /**
   * 모드
   */
  cardSetSource?: ICardSetSource;
  
  /**
   * 레이아웃
   */
  layout?: ILayout;
  
  /**
   * 정렬
   */
  sort?: ISort;
  
  /**
   * 검색
   */
  search?: ISearch;
  
  /**
   * 프리셋 복제
   * @returns 복제된 프리셋
   */
  clone(): IPreset;
  
  /**
   * 프리셋 직렬화
   * @returns 직렬화된 프리셋 데이터
   */
  serialize(): PresetData;
}

/**
 * 프리셋 데이터 인터페이스
 * 프리셋을 저장하기 위한 데이터 구조입니다.
 */
export interface PresetData {
  id: string;
  name: string;
  description?: string;
  cardSetSource?: {
    type: string;
    [key: string]: any;
  };
  layout?: {
    type: string;
    columnCount?: number;
    cardWidth?: number;
    cardHeight?: number;
    gap?: number;
    [key: string]: any;
  };
  sort?: {
    type: string;
    direction: string;
    frontmatterKey?: string;
    [key: string]: any;
  };
  search?: {
    type: string;
    query: string;
    caseSensitive: boolean;
    frontmatterKey?: string;
    [key: string]: any;
  };
}

/**
 * 프리셋 클래스
 * 카드 네비게이터의 설정을 저장하고 불러오기 위한 클래스입니다.
 */
export class Preset implements IPreset {
  id: string;
  name: string;
  description?: string;
  cardSetSource?: ICardSetSource;
  layout?: ILayout;
  sort?: ISort;
  search?: ISearch;
  
  constructor(
    id: string,
    name: string,
    description?: string,
    cardSetSource?: ICardSetSource,
    layout?: ILayout,
    sort?: ISort,
    search?: ISearch
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.cardSetSource = cardSetSource;
    this.layout = layout;
    this.sort = sort;
    this.search = search;
  }
  
  clone(): IPreset {
    return new Preset(
      this.id,
      this.name,
      this.description,
      this.cardSetSource,
      this.layout,
      this.sort,
      this.search
    );
  }
  
  serialize(): PresetData {
    const data: PresetData = {
      id: this.id,
      name: this.name
    };
    
    if (this.description) {
      data.description = this.description;
    }
    
    if (this.cardSetSource) {
      data.cardSetSource = {
        type: this.cardSetSource.type
      };
    }
    
    if (this.layout) {
      data.layout = {
        type: this.layout.type,
        columnCount: this.layout.columnCount,
        cardWidth: this.layout.cardWidth,
        cardHeight: this.layout.cardHeight,
        gap: this.layout.gap
      };
    }
    
    if (this.sort) {
      data.sort = {
        type: this.sort.type,
        direction: this.sort.direction
      };
      
      if (this.sort.frontmatterKey) {
        data.sort.frontmatterKey = this.sort.frontmatterKey;
      }
    }
    
    if (this.search) {
      data.search = {
        type: this.search.getType(),
        query: this.search.getQuery(),
        caseSensitive: this.search.isCaseSensitive()
      };
      
      const searchAny = this.search as any;
      if (searchAny.frontmatterKey) {
        data.search.frontmatterKey = searchAny.frontmatterKey;
      }
    }
    
    return data;
  }
} 