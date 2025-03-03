import { App, TAbstractFile, TFile, Vault } from 'obsidian';
import { ICardSetProvider } from '../../core/interfaces/manager/ICardSetProvider';
import { CardSet } from '../../core/models/CardSet';
import { CardSetMode, CardSetOptions } from '../../core/types/cardset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { generateUniqueId } from '../../utils/helpers/string.helper';
import { EventHandler, PresetEvent } from '../../core/types/event.types';
import { ErrorCode } from '../../core/constants/error.constants';

/**
 * 추상 카드셋 제공자 클래스
 * 모든 카드셋 제공자의 기본 구현을 제공합니다.
 */
export abstract class AbstractCardSetProvider implements ICardSetProvider {
  /**
   * 카드셋 모드
   */
  readonly mode: CardSetMode;
  
  /**
   * 카드셋 옵션
   */
  protected options: CardSetOptions;
  
  /**
   * 현재 카드셋
   */
  protected currentCardSet: CardSet;
  
  /**
   * 변경 구독자 맵
   */
  private changeSubscribers: Map<string, (cardSet: CardSet) => void> = new Map();
  
  /**
   * 이벤트 핸들러 맵
   */
  private eventHandlers: Map<string, () => void> = new Map();

  /**
   * 이벤트 리스너 맵
   */
  private eventListeners: Map<string, Function[]> = new Map();

  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param mode 카드셋 모드
   */
  constructor(protected app: App, mode: CardSetMode) {
    this.mode = mode;
    
    // 기본 옵션 설정
    this.options = {
      mode: mode,
      sortOption: {
        field: 'name',
        direction: 'asc'
      },
      filterOptions: [],
      groupOption: {
        by: 'none'
      },
      includeSubfolders: true,
      showHiddenFiles: false,
      autoRefresh: true
    };
    
    // 빈 카드셋으로 초기화
    this.currentCardSet = new CardSet(
      `${mode}-${Date.now()}`,
      mode,
      null,
      []
    );
  }
  
