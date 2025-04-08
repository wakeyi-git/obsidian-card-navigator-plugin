import { App, SuggestModal } from 'obsidian';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { Container } from '@/infrastructure/di/Container';

/**
 * 태그 선택 서제스트 모달
 */
export class TagSuggestModal extends SuggestModal<string> {
  private readonly loggingService: ILoggingService;
  public onChoose: (tag: string) => void;
  private tags: string[] = [];

  constructor(app: App) {
    super(app);
    this.loggingService = Container.getInstance().resolve<ILoggingService>('ILoggingService');
    this.setPlaceholder('태그를 입력하거나 선택하세요');
    this.loadTags();
  }

  /**
   * 볼트 내 모든 태그 로드
   */
  private loadTags(): void {
    try {
      this.loggingService.debug('태그 목록 로드 시작');
      
      const tagSet = new Set<string>();
      
      // 마크다운 파일 순회
      this.app.vault.getMarkdownFiles().forEach(file => {
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache?.tags) {
          // 캐시에서 태그 추출
          cache.tags.forEach(tag => {
            tagSet.add(tag.tag);
          });
        }
        
        // 프론트매터에서 태그 추출
        if (cache && cache.frontmatter && cache.frontmatter.tags) {
          const fmTags = cache.frontmatter.tags;
          if (Array.isArray(fmTags)) {
            fmTags.forEach(tag => tagSet.add('#' + tag));
          } else if (typeof fmTags === 'string') {
            tagSet.add('#' + fmTags);
          }
        }
      });
      
      this.tags = Array.from(tagSet).sort();
      this.loggingService.debug('태그 목록 로드 완료', { tagCount: this.tags.length });
    } catch (error) {
      this.loggingService.error('태그 목록 로드 실패', { error });
    }
  }

  /**
   * 사용자 입력에 따라 제안 목록 생성
   */
  getSuggestions(query: string): string[] {
    return this.tags.filter(tag => 
      tag.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * 제안 항목 렌더링
   */
  renderSuggestion(tag: string, el: HTMLElement): void {
    el.createEl('div', { text: tag });
  }

  /**
   * 제안 항목 선택 처리
   */
  onChooseSuggestion(tag: string, evt: MouseEvent | KeyboardEvent): void {
    try {
      this.loggingService.debug('태그 선택됨', { tag });
      
      // 모달 닫은 후 이벤트 처리
      this.close();
      
      // 콜백이 있는 경우에만 실행
      if (this.onChoose) {
        // 모달 내에서의 중복 호출 방지 (마우스 더블 클릭 등에 의한 중복 호출 방지)
        setTimeout(() => {
          this.onChoose(tag);
        }, 50);
      }
    } catch (error) {
      this.loggingService.error('태그 선택 처리 중 오류 발생', { error, tag });
    }
  }
} 