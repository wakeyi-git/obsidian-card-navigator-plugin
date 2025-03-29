import { Setting, ToggleComponent, ColorComponent } from 'obsidian';
import CardNavigatorPlugin from '@/main';
import { ICardRenderConfig, ICardStyle } from '@/domain/models/Card';

/**
 * 카드 설정 컴포넌트
 */
export class CardSettings extends Setting {
  constructor(containerEl: HTMLElement, private plugin: CardNavigatorPlugin) {
    super(containerEl);
    
    // 표시 항목 설정
    this.setName('표시 항목');
    this.addDisplayItemsSettings();
    
    // 렌더링 옵션 설정
    this.setName('렌더링 옵션');
    this.addRenderingOptionsSettings();
    
    // 스타일 설정
    this.setName('스타일');
    this.addStyleSettings();
  }
  
  /**
   * 표시 항목 설정 추가
   */
  private addDisplayItemsSettings(): void {
    // 헤더 설정
    this.setName('헤더');
    this.addToggleSetting('파일명 표시', 'header.showFileName');
    this.addToggleSetting('첫 번째 헤더 표시', 'header.showFirstHeader');
    this.addToggleSetting('태그 표시', 'header.showTags');
    this.addToggleSetting('생성일 표시', 'header.showCreatedDate');
    this.addToggleSetting('수정일 표시', 'header.showUpdatedDate');
    this.addPropertySelector('선택된 속성', 'header.showProperties');
    
    // 본문 설정
    this.setName('본문');
    this.addToggleSetting('파일명 표시', 'body.showFileName');
    this.addToggleSetting('첫 번째 헤더 표시', 'body.showFirstHeader');
    this.addToggleSetting('본문 표시', 'body.showContent');
    this.addToggleSetting('태그 표시', 'body.showTags');
    this.addToggleSetting('생성일 표시', 'body.showCreatedDate');
    this.addToggleSetting('수정일 표시', 'body.showUpdatedDate');
    this.addPropertySelector('선택된 속성', 'body.showProperties');
    this.addNumberInput('본문 길이', 'body.contentLength');
    
    // 푸터 설정
    this.setName('푸터');
    this.addToggleSetting('파일명 표시', 'footer.showFileName');
    this.addToggleSetting('첫 번째 헤더 표시', 'footer.showFirstHeader');
    this.addToggleSetting('태그 표시', 'footer.showTags');
    this.addToggleSetting('생성일 표시', 'footer.showCreatedDate');
    this.addToggleSetting('수정일 표시', 'footer.showUpdatedDate');
    this.addPropertySelector('선택된 속성', 'footer.showProperties');
  }
  
  /**
   * 렌더링 옵션 설정 추가
   */
  private addRenderingOptionsSettings(): void {
    this.addToggleSetting('마크다운 렌더링', 'renderMarkdown');
    this.addToggleSetting('HTML로 렌더링', 'renderAsHtml');
    
    // 마크다운 렌더링 옵션
    this.setName('마크다운 렌더링 옵션');
    this.addToggleSetting('이미지 표시', 'markdownOptions.showImages');
    this.addToggleSetting('코드 블록 하이라이팅', 'markdownOptions.highlightCode');
    this.addToggleSetting('콜아웃 지원', 'markdownOptions.supportCallouts');
    this.addToggleSetting('수식 지원', 'markdownOptions.supportMath');
  }
  
  /**
   * 스타일 설정 추가
   */
  private addStyleSettings(): void {
    // 카드 스타일
    this.setName('카드 스타일');
    this.addCardStyleSettings();
    
    // 컴포넌트 스타일
    this.setName('컴포넌트 스타일');
    this.addStyleSection('헤더', 'header');
    this.addStyleSection('본문', 'body');
    this.addStyleSection('푸터', 'footer');
  }
  
