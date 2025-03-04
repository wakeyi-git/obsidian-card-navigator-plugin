import { ICard } from '../card/Card';
import { CardSet, CardSetType } from './CardSet';
import { ICardRepository } from '../card/CardRepository';

/**
 * 폴더 카드 세트 클래스
 * 폴더 기반 카드 세트를 구현합니다.
 */
export class FolderCardSet extends CardSet {
  private cardRepository: ICardRepository;
  
  constructor(
    id: string,
    name: string,
    path: string,
    cardRepository: ICardRepository,
    includeSubfolders: boolean = true,
    isFixed: boolean = false
  ) {
    super(id, name, 'folder', 'folder', path, includeSubfolders, isFixed);
    this.cardRepository = cardRepository;
  }
  
  /**
   * 카드 목록 가져오기
   * 현재 폴더 경로에 해당하는 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  async getCards(): Promise<ICard[]> {
    console.log(`[FolderCardSet] 폴더 '${this.path}'의 카드 가져오기 시작`);
    
    try {
      // 폴더 경로에 해당하는 카드 가져오기
      const cards = await this.cardRepository.getCardsByFolder(this.path);
      console.log(`[FolderCardSet] 폴더 '${this.path}'의 카드 ${cards.length}개 가져오기 완료`);
      
      return cards;
    } catch (error) {
      console.error(`[FolderCardSet] 폴더 '${this.path}'의 카드 가져오기 오류:`, error);
      return [];
    }
  }
} 