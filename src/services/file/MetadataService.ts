import { App, CachedMetadata, FrontMatterCache, HeadingCache, LinkCache, TFile } from 'obsidian';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';

/**
 * MetadataService 클래스는 Obsidian의 메타데이터 캐시를 활용하여 파일의 메타데이터를 관리합니다.
 */
export class MetadataService {
  private app: App;

  /**
   * MetadataService 생성자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(app: App) {
    this.app = app;
    
    Log.debug('MetadataService', '메타데이터 서비스 초기화 완료');
  }

  /**
   * 파일의 메타데이터를 가져옵니다.
   * @param file 파일 객체
   * @returns 메타데이터 또는 null
   */
  public getFileMetadata(file: TFile): CachedMetadata | null {
    try {
      return this.app.metadataCache.getFileCache(file);
    } catch (error) {
      ErrorHandler.handleError(`메타데이터 가져오기 실패: ${file.path}`, error);
      return null;
    }
  }

  /**
   * 파일의 프론트매터를 가져옵니다.
   * @param file 파일 객체
   * @returns 프론트매터 또는 null
   */
  public getFrontMatter(file: TFile): FrontMatterCache | null {
    try {
      const metadata = this.getFileMetadata(file);
      return metadata?.frontmatter || null;
    } catch (error) {
      ErrorHandler.handleError(`프론트매터 가져오기 실패: ${file.path}`, error);
      return null;
    }
  }

  /**
   * 파일의 프론트매터에서 특정 속성 값을 가져옵니다.
   * @param file 파일 객체
   * @param key 속성 키
   * @returns 속성 값 또는 undefined
   */
  public getFrontMatterValue(file: TFile, key: string): any {
    try {
      const frontmatter = this.getFrontMatter(file);
      return frontmatter?.[key];
    } catch (error) {
      ErrorHandler.handleError(`프론트매터 값 가져오기 실패: ${file.path}, 키: ${key}`, error);
      return undefined;
    }
  }

  /**
   * 파일의 모든 헤딩을 가져옵니다.
   * @param file 파일 객체
   * @returns 헤딩 배열 또는 빈 배열
   */
  public getHeadings(file: TFile): HeadingCache[] {
    try {
      const metadata = this.getFileMetadata(file);
      return metadata?.headings || [];
    } catch (error) {
      ErrorHandler.handleError(`헤딩 가져오기 실패: ${file.path}`, error);
      return [];
    }
  }

  /**
   * 파일의 첫 번째 헤딩을 가져옵니다.
   * @param file 파일 객체
   * @returns 첫 번째 헤딩 또는 null
   */
  public getFirstHeading(file: TFile): HeadingCache | null {
    try {
      const headings = this.getHeadings(file);
      return headings.length > 0 ? headings[0] : null;
    } catch (error) {
      ErrorHandler.handleError(`첫 번째 헤딩 가져오기 실패: ${file.path}`, error);
      return null;
    }
  }

  /**
   * 파일의 특정 레벨 헤딩을 가져옵니다.
   * @param file 파일 객체
   * @param level 헤딩 레벨
   * @returns 지정된 레벨의 헤딩 배열
   */
  public getHeadingsByLevel(file: TFile, level: number): HeadingCache[] {
    try {
      const headings = this.getHeadings(file);
      return headings.filter(heading => heading.level === level);
    } catch (error) {
      ErrorHandler.handleError(`레벨별 헤딩 가져오기 실패: ${file.path}, 레벨: ${level}`, error);
      return [];
    }
  }

  /**
   * 파일의 모든 링크를 가져옵니다.
   * @param file 파일 객체
   * @returns 링크 배열 또는 빈 배열
   */
  public getLinks(file: TFile): LinkCache[] {
    try {
      const metadata = this.getFileMetadata(file);
      return metadata?.links || [];
    } catch (error) {
      ErrorHandler.handleError(`링크 가져오기 실패: ${file.path}`, error);
      return [];
    }
  }

  /**
   * 파일의 모든 내부 링크를 가져옵니다.
   * @param file 파일 객체
   * @returns 내부 링크 배열
   */
  public getInternalLinks(file: TFile): LinkCache[] {
    try {
      const links = this.getLinks(file);
      return links.filter(link => !link.link.startsWith('http'));
    } catch (error) {
      ErrorHandler.handleError(`내부 링크 가져오기 실패: ${file.path}`, error);
      return [];
    }
  }

