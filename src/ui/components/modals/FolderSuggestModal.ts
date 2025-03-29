import { App, SuggestModal, TFolder } from 'obsidian';

/**
 * 폴더 제안 모달
 */
export class FolderSuggestModal extends SuggestModal<TFolder> {
  constructor(
    app: App,
    private readonly onSelect: (folder: TFolder) => void
  ) {
    super(app);
  }

  /**
   * 제안 가져오기
   */
  getSuggestions(query: string): TFolder[] {
    const folders = this.app.vault.getAllLoadedFiles().filter((file): file is TFolder => file instanceof TFolder);
    
    if (!query) {
      return folders;
    }

    const queryLower = query.toLowerCase();
    return folders.filter(folder => 
      folder.path.toLowerCase().includes(queryLower)
    );
  }

  /**
   * 제안 렌더링
   */
  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    const suggestionEl = el.createDiv({ cls: 'suggestion-item' });
    suggestionEl.createDiv({ text: folder.path });
  }

  /**
   * 제안 선택
   */
  onChooseSuggestion(folder: TFolder): void {
    this.onSelect(folder);
  }
} 