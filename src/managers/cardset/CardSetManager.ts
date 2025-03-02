import { App, TFile } from 'obsidian';
import { ICardService } from '../../core/interfaces/ICardService';
import { ICardSetManager } from '../../core/interfaces/ICardSetManager';
import { ISearchService } from '../../core/interfaces/ISearchService';
import { Card } from '../../core/models/Card';
import { CardSet } from '../../core/models/CardSet';
import { CardSetMode, CardSetOptions, CardSortOption } from '../../core/types/cardset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { getDirectoryPath, getMarkdownFilesInFolder } from '../../utils/helpers/file.helper';
import { ErrorCode } from '../../core/constants/error.constants';

/**
 * 카드셋 관리자 클래스
 * 카드셋 관련 기능을 관리합니다.
 */
export class CardSetManager implements ICardSetManager {
  /**
   * Obsidian 앱 인스턴스
   */
  private app: App;
  
  /**
   * 카드 서비스
   */
  private cardService: ICardService;
  
  /**
   * 검색 서비스
   */
  private searchService: ISearchService;
  
  /**
   * 현재 카드셋
   */
  private currentCardSet: CardSet;
  
  /**
   * 현재 카드셋 모드
   */
  private currentMode: CardSetMode;
  
  /**
   * 카드셋 옵션
   */
  private options: CardSetOptions;
  
  /**
   * 현재 정렬 옵션
   */
  private sortOption: CardSortOption;
  
  /**
   * 카드 캐시
   */
  private cardCache: Map<string, Card>;
  
  /**
   * 카드셋 관리자 생성자
   * @param app Obsidian 앱 인스턴스
   * @param cardService 카드 서비스
   * @param searchService 검색 서비스
   */
  constructor(app: App, cardService: ICardService, searchService: ISearchService) {
    try {
      this.app = app;
      this.cardService = cardService;
      this.searchService = searchService;
      this.cardCache = new Map<string, Card>();
      
      // 기본 옵션 설정
      this.options = {
        mode: CardSetMode.ACTIVE_FOLDER,
        selectedFolderPath: '',
        searchQuery: '',
        sortOption: {
          by: 'file-name',
          direction: 'asc'
        },
        filterOptions: [],
        groupOption: {
          by: 'none'
        },
        includeSubfolders: true,
        includeHiddenFiles: false,
        autoRefresh: true
      };
      
      // 정렬 옵션 설정
      this.sortOption = this.options.sortOption;
      
      // 현재 모드 설정
      this.currentMode = this.options.mode;
      
      // 빈 카드셋으로 초기화
      this.currentCardSet = new CardSet(this.currentMode, '', []);
      
      Log.debug('카드셋 관리자 생성됨');
    } catch (error) {
      ErrorHandler.handleError(
        ErrorCode.INITIALIZATION_ERROR,
        { component: 'CardSetManager' },
        '카드셋 관리자 초기화 중 오류 발생'
      );
      throw error;
    }
  }
  
  /**
   * 카드셋 초기화
   * @param options 카드셋 옵션
   */
  initialize(options?: Partial<CardSetOptions>): void {
    try {
      // 옵션 설정
      if (options) {
        this.setOptions(options);
      }
      
      // 이벤트 핸들러 등록
      this.registerEventHandlers();
      
      // 초기 카드셋 로드
      this.updateCardSet(true);
      
      Log.debug('카드셋 관리자가 초기화되었습니다.');
    } catch (error) {
      ErrorHandler.handleError(
        ErrorCode.INITIALIZATION_ERROR,
        { options },
        `카드셋 초기화 중 오류 발생: ${error.message}`
      );
    }
  }
  
  /**
   * 카드셋 모드 설정
   * @param mode 카드셋 모드
   * @param options 모드별 옵션
   */
  async setMode(mode: CardSetMode, options?: Partial<CardSetOptions>): Promise<void> {
    try {
      // 이전 모드 저장
      const previousMode = this.currentMode;
      
      // 새 모드 설정
      this.currentMode = mode;
      
      // 옵션 업데이트
      if (options) {
        this.options = { ...this.options, ...options };
        
        // 모드별 특정 옵션 설정
        switch (mode) {
          case CardSetMode.SELECTED_FOLDER:
            this.options.selectedFolderPath = options.selectedFolderPath || this.options.selectedFolderPath;
            break;
          case CardSetMode.SEARCH_RESULT:
            this.options.searchQuery = options.searchQuery || this.options.searchQuery;
            break;
        }
      }
      
      // 모드 변경 시 카드셋 업데이트
      await this.updateCardSet(true);
      
      Log.debug(`카드셋 모드 변경됨: ${previousMode} -> ${this.currentMode}`);
    } catch (error) {
      ErrorHandler.handleError(
        ErrorCode.OPERATION_FAILED,
        { mode },
        `카드셋 모드 변경 중 오류 발생: ${error.message}`
      );
      throw error;
    }
  }
  
