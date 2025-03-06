import React from 'react';

interface IToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * 토글 스위치 컴포넌트
 */
const ToggleSwitch: React.FC<IToggleSwitchProps> = ({ id, checked, onChange }) => {
  return (
    <div className="card-navigator-toggle">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="card-navigator-toggle-slider"></span>
    </div>
  );
};

export default ToggleSwitch;