import { App, TFile } from 'obsidian';
import { IMode, ModeType } from '../domain/mode/Mode';
import { FolderMode } from '../domain/mode/FolderMode';
import { TagMode } from '../domain/mode/TagMode';
import { ICard } from '../domain/card/Card';

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
   * @param isFixed 고정 여부 (true: 지정 폴더/태그, false: 활성 폴더/태그)
   */
  selectCardSet(cardSet: string, isFixed?: boolean): void;
  
  /**
   * 현재 선택된 카드 세트 가져오기
   * @returns 현재 선택된 카드 세트
   */
  getCurrentCardSet(): string | null;
  
  /**
   * 카드 세트 고정 여부 가져오기
   * @returns 카드 세트 고정 여부
   */
  isCardSetFixed(): boolean;
  
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  setIncludeSubfolders(include: boolean): void;
  
  /**
   * 하위 폴더 포함 여부 가져오기
   * @returns 하위 폴더 포함 여부
   */
  getIncludeSubfolders(): boolean;
  
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
   * 현재 모드를 카드 목록에 적용
   * @param cards 카드 목록
   * @returns 필터링된 카드 목록
   */
  applyMode(cards: ICard[]): Promise<ICard[]>;
  
  /**
   * 서비스 초기화
   */
  initialize(): void;
  
  /**
   * 설정 초기화
   */
  reset(): void;
  
  /**
   * 활성 파일 변경 이벤트 처리
   * @param file 활성 파일
   */
  handleActiveFileChange(file: TFile | null): void;
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
  private isFixed: boolean = false;
  private includeSubfolders: boolean = true;
  
  constructor(app: App, defaultModeType: ModeType = 'folder') {
    this.app = app;
    this.folderMode = new FolderMode(app);
    this.tagMode = new TagMode(app);
    this.currentMode = defaultModeType === 'folder' ? this.folderMode : this.tagMode;
    
    // 활성 파일 변경 이벤트 리스너 등록
    this.app.workspace.on('file-open', (file: TFile | null) => {
      if (!this.isFixed) {
        this.handleActiveFileChange(file);
      }
    });
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
    this.isFixed = false;
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
    this.isFixed = false;
    
    // 모드 변경 시 활성 파일 기준으로 카드 세트 설정
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      this.handleActiveFileChange(activeFile);
    }
    
    return this.currentMode;
  }
  
  selectCardSet(cardSet: string, isFixed: boolean = false): void {
    console.log(`[ModeService] 카드 세트 선택: ${cardSet}, 고정 여부: ${isFixed}`);
    console.log(`[ModeService] 이전 카드 세트: ${this.currentMode.currentCardSet}`);
    
    this.currentMode.selectCardSet(cardSet);
    this.isFixed = isFixed;
    
    console.log(`[ModeService] 선택 후 카드 세트: ${this.currentMode.currentCardSet}`);
    console.log(`[ModeService] 현재 모드 타입: ${this.currentMode.type}`);
  }
  
  getCurrentCardSet(): string | null {
    return this.currentMode.currentCardSet;
  }
  
  isCardSetFixed(): boolean {
    return this.isFixed;
  }
  
  setIncludeSubfolders(include: boolean): void {
    this.includeSubfolders = include;
    if (this.currentMode.type === 'folder') {
      (this.currentMode as FolderMode).setIncludeSubfolders(include);
    }
  }
  
  getIncludeSubfolders(): boolean {
    return this.includeSubfolders;
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
    return this.currentMode.getFiles();
  }
  
  async applyMode(cards: ICard[]): Promise<ICard[]> {
    const cardSet = this.getCurrentCardSet();
    console.log(`[ModeService] applyMode 호출됨, 현재 카드 세트: ${cardSet}, 카드 수: ${cards.length}`);
    
    if (!cardSet) return cards;
    
    if (this.currentMode.type === 'folder') {
      // 폴더 모드인 경우 해당 폴더 경로를 가진 카드만 필터링
      console.log(`[ModeService] 폴더 모드 필터링 시작, 폴더: ${cardSet}, 하위 폴더 포함: ${this.includeSubfolders}`);
      
      // 정규화된 경로 확보 (끝에 슬래시 제거)
      const normalizedCardSet = cardSet.endsWith('/') && cardSet !== '/' 
        ? cardSet.slice(0, -1) 
        : cardSet;
      
      console.log(`[ModeService] 정규화된 카드 세트 경로: ${normalizedCardSet}`);
      
      const filteredCards = cards.filter(card => {
        if (!card.path) return false;
        
        // 파일의 폴더 경로 추출 (파일명 제외)
        const folderPath = card.path.substring(0, Math.max(0, card.path.lastIndexOf('/')));
        
        if (normalizedCardSet === '/') {
          if (!this.includeSubfolders) {
            // 루트 폴더만 포함 (하위 폴더 제외)
            return folderPath === '';
          }
          return true; // 루트 폴더인 경우 모든 카드 포함 (하위 폴더 포함)
        }
        
        if (this.includeSubfolders) {
          // 하위 폴더 포함
          return folderPath === normalizedCardSet || folderPath.startsWith(`${normalizedCardSet}/`);
        } else {
          // 현재 폴더만
          return folderPath === normalizedCardSet;
        }
      });
      
      console.log(`[ModeService] 폴더 모드 필터링 완료, 필터링 후 카드 수: ${filteredCards.length}`);
      return filteredCards;
    } else if (this.currentMode.type === 'tag') {
      // 태그 모드인 경우 해당 태그를 가진 카드만 필터링
      // # 제거한 태그 사용
      const cleanTag = cardSet.startsWith('#') ? cardSet.substring(1) : cardSet;
      console.log(`[ModeService] 태그 모드 필터링 시작, 태그: ${cardSet}, 정제된 태그: ${cleanTag}`);
      
      const filteredCards = cards.filter(card => {
        if (!card.tags || card.tags.length === 0) return false;
        
        // 태그 비교 시 # 제거하고 비교
        const hasTag = card.tags.some(tag => {
          const cardTagClean = tag.startsWith('#') ? tag.substring(1) : tag;
          return cardTagClean === cleanTag;
        });
        
        return hasTag;
      });
      
      console.log(`[ModeService] 태그 모드 필터링 완료, 필터링 후 카드 수: ${filteredCards.length}`);
      return filteredCards;
    }
    
    return cards;
  }
  
  /**
   * 활성 파일 변경 이벤트 처리
   * @param file 활성 파일
   */
  handleActiveFileChange(file: TFile | null): void {
    if (!file) return;
    
    if (this.currentMode.type === 'folder') {
      // 폴더 모드인 경우 활성 파일의 폴더 경로로 설정
      const filePath = file.path;
      const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
      this.currentMode.selectCardSet(folderPath || '/');
    } else if (this.currentMode.type === 'tag') {
      // 태그 모드인 경우 활성 파일의 태그로 설정
      const fileCache = this.app.metadataCache.getFileCache(file);
      if (fileCache && fileCache.tags && fileCache.tags.length > 0) {
        // 태그가 있는 경우 첫 번째 태그 사용
        this.currentMode.selectCardSet(fileCache.tags[0].tag);
      } else {
        // 태그가 없는 경우 이전에 선택한 태그 유지
        // 또는 태그 목록을 가져와서 첫 번째 태그 선택
        this.getCardSets().then(tags => {
          if (tags.length > 0 && !this.currentMode.currentCardSet) {
            this.currentMode.selectCardSet(tags[0]);
          }
        });
      }
    }
  }
} 