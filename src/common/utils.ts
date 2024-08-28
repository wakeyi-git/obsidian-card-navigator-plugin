// src/common/utils.ts

import { TFile } from 'obsidian';
import { SortCriterion } from './types';

export function debounce<F extends (...args: unknown[]) => unknown>(func: F, waitFor: number) {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<F>): Promise<ReturnType<F>> => {
        if (timeout) {
            clearTimeout(timeout);
        }
        return new Promise<ReturnType<F>>((resolve) => {
            timeout = setTimeout(() => {
                const result = func(...args);
                resolve(result as ReturnType<F>);
            }, waitFor);
        });
    };
}

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

export function calculateCardSize(
    isVertical: boolean, 
    containerRect: DOMRect, 
    cardsPerView: number, 
    padding = 15
) {
    const { width: leafWidth, height: leafHeight } = containerRect;

    let cardWidth: number, cardHeight: number;

    if (isVertical) {
        cardWidth = leafWidth - 2 * padding;
        cardHeight = leafHeight / cardsPerView;
    } else {
        cardWidth = leafWidth / cardsPerView;
        cardHeight = leafHeight - 2 * padding;
    }

    return { cardWidth, cardHeight };
}

export function setContainerSize(
    containerEl: HTMLElement,
    cardWidth: number,
    cardHeight: number,
    cardsPerView: number,
    isVertical: boolean
) {
    if (isVertical) {
        containerEl.style.flexDirection = 'column';
        containerEl.style.width = `${cardWidth}px`;
        containerEl.style.height = `${cardHeight * cardsPerView}px`;
    } else {
        containerEl.style.flexDirection = 'row';
        containerEl.style.width = `${cardWidth * cardsPerView}px`;
        containerEl.style.height = `${cardHeight}px`;
    }
}
