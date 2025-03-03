import { ICard } from './Card';

/**
 * 카드 저장소 인터페이스
 * 카드 데이터를 관리하기 위한 인터페이스입니다.
 */
export interface ICardRepository {
  /**
   * 모든 카드 가져오기
   * @returns 모든 카드 목록
   */
  getAllCards(): Promise<ICard[]>;
  
  /**
   * 특정 ID의 카드 가져오기
   * @param id 카드 ID
   * @returns 카드 객체 또는 null
   */
  getCardById(id: string): Promise<ICard | null>;
  
  /**
   * 특정 경로의 카드 가져오기
   * @param path 카드 경로
   * @returns 카드 객체 또는 null
   */
  getCardByPath(path: string): Promise<ICard | null>;
  
  /**
   * 특정 태그를 가진 카드 가져오기
   * @param tag 태그
   * @returns 태그를 가진 카드 목록
   */
  getCardsByTag(tag: string): Promise<ICard[]>;
  
  /**
   * 특정 폴더의 카드 가져오기
   * @param folder 폴더 경로
   * @returns 폴더 내 카드 목록
   */
  getCardsByFolder(folder: string): Promise<ICard[]>;
  
  /**
   * 카드 추가
   * @param card 추가할 카드
   * @returns 추가된 카드
   */
  addCard(card: ICard): Promise<ICard>;
  
  /**
   * 카드 업데이트
   * @param id 업데이트할 카드 ID
   * @param card 업데이트할 카드 데이터
   * @returns 업데이트된 카드
   */
  updateCard(id: string, card: Partial<ICard>): Promise<ICard | null>;
  
  /**
   * 카드 삭제
   * @param id 삭제할 카드 ID
   * @returns 삭제 성공 여부
   */
  deleteCard(id: string): Promise<boolean>;
  
  /**
   * 카드 저장소 초기화
   * 모든 카드를 다시 로드합니다.
   */
  refresh(): Promise<void>;
} 