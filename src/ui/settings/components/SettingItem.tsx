import React, { ReactNode } from 'react';
import './SettingItem.css';

interface ISettingItemProps {
  label: string;
  description?: string;
  children: ReactNode;
}

/**
 * 설정 항목 컴포넌트
 */
const SettingItem: React.FC<ISettingItemProps> = ({ label, description, children }) => {
  return (
    <div className="card-navigator-setting-item">
      <label>{label}</label>
      {description && (
        <p className="card-navigator-setting-description">{description}</p>
      )}
      <div className="card-navigator-setting-control">
        {children}
      </div>
    </div>
  );
};

export default SettingItem;