// utils.ts
import { TFile } from "obsidian";import { SortCriterion, SortOrder } from './types';

/**
 * This file contains utility functions for file handling, sorting, and numerical operations.
 * These functions are used throughout the Card Navigator plugin to process and manipulate data.
 */

/**
 * Separates the frontmatter from the body of a file.
 * Frontmatter is the metadata at the beginning of a Markdown file, enclosed in '---'.
 * @param body - The full body of a file, including frontmatter.
 * @returns An object containing the frontmatter (if any) and the clean body.
 */
const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;

export function separateFrontmatterAndBody(body: string): { frontmatter: string | null, cleanBody: string } {
    const match = body.match(frontmatterRegex);
    if (match) {
        return {
            frontmatter: match[1],
            cleanBody: body.slice(match[0].length).trim()
        };
    }
    return { frontmatter: null, cleanBody: body.trim() };
}

/**
 * Sorts an array of files based on the specified criterion and order.
 * This function creates a new sorted array and does not modify the original.
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
                // Use localeCompare for natural sort order of file names
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
 * This is useful for handling potentially invalid user input or data.
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
 * This is useful for ensuring a value stays within a specific range.
 * @param value - The number to clamp.
 * @param min - The minimum allowable value.
 * @param max - The maximum allowable value.
 * @returns The clamped number.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