  /**
   * 카드 스타일 설정 추가
   */
  private addCardStyleSettings(): void {
    // 카드 배경색
    this.addColorPickerSetting('카드 배경색', 'cardStyle.card.background');

    // 카드 글꼴 크기
    this.addColorPickerSetting('카드 글꼴 크기', 'cardStyle.card.fontSize');

    // 카드 테두리 색상
    this.addColorPickerSetting('카드 테두리 색상', 'cardStyle.card.borderColor');

    // 카드 테두리 두께
    this.addColorPickerSetting('카드 테두리 두께', 'cardStyle.card.borderWidth');

    // 활성 카드 스타일 섹션
    this.setName('활성 카드 스타일');

    // 활성 카드 배경색
    this.addColorPickerSetting('활성 카드 배경색', 'cardStyle.activeCard.background');

    // 활성 카드 글꼴 크기
    this.addColorPickerSetting('활성 카드 글꼴 크기', 'cardStyle.activeCard.fontSize');

    // 활성 카드 테두리 색상
    this.addColorPickerSetting('활성 카드 테두리 색상', 'cardStyle.activeCard.borderColor');

    // 활성 카드 테두리 두께
    this.addColorPickerSetting('활성 카드 테두리 두께', 'cardStyle.activeCard.borderWidth');

    // 포커스된 카드 스타일 섹션
    this.setName('포커스된 카드 스타일');

    // 포커스된 카드 배경색
    this.addColorPickerSetting('포커스된 카드 배경색', 'cardStyle.focusedCard.background');

    // 포커스된 카드 글꼴 크기
    this.addColorPickerSetting('포커스된 카드 글꼴 크기', 'cardStyle.focusedCard.fontSize');

    // 포커스된 카드 테두리 색상
    this.addColorPickerSetting('포커스된 카드 테두리 색상', 'cardStyle.focusedCard.borderColor');

    // 포커스된 카드 테두리 두께
    this.addColorPickerSetting('포커스된 카드 테두리 두께', 'cardStyle.focusedCard.borderWidth');

    // 헤더 스타일 섹션
    this.setName('헤더 스타일');

    // 헤더 배경색
    this.addColorPickerSetting('헤더 배경색', 'cardStyle.header.background');

    // 헤더 글꼴 크기
    this.addColorPickerSetting('헤더 글꼴 크기', 'cardStyle.header.fontSize');

    // 헤더 테두리 색상
    this.addColorPickerSetting('헤더 테두리 색상', 'cardStyle.header.borderColor');

    // 헤더 테두리 두께
    this.addColorPickerSetting('헤더 테두리 두께', 'cardStyle.header.borderWidth');

    // 본문 스타일 섹션
    this.setName('본문 스타일');

    // 본문 배경색
    this.addColorPickerSetting('본문 배경색', 'cardStyle.body.background');

    // 본문 글꼴 크기
    this.addColorPickerSetting('본문 글꼴 크기', 'cardStyle.body.fontSize');

    // 본문 테두리 색상
    this.addColorPickerSetting('본문 테두리 색상', 'cardStyle.body.borderColor');

    // 본문 테두리 두께
    this.addColorPickerSetting('본문 테두리 두께', 'cardStyle.body.borderWidth');

    // 푸터 스타일 섹션
    this.setName('푸터 스타일');

    // 푸터 배경색
    this.addColorPickerSetting('푸터 배경색', 'cardStyle.footer.background');

    // 푸터 글꼴 크기
    this.addColorPickerSetting('푸터 글꼴 크기', 'cardStyle.footer.fontSize');

    // 푸터 테두리 색상
    this.addColorPickerSetting('푸터 테두리 색상', 'cardStyle.footer.borderColor');

    // 푸터 테두리 두께
    this.addColorPickerSetting('푸터 테두리 두께', 'cardStyle.footer.borderWidth');
  }
  
  /**
   * 스타일 섹션 추가
   */
  private addStyleSection(title: string, section: keyof ICardStyle): void {
    this.setName(title);
    this.addColorPickerSetting('배경색', `${section}.background`);
    this.addColorPickerSetting('테두리 색상', `${section}.borderColor`);
    this.addColorPickerSetting('테두리 두께', `${section}.borderWidth`);
  }
  
  /**
   * 토글 설정 추가
   */
  private addToggleSetting(name: string, path: string): this {
    return this.addToggle((toggle: ToggleComponent) => {
      toggle.setValue(this.plugin.getSetting<boolean>(path))
        .onChange(async (value: boolean) => {
          this.plugin.setSetting(path, value);
        });
    });
  }
  
  /**
   * 숫자 입력 설정 추가
   */
  private addNumberInput(name: string, path: string): this {
    return this.addText(text => {
      text.setValue(this.plugin.getSetting<number>(path).toString());
      text.onChange(async (value: string) => {
        this.plugin.setSetting(path, parseInt(value));
      });
    });
  }
  
  /**
   * 색상 선택 설정 추가
   */
  private addColorPickerSetting(name: string, path: string): this {
    return this.addColorPicker((color: ColorComponent) => {
      color.setValue(this.plugin.getSetting<string>(path))
        .onChange(async (value: string) => {
          this.plugin.setSetting(path, value);
        });
    });
  }
  
  /**
   * 속성 선택 설정 추가
   */
  private addPropertySelector(name: string, path: string): this {
    return this.addTextArea(text => {
      text.setValue(this.plugin.getSetting<string[]>(path).join(', '));
      text.onChange(async (value: string) => {
        this.plugin.setSetting(path, value.split(',').map(v => v.trim()));
      });
    });
  }
} 