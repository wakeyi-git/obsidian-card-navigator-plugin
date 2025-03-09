import { App, TFile, CachedMetadata } from 'obsidian';
import { ICard, ICardDisplaySettings, CardContentType, CardRenderingMode } from '../domain/card/index';
import { ICardFactory, CardFactory } from '../domain/card/CardFactory';
import { ICardRepository } from '../domain/card/CardRepository';
import CardNavigatorPlugin from '../main';

/**
 * 카드 서비스 인터페이스
 * 카드 관련 기능을 제공합니다.
 */
export interface ICardService {
  /**
   * 파일로부터 카드 생성
   * @param file 파일 객체
   * @param displaySettings 표시 설정 (선택 사항)
   * @returns 생성된 카드
   */
  createCardFromFile(file: TFile, displaySettings?: ICardDisplaySettings): Promise<ICard>;
  
  /**
   * 파일 경로로부터 카드 생성
   * @param filePath 파일 경로
   * @param displaySettings 표시 설정 (선택 사항)
   * @returns 생성된 카드 또는 undefined (파일이 존재하지 않는 경우)
   */
  createCardFromPath(filePath: string, displaySettings?: ICardDisplaySettings): Promise<ICard | undefined>;
  
  /**
   * 여러 파일로부터 카드 생성
   * @param files 파일 객체 목록
   * @param displaySettings 표시 설정 (선택 사항)
   * @returns 생성된 카드 목록
   */
  createCardsFromFiles(files: TFile[], displaySettings?: ICardDisplaySettings): Promise<ICard[]>;
  
  /**
   * 여러 파일 경로로부터 카드 생성
   * @param filePaths 파일 경로 목록
   * @param displaySettings 표시 설정 (선택 사항)
   * @returns 생성된 카드 목록
   */
  createCardsFromPaths(filePaths: string[], displaySettings?: ICardDisplaySettings): Promise<ICard[]>;
  
  /**
   * 카드 내용 가져오기
   * @param card 카드
   * @param contentType 내용 타입
   * @returns 카드 내용
   */
  getCardContent(card: ICard, contentType: CardContentType): Promise<string>;
  
  /**
   * 카드 내용 렌더링
   * @param card 카드
   * @param content 내용
   * @param renderingMode 렌더링 모드
   * @returns 렌더링된 내용
   */
  renderCardContent(card: ICard, content: string, renderingMode: CardRenderingMode): Promise<string>;
  
  /**
   * 카드 표시 설정 업데이트
   * @param card 카드
   * @param displaySettings 표시 설정
   * @returns 업데이트된 카드
   */
  updateCardDisplaySettings(card: ICard, displaySettings: ICardDisplaySettings): ICard;
  
  /**
   * 카드 내용 업데이트
   * @param card 카드
   * @param content 새 내용
   * @returns 업데이트된 카드
   */
  updateCardContent(card: ICard, content: string): Promise<ICard>;
  
  /**
   * 카드 열기
   * @param card 카드
   * @param newLeaf 새 탭에서 열지 여부
   */
  openCard(card: ICard, newLeaf?: boolean): Promise<void>;
  
  /**
   * 카드 편집
   * @param card 카드
   */
  editCard(card: ICard): Promise<void>;
}

/**
 * 카드 클래스
 * ICard 인터페이스를 구현합니다.
 */
class Card implements ICard {
  file: TFile;
  title: string;
  content: string;
  tags: string[] = [];
  frontmatter?: Record<string, any>;
  firstHeader?: string;
  displaySettings?: ICardDisplaySettings;
  metadata?: CachedMetadata;
  
  constructor(
    file: TFile,
    content: string,
    tags: string[] = [],
    frontmatter?: Record<string, any>,
    firstHeader?: string,
    displaySettings?: ICardDisplaySettings,
    metadata?: CachedMetadata
  ) {
    this.file = file;
    this.title = file.basename;
    this.content = content;
    this.tags = tags;
    this.frontmatter = frontmatter;
    this.firstHeader = firstHeader;
    this.displaySettings = displaySettings;
    this.metadata = metadata;
  }
  
