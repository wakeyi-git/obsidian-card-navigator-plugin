import { TFile } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardNavigatorView } from 'ui/cardNavigatorView';
import { CardContainer } from 'ui/cardContainer/cardContainer';
import { SearchInput } from './SearchInput';
import { t } from 'i18next';

/**
 * 검색 바를 관리하는 클래스
 * SearchInput을 래핑하여 간단한 인터페이스를 제공합니다.
 */
export class SearchBar {
    private searchInput: SearchInput | null = null;

    constructor(
        private plugin: CardNavigatorPlugin,
        private view: CardNavigatorView,
        private cardContainer: CardContainer
    ) {}

    /**
     * 검색 바를 초기화합니다.
     * @param containerEl 검색 바 컨테이너 요소
     */
    async initialize(containerEl: HTMLElement): Promise<void> {
        // 검색 입력 초기화
        this.searchInput = new SearchInput(
            this.plugin,
            containerEl,
            this.cardContainer
        );
    }

    /**
     * 검색 입력에 포커스를 설정합니다.
     */
    public focus(): void {
        if (this.searchInput) {
            this.searchInput.focus();
        }
    }

    /**
     * 검색어를 설정합니다.
     * @param searchTerm 검색어
     */
    public setSearchTerm(searchTerm: string): void {
        if (this.searchInput) {
            this.searchInput.setSearchTerm(searchTerm);
        }
    }

    /**
     * 현재 검색어를 가져옵니다.
     * @returns 현재 검색어
     */
    public getSearchTerm(): string {
        return this.searchInput ? this.searchInput.getSearchTerm() : '';
    }

    /**
     * 검색 바를 닫습니다.
     */
    public onClose(): void {
        // SearchInput에는 onClose 메서드가 없으므로 필요한 정리 작업만 수행
    }
} 