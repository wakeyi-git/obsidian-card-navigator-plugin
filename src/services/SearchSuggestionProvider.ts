import { IObsidianApp } from '../domain/obsidian/ObsidianInterfaces';
import { ISearchSuggestionProviderImpl } from '../domain/search/SearchSuggestionProvider';
import { ISearchSuggestion, SearchType } from '../domain/search/Search';

/**
 * 검색 제안 제공자 클래스
 * 검색 제안을 제공합니다.
 */
export class SearchSuggestionProvider implements ISearchSuggestionProviderImpl {
  /**
   * Obsidian 앱 어댑터
   */
  private obsidianApp: IObsidianApp;
  
  /**
   * 생성자
   * @param obsidianApp Obsidian 앱 어댑터
   */
  constructor(obsidianApp: IObsidianApp) {
    this.obsidianApp = obsidianApp;
  }
  
  /**
   * 검색 타입 제안 가져오기
   * @returns 검색 타입 제안 목록
   */
  getSearchTypeSuggestions(): ISearchSuggestion[] {
    return [
      {
        text: 'path:',
        type: 'path',
        description: '파일 경로로 검색'
      },
      {
        text: 'file:',
        type: 'file',
        description: '파일 이름으로 검색'
      },
      {
        text: 'tag:',
        type: 'tag',
        description: '태그로 검색'
      },
      {
        text: 'content:',
        type: 'content',
        description: '내용으로 검색'
      },
      {
        text: 'create:',
        type: 'create',
        description: '생성일로 검색'
      },
      {
        text: 'modify:',
        type: 'modify',
        description: '수정일로 검색'
      },
      {
        text: '[]',
        type: 'frontmatter',
        description: '프론트매터로 검색'
      }
    ];
  }
  
  /**
   * 검색어 제안 가져오기
   * @param searchType 검색 타입
   * @param partialQuery 부분 검색어
   * @returns 검색어 제안 목록
   */
  async getQuerySuggestions(searchType: SearchType, partialQuery: string): Promise<ISearchSuggestion[]> {
    switch (searchType) {
      case 'path':
        return this.getPathSuggestions(partialQuery);
      case 'file':
        return this.getFilenameSuggestions(partialQuery);
      case 'tag':
        return this.getTagSuggestions(partialQuery);
      case 'frontmatter':
        return this.getFrontmatterKeySuggestions(partialQuery);
      case 'create':
      case 'modify':
        return this.getDateSuggestions(searchType, partialQuery);
      default:
        return [];
    }
  }
  
  /**
   * 경로 제안 가져오기
   * @param partialPath 부분 경로
   * @returns 경로 제안 목록
   */
  async getPathSuggestions(partialPath: string): Promise<ISearchSuggestion[]> {
    const folders = new Set<string>();
    const vault = this.obsidianApp.getVault();
    
    // 모든 파일의 경로 수집
    vault.getMarkdownFiles().forEach(file => {
      if (file.parent) {
        const folderPath = file.parent.path;
        if (folderPath) {
          folders.add(folderPath);
        }
      }
    });
    
    // 부분 경로로 필터링
    return Array.from(folders)
      .filter(path => path.toLowerCase().includes(partialPath.toLowerCase()))
      .map(path => {
        const highlightStart = path.toLowerCase().indexOf(partialPath.toLowerCase());
        const highlightEnd = highlightStart + partialPath.length;
        return {
          text: path,
          type: 'path' as SearchType,
          description: `폴더: ${path}`,
          highlightIndices: highlightStart >= 0 ? [[highlightStart, highlightEnd] as [number, number]] : undefined
        };
      })
      .sort((a, b) => a.text.localeCompare(b.text));
  }
  
  /**
   * 파일명 제안 가져오기
   * @param partialName 부분 파일명
   * @returns 파일명 제안 목록
   */
  async getFilenameSuggestions(partialName: string): Promise<ISearchSuggestion[]> {
    const vault = this.obsidianApp.getVault();
    
    // 모든 마크다운 파일 가져오기
    const files = vault.getMarkdownFiles();
    
    // 부분 파일명으로 필터링
    return files
      .filter(file => file.basename.toLowerCase().includes(partialName.toLowerCase()))
      .map(file => {
        const highlightStart = file.basename.toLowerCase().indexOf(partialName.toLowerCase());
        const highlightEnd = highlightStart + partialName.length;
        return {
          text: file.basename,
          type: 'file' as SearchType,
          description: `파일: ${file.path}`,
          highlightIndices: highlightStart >= 0 ? [[highlightStart, highlightEnd] as [number, number]] : undefined
        };
      })
      .sort((a, b) => a.text.localeCompare(b.text));
  }
  