  /**
   * 현재 카드셋 모드 가져오기
   * @returns 카드셋 모드
   */
  getMode(): CardSetMode {
    return this.currentMode;
  }
  
  /**
   * 현재 카드셋 가져오기
   * @returns 카드셋
   */
  getCurrentCardSet(): ICardSet {
    return this.currentCardSet;
  }
  
  /**
   * 카드셋 업데이트
   * @param forceRefresh 강제 새로고침 여부
   */
  async updateCardSet(forceRefresh: boolean = false): Promise<void> {
    try {
      // 모드에 따라 카드셋 로드
      switch (this.currentMode) {
        case CardSetMode.ACTIVE_FOLDER:
          await this.loadActiveFolder();
          break;
        case CardSetMode.SELECTED_FOLDER:
          await this.loadSelectedFolder(this.options.selectedFolderPath);
          break;
        case CardSetMode.VAULT:
          await this.loadVault();
          break;
        case CardSetMode.SEARCH_RESULT:
          if (this.options.searchQuery) {
            await this.loadSearchResults(this.options.searchQuery);
          }
          break;
      }
    } catch (error: any) {
      console.error(`${ErrorCode.CARDSET_REFRESH_ERROR}: ${error.message}`, error);
    }
  }
  
  /**
   * 카드 추가
   * @param file 파일
   * @returns 추가된 카드
   */
  async addCard(file: TFile): Promise<Card> {
    try {
      Log.debug(`카드 추가: ${file.path}`);
      
      // 카드 생성
      const card = await this.cardService.createCardFromFile(file);
      
      // 카드 캐시에 추가
      this.cardCache.set(card.id, card);
      
      // 카드셋에 파일 추가
      this.currentCardSet = this.currentCardSet.addFile(file);
      
      return card;
    } catch (error) {
      ErrorHandler.handleError(`카드 추가 중 오류 발생: ${file.path}`, error);
      throw error;
    }
  }
  
  /**
   * 카드 제거
   * @param cardId 카드 ID
   * @returns 제거 성공 여부
   */
  removeCard(cardId: string): boolean {
    try {
      Log.debug(`카드 제거: ${cardId}`);
      
      // 카드 캐시에서 제거
      this.cardCache.delete(cardId);
      
      // 카드셋에서 파일 제거
      const previousSize = this.currentCardSet.getFileCount();
      this.currentCardSet = this.currentCardSet.removeFile(cardId);
      
      return previousSize > this.currentCardSet.getFileCount();
    } catch (error) {
      ErrorHandler.handleError(`카드 제거 중 오류 발생: ${cardId}`, error);
      return false;
    }
  }
  
  /**
   * 카드 가져오기
   * @param cardId 카드 ID
   * @returns 카드
   */
  getCard(cardId: string): Card | null {
    try {
      // 캐시에서 카드 확인
      const cachedCard = this.cardCache.get(cardId);
      if (cachedCard) {
        return cachedCard;
      }
      
      // 카드셋에서 파일 찾기
      const file = this.currentCardSet.files.find(f => f.path === cardId);
      if (!file) {
        return null;
      }
      
      // 비동기 작업이지만 동기 메서드에서는 캐시된 결과만 반환
      // 실제 카드는 비동기적으로 생성하여 캐시에 저장
      this.cardService.createCardFromFile(file)
        .then(card => this.cardCache.set(cardId, card))
        .catch(error => ErrorHandler.handleError(`카드 생성 중 오류 발생: ${cardId}`, error));
      
      return null;
    } catch (error) {
      ErrorHandler.handleError(`카드 가져오기 중 오류 발생: ${cardId}`, error);
      return null;
    }
  }
  
