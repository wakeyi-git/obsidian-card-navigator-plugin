import { App, Modal, Setting } from 'obsidian';

/**
 * 템플릿 입력을 위한 모달 컴포넌트
 */
export class TemplateModal extends Modal {
  template: string = '';

  constructor(
    app: App,
    private initialTemplate: string = '',
    private onSubmit: (template: string) => void
  ) {
    super(app);
    this.template = initialTemplate;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: '템플릿 설정' });
    contentEl.createEl('p', { text: '사용 가능한 변수:' });
    contentEl.createEl('ul', {}, (ul) => {
      ul.createEl('li', { text: '{{title}} - 제목' });
      ul.createEl('li', { text: '{{filename}} - 파일명' });
      ul.createEl('li', { text: '{{content}} - 내용' });
      ul.createEl('li', { text: '{{path}} - 경로' });
      ul.createEl('li', { text: '{{tags}} - 태그' });
      ul.createEl('li', { text: '{{created}} - 생성일' });
      ul.createEl('li', { text: '{{modified}} - 수정일' });
      ul.createEl('li', { text: '{{firstheader}} - 첫 번째 헤더' });
      ul.createEl('li', { text: '{{frontmatter.field}} - 프론트매터 필드' });
    });

    new Setting(contentEl)
      .setName('템플릿')
      .addText((text) => {
        text.setValue(this.template)
          .onChange((value) => {
            this.template = value;
          });
      });

    new Setting(contentEl)
      .addButton((btn) => {
        btn.setButtonText('저장')
          .setCta()
          .onClick(() => {
            this.onSubmit(this.template);
            this.close();
          });
      })
      .addButton((btn) => {
        btn.setButtonText('취소')
          .onClick(() => {
            this.close();
          });
      });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
} 