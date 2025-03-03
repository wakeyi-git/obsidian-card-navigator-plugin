import React from 'react';

/**
 * 레이아웃 토글 컴포넌트 속성 인터페이스
 */
export interface ILayoutToggleProps {
  currentLayout: 'grid' | 'masonry';
  onLayoutChange: (layout: 'grid' | 'masonry') => void;
}

/**
 * 레이아웃 토글 컴포넌트
 * 그리드와 메이슨리 레이아웃 간 전환을 위한 토글 버튼을 제공합니다.
 */
const LayoutToggle: React.FC<ILayoutToggleProps> = ({
  currentLayout,
  onLayoutChange,
}) => {
  return (
    <div className="card-navigator-layout-toggle">
      <button
        className={`card-navigator-layout-button ${currentLayout === 'grid' ? 'active' : ''}`}
        onClick={() => onLayoutChange('grid')}
        aria-label="그리드 레이아웃"
        title="그리드 레이아웃"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>
      <button
        className={`card-navigator-layout-button ${currentLayout === 'masonry' ? 'active' : ''}`}
        onClick={() => onLayoutChange('masonry')}
        aria-label="메이슨리 레이아웃"
        title="메이슨리 레이아웃"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <rect x="3" y="3" width="7" height="10" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
          <rect x="14" y="13" width="7" height="8" rx="1" />
        </svg>
      </button>
    </div>
  );
};

export default LayoutToggle; 