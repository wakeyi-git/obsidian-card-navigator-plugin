import React from 'react';
import { ModeType } from '../../domain/mode/Mode';

/**
 * 모드 토글 컴포넌트 속성 인터페이스
 */
export interface IModeToggleProps {
  onModeChange: (mode: ModeType) => void;
  currentMode: ModeType;
}

/**
 * 모드 토글 컴포넌트
 * 폴더 모드와 태그 모드 간 전환을 위한 컴포넌트입니다.
 */
const ModeToggle: React.FC<IModeToggleProps> = ({ onModeChange, currentMode }) => {
  return (
    <div className="mode-toggle">
      <button
        className={`mode-button ${currentMode === 'folder' ? 'active' : ''}`}
        onClick={() => onModeChange('folder')}
      >
        폴더 모드
      </button>
      <button
        className={`mode-button ${currentMode === 'tag' ? 'active' : ''}`}
        onClick={() => onModeChange('tag')}
      >
        태그 모드
      </button>
      <button
        className={`mode-button ${currentMode === 'search' ? 'active' : ''}`}
        onClick={() => onModeChange('search')}
      >
        검색 모드
      </button>
    </div>
  );
};

export default ModeToggle; 