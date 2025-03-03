import { App, TFile, TFolder, normalizePath } from 'obsidian';

/**
 * 파일 조작 헬퍼 함수 모음
 * Obsidian의 파일 시스템을 조작하는 데 사용되는 유틸리티 함수들입니다.
 */

/**
 * 파일 경로에서 파일 이름을 추출합니다.
 * @param path 파일 경로
 * @returns 파일 이름 (확장자 포함)
 */
export function getFileName(path: string): string {
  return path.split('/').pop() || '';
}

/**
 * 파일 경로에서 파일 이름을 추출합니다. (확장자 제외)
 * @param path 파일 경로
 * @returns 파일 이름 (확장자 제외)
 */
export function getFileNameWithoutExtension(path: string): string {
  const fileName = getFileName(path);
  const lastDotIndex = fileName.lastIndexOf('.');
  
  if (lastDotIndex === -1) {
    return fileName;
  }
  
  return fileName.substring(0, lastDotIndex);
}

/**
 * 파일 경로에서 확장자를 추출합니다.
 * @param path 파일 경로
 * @returns 확장자 (점 포함)
 */
export function getFileExtension(path: string): string {
  const fileName = getFileName(path);
  const lastDotIndex = fileName.lastIndexOf('.');
  
  if (lastDotIndex === -1) {
    return '';
  }
  
  return fileName.substring(lastDotIndex);
}

/**
 * 파일 경로에서 디렉토리 경로를 추출합니다.
 * @param path 파일 경로
 * @returns 디렉토리 경로
 */
export function getDirectoryPath(path: string): string {
  const parts = path.split('/');
  parts.pop();
  
  return parts.join('/');
}

/**
 * 경로가 유효한지 확인합니다.
 * @param path 확인할 경로
 * @returns 경로가 유효한지 여부
 */
export function isValidPath(path: string): boolean {
  // 경로에 허용되지 않는 문자가 포함되어 있는지 확인
  const invalidChars = /[<>:"|?*]/;
  
  return !invalidChars.test(path);
}

/**
 * 파일이 마크다운 파일인지 확인합니다.
 * @param file 확인할 파일
 * @returns 마크다운 파일인지 여부
 */
export function isMarkdownFile(file: TFile): boolean {
  return file.extension === 'md';
}

/**
 * 폴더의 모든 마크다운 파일을 가져옵니다.
 * @param app Obsidian 앱 인스턴스
 * @param folderPath 폴더 경로
 * @param recursive 하위 폴더도 포함할지 여부 (기본값: false)
 * @param includeHidden 숨김 파일 포함 여부 (기본값: false)
 * @returns 마크다운 파일 배열
 */
export function getMarkdownFilesInFolder(app: App, folderPath: string, recursive: boolean = false, includeHidden: boolean = false): TFile[] {
  const folder = app.vault.getAbstractFileByPath(normalizePath(folderPath));
  
  if (!folder || !(folder instanceof TFolder)) {
    return [];
  }
  
  const files: TFile[] = [];
  
  // 폴더 내 파일 처리
  for (const child of folder.children) {
    if (child instanceof TFile && isMarkdownFile(child)) {
      // 숨김 파일 필터링
      if (includeHidden || !child.path.startsWith('.')) {
        files.push(child);
      }
    } else if (recursive && child instanceof TFolder) {
      // 숨김 폴더 필터링
      if (includeHidden || !child.path.split('/').pop()?.startsWith('.')) {
        files.push(...getMarkdownFilesInFolder(app, child.path, true, includeHidden));
      }
    }
  }
  
  return files;
}

/**
 * 볼트의 모든 마크다운 파일을 가져옵니다.
 * @param app Obsidian 앱 인스턴스
 * @param includeHidden 숨김 파일 포함 여부 (기본값: false)
 * @returns 마크다운 파일 배열
 */
export function getAllMarkdownFiles(app: App, includeHidden: boolean = false): TFile[] {
  return getMarkdownFilesInFolder(app, '/', true, includeHidden);
}

/**
 * 파일의 생성 시간을 가져옵니다.
 * @param file 파일
 * @returns 생성 시간 (Unix 타임스탬프, 밀리초)
 */
export function getFileCreationTime(file: TFile): number {
  return file.stat.ctime;
}

/**
 * 파일의 수정 시간을 가져옵니다.
 * @param file 파일
 * @returns 수정 시간 (Unix 타임스탬프, 밀리초)
 */
export function getFileModificationTime(file: TFile): number {
  return file.stat.mtime;
}

/**
 * 파일의 크기를 가져옵니다.
 * @param file 파일
 * @returns 파일 크기 (바이트)
 */
export function getFileSize(file: TFile): number {
  return file.stat.size;
}

/**
 * 파일 경로가 특정 폴더 내에 있는지 확인합니다.
 * @param filePath 파일 경로
 * @param folderPath 폴더 경로
 * @returns 파일이 폴더 내에 있는지 여부
 */
export function isFileInFolder(filePath: string, folderPath: string): boolean {
  const normalizedFilePath = normalizePath(filePath);
  const normalizedFolderPath = normalizePath(folderPath);
  
  return normalizedFilePath.startsWith(normalizedFolderPath + '/') || normalizedFilePath === normalizedFolderPath;
}

/**
 * 파일 경로에서 상대 경로를 가져옵니다.
 * @param filePath 파일 경로
 * @param basePath 기준 경로
 * @returns 상대 경로
 */
export function getRelativePath(filePath: string, basePath: string): string {
  const normalizedFilePath = normalizePath(filePath);
  const normalizedBasePath = normalizePath(basePath);
  
  if (normalizedFilePath.startsWith(normalizedBasePath + '/')) {
    return normalizedFilePath.substring(normalizedBasePath.length + 1);
  }
  
  return normalizedFilePath;
}

/**
 * 파일 경로를 조합합니다.
 * @param paths 조합할 경로 배열
 * @returns 조합된 경로
 */
export function joinPaths(...paths: string[]): string {
  return normalizePath(paths.join('/'));
}

/**
 * 파일 내용을 가져옵니다.
 * @param app Obsidian 앱 인스턴스
 * @param file 파일
 * @returns 파일 내용
 */
export async function getFileContent(app: App, file: TFile): Promise<string> {
  try {
    return await app.vault.read(file);
  } catch (error) {
    console.error(`파일 내용 읽기 실패: ${file.path}`, error);
    return '';
  }
}

/**
 * 마크다운 내용에서 첫 번째 헤더를 추출합니다.
 * @param content 마크다운 내용
 * @returns 첫 번째 헤더 (없으면 undefined)
 */
export function getFirstHeader(content: string): string | undefined {
  // H1 헤더 검색 (# 제목)
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }
  
  // H2 헤더 검색 (## 제목)
  const h2Match = content.match(/^##\s+(.+)$/m);
  if (h2Match) {
    return h2Match[1].trim();
  }
  
  // 프론트매터 제목 검색
  const frontmatterTitleMatch = content.match(/^---\s*[\s\S]*?title:\s*["']?(.*?)["']?[\s\S]*?---/);
  if (frontmatterTitleMatch) {
    return frontmatterTitleMatch[1].trim();
  }
  
  return undefined;
} 