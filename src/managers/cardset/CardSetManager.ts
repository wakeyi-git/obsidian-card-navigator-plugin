import { App, TFile, TFolder } from 'obsidian';
import { ICardService } from '../../core/interfaces/ICardService';
import { ICardSetManager } from '../../core/interfaces/ICardSetManager';
import { Card } from '../../core/models/Card';
import { CardSet } from '../../core/models/CardSet';
import { CardSetMode, CardSetOptions, CardSortOption } from '../../core/types/cardset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { getDirectoryPath, getMarkdownFilesFromFolder } from '../../utils/helpers/file.helper';

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
   * @param cardService 카드 서비스 인스턴스
   */
  constructor(app: App, cardService: ICardService) {
    try {
      this.app = app;
      this.cardService = cardService;
      this.cardCache = new Map<string, Card>();
      
      // 기본 옵션 설정
      this.options = {
        mode: 'active-folder',
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
      ErrorHandler.handleError('카드셋 관리자 생성 중 오류 발생', error);
    }
  }
  
  /**
   * 카드셋 초기화
   * @param options 카드셋 옵션
   */
  initialize(options?: Partial<CardSetOptions>): void {
    try {
      Log.debug('카드셋 관리자 초기화');
      
      // 옵션 병합
      if (options) {
        this.options = {
          ...this.options,
          ...options
        };
      }
      
      // 정렬 옵션 설정
      this.sortOption = this.options.sortOption;
      
      // 이벤트 리스너 등록
      this.registerEventListeners();
      
      // 초기 카드셋 로드
      this.setMode(this.options.mode);
    } catch (error) {
      ErrorHandler.handleError('카드셋 관리자 초기화 중 오류 발생', error);
    }
  }
  
  /**
   * 카드셋 모드 설정
   * @param mode 카드셋 모드
   * @param options 모드별 옵션
   */
  async setMode(mode: CardSetMode, options?: any): Promise<void> {
    try {
      Log.debug(`카드셋 모드 설정: ${mode}`);
      
      this.currentMode = mode;
      this.options.mode = mode;
      
      // 모드별 옵션 처리
      if (options) {
        switch (mode) {
          case 'selected-folder':
            this.options.selectedFolderPath = options.folderPath || this.options.selectedFolderPath;
            break;
          case 'search-results':
            this.options.searchQuery = options.searchQuery || this.options.searchQuery;
            break;
        }
      }
      
      // 카드셋 업데이트
      await this.updateCardSet(true);
    } catch (error) {
      ErrorHandler.handleError(`카드셋 모드 설정 중 오류 발생: ${mode}`, error);
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
  getCurrentCardSet(): CardSet {
    return this.currentCardSet;
  }
  
  /**
   * 카드셋 업데이트
   * @param forceRefresh 강제 새로고침 여부
   */
  async updateCardSet(forceRefresh: boolean = false): Promise<void> {
    try {
      Log.debug(`카드셋 업데이트 (강제 새로고침: ${forceRefresh})`);
      
      switch (this.currentMode) {
        case 'active-folder':
          await this.loadActiveFolder();
          break;
        case 'selected-folder':
          if (this.options.selectedFolderPath) {
            await this.loadSelectedFolder(this.options.selectedFolderPath);
          }
          break;
        case 'vault':
          await this.loadVault();
          break;
        case 'search-results':
          if (this.options.searchQuery) {
            await this.loadSearchResults(this.options.searchQuery);
          }
          break;
      }
      
      // 정렬 적용
      this.sortCards(this.sortOption);
    } catch (error) {
      ErrorHandler.handleError('카드셋 업데이트 중 오류 발생', error);
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
   * 카드 정렬
   * @param sortOption 정렬 옵션
   */
  sortCards(sortOption: CardSortOption): void {
    try {
      Log.debug(`카드 정렬: ${sortOption.by}, ${sortOption.direction}`);
      
      // 정렬 옵션 저장
      this.sortOption = sortOption;
      this.options.sortOption = sortOption;
      
      // 정렬 함수 생성
      const compareFn = this.createSortFunction(sortOption);
      
      // 카드셋 정렬
      this.currentCardSet = this.currentCardSet.sortFiles(compareFn);
    } catch (error) {
      ErrorHandler.handleError('카드 정렬 중 오류 발생', error);
    }
  }
  
  /**
   * 현재 정렬 옵션 가져오기
   * @returns 정렬 옵션
   */
  getSortOption(): CardSortOption {
    return this.sortOption;
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
    return this.options;
  }
  
  /**
   * 카드셋 옵션 설정
   * @param options 카드셋 옵션
   */
  setOptions(options: Partial<CardSetOptions>): void {
    try {
      Log.debug('카드셋 옵션 설정');
      
      // 옵션 병합
      this.options = {
        ...this.options,
        ...options
      };
      
      // 정렬 옵션 업데이트
      if (options.sortOption) {
        this.sortOption = options.sortOption;
      }
      
      // 모드가 변경된 경우 카드셋 업데이트
      if (options.mode && options.mode !== this.currentMode) {
        this.setMode(options.mode);
      }
    } catch (error) {
      ErrorHandler.handleError('카드셋 옵션 설정 중 오류 발생', error);
    }
  }
  
  /**
   * 카드셋 파괴
   */
  destroy(): void {
    try {
      Log.debug('카드셋 관리자 파괴');
      
      // 이벤트 리스너 제거
      this.unregisterEventListeners();
      
      // 캐시 정리
      this.cardCache.clear();
    } catch (error) {
      ErrorHandler.handleError('카드셋 관리자 파괴 중 오류 발생', error);
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
          // 사용자 정의 필드는 추가 구현 필요
          result = 0;
          break;
      }
      
      return result * directionMultiplier;
    };
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
        this.currentCardSet = new CardSet('active-folder', [], null);
        return;
      }
      
      // 활성 파일의 폴더 경로 가져오기
      const folderPath = this.getFolderPathFromFilePath(activeFile.path);
      
      // 폴더 내 마크다운 파일 가져오기
      const files = await this.getMarkdownFilesInFolder(folderPath, this.options.includeSubfolders);
      
      // 카드셋 업데이트
      this.currentCardSet = new CardSet('active-folder', folderPath, files);
      this.currentMode = 'active-folder';
    } catch (error: any) {
      console.error(`${ErrorCode.CARDSET_LOAD_ERROR}: ${error.message}`, error);
      // 오류 발생 시 빈 카드셋 생성
      this.currentCardSet = new CardSet('active-folder', [], null);
    }
  }
  
  /**
   * 선택된 폴더에서 카드셋 로드
   * @param folderPath 폴더 경로
   */
  async loadSelectedFolder(folderPath: string): Promise<void> {
    try {
      // 폴더 내 마크다운 파일 가져오기
      const files = await this.getMarkdownFilesInFolder(folderPath, this.options.includeSubfolders);
      
      // 카드셋 업데이트
      this.currentCardSet = new CardSet('selected-folder', folderPath, files);
      this.currentMode = 'selected-folder';
      this.options.selectedFolderPath = folderPath;
    } catch (error: any) {
      console.error(`${ErrorCode.CARDSET_LOAD_ERROR}: ${error.message}`, error);
      // 오류 발생 시 빈 카드셋 생성
      this.currentCardSet = new CardSet('selected-folder', [], folderPath);
    }
  }
  
  /**
   * 볼트 전체에서 카드셋 로드
   */
  async loadVault(): Promise<void> {
    try {
      // 볼트 내 모든 마크다운 파일 가져오기
      const files = this.app.vault.getMarkdownFiles();
      
      // 숨김 파일 필터링
      const filteredFiles = this.options.includeHiddenFiles
        ? files
        : files.filter(file => !file.path.startsWith('.'));
      
      // 카드셋 업데이트
      this.currentCardSet = new CardSet('vault', 'vault', filteredFiles);
      this.currentMode = 'vault';
    } catch (error: any) {
      console.error(`${ErrorCode.CARDSET_LOAD_ERROR}: ${error.message}`, error);
      // 오류 발생 시 빈 카드셋 생성
      this.currentCardSet = new CardSet('vault', [], null);
    }
  }
  
  /**
   * 검색 결과로 카드셋 로드
   * @param searchTerm 검색어
   */
  async loadSearchResults(searchTerm: string): Promise<void> {
    try {
      // 검색 결과 파일 가져오기
      const files = await this.searchFiles(searchTerm);
      
      // 카드셋 업데이트
      this.currentCardSet = new CardSet('search-results', searchTerm, files);
      this.currentMode = 'search-results';
      this.options.searchQuery = searchTerm;
    } catch (error: any) {
      console.error(`${ErrorCode.CARDSET_SEARCH_ERROR}: ${error.message}`, error);
      // 오류 발생 시 빈 카드셋 생성
      this.currentCardSet = new CardSet('search-results', [], searchTerm);
    }
  }
  
  /**
   * 현재 카드셋 새로고침
   */
  async refreshCardSet(): Promise<void> {
    try {
      switch (this.currentMode) {
        case 'active-folder':
          await this.loadActiveFolder();
          break;
        case 'selected-folder':
          if (this.options.selectedFolderPath) {
            await this.loadSelectedFolder(this.options.selectedFolderPath);
          }
          break;
        case 'vault':
          await this.loadVault();
          break;
        case 'search-results':
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
    if (this.currentMode === 'active-folder' && file) {
      await this.loadActiveFolder();
    }
  }
  
  /**
   * 카드셋 필터링
   * @param filter 필터 함수
   */
  filterCardSet(filter: (file: TFile) => boolean): void {
    this.currentCardSet.filter(filter);
  }
  
  /**
   * 카드셋 정렬
   * @param sortFn 정렬 함수
   */
  sortCardSet(sortFn: (a: TFile, b: TFile) => number): void {
    this.currentCardSet.sort(sortFn);
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    try {
      // 파일 생성 이벤트
      this.app.vault.on('create', this.handleFileCreate);
      
      // 파일 수정 이벤트
      this.app.vault.on('modify', this.handleFileModify);
      
      // 파일 삭제 이벤트
      this.app.vault.on('delete', this.handleFileDelete);
      
      // 파일 이름 변경 이벤트
      this.app.vault.on('rename', this.handleFileRename);
      
      // 활성 파일 변경 이벤트 (활성 폴더 모드에서 사용)
      this.app.workspace.on('file-open', this.handleFileOpen);
    } catch (error) {
      ErrorHandler.handleError('이벤트 리스너 등록 중 오류 발생', error);
    }
  }
  
  /**
   * 이벤트 리스너 제거
   */
  private unregisterEventListeners(): void {
    try {
      // 파일 생성 이벤트
      this.app.vault.off('create', this.handleFileCreate);
      
      // 파일 수정 이벤트
      this.app.vault.off('modify', this.handleFileModify);
      
      // 파일 삭제 이벤트
      this.app.vault.off('delete', this.handleFileDelete);
      
      // 파일 이름 변경 이벤트
      this.app.vault.off('rename', this.handleFileRename);
      
      // 활성 파일 변경 이벤트
      this.app.workspace.off('file-open', this.handleFileOpen);
    } catch (error) {
      ErrorHandler.handleError('이벤트 리스너 제거 중 오류 발생', error);
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
      if (this.currentMode !== 'active-folder') {
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
   * @param file 파일
   * @returns 포함 여부
   */
  private shouldIncludeFile(file: TFile): boolean {
    try {
      // 마크다운 파일이 아닌 경우 제외
      if (!(file instanceof TFile) || file.extension !== 'md') {
        return false;
      }
      
      // 숨김 파일이고 숨김 파일 포함 옵션이 비활성화된 경우 제외
      if (file.path.startsWith('.') && !this.options.includeHiddenFiles) {
        return false;
      }
      
      // 카드셋 모드에 따라 확인
      switch (this.currentMode) {
        case 'active-folder': {
          // 현재 활성 파일 가져오기
          const activeFile = this.app.workspace.getActiveFile();
          
          // 활성 파일이 없는 경우 제외
          if (!activeFile) {
            return false;
          }
          
          // 활성 파일의 폴더 경로 가져오기
          const folderPath = activeFile.parent?.path || '';
          
          // 파일이 활성 폴더에 있는지 확인
          const isInActiveFolder = file.parent?.path === folderPath;
          
          // 하위 폴더 포함 옵션이 활성화된 경우 하위 폴더 확인
          const isInSubfolder = this.options.includeSubfolders && file.path.startsWith(folderPath + '/');
          
          return isInActiveFolder || isInSubfolder;
        }
        
        case 'selected-folder': {
          // 선택된 폴더 경로가 없는 경우 제외
          if (!this.options.selectedFolderPath) {
            return false;
          }
          
          // 파일이 선택된 폴더에 있는지 확인
          const isInSelectedFolder = file.parent?.path === this.options.selectedFolderPath;
          
          // 하위 폴더 포함 옵션이 활성화된 경우 하위 폴더 확인
          const isInSubfolder = this.options.includeSubfolders && 
            file.path.startsWith(this.options.selectedFolderPath + '/');
          
          return isInSelectedFolder || isInSubfolder;
        }
        
        case 'vault':
          // 볼트 모드에서는 모든 마크다운 파일 포함
          return true;
        
        case 'search-results':
          // 검색 결과 모드에서는 검색 쿼리에 일치하는 파일만 포함
          // 이 경우 동적으로 결정되므로 여기서는 false 반환
          return false;
      }
    } catch (error) {
      ErrorHandler.handleError(`파일 포함 여부 확인 중 오류 발생: ${file.path}`, error);
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
      // 폴더 가져오기
      const folder = this.app.vault.getAbstractFileByPath(folderPath);
      
      // 폴더가 없는 경우 빈 배열 반환
      if (!folder || !(folder instanceof TFolder)) {
        return [];
      }
      
      // 파일 헬퍼 사용하여 마크다운 파일 가져오기
      return getMarkdownFilesFromFolder(this.app.vault, folder, includeSubfolders);
    } catch (error) {
      ErrorHandler.handleError(`폴더 내 마크다운 파일 가져오기 중 오류 발생: ${folderPath}`, error);
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
} 