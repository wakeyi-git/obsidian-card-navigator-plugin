import { App } from 'obsidian';
import { ICard } from '../domain/card/Card';
import { ICardFactory, CardFactory } from '../domain/card/CardFactory';
import { ICardRepository } from '../domain/card/CardRepository';

/**
 * 카드 서비스 인터페이스
 * 카드 관리를 위한 인터페이스입니다.
 */
export interface ICardService {
  /**
   * 모든 카드 가져오기
   * @returns 모든 카드 목록
   */
  getAllCards(): Promise<ICard[]>;
  
  /**
   * 현재 상태에 맞는 카드 가져오기
   * @returns 카드 목록
   */
  getCards(): Promise<ICard[]>;
  
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
   * 파일 경로 목록으로 카드 가져오기
   * @param paths 파일 경로 목록
   * @returns 카드 목록
   */
  getCardsByPaths(paths: string[]): Promise<ICard[]>;
  
  /**
   * 카드 저장소 초기화
   * 모든 카드를 다시 로드합니다.
   */
  refreshCards(): Promise<void>;
}

/**
 * 카드 서비스 클래스
 * 카드 관리를 위한 클래스입니다.
 */
export class CardService implements ICardService {
  private app: App;
  private cardFactory: ICardFactory;
  private cardRepository: ICardRepository;
  
  // 성능 모니터링을 위한 카운터 추가
  private cardFetchCount: number = 0;
  private cacheHitCount: number = 0;
  private cacheMissCount: number = 0;
  
  constructor(app: App, cardRepository: ICardRepository) {
    this.app = app;
    this.cardFactory = new CardFactory();
    this.cardRepository = cardRepository;
  }
  
  async getAllCards(): Promise<ICard[]> {
    try {
      // 성능 측정 코드 제거 - 실제 기능 코드만 유지
      const cards = await this.cardRepository.getAllCards();
      return cards;
    } catch (error) {
      console.error('[CardService] 모든 카드 가져오기 오류:', error);
      throw error;
    }
  }
  
  async getCards(): Promise<ICard[]> {
    return this.getAllCards();
  }
  
  async getCardById(id: string): Promise<ICard | null> {
    try {
      const card = await this.cardRepository.getCardById(id);
      if (card) {
        this.cacheHitCount++;
        // 로그 출력만 유지하고 타이머 제거
        console.log(`[성능] CardService 캐시 히트 횟수: ${this.cacheHitCount}`);
      } else {
        this.cacheMissCount++;
        console.log(`[성능] CardService 캐시 미스 횟수: ${this.cacheMissCount}`);
      }
      
      return card;
    } catch (error) {
      console.error(`[성능] CardService.getCardById(${id}) 오류:`, error);
      return null;
    }
  }
  
  async getCardByPath(path: string): Promise<ICard | null> {
    try {
      const card = await this.cardRepository.getCardByPath(path);
      return card;
    } catch (error) {
      console.error('[성능] CardService.getCardByPath 오류:', error);
      return null;
    }
  }
  
  async getCardsByTag(tag: string): Promise<ICard[]> {
    return this.cardRepository.getCardsByTag(tag);
  }
  
  async getCardsByFolder(folder: string): Promise<ICard[]> {
    return this.cardRepository.getCardsByFolder(folder);
  }
  
  async getCardsByPaths(paths: string[]): Promise<ICard[]> {
    const cards: ICard[] = [];
    
    for (const path of paths) {
      const card = await this.getCardByPath(path);
      if (card) {
        cards.push(card);
      }
    }
    
    return cards;
  }
  
  async refreshCards(): Promise<void> {
    try {
      await this.cardRepository.refresh();
      console.log('[성능] CardService 카드 저장소 리프레시 완료');
    } catch (error) {
      console.error('[성능] CardService.refreshCards 오류:', error);
    }
  }
  
  /**
   * 파일 내용 가져오기
   * @param path 파일 경로
   * @returns 파일 내용
   */
  async getFileContent(path: string): Promise<string> {
    try {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file && file.path === path) {
        return await this.app.vault.read(file as any);
      }
      return '';
    } catch (error) {
      console.error(`Error reading file ${path}:`, error);
      return '';
    }
  }
  
  /**
   * 파일 내용 업데이트
   * @param path 파일 경로
   * @param content 새 내용
   * @returns 성공 여부
   */
  async updateFileContent(path: string, content: string): Promise<boolean> {
    try {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file && file.path === path) {
        await this.app.vault.modify(file as any, content);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating file ${path}:`, error);
      return false;
    }
  }
} 