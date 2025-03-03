import { Card } from '../../core/models/Card';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';

/**
 * 검색 인덱스 서비스 클래스
 * 카드 내용의 효율적인 검색을 위한 인덱싱을 제공합니다.
 */
export class SearchIndexService {
  private searchIndex: Map<string, Set<string>> = new Map();
  private contentIndex: Map<string, string> = new Map();
  private tokenCache: Map<string, string[]> = new Map();
  private readonly stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', '이', '그', '저', '이것', '그것', '저것', '이런', '그런', '저런', '이번', '그번', '저번']);

  /**
   * 카드를 인덱싱합니다.
   */
  public indexCard(card: Card): void {
    try {
      // 이전 인덱스 제거
      this.removeCardFromIndex(card.id);

      // 카드 내용이 없는 경우 빈 문자열로 처리
      const content = card.content || '';

      // 카드 내용 토큰화 및 인덱싱
      const tokens = this.tokenizeContent(content);
      tokens.forEach(token => {
        if (!this.searchIndex.has(token)) {
          this.searchIndex.set(token, new Set());
        }
        this.searchIndex.get(token)?.add(card.id);
      });

      // 원본 내용 캐싱
      this.contentIndex.set(card.id, content);

      Log.debug('SearchIndexService', `카드 인덱싱 완료: ${card.id}`);
    } catch (error) {
      ErrorHandler.handleError('SearchIndexService.indexCard', `카드 인덱싱 실패: ${error}`, false);
    }
  }

  /**
   * 검색을 수행합니다.
   */
  public search(query: string): string[] {
    try {
      const tokens = this.tokenizeContent(query);
      if (tokens.length === 0) return [];

      // 각 토큰에 대한 결과 집합 가져오기
      const resultSets = tokens.map(token => this.searchIndex.get(token) || new Set<string>());

      // 결과 집합의 교집합 계산
      const intersection = resultSets.reduce((a, b) => {
        return new Set([...a].filter(x => b.has(x)));
      });

      return Array.from(intersection) as string[];
    } catch (error) {
      ErrorHandler.handleError('SearchIndexService.search', `검색 실패: ${error}`, false);
      return [];
    }
  }

  /**
   * 내용을 토큰화합니다.
   */
  private tokenizeContent(content: string): string[] {
    try {
      if (!content) return [];

      // 캐시된 토큰이 있는지 확인
      if (this.tokenCache.has(content)) {
        return this.tokenCache.get(content) || [];
      }

      // 토큰화 수행
      const tokens = content.toLowerCase()
        .replace(/[^a-z0-9가-힣\s]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 1 && !this.stopWords.has(token));

      // 토큰 캐시에 저장
      this.tokenCache.set(content, tokens);

      return tokens;
    } catch (error) {
      ErrorHandler.handleError('SearchIndexService.tokenizeContent', `토큰화 실패: ${error}`, false);
      return [];
    }
  }

  /**
   * 카드를 인덱스에서 제거합니다.
   */
  private removeCardFromIndex(cardId: string): void {
    try {
      // 모든 토큰에서 카드 ID 제거
      this.searchIndex.forEach(cardIds => {
        cardIds.delete(cardId);
      });

      // 내용 캐시에서 제거
      this.contentIndex.delete(cardId);

      Log.debug('SearchIndexService', `카드 인덱스 제거 완료: ${cardId}`);
    } catch (error) {
      ErrorHandler.handleError('SearchIndexService.removeCardFromIndex', `카드 인덱스 제거 실패: ${error}`, false);
    }
  }

  /**
   * 인덱스를 초기화합니다.
   */
  public clearIndex(): void {
    try {
      this.searchIndex.clear();
      this.contentIndex.clear();
      this.tokenCache.clear();
      Log.debug('SearchIndexService', '인덱스 초기화 완료');
    } catch (error) {
      ErrorHandler.handleError('SearchIndexService.clearIndex', `인덱스 초기화 실패: ${error}`, false);
    }
  }
} 