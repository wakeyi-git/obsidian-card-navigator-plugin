import { ICard } from '../domain/card/Card';
import { ICardRepository } from '../domain/card/CardRepository';
import { ICardFactory } from '../domain/card/CardFactory';
import { IObsidianAdapter } from './ObsidianAdapter';

/**
 * 카드 저장소 구현 클래스
 * Obsidian API를 사용하여 카드 데이터를 관리하는 클래스입니다.
 */
export class CardRepositoryImpl implements ICardRepository {
  private obsidianAdapter: IObsidianAdapter;
  private cardFactory: ICardFactory;
  private cardCache: Map<string, ICard>;
  
  constructor(obsidianAdapter: IObsidianAdapter, cardFactory: ICardFactory) {
    this.obsidianAdapter = obsidianAdapter;
    this.cardFactory = cardFactory;
    this.cardCache = new Map<string, ICard>();
  }
  
  async getAllCards(): Promise<ICard[]> {
    // 캐시된 카드가 있으면 반환
    if (this.cardCache.size > 0) {
      return Array.from(this.cardCache.values());
    }
    
    // 모든 마크다운 파일 가져오기
    const files = this.obsidianAdapter.getAllMarkdownFiles();
    const cards: ICard[] = [];
    
    // 각 파일을 카드로 변환
    for (const file of files) {
      const content = await this.obsidianAdapter.getFileContent(file);
      const frontmatter = this.obsidianAdapter.getFileFrontmatter(file);
      
      const card = this.cardFactory.createFromFile(file, content, frontmatter || undefined);
      
      // 카드 캐시에 추가
      this.cardCache.set(card.id, card);
      cards.push(card);
    }
    
    return cards;
  }
  
  async getCardById(id: string): Promise<ICard | null> {
    // 캐시에서 카드 찾기
    if (this.cardCache.has(id)) {
      return this.cardCache.get(id) || null;
    }
    
    // 파일 경로로 파일 찾기
    const file = this.obsidianAdapter.getFileByPath(id);
    if (!file) {
      return null;
    }
    
    // 파일 내용과 프론트매터 가져오기
    const content = await this.obsidianAdapter.getFileContent(file);
    const frontmatter = this.obsidianAdapter.getFileFrontmatter(file);
    
    // 카드 생성
    const card = this.cardFactory.createFromFile(file, content, frontmatter || undefined);
    
    // 카드 캐시에 추가
    this.cardCache.set(card.id, card);
    
    return card;
  }
  
  async getCardByPath(path: string): Promise<ICard | null> {
    return this.getCardById(path);
  }
  
  async getCardsByTag(tag: string): Promise<ICard[]> {
    // 태그를 가진 파일 가져오기
    const files = this.obsidianAdapter.getMarkdownFilesWithTag(tag);
    const cards: ICard[] = [];
    
    // 각 파일을 카드로 변환
    for (const file of files) {
      const card = await this.getCardByPath(file.path);
      if (card) {
        cards.push(card);
      }
    }
    
    return cards;
  }
  
  async getCardsByFolder(folder: string): Promise<ICard[]> {
    // 폴더 내 파일 가져오기
    const files = this.obsidianAdapter.getMarkdownFilesInFolder(folder);
    const cards: ICard[] = [];
    
    // 각 파일을 카드로 변환
    for (const file of files) {
      const card = await this.getCardByPath(file.path);
      if (card) {
        cards.push(card);
      }
    }
    
    return cards;
  }
  
  async addCard(card: ICard): Promise<ICard> {
    // 실제로는 새 파일 생성 필요
    // 여기서는 카드 캐시에만 추가
    this.cardCache.set(card.id, card);
    return card;
  }
  
  async updateCard(id: string, cardData: Partial<ICard>): Promise<ICard | null> {
    const card = await this.getCardById(id);
    if (!card) {
      return null;
    }
    
    // 카드 데이터 업데이트
    Object.assign(card, cardData);
    
    // 내용이 변경된 경우 파일 업데이트
    if (cardData.content !== undefined) {
      const file = this.obsidianAdapter.getFileByPath(id);
      if (file) {
        await this.obsidianAdapter.updateFileContent(file, cardData.content);
      }
    }
    
    // 카드 캐시 업데이트
    this.cardCache.set(id, card);
    
    return card;
  }
  
  async deleteCard(id: string): Promise<boolean> {
    // 실제로는 파일 삭제 필요
    // 여기서는 카드 캐시에서만 제거
    return this.cardCache.delete(id);
  }
  
  async refresh(): Promise<void> {
    // 카드 캐시 초기화
    this.cardCache.clear();
    
    // 모든 카드 다시 로드
    await this.getAllCards();
  }
  
  /**
   * 특정 링크를 가진 카드 가져오기
   * @param link 링크
   * @returns 링크를 가진 카드 목록
   */
  async getCardsByLink(link: string): Promise<ICard[]> {
    const allCards = await this.getAllCards();
    const cards: ICard[] = [];
    
    // 모든 파일에서 링크 확인
    for (const card of allCards) {
      const file = this.obsidianAdapter.getFileByPath(card.path);
      if (!file) continue;
      
      const links = this.obsidianAdapter.getFileLinks(file);
      
      // 링크가 있는 카드 추가
      if (links.some(l => l.link === link)) {
        cards.push(card);
      }
    }
    
    return cards;
  }
} 