import { App, TFile } from 'obsidian';
import { CardSet } from '../../core/models/CardSet';
import { CardSetType } from '../../core/types/cardset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { ICardSetProvider } from '../../core/interfaces/ICardSetProvider';

/**
 * 볼트 카드셋 제공자 클래스
 * Obsidian 볼트 내의 모든 노트 파일을 카드로 표시하는 카드셋 제공자입니다.
 */
export class VaultCardSetProvider implements ICardSetProvider {
  /**
   * 카드셋 타입
   */
  public readonly type: CardSetType = CardSetType.VAULT;
  
  /**
   * Obsidian 앱 인스턴스
   */
  private app: App;
  
  /**
   * 숨김 파일 포함 여부
   */
  private includeHiddenFiles: boolean;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param includeHiddenFiles 숨김 파일 포함 여부
   */
  constructor(app: App, includeHiddenFiles: boolean = false) {
    this.app = app;
    this.includeHiddenFiles = includeHiddenFiles;
  }
  
  /**
   * 카드셋 로드
   * @returns 로드된 카드셋
   */
  async loadCardSet(): Promise<CardSet> {
    try {
      // 볼트 내 모든 마크다운 파일 가져오기
      const files = this.getMarkdownFiles();
      
      // 카드셋 생성 및 반환
      return new CardSet(
        `vault-${Date.now()}`,
        'vault',
        'vault',
        files
      );
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'VaultCardSetProvider.loadCardSet',
        '볼트 카드셋 로드 중 오류가 발생했습니다.',
        error
      );
      
      // 오류 발생 시 빈 카드셋 생성
      return new CardSet(
        `vault-${Date.now()}`,
        'vault',
        'vault',
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
      // 볼트 내 모든 마크다운 파일 가져오기
      const files = this.getMarkdownFiles();
      
      // 카드셋 새로고침
      return cardSet.refresh(files);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'VaultCardSetProvider.refreshCardSet',
        '볼트 카드셋 새로고침 중 오류가 발생했습니다.',
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
      // 파일이 마크다운 파일인지 확인
      if (file.extension === 'md') {
        // 숨김 파일 처리
        if (!this.includeHiddenFiles && file.path.startsWith('.')) {
          // 숨김 파일이고 포함하지 않는 설정이면 제거
          if (cardSet.containsFile(file.path)) {
            return cardSet.removeFile(file.path);
          }
          return cardSet;
        }
        
        // 카드셋에 파일이 이미 있는지 확인
        if (cardSet.containsFile(file.path)) {
          // 파일 업데이트
          return cardSet.updateFile(file);
        } else {
          // 파일 추가
          return cardSet.addFile(file);
        }
      }
      
      // 마크다운 파일이 아니면 기존 카드셋 반환
      return cardSet;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'VaultCardSetProvider.handleFileChange',
        '파일 변경 처리 중 오류가 발생했습니다.',
        error
      );
      
      // 오류 발생 시 기존 카드셋 반환
      return cardSet;
    }
  }
  
  /**
   * 숨김 파일 포함 여부 설정
   * @param include 숨김 파일 포함 여부
   */
  setIncludeHiddenFiles(include: boolean): void {
    this.includeHiddenFiles = include;
  }
  
  /**
   * 볼트 내 마크다운 파일 가져오기
   * @returns 마크다운 파일 배열
   */
  private getMarkdownFiles(): TFile[] {
    try {
      // 볼트 내 모든 마크다운 파일 가져오기
      const files = this.app.vault.getMarkdownFiles();
      
      // 숨김 파일 필터링
      if (!this.includeHiddenFiles) {
        return files.filter(file => !file.path.startsWith('.'));
      }
      
      return files;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'VaultCardSetProvider.getMarkdownFiles',
        '볼트 내 마크다운 파일을 가져오는 중 오류가 발생했습니다.',
        error
      );
      
      return [];
    }
  }
} 