import { CardSetMode } from "../../types/cardset.types";
import { SortOption } from "../../types/common.types";
import { Preset } from "../../models/Preset";

/**
 * 툴바 서비스 인터페이스
 * 툴바 기능을 제공하는 인터페이스를 정의합니다.
 */
export interface IToolbarService {
    /**
     * 카드셋 모드를 변경합니다.
     * @param mode 변경할 카드셋 모드
     */
    setCardSetMode(mode: CardSetMode): void;

    /**
     * 현재 카드셋 모드를 가져옵니다.
     * @returns 현재 카드셋 모드
     */
    getCardSetMode(): CardSetMode;

    /**
     * 정렬 옵션을 변경합니다.
     * @param option 변경할 정렬 옵션
     */
    setSortOption(option: SortOption): void;

    /**
     * 현재 정렬 옵션을 가져옵니다.
     * @returns 현재 정렬 옵션
     */
    getSortOption(): SortOption;

    /**
     * 프리셋을 적용합니다.
     * @param preset 적용할 프리셋
     */
    applyPreset(preset: Preset): void;

    /**
     * 현재 적용된 프리셋을 가져옵니다.
     * @returns 현재 프리셋
     */
    getCurrentPreset(): Preset | null;

    /**
     * 툴바 버튼을 활성화/비활성화합니다.
     * @param buttonId 버튼 ID
     * @param enabled 활성화 여부
     */
    setButtonEnabled(buttonId: string, enabled: boolean): void;

    /**
     * 툴바 버튼의 활성화 상태를 가져옵니다.
     * @param buttonId 버튼 ID
     * @returns 버튼 활성화 여부
     */
    isButtonEnabled(buttonId: string): boolean;

    /**
     * 툴바 버튼의 표시 여부를 설정합니다.
     * @param buttonId 버튼 ID
     * @param visible 표시 여부
     */
    setButtonVisible(buttonId: string, visible: boolean): void;

    /**
     * 툴바 버튼의 표시 상태를 가져옵니다.
     * @param buttonId 버튼 ID
     * @returns 버튼 표시 여부
     */
    isButtonVisible(buttonId: string): boolean;

    /**
     * 툴바 메뉴를 열거나 닫습니다.
     * @param menuId 메뉴 ID
     * @param open 열기 여부
     */
    toggleMenu(menuId: string, open?: boolean): void;

    /**
     * 툴바 메뉴의 열림 상태를 가져옵니다.
     * @param menuId 메뉴 ID
     * @returns 메뉴 열림 여부
     */
    isMenuOpen(menuId: string): boolean;
} 