  getId(): string {
    return this.file.path;
  }
  
  getPath(): string {
    return this.file.path;
  }
  
  getCreatedTime(): number {
    return this.file.stat.ctime;
  }
  
  getModifiedTime(): number {
    return this.file.stat.mtime;
  }
}

/**
 * 카드 서비스 클래스
 * 카드 관련 기능을 제공합니다.
 */
export class CardService implements ICardService {
  private app: App;
  private cardFactory: ICardFactory;
  private cardRepository: ICardRepository;
  private defaultDisplaySettings: ICardDisplaySettings;
  
  // 성능 모니터링을 위한 카운터 추가
  private cardFetchCount = 0;
  private cacheHitCount = 0;
  private cacheMissCount = 0;
  
  constructor(app: App, cardRepository: ICardRepository, defaultDisplaySettings?: ICardDisplaySettings) {
    this.app = app;
    this.cardFactory = new CardFactory();
    this.cardRepository = cardRepository;
    this.defaultDisplaySettings = defaultDisplaySettings || {
      headerContent: 'filename',
      bodyContent: 'content',
      footerContent: 'tags',
      renderingMode: 'text'
    };
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
  
  /**
   * 파일로부터 카드 생성
   * @param file 파일 객체
   * @param displaySettings 표시 설정 (선택 사항)
   * @returns 생성된 카드
   */
  async createCardFromFile(file: TFile, displaySettings?: ICardDisplaySettings): Promise<ICard> {
    // 파일 내용 읽기
    const content = await this.app.vault.read(file);
    
    // 메타데이터 가져오기
    const metadata = this.app.metadataCache.getFileCache(file);
    
    // 태그 추출
    const tags: string[] = [];
    if (metadata?.tags) {
      metadata.tags.forEach(tag => {
        tags.push(tag.tag);
      });
    }
    
    // 프론트매터 추출
    const frontmatter = metadata?.frontmatter;
    
    // 첫 번째 헤더 추출
    let firstHeader: string | undefined;
    if (metadata?.headings && metadata.headings.length > 0) {
      firstHeader = metadata.headings[0].heading;
    }
    
    // 카드 생성
    return new Card(
      file,
      content,
      tags,
      frontmatter,
      firstHeader,
      displaySettings || this.defaultDisplaySettings,
      metadata
    );
  }
  
  /**
   * 파일 경로로부터 카드 생성
   * @param filePath 파일 경로
   * @param displaySettings 표시 설정 (선택 사항)
   * @returns 생성된 카드 또는 undefined (파일이 존재하지 않는 경우)
   */
  async createCardFromPath(filePath: string, displaySettings?: ICardDisplaySettings): Promise<ICard | undefined> {
    // 파일 가져오기
    const file = this.app.vault.getAbstractFileByPath(filePath);
    
    // 파일이 존재하지 않거나 TFile이 아닌 경우
    if (!file || !(file instanceof TFile)) {
      return undefined;
    }
    
    // 파일로부터 카드 생성
    return this.createCardFromFile(file, displaySettings);
  }
  
  /**
   * 여러 파일로부터 카드 생성
   * @param files 파일 객체 목록
   * @param displaySettings 표시 설정 (선택 사항)
   * @returns 생성된 카드 목록
   */
  async createCardsFromFiles(files: TFile[], displaySettings?: ICardDisplaySettings): Promise<ICard[]> {
    const cards: ICard[] = [];
    
    // 각 파일에 대해 카드 생성
    for (const file of files) {
      const card = await this.createCardFromFile(file, displaySettings);
      cards.push(card);
    }
    
    return cards;
  }
  
  /**
   * 여러 파일 경로로부터 카드 생성
   * @param filePaths 파일 경로 목록
   * @param displaySettings 표시 설정 (선택 사항)
   * @returns 생성된 카드 목록
   */
  async createCardsFromPaths(filePaths: string[], displaySettings?: ICardDisplaySettings): Promise<ICard[]> {
    const cards: ICard[] = [];
    
    // 각 파일 경로에 대해 카드 생성
    for (const filePath of filePaths) {
      const card = await this.createCardFromPath(filePath, displaySettings);
      if (card) {
        cards.push(card);
      }
    }
    
    return cards;
  }
  
  /**
   * 카드 내용 가져오기
   * @param card 카드
   * @param contentType 내용 타입
   * @returns 카드 내용
   */
  async getCardContent(card: ICard, contentType: CardContentType): Promise<string> {
    switch (contentType) {
      case 'filename':
        return card.title;
      case 'title':
        return card.title;
      case 'firstheader':
        return card.firstHeader || '';
      case 'content':
        return card.content;
      case 'tags':
        return card.tags.join(', ');
      case 'path':
        return card.getPath();
      case 'created':
        return new Date(card.getCreatedTime()).toLocaleString();
      case 'modified':
        return new Date(card.getModifiedTime()).toLocaleString();
      case 'frontmatter':
        return JSON.stringify(card.frontmatter || {});
      default:
        // frontmatter 값 가져오기
        if (card.frontmatter && card.frontmatter[contentType]) {
          return String(card.frontmatter[contentType]);
        }
        return '';
    }
  }
  
  /**
   * 카드 내용 렌더링
   * @param card 카드
   * @param content 내용
   * @param renderingMode 렌더링 모드
   * @returns 렌더링된 내용
   */
  async renderCardContent(card: ICard, content: string, renderingMode: CardRenderingMode): Promise<string> {
    if (renderingMode === 'text') {
      return content;
    } else if (renderingMode === 'html') {
      // 마크다운을 HTML로 변환
      const el = document.createElement('div');
      await this.app.renderMarkdown(content, el, card.getPath(), null);
      return el.innerHTML;
    }
    
    return content;
  }
  
  /**
   * 카드 표시 설정 업데이트
   * @param card 카드
   * @param displaySettings 표시 설정
   * @returns 업데이트된 카드
   */
  updateCardDisplaySettings(card: ICard, displaySettings: ICardDisplaySettings): ICard {
    // 새 카드 생성
    const updatedCard = new Card(
      card.file,
      card.content,
      card.tags,
      card.frontmatter,
      card.firstHeader,
      {
        ...card.displaySettings,
        ...displaySettings
      },
      card.metadata
    );
    
    return updatedCard;
  }
  
  /**
   * 카드 내용 업데이트
   * @param card 카드
   * @param content 새 내용
   * @returns 업데이트된 카드
   */
  async updateCardContent(card: ICard, content: string): Promise<ICard> {
    // 파일 내용 업데이트
    await this.app.vault.modify(card.file, content);
    
    // 메타데이터 다시 가져오기
    const metadata = this.app.metadataCache.getFileCache(card.file);
    
    // 태그 추출
    const tags: string[] = [];
    if (metadata?.tags) {
      metadata.tags.forEach(tag => {
        tags.push(tag.tag);
      });
    }
    
    // 프론트매터 추출
    const frontmatter = metadata?.frontmatter;
    
    // 첫 번째 헤더 추출
    let firstHeader: string | undefined;
    if (metadata?.headings && metadata.headings.length > 0) {
      firstHeader = metadata.headings[0].heading;
    }
    
    // 새 카드 생성
    return new Card(
      card.file,
      content,
      tags,
      frontmatter,
      firstHeader,
      card.displaySettings,
      metadata
    );
  }
  
  /**
   * 카드 열기
   * @param card 카드
   * @param newLeaf 새 탭에서 열지 여부
   */
  async openCard(card: ICard, newLeaf: boolean = false): Promise<void> {
    await this.app.workspace.getLeaf(newLeaf).openFile(card.file);
  }
  
  /**
   * 카드 편집
   * @param card 카드
   */
  async editCard(card: ICard): Promise<void> {
    // 파일 열기
    await this.openCard(card);
    
    // 편집 모드로 전환
    const activeView = this.app.workspace.getActiveViewOfType(this.app.workspace.getViewType('markdown'));
    if (activeView && activeView.editor) {
      activeView.setMode('source');
    }
  }
} 