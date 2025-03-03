import { App, TFile } from 'obsidian';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { IMetadataService } from '../../core/interfaces/service/IMetadataService';
import { IFileService } from '../../core/interfaces/service/IFileService';
import { ITagService } from '../../core/interfaces/service/ITagService';

/**
 * TagService 클래스는 Obsidian의 태그 관련 기능을 제공합니다.
 */
export class TagService implements ITagService {
  /**
   * TagService 생성자
   * @param app Obsidian 앱 인스턴스
   * @param metadataService 메타데이터 서비스 인스턴스
   * @param fileService 파일 서비스 인스턴스
   */
  constructor(
    private readonly app: App, 
    private readonly metadataService: IMetadataService, 
    private readonly fileService: IFileService
  ) {
    Log.debug('TagService', '태그 서비스 초기화 완료');
  }

  /**
   * 볼트의 모든 태그를 가져옵니다.
   * @returns 태그 배열
   */
  public getAllTags(): string[] {
    try {
      // 메타데이터 캐시에서 모든 태그 가져오기
      const allTags = new Set<string>();
      
      // 모든 마크다운 파일을 순회하며 태그 수집
      const files = this.fileService.getMarkdownFiles('/', true, false);
      
      for (const file of files) {
        const cache = this.app.metadataCache.getFileCache(file);
        if (!cache) continue;
        
        // 프론트매터 태그
        if (cache.frontmatter) {
          // tags 필드
          if (cache.frontmatter.tags) {
            if (Array.isArray(cache.frontmatter.tags)) {
              cache.frontmatter.tags.forEach((tag: any) => allTags.add(String(tag)));
            } else if (typeof cache.frontmatter.tags === 'string') {
              allTags.add(cache.frontmatter.tags);
            }
          }
          
          // tag 필드
          if (cache.frontmatter.tag) {
            if (Array.isArray(cache.frontmatter.tag)) {
              cache.frontmatter.tag.forEach((tag: any) => allTags.add(String(tag)));
            } else if (typeof cache.frontmatter.tag === 'string') {
              allTags.add(cache.frontmatter.tag);
            }
          }
        }
        
        // 인라인 태그
        if (cache.tags) {
          cache.tags.forEach((tagCache: { tag: string }) => {
            // #tag 형식에서 # 제거
            const tag = tagCache.tag.substring(1);
            allTags.add(tag);
          });
        }
      }
      
      return Array.from(allTags).sort();
    } catch (error) {
      ErrorHandler.handleError('모든 태그 가져오기 실패', error);
      return [];
    }
  }

  /**
   * 특정 태그를 가진 모든 파일을 가져옵니다.
   * @param tag 검색할 태그
   * @returns 파일 배열
   */
  public getFilesWithTag(tag: string): TFile[] {
    try {
      const files: TFile[] = [];
      
      // 모든 마크다운 파일 가져오기
      const allFiles = this.fileService.getAllMarkdownFiles();
      
      // 각 파일에 대해 태그 확인
      for (const file of allFiles) {
        if (this.metadataService.hasTag(file, tag)) {
          files.push(file);
        }
      }
      
      return files;
    } catch (error) {
      ErrorHandler.handleError(`태그로 파일 가져오기 실패: ${tag}`, error);
      return [];
    }
  }

  /**
   * 여러 태그를 모두 가진 파일을 가져옵니다. (AND 조건)
   * @param tags 검색할 태그 배열
   * @returns 파일 배열
   */
  public getFilesWithAllTags(tags: string[]): TFile[] {
    try {
      if (tags.length === 0) {
        return [];
      }
      
      // 모든 마크다운 파일 가져오기
      const allFiles = this.fileService.getAllMarkdownFiles();
      
      // 각 파일에 대해 모든 태그 확인
      return allFiles.filter(file => {
        const fileTags = this.metadataService.getTags(file);
        return tags.every(tag => fileTags.includes(tag));
      });
    } catch (error) {
      ErrorHandler.handleError(`모든 태그로 파일 가져오기 실패: ${tags.join(', ')}`, error);
      return [];
    }
  }

  /**
   * 여러 태그 중 하나라도 가진 파일을 가져옵니다. (OR 조건)
   * @param tags 검색할 태그 배열
   * @returns 파일 배열
   */
  public getFilesWithAnyTag(tags: string[]): TFile[] {
    try {
      if (tags.length === 0) {
        return [];
      }
      
      // 모든 마크다운 파일 가져오기
      const allFiles = this.fileService.getAllMarkdownFiles();
      
      // 각 파일에 대해 하나라도 태그 확인
      return allFiles.filter(file => {
        const fileTags = this.metadataService.getTags(file);
        return tags.some(tag => fileTags.includes(tag));
      });
    } catch (error) {
      ErrorHandler.handleError(`아무 태그로 파일 가져오기 실패: ${tags.join(', ')}`, error);
      return [];
    }
  }

