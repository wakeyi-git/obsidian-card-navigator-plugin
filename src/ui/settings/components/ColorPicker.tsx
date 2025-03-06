import React, { useState } from 'react';

interface IColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

/**
 * 색상 선택 컴포넌트
 */
const ColorPicker: React.FC<IColorPickerProps> = ({ color, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // 미리 정의된 색상 팔레트
  const presetColors = [
    '#ffffff', '#f5f5f5', '#e0e0e0', '#d0d0d0',
    '#ffcdd2', '#f8bbd0', '#e1bee7', '#d1c4e9',
    '#c5cae9', '#bbdefb', '#b3e5fc', '#b2ebf2',
    '#b2dfdb', '#c8e6c9', '#dcedc8', '#f0f4c3',
    '#fff9c4', '#ffecb3', '#ffe0b2', '#ffccbc'
  ];
  
  return (
    <div className="card-navigator-color-picker">
      {label && <span className="card-navigator-color-picker-label">{label}</span>}
      
      <div className="card-navigator-color-picker-input">
        <div 
          className="card-navigator-color-swatch"
          style={{ backgroundColor: color }}
          onClick={() => setIsOpen(!isOpen)}
        />
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      
      {isOpen && (
        <div className="card-navigator-color-palette">
          {presetColors.map((presetColor, index) => (
            <div
              key={index}
              className={`card-navigator-color-preset ${presetColor === color ? 'active' : ''}`}
              style={{ backgroundColor: presetColor }}
              onClick={() => {
                onChange(presetColor);
                setIsOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPicker;