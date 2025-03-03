import { App, TFile } from 'obsidian';
import { CardSet } from '../../core/models/CardSet';
import { CardSetMode } from '../../core/types/cardset.types';
import { ICardSetProvider } from '../../core/interfaces/manager/ICardSetProvider';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { getDirectoryPath, getMarkdownFilesInFolder } from '../../utils/helpers/file.helper';
import { AbstractCardSetProvider } from './AbstractCardSetProvider';

/**
 * 활성 폴더 카드셋 제공자 클래스
 * 현재 활성화된 파일이 위치한 폴더의 노트를 카드셋으로 제공합니다.
 */
export class ActiveFolderCardSetProvider extends AbstractCardSetProvider {
  /**
   * 현재 활성 폴더 경로
   */
  private activeFolderPath: string = '';
  
  /**
   * 파일 열기 이벤트 핸들러
   */
  private fileOpenHandler: ((file: TFile | null) => void) | null = null;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(app: App) {
    super(app, CardSetMode.ACTIVE_FOLDER);
  }
  
  /**
   * 카드셋 제공자 초기화
   */
  initialize(): void {
    super.initialize();
    
    try {
      // 활성 파일 변경 이벤트 핸들러 등록
      this.fileOpenHandler = this.handleFileOpen.bind(this);
      // 타입 호환성을 위해 타입 캐스팅 사용
      this.app.workspace.on('file-open', this.fileOpenHandler as (...data: unknown[]) => unknown);
      
      // 현재 활성 파일 확인
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        this.activeFolderPath = getDirectoryPath(activeFile.path);
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '활성 폴더 카드셋 제공자 초기화 중 오류 발생',
        error
      );
    }
  }
  
  /**
   * 제공자 정리
   * 부모 클래스의 destroy 메서드를 오버라이드하여 이벤트 핸들러를 정리합니다.
   */
  destroy(): void {
    try {
      // 파일 열기 이벤트 핸들러 해제
      if (this.fileOpenHandler) {
        // 타입 호환성을 위해 타입 캐스팅 사용
        this.app.workspace.off('file-open', this.fileOpenHandler as (...data: unknown[]) => unknown);
        this.fileOpenHandler = null;
      }
      
      // 부모 클래스의 destroy 메서드 호출
      super.destroy();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '활성 폴더 카드셋 제공자 정리 중 오류 발생',
        error
      );
    }
  }
  
  /**
   * 카드셋 로드
   * @returns 로드된 카드셋
   */
  async loadCardSet(): Promise<CardSet> {
    try {
      // 활성 파일 가져오기
      const activeFile = this.app.workspace.getActiveFile();
      
      if (!activeFile) {
        // 활성 파일이 없으면 빈 카드셋 생성
        this.currentCardSet = new CardSet(
          `active-folder-${Date.now()}`,
          CardSetMode.ACTIVE_FOLDER,
          null,
          []
        );
        return this.currentCardSet;
      }
      
      // 활성 파일의 폴더 경로 가져오기
      const folderPath = getDirectoryPath(activeFile.path);
      this.activeFolderPath = folderPath;
      
      // 폴더 내 마크다운 파일 가져오기
      const files = this.getMarkdownFilesInFolder(folderPath);
      
      // 카드셋 업데이트
      this.currentCardSet = new CardSet(
        `active-folder-${Date.now()}`,
        CardSetMode.ACTIVE_FOLDER,
        folderPath,
        files
      );
      
      return this.currentCardSet;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '활성 폴더 카드셋 로드 중 오류 발생',
        error
      );
      
      // 오류 발생 시 빈 카드셋 생성
      this.currentCardSet = new CardSet(
        `active-folder-error-${Date.now()}`,
        CardSetMode.ACTIVE_FOLDER,
        null,
        []
      );
      return this.currentCardSet;
    }
  }
  
  /**
   * 파일이 카드셋에 포함되는지 확인
   * @param file 확인할 파일
   * @returns 포함 여부
   */
  isFileIncluded(file: TFile): boolean {
    try {
      // 마크다운 파일이 아닌 경우 제외
      if (file.extension !== 'md') {
        return false;
      }
      
      // 숨김 파일 처리
      if (!this.options.showHiddenFiles && file.path.startsWith('.')) {
        return false;
      }
      
      // 활성 폴더 경로가 없는 경우 제외
      if (!this.activeFolderPath) {
        return false;
      }
      
      // 파일 경로에서 폴더 경로 추출
      const fileFolder = getDirectoryPath(file.path);
      
      // 같은 폴더인지 확인
      if (fileFolder === this.activeFolderPath) {
        return true;
      }
      
      // 하위 폴더 포함 옵션이 활성화된 경우 하위 폴더 확인
      if (this.options.includeSubfolders && 
          fileFolder.startsWith(this.activeFolderPath + '/')) {
        return true;
      }
      
      return false;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `파일 포함 여부 확인 중 오류 발생: ${file.path}`,
        error
      );
      return false;
    }
  }
  
  /**
   * 활성 파일 변경 이벤트 핸들러
   * @param file 열린 파일
   */
  private handleFileOpen(file: TFile | null): void {
    try {
      // 파일이 없거나 마크다운 파일이 아닌 경우 무시
      if (!file || file.extension !== 'md') {
        return;
      }
      
      // 현재 활성 폴더 경로 가져오기
      const folderPath = getDirectoryPath(file.path);
      
      // 현재 카드셋의 소스와 다른 경우에만 업데이트
      if (this.activeFolderPath !== folderPath) {
        this.activeFolderPath = folderPath;
        this.refreshCardSet();
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '파일 열기 이벤트 처리 중 오류 발생',
        error
      );
    }
  }
  
  /**
   * 폴더 내 마크다운 파일 가져오기
   * @param folderPath 폴더 경로
   * @returns 마크다운 파일 배열
   */
  private getMarkdownFilesInFolder(folderPath: string): TFile[] {
    try {
      // 폴더 경로가 비어있는 경우 빈 배열 반환
      if (!folderPath) {
        return [];
      }
      
      // 볼트 내 모든 마크다운 파일 가져오기
      const allFiles = this.app.vault.getMarkdownFiles();
      
      // 폴더 내 파일 필터링
      return allFiles.filter(file => {
        // 마크다운 파일이 아닌 경우 제외
        if (file.extension !== 'md') {
          return false;
        }
        
        // 숨김 파일 처리
        if (!this.options.showHiddenFiles && file.path.startsWith('.')) {
          return false;
        }
        
        // 파일 경로에서 폴더 경로 추출
        const fileFolder = getDirectoryPath(file.path);
        
        // 같은 폴더인지 확인
        if (fileFolder === folderPath) {
          return true;
        }
        
        // 하위 폴더 포함 옵션이 활성화된 경우 하위 폴더 확인
        if (this.options.includeSubfolders && 
            fileFolder.startsWith(folderPath + '/')) {
          return true;
        }
        
        return false;
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `폴더 내 마크다운 파일 가져오기 중 오류 발생: ${folderPath}`,
        error
      );
      return [];
    }
  }
} 