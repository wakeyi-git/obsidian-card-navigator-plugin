import { Card } from '../../domain/models/Card';
import { CardNavigatorViewModel } from '../viewModels/CardNavigatorViewModel';
import { t } from 'i18next';
import { Menu } from 'obsidian';

/**
 * 카드 컴포넌트
 */
export class CardComponent {
    private element: HTMLElement | null = null;

    constructor(
        private readonly card: Card,
        private readonly viewModel: CardNavigatorViewModel
    ) {}

    /**
     * 컴포넌트를 초기화합니다.
     */
    async initialize(container: HTMLElement): Promise<void> {
        this.element = this.createCardElement();
        container.appendChild(this.element);
        this.setupEventListeners();
    }

    /**
     * 컴포넌트를 정리합니다.
     */
    dispose(): void {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    /**
     * 카드 요소를 생성합니다.
     */
    private createCardElement(): HTMLElement {
        const cardEl = document.createElement('div');
        cardEl.className = 'card-navigator-card';
        cardEl.dataset.cardId = this.card.getId();
        cardEl.draggable = true;

        // 카드 헤더
        const headerEl = cardEl.createDiv('card-navigator-card-header');
        headerEl.createEl('h3', { text: this.card.getFile().basename });

        // 카드 내용
        const contentEl = cardEl.createDiv('card-navigator-card-content');
        const content = this.card.getContent();
        content.body.forEach(section => {
            if (section.type === 'text') {
                contentEl.createEl('p', { text: section.content });
            }
        });

        // 카드 푸터
        const footerEl = cardEl.createDiv('card-navigator-card-footer');
        content.footer.forEach(section => {
            if (section.type === 'text') {
                footerEl.createEl('span', { text: section.content });
            }
        });

        return cardEl;
    }

    /**
     * 이벤트 리스너를 설정합니다.
     */
    private setupEventListeners(): void {
        if (!this.element) return;

        // 클릭 이벤트
        this.element.addEventListener('click', () => {
            this.handleClick();
        });

        // 드래그 이벤트
        this.element.addEventListener('dragstart', (e: DragEvent) => {
            if (e.dataTransfer) {
                e.dataTransfer.setData('text/plain', this.card.getId());
                this.element?.classList.add('dragging');
            }
        });

        this.element.addEventListener('dragend', () => {
            this.element?.classList.remove('dragging');
        });

        // 컨텍스트 메뉴 이벤트
        this.element.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
            this.handleContextMenu(e);
        });
    }

    /**
     * 클릭 이벤트를 처리합니다.
     */
    private handleClick(): void {
        if (!this.element) return;
        
        // 선택 상태 토글
        this.element.classList.toggle('selected');
        
        // 카드 열기
        this.viewModel.getApp().workspace.openLinkText(
            this.card.getFile().path,
            this.card.getFile().path
        );
    }

    /**
     * 컨텍스트 메뉴 이벤트를 처리합니다.
     */
    private handleContextMenu(e: MouseEvent): void {
        if (!this.element) return;

        const menu = new Menu();
        
        // 카드 열기
        menu.addItem((item) => {
            item
                .setTitle(t('OPEN_CARD'))
                .setIcon('file-text')
                .onClick(() => {
                    this.viewModel.getApp().workspace.openLinkText(
                        this.card.getFile().path,
                        this.card.getFile().path
                    );
                });
        });

        // 링크 복사
        menu.addItem((item) => {
            item
                .setTitle(t('COPY_AS_LINK'))
                .setIcon('link')
                .onClick(() => {
                    navigator.clipboard.writeText(`[[${this.card.getFile().path}]]`);
                });
        });

        // 내용 복사
        menu.addItem((item) => {
            item
                .setTitle(t('COPY_CARD_CONTENT'))
                .setIcon('copy')
                .onClick(async () => {
                    const content = await this.card.getContent();
                    navigator.clipboard.writeText(content.body.map(s => s.content).join('\n'));
                });
        });

        menu.showAtPosition({ x: e.clientX, y: e.clientY });
    }
} 