import { App, TFile } from 'obsidian';
import { AbstractCardSetProvider } from './AbstractCardSetProvider';
import { CardSet } from '../../core/models/CardSet';
import { CardSetMode } from '../../core/types/cardset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';

/**
 * 볼트 카드셋 제공자 클래스
 * Obsidian 볼트 내의 모든 노트 파일을 카드로 표시하는 카드셋 제공자입니다.
 */
export class VaultCardSetProvider extends AbstractCardSetProvider {
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(app: App) {
    super(app, CardSetMode.VAULT);
  }
  
  /**
   * 카드셋 로드
   * @returns 로드된 카드셋
   */
  async loadCardSet(): Promise<CardSet> {
    try {
      const files = this.getAllMarkdownFiles();
      
      this.currentCardSet = new CardSet(
        `vault-${Date.now()}`,
        CardSetMode.VAULT,
        'vault',
        files
      );
      return this.currentCardSet;
    } catch (error) {
      ErrorHandler.getInstance().handleError('볼트 카드셋 로드 중 오류 발생', error);
      this.currentCardSet = new CardSet(
        `vault-error-${Date.now()}`,
        CardSetMode.VAULT,
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
      // 마크다운 파일이 아니면 포함하지 않음
      if (file.extension !== 'md') {
        return false;
      }
      
      // 숨김 파일 처리
      if (!this.options.showHiddenFiles && file.path.startsWith('.')) {
        return false;
      }
      
      return true;
    } catch (error) {
      ErrorHandler.getInstance().handleError('파일 포함 여부 확인 중 오류 발생', error);
      return false;
    }
  }
  
  /**
   * 볼트 내 모든 마크다운 파일 가져오기
   * @returns 마크다운 파일 배열
   */
  protected getAllMarkdownFiles(): TFile[] {
    try {
      const files = this.app.vault.getFiles();
      
      return files.filter(file => {
        if (file.extension !== 'md') {
          return false;
        }

        // 숨김 파일 필터링 (옵션에 따라)
        if (!this.options.showHiddenFiles && file.path.startsWith('.')) {
          return false;
        }

        return true;
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError('볼트에서 마크다운 파일 가져오기 중 오류 발생', error);
      return [];
    }
  }
} 