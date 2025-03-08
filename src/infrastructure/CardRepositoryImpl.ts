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
  
  // 성능 모니터링을 위한 카운터 추가
  private cacheSize = 0;
  private cacheHitCount = 0;
  private cacheMissCount = 0;
  private refreshCount = 0;
  
  constructor(obsidianAdapter: IObsidianAdapter, cardFactory: ICardFactory) {
    this.obsidianAdapter = obsidianAdapter;
    this.cardFactory = cardFactory;
    this.cardCache = new Map<string, ICard>();
  }
  
  async getAllCards(): Promise<ICard[]> {
    const timerLabel = `[성능] CardRepositoryImpl.getAllCards 실행 시간-${Date.now()}`;
    console.time(timerLabel);
    
    try {
      // 모든 마크다운 파일 가져오기
      const files = this.obsidianAdapter.getAllMarkdownFiles();
      console.log(`[성능] 전체 마크다운 파일 수: ${files.length}`);
      
      const cards: ICard[] = [];
      let cacheHits = 0;
      let cacheMisses = 0;
      
      // 각 파일에 대해 카드 생성
      for (const file of files) {
        const path = file.path;
        
        // 캐시에서 카드 확인
        if (this.cardCache.has(path)) {
          cards.push(this.cardCache.get(path)!);
          cacheHits++;
          continue;
        }
        
        // 캐시에 없으면 새로 생성
        try {
          const content = await this.obsidianAdapter.getFileContent(file);
          const frontmatter = this.obsidianAdapter.getFileFrontmatter(file);
          
          // 메타데이터에서 태그 추출
          const cache = this.obsidianAdapter.getMetadataCache().getFileCache(file);
          
          // 인라인 태그 추출
          const inlineTags = cache?.tags?.map(tag => tag.tag) || [];
          
          // 프론트매터 태그 추출
          const frontmatterTags: string[] = [];
          if (frontmatter && frontmatter.tags) {
            const fmTags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags];
            for (const tag of fmTags) {
              const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
              frontmatterTags.push(normalizedTag);
            }
          }
          
          // 단수형 태그도 처리
          if (frontmatter && frontmatter.tag) {
            const fmTags = Array.isArray(frontmatter.tag) ? frontmatter.tag : [frontmatter.tag];
            for (const tag of fmTags) {
              const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
              frontmatterTags.push(normalizedTag);
            }
          }
          
          // 모든 태그 합치기 (중복 제거)
          const allTags = [...new Set([...inlineTags, ...frontmatterTags])];
          
          if (frontmatterTags.length > 0) {
            console.log(`[CardRepositoryImpl] 파일 ${file.path}의 프론트매터 태그: ${frontmatterTags.join(', ')}`);
          }
          
          // 카드 생성
          const card = this.cardFactory.createCard(
            file.path,
            file.basename,
            content,
            allTags,
            file.path,
            file.stat.ctime,
            file.stat.mtime,
            frontmatter || {}
          );
          
          // 캐시에 저장
          this.cardCache.set(path, card);
          cards.push(card);
          cacheMisses++;
        } catch (error) {
          console.error(`[성능] 파일 처리 오류 (${path}):`, error);
        }
      }
      
      this.cacheHitCount += cacheHits;
      this.cacheMissCount += cacheMisses;
      this.cacheSize = this.cardCache.size;
      
      console.log(`[성능] 카드 캐시 상태: 크기=${this.cacheSize}, 히트=${cacheHits}, 미스=${cacheMisses}`);
      console.log(`[성능] 카드 캐시 누적: 히트=${this.cacheHitCount}, 미스=${this.cacheMissCount}`);
      console.timeEnd(timerLabel);
      
      return cards;
    } catch (error) {
      console.error('[성능] CardRepositoryImpl.getAllCards 오류:', error);
      console.timeEnd(timerLabel);
      return [];
    }
  }
  
  async getCardById(id: string): Promise<ICard | null> {
    const timerLabel = `[성능] CardRepositoryImpl.getCardById(${id}) 실행 시간-${Date.now()}`;
    console.time(timerLabel);
    
    try {
      // 모든 카드 가져오기
      const cards = await this.getAllCards();
      
      // ID로 카드 찾기
      const card = cards.find(card => card.id === id) || null;
      
      console.timeEnd(timerLabel);
      return card;
    } catch (error) {
      console.error(`[성능] CardRepositoryImpl.getCardById(${id}) 오류:`, error);
      console.timeEnd(timerLabel);
      return null;
    }
  }
  
  async getCardByPath(path: string): Promise<ICard | null> {
    const timerLabel = `[성능] CardRepositoryImpl.getCardByPath(${path}) 실행 시간-${Date.now()}`;
    console.time(timerLabel);
    
    try {
      // 캐시에서 확인
      if (this.cardCache.has(path)) {
        this.cacheHitCount++;
        console.log(`[성능] 경로 캐시 히트: ${path}`);
        console.timeEnd(timerLabel);
        return this.cardCache.get(path)!;
      }
      
      // 캐시에 없으면 파일 가져오기
      this.cacheMissCount++;
      console.log(`[성능] 경로 캐시 미스: ${path}`);
      
      const file = this.obsidianAdapter.getFileByPath(path);
      if (!file) {
        console.timeEnd(timerLabel);
        return null;
      }
      
      // 카드 생성
      const content = await this.obsidianAdapter.getFileContent(file);
      const frontmatter = this.obsidianAdapter.getFileFrontmatter(file);
      
      // 메타데이터에서 태그 추출
      const cache = this.obsidianAdapter.getMetadataCache().getFileCache(file);
      
      // 인라인 태그 추출
      const inlineTags = cache?.tags?.map(tag => tag.tag) || [];
      
      // 프론트매터 태그 추출
      const frontmatterTags: string[] = [];
      if (frontmatter && frontmatter.tags) {
        const fmTags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags];
        for (const tag of fmTags) {
          const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
          frontmatterTags.push(normalizedTag);
        }
      }
      
      // 단수형 태그도 처리
      if (frontmatter && frontmatter.tag) {
        const fmTags = Array.isArray(frontmatter.tag) ? frontmatter.tag : [frontmatter.tag];
        for (const tag of fmTags) {
          const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
          frontmatterTags.push(normalizedTag);
        }
      }
      
      // 모든 태그 합치기 (중복 제거)
      const allTags = [...new Set([...inlineTags, ...frontmatterTags])];
      
      if (frontmatterTags.length > 0) {
        console.log(`[CardRepositoryImpl] 파일 ${file.path}의 프론트매터 태그: ${frontmatterTags.join(', ')}`);
      }
      
      // 카드 생성
      const card = this.cardFactory.createCard(
        file.path,
        file.basename,
        content,
        allTags,
        file.path,
        file.stat.ctime,
        file.stat.mtime,
        frontmatter || {}
      );
      
      // 캐시에 저장
      this.cardCache.set(path, card);
      this.cacheSize = this.cardCache.size;
      
      console.timeEnd(timerLabel);
      return card;
    } catch (error) {
      console.error(`[성능] CardRepositoryImpl.getCardByPath(${path}) 오류:`, error);
      console.timeEnd(timerLabel);
      return null;
    }
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
    console.log(`[CardRepositoryImpl] 폴더별 카드 가져오기 시작, 폴더: ${folder}`);
    
    // 폴더 내 파일 가져오기
    const files = this.obsidianAdapter.getMarkdownFilesInFolder(folder);
    console.log(`[CardRepositoryImpl] 폴더 내 파일 수: ${files.length}`);
    
    const cards: ICard[] = [];
    
    // 각 파일을 카드로 변환
    for (const file of files) {
      const card = await this.getCardByPath(file.path);
      if (card) {
        cards.push(card);
      }
    }
    
    console.log(`[CardRepositoryImpl] 폴더별 카드 가져오기 완료, 카드 수: ${cards.length}`);
    
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
    const timerLabel = `[성능] CardRepositoryImpl.refresh 실행 시간-${Date.now()}`;
    console.time(timerLabel);
    this.refreshCount++;
    
    try {
      // 캐시 초기화
      const oldCacheSize = this.cardCache.size;
      this.cardCache.clear();
      
      console.log(`[성능] 카드 캐시 초기화: ${oldCacheSize} -> 0`);
      console.log(`[성능] 리프레시 횟수: ${this.refreshCount}`);
      
      // 모든 카드 다시 로드
      await this.getAllCards();
      
      console.timeEnd(timerLabel);
    } catch (error) {
      console.error('[성능] CardRepositoryImpl.refresh 오류:', error);
      console.timeEnd(timerLabel);
    }
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