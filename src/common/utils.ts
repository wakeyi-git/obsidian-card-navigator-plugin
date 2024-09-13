import { TFile } from 'obsidian';
import { SortCriterion, SortOrder } from './types';

/**
 * Separates the frontmatter from the main content of a file.
 * @param content - The full content of a file, including frontmatter.
 * @returns An object containing the frontmatter (if any) and the clean content.
 */
export function separateFrontmatterAndContent(content: string): { frontmatter: string | null, cleanContent: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontmatterRegex);
    if (match) {
        return {
            frontmatter: match[1],
            cleanContent: content.slice(match[0].length).trim()
        };
    }
    return { frontmatter: null, cleanContent: content.trim() };
}

/**
 * Sorts an array of files based on the specified criterion and order.
 * @param files - The array of files to sort.
 * @param criterion - The criterion to sort by ('fileName', 'lastModified', or 'created').
 * @param order - The sort order ('asc' for ascending, 'desc' for descending).
 * @returns The sorted array of files.
 */
export function sortFiles(files: TFile[], criterion: SortCriterion, order: SortOrder): TFile[] {
    return [...files].sort((a, b) => {
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

/**
 * Safely parses a string into a float number, with a fallback value in case of failure.
 * @param value - The string to parse.
 * @param fallback - The fallback value to return if parsing fails (default is 0).
 * @returns The parsed float value, or the fallback if parsing fails.
 */
export function safelyParseFloat(value: string, fallback = 0): number {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
}

/**
 * Clamps a number between a minimum and maximum value.
 * @param value - The number to clamp.
 * @param min - The minimum allowable value.
 * @param max - The maximum allowable value.
 * @returns The clamped number.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
