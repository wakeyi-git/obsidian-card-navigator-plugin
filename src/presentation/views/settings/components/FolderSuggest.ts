// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { App, TAbstractFile, TFolder } from "obsidian";
import { TextInputSuggest } from "./suggest";

/**
 * 폴더 경로 자동 완성을 제공하는 클래스입니다.
 * Liam의 Periodic Notes 플러그인의 코드를 기반으로 합니다.
 */
export class FolderSuggest extends TextInputSuggest<TFolder> {
    //#region 클래스 속성
    onBlur: () => void;
    containerEl: HTMLElement;
    //#endregion

    //#region 초기화
    /**
     * 폴더 제안 기능 생성자
     * @param app - Obsidian 앱 인스턴스
     * @param inputEl - 입력 필드 요소
     * @param onBlur - 포커스를 잃었을 때 실행할 콜백 함수
     */
    constructor(
        protected app: App,
        public inputEl: HTMLInputElement,
        onBlur?: () => void
    ) {
        super(app, inputEl);
        this.onBlur = onBlur || (() => {});
        this.containerEl = createDiv('suggestion-container');
        
        // 입력 요소에 blur 이벤트 리스너 추가
        this.inputEl.addEventListener('blur', () => {
            setTimeout(() => {
                if (!this.containerEl.contains(document.activeElement)) {
                    this.onBlur();
                }
            }, 100);
        });
    }
    //#endregion

    //#region 제안 기능
    /**
     * 입력된 문자열에 기반하여 폴더 제안 목록을 생성합니다.
     * @param inputStr - 사용자가 입력한 문자열
     * @returns 제안할 폴더 목록 (최대 1000개)
     */
    getSuggestions(inputStr: string): TFolder[] {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const folders: TFolder[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

        abstractFiles.forEach((folder: TAbstractFile) => {
            if (
                folder instanceof TFolder &&
                folder.path.toLowerCase().contains(lowerCaseInputStr)
            ) {
                folders.push(folder);
            }
        });

        return folders.slice(0, 1000);
    }

    /**
     * 제안된 폴더를 UI에 렌더링합니다.
     * @param file - 렌더링할 폴더
     * @param el - 렌더링할 HTML 요소
     */
    renderSuggestion(file: TFolder, el: HTMLElement): void {
        el.setText(file.path);
    }

    /**
     * 선택된 폴더를 입력 필드에 적용합니다.
     * @param file - 선택된 폴더
     */
    selectSuggestion(file: TFolder): void {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();
    }
    //#endregion
}