  /**
   * 태그 계층 구조를 가져옵니다.
   * @returns 태그 계층 구조 객체
   */
  public getTagHierarchy(): Record<string, string[]> {
    try {
      const allTags = this.getAllTags();
      const hierarchy: Record<string, string[]> = {};
      
      // 태그 계층 구조 생성
      for (const tag of allTags) {
        const parts = tag.split('/');
        
        for (let i = 0; i < parts.length; i++) {
          const parent = i === 0 ? '' : parts.slice(0, i).join('/');
          const current = parts.slice(0, i + 1).join('/');
          
          if (!hierarchy[parent]) {
            hierarchy[parent] = [];
          }
          
          if (!hierarchy[parent].includes(current)) {
            hierarchy[parent].push(current);
          }
        }
      }
      
      return hierarchy;
    } catch (error) {
      ErrorHandler.handleError('태그 계층 구조 가져오기 실패', error);
      return {};
    }
  }

  /**
   * 태그 사용 빈도를 가져옵니다.
   * @returns 태그와 사용 횟수 맵
   */
  public getTagFrequency(): Map<string, number> {
    try {
      const tagFrequency = new Map<string, number>();
      
      // 모든 마크다운 파일 가져오기
      const allFiles = this.fileService.getAllMarkdownFiles();
      
      // 각 파일의 태그 카운트
      for (const file of allFiles) {
        const tags = this.metadataService.getTags(file);
        
        for (const tag of tags) {
          const count = tagFrequency.get(tag) || 0;
          tagFrequency.set(tag, count + 1);
        }
      }
      
      return tagFrequency;
    } catch (error) {
      ErrorHandler.handleError('태그 사용 빈도 가져오기 실패', error);
      return new Map<string, number>();
    }
  }

