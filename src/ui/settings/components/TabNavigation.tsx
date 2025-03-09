import React from 'react';

interface ITabNavigationProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/**
 * 탭 네비게이션 컴포넌트
 * 설정 모달에서 탭을 전환하는 UI를 제공합니다.
 */
const TabNavigation: React.FC<ITabNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="card-navigator-modal-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`card-navigator-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;