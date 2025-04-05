import { App, TFolder, SuggestModal } from 'obsidian';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { Container } from '@/infrastructure/di/Container';

/**
 * 폴더 선택 서제스트 모달
 */
export class FolderSuggestModal extends SuggestModal<string> {
  private logger: ILoggingService;
  public onChoose: (folder: string) => void;
  private folders: string[] = [];

  constructor(app: App) {
    super(app);
    this.logger = Container.getInstance().resolve<ILoggingService>('ILoggingService');
    this.setPlaceholder('폴더 경로를 입력하거나 선택하세요');
    this.loadFolders();
  }

  /**
   * 볼트 내 모든 폴더 로드
   */
  private loadFolders(): void {
    try {
      this.logger.debug('폴더 목록 로드 시작');
      
      this.folders = ['/'];  // 루트 폴더 추가
      
      // 재귀적으로 모든 폴더 탐색
      const addFolders = (folder: TFolder) => {
        // 숨김 폴더(점으로 시작하는 폴더)는 제외
        if (folder.path !== '/' && !folder.name.startsWith('.')) {
          this.folders.push(folder.path);
        }
        
        folder.children
          .filter(child => child instanceof TFolder)
          .forEach(child => addFolders(child as TFolder));
      };
      
      const rootFolder = this.app.vault.getRoot();
      addFolders(rootFolder);
      
      this.logger.debug('폴더 목록 로드 완료', { folderCount: this.folders.length });
    } catch (error) {
      this.logger.error('폴더 목록 로드 실패', { error });
    }
  }

  /**
   * 사용자 입력에 따라 제안 목록 생성
   */
  getSuggestions(query: string): string[] {
    return this.folders.filter(folder => 
      folder.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * 제안 항목 렌더링
   */
  renderSuggestion(folder: string, el: HTMLElement): void {
    el.createEl('div', { text: folder });
  }

  /**
   * 제안 항목 선택 처리
   */
  onChooseSuggestion(folder: string, evt: MouseEvent | KeyboardEvent): void {
    try {
      this.logger.debug('폴더 선택됨', { folder });
      
      // 모달 닫은 후 이벤트 처리
      this.close();
      
      // 콜백이 있는 경우에만 실행
      if (this.onChoose) {
        // 모달 내에서의 중복 호출 방지 (마우스 더블 클릭 등에 의한 중복 호출 방지)
        setTimeout(() => {
          this.onChoose(folder);
        }, 50);
      }
    } catch (error) {
      this.logger.error('폴더 선택 처리 중 오류 발생', { error, folder });
    }
  }
} 