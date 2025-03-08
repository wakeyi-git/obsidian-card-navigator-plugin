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
   * @returns 카드 세트가 변경되었는지 여부
   */
  handleActiveFileChange(file: TFile | null): boolean;
  
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
  configureSearchMode(
    query: string,
    searchType: SearchType,
    caseSensitive: boolean,
    frontmatterKey?: string
  ): void;
  
  /**
   * 이전 모드 가져오기
   * @returns 이전 모드
   */
  getPreviousMode(): ModeType;
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
  private previousMode: ModeType = 'folder';
  
  constructor(app: App, cardService: ICardService, defaultModeType: ModeType = 'folder') {
    this.app = app;
    this.cardService = cardService;
    
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
  
  initialize(): void {
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
    
    console.log(`[ModeService] 초기화 완료`);
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
  
  changeMode(type: ModeType): IMode {
    if (type === this.currentMode.type) {
      return this.currentMode;
    }
    
    // 검색 모드로 전환할 때 이전 모드 저장
    if (type === 'search') {
      this.previousMode = this.currentMode.type;
    }
    
    switch (type) {
      case 'folder':
        this.currentMode = this.folderMode;
        break;
      case 'tag':
        this.currentMode = this.tagMode;
        break;
      case 'search':
        this.currentMode = this.searchMode;
        break;
    }
    
    this.isFixed = false;
    
    // 검색 모드에서 나갈 때는 활성 파일 기준으로 카드 세트를 설정하지 않음
    if (type !== 'search') {
      // 모드 변경 시 활성 파일 기준으로 카드 세트 설정
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        this.handleActiveFileChange(activeFile);
      }
    }
    
    return this.currentMode;
  }
  
  selectCardSet(cardSet: string, isFixed?: boolean): void {
    console.log(`[ModeService] 카드 세트 선택: ${cardSet}, 고정 여부: ${isFixed}`);
    
    this.isFixed = isFixed || false;
    
    // 태그 모드인 경우 TagMode의 setFixed 메서드 호출
    if (this.currentMode.type === 'tag') {
      (this.currentMode as TagMode).setFixed(this.isFixed);
    }
    
    this.currentMode.selectCardSet(cardSet);
  }
  
  getCurrentCardSet(): string | null {
    return this.currentMode.currentCardSet;
  }
  
  isCardSetFixed(): boolean {
    // 태그 모드인 경우 TagMode의 isTagFixed 메서드 사용
    if (this.currentMode.type === 'tag') {
      return (this.currentMode as TagMode).isTagFixed();
    }
    
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
    console.log(`[ModeService] 카드 세트 목록 가져오기 시작, 현재 모드: ${this.getCurrentModeType()}`);
    
    try {
      // 현재 모드에 따라 카드 세트 목록 가져오기
      const cardSets = await this.currentMode.getCardSets();
      console.log(`[ModeService] 카드 세트 목록 가져오기 완료, 개수: ${cardSets.length}`);
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
          
          // 검색 태그와 비교
          for (const searchTag of normalizedTags) {
            // 정확히 일치하는지 확인
            if (cardTagWithHash === searchTag || cardTagWithoutHash === searchTag) {
              hasMatchingTag = true;
              console.log(`[ModeService] 카드 ${card.title || card.id}에서 태그 매치: ${cardTag} = ${searchTag}`);
              break;
            }
          }
          
          if (hasMatchingTag) break;
        }
        
        return hasMatchingTag;
      });
      
      console.log(`[ModeService] 태그 모드 필터링 완료, 필터링 후 카드 수: ${filteredCards.length}`);
      if (filteredCards.length > 0) {
        console.log(`[ModeService] 필터링된 첫 번째 카드 정보: ID=${filteredCards[0].id}, 제목=${filteredCards[0].title}, 태그=${filteredCards[0].tags?.join(', ')}`);
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
  handleActiveFileChange(file: TFile | null): boolean {
    if (!file) return false;
    
    // 카드 세트가 고정된 경우 변경하지 않음
    if (this.isCardSetFixed()) {
      console.log(`[ModeService] 카드 세트가 고정되어 있어 활성 파일 변경을 무시합니다.`);
      return false;
    }
    
    console.log(`[ModeService] 활성 파일 변경 처리: ${file.path}`);
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
        this.currentMode.selectCardSet(folderPath);
        cardSetChanged = true;
      } else {
        console.log(`[ModeService] 같은 폴더 내 이동이므로 카드 세트 업데이트를 건너뜁니다.`);
      }
    } else if (this.currentMode.type === 'tag') {
      // 태그 모드인 경우 활성 파일의 태그로 설정
      const tagMode = this.tagMode;
      
      // 태그 모드가 고정되어 있는 경우 변경하지 않음
      if (tagMode.isTagFixed()) {
        console.log(`[ModeService] 태그 모드가 고정되어 있어 활성 파일 변경을 무시합니다.`);
        return false;
      }
      
      const allTags = tagMode.getAllTagsFromFile(file);
      
      if (allTags.length > 0) {
        // 모든 태그를 쉼표로 구분하여 하나의 문자열로 결합 (OR 연산)
        const combinedTags = allTags.join(',');
        console.log(`[ModeService] 활성 파일의 모든 태그: ${combinedTags}`);
        
        // 현재 카드 세트와 다른 경우에만 업데이트
        if (this.currentMode.currentCardSet !== combinedTags) {
          console.log(`[ModeService] 카드 세트 업데이트: ${this.currentMode.currentCardSet} -> ${combinedTags}`);
          this.currentMode.selectCardSet(combinedTags);
          cardSetChanged = true;
        } else {
          console.log(`[ModeService] 같은 태그 세트를 가진 파일로 이동이므로 카드 세트 업데이트를 건너뜁니다.`);
        }
      } else {
        // 태그가 없는 경우 이전에 선택한 태그 유지
        console.log(`[ModeService] 활성 파일에 태그가 없어 현재 태그를 유지합니다: ${this.currentMode.currentCardSet}`);
        
        // 현재 선택된 태그가 없는 경우 태그 목록을 가져와서 첫 번째 태그 선택
        if (!this.currentMode.currentCardSet) {
          this.getCardSets().then(tags => {
            if (tags.length > 0) {
              console.log(`[ModeService] 기본 태그 선택: ${tags[0]}`);
              this.currentMode.selectCardSet(tags[0]);
              cardSetChanged = true;
            }
          });
        }
      }
    }
    
    return cardSetChanged;
  }
  
  /**
   * 현재 모드에 따라 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  async getCards(): Promise<ICard[]> {
    console.log(`[ModeService] 현재 모드에 따른 카드 가져오기 시작`);
    
    const currentMode = this.getCurrentModeType();
    const currentCardSet = this.getCurrentCardSet();
    
    console.log(`[ModeService] 현재 모드: ${currentMode}, 현재 카드 세트: ${currentCardSet}`);
    
    try {
      // 모든 카드 가져오기
      if (!this.cardService || typeof this.cardService.getAllCards !== 'function') {
        console.error('[ModeService] cardService가 올바르게 초기화되지 않았거나 getAllCards 메서드가 없습니다.');
        return [];
      }
      
      // 카드 캐시 사용 여부 확인 (성능 최적화)
      const allCards = await this.cardService.getAllCards();
      console.log(`[ModeService] 전체 카드 수: ${allCards.length}`);
      
      // 모드 적용 (폴더 또는 태그 필터링)
      const filteredCards = await this.applyMode(allCards);
      console.log(`[ModeService] 모드 필터링 후 카드 수: ${filteredCards.length}`);
      
      return filteredCards;
    } catch (error) {
      console.error('[ModeService] 카드 가져오기 오류:', error);
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
  configureSearchMode(
    query: string,
    searchType: SearchType,
    caseSensitive: boolean,
    frontmatterKey?: string
  ): void {
    // 검색 모드로 변경
    if (this.currentMode.type !== 'search') {
      this.changeMode('search');
    }
    
    // 검색 모드 설정
    const searchMode = this.searchMode;
    searchMode.setQuery(query);
    searchMode.setSearchType(searchType || 'content', frontmatterKey);
    searchMode.setCaseSensitive(caseSensitive || false);
    
    // 검색 쿼리를 카드 세트로 설정
    searchMode.selectCardSet(query);
  }
  
  /**
   * 이전 모드 가져오기
   * @returns 이전 모드
   */
  getPreviousMode(): ModeType {
    return this.previousMode;
  }
} 