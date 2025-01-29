import { App, TFile, TFolder, CachedMetadata } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { SearchOptions, DEFAULT_SEARCH_OPTIONS, BATCH_SIZE } from 'common/types';

export class SearchService {
    private app: App;
    private options: SearchOptions;
    private searchPrefix: string = '';

    constructor(private plugin: CardNavigatorPlugin) {
        this.app = this.plugin.app;
        this.options = DEFAULT_SEARCH_OPTIONS;
    }

    // 검색 옵션 설정
    setOptions(options: Partial<SearchOptions>) {
        this.options = { ...this.options, ...options };
    }

    // 검색 옵션 가져오기
    getOption<K extends keyof SearchOptions>(key: K): SearchOptions[K] {
        return this.options[key];
    }

    // 파일 검색 메서드
    async searchFiles(files: TFile[], searchTerm: string): Promise<TFile[]> {
        if (!searchTerm) return files;

        let filteredFiles = files;
        const terms = this.parseSearchTerms(searchTerm);

        for (const {prefix, value} of terms) {
            switch (prefix) {
                case 'path':
                    filteredFiles = filteredFiles.filter(file => 
                        this.createSearchPattern(value).test(file.path));
                    break;
                case 'file':
                    filteredFiles = filteredFiles.filter(file => 
                        this.createSearchPattern(value).test(file.basename));
                    break;
                case 'tag':
                    // value에서 #을 제거하고 검색
                    const tagValue = value.startsWith('#') ? value.slice(1) : value;
                    filteredFiles = await this.searchByTag(filteredFiles, tagValue);
                    break;
                case 'property':
                    filteredFiles = await this.searchByProperty(filteredFiles, value);
                    break;
                default:
                    // prefix가 없는 경우 일반 검색
                    filteredFiles = await this.performGeneralSearch(filteredFiles, value);
            }

            if (filteredFiles.length === 0) break;
        }

        return filteredFiles;
    }

    // 검색어 파싱
    private parseSearchTerms(searchTerm: string): Array<{prefix: string, value: string}> {
        const terms: Array<{prefix: string, value: string}> = [];
        let currentTerm = '';
        let inQuotes = false;
        
        for (let i = 0; i < searchTerm.length; i++) {
            const char = searchTerm[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }
            
            if (char === ' ' && !inQuotes) {
                if (currentTerm) {
                    terms.push(this.parseSingleTerm(currentTerm));
                    currentTerm = '';
                }
            } else {
                currentTerm += char;
            }
        }
        
        if (currentTerm) {
            terms.push(this.parseSingleTerm(currentTerm));
        }
        
        return terms;
    }

    // 단일 검색어 파싱
    private parseSingleTerm(term: string): {prefix: string, value: string} {
        const colonIndex = term.indexOf(':');
        
        if (colonIndex === -1) {
            return { prefix: '', value: term };
        }
        
        const prefix = term.substring(0, colonIndex).toLowerCase();
        const value = term.substring(colonIndex + 1);
        
        return { prefix, value };
    }

