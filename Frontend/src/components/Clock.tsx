import React from 'react';

interface ClockProps {
  currentTime: Date;
}

const Clock: React.FC<ClockProps> = ({ currentTime }) => {
  return (
    <div className="clock">
      <div className="time">{currentTime.toLocaleTimeString()}</div>
      <div className="date">{currentTime.toLocaleDateString()}</div>
    </div>
  );
};

export default Clock;