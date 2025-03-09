import { CardSetSourceType } from '../cardset/CardSet';
import { LayoutType } from '../layout/Layout';
import { SortType } from '../cardlist/CardListInterfaces';

/**
 * 프리셋 인터페이스
 * 사용자 정의 설정 프리셋을 정의합니다.
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
   * 카드셋 소스 타입
   */
  cardSetSourceType: CardSetSourceType;
  
  /**
   * 카드셋 소스
   */
  cardSetSource: string;
  
  /**
   * 레이아웃 타입
   */
  layoutType: LayoutType;
  
  /**
   * 정렬 타입
   */
  sortType: SortType;
  
  /**
   * 정렬 방향 (오름차순/내림차순)
   */
  sortDirection: 'asc' | 'desc';
  
  /**
   * 카드 표시 설정
   */
  cardDisplaySettings: any;
  
  /**
   * 레이아웃 설정
   */
  layoutSettings: any;
  
  /**
   * 생성일
   */
  createdAt: number;
  
  /**
   * 수정일
   */
  updatedAt: number;
} 