  /**
   * 파일의 모든 외부 링크를 가져옵니다.
   * @param file 파일 객체
   * @returns 외부 링크 배열
   */
  public getExternalLinks(file: TFile): LinkCache[] {
    try {
      const links = this.getLinks(file);
      return links.filter(link => link.link.startsWith('http'));
    } catch (error) {
      ErrorHandler.handleError(`외부 링크 가져오기 실패: ${file.path}`, error);
      return [];
    }
  }

  /**
   * 파일의 모든 태그를 가져옵니다.
   * @param file 파일 객체
   * @returns 태그 배열 또는 빈 배열
   */
  public getTags(file: TFile): string[] {
    try {
      const metadata = this.getFileMetadata(file);
      
      // 프론트매터의 태그
      const frontmatterTags: string[] = [];
      const frontmatter = metadata?.frontmatter;
      
      if (frontmatter?.tags) {
        if (Array.isArray(frontmatter.tags)) {
          frontmatterTags.push(...frontmatter.tags);
        } else if (typeof frontmatter.tags === 'string') {
          frontmatterTags.push(frontmatter.tags);
        }
      }
      
      if (frontmatter?.tag) {
        if (Array.isArray(frontmatter.tag)) {
          frontmatterTags.push(...frontmatter.tag);
        } else if (typeof frontmatter.tag === 'string') {
          frontmatterTags.push(frontmatter.tag);
        }
      }
      
      // 인라인 태그
      const inlineTags = metadata?.tags?.map(tag => tag.tag.substring(1)) || [];
      
      // 중복 제거 및 병합
      return Array.from(new Set([...frontmatterTags, ...inlineTags]));
    } catch (error) {
      ErrorHandler.handleError(`태그 가져오기 실패: ${file.path}`, error);
      return [];
    }
  }

  /**
   * 파일이 특정 태그를 포함하는지 확인합니다.
   * @param file 파일 객체
   * @param tag 확인할 태그
   * @returns 태그 포함 여부
   */
  public hasTag(file: TFile, tag: string): boolean {
    try {
      const tags = this.getTags(file);
      return tags.includes(tag);
    } catch (error) {
      ErrorHandler.handleError(`태그 확인 실패: ${file.path}, 태그: ${tag}`, error);
      return false;
    }
  }

  /**
   * 파일의 생성 시간을 가져옵니다.
   * @param file 파일 객체
   * @returns 생성 시간(밀리초) 또는 null
   */
  public getCreationTime(file: TFile): number | null {
    try {
      // 프론트매터에서 생성 시간 확인
      const frontmatter = this.getFrontMatter(file);
      
      if (frontmatter?.created) {
        const created = frontmatter.created;
        
        if (created instanceof Date) {
          return created.getTime();
        } else if (typeof created === 'number') {
          return created;
        } else if (typeof created === 'string') {
          const date = new Date(created);
          if (!isNaN(date.getTime())) {
            return date.getTime();
          }
        }
      }
      
      // 파일 생성 시간 반환
      return file.stat.ctime;
    } catch (error) {
      ErrorHandler.handleError(`생성 시간 가져오기 실패: ${file.path}`, error);
      return null;
    }
  }

  /**
   * 파일의 수정 시간을 가져옵니다.
   * @param file 파일 객체
   * @returns 수정 시간(밀리초) 또는 null
   */
  public getModificationTime(file: TFile): number | null {
    try {
      // 프론트매터에서 수정 시간 확인
      const frontmatter = this.getFrontMatter(file);
      
      if (frontmatter?.modified) {
        const modified = frontmatter.modified;
        
        if (modified instanceof Date) {
          return modified.getTime();
        } else if (typeof modified === 'number') {
          return modified;
        } else if (typeof modified === 'string') {
          const date = new Date(modified);
          if (!isNaN(date.getTime())) {
            return date.getTime();
          }
        }
      }
      
      // 파일 수정 시간 반환
      return file.stat.mtime;
    } catch (error) {
      ErrorHandler.handleError(`수정 시간 가져오기 실패: ${file.path}`, error);
      return null;
    }
  }

  /**
   * 파일의 제목을 가져옵니다. (첫 번째 H1 헤딩 또는 파일 이름)
   * @param file 파일 객체
   * @returns 파일 제목
   */
  public getFileTitle(file: TFile): string {
    try {
      // 프론트매터에서 제목 확인
      const frontmatter = this.getFrontMatter(file);
      if (frontmatter?.title) {
        return String(frontmatter.title);
      }
      
      // 첫 번째 H1 헤딩 확인
      const h1Headings = this.getHeadingsByLevel(file, 1);
      if (h1Headings.length > 0) {
        return h1Headings[0].heading;
      }
      
      // 파일 이름 반환 (확장자 제외)
      return file.basename;
    } catch (error) {
      ErrorHandler.handleError(`파일 제목 가져오기 실패: ${file.path}`, error);
      return file.basename;
    }
  }