  /**
   * 모든 카드 가져오기
   * @returns 카드 배열
   */
  getAllCards(): Card[] {
    try {
      const cards: Card[] = [];
      
      // 모든 파일에 대해 카드 가져오기
      for (const file of this.currentCardSet.files) {
        const card = this.getCard(file.path);
        if (card) {
          cards.push(card);
        }
      }
      
      return cards;
    } catch (error) {
      ErrorHandler.handleError('모든 카드 가져오기 중 오류 발생', error);
      return [];
    }
  }
  
  /**
   * 카드 필터링
   * @param filterFn 필터 함수
   * @returns 필터링된 카드 배열
   */
  filterCards(filterFn: (card: Card) => boolean): Card[] {
    try {
      // 모든 카드 가져오기
      const allCards = this.getAllCards();
      
      // 필터 적용
      return allCards.filter(filterFn);
    } catch (error) {
      ErrorHandler.handleError('카드 필터링 중 오류 발생', error);
      return [];
    }
  }
  
  /**
   * 카드셋 정렬
   * @param sortOption 정렬 옵션
   */
  sortCardSet(sortOption: CardSortOption): void {
    try {
      // 정렬 옵션 저장
      this.sortOption = sortOption;
      
      // 파일이 없는 경우 무시
      if (!this.currentCardSet || !this.currentCardSet.files || this.currentCardSet.files.length === 0) {
        return;
      }
      
      // 정렬 함수 생성
      const sortFn = this.createSortFunction(sortOption);
      
      // 파일 정렬
      const sortedFiles = [...this.currentCardSet.files].sort(sortFn);
      
      // 정렬된 파일로 카드셋 업데이트
      this.currentCardSet.files = sortedFiles;
      
      Log.debug(`카드셋 정렬됨: ${sortOption.by}, ${sortOption.direction}`);
    } catch (error) {
      ErrorHandler.handleError(
        ErrorCode.OPERATION_FAILED,
        { sortOption },
        `카드셋 정렬 중 오류 발생: ${error.message}`
      );
    }
  }
  
  /**
   * 정렬 함수 생성
   * @param sortOption 정렬 옵션
   * @returns 정렬 함수
   */
  private createSortFunction(sortOption: CardSortOption): (a: TFile, b: TFile) => number {
    const { by, direction } = sortOption;
    const directionMultiplier = direction === 'asc' ? 1 : -1;
    
    return (a: TFile, b: TFile) => {
      let result = 0;
      
      switch (by) {
        case 'file-name':
          result = a.basename.localeCompare(b.basename);
          break;
        
        case 'created-time':
          result = a.stat.ctime - b.stat.ctime;
          break;
        
        case 'modified-time':
          result = a.stat.mtime - b.stat.mtime;
          break;
        
        case 'file-size':
          result = a.stat.size - b.stat.size;
          break;
        
        case 'custom-field':
          // 사용자 정의 필드 정렬은 메타데이터 캐시를 사용하여 구현
          if (sortOption.customField) {
            const fieldName = sortOption.customField;
            const metadataA = this.app.metadataCache.getFileCache(a)?.frontmatter?.[fieldName];
            const metadataB = this.app.metadataCache.getFileCache(b)?.frontmatter?.[fieldName];
            
            if (metadataA !== undefined && metadataB !== undefined) {
              if (typeof metadataA === 'string' && typeof metadataB === 'string') {
                result = metadataA.localeCompare(metadataB);
              } else if (typeof metadataA === 'number' && typeof metadataB === 'number') {
                result = metadataA - metadataB;
              } else if (metadataA instanceof Date && metadataB instanceof Date) {
                result = metadataA.getTime() - metadataB.getTime();
              }
            } else if (metadataA !== undefined) {
              result = -1;
            } else if (metadataB !== undefined) {
              result = 1;
            }
          }
          break;
      }
      
      return result * directionMultiplier;
    };
  }
  
  /**
   * 카드셋 검색
   * @param query 검색 쿼리
   * @returns 검색 결과 카드 배열
   */
  async searchCards(query: string): Promise<Card[]> {
    try {
      Log.debug(`카드셋 검색: ${query}`);
      
      // 검색 결과 파일 가져오기
      const files = await this.searchFiles(query);
      
      // 카드 생성
      const cards: Card[] = [];
      
      for (const file of files) {
        try {
          const card = await this.cardService.createCardFromFile(file);
          cards.push(card);
          
          // 카드 캐시에 추가
          this.cardCache.set(card.id, card);
        } catch (error) {
          ErrorHandler.handleError(`검색 결과 카드 생성 중 오류 발생: ${file.path}`, error);
        }
      }
      
      return cards;
    } catch (error) {
      ErrorHandler.handleError(`카드셋 검색 중 오류 발생: ${query}`, error);
      return [];
    }
  }
  
