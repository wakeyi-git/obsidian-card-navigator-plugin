import { CachedMetadata, TFile } from 'obsidian';
import { Card, ICard } from '../../domain/card/Card';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { IObsidianService } from '../../infrastructure/obsidian/adapters/ObsidianInterfaces';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';

/**
 * 카드 생성 서비스 인터페이스
 * 카드 생성 관련 기능을 정의합니다.
 */
export interface ICardCreationService {
  /**
   * 파일로부터 카드를 생성합니다.
   * @param file 파일 객체
   * @returns 생성된 카드 객체
   */
  createCardFromFile(file: TFile): Promise<ICard>;
  
  /**
   * 카드 캐시를 초기화합니다.
   */
  clearCardCache(): void;
}

/**
 * 카드 생성 서비스
 * 카드 생성 관련 기능을 구현합니다.
 */
export class CardCreationService implements ICardCreationService {
  private obsidianService: IObsidianService;
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private cardCache: Map<string, ICard> = new Map();
  
  /**
   * 생성자
   * @param obsidianService Obsidian 서비스
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    obsidianService: IObsidianService,
    settingsService: ISettingsService,
    eventBus: DomainEventBus
  ) {
    this.obsidianService = obsidianService;
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 설정 변경 이벤트 리스너
    this.eventBus.on('settings-changed', () => {
      // 설정이 변경되면 카드 캐시 초기화
      this.clearCardCache();
    });
  }
  
  /**
   * 파일로부터 카드를 생성합니다.
   * @param file 파일 객체
   * @returns 생성된 카드 객체
   */
  async createCardFromFile(file: TFile): Promise<ICard> {
    try {
      // 파일이 유효한지 확인
      if (!file || !file.path) {
        console.error('유효하지 않은 파일 객체:', file);
        return this.createEmptyCard(file);
      }
      
      // 캐시에 카드가 있는지 확인
      const cacheKey = file.path;
      if (this.cardCache.has(cacheKey)) {
        return this.cardCache.get(cacheKey)!;
      }
      
      // 파일 내용과 메타데이터 가져오기
      const content = await this.obsidianService.readFile(file);
      const metadata = await this.obsidianService.getFileCache(file);
      
      // 카드 생성
      const card = this.createCard(file, content, metadata);
      
      // 카드 캐시에 저장
      this.cardCache.set(cacheKey, card);
      
      return card;
    } catch (error) {
      console.error(`카드 생성 중 오류 발생: ${file?.path}`, error);
      return this.createEmptyCard(file);
    }
  }
  
  /**
   * 빈 카드 객체 생성 (오류 발생 시 사용)
   * @param file 파일 객체
   * @returns 기본 카드 객체
   */
  private createEmptyCard(file: TFile): ICard {
    const emptyCard: ICard = {
      id: file?.path || '',
      path: file?.path || '',
      filename: file?.basename || '',
      file: file,
      title: file?.basename || '',
      content: '',
      tags: [],
      
      // 메서드 구현
      getId: function() { return this.id || ''; },
      getPath: function() { return this.path || ''; },
      getCreatedTime: function() { return this.created || 0; },
      getModifiedTime: function() { return this.modified || 0; }
    };
    
    // 카드 메서드 추가
    this.ensureCardMethods(emptyCard);
    
    return emptyCard;
  }
  
  /**
   * 카드 객체 생성
   * @param file 파일 객체
   * @param content 파일 내용
   * @param metadata 파일 메타데이터
   * @returns 생성된 카드 객체
   */
  private createCard(file: TFile, content: string, metadata: CachedMetadata): ICard {
    try {
      const settings = this.settingsService.getSettings();
      const includeFrontmatter = settings.includeFrontmatterInContent !== false;
      
      // 프론트매터 제거 여부에 따라 내용 처리
      const processedContent = includeFrontmatter ? content : this.removeFrontmatter(content);
      
      // 기본 카드 객체 생성
      const card: ICard = {
        id: file.path,
        path: file.path,
        filename: file.basename,
        file: file,
        title: file.basename,
        content: processedContent || '',
        tags: metadata?.tags?.map(tag => tag.tag) || [],
        frontmatter: metadata?.frontmatter,
        firstHeader: metadata?.headings?.[0]?.heading,
        metadata: metadata,
        created: file.stat?.ctime || 0,
        modified: file.stat?.mtime || 0,
        
        // 메서드 구현
        getId: function() { return this.id || ''; },
        getPath: function() { return this.path || ''; },
        getCreatedTime: function() { return this.created || 0; },
        getModifiedTime: function() { return this.modified || 0; }
      };
      
      // 카드 메서드 추가
      this.ensureCardMethods(card);
      
      return card;
    } catch (error) {
      console.error(`카드 객체 생성 중 오류 발생: ${file?.path}`, error);
      return this.createEmptyCard(file);
    }
  }
  
  /**
   * 프론트매터 제거
   * @param content 파일 내용
   * @returns 프론트매터가 제거된 내용
   */
  private removeFrontmatter(content: string): string {
    // 프론트매터 패터: --- 로 시작하고 --- 로 끝나는 부분
    const frontmatterPattern = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    return content.replace(frontmatterPattern, '');
  }
  
  /**
   * 카드 메서드 확인
   * 카드 객체에 필요한 메서드가 있는지 확인하고 없으면 추가합니다.
   * @param card 카드 객체
   */
  private ensureCardMethods(card: ICard): void {
    // 이미 메서드가 정의되어 있으면 추가하지 않음
    if (typeof card.getId !== 'function') {
      card.getId = function() { return this.id || ''; };
    }
    
    if (typeof card.getPath !== 'function') {
      card.getPath = function() { return this.path || ''; };
    }
    
    if (typeof card.getCreatedTime !== 'function') {
      card.getCreatedTime = function() { return this.created || 0; };
    }
    
    if (typeof card.getModifiedTime !== 'function') {
      card.getModifiedTime = function() { return this.modified || 0; };
    }
  }
  
  /**
   * 카드 캐시를 초기화합니다.
   */
  clearCardCache(): void {
    this.cardCache.clear();
  }
} 