    // 일반 검색 수행
    private async performGeneralSearch(files: TFile[], searchTerm: string): Promise<TFile[]> {
        const pattern = this.createSearchPattern(searchTerm);
        const results = [];
        
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map(file => this.searchInFile(file, pattern))
            );
            results.push(...batchResults.filter((file): file is TFile => file !== null));
        }
        
        return results;
    }

    // 태그로 검색
    private async searchByTag(files: TFile[], term: string): Promise<TFile[]> {
        const pattern = this.createSearchPattern(term);
        const results: TFile[] = [];
        
        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache) continue;

            // 본문의 #태그 검색
            const hasInlineTag = cache.tags?.some(tag => pattern.test(tag.tag));
            
            // frontmatter의 tags 검색
            let hasFrontmatterTag = false;
            if (cache.frontmatter?.tags) {
                const tags = Array.isArray(cache.frontmatter.tags) 
                    ? cache.frontmatter.tags 
                    : [cache.frontmatter.tags];
                
                hasFrontmatterTag = tags.some(tag => pattern.test(String(tag)));
            }

            if (hasInlineTag || hasFrontmatterTag) {
                results.push(file);
            }
        }
        
        return results;
    }

    // 프로퍼티(frontmatter)로 검색
    private async searchByProperty(files: TFile[], term: string): Promise<TFile[]> {
        // property:key:value 형식 처리
        const [key, ...valueParts] = term.split(':');
        const value = valueParts.join(':');
        const pattern = this.createSearchPattern(value || key);
        const results: TFile[] = [];
        
        for (const file of files) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache?.frontmatter) continue;

            // 특정 키가 지정된 경우
            if (value) {
                const propertyValue = cache.frontmatter[key];
                if (propertyValue !== undefined) {
                    // 배열인 경우 각 요소를 검사
                    if (Array.isArray(propertyValue)) {
                        if (propertyValue.some(v => pattern.test(String(v)))) {
                            results.push(file);
                        }
                    } else {
                        // 단일 값인 경우
                        if (pattern.test(String(propertyValue))) {
                            results.push(file);
                        }
                    }
                }
            } else {
                // 키가 지정되지 않은 경우 모든 값을 검색
                if (Object.values(cache.frontmatter).some(value => 
                    pattern.test(String(value)))) {
                    results.push(file);
                }
            }
        }
        
        return results;
    }

    // 검색 패턴 생성
    private createSearchPattern(searchTerm: string): RegExp {
        if (this.options.useRegex) {
            try {
                return new RegExp(searchTerm, this.options.caseSensitive ? 'g' : 'gi');
            } catch (error) {
                console.error('Invalid regex pattern:', error);
                return new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
                    this.options.caseSensitive ? 'g' : 'gi');
            }
        }
        return new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
            this.options.caseSensitive ? 'g' : 'gi');
    }

    // 파일 내 검색
    private async searchInFile(file: TFile, searchPattern: RegExp): Promise<TFile | null> {
        try {
            const cache = this.app.metadataCache.getFileCache(file);
            
            // 제목 검색
            if (this.options.searchInTitle && 
                (this.searchInTitle(file.basename, searchPattern) || 
                 this.searchInTitle(file.name, searchPattern))) {
                return file;
            }

            if (cache) {
                // 헤더 검색
                if (this.options.searchInHeaders && 
                    this.searchInHeaders(cache, searchPattern)) {
                    return file;
                }

                // 태그 검색
                if (this.options.searchInTags && 
                    this.searchInTags(cache, searchPattern)) {
                    return file;
                }

                // 프론트매터 검색
                if (this.options.searchInFrontmatter && 
                    this.searchInFrontmatter(cache, searchPattern)) {
                    return file;
                }
            }

            // 내용 검색
            if (this.options.searchInContent) {
                const content = await this.plugin.app.vault.cachedRead(file);
                if (searchPattern.test(content)) {
                    return file;
                }
            }
        } catch (error) {
            console.error(`파일 검색 실패: ${file.path}`, error);
        }
        return null;
    }

    // 제목 검색
    private searchInTitle(title: string, pattern: RegExp): boolean {
        return pattern.test(title);
    }

    // 헤더 검색
    private searchInHeaders(cache: CachedMetadata, pattern: RegExp): boolean {
        return cache.headings?.some(h => pattern.test(h.heading)) ?? false;
    }

    // 태그 검색
    private searchInTags(cache: CachedMetadata, pattern: RegExp): boolean {
        return cache.tags?.some(tag => pattern.test(tag.tag)) ?? false;
    }

    // 프론트매터 검색
    private searchInFrontmatter(cache: CachedMetadata, pattern: RegExp): boolean {
        if (!cache.frontmatter) return false;
        return Object.values(cache.frontmatter).some(value => 
            pattern.test(String(value)));
    }

    // 전체 볼트에서 파일 가져오기
    getAllMarkdownFiles(folder: TFolder): TFile[] {
        const files: TFile[] = [];
        
        folder.children.forEach(child => {
            if (child instanceof TFile && child.extension === 'md') {
                files.push(child);
            } else if (child instanceof TFolder) {
                files.push(...this.getAllMarkdownFiles(child));
            }
        });
        
        return files;
    }
} 