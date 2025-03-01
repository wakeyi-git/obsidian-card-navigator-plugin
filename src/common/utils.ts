import { TFile } from "obsidian";
import { SortCriterion, SortOrder } from './types';

/**
 * 이 파일은 파일 처리, 정렬, 수치 연산을 위한 유틸리티 함수들을 포함합니다.
 * Card Navigator 플러그인 전반에서 데이터 처리와 조작에 사용됩니다.
 */

//#region 파일 내용 처리
// 프론트매터 정규식 패턴
const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;

/**
 * 파일의 프론트매터와 본문을 분리합니다.
 * 프론트매터는 마크다운 파일 시작 부분의 '---'로 둘러싸인 메타데이터입니다.
 * @param body - 프론트매터를 포함한 파일의 전체 내용
 * @returns 프론트매터(있는 경우)와 정리된 본문을 포함하는 객체
 */
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
//#endregion

//#region 파일 정렬
/**
 * 지정된 기준과 순서에 따라 파일 배열을 정렬합니다.
 * 원본 배열을 수정하지 않고 새로운 정렬된 배열을 생성합니다.
 * @param files - 정렬할 파일 배열
 * @param criterion - 정렬 기준 ('fileName', 'lastModified', 'created')
 * @param order - 정렬 순서 ('asc': 오름차순, 'desc': 내림차순)
 * @param options - 추가 정렬 옵션
 * @returns 정렬된 파일 배열
 */
export function sortFiles(
    files: TFile[], 
    criterion: SortCriterion, 
    order: SortOrder,
    options: { numeric?: boolean; sensitivity?: string } = { numeric: true, sensitivity: 'base' }
): TFile[] {
    return [...files].sort((a, b) => {
        let comparison = 0;
        switch (criterion) {
            case 'fileName':
                // 파일 이름의 자연스러운 정렬을 위해 localeCompare 사용
                comparison = a.basename.localeCompare(
                    b.basename, 
                    undefined, 
                    { 
                        numeric: options.numeric, 
                        sensitivity: options.sensitivity as 'base' | 'accent' | 'case' | 'variant' | undefined 
                    }
                );
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
 * 정렬 함수를 생성합니다.
 * 이 함수는 정렬 기준과 순서를 받아 파일을 비교하는 함수를 반환합니다.
 * @param criterion - 정렬 기준
 * @param order - 정렬 순서
 * @param options - 추가 정렬 옵션
 * @returns 파일 비교 함수
 */
export function createSortFunction(
    criterion: SortCriterion, 
    order: SortOrder,
    options: { numeric?: boolean; sensitivity?: string } = { numeric: true, sensitivity: 'base' }
): (a: TFile, b: TFile) => number {
    return (a: TFile, b: TFile) => {
        let comparison = 0;
        switch (criterion) {
            case 'fileName':
                comparison = a.basename.localeCompare(
                    b.basename, 
                    undefined, 
                    { 
                        numeric: options.numeric, 
                        sensitivity: options.sensitivity as 'base' | 'accent' | 'case' | 'variant' | undefined 
                    }
                );
                break;
            case 'lastModified':
                comparison = a.stat.mtime - b.stat.mtime;
                break;
            case 'created':
                comparison = a.stat.ctime - b.stat.ctime;
                break;
        }
        return order === 'asc' ? comparison : -comparison;
    };
}
//#endregion

//#region 수치 처리
/**
 * 문자열을 안전하게 실수로 변환합니다.
 * 잘못된 사용자 입력이나 데이터 처리 시 유용합니다.
 * @param value - 변환할 문자열
 * @param fallback - 변환 실패 시 반환할 기본값 (기본값: 0)
 * @returns 변환된 실수값 또는 실패 시 기본값
 */
export function safelyParseFloat(value: string, fallback = 0): number {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
}

/**
 * 숫자를 최소값과 최대값 사이로 제한합니다.
 * 값이 특정 범위 내에 있도록 보장할 때 유용합니다.
 * @param value - 제한할 숫자
 * @param min - 최소 허용값
 * @param max - 최대 허용값
 * @returns 제한된 숫자
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
//#endregion
