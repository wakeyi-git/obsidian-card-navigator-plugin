import { App, SuggestModal } from 'obsidian';

/**
 * 태그 제안 모달
 */
export class TagSuggestModal extends SuggestModal<string> {
  constructor(
    app: App,
    private readonly onSelect: (tag: string) => void
  ) {
    super(app);
  }

  /**
   * 제안 가져오기
   */
  getSuggestions(query: string): string[] {
    const files = this.app.vault.getMarkdownFiles();
    const tags = new Set<string>();

    files.forEach(file => {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache?.tags) {
        cache.tags.forEach(tag => {
          tags.add(tag.tag);
        });
      }
    });

    const allTags = Array.from(tags);
    
    if (!query) {
      return allTags;
    }

    const queryLower = query.toLowerCase();
    return allTags.filter(tag => 
      tag.toLowerCase().includes(queryLower)
    );
  }

  /**
   * 제안 렌더링
   */
  renderSuggestion(tag: string, el: HTMLElement): void {
    const suggestionEl = el.createDiv({ cls: 'suggestion-item' });
    suggestionEl.createDiv({ text: tag });
  }

  /**
   * 제안 선택
   */
  onChooseSuggestion(tag: string): void {
    this.onSelect(tag);
  }
} 