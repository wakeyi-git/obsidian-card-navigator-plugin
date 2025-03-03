import { App, TFile } from 'obsidian';
import { AbstractCardSetProvider } from './AbstractCardSetProvider';
import { CardSet } from '../../core/models/CardSet';
import { CardSetMode } from '../../core/types/cardset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';

/**
 * 사용자가 선택한 특정 폴더의 노트를 기반으로 카드셋을 제공하는 클래스
 */
export class SelectedFolderCardSetProvider extends AbstractCardSetProvider {
  /**
   * 선택된 폴더 경로
   * @private
   */
  private selectedFolderPath: string = '';

  /**
   * SelectedFolderCardSetProvider 생성자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(app: App) {
    super(app, CardSetMode.SELECTED_FOLDER);
  }

  /**
   * 선택된 폴더 경로 설정
   * @param folderPath 폴더 경로
   */
  public setSelectedFolder(folderPath: string): void {
    try {
      if (this.selectedFolderPath === folderPath) {
        return;
      }

      this.selectedFolderPath = folderPath;
      this.refreshCardSet();
    } catch (error) {
      ErrorHandler.handleError('선택된 폴더 설정 중 오류 발생', error);
    }
  }

  /**
   * 현재 선택된 폴더 경로 반환
   * @returns 선택된 폴더 경로
   */
  public getSelectedFolder(): string {
    return this.selectedFolderPath;
  }

  /**
   * 카드셋 로드
   * @returns 로드된 카드셋
   */
  async loadCardSet(): Promise<CardSet> {
    try {
      if (!this.selectedFolderPath) {
        this.currentCardSet = new CardSet(
          `selected-folder-${Date.now()}`,
          CardSetMode.SELECTED_FOLDER,
          null,
          []
        );
        return this.currentCardSet;
      }

      const files = this.getMarkdownFilesInFolder(this.selectedFolderPath);
      
      this.currentCardSet = new CardSet(
        `selected-folder-${Date.now()}`,
        CardSetMode.SELECTED_FOLDER,
        this.selectedFolderPath,
        files
      );
      return this.currentCardSet;
    } catch (error) {
      ErrorHandler.getInstance().handleError('선택된 폴더 카드셋 로드 중 오류 발생', error);
      this.currentCardSet = new CardSet(
        `selected-folder-error-${Date.now()}`,
        CardSetMode.SELECTED_FOLDER,
        null,
        []
      );
      return this.currentCardSet;
    }
  }

  /**
   * 파일이 현재 카드셋에 포함되는지 확인
   * @param file 확인할 파일
   * @returns 포함 여부
   */
  public isFileIncluded(file: TFile): boolean {
    if (!this.selectedFolderPath || !file || file.extension !== 'md') {
      return false;
    }

    const filePath = file.path;
    const fileDir = filePath.substring(0, filePath.lastIndexOf('/') + 1);

    if (this.options.includeSubfolders) {
      return fileDir.startsWith(this.selectedFolderPath);
    } else {
      return fileDir === this.selectedFolderPath;
    }
  }

  /**
   * 지정된 폴더에서 마크다운 파일 가져오기
   * @param folderPath 폴더 경로
   * @returns 마크다운 파일 배열
   * @private
   */
  private getMarkdownFilesInFolder(folderPath: string): TFile[] {
    try {
      const files = this.app.vault.getFiles();
      
      return files.filter(file => {
        if (file.extension !== 'md') {
          return false;
        }

        const filePath = file.path;
        const fileDir = filePath.substring(0, filePath.lastIndexOf('/') + 1);
        
        if (this.options.includeSubfolders) {
          return fileDir.startsWith(folderPath);
        } else {
          return fileDir === folderPath;
        }
      });
    } catch (error) {
      ErrorHandler.handleError('폴더에서 마크다운 파일 가져오기 중 오류 발생', error);
      return [];
    }
  }
} 