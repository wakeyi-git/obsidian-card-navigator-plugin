import React from 'react';

/**
 * 모드 토글 컴포넌트 속성 인터페이스
 */
interface IModeToggleProps {
  currentMode: 'folder' | 'tag';
  onModeChange: (mode: 'folder' | 'tag') => void;
}

/**
 * 모드 토글 컴포넌트
 * 폴더 모드와 태그 모드 간 전환을 위한 토글 버튼을 제공합니다.
 */
const ModeToggle: React.FC<IModeToggleProps> = ({
  currentMode,
  onModeChange,
}) => {
  return (
    <div className="card-navigator-mode-toggle">
      <button
        className={`card-navigator-mode-button ${currentMode === 'folder' ? 'active' : ''}`}
        onClick={() => onModeChange('folder')}
        aria-label="폴더 모드"
      >
        폴더
      </button>
      <button
        className={`card-navigator-mode-button ${currentMode === 'tag' ? 'active' : ''}`}
        onClick={() => onModeChange('tag')}
        aria-label="태그 모드"
      >
        태그
      </button>
    </div>
  );
};

export default ModeToggle; 