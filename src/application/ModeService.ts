import { App } from 'obsidian';
import { IMode, ModeType } from '../domain/mode/Mode';
import { FolderMode } from '../domain/mode/FolderMode';
import { TagMode } from '../domain/mode/TagMode';

/**
 * 모드 서비스 인터페이스
 * 모드 관리를 위한 인터페이스입니다.
 */
export interface IModeService {
  /**
   * 현재 모드 가져오기
   * @returns 현재 모드
   */
  getCurrentMode(): IMode;
  
  /**
   * 현재 모드 타입 가져오기
   * @returns 현재 모드 타입
   */
  getCurrentModeType(): ModeType;
  
  /**
   * 모드 변경
   * @param type 변경할 모드 타입
   * @returns 변경된 모드
   */
  changeMode(type: ModeType): IMode;
  
  /**
   * 카드 세트 선택
   * @param cardSet 선택할 카드 세트
   */
  selectCardSet(cardSet: string): void;
  
  /**
   * 현재 선택된 카드 세트 가져오기
   * @returns 현재 선택된 카드 세트
   */
  getCurrentCardSet(): string | null;
  
  /**
   * 카드 세트 목록 가져오기
   * @returns 카드 세트 목록
   */
  getCardSets(): Promise<string[]>;
  
  /**
   * 필터 옵션 목록 가져오기
   * @returns 필터 옵션 목록
   */
  getFilterOptions(): Promise<string[]>;
  
  /**
   * 현재 모드에 따라 파일 목록 가져오기
   * @returns 파일 경로 목록
   */
  getFiles(): Promise<string[]>;
  
  /**
   * 서비스 초기화
   */
  initialize(): void;
  
  /**
   * 설정 초기화
   */
  reset(): void;
}

/**
 * 모드 서비스 클래스
 * 모드 관리를 위한 클래스입니다.
 */
export class ModeService implements IModeService {
  private app: App;
  private currentMode: IMode;
  private folderMode: FolderMode;
  private tagMode: TagMode;
  
  constructor(app: App, defaultModeType: ModeType = 'folder') {
    this.app = app;
    this.folderMode = new FolderMode(app);
    this.tagMode = new TagMode(app);
    this.currentMode = defaultModeType === 'folder' ? this.folderMode : this.tagMode;
  }
  
  initialize(): void {
    // 기본 카드 세트 선택
    this.getCardSets().then(cardSets => {
      if (cardSets.length > 0) {
        this.selectCardSet(cardSets[0]);
      }
    });
  }
  
  reset(): void {
    this.folderMode.reset();
    this.tagMode.reset();
    this.initialize();
  }
  
  getCurrentMode(): IMode {
    return this.currentMode;
  }
  
  getCurrentModeType(): ModeType {
    return this.currentMode.type;
  }
  
  changeMode(type: ModeType): IMode {
    if (type === this.currentMode.type) {
      return this.currentMode;
    }
    
    this.currentMode = type === 'folder' ? this.folderMode : this.tagMode;
    return this.currentMode;
  }
  
  selectCardSet(cardSet: string): void {
    this.currentMode.selectCardSet(cardSet);
  }
  
  getCurrentCardSet(): string | null {
    return this.currentMode.currentCardSet;
  }
  
  async getCardSets(): Promise<string[]> {
    return this.currentMode.getCardSets();
  }
  
  async getFilterOptions(): Promise<string[]> {
    return this.currentMode.getFilterOptions();
  }
  
  /**
   * 현재 모드에 따라 파일 목록 가져오기
   * @returns 파일 경로 목록
   */
  async getFiles(): Promise<string[]> {
    if (this.currentMode.type === 'folder') {
      return (this.currentMode as FolderMode).getFilesInCurrentFolder();
    } else {
      return (this.currentMode as TagMode).getFilesWithCurrentTag();
    }
  }
} 