  /**
   * 가장 많이 사용된 태그를 가져옵니다.
   * @param limit 가져올 태그 수
   * @returns 태그와 사용 횟수 배열
   */
  public getMostUsedTags(limit: number = 10): [string, number][] {
    try {
      const tagFrequency = this.getTagFrequency();
      
      // 사용 빈도 기준 정렬
      return Array.from(tagFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
    } catch (error) {
      ErrorHandler.handleError('가장 많이 사용된 태그 가져오기 실패', error);
      return [];
    }
  }

  /**
   * 태그 관련 파일을 가져옵니다.
   * @param tag 태그
   * @returns 관련 파일 배열
   */
  public getRelatedFiles(tag: string): TFile[] {
    try {
      // 태그가 있는 파일 가져오기
      const filesWithTag = this.getFilesWithTag(tag);
      
      // 관련 태그 찾기
      const relatedTags = new Set<string>();
      
      for (const file of filesWithTag) {
        const tags = this.metadataService.getTags(file);
        tags.forEach(t => {
          if (t !== tag) {
            relatedTags.add(t);
          }
        });
      }
      
      // 관련 태그가 있는 파일 가져오기
      const relatedFiles = this.getFilesWithAnyTag(Array.from(relatedTags));
      
      // 중복 제거
      const uniqueFiles = new Map<string, TFile>();
      
      [...filesWithTag, ...relatedFiles].forEach(file => {
        uniqueFiles.set(file.path, file);
      });
      
      return Array.from(uniqueFiles.values());
    } catch (error) {
      ErrorHandler.handleError(`태그 관련 파일 가져오기 실패: ${tag}`, error);
      return [];
    }
  }

  /**
   * 태그 색상을 가져옵니다. (CSS 변수 기반)
   * @param tag 태그
   * @returns 색상 코드
   */
  public getTagColor(tag: string): string {
    try {
      // 태그 해시 생성
      let hash = 0;
      for (let i = 0; i < tag.length; i++) {
        hash = ((hash << 5) - hash) + tag.charCodeAt(i);
        hash |= 0; // 32비트 정수로 변환
      }
      
      // 색상 인덱스 계산 (0-5)
      const colorIndex = Math.abs(hash) % 6;
      
      // CSS 변수 반환
      return `var(--tag-color-${colorIndex})`;
    } catch (error) {
      ErrorHandler.handleError(`태그 색상 가져오기 실패: ${tag}`, error);
      return 'var(--tag-color-0)';
    }
  }

  /**
   * 태그 클라우드 데이터를 가져옵니다.
   * @param limit 가져올 태그 수
   * @returns 태그 클라우드 데이터 배열
   */
  public getTagCloudData(limit: number = 50): { tag: string; count: number; size: number; color: string }[] {
    try {
      const tagFrequency = this.getTagFrequency();
      
      // 사용 빈도 기준 정렬 및 제한
      const topTags = Array.from(tagFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
      
      // 최대 및 최소 빈도 찾기
      const maxCount = Math.max(...topTags.map(([_, count]: [string, number]) => count));
      const minCount = Math.min(...topTags.map(([_, count]: [string, number]) => count));
      
      // 태그 클라우드 데이터 생성
      return topTags.map(([tag, count]: [string, number]) => {
        // 크기 계산 (1-5 범위)
        const size = minCount === maxCount
          ? 3
          : 1 + Math.floor((count - minCount) / (maxCount - minCount) * 4);
        
        return {
          tag,
          count,
          size,
          color: this.getTagColor(tag)
        };
      });
    } catch (error) {
      ErrorHandler.handleError('태그 클라우드 데이터 가져오기 실패', error);
      return [];
    }
  }

  /**
   * 파일에 태그를 추가합니다.
   * @param file 파일 객체
   * @param tag 추가할 태그
   * @returns 성공 여부
   */
  public async addTagToFile(file: TFile, tag: string): Promise<boolean> {
    try {
      // 이미 태그가 있는지 확인
      if (this.metadataService.hasTag(file, tag)) {
        return true;
      }
      
      // 파일 내용 가져오기
      const content = await this.app.vault.read(file);
      
      // 프론트매터 확인
      const hasFrontMatter = content.startsWith('---\n');
      
      if (hasFrontMatter) {
        // 프론트매터 끝 위치 찾기
        const endOfFrontMatter = content.indexOf('---\n', 3);
        
        if (endOfFrontMatter !== -1) {
          // 프론트매터 추출
          const frontMatter = content.substring(3, endOfFrontMatter);
          
          // 태그 라인 찾기
          const tagLineMatch = frontMatter.match(/^tags:.*$/m);
          
          if (tagLineMatch) {
            // 기존 태그 라인 업데이트
            const tagLine = tagLineMatch[0];
            
            if (tagLine.includes('[') && tagLine.includes(']')) {
              // 배열 형식 태그
              const updatedTagLine = tagLine.replace(/\[([^\]]*)\]/, (match: string, p1: string) => {
                const tags = p1.split(',').map((t: string) => t.trim()).filter((t: string) => t);
                if (!tags.includes(tag)) {
                  tags.push(tag);
                }
                return `[${tags.join(', ')}]`;
              });
              
              const updatedContent = content.replace(tagLine, updatedTagLine);
              await this.app.vault.modify(file, updatedContent);
            } else {
              // 단일 태그 또는 쉼표로 구분된 태그
              const updatedTagLine = tagLine.includes(',')
                ? `${tagLine}, ${tag}`
                : `${tagLine}, ${tag}`;
              
              const updatedContent = content.replace(tagLine, updatedTagLine);
              await this.app.vault.modify(file, updatedContent);
            }
          } else {
            // 새 태그 라인 추가
            const updatedFrontMatter = `${frontMatter}\ntags: [${tag}]`;
            const updatedContent = content.replace(frontMatter, updatedFrontMatter);
            await this.app.vault.modify(file, updatedContent);
          }
        }
      } else {
        // 프론트매터 없음, 새로 추가
        const newContent = `---\ntags: [${tag}]\n---\n\n${content}`;
        await this.app.vault.modify(file, newContent);
      }
      
      return true;
    } catch (error) {
      ErrorHandler.handleError(`파일에 태그 추가 실패: ${file.path}, 태그: ${tag}`, error);
      return false;
    }
  }

  /**
   * 파일에서 태그를 제거합니다.
   * @param file 파일 객체
   * @param tag 제거할 태그
   * @returns 성공 여부
   */
  public async removeTagFromFile(file: TFile, tag: string): Promise<boolean> {
    try {
      // 태그가 있는지 확인
      if (!this.metadataService.hasTag(file, tag)) {
        return true;
      }
      
      // 파일 내용 가져오기
      const content = await this.app.vault.read(file);
      
      // 프론트매터 확인
      if (!content.startsWith('---\n')) {
        return false;
      }
      
      // 프론트매터 끝 위치 찾기
      const endOfFrontMatter = content.indexOf('---\n', 3);
      
      if (endOfFrontMatter === -1) {
        return false;
      }
      
      // 프론트매터 추출
      const frontMatter = content.substring(3, endOfFrontMatter);
      
      // 태그 라인 찾기
      const tagLineMatch = frontMatter.match(/^tags:.*$/m) || frontMatter.match(/^tag:.*$/m);
      
      if (!tagLineMatch) {
        return false;
      }
      
      // 기존 태그 라인 업데이트
      const tagLine = tagLineMatch[0];
      let updatedTagLine = tagLine;
      
      if (tagLine.includes('[') && tagLine.includes(']')) {
        // 배열 형식 태그
        updatedTagLine = tagLine.replace(/\[([^\]]*)\]/, (match, p1) => {
          const tags = p1.split(',').map((t: string) => t.trim()).filter((t: string) => t && t !== tag);
          return tags.length > 0 ? `[${tags.join(', ')}]` : '[]';
        });
      } else {
        // 단일 태그 또는 쉼표로 구분된 태그
        const tagRegex = new RegExp(`(^|,\\s*)${tag}(\\s*,|$)`, 'g');
        updatedTagLine = tagLine.replace(tagRegex, (match: string, p1: string, p2: string) => {
          if (p1 === '' && p2 === '') return '';
          if (p1 === '') return p2;
          if (p2 === '') return p1;
          return ', ';
        }).replace(/,\s*,/g, ',').replace(/:\s*,/g, ': ').replace(/,\s*$/g, '');
      }
      
      // 내용 업데이트
      const updatedContent = content.replace(tagLine, updatedTagLine);
      await this.app.vault.modify(file, updatedContent);
      
      return true;
    } catch (error) {
      ErrorHandler.handleError(`파일에서 태그 제거 실패: ${file.path}, 태그: ${tag}`, error);
      return false;
    }
  }