  /**
   * 카드셋 옵션 가져오기
   * @returns 카드셋 옵션
   */
  getOptions(): CardSetOptions {
    return { ...this.options };
  }
  
  /**
   * 카드셋 옵션 설정
   * @param options 카드셋 옵션
   */
  setOptions(options: Partial<CardSetOptions>): void {
    try {
      // 이전 옵션 저장
      const previousOptions = { ...this.options };
      
      // 새 옵션으로 업데이트
      this.options = { ...this.options, ...options };
      
      // 모드가 변경된 경우 모드 업데이트
      if (options.mode && options.mode !== previousOptions.mode) {
        this.currentMode = options.mode;
      }
      
      // 정렬 옵션이 변경된 경우 정렬 업데이트
      if (options.sortOption && 
          (options.sortOption.by !== previousOptions.sortOption.by || 
           options.sortOption.direction !== previousOptions.sortOption.direction)) {
        this.sortOption = options.sortOption;
      }
      
      Log.debug('카드셋 옵션이 업데이트되었습니다.');
    } catch (error) {
      ErrorHandler.handleError(
        ErrorCode.OPERATION_FAILED,
        { options },
        `카드셋 옵션 설정 중 오류 발생: ${error.message}`
      );
    }
  }
  
  /**
   * 카드셋 파괴
   */
  destroy(): void {
    try {
      // 이벤트 리스너 제거
      this.unregisterEventHandlers();
      
      // 카드셋 초기화
      this.currentCardSet = new CardSet(CardSetMode.ACTIVE_FOLDER, null, []);
      
      // 카드 캐시 초기화
      this.cardCache.clear();
      
      Log.debug('카드셋 관리자가 파괴되었습니다.');
    } catch (error) {
      ErrorHandler.handleError(
        ErrorCode.OPERATION_FAILED,
        {},
        `카드셋 파괴 중 오류 발생: ${error.message}`
      );
    }
  }
  
  /**
   * 현재 카드셋 타입 가져오기
   * @returns 현재 카드셋 타입
   */
  getCardSetType(): CardSetMode {
    return this.currentMode;
  }
  
  /**
   * 활성 폴더에서 카드셋 로드
   */
  async loadActiveFolder(): Promise<void> {
    try {
      // 현재 활성 파일 가져오기
      const activeFile = this.app.workspace.getActiveFile();
      
      if (!activeFile) {
        // 활성 파일이 없으면 빈 카드셋 생성
        this.currentCardSet = new CardSet(CardSetMode.ACTIVE_FOLDER, null, []);
        return;
      }
      
      // 활성 파일의 폴더 경로 가져오기
      const folderPath = getDirectoryPath(activeFile.path);
      
      // 폴더 내 마크다운 파일 가져오기
      const files = await this.getMarkdownFilesInFolder(folderPath, this.options.includeSubfolders);
      
      // 카드셋 업데이트
      this.currentCardSet = new CardSet(CardSetMode.ACTIVE_FOLDER, folderPath, files);
      this.currentMode = CardSetMode.ACTIVE_FOLDER;
    } catch (error: any) {
      console.error(`${ErrorCode.CARDSET_LOAD_ERROR}: ${error.message}`, error);
      // 오류 발생 시 빈 카드셋 생성
      this.currentCardSet = new CardSet(CardSetMode.ACTIVE_FOLDER, null, []);
    }
  }
  
  /**
   * 선택된 폴더에서 카드셋 로드
   * @param folderPath 폴더 경로
   */
  async loadSelectedFolder(folderPath: string): Promise<void> {
    try {
      if (!folderPath) {
        throw new Error('폴더 경로가 지정되지 않았습니다.');
      }
      
      // 폴더 내 마크다운 파일 가져오기
      const files = await this.getMarkdownFilesInFolder(folderPath, this.options.includeSubfolders);
      
      // 카드셋 업데이트
      this.currentCardSet = new CardSet(CardSetMode.SELECTED_FOLDER, folderPath, files);
      this.currentMode = CardSetMode.SELECTED_FOLDER;
      this.options.selectedFolderPath = folderPath;
    } catch (error: any) {
      console.error(`${ErrorCode.CARDSET_LOAD_ERROR}: ${error.message}`, error);
      // 오류 발생 시 빈 카드셋 생성
      this.currentCardSet = new CardSet(CardSetMode.SELECTED_FOLDER, folderPath, []);
    }
  }
  
