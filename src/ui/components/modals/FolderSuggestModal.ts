import { SuggestModal, TFolder } from 'obsidian';
import { ObsidianService } from '../../../infrastructure/obsidian/adapters/ObsidianService';

/**
 * 폴더 제안 모달
 * 폴더 선택을 위한 제안 모달입니다.
 */
export class FolderSuggestModal extends SuggestModal<TFolder> {
  private obsidianService: ObsidianService;
  private onSelect: (folder: TFolder) => void;
  private folders: TFolder[] = [];

  /**
   * 생성자
   * @param obsidianService Obsidian 서비스
   * @param onSelect 선택 콜백 함수
   */
  constructor(obsidianService: ObsidianService, onSelect: (folder: TFolder) => void) {
    super(obsidianService.getApp());
    this.obsidianService = obsidianService;
    this.onSelect = onSelect;
    this.setPlaceholder('폴더 이름 입력 또는 선택');
    this.loadFolders();
  }

  /**
   * 폴더 목록 로드
   */
  private loadFolders(): void {
    this.folders = this.obsidianService.getFoldersAsObjects();
  }

  /**
   * 제안 항목 가져오기
   * @param query 검색어
   * @returns 제안 항목 목록
   */
  getSuggestions(query: string): TFolder[] {
    if (!query) {
      return this.folders;
    }
    
    return this.folders.filter(folder => 
      folder.path.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * 제안 항목 렌더링
   * @param folder 폴더
   * @param el 렌더링할 요소
   */
  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.createEl('div', {
      text: folder.path || '/',
      cls: 'folder-suggestion-item'
    });
  }

  /**
   * 제안 항목 선택 처리
   * @param folder 선택된 폴더
   * @param evt 이벤트
   */
  onChooseSuggestion(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
    this.onSelect(folder);
  }
} 