  /**
   * 파일의 요약을 가져옵니다. (첫 번째 단락 또는 일부 내용)
   * @param file 파일 객체
   * @param maxLength 최대 길이
   * @returns 파일 요약 또는 빈 문자열
   */
  public async getFileSummary(file: TFile, maxLength: number = 150): Promise<string> {
    try {
      // 파일 내용 가져오기
      const content = await this.app.vault.read(file);
      
      // 프론트매터 제거
      let cleanContent = content;
      if (content.startsWith('---')) {
        const endOfFrontMatter = content.indexOf('---', 3);
        if (endOfFrontMatter !== -1) {
          cleanContent = content.substring(endOfFrontMatter + 3).trim();
        }
      }
      
      // 첫 번째 단락 찾기
      const paragraphs = cleanContent.split('\n\n');
      let summary = '';
      
      for (const paragraph of paragraphs) {
        // 헤딩, 목록, 코드 블록 등 건너뛰기
        if (paragraph.trim() && !paragraph.startsWith('#') && !paragraph.startsWith('```') && 
            !paragraph.startsWith('- ') && !paragraph.startsWith('* ') && !paragraph.startsWith('1. ')) {
          summary = paragraph.replace(/\n/g, ' ').trim();
          break;
        }
      }
      
      // 요약이 없으면 첫 부분 사용
      if (!summary) {
        summary = cleanContent.replace(/\n/g, ' ').trim();
      }
      
      // 마크다운 링크 형식 제거
      summary = summary.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      
      // 최대 길이로 자르기
      if (summary.length > maxLength) {
        summary = summary.substring(0, maxLength - 3) + '...';
      }
      
      return summary;
    } catch (error) {
      ErrorHandler.handleError(`파일 요약 가져오기 실패: ${file.path}`, error);
      return '';
    }
  }

  /**
   * 파일이 특정 프론트매터 속성을 가지고 있는지 확인합니다.
   * @param file 파일 객체
   * @param key 속성 키
   * @returns 속성 포함 여부
   */
  public hasFrontMatterKey(file: TFile, key: string): boolean {
    try {
      const frontmatter = this.getFrontMatter(file);
      return frontmatter ? key in frontmatter : false;
    } catch (error) {
      ErrorHandler.handleError(`프론트매터 키 확인 실패: ${file.path}, 키: ${key}`, error);
      return false;
    }
  }

  /**
   * 파일의 프론트매터 속성 값이 특정 값과 일치하는지 확인합니다.
   * @param file 파일 객체
   * @param key 속성 키
   * @param value 비교할 값
   * @returns 값 일치 여부
   */
  public hasFrontMatterValue(file: TFile, key: string, value: any): boolean {
    try {
      const frontmatterValue = this.getFrontMatterValue(file, key);
      
      // 배열인 경우
      if (Array.isArray(frontmatterValue)) {
        return frontmatterValue.includes(value);
      }
      
      // 일반 값인 경우
      return frontmatterValue === value;
    } catch (error) {
      ErrorHandler.handleError(`프론트매터 값 확인 실패: ${file.path}, 키: ${key}, 값: ${value}`, error);
      return false;
    }
  }

  /**
   * 파일의 메타데이터 캐시가 로드되었는지 확인합니다.
   * @param file 파일 객체
   * @returns 메타데이터 로드 여부
   */
  public isMetadataLoaded(file: TFile): boolean {
    return this.getFileMetadata(file) !== null;
  }

  /**
   * 파일의 메타데이터 캐시가 로드될 때까지 기다립니다.
   * @param file 파일 객체
   * @param timeout 타임아웃(밀리초)
   * @returns 메타데이터 로드 성공 여부
   */
  public async waitForMetadata(file: TFile, timeout: number = 5000): Promise<boolean> {
    try {
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        if (this.isMetadataLoaded(file)) {
          return true;
        }
        
        // 100ms 대기
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      Log.warn('MetadataService', `메타데이터 로드 타임아웃: ${file.path}`);
      return false;
    } catch (error) {
      ErrorHandler.handleError(`메타데이터 대기 실패: ${file.path}`, error);
      return false;
    }
  }
} 