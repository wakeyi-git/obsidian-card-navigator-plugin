import { DropdownComponent, Setting } from 'obsidian';

/**
 * 다중 선택 드롭다운 컴포넌트
 * 여러 옵션을 선택할 수 있는 드롭다운 컴포넌트입니다.
 */
export class MultiSelectDropdown {
  private containerEl: HTMLElement;
  private options: Record<string, string> = {};
  private selectedValues: string[] = [];
  private onChange: (values: string[]) => void;
  private displayEl: HTMLElement;
  private dropdownEl: HTMLElement;
  private isOpen: boolean = false;
  
  /**
   * 생성자
   * @param containerEl 컨테이너 요소
   * @param onChange 값 변경 시 호출될 콜백 함수
   */
  constructor(containerEl: HTMLElement, onChange: (values: string[]) => void) {
    this.containerEl = containerEl;
    this.onChange = onChange;
    
    // 드롭다운 컨테이너 생성
    const dropdownContainer = containerEl.createDiv({ cls: 'multi-select-dropdown-container' });
    
    // 선택된 값 표시 요소 생성
    this.displayEl = dropdownContainer.createDiv({ cls: 'multi-select-dropdown-display' });
    this.displayEl.addEventListener('click', () => this.toggleDropdown());
    
    // 드롭다운 요소 생성
    this.dropdownEl = dropdownContainer.createDiv({ cls: 'multi-select-dropdown-options' });
    this.dropdownEl.style.display = 'none';
    
    // 문서 클릭 시 드롭다운 닫기
    document.addEventListener('click', (e) => {
      if (!dropdownContainer.contains(e.target as Node)) {
        this.closeDropdown();
      }
    });
    
    // 스타일 추가
    this.addStyles();
  }
  
  /**
   * 옵션 추가
   * @param value 옵션 값
   * @param display 표시 텍스트
   * @returns 컴포넌트 인스턴스
   */
  addOption(value: string, display: string): this {
    this.options[value] = display;
    this.updateDropdown();
    return this;
  }
  
  /**
   * 옵션 추가 (여러 개)
   * @param options 옵션 객체 (키: 값, 값: 표시 텍스트)
   * @returns 컴포넌트 인스턴스
   */
  addOptions(options: Record<string, string>): this {
    this.options = { ...this.options, ...options };
    this.updateDropdown();
    return this;
  }
  
  /**
   * 선택된 값 설정
   * @param values 선택된 값 배열
   * @returns 컴포넌트 인스턴스
   */
  setValue(values: string[]): this {
    this.selectedValues = values.filter(value => this.options[value] !== undefined);
    this.updateDisplay();
    return this;
  }
  
  /**
   * 선택된 값 가져오기
   * @returns 선택된 값 배열
   */
  getValue(): string[] {
    return [...this.selectedValues];
  }
  
  /**
   * 드롭다운 업데이트
   */
  private updateDropdown(): void {
    this.dropdownEl.empty();
    
    // 옵션 요소 생성
    Object.entries(this.options).forEach(([value, display]) => {
      const optionEl = this.dropdownEl.createDiv({ cls: 'multi-select-dropdown-option' });
      
      // 체크박스 생성
      const checkbox = optionEl.createEl('input', { type: 'checkbox' });
      checkbox.checked = this.selectedValues.includes(value);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          if (!this.selectedValues.includes(value)) {
            this.selectedValues.push(value);
          }
        } else {
          this.selectedValues = this.selectedValues.filter(v => v !== value);
        }
        
        this.updateDisplay();
        this.onChange(this.selectedValues);
      });
      
      // 라벨 생성
      const label = optionEl.createSpan({ text: display });
      label.addEventListener('click', () => {
        checkbox.checked = !checkbox.checked;
        
        // 체인지 이벤트 발생
        const event = new Event('change');
        checkbox.dispatchEvent(event);
      });
    });
  }
  
  /**
   * 표시 요소 업데이트
   */
  private updateDisplay(): void {
    if (this.selectedValues.length === 0) {
      this.displayEl.setText('선택되지 않음');
      return;
    }
    
    const displayTexts = this.selectedValues.map(value => this.options[value]);
    this.displayEl.setText(displayTexts.join(', '));
  }
  
  /**
   * 드롭다운 토글
   */
  private toggleDropdown(): void {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }
  
  /**
   * 드롭다운 열기
   */
  private openDropdown(): void {
    this.dropdownEl.style.display = 'block';
    this.isOpen = true;
  }
  
  /**
   * 드롭다운 닫기
   */
  private closeDropdown(): void {
    this.dropdownEl.style.display = 'none';
    this.isOpen = false;
  }
  
  /**
   * 스타일 추가
   */
  private addStyles(): void {
    // 이미 스타일이 추가되어 있는지 확인
    if (document.getElementById('multi-select-dropdown-styles')) {
      return;
    }
    
    // 스타일 요소 생성
    const styleEl = document.createElement('style');
    styleEl.id = 'multi-select-dropdown-styles';
    
    // 스타일 정의
    styleEl.textContent = `
      .multi-select-dropdown-container {
        position: relative;
        width: 100%;
        min-width: 180px;
      }
      
      .multi-select-dropdown-display {
        padding: 8px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        background-color: var(--background-primary);
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-height: 20px;
      }
      
      .multi-select-dropdown-options {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        background-color: var(--background-primary);
        z-index: 100;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        min-width: 180px;
      }
      
      .multi-select-dropdown-option {
        padding: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .multi-select-dropdown-option:hover {
        background-color: var(--background-modifier-hover);
      }
      
      .setting-item-control {
        flex-grow: 0.7;
        justify-content: flex-end;
      }
    `;
    
    // 문서에 스타일 추가
    document.head.appendChild(styleEl);
  }
} 