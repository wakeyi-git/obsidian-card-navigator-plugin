import { Notice } from "obsidian";
import { CardNavigatorError } from "./Error";

export function log_update(msg: string): void {
    const notice = new Notice("", 15000);
    // TODO: Find better way for this
    // @ts-ignore
    notice.noticeEl.innerHTML = `<b>Card Navigator update</b>:<br/>${msg}`;
}

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
