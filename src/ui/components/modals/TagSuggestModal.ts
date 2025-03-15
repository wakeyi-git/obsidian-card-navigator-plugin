import { SuggestModal } from 'obsidian';
import { ObsidianService } from '../../../infrastructure/obsidian/adapters/ObsidianService';

/**
 * 태그 제안 모달
 * 태그 선택을 위한 제안 모달입니다.
 */
export class TagSuggestModal extends SuggestModal<string> {
  private obsidianService: ObsidianService;
  private onSelect: (tag: string) => void;
  private tags: string[] = [];

  /**
   * 생성자
   * @param obsidianService Obsidian 서비스
   * @param onSelect 선택 콜백 함수
   */
  constructor(obsidianService: ObsidianService, onSelect: (tag: string) => void) {
    super(obsidianService.getApp());
    this.obsidianService = obsidianService;
    this.onSelect = onSelect;
    this.setPlaceholder('태그 이름 입력 또는 선택');
    this.loadTags();
  }

  /**
   * 태그 목록 로드
   */
  private loadTags(): void {
    this.tags = this.obsidianService.getAllTags();
  }

  /**
   * 제안 항목 가져오기
   * @param query 검색어
   * @returns 제안 항목 목록
   */
  getSuggestions(query: string): string[] {
    if (!query) {
      return this.tags;
    }
    
    return this.tags.filter(tag => 
      tag.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * 제안 항목 렌더링
   * @param tag 태그
   * @param el 렌더링할 요소
   */
  renderSuggestion(tag: string, el: HTMLElement): void {
    el.createEl('div', {
      text: tag,
      cls: 'tag-suggestion-item'
    });
  }

  /**
   * 제안 항목 선택 처리
   * @param tag 선택된 태그
   * @param evt 이벤트
   */
  onChooseSuggestion(tag: string, evt: MouseEvent | KeyboardEvent): void {
    this.onSelect(tag);
  }
} 