  /**
   * 볼트 전체에서 카드셋 로드
   */
  async loadVault(): Promise<void> {
    try {
      // 볼트 내 모든 마크다운 파일 가져오기
      const allFiles = this.app.vault.getMarkdownFiles();
      
      // 필터링 옵션에 따라 파일 필터링
      const filteredFiles = allFiles.filter(file => this.shouldIncludeFile(file));
      
      // 카드셋 업데이트
      this.currentCardSet = new CardSet(CardSetMode.VAULT, 'vault', filteredFiles);
      this.currentMode = CardSetMode.VAULT;
    } catch (error: any) {
      console.error(`${ErrorCode.CARDSET_LOAD_ERROR}: ${error.message}`, error);
      // 오류 발생 시 빈 카드셋 생성
      this.currentCardSet = new CardSet(CardSetMode.VAULT, null, []);
    }
  }
  
  /**
   * 검색 결과로 카드셋 로드
   * @param query 검색 쿼리
   * @returns 로드된 카드셋
   */
  async loadSearchResults(query: string): Promise<CardSet> {
    try {
      // 검색 쿼리가 비어있는 경우 빈 카드셋 반환
      if (!query.trim()) {
        return new CardSet(`search-${Date.now()}`, CardSetMode.SEARCH_RESULT, query, []);
      }
      
      // 모든 마크다운 파일 가져오기
      const allFiles = this.app.vault.getMarkdownFiles();
      
      // 검색 서비스를 사용하여 검색 수행
      const searchResults = await this.searchService.searchFiles(allFiles, query);
      
      // 현재 모드를 검색 결과로 설정
      this.currentMode = CardSetMode.SEARCH_RESULT;
      
      // 검색 결과 카드셋 생성
      const cardSet = new CardSet(
        `search-${Date.now()}`,
        CardSetMode.SEARCH_RESULT,
        query,
        searchResults
      );
      
      // 현재 카드셋 업데이트
      this.currentCardSet = cardSet;
      
      return cardSet;
    } catch (error) {
      ErrorHandler.handleError(
        ErrorCode.SEARCH_ERROR,
        { query },
        `검색 결과 카드셋 로드 중 오류 발생: ${error.message}`
      );
      
      // 오류 발생 시 빈 카드셋 반환
      return new CardSet(`search-error-${Date.now()}`, CardSetMode.SEARCH_RESULT, query, []);
    }
  }
  
  /**
   * 카드셋 새로고침
   */
  async refreshCardSet(): Promise<void> {
    try {
      // 모드에 따라 카드셋 새로고침
      switch (this.currentMode) {
        case CardSetMode.ACTIVE_FOLDER:
          await this.loadActiveFolder();
          break;
        case CardSetMode.SELECTED_FOLDER:
          await this.loadSelectedFolder(this.options.selectedFolderPath);
          break;
        case CardSetMode.VAULT:
          await this.loadVault();
          break;
        case CardSetMode.SEARCH_RESULT:
          if (this.options.searchQuery) {
            await this.loadSearchResults(this.options.searchQuery);
          }
          break;
      }
    } catch (error: any) {
      console.error(`${ErrorCode.CARDSET_REFRESH_ERROR}: ${error.message}`, error);
    }
  }
  
  /**
   * 파일 변경 처리
   * @param file 변경된 파일 또는 null
   */
  async handleFileChange(file: TFile | null): Promise<void> {
    // 활성 폴더 모드이고 파일이 있는 경우에만 처리
    if (this.currentMode === CardSetMode.ACTIVE_FOLDER && file) {
      await this.loadActiveFolder();
    }
  }
  
  /**
   * 카드셋 필터링
   * @param filter 필터 함수
   */
  filterCardSet(filter: (file: TFile) => boolean): void {
    try {
      // 파일이 없는 경우 무시
      if (!this.currentCardSet || !this.currentCardSet.files || this.currentCardSet.files.length === 0) {
        return;
      }
      
      // 필터링 적용
      const filteredFiles = this.currentCardSet.files.filter(filter);
      
      // 필터링된 파일로 카드셋 업데이트
      this.currentCardSet.files = filteredFiles;
      
      Log.debug(`카드셋 필터링 적용됨: ${filteredFiles.length}개 파일 남음`);
    } catch (error) {
      ErrorHandler.handleError(
        ErrorCode.OPERATION_FAILED,
        {},
        `카드셋 필터링 중 오류 발생: ${error.message}`
      );
    }
  }
  
