import React from 'react';
import { ModeType } from '../../domain/mode/Mode';
import { ICardNavigatorService } from '../../application/CardNavigatorService';

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
    <div
      className="clickable-icon card-navigator-mode-toggle"
      onClick={handleModeToggle}
      aria-label={displayMode === 'folder' ? '태그 모드로 전환' : '폴더 모드로 전환'}
      title={displayMode === 'folder' ? '태그 모드로 전환' : '폴더 모드로 전환'}
    >
      {displayMode === 'folder' ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-folder">
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-tag">
          <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
          <path d="M7 7h.01"></path>
        </svg>
      )}
    </div>
  );
};

export default ModeToggle; 