  /**
   * 제공자 초기화
   */
  initialize(): void {
    try {
      // 이벤트 핸들러 등록
      this.registerEventHandlers();
      
      // 카드셋 로드
      this.refreshCardSet();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `카드셋 제공자(${this.mode}) 초기화 중 오류 발생`,
        error
      );
    }
  }
  
  /**
   * 제공자 정리
   */
  cleanup(): void {
    try {
      // 이벤트 핸들러 해제
      this.unregisterEventHandlers();
      
      // 구독자 정리
      this.changeSubscribers.clear();
      
      // 이벤트 리스너 정리
      this.clearAllEventListeners();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `카드셋 제공자(${this.mode}) 정리 중 오류 발생`,
        error
      );
    }
  }
  
  /**
   * 옵션 설정
   * @param options 옵션
   */
  setOptions(options: Partial<CardSetOptions>): void {
    this.options = { ...this.options, ...options };
    this.refreshCardSet();
  }
  
  /**
   * 카드셋 로드
   * @returns 로드된 카드셋
   */
  abstract loadCardSet(options?: Record<string, any>): Promise<CardSet>;
  
  /**
   * 카드셋 새로고침
   * @returns 새로고침된 카드셋
   */
  async refreshCardSet(currentCardSet?: CardSet): Promise<CardSet> {
    try {
      this.currentCardSet = await this.loadCardSet();
      this.notifySubscribers();
      return this.currentCardSet;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `카드셋 새로고침 중 오류 발생: ${this.mode}`,
        error
      );
      return this.currentCardSet;
    }
  }
  
  /**
   * 파일이 카드셋에 포함되는지 확인
   * @param file 파일
   * @returns 포함 여부
   */
  abstract isFileIncluded(file: TFile): boolean;
  
  /**
   * 변경 구독
   * @param callback 콜백 함수
   * @returns 구독 ID
   */
  subscribeToChanges(callback: (cardSet: CardSet) => void): string {
    const id = generateUniqueId();
    this.changeSubscribers.set(id, callback);
    return id;
  }
  
  /**
   * 변경 구독 해제
   * @param subscriptionId 구독 ID
   */
  unsubscribeFromChanges(subscriptionId: string): void {
    this.changeSubscribers.delete(subscriptionId);
  }
  
  /**
   * 구독자에게 알림
   */
  protected notifySubscribers(): void {
    // 이벤트 방식으로 알림
    this.dispatchEvent('cardSetChanged', this.currentCardSet);
    
    // 기존 구독자 방식도 유지 (하위 호환성)
    this.changeSubscribers.forEach(callback => {
      try {
        callback(this.currentCardSet);
      } catch (error) {
        ErrorHandler.getInstance().handleError(
          '카드셋 변경 알림 중 오류 발생',
          error
        );
      }
    });
  }
  
  /**
   * 이벤트 발생
   * @param eventName 이벤트 이름
   * @param data 이벤트 데이터
   */
  protected dispatchEvent(eventName: string, data: any): void {
    this.triggerEvent(eventName, data);
  }
  
  /**
   * 이벤트 핸들러 등록
   */
  protected registerEventHandlers(): void {
    // 파일 생성 이벤트
    const handleFileCreate = (file: TAbstractFile) => {
      if (file instanceof TFile) {
        this.handleFileCreate(file);
      }
    };
    this.app.vault.on('create', handleFileCreate);
    this.eventHandlers.set('create', () => {
      this.app.vault.off('create', handleFileCreate as any);
    });
    
    // 파일 수정 이벤트
    const handleFileModify = (file: TAbstractFile) => {
      if (file instanceof TFile) {
        this.handleFileModify(file);
      }
    };
    this.app.vault.on('modify', handleFileModify);
    this.eventHandlers.set('modify', () => {
      this.app.vault.off('modify', handleFileModify as any);
    });
    
    // 파일 삭제 이벤트
    const handleFileDelete = (file: TAbstractFile) => {
      if (file instanceof TFile) {
        this.handleFileDelete(file);
      }
    };
    this.app.vault.on('delete', handleFileDelete);
    this.eventHandlers.set('delete', () => {
      this.app.vault.off('delete', handleFileDelete as any);
    });
    
    // 파일 이름 변경 이벤트
    const handleFileRename = (file: TAbstractFile, oldPath: string) => {
      if (file instanceof TFile) {
        this.handleFileRename(file, oldPath);
      }
    };
    this.app.vault.on('rename', handleFileRename);
    this.eventHandlers.set('rename', () => {
      this.app.vault.off('rename', handleFileRename as any);
    });
  }
  
  /**
   * 이벤트 핸들러 해제
   */
  protected unregisterEventHandlers(): void {
    // 모든 이벤트 핸들러 해제
    this.eventHandlers.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        ErrorHandler.getInstance().handleError(
          '이벤트 핸들러 해제 중 오류 발생',
          error
        );
      }
    });
    
    // 이벤트 핸들러 맵 초기화
    this.eventHandlers.clear();
  }
  
  /**
   * 파일 생성 처리
   * @param file 생성된 파일
   */
  protected handleFileCreate(file: TFile): void {
    try {
      // 마크다운 파일이고 카드셋에 포함되는 파일인지 확인
      if (file.extension === 'md' && this.isFileIncluded(file)) {
        this.addFile(file);
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `파일 생성 처리 중 오류 발생: ${file.path}`,
        error
      );
    }
  }
  
  /**
   * 파일 수정 처리
   * @param file 수정된 파일
   */
  protected handleFileModify(file: TFile): void {
    try {
      // 마크다운 파일이고 카드셋에 포함되는 파일인지 확인
      if (file.extension === 'md') {
        if (this.isFileIncluded(file)) {
          this.updateFile(file);
        }
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `파일 수정 처리 중 오류 발생: ${file.path}`,
        error
      );
    }
  }
  
  /**
   * 파일 삭제 처리
   * @param file 삭제된 파일
   */
  protected handleFileDelete(file: TFile): void {
    try {
      // 마크다운 파일인지 확인
      if (file.extension === 'md') {
        // 카드셋에서 파일 제거
        this.removeFile(file.path);
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `파일 삭제 처리 중 오류 발생: ${file.path}`,
        error
      );
    }
  }
  
  /**
   * 파일 이름 변경 처리
   * @param file 이름이 변경된 파일
   * @param oldPath 이전 경로
   */
  protected handleFileRename(file: TFile, oldPath: string): void {
    try {
      // 마크다운 파일인지 확인
      if (file.extension === 'md') {
        // 이전 파일 제거
        this.removeFile(oldPath);
        
        // 새 파일이 카드셋에 포함되는지 확인하고 추가
        if (this.isFileIncluded(file)) {
          this.addFile(file);
        }
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `파일 이름 변경 처리 중 오류 발생: ${file.path}`,
        error
      );
    }
  }
  
  /**
   * 파일 추가
   * @param file 추가할 파일
   */
  protected addFile(file: TFile): void {
    try {
      // 이미 존재하는지 확인
      const exists = this.currentCardSet.files.some(f => f.path === file.path);
      
      if (!exists) {
        // 새 파일 추가
        const updatedFiles = [...this.currentCardSet.files, file];
        
        // 카드셋 업데이트
        this.currentCardSet = new CardSet(
          this.currentCardSet.id,
          this.mode,
          this.currentCardSet.source,
          updatedFiles
        );
        
        // 구독자에게 알림
        this.notifySubscribers();
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `파일 추가 중 오류 발생: ${file.path}`,
        error
      );
    }
  }
  
  /**
   * 파일 제거
   * @param filePath 제거할 파일 경로
   */
  protected removeFile(filePath: string): void {
    try {
      // 파일 존재 여부 확인
      const fileIndex = this.currentCardSet.files.findIndex(f => f.path === filePath);
      
      if (fileIndex >= 0) {
        // 파일 제거
        const updatedFiles = [...this.currentCardSet.files];
        updatedFiles.splice(fileIndex, 1);
        
        // 카드셋 업데이트
        this.currentCardSet = new CardSet(
          this.currentCardSet.id,
          this.mode,
          this.currentCardSet.source,
          updatedFiles
        );
        
        // 구독자에게 알림
        this.notifySubscribers();
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `파일 제거 중 오류 발생: ${filePath}`,
        error
      );
    }
  }
  
  /**
   * 파일 업데이트
   * @param file 업데이트할 파일
   */
  protected updateFile(file: TFile): void {
    try {
      // 파일 존재 여부 확인
      const fileIndex = this.currentCardSet.files.findIndex(f => f.path === file.path);
      
      if (fileIndex >= 0) {
        // 파일 업데이트
        const updatedFiles = [...this.currentCardSet.files];
        updatedFiles[fileIndex] = file;
        
        // 카드셋 업데이트
        this.currentCardSet = new CardSet(
          this.currentCardSet.id,
          this.mode,
          this.currentCardSet.source,
          updatedFiles
        );
        
        // 구독자에게 알림
        this.notifySubscribers();
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `파일 업데이트 중 오류 발생: ${file.path}`,
        error
      );
    }
  }
  
  /**
   * 마크다운 파일 필터링
   * @param files 파일 목록
   * @returns 필터링된 마크다운 파일 목록
   */
  protected filterMarkdownFiles(files: TFile[]): TFile[] {
    return files.filter(file => {
      // 마크다운 파일인지 확인
      if (file.extension !== 'md') {
        return false;
      }
      
      // 숨김 파일 처리
      if (!this.options.showHiddenFiles && file.path.startsWith('.')) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * 모든 마크다운 파일 가져오기
   * @returns 마크다운 파일 목록
   */
  protected getAllMarkdownFiles(): TFile[] {
    const files = this.app.vault.getFiles();
    return this.filterMarkdownFiles(files);
  }

  /**
   * 파일 변경 처리
   * @param file 변경된 파일
   * @param changeType 변경 유형
   * @param currentCardSet 현재 카드셋
   * @returns 업데이트된 카드셋 또는 업데이트 필요 여부
   */
  async handleFileChange(file: TFile | null, changeType: string, currentCardSet: CardSet): Promise<CardSet | boolean> {
    if (!file) return false;
    
    switch (changeType) {
      case 'create':
        if (file.extension === 'md' && this.isFileIncluded(file)) {
          this.addFile(file);
          return this.currentCardSet;
        }
        break;
      case 'modify':
        if (file.extension === 'md') {
          if (this.isFileIncluded(file)) {
            this.updateFile(file);
            return this.currentCardSet;
          }
        }
        break;
      case 'delete':
        if (file.extension === 'md') {
          this.removeFile(file.path);
          return this.currentCardSet;
        }
        break;
      case 'rename':
        // 이미 handleFileRename에서 처리됨
        return this.currentCardSet;
    }
    
    return false;
  }

  /**
   * 제공자가 파일을 포함하는지 확인
   * @param file 확인할 파일
   * @returns 포함 여부
   */
  containsFile(file: TFile): boolean {
    return this.isFileIncluded(file);
  }

  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param handler 이벤트 핸들러 함수
   */
  on(event: string | PresetEvent, handler: EventHandler): void {
    const eventName = typeof event === 'string' ? event : event;
    
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    
    const handlers = this.eventListeners.get(eventName);
    if (handlers && !handlers.includes(handler)) {
      handlers.push(handler);
    }
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param handler 이벤트 핸들러 함수
   */
  off(event: string | PresetEvent, handler: EventHandler): void {
    const eventName = typeof event === 'string' ? event : event;
    
    if (!this.eventListeners.has(eventName)) {
      return;
    }
    
    const handlers = this.eventListeners.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
      
      // 핸들러가 없으면 이벤트 제거
      if (handlers.length === 0) {
        this.eventListeners.delete(eventName);
      }
    }
  }
  
  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param data 이벤트 데이터
   */
  triggerEvent(event: string | PresetEvent, data?: any): void {
    const eventName = typeof event === 'string' ? event : event;
    
    if (!this.eventListeners.has(eventName)) {
      return;
    }
    
    const handlers = this.eventListeners.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          ErrorHandler.handleErrorWithCode(
            ErrorCode.EVENT_HANDLER_ERROR,
            { message: `이벤트 핸들러 실행 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`, event: eventName },
            true
          );
        }
      });
    }
  }
  
  /**
   * 모든 이벤트 리스너 제거
   */
  clearAllEventListeners(): void {
    this.eventListeners.clear();
  }
  
  /**
   * 특정 이벤트의 모든 리스너 제거
   * @param event 이벤트 이름
   */
  clearEventListeners(event: string | PresetEvent): void {
    const eventName = typeof event === 'string' ? event : event;
    this.eventListeners.delete(eventName);
  }

  /**
   * 이벤트 리스너 추가 (addEventListener 별칭)
   * @param eventName 이벤트 이름
   * @param listener 리스너 함수
   */
  addEventListener(eventName: string, listener: Function): void {
    this.on(eventName, listener as EventHandler);
  }
  
  /**
   * 이벤트 리스너 제거 (removeEventListener 별칭)
   * @param eventName 이벤트 이름
   * @param listener 리스너 함수
   */
  removeEventListener(eventName: string, listener: Function): void {
    this.off(eventName, listener as EventHandler);
  }

  /**
   * 제공자 정리
   */
  destroy(): void {
    this.cleanup();
  }
}