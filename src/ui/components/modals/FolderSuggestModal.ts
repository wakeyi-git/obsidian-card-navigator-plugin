import { SuggestModal, TFolder } from 'obsidian';
import { ObsidianService } from '../../../infrastructure/obsidian/adapters/ObsidianService';

/**
 * 폴더 제안 모달
 * 폴더 선택을 위한 제안 모달입니다.
 */
export class FolderSuggestModal extends SuggestModal<string> {
  private obsidianService: ObsidianService;
  private onSelect: (folderPath: string) => void;
  private folders: string[] = [];

  /**
   * 생성자
   * @param obsidianService Obsidian 서비스
   * @param onSelect 선택 콜백 함수
   */
  constructor(obsidianService: ObsidianService, onSelect: (folderPath: string) => void) {
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
    this.folders = this.obsidianService.getFolderPaths();
    
    // 루트 폴더 추가
    if (!this.folders.includes('/')) {
      this.folders.unshift('/');
    }
  }

  /**
   * 제안 항목 가져오기
   * @param query 검색어
   * @returns 제안 항목 목록
   */
  getSuggestions(query: string): string[] {
    if (!query) {
      return this.folders;
    }
    
    return this.folders.filter(folder => 
      folder.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * 제안 항목 렌더링
   * @param folder 폴더 경로
   * @param el 렌더링할 요소
   */
  renderSuggestion(folder: string, el: HTMLElement): void {
    el.createEl('div', {
      text: folder || '/',
      cls: 'folder-suggestion-item'
    });
  }

  /**
   * 제안 항목 선택 처리
   * @param folder 선택된 폴더 경로
   * @param evt 이벤트
   */
  onChooseSuggestion(folder: string, evt: MouseEvent | KeyboardEvent): void {
    this.onSelect(folder);
  }
} 