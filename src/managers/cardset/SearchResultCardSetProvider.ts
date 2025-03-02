import { App, TFile } from 'obsidian';
import { CardSet } from '../../core/models/CardSet';
import { CardSetType } from '../../core/types/cardset.types';
import { ICardSetProvider } from '../../core/interfaces/ICardSetProvider';
import { ErrorHandler } from '../../utils/error/ErrorHandler';

/**
 * 검색 결과 카드셋 제공자 클래스
 * 검색 쿼리에 일치하는 노트 파일들만 카드로 표시하는 카드셋 제공자입니다.
 */
export class SearchResultCardSetProvider implements ICardSetProvider {
  /**
   * 카드셋 타입
   */
  public readonly type: CardSetType = CardSetType.SEARCH_RESULT;
  
  /**
   * Obsidian 앱 인스턴스
   */
  private app: App;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(app: App) {
    this.app = app;
  }
  
  /**
   * 카드셋 로드
   * @param searchQuery 검색 쿼리
   * @returns 로드된 카드셋
   */
  async loadCardSet(searchQuery?: string): Promise<CardSet> {
    try {
      // 검색 쿼리가 없으면 빈 카드셋 생성
      if (!searchQuery) {
        return new CardSet(
          `search-results-${Date.now()}`,
          'search-results',
          '',
          []
        );
      }
      
      // 검색 결과 파일 가져오기
      const files = await this.searchFiles(searchQuery);
      
      // 카드셋 생성 및 반환
      return new CardSet(
        `search-results-${Date.now()}`,
        'search-results',
        searchQuery,
        files
      );
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'SearchResultCardSetProvider.loadCardSet',
        '검색 결과 카드셋 로드 중 오류가 발생했습니다.',
        error
      );
      
      // 오류 발생 시 빈 카드셋 생성
      return new CardSet(
        `search-results-${Date.now()}`,
        'search-results',
        searchQuery || '',
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
      // 카드셋 소스(검색 쿼리)가 없으면 빈 카드셋 반환
      if (!cardSet.source) {
        return cardSet;
      }
      
      // 검색 결과 파일 가져오기
      const files = await this.searchFiles(cardSet.source);
      
      // 카드셋 새로고침
      return cardSet.refresh(files);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'SearchResultCardSetProvider.refreshCardSet',
        '검색 결과 카드셋 새로고침 중 오류가 발생했습니다.',
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
    // 파일이 없거나 카드셋 소스(검색 쿼리)가 없으면 기존 카드셋 반환
    if (!file || !cardSet.source) {
      return cardSet;
    }
    
    try {
      // 파일이 마크다운 파일인지 확인
      if (file.extension === 'md') {
        // 파일이 검색 쿼리와 일치하는지 확인
        const isMatch = await this.isFileMatchingQuery(file, cardSet.source);
        
        if (isMatch) {
          // 카드셋에 파일이 이미 있는지 확인
          if (cardSet.containsFile(file.path)) {
            // 파일 업데이트
            return cardSet.updateFile(file);
          } else {
            // 파일 추가
            return cardSet.addFile(file);
          }
        } else {
          // 파일이 검색 쿼리와 일치하지 않지만 카드셋에 있으면 제거
          if (cardSet.containsFile(file.path)) {
            return cardSet.removeFile(file.path);
          }
        }
      }
      
      // 마크다운 파일이 아니면 기존 카드셋 반환
      return cardSet;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'SearchResultCardSetProvider.handleFileChange',
        '파일 변경 처리 중 오류가 발생했습니다.',
        error
      );
      
      // 오류 발생 시 기존 카드셋 반환
      return cardSet;
    }
  }
  
  /**
   * 검색 쿼리로 파일 검색
   * @param query 검색 쿼리
   * @returns 검색 결과 파일 배열
   */
  private async searchFiles(query: string): Promise<TFile[]> {
    try {
      // 검색 쿼리가 비어있으면 빈 배열 반환
      if (!query.trim()) {
        return [];
      }
      
      // 볼트 내 모든 마크다운 파일 가져오기
      const allFiles = this.app.vault.getMarkdownFiles();
      
      // 검색 쿼리와 일치하는 파일 필터링
      const matchingFiles: TFile[] = [];
      
      for (const file of allFiles) {
        const isMatch = await this.isFileMatchingQuery(file, query);
        if (isMatch) {
          matchingFiles.push(file);
        }
      }
      
      return matchingFiles;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'SearchResultCardSetProvider.searchFiles',
        '파일 검색 중 오류가 발생했습니다.',
        error
      );
      
      return [];
    }
  }
  
  /**
   * 파일이 검색 쿼리와 일치하는지 확인
   * @param file 파일
   * @param query 검색 쿼리
   * @returns 일치 여부
   */
  private async isFileMatchingQuery(file: TFile, query: string): Promise<boolean> {
    try {
      // 검색 쿼리가 비어있으면 일치하지 않음
      if (!query.trim()) {
        return false;
      }
      
      // 파일 경로에서 검색
      if (file.path.toLowerCase().includes(query.toLowerCase())) {
        return true;
      }
      
      // 파일 내용에서 검색
      const content = await this.app.vault.cachedRead(file);
      if (content.toLowerCase().includes(query.toLowerCase())) {
        return true;
      }
      
      // 메타데이터에서 검색
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache) {
        // 프론트매터 검색
        if (cache.frontmatter) {
          const frontmatterStr = JSON.stringify(cache.frontmatter).toLowerCase();
          if (frontmatterStr.includes(query.toLowerCase())) {
            return true;
          }
        }
        
        // 헤딩 검색
        if (cache.headings) {
          for (const heading of cache.headings) {
            if (heading.heading.toLowerCase().includes(query.toLowerCase())) {
              return true;
            }
          }
        }
        
        // 태그 검색
        if (cache.tags) {
          for (const tag of cache.tags) {
            if (tag.tag.toLowerCase().includes(query.toLowerCase())) {
              return true;
            }
          }
        }
      }
      
      return false;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        'SearchResultCardSetProvider.isFileMatchingQuery',
        '파일 검색 일치 확인 중 오류가 발생했습니다.',
        error
      );
      
      return false;
    }
  }
} 