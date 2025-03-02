import { App, Setting, ToggleComponent } from 'obsidian';
import { SearchService } from '../../../services/search/SearchService';
import { SearchOptions as SearchOptionsType } from '../../../core/types/search.types';
import { ErrorHandler } from '../../../utils/error/ErrorHandler';

/**
 * 검색 옵션 컴포넌트
 * 검색 옵션을 설정할 수 있는 UI를 제공합니다.
 */
export class SearchOptions {
  /**
   * 컴포넌트 컨테이너 요소
   */
  private containerEl: HTMLElement;
  
  /**
   * 검색 서비스
   */
  private searchService: SearchService;
  
  /**
   * 토글 컴포넌트 맵
   */
  private toggleComponents: Map<keyof SearchOptionsType, ToggleComponent> = new Map();
  
  /**
   * 검색 옵션 변경 콜백 함수
   */
  private onOptionsChange: (options: SearchOptionsType) => void;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param containerEl 컴포넌트 컨테이너 요소
   * @param searchService 검색 서비스
   * @param onOptionsChange 검색 옵션 변경 콜백 함수
   */
  constructor(
    private app: App,
    containerEl: HTMLElement,
    searchService: SearchService,
    onOptionsChange: (options: SearchOptionsType) => void
  ) {
    this.containerEl = containerEl;
    this.searchService = searchService;
    this.onOptionsChange = onOptionsChange;
    
    this.render();
  }
  
  /**
   * 컴포넌트 렌더링
   */
  private render(): void {
    try {
      // 컨테이너 클래스 추가
      this.containerEl.addClass('card-navigator-search-options');
      
      // 현재 검색 옵션 가져오기
      const currentOptions = this.searchService.getSearchOptions();
      
      // 제목 검색 옵션
      new Setting(this.containerEl)
        .setName('제목 검색')
        .setDesc('파일 제목에서 검색합니다.')
        .addToggle(toggle => {
          toggle
            .setValue(currentOptions.searchInTitles)
            .onChange(value => {
              this.updateOption('searchInTitles', value);
            });
          this.toggleComponents.set('searchInTitles', toggle);
        });
      
      // 헤더 검색 옵션
      new Setting(this.containerEl)
        .setName('헤더 검색')
        .setDesc('헤더에서 검색합니다.')
        .addToggle(toggle => {
          toggle
            .setValue(currentOptions.searchInHeaders)
            .onChange(value => {
              this.updateOption('searchInHeaders', value);
            });
          this.toggleComponents.set('searchInHeaders', toggle);
        });
      
      // 내용 검색 옵션
      new Setting(this.containerEl)
        .setName('내용 검색')
        .setDesc('파일 내용에서 검색합니다.')
        .addToggle(toggle => {
          toggle
            .setValue(currentOptions.searchInContent)
            .onChange(value => {
              this.updateOption('searchInContent', value);
            });
          this.toggleComponents.set('searchInContent', toggle);
        });
      
      // 태그 검색 옵션
      new Setting(this.containerEl)
        .setName('태그 검색')
        .setDesc('태그에서 검색합니다.')
        .addToggle(toggle => {
          toggle
            .setValue(currentOptions.searchInTags)
            .onChange(value => {
              this.updateOption('searchInTags', value);
            });
          this.toggleComponents.set('searchInTags', toggle);
        });
      
      // 프론트매터 검색 옵션
      new Setting(this.containerEl)
        .setName('프론트매터 검색')
        .setDesc('프론트매터에서 검색합니다.')
        .addToggle(toggle => {
          toggle
            .setValue(currentOptions.searchInFrontmatter)
            .onChange(value => {
              this.updateOption('searchInFrontmatter', value);
            });
          this.toggleComponents.set('searchInFrontmatter', toggle);
        });
      
      // 대소문자 구분 옵션
      new Setting(this.containerEl)
        .setName('대소문자 구분')
        .setDesc('대소문자를 구분하여 검색합니다.')
        .addToggle(toggle => {
          toggle
            .setValue(currentOptions.caseSensitive)
            .onChange(value => {
              this.updateOption('caseSensitive', value);
            });
          this.toggleComponents.set('caseSensitive', toggle);
        });
      
      // 정규식 사용 옵션
      new Setting(this.containerEl)
        .setName('정규식 사용')
        .setDesc('정규식을 사용하여 검색합니다.')
        .addToggle(toggle => {
          toggle
            .setValue(currentOptions.useRegex)
            .onChange(value => {
              this.updateOption('useRegex', value);
            });
          this.toggleComponents.set('useRegex', toggle);
        });
      
      // 전체 단어 일치 옵션
      new Setting(this.containerEl)
        .setName('전체 단어 일치')
        .setDesc('전체 단어가 일치하는 경우에만 검색합니다.')
        .addToggle(toggle => {
          toggle
            .setValue(currentOptions.matchWholeWord)
            .onChange(value => {
              this.updateOption('matchWholeWord', value);
            });
          this.toggleComponents.set('matchWholeWord', toggle);
        });
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 옵션 컴포넌트를 렌더링하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 검색 옵션 업데이트
   * @param key 옵션 키
   * @param value 옵션 값
   */
  private updateOption(key: keyof SearchOptionsType, value: boolean): void {
    try {
      // 현재 검색 옵션 가져오기
      const currentOptions = this.searchService.getSearchOptions();
      
      // 옵션 업데이트
      const updatedOptions: SearchOptionsType = {
        ...currentOptions,
        [key]: value
      };
      
      // 검색 서비스 업데이트
      this.searchService.setSearchOptions(updatedOptions);
      
      // 콜백 호출
      this.onOptionsChange(updatedOptions);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 옵션을 업데이트하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 검색 옵션 설정
   * @param options 검색 옵션
   */
  public setOptions(options: SearchOptionsType): void {
    try {
      // 검색 서비스 업데이트
      this.searchService.setSearchOptions(options);
      
      // 토글 컴포넌트 업데이트
      for (const [key, value] of Object.entries(options)) {
        const toggleComponent = this.toggleComponents.get(key as keyof SearchOptionsType);
        if (toggleComponent) {
          toggleComponent.setValue(value as boolean);
        }
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 옵션을 설정하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 검색 옵션 가져오기
   * @returns 현재 검색 옵션
   */
  public getOptions(): SearchOptionsType {
    return this.searchService.getSearchOptions();
  }
  
  /**
   * 컴포넌트 파괴
   */
  public destroy(): void {
    try {
      // 컨테이너 비우기
      this.containerEl.empty();
      
      // 토글 컴포넌트 맵 초기화
      this.toggleComponents.clear();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 옵션 컴포넌트를 파괴하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
} 