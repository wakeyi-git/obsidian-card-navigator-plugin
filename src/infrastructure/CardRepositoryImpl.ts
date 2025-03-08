import { ICard } from '../domain/card/Card';
import { ICardRepository } from '../domain/card/CardRepository';
import { ICardFactory } from '../domain/card/CardFactory';
import { IObsidianAdapter } from './ObsidianAdapter';
import { TFile } from 'obsidian';
import { TimerUtil } from './TimerUtil';

/**
 * 카드 저장소 구현 클래스
 * Obsidian API를 사용하여 카드 데이터를 관리하는 클래스입니다.
 */
export class CardRepositoryImpl implements ICardRepository {
  private obsidianAdapter: IObsidianAdapter;
  private cardFactory: ICardFactory;
  
  // 파일 내용 캐시
  private fileContentCache: Map<string, { content: string, timestamp: number }> = new Map();
  // 카드 캐시
  private cardCache: Map<string, { card: ICard, timestamp: number }> = new Map();
  
  // 캐시 유효 시간 (밀리초)
  private readonly CACHE_TTL = 30000; // 30초
  
  // 성능 모니터링을 위한 카운터
  private fileAccessCount = 0;
  private cacheHitCount = 0;
  private cacheMissCount = 0;
  
  constructor(obsidianAdapter: IObsidianAdapter, cardFactory: ICardFactory) {
    this.obsidianAdapter = obsidianAdapter;
    this.cardFactory = cardFactory;
  }
  
  async getAllCards(): Promise<ICard[]> {
    const timerId = TimerUtil.startTimer('[성능] getAllCards 실행 시간');
    
    try {
      // 마크다운 파일 목록 가져오기
      const files = this.obsidianAdapter.getAllMarkdownFiles();
      console.log(`[성능] 마크다운 파일 접근 횟수: ${this.fileAccessCount}, 파일 수: ${files.length}`);
      
      // 카드 생성
      const cards: ICard[] = [];
      
      for (const file of files) {
        try {
          const card = await this.getCardByPath(file.path);
          cards.push(card);
        } catch (error) {
          console.error(`[CardRepositoryImpl] 파일 ${file.path}에서 카드 생성 중 오류 발생:`, error);
        }
      }
      
      // 캐시 통계 출력
      console.log(`[성능] 캐시 적중률: ${this.cacheHitCount}/${this.cacheHitCount + this.cacheMissCount} (${Math.round(this.cacheHitCount / (this.cacheHitCount + this.cacheMissCount || 1) * 100)}%)`);
      
      return cards;
    } catch (error) {
      console.error('[CardRepositoryImpl] 모든 카드 가져오기 오류:', error);
      return [];
    } finally {
      TimerUtil.endTimer(timerId);
    }
  }
  
  async getCardById(id: string): Promise<ICard | null> {
    const timerLabel = `[성능] CardRepositoryImpl.getCardById(${id}) 실행 시간-${Date.now()}`;
    console.time(timerLabel);
    
    try {
      // ID가 경로인 경우 직접 카드 가져오기
      try {
        const card = await this.getCardByPath(id);
        console.timeEnd(timerLabel);
        return card;
      } catch (error) {
        // 경로로 찾을 수 없는 경우 모든 카드에서 검색
        const cards = await this.getAllCards();
        const card = cards.find(card => card.id === id) || null;
        console.timeEnd(timerLabel);
        return card;
      }
    } catch (error) {
      console.error(`[성능] CardRepositoryImpl.getCardById(${id}) 오류:`, error);
      console.timeEnd(timerLabel);
      return null;
    }
  }
  
