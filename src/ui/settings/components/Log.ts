import { Notice } from "obsidian";
import { CardNavigatorError } from "./Error";

/**
 * Card Navigator의 로깅 기능을 제공하는 유틸리티 모음입니다.
 */

//#region 업데이트 로그
/**
 * 업데이트 알림을 표시합니다.
 * 15초 동안 표시되는 알림을 생성합니다.
 * @param msg - 표시할 업데이트 메시지
 */
export function log_update(msg: string): void {
    const notice = new Notice("", 15000);
    // TODO: Find better way for this
    // @ts-ignore
    notice.noticeEl.innerHTML = `<b>Card Navigator update</b>:<br/>${msg}`;
}
//#endregion

//#region 에러 로그
/**
 * 에러 알림을 표시합니다.
 * 8초 동안 표시되는 에러 알림을 생성하고, 필요한 경우 콘솔에 상세 정보를 출력합니다.
 * @param e - 표시할 에러 객체 (일반 Error 또는 CardNavigatorError)
 */
export function log_error(e: Error | CardNavigatorError): void {
    const notice = new Notice("", 8000);
    if (e instanceof CardNavigatorError && e.console_msg) {
        // TODO: Find a better way for this
        // @ts-ignore
        notice.noticeEl.innerHTML = `<b>Card Navigator Error</b>:<br/>${e.message}<br/>Check console for more information`;
        console.error(`Card Navigator Error:`, e.message, "\n", e.console_msg);
    } else {
        // @ts-ignore
        notice.noticeEl.innerHTML = `<b>Card Navigator Error</b>:<br/>${e.message}`;
    }
}
//#endregion
