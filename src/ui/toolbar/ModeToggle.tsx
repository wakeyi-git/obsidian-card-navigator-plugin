import React from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { ModeType, CardSetType } from '../../domain/mode/Mode';
import './ModeToggle.css';

/**
 * ModeToggle 컴포넌트 속성
 */
interface ModeToggleProps {
  currentMode: ModeType;
  onModeChange: (mode: ModeType) => void;
  service: ICardNavigatorService | null;
}

/**
 * 모드 토글 컴포넌트
 * 폴더 모드와 태그 모드를 전환하는 버튼을 제공합니다.
 */
const ModeToggle: React.FC<ModeToggleProps> = ({ currentMode, onModeChange, service }) => {
  /**
   * 모드 토글 처리
   * 현재 모드에 따라 다음 모드로 전환합니다.
   */
  const handleModeToggle = () => {
    if (!service) return;
    
    // 다음 모드 결정
    let nextMode: ModeType;
    if (currentMode === 'folder') {
      nextMode = 'tag';
    } else if (currentMode === 'tag') {
      // 태그 모드에서는 검색 모드로 전환
      const searchService = service.getSearchService();
      if (searchService) {
        // 검색 모드로 전환 (빈 검색어로 시작)
        searchService.enterSearchMode('', 'filename', false);
        onModeChange('search');
        return;
      }
      nextMode = 'search';
    } else {
      // 검색 모드에서는 이전 모드로 복원
      const searchService = service.getSearchService();
      if (searchService) {
        // 검색 모드 종료 (이전 모드로 복원)
        searchService.exitSearchMode();
        
        // 이전 모드 가져오기
        const modeService = service.getModeService();
        const previousMode = modeService.getPreviousMode();
        onModeChange(previousMode);
        return;
      }
      nextMode = 'folder';
    }
    
    // 모드 변경
    service.changeMode(nextMode).then(() => {
      onModeChange(nextMode);
    });
  };
  
  /**
   * 모드 직접 선택 처리
   * 특정 모드로 직접 전환합니다.
   */
  const handleSelectMode = (mode: ModeType) => {
    if (mode === currentMode) return;
    if (!service) return;
    
    // 검색 모드로 전환 시
    if (mode === 'search') {
      const searchService = service.getSearchService();
      if (searchService) {
        // 현재 모드 상태 저장 후 검색 모드로 전환
        searchService.enterSearchMode('', 'filename', false);
        onModeChange('search');
        return;
      }
    }
    
    // 검색 모드에서 다른 모드로 전환 시
    if (currentMode === 'search') {
      const searchService = service.getSearchService();
      if (searchService) {
        // 검색 모드 종료
        searchService.exitSearchMode();
        
        // 선택한 모드가 이전 모드와 다른 경우 추가 전환
        if (mode !== service.getModeService().getPreviousMode()) {
          service.changeMode(mode).then(() => {
            onModeChange(mode);
          });
        } else {
          // 이전 모드로 자동 복원되므로 UI 업데이트만 수행
          onModeChange(mode);
        }
        return;
      }
    }
    
    // 일반적인 모드 전환
    service.changeMode(mode).then(() => {
      onModeChange(mode);
    });
  };
  
  /**
   * 현재 모드에 따른 표시 모드 가져오기
   */
  const getDisplayMode = (): ModeType => {
    return currentMode;
  };
  
  // 현재 표시 모드
  const displayMode = getDisplayMode();
  
  return (
    <div className="card-navigator-mode-toggle" onClick={handleModeToggle}>
      <div className="card-navigator-mode-icon">
        {displayMode === 'folder' && (
          <svg className="mode-icon folder-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path>
          </svg>
        )}
        {displayMode === 'tag' && (
          <svg className="mode-icon tag-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"></path>
          </svg>
        )}
        {displayMode === 'search' && (
          <svg className="mode-icon search-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
          </svg>
        )}
      </div>
    </div>
  );
};

export default ModeToggle; 