  async getCardByPath(path: string): Promise<ICard> {
    // 캐시에서 카드 확인
    const cachedCard = this.cardCache.get(path);
    const now = Date.now();
    
    // 캐시된 카드가 있고 유효 기간 내인 경우
    if (cachedCard && now - cachedCard.timestamp < this.CACHE_TTL) {
      this.cacheHitCount++;
      return cachedCard.card;
    }
    
    this.cacheMissCount++;
    
    // 파일 객체 가져오기
    const file = this.obsidianAdapter.getFileByPath(path);
    if (!file) {
      throw new Error(`파일을 찾을 수 없습니다: ${path}`);
    }
    
    // 파일 내용 가져오기 (캐시 사용)
    const content = await this.getFileContent(file);
    
    // 프론트매터 가져오기
    const frontmatter = this.obsidianAdapter.getFileFrontmatter(file);
    
    // 파일 이름에서 제목 추출
    const title = file.basename;
    
    // 메타데이터 캐시에서 태그 추출
    const cache = this.obsidianAdapter.getMetadataCache().getFileCache(file);
    let tags: string[] = [];
    
    // 인라인 태그 추출
    if (cache?.tags) {
      tags = cache.tags.map(tag => tag.tag);
    }
    
    // 프론트매터 태그 추출
    if (cache?.frontmatter && cache.frontmatter.tags) {
      let frontmatterTags: string[] = [];
      
      // 문자열인 경우 쉼표로 구분된 목록일 수 있음
      if (typeof cache.frontmatter.tags === 'string') {
        frontmatterTags = cache.frontmatter.tags.split(',').map(t => t.trim());
      } 
      // 배열인 경우
      else if (Array.isArray(cache.frontmatter.tags)) {
        frontmatterTags = cache.frontmatter.tags;
      }
      // 단일 값인 경우
      else {
        frontmatterTags = [String(cache.frontmatter.tags)];
      }
      
      // 프론트매터 태그 정규화 및 추가
      for (const tag of frontmatterTags) {
        const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
        if (!tags.includes(normalizedTag)) {
          tags.push(normalizedTag);
          console.log(`[CardRepositoryImpl] 파일 ${file.path}에서 프론트매터 태그 추가: ${normalizedTag}`);
        }
      }
    }
    
    // 단수형 tag 속성도 처리
    if (cache?.frontmatter && cache.frontmatter.tag) {
      let frontmatterTags: string[] = [];
      
      // 문자열인 경우 쉼표로 구분된 목록일 수 있음
      if (typeof cache.frontmatter.tag === 'string') {
        frontmatterTags = cache.frontmatter.tag.split(',').map(t => t.trim());
      } 
      // 배열인 경우
      else if (Array.isArray(cache.frontmatter.tag)) {
        frontmatterTags = cache.frontmatter.tag;
      }
      // 단일 값인 경우
      else {
        frontmatterTags = [String(cache.frontmatter.tag)];
      }
      
      // 프론트매터 태그 정규화 및 추가
      for (const tag of frontmatterTags) {
        const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
        if (!tags.includes(normalizedTag)) {
          tags.push(normalizedTag);
          console.log(`[CardRepositoryImpl] 파일 ${file.path}에서 프론트매터 tag 추가: ${normalizedTag}`);
        }
      }
    }
    
    // 카드 생성
    const card = this.cardFactory.createCard(
      path,
      title,
      content,
      tags,
      path,
      file.stat.ctime,
      file.stat.mtime,
      frontmatter || {}
    );
    
    // 카드 캐시에 저장
    this.cardCache.set(path, { card, timestamp: now });
    
    return card;
  }
  
  private async getFileContent(file: TFile): Promise<string> {
    // 캐시에서 파일 내용 확인
    const cachedContent = this.fileContentCache.get(file.path);
    const now = Date.now();
    
    // 캐시된 내용이 있고 유효 기간 내인 경우
    if (cachedContent && now - cachedContent.timestamp < this.CACHE_TTL) {
      return cachedContent.content;
    }
    
    // 파일 내용 가져오기
    this.fileAccessCount++;
    const content = await this.obsidianAdapter.getFileContent(file);
    
    // 파일 내용 캐시에 저장
    this.fileContentCache.set(file.path, { content, timestamp: now });
    
    return content;
  }
  
  async getCardsByTag(tag: string): Promise<ICard[]> {
    // 태그를 가진 파일 가져오기
    const files = this.obsidianAdapter.getMarkdownFilesWithTag(tag);
    const cards: ICard[] = [];
    
    // 각 파일을 카드로 변환
    for (const file of files) {
      try {
        const card = await this.getCardByPath(file.path);
        cards.push(card);
      } catch (error) {
        console.error(`[CardRepositoryImpl] 태그 ${tag}를 가진 파일 ${file.path}에서 카드 생성 중 오류 발생:`, error);
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
      try {
        const card = await this.getCardByPath(file.path);
        cards.push(card);
      } catch (error) {
        console.error(`[CardRepositoryImpl] 폴더 ${folder}의 파일 ${file.path}에서 카드 생성 중 오류 발생:`, error);
      }
    }
    
    console.log(`[CardRepositoryImpl] 폴더별 카드 가져오기 완료, 카드 수: ${cards.length}`);
    
    return cards;
  }
  
  async addCard(card: ICard): Promise<ICard> {
    // 실제로는 새 파일 생성 필요
    // 여기서는 카드 캐시에만 추가
    this.cardCache.set(card.id, { card, timestamp: Date.now() });
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
    this.cardCache.set(id, { card, timestamp: Date.now() });
    
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
    this.cacheHitCount = 0;
    this.cacheMissCount = 0;
    
    try {
      // 캐시 초기화
      this.fileContentCache.clear();
      this.cardCache.clear();
      
      console.log('[CardRepositoryImpl] 캐시 초기화 완료');
      
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