import { App, Modal } from 'obsidian';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { MODAL_CLASS_NAMES } from '../../styles/components/modal.styles';

/**
 * 키보드 단축키 정보 인터페이스
 */
interface KeyboardShortcut {
  key: string;
  description: string;
  section: string;
}

/**
 * 키보드 도움말 모달 컴포넌트
 * 카드 네비게이터의 키보드 단축키 정보를 표시합니다.
 */
export class KeyboardHelpModal extends Modal {
  /**
   * 키보드 단축키 목록
   */
  private shortcuts: KeyboardShortcut[] = [];
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param shortcuts 키보드 단축키 목록
   */
  constructor(
    app: App,
    shortcuts: KeyboardShortcut[] = []
  ) {
    super(app);
    this.shortcuts = shortcuts;
    
    // 기본 단축키가 없는 경우 기본값 설정
    if (this.shortcuts.length === 0) {
      this.setDefaultShortcuts();
    }
  }
  
  /**
   * 기본 키보드 단축키를 설정합니다.
   */
  private setDefaultShortcuts(): void {
    this.shortcuts = [
      // 탐색 섹션
      { key: '↑/↓/←/→', description: '카드 탐색', section: '탐색' },
      { key: 'Home/End', description: '첫/마지막 카드로 이동', section: '탐색' },
      { key: 'Page Up/Down', description: '페이지 단위로 스크롤', section: '탐색' },
      
      // 선택 섹션
      { key: 'Enter', description: '선택한 카드 열기', section: '선택' },
      { key: 'Space', description: '카드 선택/선택 해제', section: '선택' },
      { key: 'Shift+화살표', description: '다중 카드 선택', section: '선택' },
      
      // 카드 작업 섹션
      { key: 'E', description: '선택한 카드 편집', section: '카드 작업' },
      { key: 'Delete', description: '선택한 카드 삭제', section: '카드 작업' },
      { key: 'D', description: '선택한 카드 복제', section: '카드 작업' },
      { key: 'C', description: '선택한 카드 링크 복사', section: '카드 작업' },
      
      // 검색 섹션
      { key: 'Ctrl/Cmd+F', description: '검색 시작', section: '검색' },
      { key: 'Esc', description: '검색 취소', section: '검색' },
      { key: 'Tab', description: '검색 필터 전환', section: '검색' },
      
      // 정렬 섹션
      { key: 'S', description: '정렬 기준 변경', section: '정렬' },
      { key: 'R', description: '정렬 방향 전환', section: '정렬' },
      
      // 기타 섹션
      { key: 'Shift+?', description: '이 도움말 표시', section: '기타' },
      { key: 'Esc', description: '모달 닫기', section: '기타' }
    ];
  }
  
  /**
   * 모달이 열릴 때 호출됩니다.
   */
  onOpen(): void {
    try {
      const { contentEl } = this;
      
      // 모달 제목
      contentEl.createEl('h2', { text: '키보드 단축키 도움말' });
      
      // 섹션별로 단축키 그룹화
      const sections = this.groupShortcutsBySection();
      
      // 각 섹션 렌더링
      for (const [section, shortcuts] of Object.entries(sections)) {
        // 섹션 제목
        contentEl.createEl('h3', { text: section, cls: MODAL_CLASS_NAMES.KEYBOARD.SECTION });
        
        // 단축키 테이블
        const table = contentEl.createEl('table', { cls: MODAL_CLASS_NAMES.KEYBOARD.TABLE });
        
        // 테이블 헤더
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        headerRow.createEl('th', { text: '키', cls: MODAL_CLASS_NAMES.KEYBOARD.KEY });
        headerRow.createEl('th', { text: '설명', cls: MODAL_CLASS_NAMES.KEYBOARD.DESCRIPTION });
        
        // 테이블 본문
        const tbody = table.createEl('tbody');
        
        // 각 단축키 행 추가
        shortcuts.forEach(shortcut => {
          const row = tbody.createEl('tr');
          row.createEl('td', { text: shortcut.key, cls: MODAL_CLASS_NAMES.KEYBOARD.KEY });
          row.createEl('td', { text: shortcut.description, cls: MODAL_CLASS_NAMES.KEYBOARD.DESCRIPTION });
        });
      }
      
      // 닫기 버튼
      const buttonContainer = contentEl.createDiv({ cls: MODAL_CLASS_NAMES.BUTTONS.CONTAINER });
      const closeButton = buttonContainer.createEl('button', {
        text: '닫기',
        cls: MODAL_CLASS_NAMES.BUTTONS.BUTTON
      });
      
      closeButton.addEventListener('click', () => {
        this.close();
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '키보드 도움말 모달을 열 때 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 단축키를 섹션별로 그룹화합니다.
   * @returns 섹션별로 그룹화된 단축키 객체
   */
  private groupShortcutsBySection(): Record<string, KeyboardShortcut[]> {
    try {
      const sections: Record<string, KeyboardShortcut[]> = {};
      
      this.shortcuts.forEach(shortcut => {
        if (!sections[shortcut.section]) {
          sections[shortcut.section] = [];
        }
        
        sections[shortcut.section].push(shortcut);
      });
      
      return sections;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '단축키를 섹션별로 그룹화하는 중 오류가 발생했습니다.',
        error
      );
      return {};
    }
  }
  
  /**
   * 모달이 닫힐 때 호출됩니다.
   */
  onClose(): void {
    try {
      const { contentEl } = this;
      contentEl.empty();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '키보드 도움말 모달을 닫을 때 오류가 발생했습니다.',
        error
      );
    }
  }
} 