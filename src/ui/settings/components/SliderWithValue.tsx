import React, { useState, useEffect } from 'react';
import './SliderWithValue.css';

interface SliderWithValueProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  label?: string;
}

/**
 * 값이 표시되는 슬라이더 컴포넌트
 */
const SliderWithValue: React.FC<SliderWithValueProps> = ({
  min,
  max,
  value,
  onChange,
  step = 1,
  label
}) => {
  const [currentValue, setCurrentValue] = useState<number>(value);
  
  // 외부에서 value가 변경되면 내부 상태도 업데이트
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);
  
  // 슬라이더 값 변경 핸들러
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setCurrentValue(newValue);
    onChange(newValue);
  };
  
  // 입력 필드 값 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = Number(e.target.value);
    
    // 최소값과 최대값 범위 내로 제한
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    
    setCurrentValue(newValue);
    onChange(newValue);
  };
  
  return (
    <div className="card-navigator-slider-with-value">
      {label && <span className="card-navigator-slider-label">{label}</span>}
      <div className="card-navigator-slider-container">
        <input
          type="range"
          min={min}
          max={max}
          value={currentValue}
          onChange={handleSliderChange}
          step={step}
          className="card-navigator-slider"
        />
        <input
          type="number"
          min={min}
          max={max}
          value={currentValue}
          onChange={handleInputChange}
          step={step}
          className="card-navigator-slider-value"
        />
      </div>
    </div>
  );
};

export default SliderWithValue; 