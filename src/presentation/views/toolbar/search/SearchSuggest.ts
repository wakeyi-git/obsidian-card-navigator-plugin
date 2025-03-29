import { TFile, TFolder } from 'obsidian';
import CardNavigatorPlugin from '@main';
import { SearchSuggestion } from '../../../../domain/models/types';

export class SearchSuggest {
    constructor(private plugin: CardNavigatorPlugin) {}

    // 현재 검색어에 따른 추천 항목 가져오기
    async getSuggestions(searchTerm: string, filteredFiles: TFile[]): Promise<SearchSuggestion[]> {
        const colonIndex = searchTerm.lastIndexOf(':');
        if (colonIndex === -1) return [];

        const prefix = searchTerm.substring(0, colonIndex).trim();
        const value = searchTerm.substring(colonIndex + 1).trim().toLowerCase();

        switch (prefix) {
            case 'path':
                return this.getPathSuggestions(value, filteredFiles);
            case 'file':
                return this.getFileSuggestions(value, filteredFiles);
            case 'tag':
                return this.getTagSuggestions(value, filteredFiles);
            case 'property':
                return this.getPropertySuggestions(value, filteredFiles);
            case 'section':
                return this.getSectionSuggestions(value, filteredFiles);
            default:
                return [];
        }
    }

    // 경로 추천
    private async getPathSuggestions(searchTerm: string, files: TFile[]): Promise<SearchSuggestion[]> {
        const paths = new Set<string>();
        
        // 각 파일의 상위 폴더 경로들을 수집
        files.forEach(file => {
            let currentPath = file.parent?.path;
            while (currentPath) {
                paths.add(currentPath);
                const parentFolder = this.plugin.app.vault.getAbstractFileByPath(currentPath);
                currentPath = (parentFolder as TFolder)?.parent?.path;
            }
        });

        // 검색어와 일치하는 경로 필터링
        const searchValueWithoutQuotes = searchTerm.replace(/^"(.*)"$/, '$1').toLowerCase();
        
        const suggestions = Array.from(paths)
            .filter(path => path.toLowerCase().includes(searchValueWithoutQuotes))
            .sort((a, b) => a.localeCompare(b))
            .map(path => ({
                value: `"${path}"`,  // 경로를 따옴표로 묶어서 반환
                type: 'path' as const,
                display: path || '/'
            }));

        return suggestions;
    }

    // 파일명 추천
    private getFileSuggestions(value: string, files: TFile[]): SearchSuggestion[] {
        return files
            .filter(file => file.basename.toLowerCase().includes(value))
            .map(file => ({
                value: file.basename,
                type: 'file',
                display: file.basename
            }));
    }

    // 태그 추천
    private async getTagSuggestions(value: string, files: TFile[]): Promise<SearchSuggestion[]> {
        const tags = new Set<string>();
        
        for (const file of files) {
            const cache = this.plugin.app.metadataCache.getFileCache(file);
            if (!cache) continue;

            // 인라인 태그 추가
            cache.tags?.forEach(tag => {
                const tagValue = tag.tag.substring(1).toLowerCase();
                if (tagValue.includes(value)) {
                    tags.add(tag.tag.substring(1));
                }
            });

            // frontmatter 태그 추가
            if (cache.frontmatter?.tags) {
                const fmTags = Array.isArray(cache.frontmatter.tags) 
                    ? cache.frontmatter.tags 
                    : [cache.frontmatter.tags];
                
                fmTags.forEach(tag => {
                    const tagValue = String(tag).toLowerCase();
                    if (tagValue.includes(value)) {
                        tags.add(String(tag));
                    }
                });
            }
        }

        return Array.from(tags).map(tag => ({
            value: tag,
            type: 'tag',
            display: '#' + tag
        }));
    }

    // 프로퍼티 추천
    private async getPropertySuggestions(value: string, files: TFile[]): Promise<SearchSuggestion[]> {
        const properties = new Set<string>();
        
        for (const file of files) {
            const cache = this.plugin.app.metadataCache.getFileCache(file);
            if (!cache?.frontmatter) continue;

            Object.entries(cache.frontmatter).forEach(([key, val]) => {
                const keyValue = key.toLowerCase();
                if (keyValue.includes(value)) {
                    properties.add(`${key}`);
                }
                
                // 프로퍼티 값도 추천에 포함
                const stringVal = String(val).toLowerCase();
                if (stringVal.includes(value)) {
                    properties.add(`${key}:${val}`);
                }
            });
        }

        return Array.from(properties).map(prop => ({
            value: prop,
            type: 'property',
            display: prop
        }));
    }

    // 섹션(헤더) 추천
    private async getSectionSuggestions(value: string, files: TFile[]): Promise<SearchSuggestion[]> {
        const sections = new Set<string>();
        
        for (const file of files) {
            const cache = this.plugin.app.metadataCache.getFileCache(file);
            if (!cache?.headings) continue;

            cache.headings.forEach(heading => {
                if (heading.heading.toLowerCase().includes(value)) {
                    sections.add(heading.heading);
                }
            });
        }

        return Array.from(sections).map(section => ({
            value: section,
            type: 'section',
            display: section
        }));
    }
} 