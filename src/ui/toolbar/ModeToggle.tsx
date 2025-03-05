import React, { useRef } from 'react';
import { ModeType } from '../../domain/mode/Mode';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { setIcon } from 'obsidian';
import './ModeToggle.css';

/**
 * 모드 토글 컴포넌트 속성
 */
interface ModeToggleProps {
  currentMode: ModeType;
  onModeChange: (mode: ModeType) => void;
  service: ICardNavigatorService | null;
}

/**
 * 모드 토글 컴포넌트
 */
const ModeToggle: React.FC<ModeToggleProps> = ({ currentMode, onModeChange, service }) => {
  // 모드 토글 처리 함수
  const handleModeToggle = () => {
    // 검색 모드인 경우 이전 모드로 전환
    if (currentMode === 'search' && service) {
      const modeService = service.getModeService();
      const previousMode = modeService.getPreviousMode();
      onModeChange(previousMode);
    } else {
      // 폴더/태그 모드 간 전환
      onModeChange(currentMode === 'folder' ? 'tag' : 'folder');
    }
  };

  // 현재 표시할 아이콘 결정
  const getDisplayMode = (): ModeType => {
    if (currentMode === 'search' && service) {
      const modeService = service.getModeService();
      return modeService.getPreviousMode();
    }
    return currentMode;
  };

  const displayMode = getDisplayMode();

  return (
    <button
      className="card-navigator-mode-toggle"
      onClick={handleModeToggle}
      aria-label={displayMode === 'folder' ? '태그 모드로 전환' : '폴더 모드로 전환'}
    >
      <span className="card-navigator-mode-icon" ref={el => {
        if (el) setIcon(el, displayMode === 'folder' ? 'card-navigator-folder' : 'card-navigator-tag');
      }}></span>
    </button>
  );
};

export default ModeToggle; 