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
      // 이전 모드 상태 복원
      modeService.restorePreviousModeState();
      // UI 업데이트를 위해 onModeChange 호출
      onModeChange(modeService.getPreviousMode());
    } else {
      // 폴더/태그 모드 간 전환
      const newMode = currentMode === 'folder' ? 'tag' : 'folder';
      onModeChange(newMode);
      
      // 모드 전환 시 시각적 피드백 제공
      if (service) {
        const element = document.querySelector('.card-navigator-mode-toggle');
        if (element) {
          element.classList.add('card-navigator-mode-changed');
          setTimeout(() => {
            element.classList.remove('card-navigator-mode-changed');
          }, 500);
        }
      }
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
      className="clickable-icon card-navigator-icon card-navigator-mode-toggle"
      onClick={handleModeToggle}
      aria-label={displayMode === 'folder' ? '태그 모드로 전환' : '폴더 모드로 전환'}
      title={displayMode === 'folder' ? '태그 모드로 전환' : '폴더 모드로 전환'}
    >
      {displayMode === 'folder' ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder">
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tags">
          <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/>
          <path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z"/>
          <circle cx="6.5" cy="9.5" r=".5" fill="currentColor"/>
        </svg>
      )}
    </div>
  );
};

export default ModeToggle; 