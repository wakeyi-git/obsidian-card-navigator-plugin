import React, { forwardRef, useState, useEffect } from 'react';

interface DatePickerProps {
  position: { top: number; left: number };
  onSelect: (date: string) => void;
  type: 'start' | 'end';
  isRange: boolean;
}

/**
 * 날짜 선택기 컴포넌트
 * 날짜 검색을 위한 날짜 선택 컴포넌트
 */
const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  ({ position, onSelect, type, isRange }, ref) => {
    const [year, setYear] = useState<number>(() => new Date().getFullYear());
    const [month, setMonth] = useState<number>(() => new Date().getMonth());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    
    // 현재 월의 일 수 계산
    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };
    
    // 현재 월의 첫 날의 요일 계산 (0: 일요일, 1: 월요일, ...)
    const getFirstDayOfMonth = (year: number, month: number) => {
      return new Date(year, month, 1).getDay();
    };
    
    // 이전 달로 이동
    const handlePrevMonth = () => {
      if (month === 0) {
        setYear(year - 1);
        setMonth(11);
      } else {
        setMonth(month - 1);
      }
    };
    
    // 다음 달로 이동
    const handleNextMonth = () => {
      if (month === 11) {
        setYear(year + 1);
        setMonth(0);
      } else {
        setMonth(month + 1);
      }
    };
    
    // 날짜 선택 처리
    const handleDateSelect = (day: number) => {
      const date = new Date(year, month, day);
      setSelectedDate(date);
      
      // YYYY-MM-DD 형식으로 변환
      const formattedDate = formatDate(date);
      onSelect(formattedDate);
    };
    
    // 날짜를 YYYY-MM-DD 형식으로 변환
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // 달력 생성
    const renderCalendar = () => {
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      
      // 달력 행 생성
      const rows = [];
      let cells = [];
      
      // 이전 달의 날짜 채우기
      const prevMonthDays = month === 0 ? 
        getDaysInMonth(year - 1, 11) : 
        getDaysInMonth(year, month - 1);
      
      for (let i = 0; i < firstDay; i++) {
        const day = prevMonthDays - firstDay + i + 1;
        cells.push(
          <td key={`prev-${day}`} className="card-navigator-date-picker-day prev-month">
            {day}
          </td>
        );
      }
      
      // 현재 달의 날짜 채우기
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = isDateToday(date);
        const isSelected = isDateSelected(date);
        
        cells.push(
          <td 
            key={`current-${day}`} 
            className={`card-navigator-date-picker-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => handleDateSelect(day)}
          >
            {day}
          </td>
        );
        
        // 7일마다 새로운 행 시작
        if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
          // 마지막 행이고 다음 달의 날짜로 채워야 하는 경우
          if (day === daysInMonth && (firstDay + day) % 7 !== 0) {
            const remainingCells = 7 - ((firstDay + day) % 7);
            for (let i = 1; i <= remainingCells; i++) {
              cells.push(
                <td key={`next-${i}`} className="card-navigator-date-picker-day next-month">
                  {i}
                </td>
              );
            }
          }
          
          rows.push(<tr key={`row-${day}`}>{cells}</tr>);
          cells = [];
        }
      }
      
      return rows;
    };
    
    // 오늘 날짜인지 확인
    const isDateToday = (date: Date) => {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    };
    
    // 선택된 날짜인지 확인
    const isDateSelected = (date: Date) => {
      if (!selectedDate) return false;
      
      return (
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      );
    };
    
    // 월 이름 배열
    const monthNames = [
      '1월', '2월', '3월', '4월', '5월', '6월',
      '7월', '8월', '9월', '10월', '11월', '12월'
    ];
    
    // 요일 이름 배열
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    
    return (
      <div 
        className="card-navigator-date-picker" 
        ref={ref}
        style={{ 
          top: position.top, 
          left: position.left 
        }}
      >
        <div className="card-navigator-date-picker-header">
          <div className="card-navigator-date-picker-title">
            {type === 'start' ? '시작 날짜 선택' : '종료 날짜 선택'}
          </div>
          <div className="card-navigator-date-picker-nav">
            <button 
              className="card-navigator-date-picker-nav-btn"
              onClick={handlePrevMonth}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <div className="card-navigator-date-picker-month-year">
              {monthNames[month]} {year}
            </div>
            <button 
              className="card-navigator-date-picker-nav-btn"
              onClick={handleNextMonth}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
        <table className="card-navigator-date-picker-calendar">
          <thead>
            <tr>
              {dayNames.map(day => (
                <th key={day} className="card-navigator-date-picker-weekday">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderCalendar()}
          </tbody>
        </table>
        <div className="card-navigator-date-picker-footer">
          <button 
            className="card-navigator-date-picker-today-btn"
            onClick={() => handleDateSelect(new Date().getDate())}
          >
            오늘
          </button>
          {isRange && type === 'start' && (
            <div className="card-navigator-date-picker-range-info">
              종료 날짜도 선택해주세요
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default DatePicker; 