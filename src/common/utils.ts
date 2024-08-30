// src/common/utils.ts

import { TFile } from 'obsidian';
import { SortCriterion } from './types';

export function separateFrontmatterAndContent(content: string): { frontmatter: string | null, cleanContent: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontmatterRegex);
    return match
        ? { frontmatter: match[1], cleanContent: content.slice(match[0].length).trim() }
        : { frontmatter: null, cleanContent: content.trim() };
}

export function sortFiles(files: TFile[], criterion: SortCriterion, order: 'asc' | 'desc'): TFile[] {
    return files.sort((a, b) => {
        let comparison = 0;
        switch (criterion) {
            case 'fileName':
                comparison = a.basename.localeCompare(b.basename, undefined, { numeric: true, sensitivity: 'base' });
                break;
            case 'lastModified':
                comparison = a.stat.mtime - b.stat.mtime;
                break;
            case 'created':
                comparison = a.stat.ctime - b.stat.ctime;
                break;
        }
        return order === 'asc' ? comparison : -comparison;
    });
}
