import { CardNavigatorError } from "./Error";
import {
    App,
    normalizePath,
    TAbstractFile,
    TFile,
    TFolder,
    Vault,
} from "obsidian";

//#region 기본 유틸리티 함수
/**
 * 지정된 시간(ms) 동안 대기합니다.
 */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 정규식 특수문자를 이스케이프 처리합니다.
 */
export function escape_RegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * 배열의 요소 위치를 변경합니다.
 */
export function arraymove<T>(
    arr: T[],
    fromIndex: number,
    toIndex: number
): void {
    if (toIndex < 0 || toIndex === arr.length) {
        return;
    }
    const element = arr[fromIndex];
    arr[fromIndex] = arr[toIndex];
    arr[toIndex] = element;
}
//#endregion

//#region 정규식 생성 함수
/**
 * 기본 명령어 정규식을 생성합니다.
 */
export function generate_command_regex(): RegExp {
    return /<%(?:-|_)?\s*[*~]{0,1}((?:.|\s)*?)(?:-|_)?%>/g;
}

/**
 * 동적 명령어 정규식을 생성합니다.
 */
export function generate_dynamic_command_regex(): RegExp {
    return /(<%(?:-|_)?\s*[*~]{0,1})\+((?:.|\s)*?%>)/g;
}
//#endregion

//#region 파일 시스템 유틸리티
/**
 * 폴더 경로로부터 TFolder 객체를 가져옵니다.
 */
export function resolve_tfolder(app: App, folder_str: string): TFolder {
    folder_str = normalizePath(folder_str);

    const folder = app.vault.getAbstractFileByPath(folder_str);
    if (!folder) {
        throw new CardNavigatorError(`Folder "${folder_str}" doesn't exist`);
    }
    if (!(folder instanceof TFolder)) {
        throw new CardNavigatorError(`${folder_str} is a file, not a folder`);
    }

    return folder;
}

/**
 * 파일 경로로부터 TFile 객체를 가져옵니다.
 */
export function resolve_tfile(app: App, file_str: string): TFile {
    file_str = normalizePath(file_str);

    const file = app.vault.getAbstractFileByPath(file_str);
    if (!file) {
        throw new CardNavigatorError(`File "${file_str}" doesn't exist`);
    }
    if (!(file instanceof TFile)) {
        throw new CardNavigatorError(`${file_str} is a folder, not a file`);
    }

    return file;
}

/**
 * 지정된 폴더 내의 모든 파일을 가져옵니다.
 */
export function get_tfiles_from_folder(app: App, folder_str: string): Array<TFile> {
    const folder = resolve_tfolder(app, folder_str);

    const files: Array<TFile> = [];
    Vault.recurseChildren(folder, (file: TAbstractFile) => {
        if (file instanceof TFile) {
            files.push(file);
        }
    });

    files.sort((a, b) => {
        return a.path.localeCompare(b.path);
    });

    return files;
}

/**
 * 현재 활성화된 파일을 가져옵니다.
 */
export function get_active_file(app: App) {
    return app.workspace.activeEditor?.file ?? app.workspace.getActiveFile();
}

/**
 * 파일 경로에서 폴더 경로를 추출합니다.
 */
export function get_folder_path_from_file_path(path: string) {
    const path_separator = path.lastIndexOf("/");
    if (path_separator !== -1) return path.slice(0, path_separator);
    return "";
}
//#endregion
