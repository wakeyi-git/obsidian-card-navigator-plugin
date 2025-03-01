import { Component, TFile, setIcon, MarkdownRenderer, MarkdownView, Notice } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { Card } from 'common/types';
import { t } from 'i18next';
import { CardNavigatorSettings } from 'common/types';

/**
 * 카드 생성 클래스
 * 
 * 이 클래스는 카드 생성과 관련된 기능을 담당합니다.
 * 파일에서 카드 객체를 생성하고, 카드 요소를 만들고, 카드 내용을 추출하는 등의 기능을 제공합니다.
 */
export class CardMaker extends Component {
    constructor(private plugin: CardNavigatorPlugin) {
        super();
    }

    /**
     * 파일에서 카드 객체를 생성합니다.
     * @param file 카드로 변환할 파일
     * @returns 생성된 카드 객체
     */
    async createCard(file: TFile): Promise<Card | null> {
        if (!file) return null;

        try {
            // 파일 내용 읽기
            const content = await this.plugin.app.vault.read(file);
            
            // 첫 번째 헤더 추출
            const firstHeader = this.extractFirstHeader(content);
            
            // 본문 추출
            const body = this.extractBody(content);
            
            // 태그 추출
            const tags = this.extractTags(content);
            
            // 카드 객체 생성
            return {
                id: file.path,
                file: file,
                fileName: file.basename,
                firstHeader: firstHeader,
                body: body,
                originalBody: content,
                tags: tags
            };
        } catch (error) {
            console.error(`카드 생성 중 오류 발생 (${file.path}):`, error);
            return null;
        }
    }

    /**
     * 카드 요소를 생성합니다.
     * @param card 카드 객체
     * @returns 생성된 카드 요소
     */
    async createCardElement(card: Card): Promise<HTMLElement> {
        const cardEl = document.createElement('div');
        cardEl.className = 'card-navigator-card';
        cardEl.dataset.cardId = card.id;
        cardEl.draggable = true;
        
        // 제목 요소 추가
        const titleEl = document.createElement('div');
        titleEl.className = 'card-navigator-card-title';
        titleEl.textContent = card.fileName || '제목 없음';
        cardEl.appendChild(titleEl);
        
        // 내용 요소 추가
        const contentEl = document.createElement('div');
        contentEl.className = 'card-navigator-body';
        cardEl.appendChild(contentEl);
        
        // 태그 컨테이너 추가
        const tagsEl = document.createElement('div');
        tagsEl.className = 'card-navigator-card-tags';
        tagsEl.style.marginTop = 'auto'; // 자동 마진으로 하단에 배치
        cardEl.appendChild(tagsEl);
        
        // 카드 내용 업데이트
        await this.updateCardContent(cardEl, card);
        
        return cardEl;
    }

    /**
     * 카드 내용을 업데이트합니다.
     * @param cardEl 카드 요소
     * @param card 카드 객체
     */
    async updateCardContent(cardEl: HTMLElement, card: Card): Promise<void> {
        const settings = this.plugin.settings;
        
        // 제목 업데이트
        const titleEl = cardEl.querySelector('.card-navigator-card-title') as HTMLElement;
        if (titleEl) {
            if (settings.showFileName) {
                titleEl.textContent = card.fileName || '제목 없음';
                titleEl.style.display = 'block';
                titleEl.style.fontSize = `${settings.fileNameFontSize}px`;
            } else {
                titleEl.style.display = 'none';
            }
        }
        
        // 첫 번째 헤더 업데이트
        let headerEl = cardEl.querySelector('.card-navigator-card-header') as HTMLElement;
        if (settings.showFirstHeader && card.firstHeader) {
            if (!headerEl) {
                headerEl = document.createElement('div');
                headerEl.className = 'card-navigator-card-header';
                cardEl.insertBefore(headerEl, cardEl.querySelector('.card-navigator-body'));
            }
            
            headerEl.textContent = card.firstHeader;
            headerEl.style.display = 'block';
            headerEl.style.fontSize = `${settings.firstHeaderFontSize}px`;
        } else if (headerEl) {
            headerEl.style.display = 'none';
        }
        
        // 본문 업데이트
        const bodyEl = cardEl.querySelector('.card-navigator-body') as HTMLElement;
        if (bodyEl) {
            if (settings.showBody && card.body) {
                bodyEl.style.display = 'block';
                bodyEl.style.fontSize = `${settings.bodyFontSize}px`;
                
                // 본문 길이 제한
                let displayBody = card.body;
                if (settings.bodyLengthLimit && displayBody.length > settings.bodyLength) {
                    displayBody = displayBody.substring(0, settings.bodyLength) + '...';
                }
                
                // HTML 렌더링 여부에 따라 처리
                if (settings.renderContentAsHtml) {
                    await this.renderMarkdown(displayBody, bodyEl);
                } else {
                    bodyEl.textContent = displayBody;
                }
            } else {
                bodyEl.style.display = 'none';
            }
        }
        
        // 태그 업데이트
        const tagsEl = cardEl.querySelector('.card-navigator-card-tags') as HTMLElement;
        if (tagsEl) {
            tagsEl.innerHTML = '';
            
            if (card.tags && card.tags.length > 0) {
                tagsEl.style.display = 'flex';
                
                card.tags.forEach(tag => {
                    const tagEl = document.createElement('span');
                    tagEl.className = 'card-navigator-tag';
                    tagEl.textContent = tag;
                    tagEl.style.fontSize = `${settings.tagsFontSize}px`;
                    
                    // 태그 클릭 이벤트 추가
                    tagEl.addEventListener('click', (event) => {
                        event.stopPropagation();
                        this.triggerTagSearch(tag);
                    });
                    
                    tagsEl.appendChild(tagEl);
                });
            } else {
                tagsEl.style.display = 'none';
            }
        }
    }

