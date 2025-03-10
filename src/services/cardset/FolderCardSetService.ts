import { TFile } from 'obsidian';
import { CardSetType, ICardSet, ICardSetSource, ICardSetState } from '../../domain/cardset/CardSet';
import { ICardSetSelectionManager } from '../../domain/cardset/CardSetInterfaces';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { ObsidianService } from '../core/ObsidianService';
import { CardSet } from '../../domain/cardset/CardSetModel';

/**
 * 폴더 카드셋 서비스 인터페이스
 */
export interface IFolderCardSetService {
  /**
   * 카드셋 가져오기
   * @returns 폴더 카드셋
   */
  getCardSet(): Promise<ICardSet>;
  
  /**
   * 현재 폴더 가져오기
   * @returns 현재 폴더 경로
   */
  getCurrentFolder(): string;
  
  /**
   * 폴더 선택
   * @param folderPath 폴더 경로
   * @param isFixed 고정 여부
   */
  selectFolder(folderPath: string, isFixed?: boolean): Promise<void>;
  
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  setIncludeSubfolders(include: boolean): Promise<void>;
  
  /**
   * 하위 폴더 포함 여부 가져오기
   * @returns 하위 폴더 포함 여부
   */
  getIncludeSubfolders(): boolean;
  
  /**
   * 폴더 목록 가져오기
   * @returns 폴더 목록
   */
  getFolders(): string[];
}

/**
 * 폴더 카드셋 서비스
 * 폴더 카드셋 관련 기능을 관리합니다.
 */
export class FolderCardSetService implements IFolderCardSetService, ICardSetSelectionManager, ICardSetSource {
  private obsidianService: ObsidianService;
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private currentFolder = '';
  private isFixed = false;
  private includeSubfolders = true;
  private folders: string[] = [];
  public currentCardSet: string | null = null;
  
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
    this.includeSubfolders = settings.includeSubfolders;
    this.isFixed = settings.isCardSetFixed;
    
    // 고정된 폴더가 있는 경우
    if (this.isFixed && settings.defaultFolderCardSet) {
      this.currentFolder = settings.defaultFolderCardSet;
    } else if (settings.lastFolderCardSet) {
      this.currentFolder = settings.lastFolderCardSet;
      this.isFixed = settings.lastFolderCardSetFixed || false;
    } else {
      // 활성 파일의 폴더 가져오기
      const activeFile = this.obsidianService.getActiveFile();
      if (activeFile && activeFile.parent) {
        this.currentFolder = activeFile.parent.path;
      }
    }
    
    // 폴더 목록 초기화
    this.initFolders();
  }
  
  /**
   * 카드셋 가져오기
   * @returns 폴더 카드셋
   */
  async getCardSet(): Promise<ICardSet> {
    // 현재 폴더에 있는 파일 가져오기
    const files = this.getFilesInFolder(this.currentFolder, this.includeSubfolders);
    
    // 카드셋 생성
    return new CardSet({
      id: `folder:${this.currentFolder}`,
      name: this.currentFolder || '루트',
      sourceType: 'folder',
      source: this.currentFolder,
      type: this.isFixed ? 'fixed' : 'active',
      files: files,
      metadata: {
        includeSubfolders: this.includeSubfolders
      }
    });
  }
  
  /**
   * 현재 폴더 가져오기
   * @returns 현재 폴더 경로
   */
  getCurrentFolder(): string {
    // 고정된 폴더가 있는 경우
    if (this.isFixed && this.currentFolder) {
      return this.currentFolder;
    }
    
    // 활성 파일의 폴더 가져오기
    const activeFile = this.obsidianService.getActiveFile();
    if (activeFile) {
      const folderPath = activeFile.parent?.path || '';
      return folderPath;
    }
    
    // 기본값 반환
    return this.currentFolder || '';
  }
  
  /**
   * 폴더 선택
   * @param folderPath 폴더 경로
   * @param isFixed 고정 여부
   */
  async selectFolder(folderPath: string, isFixed = false): Promise<void> {
    this.currentFolder = folderPath;
    this.isFixed = isFixed;
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      lastFolderCardSet: folderPath,
      lastFolderCardSetFixed: isFixed
    });
    
    if (isFixed) {
      await this.settingsService.updateSettings({
        defaultFolderCardSet: folderPath,
        isCardSetFixed: true
      });
    }
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARDSET_CHANGED, {
      cardSet: folderPath,
      sourceType: 'folder',
      isFixed
    });
  }
  
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  async setIncludeSubfolders(include: boolean): Promise<void> {
    this.includeSubfolders = include;
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      includeSubfolders: include
    });
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARDSET_CHANGED, {
      cardSet: this.getCurrentFolder(),
      sourceType: 'folder',
      isFixed: this.isFixed
    });
  }
  
  /**
   * 하위 폴더 포함 여부 가져오기
   * @returns 하위 폴더 포함 여부
   */
  getIncludeSubfolders(): boolean {
    return this.includeSubfolders;
  }
  
  /**
   * 폴더 목록 가져오기
   * @returns 폴더 목록
   */
  getFolders(): string[] {
    return this.folders;
  }
  
  /**
   * 현재 선택된 카드셋 가져오기
   * @returns 현재 선택된 카드셋
   */
  getCurrentCardSet(): string | null {
    return this.getCurrentFolder();
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
    return this.folders;
  }
  
  /**
   * 폴더 목록 초기화
   */
  private initFolders(): void {
    const folders = this.obsidianService.getFolders();
    this.folders = folders.map(folder => folder.path);
    
    // 루트 폴더 추가
    if (!this.folders.includes('/')) {
      this.folders.unshift('/');
    }
  }
  
  /**
   * 폴더 내 파일 가져오기
   * @param folderPath 폴더 경로
   * @param includeSubfolders 하위 폴더 포함 여부
   * @returns 파일 목록
   */
  private getFilesInFolder(folderPath: string, includeSubfolders: boolean): TFile[] {
    return this.obsidianService.getMarkdownFilesInFolder(folderPath, includeSubfolders);
  }

  /**
   * 카드셋 선택
   * @param cardSet 카드셋 (폴더 경로)
   * @param isFixed 고정 여부
   */
  async selectCardSet(cardSet: string, isFixed = false): Promise<void> {
    await this.selectFolder(cardSet, isFixed);
  }

  /**
   * 현재 카드셋 상태 가져오기
   * @returns 카드셋 상태 객체
   */
  getState(): ICardSetState {
    return {
      currentCardSet: this.currentFolder,
      isFixed: this.isFixed
    };
  }

  /**
   * 소스 타입 가져오기
   */
  get type() {
    return 'folder' as const;
  }
} 