  /**
   * 이벤트 핸들러 해제
   */
  private unregisterEventHandlers(): void {
    try {
      // 파일 생성 이벤트
      this.app.vault.off('create', this.handleFileCreate.bind(this));
      
      // 파일 수정 이벤트
      this.app.vault.off('modify', this.handleFileModify.bind(this));
      
      // 파일 삭제 이벤트
      this.app.vault.off('delete', this.handleFileDelete.bind(this));
      
      // 파일 이름 변경 이벤트
      this.app.vault.off('rename', this.handleFileRename.bind(this));
      
      // 활성 파일 변경 이벤트
      this.app.workspace.off('file-open', this.handleFileOpen.bind(this));
    } catch (error) {
      ErrorHandler.handleError(
        ErrorCode.EVENT_HANDLER_ERROR,
        {},
        `이벤트 리스너 해제 중 오류 발생: ${error.message}`
      );
    }
  }
  
  /**
   * 파일 생성 이벤트 핸들러
   * @param file 생성된 파일
   */
  private handleFileCreate = (file: TFile): void => {
    try {
      // 마크다운 파일이 아닌 경우 무시
      if (!(file instanceof TFile) || file.extension !== 'md') {
        return;
      }
      
      // 현재 카드셋에 파일이 포함되어야 하는지 확인
      if (this.shouldIncludeFile(file)) {
        // 카드셋에 파일 추가
        this.addCard(file);
      }
    } catch (error) {
      ErrorHandler.handleError(`파일 생성 이벤트 처리 중 오류 발생: ${file.path}`, error);
    }
  };
  
  /**
   * 파일 수정 이벤트 핸들러
   * @param file 수정된 파일
   */
  private handleFileModify = (file: TFile): void => {
    try {
      // 마크다운 파일이 아닌 경우 무시
      if (!(file instanceof TFile) || file.extension !== 'md') {
        return;
      }
      
      // 현재 카드셋에 파일이 포함되어 있는지 확인
      if (this.currentCardSet.containsFile(file.path)) {
        // 카드 캐시에서 제거하여 다시 로드되도록 함
        this.cardCache.delete(file.path);
        
        // 카드셋 파일 업데이트
        this.currentCardSet = this.currentCardSet.updateFile(file);
      }
    } catch (error) {
      ErrorHandler.handleError(`파일 수정 이벤트 처리 중 오류 발생: ${file.path}`, error);
    }
  };
  
  /**
   * 파일 삭제 이벤트 핸들러
   * @param file 삭제된 파일
   */
  private handleFileDelete = (file: TFile): void => {
    try {
      // 마크다운 파일이 아닌 경우 무시
      if (!(file instanceof TFile) || file.extension !== 'md') {
        return;
      }
      
      // 현재 카드셋에 파일이 포함되어 있는지 확인
      if (this.currentCardSet.containsFile(file.path)) {
        // 카드 제거
        this.removeCard(file.path);
      }
    } catch (error) {
      ErrorHandler.handleError(`파일 삭제 이벤트 처리 중 오류 발생: ${file.path}`, error);
    }
  };
  
  /**
   * 파일 이름 변경 이벤트 핸들러
   * @param file 이름이 변경된 파일
   * @param oldPath 이전 경로
   */
  private handleFileRename = (file: TFile, oldPath: string): void => {
    try {
      // 마크다운 파일이 아닌 경우 무시
      if (!(file instanceof TFile) || file.extension !== 'md') {
        return;
      }
      
      // 이전 경로가 현재 카드셋에 포함되어 있는지 확인
      if (this.currentCardSet.containsFile(oldPath)) {
        // 이전 카드 제거
        this.removeCard(oldPath);
        
        // 새 경로가 현재 카드셋에 포함되어야 하는지 확인
        if (this.shouldIncludeFile(file)) {
          // 새 카드 추가
          this.addCard(file);
        }
      }
      // 이전 경로는 포함되어 있지 않지만 새 경로가 포함되어야 하는 경우
      else if (this.shouldIncludeFile(file)) {
        // 새 카드 추가
        this.addCard(file);
      }
    } catch (error) {
      ErrorHandler.handleError(`파일 이름 변경 이벤트 처리 중 오류 발생: ${oldPath} -> ${file.path}`, error);
    }
  };
  