  /**
   * 태그 제안 가져오기
   * @param partialTag 부분 태그
   * @returns 태그 제안 목록
   */
  async getTagSuggestions(partialTag: string): Promise<ISearchSuggestion[]> {
    const vault = this.obsidianApp.getVault();
    const metadataCache = this.obsidianApp.getMetadataCache();
    
    // 모든 태그 수집
    const tagMap = new Map<string, number>();
    
    vault.getMarkdownFiles().forEach(file => {
      const metadata = metadataCache.getFileCache(file);
      if (metadata?.tags) {
        metadata.tags.forEach((tag: { tag: string }) => {
          const tagName = tag.tag;
          tagMap.set(tagName, (tagMap.get(tagName) || 0) + 1);
        });
      }
    });
    
    // 부분 태그로 필터링
    return Array.from(tagMap.entries())
      .filter(([tag]) => tag.toLowerCase().includes(partialTag.toLowerCase()))
      .map(([tag, count]) => {
        const highlightStart = tag.toLowerCase().indexOf(partialTag.toLowerCase());
        const highlightEnd = highlightStart + partialTag.length;
        return {
          text: tag,
          type: 'tag' as SearchType,
          description: `태그: ${tag} (${count}개 노트)`,
          highlightIndices: highlightStart >= 0 ? [[highlightStart, highlightEnd] as [number, number]] : undefined
        };
      })
      .sort((a, b) => a.text.localeCompare(b.text));
  }
  
  /**
   * 프론트매터 키 제안 가져오기
   * @param partialKey 부분 키
   * @returns 프론트매터 키 제안 목록
   */
  async getFrontmatterKeySuggestions(partialKey: string): Promise<ISearchSuggestion[]> {
    const vault = this.obsidianApp.getVault();
    const metadataCache = this.obsidianApp.getMetadataCache();
    
    const frontmatterKeys = new Set<string>();
    
    // 모든 파일의 프론트매터 키 수집
    vault.getMarkdownFiles().forEach(file => {
      const cache = metadataCache.getFileCache(file);
      if (cache?.frontmatter) {
        Object.keys(cache.frontmatter).forEach(key => {
          if (key !== 'position') {
            frontmatterKeys.add(key);
          }
        });
      }
    });
    
    // 부분 키로 필터링
    return Array.from(frontmatterKeys)
      .filter(key => key.toLowerCase().includes(partialKey.toLowerCase()))
      .map(key => {
        const highlightStart = key.toLowerCase().indexOf(partialKey.toLowerCase());
        const highlightEnd = highlightStart + partialKey.length;
        return {
          text: key,
          type: 'frontmatter' as SearchType,
          description: `프론트매터 키: ${key}`,
          highlightIndices: highlightStart >= 0 ? [[highlightStart, highlightEnd] as [number, number]] : undefined
        };
      })
      .sort((a, b) => a.text.localeCompare(b.text));
  }
  
  /**
   * 프론트매터 값 제안 가져오기
   * @param key 프론트매터 키
   * @param partialValue 부분 값
   * @returns 프론트매터 값 제안 목록
   */
  async getFrontmatterValueSuggestions(key: string, partialValue: string): Promise<ISearchSuggestion[]> {
    const vault = this.obsidianApp.getVault();
    const metadataCache = this.obsidianApp.getMetadataCache();
    
    const values = new Set<string>();
    
    // 모든 파일의 해당 프론트매터 키에 대한 값 수집
    vault.getMarkdownFiles().forEach(file => {
      const cache = metadataCache.getFileCache(file);
      if (cache?.frontmatter && cache.frontmatter[key] !== undefined) {
        const value = cache.frontmatter[key];
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          values.add(String(value));
        }
      }
    });
    
    // 부분 값으로 필터링
    return Array.from(values)
      .filter(value => value.toLowerCase().includes(partialValue.toLowerCase()))
      .map(value => {
        const highlightStart = value.toLowerCase().indexOf(partialValue.toLowerCase());
        const highlightEnd = highlightStart + partialValue.length;
        return {
          text: value,
          type: 'frontmatter' as SearchType,
          description: `${key}: ${value}`,
          highlightIndices: highlightStart >= 0 ? [[highlightStart, highlightEnd] as [number, number]] : undefined
        };
      })
      .sort((a, b) => a.text.localeCompare(b.text));
  }
  
  /**
   * 날짜 제안 가져오기
   * @param searchType 검색 타입 ('create' 또는 'modify')
   * @param partialDate 부분 날짜
   * @returns 날짜 제안 목록
   */
  async getDateSuggestions(searchType: 'create' | 'modify', partialDate: string): Promise<ISearchSuggestion[]> {
    // 현재 날짜 기준 제안
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    // 날짜 형식 지정 함수
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // 기본 날짜 제안
    const suggestions: ISearchSuggestion[] = [
      {
        text: formatDate(today),
        type: searchType,
        description: `오늘 (${formatDate(today)})`,
        highlightIndices: partialDate ? [[formatDate(today).indexOf(partialDate), formatDate(today).indexOf(partialDate) + partialDate.length] as [number, number]] : undefined
      },
      {
        text: formatDate(yesterday),
        type: searchType,
        description: `어제 (${formatDate(yesterday)})`,
        highlightIndices: partialDate ? [[formatDate(yesterday).indexOf(partialDate), formatDate(yesterday).indexOf(partialDate) + partialDate.length] as [number, number]] : undefined
      },
      {
        text: formatDate(lastWeek),
        type: searchType,
        description: `일주일 전 (${formatDate(lastWeek)})`,
        highlightIndices: partialDate ? [[formatDate(lastWeek).indexOf(partialDate), formatDate(lastWeek).indexOf(partialDate) + partialDate.length] as [number, number]] : undefined
      }
    ];
    
    // 부분 날짜로 필터링
    return suggestions
      .filter(suggestion => suggestion.text.includes(partialDate))
      .sort((a, b) => a.text.localeCompare(b.text));
  }
} 