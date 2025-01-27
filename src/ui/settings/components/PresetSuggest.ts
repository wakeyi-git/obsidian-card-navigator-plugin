// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { App, TAbstractFile, TFile } from "obsidian";
import { TextInputSuggest } from "./suggest";
import { get_tfiles_from_folder } from "./Utils";
import CardNavigatorPlugin from "main";
import { errorWrapperSync } from "./Error";
// import * as path from 'path';

/**
 * Card Navigator의 프리셋 자동 완성 기능을 제공하는 모듈입니다.
 * Liam의 Periodic Notes 플러그인의 코드를 기반으로 합니다.
 */

//#region 유틸리티 함수
/**
 * 파일 경로에서 파일 이름을 추출합니다.
 * @param path - 파일 경로
 * @param ext - 제거할 확장자 (선택적)
 * @returns 파일 이름
 */
function basename(path: string, ext?: string): string {
    const name = path.split('/').pop() || path;
    return ext && name.endsWith(ext) ? name.slice(0, -ext.length) : name;
}
//#endregion

//#region 타입 정의
/**
 * 파일 제안 모드를 정의하는 열거형
 */
export enum FileSuggestMode {
    PresetsFiles,
}
//#endregion

//#region 프리셋 제안 클래스
/**
 * 프리셋 파일 자동 완성을 제공하는 클래스
 */
export class PresetSuggest extends TextInputSuggest<TFile> {
    /**
     * 프리셋 제안 기능 생성자
     * @param app - Obsidian 앱 인스턴스
     * @param inputEl - 입력 필드 요소
     * @param plugin - Card Navigator 플러그인 인스턴스
     * @param mode - 파일 제안 모드
     */
    constructor(
        protected app: App,
        public inputEl: HTMLInputElement,
        private plugin: CardNavigatorPlugin,
        private mode: FileSuggestMode
    ) {
        super(app, inputEl);
    }

    /**
     * 모드에 따른 대상 폴더 경로를 반환합니다.
     * @param mode - 파일 제안 모드
     * @returns 폴더 경로
     */
    get_folder(mode: FileSuggestMode): string {
        switch (mode) {
            case FileSuggestMode.PresetsFiles:
                return this.plugin.settings.presetFolderPath;
        }
    }

    /**
     * 모드에 따른 에러 메시지를 반환합니다.
     * @param mode - 파일 제안 모드
     * @returns 에러 메시지
     */
    get_error_msg(mode: FileSuggestMode): string {
        switch (mode) {
            case FileSuggestMode.PresetsFiles:
                return `Presets folder doesn't exist`;
        }
    }

    /**
     * 입력된 문자열에 기반하여 프리셋 파일 제안 목록을 생성합니다.
     * @param input_str - 사용자가 입력한 문자열
     * @returns 제안할 파일 목록 (최대 1000개)
     */
    getSuggestions(input_str: string): TFile[] {
        const all_files = errorWrapperSync(
            () => get_tfiles_from_folder(this.app, this.get_folder(this.mode)),
            this.get_error_msg(this.mode)
        );
        if (!all_files) {
            return [];
        }

        const files: TFile[] = [];
        const lower_input_str = input_str.toLowerCase();

        all_files.forEach((file: TAbstractFile) => {
            if (
                file instanceof TFile &&
                file.extension === "json" &&
                file.path.toLowerCase().includes(lower_input_str)
            ) {
                files.push(file);
            }
        });

        return files.slice(0, 1000);
    }

    /**
     * 제안된 프리셋 파일을 UI에 렌더링합니다.
     * @param file - 렌더링할 파일
     * @param el - 렌더링할 HTML 요소
     */
    renderSuggestion(file: TFile, el: HTMLElement): void {
        const presetName = basename(file.path, '.json');
        el.setText(presetName);
    }

    /**
     * 선택된 프리셋 파일을 입력 필드에 적용합니다.
     * @param file - 선택된 파일
     */
    selectSuggestion(file: TFile): void {
        const presetName = basename(file.path, '.json');
        this.inputEl.value = presetName;
        this.inputEl.trigger("input");
        this.close();
    }
}
//#endregion