  /**
   * 파일 열기 이벤트 핸들러
   * @param file 열린 파일
   */
  private handleFileOpen = (file: TFile | null): void => {
    try {
      // 활성 폴더 모드가 아닌 경우 무시
      if (this.currentMode !== CardSetMode.ACTIVE_FOLDER) {
        return;
      }
      
      // 파일이 없거나 마크다운 파일이 아닌 경우 무시
      if (!file || !(file instanceof TFile) || file.extension !== 'md') {
        return;
      }
      
      // 현재 활성 폴더 경로 가져오기
      const folderPath = file.parent?.path || '';
      
      // 현재 카드셋의 소스와 다른 경우에만 업데이트
      if (this.currentCardSet.source !== folderPath) {
        // 활성 폴더 로드
        this.loadActiveFolder();
      }
    } catch (error) {
      ErrorHandler.handleError('파일 열기 이벤트 처리 중 오류 발생', error);
    }
  };
  
  /**
   * 파일이 현재 카드셋에 포함되어야 하는지 확인
   * @param file 확인할 파일
   * @returns 포함 여부
   */
  private shouldIncludeFile(file: TFile): boolean {
    try {
      // 마크다운 파일이 아닌 경우 제외
      if (!(file instanceof TFile) || file.extension !== 'md') {
        return false;
      }
      
      // 숨김 파일 처리
      if (!this.options.includeHiddenFiles && file.path.startsWith('.')) {
        return false;
      }
      
      // 모드별 처리
      switch (this.currentMode) {
        case CardSetMode.ACTIVE_FOLDER:
          // 활성 폴더 모드에서는 활성 파일의 폴더에 있는 파일만 포함
          const activeFile = this.app.workspace.getActiveFile();
          if (!activeFile) return false;
          
          const activeFolder = getDirectoryPath(activeFile.path);
          const fileFolder = getDirectoryPath(file.path);
          
          // 같은 폴더이거나, 하위 폴더 포함 옵션이 켜져 있고 하위 폴더인 경우
          return fileFolder === activeFolder || 
                (this.options.includeSubfolders && fileFolder.startsWith(activeFolder + '/'));
        
        case CardSetMode.SELECTED_FOLDER:
          // 선택된 폴더 모드에서는 선택된 폴더에 있는 파일만 포함
          const selectedFolder = this.options.selectedFolderPath;
          if (!selectedFolder) return false;
          
          const filePath = file.path;
          const fileDir = getDirectoryPath(filePath);
          
          // 같은 폴더이거나, 하위 폴더 포함 옵션이 켜져 있고 하위 폴더인 경우
          return fileDir === selectedFolder || 
                (this.options.includeSubfolders && fileDir.startsWith(selectedFolder + '/'));
        
        case CardSetMode.VAULT:
          // 볼트 모드에서는 모든 마크다운 파일 포함 (필터링 옵션에 따라 달라질 수 있음)
          return true;
        
        case CardSetMode.SEARCH_RESULT:
          // 검색 결과 모드에서는 검색 쿼리에 일치하는 파일만 포함
          // 이 경우 동적으로 결정되므로 여기서는 false 반환
          return false;
        
        default:
          return false;
      }
    } catch (error) {
      console.error('파일 포함 여부 확인 중 오류 발생:', error);
      return false;
    }
  }
  
  /**
   * 파일 경로에서 폴더 경로 추출
   * @param filePath 파일 경로
   * @returns 폴더 경로
   */
  private getFolderPathFromFilePath(filePath: string): string {
    const lastSlashIndex = filePath.lastIndexOf('/');
    if (lastSlashIndex === -1) {
      return '';
    }
    return filePath.substring(0, lastSlashIndex);
  }
  
  /**
   * 폴더 내 마크다운 파일 가져오기
   * @param folderPath 폴더 경로
   * @param includeSubfolders 하위 폴더 포함 여부
   * @returns 마크다운 파일 배열
   */
  private async getMarkdownFilesInFolder(folderPath: string, includeSubfolders: boolean): Promise<TFile[]> {
    try {
      // 폴더 경로가 비어있는 경우 빈 배열 반환
      if (!folderPath) {
        return [];
      }
      
      // 파일 헬퍼 사용하여 마크다운 파일 가져오기
      return getMarkdownFilesInFolder(this.app, folderPath, includeSubfolders);
    } catch (error) {
      ErrorHandler.handleError(
        ErrorCode.FILE_ACCESS_ERROR,
        { folderPath },
        `폴더 내 마크다운 파일 가져오기 중 오류 발생: ${error.message}`
      );
      return [];
    }
  }
  
