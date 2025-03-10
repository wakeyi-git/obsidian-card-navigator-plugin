import { TFile } from 'obsidian';
import { CardSet, ICardSet } from '../../domain/cardset/CardSet';
import { ICardSetSelectionManager } from '../../domain/cardset/CardSetInterfaces';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { ObsidianService } from '../core/ObsidianService';

/**
 * 태그 카드셋 서비스 인터페이스
 */
export interface ITagCardSetService {
  /**
   * 카드셋 가져오기
   * @returns 태그 카드셋
   */
  getCardSet(): Promise<ICardSet>;
  
  /**
   * 현재 태그 가져오기
   * @returns 현재 태그 목록
   */
  getCurrentTags(): string[];
  
  /**
   * 태그 선택
   * @param tags 태그 목록
   * @param isFixed 고정 여부
   */
  selectTags(tags: string[], isFixed?: boolean): Promise<void>;
  
  /**
   * 태그 목록 가져오기
   * @returns 태그 목록
   */
  getAllTags(): string[];
  
  /**
   * 태그 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setTagCaseSensitive(caseSensitive: boolean): Promise<void>;
  
  /**
   * 태그 대소문자 구분 여부 가져오기
   * @returns 대소문자 구분 여부
   */
  getTagCaseSensitive(): boolean;
}

/**
 * 태그 카드셋 서비스
 * 태그 카드셋 관련 기능을 관리합니다.
 */
export class TagCardSetService implements ITagCardSetService, ICardSetSelectionManager {
  private obsidianService: ObsidianService;
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private currentTags: string[] = [];
  private isFixed: boolean = false;
  private caseSensitive: boolean = false;
  private allTags: string[] = [];
  
  /**
   * 생성자
   * @param obsidianService Obsidian 서비스
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    obsidianService: ObsidianService,
    settingsService: ISettingsService,
    eventBus: DomainEventBus
  ) {
    this.obsidianService = obsidianService;
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    
    // 설정에서 초기값 가져오기
    const settings = this.settingsService.getSettings();
    this.caseSensitive = settings.tagCaseSensitive || false;
    this.isFixed = settings.isCardSetFixed;
    
    // 고정된 태그가 있는 경우
    if (this.isFixed && settings.defaultTagCardSet) {
      this.currentTags = settings.defaultTagCardSet.split(',').map(tag => tag.trim());
    } else if (settings.lastTagCardSet) {
      this.currentTags = settings.lastTagCardSet.split(',').map(tag => tag.trim());
      this.isFixed = settings.lastTagCardSetFixed || false;
    }
    
    // 태그 목록 초기화
    this.initTags();
  }
  
  /**
   * 카드셋 가져오기
   * @returns 태그 카드셋
   */
  async getCardSet(): Promise<ICardSet> {
    // 현재 태그 결정
    const tags = this.getCurrentTags();
    
    // 파일 목록 가져오기
    const files = this.getFilesWithTags(tags);
    
    // 카드셋 생성
    return new CardSet(
      'tag',
      tags.join(', '),
      files,
      tags
    );
  }
  
  /**
   * 현재 태그 가져오기
   * @returns 현재 태그 목록
   */
  getCurrentTags(): string[] {
    // 고정된 태그가 있는 경우
    if (this.isFixed && this.currentTags.length > 0) {
      return this.currentTags;
    }
    
    // 활성 파일의 태그 가져오기
    const activeFile = this.obsidianService.getActiveFile();
    if (activeFile) {
      const tags = this.getTagsFromFile(activeFile);
      if (tags.length > 0) {
        return tags;
      }
    }
    
    // 기본값 반환
    return this.currentTags;
  }
  
  /**
   * 태그 선택
   * @param tags 태그 목록
   * @param isFixed 고정 여부
   */
  async selectTags(tags: string[], isFixed: boolean = false): Promise<void> {
    this.currentTags = tags;
    this.isFixed = isFixed;
    
    // 설정 업데이트
    const tagsString = tags.join(', ');
    await this.settingsService.updateSettings({
      lastTagCardSet: tagsString,
      lastTagCardSetFixed: isFixed
    });
    
    if (isFixed) {
      await this.settingsService.updateSettings({
        defaultTagCardSet: tagsString,
        isCardSetFixed: true
      });
    }
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARDSET_CHANGED, {
      cardSet: tagsString,
      sourceType: 'tag',
      isFixed
    });
  }
  
  /**
   * 태그 목록 가져오기
   * @returns 태그 목록
   */
  getAllTags(): string[] {
    return this.allTags;
  }
  
  /**
   * 태그 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  async setTagCaseSensitive(caseSensitive: boolean): Promise<void> {
    this.caseSensitive = caseSensitive;
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      tagCaseSensitive: caseSensitive
    });
    
    // 태그 목록 초기화
    this.initTags();
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARDSET_CHANGED, {
      cardSet: this.currentTags.join(', '),
      sourceType: 'tag',
      isFixed: this.isFixed
    });
  }
  
  /**
   * 태그 대소문자 구분 여부 가져오기
   * @returns 대소문자 구분 여부
   */
  getTagCaseSensitive(): boolean {
    return this.caseSensitive;
  }
  
  /**
   * 현재 선택된 카드셋 가져오기
   * @returns 현재 선택된 카드셋
   */
  getCurrentCardSet(): string | null {
    const tags = this.getCurrentTags();
    return tags.length > 0 ? tags.join(', ') : null;
  }
  
  /**
   * 카드셋 고정 여부 가져오기
   * @returns 카드셋 고정 여부
   */
  isCardSetFixed(): boolean {
    return this.isFixed;
  }
  
  /**
   * 카드셋 목록 가져오기
   * @returns 카드셋 목록
   */
  async getCardSets(): Promise<string[]> {
    return this.allTags;
  }
  
  /**
   * 태그 목록 초기화
   */
  private initTags(): void {
    const metadataCache = this.obsidianService.getMetadataCache();
    const tags = new Set<string>();
    
    // 모든 파일의 태그 수집
    this.obsidianService.getMarkdownFiles().forEach(file => {
      const fileCache = metadataCache.getFileCache(file);
      if (fileCache && fileCache.tags) {
        fileCache.tags.forEach(tag => {
          tags.add(tag.tag);
        });
      }
    });
    
    this.allTags = Array.from(tags);
  }
  
  /**
   * 파일에서 태그 가져오기
   * @param file 파일
   * @returns 태그 목록
   */
  private getTagsFromFile(file: TFile): string[] {
    const cache = this.obsidianService.getMetadataCache().getFileCache(file);
    if (!cache || !cache.tags) return [];
    
    return cache.tags.map(tag => tag.tag);
  }
  
  /**
   * 태그가 있는 파일 가져오기
   * @param tags 태그 목록
   * @returns 파일 목록
   */
  private getFilesWithTags(tags: string[]): TFile[] {
    if (tags.length === 0) return [];
    
    const metadataCache = this.obsidianService.getMetadataCache();
    const files = this.obsidianService.getMarkdownFiles();
    
    return files.filter(file => {
      const fileCache = metadataCache.getFileCache(file);
      if (!fileCache || !fileCache.tags) return false;
      
      const fileTags = fileCache.tags.map(tag => tag.tag);
      
      // 대소문자 구분 여부에 따라 다른 처리
      if (this.caseSensitive) {
        return tags.some(tag => fileTags.includes(tag));
      } else {
        const lowerFileTags = fileTags.map(tag => tag.toLowerCase());
        return tags.some(tag => lowerFileTags.includes(tag.toLowerCase()));
      }
    });
  }
} 