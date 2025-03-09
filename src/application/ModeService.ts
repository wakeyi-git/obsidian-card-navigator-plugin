import { App, TFile } from 'obsidian';
import { IMode, ModeType } from '../domain/mode/Mode';
import { FolderMode } from '../domain/mode/FolderMode';
import { TagMode } from '../domain/mode/TagMode';
import { SearchMode, SearchType } from '../domain/mode/SearchMode';
import { ICard } from '../domain/card/Card';
import { ICardService } from './CardService';

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
   * @param modeType 변경할 모드 타입
   */
  changeMode(modeType: ModeType): Promise<void>;
  
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
  initialize(): Promise<void>;
  
  /**
   * 설정 초기화
   */
  reset(): void;
  
  /**
   * 활성 파일 변경 이벤트 처리
   * @param file 활성 파일
   * @returns 카드 세트가 변경되었는지 여부
   */
  handleActiveFileChange(file: TFile | null): Promise<boolean>;
  
  /**
   * 현재 모드에 따라 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  getCards(): Promise<ICard[]>;
  
  /**
   * 검색 모드 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  configureSearchMode(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void;
  
  /**
   * 이전 모드 가져오기
   * @returns 이전 모드
   */
  getPreviousMode(): ModeType;
  
  /**
   * 태그 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setTagCaseSensitive(caseSensitive: boolean): void;
  
  /**
   * 태그 대소문자 구분 여부 확인
   * @returns 대소문자 구분 여부
   */
  isTagCaseSensitive(): boolean;
  
  /**
   * 현재 모드 상태 저장
   * 검색 모드로 전환하기 전에 현재 모드 상태를 저장합니다.
   */
  saveCurrentModeState(): void;
  
  /**
   * 이전 모드 상태 복원
   * 검색 모드에서 이전 모드로 돌아갑니다.
   */
  restorePreviousModeState(): void;
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
  private searchMode: SearchMode;
  private isFixed = false;
  private includeSubfolders = true;
  private cardService: ICardService;
  private previousMode: { type: ModeType; state: any } | null = null;
  private previousCardSet: { [key in ModeType]?: string } = {}; // 모드별 이전 카드 세트 저장
  private service: any; // 임시로 any 타입 사용
  
  constructor(app: App, cardService: ICardService, defaultModeType: ModeType = 'folder', service?: any) {
    this.app = app;
    this.cardService = cardService;
    this.service = service; // 서비스 설정
    
    // 모드 초기화
    this.folderMode = new FolderMode(app);
    this.tagMode = new TagMode(app);
    this.searchMode = new SearchMode(app);
    
    // 기본 모드 설정
    switch (defaultModeType) {
      case 'folder':
        this.currentMode = this.folderMode;
        break;
      case 'tag':
        this.currentMode = this.tagMode;
        break;
      case 'search':
        this.currentMode = this.searchMode;
        break;
      default:
        this.currentMode = this.folderMode;
    }
  }
  
  /**
   * 초기화
   */
  async initialize(): Promise<void> {
    console.log(`[ModeService] 초기화 시작`);
    
    // 초기화 플래그 설정 - 이미 초기화 중인지 확인
    if ((this as any)._initializing) {
      console.log(`[ModeService] 이미 초기화 중입니다. 중복 초기화 방지`);
      return;
    }
    
    (this as any)._initializing = true;
    
    // cardService가 제대로 초기화되었는지 확인
    if (!this.cardService || typeof this.cardService.getAllCards !== 'function') {
      console.error('[ModeService] cardService가 올바르게 초기화되지 않았습니다.');
      (this as any)._initializing = false;
      return;
    }
    
    // 현재 카드 세트가 이미 선택되어 있는지 확인
    const currentCardSet = this.getCurrentCardSet();
    if (currentCardSet) {
      console.log(`[ModeService] 이미 카드 세트가 선택되어 있습니다: ${currentCardSet}`);
      (this as any)._initializing = false;
      return;
    }
    
    // 현재 카드 세트가 없는 경우 기본 카드 세트 설정
    try {
      // 활성 파일 가져오기
      const activeFile = this.app.workspace.getActiveFile();
      
      // 고정 여부 확인 (설정에서 가져오기)
      const settings = (this.app as any).plugins.plugins['obsidian-card-navigator-plugin']?.settings;
      const isFixed = settings?.isCardSetFixed || false;
      
      if (this.currentMode.type === 'folder') {
        // 폴더 모드인 경우
        const folderMode = this.currentMode as unknown as FolderMode;
        
        if (isFixed) {
          // 지정 폴더 모드
          const defaultCardSet = settings?.defaultCardSet || '/';
          console.log(`[ModeService] 폴더 모드 지정 폴더 설정: ${defaultCardSet}`);
          folderMode.setFolder(defaultCardSet, true);
        } else {
          // 활성 폴더 모드
          if (activeFile) {
            const filePath = activeFile.path;
            const folderPath = filePath.substring(0, Math.max(0, filePath.lastIndexOf('/')));
            const folder = folderPath || '/';
            console.log(`[ModeService] 폴더 모드 활성 폴더 설정: ${folder}`);
            folderMode.setFolder(folder, false);
          } else {
            // 활성 파일이 없는 경우 루트 폴더를 기본 카드 세트로 설정
            console.log(`[ModeService] 폴더 모드 기본 폴더 설정: / (루트 폴더)`);
            folderMode.setFolder('/', false);
          }
        }
        
        // 하위 폴더 포함 여부 설정
        if (settings?.includeSubfolders !== undefined) {
          folderMode.setIncludeSubfolders(settings.includeSubfolders);
        }
      } else if (this.currentMode.type === 'tag') {
        // 태그 모드인 경우
        const tagMode = this.currentMode as unknown as TagMode;
        
        if (isFixed) {
          // 지정 태그 모드
          const defaultCardSet = settings?.defaultCardSet || '';
          if (defaultCardSet) {
            console.log(`[ModeService] 태그 모드 지정 태그 설정: ${defaultCardSet}`);
            tagMode.setTag(defaultCardSet, true);
          } else {
            // 지정된 태그가 없는 경우 첫 번째 태그 사용
            const tags = await tagMode.getCardSets();
            if (tags.length > 0) {
              console.log(`[ModeService] 태그 모드 첫 번째 태그 설정: ${tags[0]}`);
              tagMode.setTag(tags[0], true);
            }
          }
        } else {
          // 활성 태그 모드
          if (activeFile) {
            const fileTags = await tagMode.getActiveFileTags(activeFile);
            if (fileTags.length > 0) {
              const tag = fileTags[0];
              console.log(`[ModeService] 태그 모드 활성 파일 태그 설정: ${tag}`);
              tagMode.setTag(tag, false);
            } else {
              // 활성 파일에 태그가 없는 경우 태그 목록에서 첫 번째 태그를 기본 카드 세트로 설정
              const tags = await tagMode.getCardSets();
              if (tags.length > 0) {
                console.log(`[ModeService] 태그 모드 첫 번째 태그 설정: ${tags[0]}`);
                tagMode.setTag(tags[0], false);
              }
            }
          } else {
            // 활성 파일이 없는 경우 태그 목록에서 첫 번째 태그를 기본 카드 세트로 설정
            const tags = await tagMode.getCardSets();
            if (tags.length > 0) {
              console.log(`[ModeService] 태그 모드 첫 번째 태그 설정: ${tags[0]}`);
              tagMode.setTag(tags[0], false);
            }
          }
        }
        
        // 태그 대소문자 구분 여부 설정
        if (settings?.tagCaseSensitive !== undefined) {
          tagMode.setCaseSensitive(settings.tagCaseSensitive);
        }
      }
    } catch (error) {
      console.error(`[ModeService] 기본 카드 세트 설정 중 오류 발생:`, error);
    }
    
    console.log(`[ModeService] 초기화 완료, 현재 카드 세트: ${this.getCurrentCardSet()}, 고정 여부: ${this.isCardSetFixed()}`);
    (this as any)._initializing = false;
  }
  
  reset(): void {
    this.folderMode.reset();
    this.tagMode.reset();
    this.searchMode.reset();
    this.isFixed = false;
    this.initialize();
  }
  
  getCurrentMode(): IMode {
    return this.currentMode;
  }
  
  getCurrentModeType(): ModeType {
    return this.currentMode.type;
  }
  
  /**
   * 모드 변경
   * @param modeType 변경할 모드 타입
   */
  async changeMode(modeType: ModeType): Promise<void> {
    console.log(`[ModeService] 모드 변경: ${this.currentMode.type} -> ${modeType}`);
    
    // 이미 같은 모드인 경우 무시
    if (this.currentMode.type === modeType) {
      console.log(`[ModeService] 이미 ${modeType} 모드입니다.`);
      return;
    }
    
    // 이전 모드 저장 (검색 모드로 전환하는 경우)
    if (modeType === 'search' && this.currentMode.type !== 'search') {
      this.saveCurrentModeState();
    }
    
    // 이전 카드 세트 저장
    if (this.currentMode.currentCardSet) {
      this.previousCardSet[this.currentMode.type] = this.currentMode.currentCardSet;
    }
    
    // 모드 변경
    switch (modeType) {
      case 'folder':
        this.currentMode = this.folderMode;
        break;
      case 'tag':
        this.currentMode = this.tagMode;
        break;
      case 'search':
        this.currentMode = this.searchMode;
        break;
      default:
        throw new Error(`[ModeService] 지원하지 않는 모드 타입: ${modeType}`);
    }
    
    // 이전 카드 세트 복원 (검색 모드가 아닌 경우)
    if (modeType !== 'search' && this.previousCardSet[modeType]) {
      this.currentMode.selectCardSet(this.previousCardSet[modeType]);
      console.log(`[ModeService] 이전 카드 세트 복원: ${this.previousCardSet[modeType]}`);
    }
    
    // 검색 모드에서 다른 모드로 전환하는 경우 이전 모드 상태 복원
    if (modeType !== 'search' && this.previousMode?.type === modeType) {
      this.restorePreviousModeState();
    }
    
    // 서비스 알림
    if (this.service) {
      this.service.notifyModeChanged(modeType);
    }
  }
  
  selectCardSet(cardSet: string, isFixed?: boolean): void {
    console.log(`[ModeService] 카드 세트 선택: ${cardSet}, 고정 여부: ${isFixed}`);
    
    // isFixed가 undefined인 경우 기본값 false 사용
    const fixed = isFixed === undefined ? false : isFixed;
    
    // 현재 모드에 카드 세트 설정
    this.currentMode.selectCardSet(cardSet);
    
    // 모드별 고정 상태 설정
    if (this.currentMode.type === 'folder') {
      // 폴더 모드인 경우 카드 세트 고정 여부 설정
      const folderMode = this.currentMode as unknown as FolderMode;
      folderMode.setFixed(fixed);
      this.isFixed = fixed;
      console.log(`[ModeService] 폴더 모드 카드 세트 고정 상태 설정: ${fixed}`);
    } else if (this.currentMode.type === 'tag') {
      // 태그 모드인 경우 태그 고정 여부 설정
      const tagMode = this.tagMode;
      tagMode.setFixed(fixed);
      this.isFixed = fixed;
      console.log(`[ModeService] 태그 모드 카드 세트 고정 상태 설정: ${fixed}`);
    }
    
    // 선택 후 현재 카드 세트 확인
    const currentSet = this.getCurrentCardSet();
    console.log(`[ModeService] 카드 세트 선택 후 확인: currentCardSet=${currentSet}`);
  }
  
  getCurrentCardSet(): string | null {
    const currentSet = this.currentMode.currentCardSet;
    console.log(`[ModeService] getCurrentCardSet 호출: currentMode=${this.currentMode.type}, currentCardSet=${currentSet}`);
    return currentSet;
  }
  
  /**
   * 카드 세트 고정 여부 가져오기
   * @returns 카드 세트 고정 여부
   */
  isCardSetFixed(): boolean {
    // 현재 모드의 isFixed 메서드 사용
    return this.currentMode.isFixed();
  }
  
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  setIncludeSubfolders(include: boolean): void {
    console.log(`[ModeService] 하위 폴더 포함 여부 설정: ${include}`);
    this.includeSubfolders = include;
    
    // 현재 모드가 폴더 모드인 경우에만 적용
    if (this.currentMode.type === 'folder') {
      (this.currentMode as unknown as FolderMode).setIncludeSubfolders(include);
    }
  }
  
  getIncludeSubfolders(): boolean {
    return this.includeSubfolders;
  }
  
  /**
   * 카드 세트 목록 가져오기
   * @returns 카드 세트 목록
   */
  async getCardSets(): Promise<string[]> {
    try {
      // 현재 모드에 따라 카드 세트 목록 가져오기
      const cardSets = await this.currentMode.getCardSets();
      return cardSets;
    } catch (error) {
      console.error('[ModeService] 카드 세트 목록 가져오기 오류:', error);
      return [];
    }
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
    
    if (!cardSet) {
      console.log(`[ModeService] 카드 세트가 없어 모든 카드 반환`);
      return cards;
    }
    
    if (this.currentMode.type === 'folder') {
      // 폴더 모드인 경우 해당 폴더 경로를 가진 카드만 필터링
      console.log(`[ModeService] 폴더 모드 필터링 시작, 폴더: ${cardSet}, 하위 폴더 포함: ${this.includeSubfolders}`);
      
      // 정규화된 경로 확보 (끝에 슬래시 제거)
      const normalizedCardSet = cardSet.endsWith('/') && cardSet !== '/' 
        ? cardSet.slice(0, -1) 
        : cardSet;
      
      console.log(`[ModeService] 정규화된 카드 세트 경로: ${normalizedCardSet}`);
      
      // 디버깅을 위해 모든 카드의 경로 출력
      if (cards.length > 0 && cards.length < 20) {
        console.log(`[ModeService] 필터링 전 카드 경로 목록:`);
        cards.forEach(card => console.log(`  - ${card.path}`));
      }
      
      const filteredCards = cards.filter(card => {
        if (!card.path) {
          console.log(`[ModeService] 경로가 없는 카드 발견, 필터링에서 제외`);
          return false;
        }
        
        // 파일의 폴더 경로 추출 (파일명 제외)
        const folderPath = card.path.substring(0, Math.max(0, card.path.lastIndexOf('/')));
        
        if (normalizedCardSet === '/') {
          if (!this.includeSubfolders) {
            // 루트 폴더만 포함 (하위 폴더 제외)
            const isInRoot = folderPath === '';
            if (isInRoot) {
              console.log(`[ModeService] 루트 폴더 카드 포함: ${card.path}`);
            }
            return isInRoot;
          }
          console.log(`[ModeService] 루트 폴더 모드에서 모든 카드 포함: ${card.path}`);
          return true; // 루트 폴더인 경우 모든 카드 포함 (하위 폴더 포함)
        }
        
        let included = false;
        
        if (this.includeSubfolders) {
          // 하위 폴더 포함
          included = folderPath === normalizedCardSet || folderPath.startsWith(`${normalizedCardSet}/`);
        } else {
          // 현재 폴더만
          included = folderPath === normalizedCardSet;
        }
        
        if (included) {
          console.log(`[ModeService] 카드 포함: ${card.path}, 폴더 경로: ${folderPath}`);
        }
        
        return included;
      });
      
      console.log(`[ModeService] 폴더 모드 필터링 완료, 필터링 후 카드 수: ${filteredCards.length}`);
      
      // 필터링 결과가 비어있는 경우 추가 디버깅 정보
      if (filteredCards.length === 0) {
        console.log(`[ModeService] 필터링 결과가 비어있습니다. 폴더 경로: ${normalizedCardSet}`);
        console.log(`[ModeService] 현재 모드: ${this.currentMode.type}, 하위 폴더 포함: ${this.includeSubfolders}`);
      }
      
      return filteredCards;
    } else if (this.currentMode.type === 'tag') {
      // 태그 모드인 경우 해당 태그를 가진 카드만 필터링
      // 쉼표로 구분된 여러 태그 처리
      const tagList = cardSet.split(',').map(tag => tag.trim());
      console.log(`[ModeService] 태그 모드 필터링 시작, 태그 목록: ${tagList.join(', ')}`);
      
      // 각 태그를 정규화하여 배열로 저장 (# 있는 버전과 없는 버전 모두 포함)
      const normalizedTags: string[] = [];
      tagList.forEach(tag => {
        // # 있는 버전
        const tagWithHash = tag.startsWith('#') ? tag : `#${tag}`;
        normalizedTags.push(tagWithHash);
        
        // # 없는 버전
        const tagWithoutHash = tag.startsWith('#') ? tag.substring(1) : tag;
        normalizedTags.push(tagWithoutHash);
      });
      
      console.log(`[ModeService] 정규화된 태그 목록: ${normalizedTags.join(', ')}`);
      
      const filteredCards = cards.filter(card => {
        if (!card.tags || card.tags.length === 0) {
          console.log(`[ModeService] 카드 ${card.title || card.id}에 태그가 없음`);
          return false;
        }
        
        // 카드의 각 태그에 대해 검색 태그와 비교
        let hasMatchingTag = false;
        
        for (const cardTag of card.tags) {
          // 카드 태그 정규화 (# 있는 버전과 없는 버전)
          const cardTagWithHash = cardTag.startsWith('#') ? cardTag : `#${cardTag}`;
          const cardTagWithoutHash = cardTag.startsWith('#') ? cardTag.substring(1) : cardTag;
          
          // 대소문자 무시를 위해 소문자로 변환
          const cardTagWithHashLower = cardTagWithHash.toLowerCase();
          const cardTagWithoutHashLower = cardTagWithoutHash.toLowerCase();
          
          // 검색 태그와 비교
          for (const searchTag of normalizedTags) {
            // 대소문자 무시를 위해 소문자로 변환
            const searchTagLower = searchTag.toLowerCase();
            
            // 정확히 일치하는지 확인 (대소문자 무시)
            if (cardTagWithHashLower === searchTagLower || cardTagWithoutHashLower === searchTagLower) {
              hasMatchingTag = true;
              console.log(`[ModeService] 카드 ${card.title || card.id}에서 태그 매치: ${cardTag} = ${searchTag}`);
              break;
            }
          }
          
          if (hasMatchingTag) {
            break;
          }
        }
        
        if (hasMatchingTag) {
          console.log(`[ModeService] 태그 일치하는 카드 포함: ${card.title || card.id}`);
        }
        
        return hasMatchingTag;
      });
      
      console.log(`[ModeService] 태그 모드 필터링 완료, 필터링 후 카드 수: ${filteredCards.length}`);
      
      // 필터링 결과가 비어있는 경우 추가 디버깅 정보
      if (filteredCards.length === 0) {
        console.log(`[ModeService] 필터링 결과가 비어있습니다. 태그: ${cardSet}`);
        console.log(`[ModeService] 현재 모드: ${this.currentMode.type}, 정규화된 태그: ${normalizedTags.join(', ')}`);
        
        // 디버깅을 위해 모든 카드의 태그 출력
        if (cards.length > 0 && cards.length < 20) {
          console.log(`[ModeService] 필터링 전 카드 태그 목록:`);
          cards.forEach(card => {
            if (card.tags && card.tags.length > 0) {
              console.log(`  - 카드 ${card.title || card.id} 태그: ${card.tags.join(', ')}`);
            } else {
              console.log(`  - 카드 ${card.title || card.id}에 태그 없음`);
            }
          });
        }
      }
      
      return filteredCards;
    }
    
    console.log(`[ModeService] 다른 모드이므로 모든 카드 반환`);
    return cards;
  }
  
  /**
   * 활성 파일 변경 이벤트 처리
   * @param file 활성 파일
   * @returns 카드 세트가 변경되었는지 여부
   */
  async handleActiveFileChange(file: TFile | null): Promise<boolean> {
    if (!file) return false;
    
    console.log(`[ModeService] 활성 파일 변경 처리: ${file.path}`);
    console.log(`[ModeService] 현재 모드: ${this.currentMode.type}, 고정 여부: ${this.isCardSetFixed()}`);
    
    // 카드 세트가 고정된 경우 변경하지 않음
    if (this.isCardSetFixed()) {
      console.log(`[ModeService] 카드 세트가 고정되어 있어 활성 파일 변경을 무시합니다.`);
      return false;
    }
    
    let cardSetChanged = false;
    
    if (this.currentMode.type === 'folder') {
      // 폴더 모드인 경우 활성 파일의 폴더 경로로 설정
      const filePath = file.path;
      const lastSlashIndex = filePath.lastIndexOf('/');
      const folderPath = lastSlashIndex > 0 ? filePath.substring(0, lastSlashIndex) : '/';
      
      console.log(`[ModeService] 활성 파일의 폴더 경로: ${folderPath}`);
      
      // 현재 카드 세트와 다른 경우에만 업데이트
      if (this.currentMode.currentCardSet !== folderPath) {
        console.log(`[ModeService] 카드 세트 업데이트: ${this.currentMode.currentCardSet} -> ${folderPath}`);
        const folderMode = this.currentMode as unknown as FolderMode;
        folderMode.setFolder(folderPath, false); // 활성 폴더 모드로 설정 (고정 아님)
        cardSetChanged = true;
      } else {
        console.log(`[ModeService] 같은 폴더 내 이동이므로 카드 세트 업데이트를 건너뜁니다.`);
      }
    } else if (this.currentMode.type === 'tag') {
      // 태그 모드인 경우 활성 파일의 태그로 설정
      const tagMode = this.currentMode as unknown as TagMode;
      const allTags = await tagMode.getAllTagsFromFile(file);
      
      if (allTags.length > 0) {
        // 첫 번째 태그 사용
        const firstTag = allTags[0];
        
        // 현재 카드 세트와 다른 경우에만 업데이트
        if (this.currentMode.currentCardSet !== firstTag) {
          console.log(`[ModeService] 태그 업데이트: ${this.currentMode.currentCardSet} -> ${firstTag}`);
          tagMode.setTag(firstTag, false); // 활성 태그 모드로 설정 (고정 아님)
          cardSetChanged = true;
        } else {
          console.log(`[ModeService] 같은 태그를 가진 파일이므로 카드 세트 업데이트를 건너뜁니다.`);
        }
      } else {
        console.log(`[ModeService] 활성 파일에 태그가 없습니다.`);
      }
    }
    
    return cardSetChanged;
  }
  
  /**
   * 현재 모드에 따라 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  async getCards(): Promise<ICard[]> {
    console.log(`[ModeService] 현재 모드(${this.currentMode.type})에 따라 카드 목록 가져오기`);
    
    try {
      // 모드 객체의 getCards 메서드 직접 호출
      if (this.currentMode.type === 'folder') {
        return await (this.currentMode as unknown as FolderMode).getCards(this.cardService);
      } else if (this.currentMode.type === 'tag') {
        return await (this.currentMode as unknown as TagMode).getCards(this.cardService);
      } else if (this.currentMode.type === 'search') {
        return await (this.currentMode as unknown as SearchMode).getCards(this.cardService);
      } else {
        console.error(`[ModeService] 지원하지 않는 모드 타입: ${this.currentMode.type}`);
        return [];
      }
    } catch (error) {
      console.error(`[ModeService] 카드 목록 가져오기 오류:`, error);
      return [];
    }
  }
  
  /**
   * 검색 모드 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  configureSearchMode(query: string, searchType: SearchType = 'filename', caseSensitive = false, frontmatterKey?: string): void {
    console.log(`[ModeService] 검색 모드 설정: 쿼리='${query}', 타입=${searchType}, 대소문자=${caseSensitive}, 프론트매터키=${frontmatterKey}`);
    
    // 현재 모드가 검색 모드가 아니면 검색 모드로 전환
    if (this.currentMode.type !== 'search') {
      // 현재 모드 상태 저장
      this.saveCurrentModeState();
      
      // 현재 카드셋 저장 (검색 범위 설정을 위해)
      this.cardService.getCards().then(cards => {
        (this.searchMode as SearchMode).setPreSearchCards(cards);
      });
      
      // 검색 모드로 전환
      this.currentMode = this.searchMode;
      
      // 서비스 알림
      if (this.service) {
        this.service.notifyModeChanged('search');
      }
    }
    
    // 검색 모드 설정
    const searchMode = this.searchMode as SearchMode;
    searchMode.setQuery(query);
    searchMode.setSearchType(searchType, frontmatterKey);
    searchMode.setCaseSensitive(caseSensitive);
  }
  
  /**
   * 이전 모드 가져오기
   * @returns 이전 모드
   */
  getPreviousMode(): ModeType {
    return this.previousMode?.type || 'folder';
  }
  
  /**
   * 태그 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setTagCaseSensitive(caseSensitive: boolean): void {
    if (this.tagMode) {
      this.tagMode.setCaseSensitive(caseSensitive);
    }
  }
  
  /**
   * 태그 대소문자 구분 여부 확인
   * @returns 대소문자 구분 여부
   */
  isTagCaseSensitive(): boolean {
    return this.tagMode ? this.tagMode.isCaseSensitive() : false;
  }
  
  /**
   * 현재 모드 상태 저장
   * 검색 모드로 전환하기 전에 현재 모드 상태를 저장합니다.
   */
  saveCurrentModeState(): void {
    console.log(`[ModeService] 현재 모드 상태 저장: ${this.currentMode.type}`);
    
    // 이전 모드 정보 저장
    this.previousMode = {
      type: this.currentMode.type,
      state: this.serializeModeState(this.currentMode)
    };
    
    console.log(`[ModeService] 저장된 이전 모드 상태:`, this.previousMode);
  }
  
  /**
   * 이전 모드 상태 복원
   * 검색 모드에서 이전 모드로 돌아갑니다.
   */
  restorePreviousModeState(): void {
    if (!this.previousMode) {
      console.log(`[ModeService] 복원할 이전 모드 상태가 없습니다.`);
      return;
    }
    
    console.log(`[ModeService] 이전 모드 상태 복원: ${this.previousMode.type}`);
    
    // 이전 모드 타입에 따라 모드 객체 선택
    let mode: IMode;
    switch (this.previousMode.type) {
      case 'folder':
        mode = this.folderMode;
        break;
      case 'tag':
        mode = this.tagMode;
        break;
      case 'search':
        mode = this.searchMode;
        break;
      default:
        console.error(`[ModeService] 지원하지 않는 이전 모드 타입: ${this.previousMode.type}`);
        return;
    }
    
    // 이전 모드 상태 복원
    this.deserializeModeState(mode, this.previousMode.state);
    
    // 현재 모드 설정
    this.currentMode = mode;
    
    console.log(`[ModeService] 이전 모드 상태 복원 완료: ${this.currentMode.type}, 카드셋=${this.currentMode.currentCardSet}`);
    
    // 이전 모드 정보 초기화
    this.previousMode = null;
    
    // 서비스 알림
    if (this.service) {
      this.service.notifyModeChanged(this.currentMode.type);
    }
  }
  
  /**
   * 모드 상태 직렬화
   * @param mode 모드
   * @returns 직렬화된 상태
   */
  private serializeModeState(mode: IMode): any {
    const state: any = {
      currentCardSet: mode.currentCardSet,
      isFixed: mode.isFixed()
    };
    
    if (mode.type === 'folder') {
      const folderMode = mode as unknown as FolderMode;
      state.includeSubfolders = folderMode.getIncludeSubfolders();
    } else if (mode.type === 'tag') {
      const tagMode = mode as unknown as TagMode;
      state.caseSensitive = tagMode.isCaseSensitive();
    } else if (mode.type === 'search') {
      const searchMode = mode as unknown as SearchMode;
      state.query = searchMode.getQuery();
      state.searchType = searchMode.getSearchType();
      state.caseSensitive = searchMode.isCaseSensitive();
      state.frontmatterKey = searchMode.getFrontmatterKey();
      state.searchScope = searchMode.getSearchScope();
      state.preSearchCards = searchMode.getPreSearchCards();
    }
    
    return state;
  }
  
  /**
   * 모드 상태 역직렬화
   * @param mode 모드
   * @param state 직렬화된 상태
   */
  private deserializeModeState(mode: IMode, state: any): void {
    if (!state) return;
    
    if (state.currentCardSet !== undefined) {
      mode.selectCardSet(state.currentCardSet);
    }
    
    if (state.isFixed !== undefined) {
      mode.setFixed(state.isFixed);
    }
    
    if (mode.type === 'folder') {
      const folderMode = mode as unknown as FolderMode;
      if (state.includeSubfolders !== undefined) {
        folderMode.setIncludeSubfolders(state.includeSubfolders);
      }
    } else if (mode.type === 'tag') {
      const tagMode = mode as unknown as TagMode;
      if (state.caseSensitive !== undefined) {
        tagMode.setCaseSensitive(state.caseSensitive);
      }
    } else if (mode.type === 'search') {
      const searchMode = mode as unknown as SearchMode;
      if (state.query !== undefined) {
        searchMode.setQuery(state.query);
      }
      if (state.searchType !== undefined) {
        searchMode.setSearchType(state.searchType, state.frontmatterKey);
      }
      if (state.caseSensitive !== undefined) {
        searchMode.setCaseSensitive(state.caseSensitive);
      }
      if (state.searchScope !== undefined) {
        searchMode.setSearchScope(state.searchScope);
      }
      if (state.preSearchCards !== undefined) {
        searchMode.setPreSearchCards(state.preSearchCards);
      }
    }
  }
} 