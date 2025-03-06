import React from 'react';

interface ITabNavigationProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/**
 * 탭 네비게이션 컴포넌트
 */
const TabNavigation: React.FC<ITabNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="card-navigator-modal-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`card-navigator-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;