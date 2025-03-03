/**
 * 문자열 처리 헬퍼 함수 모음
 * 문자열 조작, 변환, 검증 등에 사용되는 유틸리티 함수들입니다.
 */

/**
 * 문자열이 비어 있는지 확인합니다.
 * @param str 확인할 문자열
 * @returns 문자열이 비어 있는지 여부
 */
export function isEmpty(str: string | null | undefined): boolean {
  return str === null || str === undefined || str.trim() === '';
}

/**
 * 문자열이 비어 있지 않은지 확인합니다.
 * @param str 확인할 문자열
 * @returns 문자열이 비어 있지 않은지 여부
 */
export function isNotEmpty(str: string | null | undefined): boolean {
  return !isEmpty(str);
}

/**
 * 문자열의 첫 글자를 대문자로 변환합니다.
 * @param str 변환할 문자열
 * @returns 첫 글자가 대문자인 문자열
 */
export function capitalizeFirstLetter(str: string): string {
  if (isEmpty(str)) {
    return '';
  }
  
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 문자열의 모든 단어의 첫 글자를 대문자로 변환합니다.
 * @param str 변환할 문자열
 * @returns 모든 단어의 첫 글자가 대문자인 문자열
 */
export function capitalizeWords(str: string): string {
  if (isEmpty(str)) {
    return '';
  }
  
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * 문자열을 카멜 케이스로 변환합니다.
 * @param str 변환할 문자열
 * @returns 카멜 케이스 문자열
 */
export function toCamelCase(str: string): string {
  if (isEmpty(str)) {
    return '';
  }
  
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/^(.)/, c => c.toLowerCase());
}

/**
 * 문자열을 파스칼 케이스로 변환합니다.
 * @param str 변환할 문자열
 * @returns 파스칼 케이스 문자열
 */
export function toPascalCase(str: string): string {
  if (isEmpty(str)) {
    return '';
  }
  
  const camelCase = toCamelCase(str);
  return capitalizeFirstLetter(camelCase);
}

/**
 * 문자열을 케밥 케이스로 변환합니다.
 * @param str 변환할 문자열
 * @returns 케밥 케이스 문자열
 */
export function toKebabCase(str: string): string {
  if (isEmpty(str)) {
    return '';
  }
  
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * 문자열을 스네이크 케이스로 변환합니다.
 * @param str 변환할 문자열
 * @returns 스네이크 케이스 문자열
 */
export function toSnakeCase(str: string): string {
  if (isEmpty(str)) {
    return '';
  }
  
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * 문자열을 주어진 길이로 자릅니다.
 * @param str 자를 문자열
 * @param maxLength 최대 길이
 * @param suffix 접미사 (기본값: '...')
 * @returns 잘린 문자열
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (isEmpty(str) || str.length <= maxLength) {
    return str || '';
  }
  
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 문자열에서 HTML 태그를 제거합니다.
 * @param html HTML 문자열
 * @returns HTML 태그가 제거된 문자열
 */
export function stripHtml(html: string): string {
  if (isEmpty(html)) {
    return '';
  }
  
  return html.replace(/<[^>]*>/g, '');
}

/**
 * 문자열에서 마크다운 서식을 제거합니다.
 * @param markdown 마크다운 문자열
 * @returns 마크다운 서식이 제거된 문자열
 */
export function stripMarkdown(markdown: string): string {
  if (isEmpty(markdown)) {
    return '';
  }
  
  return markdown
    // 헤더 제거
    .replace(/^#+\s+/gm, '')
    // 굵게 제거
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // 기울임 제거
    .replace(/\*(.*?)\*/g, '$1')
    // 취소선 제거
    .replace(/~~(.*?)~~/g, '$1')
    // 인라인 코드 제거
    .replace(/`(.*?)`/g, '$1')
    // 링크 제거
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // 이미지 제거
    .replace(/!\[(.*?)\]\(.*?\)/g, '')
    // 블록 인용구 제거
    .replace(/^>\s+/gm, '')
    // 목록 제거
    .replace(/^[\*\-+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // 코드 블록 제거
    .replace(/```[\s\S]*?```/g, '')
    // 수평선 제거
    .replace(/^---+$/gm, '')
    // 여러 줄 바꿈 제거
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * 문자열에서 특수 문자를 이스케이프합니다.
 * @param str 이스케이프할 문자열
 * @returns 이스케이프된 문자열
 */
export function escapeRegExp(str: string): string {
  if (isEmpty(str)) {
    return '';
  }
  
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 문자열에서 다른 문자열의 모든 일치 항목을 바꿉니다.
 * @param str 원본 문자열
 * @param search 검색할 문자열
 * @param replacement 대체할 문자열
 * @returns 바뀐 문자열
 */
export function replaceAll(str: string, search: string, replacement: string): string {
  if (isEmpty(str)) {
    return '';
  }
  
  return str.split(search).join(replacement);
}

/**
 * 문자열에서 모든 공백을 제거합니다.
 * @param str 공백을 제거할 문자열
 * @returns 공백이 제거된 문자열
 */
export function removeWhitespace(str: string): string {
  if (isEmpty(str)) {
    return '';
  }
  
  return str.replace(/\s+/g, '');
}

/**
 * 문자열에서 연속된 공백을 단일 공백으로 바꿉니다.
 * @param str 정규화할 문자열
 * @returns 정규화된 문자열
 */
export function normalizeWhitespace(str: string): string {
  if (isEmpty(str)) {
    return '';
  }
  
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * 문자열이 유효한 URL인지 확인합니다.
 * @param str 확인할 문자열
 * @returns 유효한 URL인지 여부
 */
export function isValidUrl(str: string): boolean {
  if (isEmpty(str)) {
    return false;
  }
  
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * 문자열이 유효한 이메일 주소인지 확인합니다.
 * @param str 확인할 문자열
 * @returns 유효한 이메일 주소인지 여부
 */
export function isValidEmail(str: string): boolean {
  if (isEmpty(str)) {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

/**
 * 문자열에서 특정 문자열이 나타나는 횟수를 계산합니다.
 * @param str 원본 문자열
 * @param search 검색할 문자열
 * @returns 일치 횟수
 */
export function countOccurrences(str: string, search: string): number {
  if (isEmpty(str) || isEmpty(search)) {
    return 0;
  }
  
  return (str.split(search).length - 1);
}

/**
 * 문자열을 지정된 구분자로 분할하고 각 부분을 트리밍합니다.
 * @param str 분할할 문자열
 * @param separator 구분자
 * @returns 트리밍된 부분 문자열 배열
 */
export function splitAndTrim(str: string, separator: string): string[] {
  if (isEmpty(str)) {
    return [];
  }
  
  return str.split(separator).map(part => part.trim()).filter(part => part !== '');
}

/**
 * 문자열에서 첫 번째 일치하는 정규식 그룹을 추출합니다.
 * @param str 원본 문자열
 * @param regex 정규식
 * @param groupIndex 추출할 그룹 인덱스 (기본값: 1)
 * @returns 추출된 문자열 또는 null
 */
export function extractRegexGroup(str: string, regex: RegExp, groupIndex: number = 1): string | null {
  if (isEmpty(str)) {
    return null;
  }
  
  const match = str.match(regex);
  
  if (match && match[groupIndex]) {
    return match[groupIndex];
  }
  
  return null;
}

/**
 * 고유 ID 생성 함수
 * @returns 고유 ID 문자열
 */
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * 문자열 자르기 함수
 * 지정된 최대 길이를 초과하는 경우 말줄임표를 추가합니다.
 * @param text 원본 문자열
 * @param maxLength 최대 길이
 * @returns 잘린 문자열
 */
export function truncateString(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
}

/**
 * 파일 경로에서 디렉토리 경로 추출 함수
 * @param filePath 파일 경로
 * @returns 디렉토리 경로
 */
export function getDirectoryPath(filePath: string): string {
  const lastSlashIndex = filePath.lastIndexOf('/');
  
  if (lastSlashIndex === -1) {
    return '';
  }
  
  return filePath.substring(0, lastSlashIndex);
}

/**
 * 파일 경로에서 파일명 추출 함수
 * @param filePath 파일 경로
 * @returns 파일명
 */
export function getFileName(filePath: string): string {
  const lastSlashIndex = filePath.lastIndexOf('/');
  
  if (lastSlashIndex === -1) {
    return filePath;
  }
  
  return filePath.substring(lastSlashIndex + 1);
}

/**
 * 파일 확장자 추출 함수
 * @param filePath 파일 경로
 * @returns 파일 확장자
 */
export function getFileExtension(filePath: string): string {
  const lastDotIndex = filePath.lastIndexOf('.');
  
  if (lastDotIndex === -1) {
    return '';
  }
  
  return filePath.substring(lastDotIndex + 1);
}

/**
 * 문자열이 비어있는지 확인하는 함수
 * @param text 확인할 문자열
 * @returns 비어있는지 여부
 */
export function isEmpty(text: string | null | undefined): boolean {
  return text === null || text === undefined || text.trim() === '';
}

/**
 * 문자열 이스케이프 함수
 * 정규식에서 사용될 문자열을 이스케이프합니다.
 * @param text 이스케이프할 문자열
 * @returns 이스케이프된 문자열
 */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
} 