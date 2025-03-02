import { App, TFile } from 'obsidian';
import { CardSet } from '../../core/models/CardSet';
import { CardSetType, CardSetMode } from '../../core/types/cardset.types';
import { ICardSetProvider } from '../../core/interfaces/ICardSetProvider';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { getDirectoryPath, getMarkdownFilesFromFolder } from '../../utils/helpers/file.helper';

/**
 * 활성 폴더 카드셋 제공자 클래스
 * 현재 활성화된 파일이 위치한 폴더의 모든 노트를 카드로 표시하는 카드셋 제공자입니다.
 */
export class ActiveFolderCardSetProvider implements ICardSetProvider {
  /**
   * 카드셋 타입
   */
  public readonly type: CardSetType = CardSetType.ACTIVE_FOLDER;
  
  /**
   * Obsidian 앱 인스턴스
   */
  private app: App;
  
  /**
   * 하위 폴더 포함 여부
   */
  private includeSubfolders: boolean;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param includeSubfolders 하위 폴더 포함 여부
   */
  constructor(app: App, includeSubfolders: boolean = true) {
    this.app = app;
    this.includeSubfolders = includeSubfolders;
  }
  
  /**
   * 카드셋 로드
   * @returns 로드된 카드셋
   */
  async loadCardSet(): Promise<CardSet> {
    try {
      // 현재 활성 파일 가져오기
      const activeFile = this.app.workspace.getActiveFile();
      
      if (!activeFile) {
        // 활성 파일이 없으면 빈 카드셋 생성
        return new CardSet(
          `active-folder-${Date.now()}`,
          CardSetMode.ACTIVE_FOLDER,
          '',
          []
        );
      }
      
      // 활성 파일의 폴더 경로 가져오기
      const folderPath = getDirectoryPath(activeFile.path);
      
      // 폴더 내 마크다운 파일 가져오기
      const files = await this.getMarkdownFilesInFolder(folderPath);
      
      // 카드셋 생성 및 반환
      return new CardSet(
        `active-folder-${Date.now()}`,
        CardSetMode.ACTIVE_FOLDER,
        folderPath,
        files
      );
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'ActiveFolderCardSetProvider.loadCardSet',
        '활성 폴더 카드셋 로드 중 오류가 발생했습니다.',
        error
      );
      
      // 오류 발생 시 빈 카드셋 생성
      return new CardSet(
        `active-folder-${Date.now()}`,
        CardSetMode.ACTIVE_FOLDER,
        '',
        []
      );
    }
  }
  
  /**
   * 카드셋 새로고침
   * @param cardSet 새로고침할 카드셋
   * @returns 새로고침된 카드셋
   */
  async refreshCardSet(cardSet: CardSet): Promise<CardSet> {
    try {
      // 현재 활성 파일 가져오기
      const activeFile = this.app.workspace.getActiveFile();
      
      // 활성 파일이 없고 기존 카드셋도 비어있으면 빈 카드셋 반환
      if (!activeFile && cardSet.isEmpty()) {
        return cardSet;
      }
      
      // 활성 파일이 없지만 기존 카드셋이 있으면 기존 소스 사용
      const folderPath = activeFile 
        ? getDirectoryPath(activeFile.path) 
        : cardSet.source;
      
      // 폴더 내 마크다운 파일 가져오기
      const files = await this.getMarkdownFilesInFolder(folderPath);
      
      // 카드셋 새로고침
      return cardSet.refresh(files);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'ActiveFolderCardSetProvider.refreshCardSet',
        '활성 폴더 카드셋 새로고침 중 오류가 발생했습니다.',
        error
      );
      
      // 오류 발생 시 빈 파일 목록으로 새로고침
      return cardSet.refresh([]);
    }
  }
  
  /**
   * 파일 변경 처리
   * @param file 변경된 파일
   * @param cardSet 현재 카드셋
   * @returns 업데이트된 카드셋
   */
  async handleFileChange(file: TFile | null, cardSet: CardSet): Promise<CardSet> {
    // 파일이 없으면 기존 카드셋 반환
    if (!file) {
      return cardSet;
    }
    
    try {
      // 파일의 폴더 경로 가져오기
      const fileFolderPath = getDirectoryPath(file.path);
      
      // 현재 카드셋의 소스 폴더 경로
      const cardSetFolderPath = cardSet.source;
      
      // 파일이 현재 카드셋의 폴더에 속하는지 확인
      const isInSameFolder = fileFolderPath === cardSetFolderPath;
      const isInSubfolder = this.includeSubfolders && fileFolderPath.startsWith(cardSetFolderPath + '/');
      
      if (isInSameFolder || isInSubfolder) {
        // 파일이 마크다운 파일인지 확인
        if (file.extension === 'md') {
          // 카드셋에 파일이 이미 있는지 확인
          if (cardSet.containsFile(file.path)) {
            // 파일 업데이트
            return cardSet.updateFile(file);
          } else {
            // 파일 추가
            return cardSet.addFile(file);
          }
        }
      }
      
      // 파일이 현재 카드셋의 폴더에 속하지 않으면 기존 카드셋 반환
      return cardSet;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'ActiveFolderCardSetProvider.handleFileChange',
        '파일 변경 처리 중 오류가 발생했습니다.',
        error
      );
      
      // 오류 발생 시 기존 카드셋 반환
      return cardSet;
    }
  }
  
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  setIncludeSubfolders(include: boolean): void {
    this.includeSubfolders = include;
  }
  
  /**
   * 폴더 내 마크다운 파일 가져오기
   * @param folderPath 폴더 경로
   * @returns 마크다운 파일 배열
   */
  private async getMarkdownFilesInFolder(folderPath: string): Promise<TFile[]> {
    try {
      return await getMarkdownFilesFromFolder(this.app, folderPath, this.includeSubfolders);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'ActiveFolderCardSetProvider.getMarkdownFilesInFolder',
        '폴더 내 마크다운 파일을 가져오는 중 오류가 발생했습니다.',
        error
      );
      
      return [];
    }
  }
} 