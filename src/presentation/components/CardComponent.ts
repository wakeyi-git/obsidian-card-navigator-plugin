import { CardViewModel } from '../viewModels/CardViewModel';
import { CardStyle, CardSection, CardContent } from '../../domain/models/types';
import { MarkdownRenderer, Component } from 'obsidian';

/**
 * 카드 컴포넌트
 */
export class CardComponent extends Component {
  private element: HTMLElement | null = null;
  private selected: boolean = false;

  constructor(
    private readonly viewModel: CardViewModel,
    private readonly onSelect: (cardId: string) => void,
    private readonly onOpen: (cardId: string) => void
  ) {
    super();
    this.initialize();
  }

  /**
   * 컴포넌트를 초기화합니다.
   */
  private async initialize(): Promise<void> {
    this.element = await this.createCardElement();
    this.setupEventListeners();
  }

  /**
   * 카드 요소를 생성합니다.
   */
  private async createCardElement(): Promise<HTMLElement> {
    const card = document.createElement('div');
    card.className = 'card-navigator-card';
    card.dataset.cardId = this.viewModel.getId();
    card.draggable = true;

    // 카드 헤더
    const header = this.createHeader();
    card.appendChild(header);

    // 카드 내용
    const content = await this.createContent();
    card.appendChild(content);

    // 카드 푸터
    const footer = this.createFooter();
    card.appendChild(footer);

    return card;
  }

  /**
   * 카드 헤더를 생성합니다.
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'card-navigator-card-header';

    const title = document.createElement('h3');
    title.textContent = this.viewModel.getFileName();
    header.appendChild(title);

    return header;
  }

  /**
   * 카드 내용을 생성합니다.
   */
  private async createContent(): Promise<HTMLElement> {
    const content = document.createElement('div');
    content.className = 'card-navigator-card-content';

    const cardContent = this.viewModel.getContent();
    
    // 헤더 섹션 렌더링
    for (const section of cardContent.header) {
      const sectionEl = await this.renderSection(section);
      content.appendChild(sectionEl);
    }

    // 본문 섹션 렌더링
    for (const section of cardContent.body) {
      const sectionEl = await this.renderSection(section);
      content.appendChild(sectionEl);
    }

    return content;
  }

  /**
   * 카드 푸터를 생성합니다.
   */
  private createFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'card-navigator-card-footer';

    const tags = document.createElement('div');
    tags.className = 'card-navigator-card-tags';
    
    const cardContent = this.viewModel.getContent();
    cardContent.footer.forEach((section: CardSection) => {
      if (section.type === 'text' && section.content.startsWith('#')) {
        const tag = document.createElement('span');
        tag.className = 'card-navigator-card-tag';
        tag.textContent = section.content;
        tags.appendChild(tag);
      }
    });

    footer.appendChild(tags);
    return footer;
  }

  /**
   * 섹션을 렌더링합니다.
   */
  private async renderSection(section: CardSection): Promise<HTMLElement> {
    const sectionEl = document.createElement('div');
    sectionEl.className = `card-navigator-card-section ${section.type}`;

    if (section.type === 'text') {
      // 마크다운 렌더링
      await MarkdownRenderer.renderMarkdown(
        section.content,
        sectionEl,
        this.viewModel.getFilePath(),
        this
      );
    } else if (section.type === 'header') {
      const headerEl = document.createElement(`h${section.level || 3}`);
      headerEl.textContent = section.content;
      sectionEl.appendChild(headerEl);
    }

    return sectionEl;
  }

  /**
   * 이벤트 리스너를 설정합니다.
   */
  private setupEventListeners(): void {
    this.element?.addEventListener('click', () => {
      this.onSelect(this.viewModel.getId());
    });

    this.element?.addEventListener('dblclick', () => {
      this.onOpen(this.viewModel.getId());
    });
  }

  /**
   * 카드가 선택되었는지 확인합니다.
   */
  isSelected(): boolean {
    return this.selected;
  }

  /**
   * 카드 선택 상태를 설정합니다.
   */
  setSelected(selected: boolean): void {
    this.selected = selected;
    this.element?.classList.toggle('selected', selected);
  }

  /**
   * 카드 내용을 업데이트합니다.
   */
  async updateContent(): Promise<void> {
    const content = await this.createContent();
    const existingContent = this.element?.querySelector('.card-navigator-card-content');
    if (existingContent) {
      existingContent.replaceWith(content);
    } else {
      this.element?.appendChild(content);
    }
  }

  /**
   * 카드 스타일을 업데이트합니다.
   */
  updateStyle(style: CardStyle): void {
    if (this.element) {
      Object.assign(this.element.style, {
        width: `${style.width}px`,
        height: `${style.height}px`,
        fontSize: `${style.fontSize}px`,
        lineHeight: style.lineHeight.toString(),
        padding: `${style.padding}px`,
        margin: `${style.margin}px`,
        borderRadius: `${style.borderRadius}px`,
        backgroundColor: style.backgroundColor,
        color: style.textColor,
        borderWidth: `${style.borderWidth}px`,
        borderColor: style.borderColor,
        boxShadow: style.boxShadow
      });
    }
  }

  /**
   * 카드 제목을 반환합니다.
   */
  getTitle(): string {
    return this.viewModel.getFileName();
  }

  /**
   * 카드 내용을 반환합니다.
   */
  getContent(): CardContent {
    return this.viewModel.getContent();
  }

  /**
   * 카드 생성 시간을 반환합니다.
   */
  getCreatedTime(): number {
    return this.viewModel.getCreatedAt().getTime();
  }

  /**
   * 카드 수정 시간을 반환합니다.
   */
  getModifiedTime(): number {
    return this.viewModel.getUpdatedAt().getTime();
  }

  /**
   * 카드 요소를 반환합니다.
   */
  getElement(): HTMLElement {
    if (!this.element) {
      throw new Error('Card element not initialized');
    }
    return this.element;
  }
} 