  /**
   * 파일 검색
   * @param query 검색 쿼리
   * @returns 검색 결과 파일 배열
   */
  private async searchFiles(query: string): Promise<TFile[]> {
    try {
      // 검색 결과 파일 배열
      const files: TFile[] = [];
      
      // 검색 쿼리가 비어있는 경우 빈 배열 반환
      if (!query.trim()) {
        return files;
      }
      
      // 메타데이터 캐시에서 파일 검색
      const searchResults = this.app.metadataCache.getFileCache();
      
      // 검색 결과가 없는 경우 빈 배열 반환
      if (!searchResults) {
        return files;
      }
      
      // 검색 쿼리를 소문자로 변환
      const lowerQuery = query.toLowerCase();
      
      // 모든 마크다운 파일 가져오기
      const markdownFiles = this.app.vault.getMarkdownFiles();
      
      // 파일 필터링
      for (const file of markdownFiles) {
        // 파일 캐시 가져오기
        const cache = this.app.metadataCache.getFileCache(file);
        
        // 캐시가 없는 경우 다음 파일로
        if (!cache) {
          continue;
        }
        
        // 파일 내용 가져오기
        const content = await this.app.vault.cachedRead(file);
        
        // 파일 이름, 경로, 내용, 태그, 헤딩 등에서 검색
        const matchesFileName = file.basename.toLowerCase().includes(lowerQuery);
        const matchesPath = file.path.toLowerCase().includes(lowerQuery);
        const matchesContent = content.toLowerCase().includes(lowerQuery);
        const matchesTags = cache.tags?.some(tag => tag.tag.toLowerCase().includes(lowerQuery)) || false;
        const matchesHeadings = cache.headings?.some(heading => heading.heading.toLowerCase().includes(lowerQuery)) || false;
        
        // 하나라도 일치하는 경우 결과에 추가
        if (matchesFileName || matchesPath || matchesContent || matchesTags || matchesHeadings) {
          files.push(file);
        }
      }
      
      return files;
    } catch (error) {
      ErrorHandler.handleError(`파일 검색 중 오류 발생: ${query}`, error);
      return [];
    }
  }

  /**
   * 현재 정렬 옵션 가져오기
   * @returns 정렬 옵션
   */
  getSortOption(): CardSortOption {
    return { ...this.sortOption };
  }

  /**
   * 카드셋에 파일 추가
   * @param file 파일
   * @returns 추가 성공 여부
   */
  async addFile(file: TFile): Promise<boolean> {
    try {
      // 파일이 이미 카드셋에 있는지 확인
      const isFileAlreadyInCardSet = this.currentCardSet.files.some(f => f.path === file.path);
      
      // 이미 있는 경우 무시
      if (isFileAlreadyInCardSet) {
        return false;
      }
      
      // 파일이 현재 카드셋에 포함되어야 하는지 확인
      if (!this.shouldIncludeFile(file)) {
        return false;
      }
      
      // 파일 추가
      this.currentCardSet.files.push(file);
      
      // 정렬 적용
      if (this.sortOption) {
        this.sortCardSet(this.sortOption);
      }
      
      return true;
    } catch (error) {
      ErrorHandler.handleError(
        ErrorCode.OPERATION_FAILED,
        { filePath: file.path },
        `카드셋에 파일 추가 중 오류 발생: ${error.message}`
      );
      return false;
    }
  }
  
  /**
   * 카드셋에서 파일 제거
   * @param filePath 파일 경로
   * @returns 제거 성공 여부
   */
  removeFile(filePath: string): boolean {
    try {
      // 파일 인덱스 찾기
      const fileIndex = this.currentCardSet.files.findIndex(file => file.path === filePath);
      
      // 파일이 없는 경우
      if (fileIndex === -1) {
        return false;
      }
      
      // 파일 제거
      this.currentCardSet.files.splice(fileIndex, 1);
      
      return true;
    } catch (error) {
      ErrorHandler.handleError(
        ErrorCode.OPERATION_FAILED,
        { filePath },
        `카드셋에서 파일 제거 중 오류 발생: ${error.message}`
      );
      return false;
    }
  }
} 