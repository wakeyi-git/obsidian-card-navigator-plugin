import React, { ReactNode } from 'react';

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
      <div className="card-navigator-setting-control">
        {children}
      </div>
      {description && (
        <p className="card-navigator-setting-description">{description}</p>
      )}
    </div>
  );
};

export default SettingItem;