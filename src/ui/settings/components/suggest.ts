// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { App, ISuggestOwner, Scope } from "obsidian";
import { createPopper, Instance as PopperInstance } from "@popperjs/core";

//#region 유틸리티 함수
/**
 * 값을 배열 크기 내에서 순환하도록 조정합니다.
 */
const wrapAround = (value: number, size: number): number => {
    return ((value % size) + size) % size;
};
//#endregion

//#region 기본 제안 클래스
/**
 * 기본 제안 기능을 구현하는 클래스
 */
class Suggest<T> {
    private owner: ISuggestOwner<T>;
    private values: T[] = [];
    private suggestions: HTMLDivElement[] = [];
    private selectedItem = 0;
    private containerEl: HTMLElement;

    /**
     * 제안 기능 초기화 및 이벤트 핸들러 설정
     */
    constructor(
        owner: ISuggestOwner<T>,
        containerEl: HTMLElement,
        scope: Scope
    ) {
        this.owner = owner;
        this.containerEl = containerEl;

        containerEl.on(
            "click",
            ".suggestion-item",
            (event: MouseEvent, target: HTMLElement) => {
                this.onSuggestionClick(event, target as HTMLDivElement);
            }
        );
        containerEl.on(
            "mousemove",
            ".suggestion-item",
            (event: MouseEvent, target: HTMLElement) => {
                this.onSuggestionMouseover(event, target as HTMLDivElement);
            }
        );

        scope.register([], "ArrowUp", (event) => {
            if (!event.isComposing) {
                this.setSelectedItem(this.selectedItem - 1, true);
                return false;
            }
        });

        scope.register([], "ArrowDown", (event) => {
            if (!event.isComposing) {
                this.setSelectedItem(this.selectedItem + 1, true);
                return false;
            }
        });

        scope.register([], "Enter", (event) => {
            if (!event.isComposing) {
                this.useSelectedItem(event);
                return false;
            }
        });
    }

    /**
     * 제안 항목 클릭 이벤트 처리
     */
    onSuggestionClick(event: MouseEvent, el: HTMLDivElement): void {
        event.preventDefault();

        const item = this.suggestions.indexOf(el);
        this.setSelectedItem(item, false);
        this.useSelectedItem(event);
    }

    /**
     * 제안 항목 마우스오버 이벤트 처리
     */
    onSuggestionMouseover(_event: MouseEvent, el: HTMLDivElement): void {
        const item = this.suggestions.indexOf(el);
        this.setSelectedItem(item, false);
    }

    /**
     * 제안 목록 설정 및 렌더링
     */
    setSuggestions(values: T[]) {
        this.containerEl.empty();
        const suggestionEls: HTMLDivElement[] = [];

        values.forEach((value) => {
            const suggestionEl = this.containerEl.createDiv("suggestion-item");
            this.owner.renderSuggestion(value, suggestionEl);
            suggestionEls.push(suggestionEl);
        });

        this.values = values;
        this.suggestions = suggestionEls;
        this.setSelectedItem(0, false);
    }

    /**
     * 선택된 항목 사용
     */
    useSelectedItem(event: MouseEvent | KeyboardEvent) {
        const currentValue = this.values[this.selectedItem];
        if (currentValue) {
            this.owner.selectSuggestion(currentValue, event);
        }
    }

    /**
     * 선택된 항목 설정 및 스크롤 처리
     */
    setSelectedItem(selectedIndex: number, scrollIntoView: boolean) {
        const normalizedIndex = wrapAround(
            selectedIndex,
            this.suggestions.length
        );
        const prevSelectedSuggestion = this.suggestions[this.selectedItem];
        const selectedSuggestion = this.suggestions[normalizedIndex];

        prevSelectedSuggestion?.removeClass("is-selected");
        selectedSuggestion?.addClass("is-selected");

        this.selectedItem = normalizedIndex;

        if (scrollIntoView) {
            selectedSuggestion.scrollIntoView(false);
        }
    }
}
//#endregion

//#region 텍스트 입력 제안 클래스
/**
 * 텍스트 입력 필드에 대한 제안 기능을 구현하는 추상 클래스
 */
export abstract class TextInputSuggest<T> implements ISuggestOwner<T> {
    protected inputEl: HTMLInputElement | HTMLTextAreaElement;
    protected app: App;

    private popper?: PopperInstance;
    private scope: Scope;
    private suggestEl: HTMLElement;
    private suggest: Suggest<T>;

    /**
     * 텍스트 입력 제안 기능 초기화
     */
    constructor(app: App, inputEl: HTMLInputElement | HTMLTextAreaElement) {
        this.app = app;
        this.inputEl = inputEl;
        this.scope = new Scope();

        this.suggestEl = createDiv("suggestion-container");
        const suggestion = this.suggestEl.createDiv("suggestion");
        this.suggest = new Suggest(this, suggestion, this.scope);

        this.scope.register([], "Escape", this.close.bind(this));

        this.inputEl.addEventListener("input", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("focus", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("blur", this.close.bind(this));
        this.suggestEl.on(
            "mousedown",
            ".suggestion-container",
            (event: MouseEvent) => {
                event.preventDefault();
            }
        );
    }

    /**
     * 입력 변경 이벤트 처리
     */
    onInputChanged(): void {
        const inputStr = this.inputEl.value;
        const suggestions = this.getSuggestions(inputStr);

        if (!suggestions) {
            this.close();
            return;
        }

        if (suggestions.length > 0) {
            this.suggest.setSuggestions(suggestions);
            this.open(this.app.workspace.containerEl, this.inputEl);
        } else {
            this.close();
        }
    }

    /**
     * 제안 팝업 열기
     */
    open(container: HTMLElement, inputEl: HTMLElement): void {
        this.app.keymap.pushScope(this.scope);

        container.appendChild(this.suggestEl);
        this.popper = createPopper(inputEl, this.suggestEl, {
            placement: "bottom-start",
            modifiers: [
                {
                    name: "sameWidth",
                    enabled: true,
                    fn: ({ state, instance }) => {
                        // Note: positioning needs to be calculated twice -
                        // first pass - positioning it according to the width of the popper
                        // second pass - position it with the width bound to the reference element
                        // we need to early exit to avoid an infinite loop
                        const targetWidth = `${state.rects.reference.width}px`;
                        if (state.styles.popper.width === targetWidth) {
                            return;
                        }
                        state.styles.popper.width = targetWidth;
                        instance.update();
                    },
                    phase: "beforeWrite",
                    requires: ["computeStyles"],
                },
            ],
        });
    }

    /**
     * 제안 팝업 닫기
     */
    close(): void {
        this.app.keymap.popScope(this.scope);

        this.suggest.setSuggestions([]);
        if (this.popper) this.popper.destroy();
        this.suggestEl.detach();
    }

    /**
     * 제안 목록 가져오기 (구현 필요)
     */
    abstract getSuggestions(inputStr: string): T[];

    /**
     * 제안 항목 렌더링 (구현 필요)
     */
    abstract renderSuggestion(item: T, el: HTMLElement): void;

    /**
     * 제안 항목 선택 처리 (구현 필요)
     */
    abstract selectSuggestion(item: T): void;
}
//#endregion
