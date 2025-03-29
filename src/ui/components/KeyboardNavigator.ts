import { Card } from '@/domain/models/Card';
import { CardSet } from '@/domain/models/CardSet';
import { TFile } from 'obsidian';

/**
 * 키보드 내비게이터 클래스
 * 카드 간 키보드 내비게이션을 관리하는 클래스
 */
export class KeyboardNavigator {
  private _cardSet: CardSet | null = null;
  private _focusedCard: Card | null = null;
  private _isEnabled = false;
  private _app: any;

  // 이벤트 핸들러
  onFocusChange: ((card: Card | null) => void) | null = null;
  onCardOpen: ((card: Card) => void) | null = null;

  constructor(app: any) {
    this._app = app;
  }

  /**
   * 활성화 상태 반환
   */
  get isEnabled(): boolean {
    return this._isEnabled;
  }

  /**
   * 카드셋 설정
   */
  setCardSet(cardSet: CardSet): void {
    this._cardSet = cardSet;
    this._focusedCard = null;
  }

  /**
   * 활성화 상태 설정
   */
  setEnabled(enabled: boolean): void {
    this._isEnabled = enabled;
    if (!enabled) {
      this._focusedCard = null;
      if (this.onFocusChange) {
        this.onFocusChange(null);
      }
    }
  }

  /**
   * 포커스된 카드 설정
   */
  setFocusedCard(card: Card | null): void {
    if (!this._isEnabled) return;

    this._focusedCard = card;
    if (this.onFocusChange) {
      this.onFocusChange(card);
    }
  }

  /**
   * 활성 파일의 카드로 포커스
   */
  focusActiveFileCard(): void {
    if (!this._isEnabled || !this._cardSet) return;

    const activeFile = this._app.workspace.getActiveFile();
    if (!activeFile) return;

    const activeCard = this._cardSet.cards.find(card => card.filePath === activeFile.path);
    if (activeCard) {
      this.setFocusedCard(activeCard);
    }
  }

  /**
   * 키보드 이벤트 처리
   */
  handleKeyDown(event: KeyboardEvent): void {
    if (!this._isEnabled || !this._cardSet) return;

    switch (event.key) {
      case 'ArrowUp':
        this._navigateUp();
        break;
      case 'ArrowDown':
        this._navigateDown();
        break;
      case 'ArrowLeft':
        this._navigateLeft();
        break;
      case 'ArrowRight':
        this._navigateRight();
        break;
      case 'Home':
        this._navigateToFirst();
        break;
      case 'End':
        this._navigateToLast();
        break;
      case 'PageUp':
        this._navigatePageUp();
        break;
      case 'PageDown':
        this._navigatePageDown();
        break;
      case 'Enter':
        this._handleEnter();
        break;
      case 'Escape':
        this._handleEscape();
        break;
    }
  }

  /**
   * 위로 이동
   */
  private _navigateUp(): void {
    if (!this._cardSet) return;

    const currentIndex = this._focusedCard
      ? this._cardSet.cards.findIndex(c => c.id === this._focusedCard!.id)
      : -1;

    if (currentIndex > 0) {
      this.setFocusedCard(this._cardSet.cards[currentIndex - 1]);
    }
  }

  /**
   * 아래로 이동
   */
  private _navigateDown(): void {
    if (!this._cardSet) return;

    const currentIndex = this._focusedCard
      ? this._cardSet.cards.findIndex(c => c.id === this._focusedCard!.id)
      : -1;

    if (currentIndex < this._cardSet.cards.length - 1) {
      this.setFocusedCard(this._cardSet.cards[currentIndex + 1]);
    }
  }

  /**
   * 왼쪽으로 이동
   */
  private _navigateLeft(): void {
    if (!this._cardSet) return;

    const currentIndex = this._focusedCard
      ? this._cardSet.cards.findIndex(c => c.id === this._focusedCard!.id)
      : -1;

    const cardsPerRow = Math.floor(this._cardSet.layoutConfig.viewportWidth / this._cardSet.layoutConfig.minCardWidth);
    if (currentIndex >= cardsPerRow) {
      this.setFocusedCard(this._cardSet.cards[currentIndex - cardsPerRow]);
    }
  }

  /**
   * 오른쪽으로 이동
   */
  private _navigateRight(): void {
    if (!this._cardSet) return;

    const currentIndex = this._focusedCard
      ? this._cardSet.cards.findIndex(c => c.id === this._focusedCard!.id)
      : -1;

    const cardsPerRow = Math.floor(this._cardSet.layoutConfig.viewportWidth / this._cardSet.layoutConfig.minCardWidth);
    if (currentIndex < this._cardSet.cards.length - cardsPerRow) {
      this.setFocusedCard(this._cardSet.cards[currentIndex + cardsPerRow]);
    }
  }

  /**
   * 첫 번째 카드로 이동
   */
  private _navigateToFirst(): void {
    if (!this._cardSet || this._cardSet.cards.length === 0) return;
    this.setFocusedCard(this._cardSet.cards[0]);
  }

  /**
   * 마지막 카드로 이동
   */
  private _navigateToLast(): void {
    if (!this._cardSet || this._cardSet.cards.length === 0) return;
    this.setFocusedCard(this._cardSet.cards[this._cardSet.cards.length - 1]);
  }

  /**
   * 한 페이지 위로 이동
   */
  private _navigatePageUp(): void {
    if (!this._cardSet) return;

    const currentIndex = this._focusedCard
      ? this._cardSet.cards.findIndex(c => c.id === this._focusedCard!.id)
      : -1;

    const cardsPerPage = Math.floor(
      (this._cardSet.layoutConfig.viewportHeight / this._cardSet.layoutConfig.minCardHeight) *
      (this._cardSet.layoutConfig.viewportWidth / this._cardSet.layoutConfig.minCardWidth)
    );

    if (currentIndex >= cardsPerPage) {
      this.setFocusedCard(this._cardSet.cards[currentIndex - cardsPerPage]);
    }
  }

  /**
   * 한 페이지 아래로 이동
   */
  private _navigatePageDown(): void {
    if (!this._cardSet) return;

    const currentIndex = this._focusedCard
      ? this._cardSet.cards.findIndex(c => c.id === this._focusedCard!.id)
      : -1;

    const cardsPerPage = Math.floor(
      (this._cardSet.layoutConfig.viewportHeight / this._cardSet.layoutConfig.minCardHeight) *
      (this._cardSet.layoutConfig.viewportWidth / this._cardSet.layoutConfig.minCardWidth)
    );

    if (currentIndex < this._cardSet.cards.length - cardsPerPage) {
      this.setFocusedCard(this._cardSet.cards[currentIndex + cardsPerPage]);
    }
  }

  /**
   * 엔터 키 처리
   */
  private _handleEnter(): void {
    if (this._focusedCard && this.onCardOpen) {
      this.onCardOpen(this._focusedCard);
    }
  }

  /**
   * ESC 키 처리
   */
  private _handleEscape(): void {
    this.setEnabled(false);
  }
} 