    /**
     * 마크다운을 HTML로 렌더링합니다.
     * @param markdown 마크다운 텍스트
     * @param element 렌더링할 요소
     */
    private async renderMarkdown(markdown: string, element: HTMLElement): Promise<void> {
        try {
            element.empty();
            await MarkdownRenderer.renderMarkdown(
                markdown,
                element,
                '',
                null as unknown as MarkdownView
            );
            
            // 링크 클릭 이벤트 처리
            element.querySelectorAll('a.internal-link').forEach(link => {
                link.addEventListener('click', (event) => {
                    event.stopPropagation();
                });
            });
        } catch (error) {
            console.error('마크다운 렌더링 중 오류 발생:', error);
            element.textContent = markdown;
        }
    }

    /**
     * 첫 번째 헤더를 추출합니다.
     * @param content 파일 내용
     * @returns 추출된 첫 번째 헤더
     */
    private extractFirstHeader(content: string): string | undefined {
        const headerMatch = content.match(/^#\s+(.+)$/m);
        return headerMatch ? headerMatch[1].trim() : undefined;
    }

    /**
     * 본문을 추출합니다.
     * @param content 파일 내용
     * @returns 추출된 본문
     */
    private extractBody(content: string): string {
        // 프론트매터 제거
        let body = content.replace(/^---\n[\s\S]*?\n---\n/, '');
        
        // 첫 번째 헤더 제거
        body = body.replace(/^#\s+.+$/m, '');
        
        return body.trim();
    }

    /**
     * 태그를 추출합니다.
     * @param content 파일 내용
     * @returns 추출된 태그 목록
     */
    private extractTags(content: string): string[] {
        const tags: string[] = [];
        const tagRegex = /#([a-zA-Z0-9_\-/]+)/g;
        let match;
        
        while ((match = tagRegex.exec(content)) !== null) {
            tags.push(match[1]);
        }
        
        // 프론트매터에서 태그 추출
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
        if (frontMatterMatch) {
            const frontMatter = frontMatterMatch[1];
            const tagMatch = frontMatter.match(/tags:\s*\[(.*?)\]/);
            
            if (tagMatch) {
                const tagList = tagMatch[1].split(',').map(tag => tag.trim().replace(/["']/g, ''));
                tags.push(...tagList);
            }
        }
        
        return [...new Set(tags)]; // 중복 제거
    }

    /**
     * 파일 링크를 클립보드에 복사합니다.
     * @param file 파일
     */
    copyLink(file: TFile): void {
        const linkText = this.plugin.app.fileManager.generateMarkdownLink(file, '');
        navigator.clipboard.writeText(linkText).then(() => {
            new Notice(t('LINK_COPIED'));
        });
    }

    /**
     * 카드 내용을 클립보드에 복사합니다.
     * @param file 파일
     */
    async copyCardContent(file: TFile): Promise<void> {
        try {
            const content = await this.plugin.app.vault.read(file);
            navigator.clipboard.writeText(content).then(() => {
                new Notice(t('CONTENT_COPIED'));
            });
        } catch (error) {
            console.error('내용 복사 중 오류 발생:', error);
            new Notice(t('COPY_ERROR'));
        }
    }

    /**
     * 드래그 데이터를 설정합니다.
     * @param event 드래그 이벤트
     * @param card 카드 객체
     */
    setupDragData(event: DragEvent, card: Card): void {
        if (!event.dataTransfer || !card.file) return;
        
        // 파일 경로 설정
        event.dataTransfer.setData('text/plain', card.file.path);
        
        // 마크다운 링크 설정
        const linkText = this.plugin.app.fileManager.generateMarkdownLink(card.file, '');
        event.dataTransfer.setData('text/markdown', linkText);
        
        // HTML 링크 설정
        const htmlLink = `<a href="${card.file.path}">${card.fileName}</a>`;
        event.dataTransfer.setData('text/html', htmlLink);
    }

    /**
     * 태그 검색 트리거 메서드
     * @param tagName 태그 이름
     */
    private triggerTagSearch(tagName: string): void {
        // 커스텀 이벤트 생성
        const event = new CustomEvent('card-navigator-tag-search', {
            detail: { tagName }
        });
        
        // 이벤트 발생
        document.dispatchEvent(event);
    }

    /**
     * 플러그인 인스턴스를 가져옵니다.
     */
    getPlugin(): CardNavigatorPlugin {
        return this.plugin;
    }

    /**
     * 설정을 업데이트합니다.
     * @param settings 새 설정
     */
    updateSettings(settings: CardNavigatorSettings): void {
        this.plugin.settings = settings;
    }
}