  /**
   * 파일의 모든 태그를 설정합니다.
   * @param file 파일 객체
   * @param tags 설정할 태그 배열
   * @returns 성공 여부
   */
  public async setFileTags(file: TFile, tags: string[]): Promise<boolean> {
    try {
      // 파일 내용 가져오기
      const content = await this.app.vault.read(file);
      
      // 프론트매터 확인
      const hasFrontMatter = content.startsWith('---\n');
      
      if (hasFrontMatter) {
        // 프론트매터 끝 위치 찾기
        const endOfFrontMatter = content.indexOf('---\n', 3);
        
        if (endOfFrontMatter !== -1) {
          // 프론트매터 추출
          const frontMatter = content.substring(3, endOfFrontMatter);
          
          // 태그 라인 찾기
          const tagLineMatch = frontMatter.match(/^tags:.*$/m);
          
          if (tagLineMatch) {
            // 기존 태그 라인 업데이트
            const tagLine = tagLineMatch[0];
            const updatedTagLine = `tags: [${tags.join(', ')}]`;
            
            const updatedContent = content.replace(tagLine, updatedTagLine);
            await this.app.vault.modify(file, updatedContent);
          } else {
            // 새 태그 라인 추가
            const updatedFrontMatter = `${frontMatter}\ntags: [${tags.join(', ')}]`;
            const updatedContent = content.replace(frontMatter, updatedFrontMatter);
            await this.app.vault.modify(file, updatedContent);
          }
        }
      } else {
        // 프론트매터 없음, 새로 추가
        const newContent = `---\ntags: [${tags.join(', ')}]\n---\n\n${content}`;
        await this.app.vault.modify(file, newContent);
      }
      
      return true;
    } catch (error) {
      ErrorHandler.handleError(`파일 태그 설정 실패: ${file.path}`, error);
      return false;
    }
  }

  /**
   * 태그의 하위 태그를 가져옵니다.
   * @param tag 상위 태그
   * @returns 하위 태그 배열
   */
  public getChildTags(tag: string): string[] {
    try {
      const hierarchy = this.getTagHierarchy();
      return hierarchy[tag] || [];
    } catch (error) {
      ErrorHandler.handleError(`하위 태그 가져오기 실패: ${tag}`, error);
      return [];
    }
  }

  /**
   * 태그의 상위 태그를 가져옵니다.
   * @param tag 하위 태그
   * @returns 상위 태그 또는 null
   */
  public getParentTag(tag: string): string | null {
    try {
      const hierarchy = this.getTagHierarchy();
      
      // 모든 상위 태그를 확인하여 현재 태그가 하위 태그 목록에 있는지 확인
      for (const [parent, children] of Object.entries(hierarchy)) {
        if (children.includes(tag)) {
          return parent;
        }
      }
      
      return null;
    } catch (error) {
      ErrorHandler.handleError(`상위 태그 가져오기 실패: ${tag}`, error);
      return null;
    }
  }
} 